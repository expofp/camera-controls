import type * as _THREE from 'three';
import { CameraControls, getInstalledTHREE } from './CameraControls';
import { DEG2RAD } from './utils/math-utils';

export class MapControls extends CameraControls {

	dollyToCursorGrazeAngle = { min: 15 * DEG2RAD, max: 35 * DEG2RAD };

	protected _targetPlaneNormal: _THREE.Vector3;
	protected _targetPlaneConstant = 0;

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

	getTargetPlaneConstant(): number {

		return this._targetPlaneConstant;

	}

}

export default MapControls;
