import type * as _THREE from 'three';
import { CameraControls, getInstalledTHREE } from './CameraControls';
import { approxZero, DEG2RAD } from './utils/math-utils';
import { intersectRayPlane, grazeWeight } from './utils/plane-utils';
import { ACTION, isPerspectiveCamera, isOrthographicCamera, type MouseButtons } from './types';

type NoTruckMouseAction = Exclude<MouseButtons[ 'left' ], typeof ACTION.TRUCK>;
export interface MapMouseButtons extends MouseButtons {
	left: NoTruckMouseAction;
	middle: NoTruckMouseAction;
	right: NoTruckMouseAction;
	wheel: NoTruckMouseAction;
}

export class MapControls extends CameraControls {

	dollyToCursorGrazeAngle = { min: 15 * DEG2RAD, max: 35 * DEG2RAD };

	declare mouseButtons: MapMouseButtons;

	protected _targetPlaneNormal: _THREE.Vector3;
	protected _targetPlaneConstant = 0;
	protected _warnedTruck = false;

	// Scratch vectors for the cursor-anchored dolly/zoom math (Tasks 6-7), reused every
	// frame to avoid per-frame allocation. Constructed in the constructor, after install
	// has run. Each has a fixed role in that computation:
	/** Working copy of `_targetPlaneNormal` for the current computation. */
	protected _normal: _THREE.Vector3;
	/** World-space origin of the cursor ray (camera position, or the ortho unprojected NDC point). */
	protected _origin: _THREE.Vector3;
	/** World-space direction of the cursor ray. */
	protected _dir: _THREE.Vector3;
	/** Point where the cursor ray intersects the constraint plane. */
	protected _hit: _THREE.Vector3;
	/** Cursor ray direction projected onto the plane (component of `_dir` orthogonal to `_normal`); the pan direction. */
	protected _horiz: _THREE.Vector3;
	/** Target delta that anchors the on-plane hit point under the cursor. */
	protected _anchored: _THREE.Vector3;
	/** Fallback pan delta (in-plane, toward the cursor, scaled by the dolly/zoom step) used when anchoring grazes the plane. */
	protected _pan: _THREE.Vector3;
	/** Blend of `_pan` and `_anchored` by the grazing weight - the delta actually applied to the target. */
	protected _delta: _THREE.Vector3;
	/** Target-end position after applying `_delta`, re-projecting onto the plane, and clamping to the boundary. */
	protected _newTarget: _THREE.Vector3;
	/** Actual change applied to `_target` (`_newTarget` minus the previous `_targetEnd`) after boundary clamping. */
	protected _diff: _THREE.Vector3;

	constructor( camera: _THREE.PerspectiveCamera | _THREE.OrthographicCamera, domElement?: HTMLElement ) {

		super( camera, domElement );

		const THREE = getInstalledTHREE();
		this._targetPlaneNormal = new THREE.Vector3();
		this._normal = new THREE.Vector3();
		this._origin = new THREE.Vector3();
		this._dir = new THREE.Vector3();
		this._hit = new THREE.Vector3();
		this._horiz = new THREE.Vector3();
		this._anchored = new THREE.Vector3();
		this._pan = new THREE.Vector3();
		this._delta = new THREE.Vector3();
		this._newTarget = new THREE.Vector3();
		this._diff = new THREE.Vector3();

		// default plane: horizontal, through the initial target
		this._updateTargetPlaneNormal();
		this._targetPlaneConstant = this._targetEnd.dot( this._targetPlaneNormal );

		const baseTruckInternal = this._truckInternal;
		this._truckInternal = ( deltaX: number, deltaY: number, dragToOffset: boolean, screenSpacePanning: boolean ): void => {

			// OFFSET (focal-offset) is not a pan — leave it untouched.
			if ( ! dragToOffset && ! screenSpacePanning ) {

				if ( ! this._warnedTruck ) {

					console.warn( 'MapControls: TRUCK panning drifts the target off the plane; coercing to SCREEN_PAN. Bind SCREEN_PAN instead of TRUCK.' );
					this._warnedTruck = true;

				}

				screenSpacePanning = true;

			}

			baseTruckInternal( deltaX, deltaY, dragToOffset, screenSpacePanning );

		};

	}

