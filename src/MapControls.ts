import type * as _THREE from 'three';
import { CameraControls, getInstalledTHREE } from './CameraControls';
import { clamp, approxZero, DEG2RAD } from './utils/math-utils';
import { intersectRayPlane } from './utils/plane-utils';
import { ACTION, DOLLY_DIRECTION, isPerspectiveCamera, isOrthographicCamera, type MouseButtons } from './types';

type NoTruckMouseAction = Exclude<MouseButtons[ 'left' ], typeof ACTION.TRUCK>;
export interface MapMouseButtons extends MouseButtons {
	left: NoTruckMouseAction;
	middle: NoTruckMouseAction;
	right: NoTruckMouseAction;
	wheel: NoTruckMouseAction;
}

// Tolerance for "the ray is parallel to the plane" tests (dot of two unit vectors).
const GRAZE_EPSILON = 1e-7;

export class MapControls extends CameraControls {

	/**
	 * How far (as a fraction of the screen, toward the center) the cursor anchor
	 * is pulled back from the horizon when dollying-to-cursor near a grazing angle.
	 * Larger = trucking starts at a steeper angle and glides gentler; smaller =
	 * anchoring stays exact closer to the horizon and glides faster. Mapbox's
	 * `_horizonShift`.
	 */
	dollyToCursorHorizonShift = 0.1;

	// This narrowed type steers TS callers away from assigning `ACTION.TRUCK`, but it's
	// only a compile-time nudge: the base constructor still sets `right = ACTION.TRUCK`
	// at runtime by default. The actual in-plane guarantee comes from the runtime
	// `_truckInternal` coercion, which forces screen-space panning regardless of type.
	declare mouseButtons: MapMouseButtons;

	protected _targetPlaneNormal: _THREE.Vector3;
	protected _targetPlaneConstant = 0;
	protected _warnedTruck = false;

	// Scratch vectors for the cursor-anchored dolly/zoom math, reused every notch to
	// avoid per-frame allocation. Constructed in the constructor, after install has run.
	// Each holds one live value at a time during a single computation:
	/** Working copy of `_targetPlaneNormal` for the current computation. */
	protected _normal: _THREE.Vector3;
	/** END-state camera position `C` (recomputed from `_sphericalEnd` + `_targetEnd`). */
	protected _endCamera: _THREE.Vector3;
	/** Camera forward basis `f = normalize( _targetEnd − C )`. */
	protected _forward: _THREE.Vector3;
	/** Camera right basis (column 0 of the camera world matrix). */
	protected _right: _THREE.Vector3;
	/** Camera up basis (column 1 of the camera world matrix). */
	protected _up: _THREE.Vector3;
	/** Cursor ray direction `u` in world space (perspective). */
	protected _cursorDir: _THREE.Vector3;
	/** Camera position after the dolly move `C' = C + m·u` (perspective). */
	protected _movedCamera: _THREE.Vector3;
	/** World-space origin of the cursor ray at mid-frustum (orthographic). */
	protected _rayOrigin: _THREE.Vector3;
	/** World anchor point `A` under the cursor (orthographic). */
	protected _anchor: _THREE.Vector3;
	/** Recomputed END-state target `T'`. */
	protected _newTarget: _THREE.Vector3;

	constructor( camera: _THREE.PerspectiveCamera | _THREE.OrthographicCamera, domElement?: HTMLElement ) {

		super( camera, domElement );

		const THREE = getInstalledTHREE();
		this._targetPlaneNormal = new THREE.Vector3();
		this._normal = new THREE.Vector3();
		this._endCamera = new THREE.Vector3();
		this._forward = new THREE.Vector3();
		this._right = new THREE.Vector3();
		this._up = new THREE.Vector3();
		this._cursorDir = new THREE.Vector3();
		this._movedCamera = new THREE.Vector3();
		this._rayOrigin = new THREE.Vector3();
		this._anchor = new THREE.Vector3();
		this._newTarget = new THREE.Vector3();

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

		// Mapbox-style EXACT cursor anchoring for perspective dolly-to-cursor.
		// Computed at input time on the END state so successive wheel notches compose
		// exactly. Delegates to the base for the non-cursor / infinityDolly / ortho cases.
		const baseDollyInternal = this._dollyInternal;
		this._dollyInternal = ( delta: number, x: number, y: number ): void => {

			const camera = this._camera;

			if ( this.dollyToCursor && ! this.infinityDolly && isPerspectiveCamera( camera ) ) {

				const dollyScale = Math.pow( 0.95, - delta * this.dollySpeed );
				const radius = this._sphericalEnd.radius;
				const k = clamp( radius * dollyScale, this.minDistance, this.maxDistance ) / radius;

				this._updateTargetPlaneNormal();
				const n = this._normal.copy( this._targetPlaneNormal );
				const planeConstant = this._targetPlaneConstant;

				// END camera position (a dolly does not change orientation).
				const C = this._endCamera
					.setFromSpherical( this._sphericalEnd )
					.applyQuaternion( this._yAxisUpSpaceInverse )
					.add( this._targetEnd );

				// Orientation basis for the END state. A dolly-to-cursor moves the target,
				// so mid-ease the live orbit camera re-aims at the lagging `_target` and its
				// matrix columns rotate away from the END orientation. Rebuild the basis from
				// the END forward `f` + camera up hint (three.js lookAt convention) so the
				// cursor ray is end-consistent whether notches fire fast or slow.
				const f = this._forward.subVectors( this._targetEnd, C ).normalize();
				const right = this._right.crossVectors( f, camera.up );
				// Degenerate: camera looking along its up axis → stable fallback right.
				if ( right.lengthSq() < GRAZE_EPSILON ) right.setFromMatrixColumn( camera.matrixWorld, 0 );
				right.normalize();
				const up = this._up.crossVectors( right, f ).normalize();

				const tanY = Math.tan( camera.getEffectiveFOV() * DEG2RAD * 0.5 );
				const tanX = tanY * camera.aspect;

				// Horizon clamp: bound the grazing / sky case, keep horizontal bearing.
				let ndcY = y;
				const upDotN = up.dot( n );
				if ( ! approxZero( upDotN ) ) {

					const yHorizon = - f.dot( n ) / ( tanY * upDotN );
					if ( yHorizon > 0 ) ndcY = Math.min( ndcY, yHorizon * ( 1 - this.dollyToCursorHorizonShift ) );

				}

				// Cursor ray direction `u` from the (possibly clamped) NDC.
				const u = this._cursorDir.copy( f )
					.addScaledVector( right, x * tanX )
					.addScaledVector( up, ndcY * tanY )
					.normalize();

				// Force the ray to point into the plane if it still grazes / rises.
				let uDotN = u.dot( n );
				if ( uDotN > - GRAZE_EPSILON ) {

					u.addScaledVector( n, - GRAZE_EPSILON - uDotN ).normalize();
					uDotN = u.dot( n );

				}

				// Anchor distance along `u` (t > 0, in front of the camera).
				const t = intersectRayPlane(
					C.x, C.y, C.z,
					u.x, u.y, u.z,
					n.x, n.y, n.z, planeConstant,
				);

				if ( t !== null && t > 0 ) {

					// Move the camera toward the anchor by m = t·(1 − k): the anchor stays
					// exactly on the cursor ray from C' ( A − C' = t·k·u ).
					const m = t * ( 1 - k );
					const movedCamera = this._movedCamera.copy( C ).addScaledVector( u, m );

					// Re-derive the target on the plane, orientation fixed.
					const forwardDotN = f.dot( n );
					const tf = ( planeConstant - movedCamera.dot( n ) ) / forwardDotN;
					const newTarget = this._newTarget.copy( movedCamera ).addScaledVector( f, tf );
					this._boundary.clampPoint( newTarget, newTarget );

					// Commit the END state only; easing follows toward it.
					this._dollyToNoClamp( clamp( tf, this.minDistance, this.maxDistance ), true );
					this._targetEnd.copy( newTarget );

				} else {

					// Degenerate (camera not above the plane) → plain dolly, no anchor shift.
					this._dollyToNoClamp( clamp( radius * dollyScale, this.minDistance, this.maxDistance ), true );

				}

				this._lastDollyDirection = Math.sign( - delta ) as DOLLY_DIRECTION;
				this._needsUpdate = true;
				return;

			}

			baseDollyInternal( delta, x, y );

		};

		// Mapbox-style EXACT cursor anchoring for orthographic zoom-to-cursor:
		// scale the target toward the anchor. Delegates to base otherwise.
		const baseZoomInternal = this._zoomInternal;
		this._zoomInternal = ( delta: number, x: number, y: number ): void => {

			const camera = this._camera;

			if ( this.dollyToCursor && ! this.infinityDolly && isOrthographicCamera( camera ) ) {

				const zoomScale = Math.pow( 0.95, delta * this.dollySpeed );
				const z0 = this._zoomEnd;
				const z1 = clamp( z0 * zoomScale, this.minZoom, this.maxZoom );

				this._updateTargetPlaneNormal();
				const n = this._normal.copy( this._targetPlaneNormal );
				const planeConstant = this._targetPlaneConstant;

				const C = this._endCamera
					.setFromSpherical( this._sphericalEnd )
					.applyQuaternion( this._yAxisUpSpaceInverse )
					.add( this._targetEnd );
				// END-consistent orientation basis (see `_dollyInternal` for why the live
				// camera matrix would drift during rapid notches).
				const f = this._forward.subVectors( this._targetEnd, C ).normalize();
				const right = this._right.crossVectors( f, camera.up );
				if ( right.lengthSq() < GRAZE_EPSILON ) right.setFromMatrixColumn( camera.matrixWorld, 0 );
				right.normalize();
				const up = this._up.crossVectors( right, f ).normalize();

				// Every ortho ray is parallel to `f`; whole-view grazing → zoom only.
				const forwardDotN = f.dot( n );
				if ( forwardDotN > - GRAZE_EPSILON ) {

					this.zoomTo( z1, true );
					return;

				}

				// Cursor ray origin at the END zoom (mid-frustum), direction `f`.
				const centerX = ( camera.right + camera.left ) * 0.5;
				const centerY = ( camera.top + camera.bottom ) * 0.5;
				const halfW = ( camera.right - camera.left ) * 0.5 / z0;
				const halfH = ( camera.top - camera.bottom ) * 0.5 / z0;
				const origin = this._rayOrigin.copy( C )
					.addScaledVector( right, centerX + x * halfW )
					.addScaledVector( up, centerY + y * halfH );

				const t = intersectRayPlane(
					origin.x, origin.y, origin.z,
					f.x, f.y, f.z,
					n.x, n.y, n.z, planeConstant,
				);

				if ( t !== null ) {

					const anchor = this._anchor.copy( origin ).addScaledVector( f, t );
					// Exact scale-toward-anchor: T' = T + (1 − Z0/Z1)·(A − T).
					const s = 1 - z0 / z1;
					const newTarget = this._newTarget.copy( this._targetEnd ).lerp( anchor, s );
					this._boundary.clampPoint( newTarget, newTarget );

					this.zoomTo( z1, true );
					this._targetEnd.copy( newTarget );
					this._needsUpdate = true;
					return;

				}

				this.zoomTo( z1, true );
				return;

			}

			baseZoomInternal( delta, x, y );

		};

	}

	protected _updateTargetPlaneNormal(): void {

		this._targetPlaneNormal.copy( this._camera.up ).normalize();

	}

	/**
	 * Move the constraint plane to the given signed height along the current
	 * up axis ( plane = { p : dot( p, up ) = height } ).
	 */
	setTargetPlane( height: number ): void {

		this._targetPlaneConstant = height;

	}

	/**
	 * The signed height of the target plane along the up axis.
	 */
	getTargetPlane(): number {

		return this._targetPlaneConstant;

	}

}

export default MapControls;