	protected _updateTargetPlaneNormal(): void {

		this._targetPlaneNormal.copy( this._camera.up ).normalize();

	}

	protected override _computeDollyToCursorTarget(): void {

		// infinityDolly + plane confinement is out of scope for v1.
		if ( this.infinityDolly ) {

			super._computeDollyToCursorTarget();
			return;

		}

		const camera = this._camera;

		if ( isPerspectiveCamera( camera ) && this._changedDolly !== 0 ) {

			this._updateTargetPlaneNormal();
			const n = this._normal.copy( this._targetPlaneNormal );
			const planeConstant = this._targetPlaneConstant;

			const dollyControlAmount = this._spherical.radius - this._lastDistance;
			const radius = this._sphericalEnd.radius;
			const prevRadius = radius - dollyControlAmount;
			const lerpRatio = ( prevRadius - radius ) / radius; // = - Δr / radius

			// cursor ray in world space from NDC
			const origin = this._origin.setFromMatrixPosition( camera.matrixWorld );
			const dir = this._dir
				.set( this._dollyControlCoord.x, this._dollyControlCoord.y, 0.5 )
				.unproject( camera )
				.sub( origin )
				.normalize();

			const dirDotN = dir.dot( n );
			let w = grazeWeight( dirDotN, this.dollyToCursorGrazeAngle.min, this.dollyToCursorGrazeAngle.max );

			// anchored delta: slide the target toward the on-plane point under the cursor
			const anchored = this._anchored.set( 0, 0, 0 );
			const t = intersectRayPlane(
				origin.x, origin.y, origin.z,
				dir.x, dir.y, dir.z,
				n.x, n.y, n.z, planeConstant,
			);
			if ( w > 0 && t !== null && t > 0 ) {

				const hit = this._hit.copy( origin ).addScaledVector( dir, t );
				anchored.subVectors( hit, this._targetEnd ).multiplyScalar( lerpRatio );

			} else {

				w = 0; // no valid hit → pure pan fallback

			}

			// pan fallback: in-plane direction toward the cursor, scaled by the dolly step
			const horiz = this._horiz.copy( dir ).addScaledVector( n, - dirDotN );
			if ( horiz.lengthSq() > 0 ) horiz.normalize();
			const pan = this._pan.copy( horiz ).multiplyScalar( - dollyControlAmount );

			// blend pan → anchored by grazing weight, apply, re-project onto plane
			const delta = this._delta.copy( pan ).lerp( anchored, w );
			const newTargetEnd = this._newTarget.copy( this._targetEnd ).add( delta );
			newTargetEnd.addScaledVector( n, planeConstant - newTargetEnd.dot( n ) );
			this._boundary.clampPoint( newTargetEnd, newTargetEnd );

			const diff = this._diff.subVectors( newTargetEnd, this._targetEnd );
			this._targetEnd.copy( newTargetEnd );
			this._target.add( diff );

			this._changedDolly -= dollyControlAmount;
			if ( approxZero( this._changedDolly ) ) this._changedDolly = 0;

		} else if ( isOrthographicCamera( camera ) && this._changedZoom !== 0 ) {

			super._computeDollyToCursorTarget(); // ortho handled in Task 7

		}

	}

	/**
	 * Move the constraint plane to the given signed height along the current
	 * up axis ( plane = { p : dot( p, up ) = height } ).
	 */
	setTargetPlane( height: number ): void {

		this._targetPlaneConstant = height;

	}

	getTargetPlaneConstant(): number {

		return this._targetPlaneConstant;

	}

}

export default MapControls;
