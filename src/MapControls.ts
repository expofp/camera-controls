import type * as _THREE from 'three';
import { CameraControls, getInstalledTHREE } from './CameraControls';
import { clamp, DEG2RAD } from './utils/math-utils';
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

// Mirrors CameraControls' own platform check (not exported): the wheel handler normalizes
// `event.deltaY` by `deltaYFactor = isMac ? -1 : -3`, which the sky-truck inverts to recover
// the raw wheel pixels per-platform.
const isMac = /Mac/.test( globalThis?.navigator?.platform );

// Hermite smoothstep: 0 at/below `lo`, 1 at/above `hi`, smooth in between.
function smoothstep( lo: number, hi: number, x: number ): number {

	if ( lo === hi ) return x < lo ? 0 : 1;
	const t = clamp( ( x - lo ) / ( hi - lo ), 0, 1 );
	return t * t * ( 3 - 2 * t );

}

/**
 * Map-style controls: dolly/zoom-to-cursor anchors the world point under the cursor and
 * pans stay confined to a target plane. This assumes the camera stays ABOVE the plane, so
 * keep `maxPolarAngle` below 90° (e.g. 85°): at exactly 90° the forward axis is parallel to
 * the plane and dolly-to-cursor falls back to a plain dolly (the `f·n` guard prevents NaN).
 */
export class MapControls extends CameraControls {

	/**
	 * Grazing angle (radians) at which dolly-to-cursor (perspective) / zoom-to-cursor
	 * (orthographic) hands off from EXACT anchoring to a sky-truck. Anchoring is exact
	 * wherever the cursor ray meets the ground more steeply than this angle. Within a thin
	 * band just above it — `[sin(0.5·angle), sin(angle)]` in the ray's grazing measure — the
	 * anchor blends smoothly into a screen-pan along the cursor's ground bearing; above it
	 * (the sky) it is a pure pan. Keep it small (a couple of degrees at the horizon):
	 * widening it erodes the exact region below. The sky-pan SPEED is governed by
	 * `truckSpeed` (it feels like a wheel-pan), not by this angle.
	 */
	dollyToCursorHorizonAngle = 6 * DEG2RAD;

	// This narrowed type steers TS callers away from assigning `ACTION.TRUCK`, but it's
	// only a compile-time nudge: the base constructor still sets `right = ACTION.TRUCK`
	// at runtime by default. The actual in-plane guarantee comes from the runtime
	// `_truckInternal` coercion, which forces screen-space panning regardless of type.
	declare mouseButtons: MapMouseButtons;

	protected _targetPlaneNormal: _THREE.Vector3;
	protected _targetPlaneConstant = 0;
	protected _warnedTruck = false;

	/**
	 * True while `_targetEnd` was last moved BY dolly/zoom-to-cursor rather than by a pan.
	 * Gates `_getTargetSmoothTime` onto the dolly/zoom clock; see it for why.
	 */
	protected _targetFollowsDolly = false;

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
	/** In-plane unit bearing of the cursor ray toward the ground (the sky-truck direction). */
	protected _bearing: _THREE.Vector3;
	/** Sky-truck target-shift vector (screen-pan along `_bearing`). */
	protected _truckShift: _THREE.Vector3;
	/** Exact-anchor target-shift vector (moves the target to pin the cursor point). */
	protected _anchorShift: _THREE.Vector3;
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
		this._bearing = new THREE.Vector3();
		this._truckShift = new THREE.Vector3();
		this._anchorShift = new THREE.Vector3();
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

			// A real pan takes ownership of the target back from any in-flight dolly-to-cursor,
			// so it eases on the truck clock again. OFFSET moves `_focalOffset`, not the target.
			if ( ! dragToOffset ) this._targetFollowsDolly = false;

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
				// `forwardDotN <= -GRAZE_EPSILON` means the END forward looks onto the plane.
				// Near-parallel (polar ≈ 90°, reachable with the default maxPolarAngle = π)
				// would blow up `tf` below, so gate all anchoring on it and plain-dolly otherwise.
				const forwardDotN = f.dot( n );

				if ( forwardDotN > - GRAZE_EPSILON ) {

					// Camera nearly parallel to the plane (polar ≈ 90°) ⇒ `tf` would blow up →
					// plain dolly, no anchor shift.
					this._dollyToNoClamp( clamp( radius * dollyScale, this.minDistance, this.maxDistance ), true );

				} else {

					const right = this._right.crossVectors( f, camera.up );
					// Degenerate: camera looking along its up axis → stable fallback right.
					if ( right.lengthSq() < GRAZE_EPSILON ) right.setFromMatrixColumn( camera.matrixWorld, 0 );
					right.normalize();
					const up = this._up.crossVectors( right, f ).normalize();

					const tanY = Math.tan( camera.getEffectiveFOV() * DEG2RAD * 0.5 );
					const tanX = tanY * camera.aspect;

					// Cursor ray direction `u` from the NDC.
					const u = this._cursorDir.copy( f )
						.addScaledVector( right, x * tanX )
						.addScaledVector( up, y * tanY )
						.normalize();

					// Grazing measure s = −u·n: s > 0 the ray descends onto the plane, larger =
					// steeper. Thin horizon band [sLo, sHi] = [sin(½·angle), sin(angle)]. Blend
					// weight w: 1 below the band (exact anchor), 0 above it (pure sky-truck).
					const s = - u.dot( n );
					const sHi = Math.sin( this.dollyToCursorHorizonAngle );
					const sLo = Math.sin( 0.5 * this.dollyToCursorHorizonAngle );
					let w = smoothstep( sLo, sHi, s );

					// SKY-TRUCK shift: a real wheel-truck screen-pan along the cursor's in-plane
					// ground bearing h = u − (u·n)·n = u + s·n. Magnitude mirrors the base
					// `_truckInternal` (perspective): truckSpeed · wheelPixels · targetDistance /
					// viewportHeight, targetDistance = radius · tan(fov/2). `wheelPixels`
					// reconstructs |event.deltaY| from the `delta` param (handler:
					// delta = deltaY/(deltaYFactor·10), deltaYFactor = −3 non-mac ⇒ ×30);
					// `truckSpeed` is the real tuning knob. Signed by the dolly direction so
					// zoom-in glides toward the bearing and zoom-out away (NOT ∝ 1/s).
					const bearing = this._bearing.copy( u ).addScaledVector( n, s );
					if ( bearing.lengthSq() > GRAZE_EPSILON ) bearing.normalize();
					// Recover the raw |event.deltaY| per-platform via the base `deltaYFactor`
					// (mac factor 1 ⇒ ×10, non-mac factor 3 ⇒ ×30) so the sky-pan matches a real
					// wheel-truck on both platforms.
					const wheelPixels = Math.abs( delta ) * ( isMac ? 10 : 30 );
					const targetDistance = radius * tanY;
					const truckMagnitude = this.truckSpeed * wheelPixels * targetDistance / this._elementRect.height;
					const truckShift = this._truckShift.copy( bearing ).multiplyScalar( Math.sign( 1 - k ) * truckMagnitude );

					// EXACT-ANCHOR shift (only where w > 0; there s ≥ sLo ⇒ the ray hits the plane
					// so `t` is finite). Pure-truck keeps the radius ≈ constant.
					const anchorShift = this._anchorShift.set( 0, 0, 0 );
					let rPrime = radius;
					if ( w > 0 ) {

						const t = intersectRayPlane( C.x, C.y, C.z, u.x, u.y, u.z, n.x, n.y, n.z, planeConstant );
						if ( t !== null && t > 0 ) {

							// Move the camera along `u` by m = t·(1 − k): the anchor stays exactly
							// on the cursor ray from C' ( A − C' = t·k·u ). Re-derive the target
							// on the plane (orientation fixed): T' = C' + r'·f, r' = tf.
							const movedCamera = this._movedCamera.copy( C ).addScaledVector( u, t * ( 1 - k ) );
							rPrime = ( planeConstant - movedCamera.dot( n ) ) / forwardDotN;
							anchorShift.copy( movedCamera ).addScaledVector( f, rPrime ).sub( this._targetEnd );

						} else {

							w = 0; // degenerate hit ⇒ pure truck

						}

					}

					// Blend truck→anchor by w. Short-circuit the endpoints so the below-horizon
					// common case ( w === 1 ) is a bit-exact copy of the exact path — independent
					// of the truck magnitude and free of `a + (b − a)` rounding.
					const shift = this._truckShift;
					let rCommitted: number;
					if ( w >= 1 ) {

						shift.copy( anchorShift ); // exact anchor, no truck contribution
						rCommitted = rPrime;

					} else if ( w <= 0 ) {

						shift.copy( truckShift ); // pure sky-truck, radius held
						rCommitted = radius;

					} else {

						shift.copy( truckShift ).lerp( anchorShift, w );
						rCommitted = radius + ( rPrime - radius ) * w;

					}

					const newTarget = this._newTarget.copy( this._targetEnd ).add( shift );
					this._boundary.clampPoint( newTarget, newTarget );

					// Commit the END state only; easing follows toward it.
					this._dollyToNoClamp( clamp( rCommitted, this.minDistance, this.maxDistance ), true );
					this._targetEnd.copy( newTarget );

				}

				// The moved target must ease in LOCKSTEP with the radius: the whole move is
				// committed to the END state, and the camera `C = target + radius·d` traces the
				// straight line through the anchor only while both eases sit at the same
				// normalized progress. `_isUserControllingTruck` marks the target as
				// user-driven (the wheel handler only sets `_isUserControllingDolly`);
				// `_targetFollowsDolly` then routes it onto the dolly's clock in
				// `_getTargetSmoothTime`, so the lockstep holds whatever `controlSmoothTime.truck` is.
				this._isUserControllingTruck = true;
				this._targetFollowsDolly = true;

				// Zero on both branches (ortho's `zoomTo` already does): keeps the base
				// update()-drift off even if `infinityDolly` was toggled off mid-ease.
				this._changedDolly = 0;
				this._lastDollyDirection = Math.sign( - delta ) as DOLLY_DIRECTION;
				this._needsUpdate = true;
				return;

			}

			this._targetFollowsDolly = false;
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

				// Every ortho ray is parallel to `f`, so the whole view shares one grazing
				// measure s = −f·n. Same thin horizon band as perspective: below it exact
				// anchor, above it (whole-view grazing) a sky-truck, blend inside.
				const forwardDotN = f.dot( n );
				const s = - forwardDotN;
				const sHi = Math.sin( this.dollyToCursorHorizonAngle );
				const sLo = Math.sin( 0.5 * this.dollyToCursorHorizonAngle );
				let w = smoothstep( sLo, sHi, s );

				const frustumWorldHeight = ( camera.top - camera.bottom ) / z0;
				const zoomStep = 1 - z0 / z1;

				// SKY-TRUCK shift along the in-plane forward bearing h = f − (f·n)·n = f + s·n
				// (all ortho rays share `f`). Magnitude mirrors the base ortho `_truckInternal`
				// (forward axis): truckSpeed · wheelPixels · (top−bottom)/zoom / viewportHeight
				// = truckSpeed · wheelPixels · frustumWorldHeight / viewportHeight. Same
				// per-platform `wheelPixels` reconstruction (isMac ? ×10 : ×30) as perspective;
				// signed by the zoom direction.
				const bearing = this._bearing.copy( f ).addScaledVector( n, s );
				if ( bearing.lengthSq() > GRAZE_EPSILON ) bearing.normalize();
				const wheelPixels = Math.abs( delta ) * ( isMac ? 10 : 30 );
				const truckMagnitude = this.truckSpeed * wheelPixels * frustumWorldHeight / this._elementRect.height;
				const truckShift = this._truckShift.copy( bearing ).multiplyScalar( Math.sign( zoomStep ) * truckMagnitude );

				// EXACT-ANCHOR shift (only where w > 0; there s ≥ sLo ⇒ f·n ≠ 0 ⇒ finite anchor).
				const anchorShift = this._anchorShift.set( 0, 0, 0 );
				if ( w > 0 ) {

					// Cursor ray origin at the END zoom (mid-frustum), direction `f`.
					const centerX = ( camera.right + camera.left ) * 0.5;
					const centerY = ( camera.top + camera.bottom ) * 0.5;
					const halfW = ( camera.right - camera.left ) * 0.5 / z0;
					const halfH = frustumWorldHeight * 0.5;
					const origin = this._rayOrigin.copy( C )
						.addScaledVector( right, centerX + x * halfW )
						.addScaledVector( up, centerY + y * halfH );

					const t = intersectRayPlane( origin.x, origin.y, origin.z, f.x, f.y, f.z, n.x, n.y, n.z, planeConstant );
					if ( t !== null ) {

						// A = origin + t·f; exact scale-toward-anchor shift = zoomStep·(A − T).
						anchorShift.copy( origin ).addScaledVector( f, t ).sub( this._targetEnd ).multiplyScalar( zoomStep );

					} else {

						w = 0; // degenerate hit ⇒ pure truck

					}

				}

				// Blend truck→anchor by w. Short-circuit the endpoints so the below-horizon
				// common case ( w === 1 ) is a bit-exact copy of the exact anchor shift,
				// independent of the truck magnitude. (The END zoom always commits z1.)
				const shift = this._truckShift;
				if ( w >= 1 ) shift.copy( anchorShift );
				else if ( w <= 0 ) shift.copy( truckShift );
				else shift.copy( truckShift ).lerp( anchorShift, w );

				const newTarget = this._newTarget.copy( this._targetEnd ).add( shift );
				this._boundary.clampPoint( newTarget, newTarget );

				this.zoomTo( z1, true );
				this._targetEnd.copy( newTarget );
				// Match the target ease to the zoom ease so the anchor tracks the cursor through
				// the ease, not just at rest. See the perspective override for the rationale.
				//
				// KNOWN LIMITATION (fix before the upstream PR): unlike perspective, matching the
				// clocks does NOT make ortho pinning exact mid-ease — only at the endpoints. The
				// anchor's screen position is ∝ ( A − T( t ) ) · zoom( t ), so holding it fixed
				// requires the HARMONIC law
				//     zoom( t ) = z0 / ( 1 − p( t )·( 1 − z0 / z1 ) ),   p = the target's progress,
				// whereas `_zoom` is smoothDamp'd toward `z1` linearly. The two agree at p = 0 and
				// p = 1 and diverge in between, so the cursor point drifts and returns (~0.26 world
				// units for one notch in the example scene). Perspective has no such gap: there the
				// camera moves along a straight line, which linear interpolation reproduces exactly.
				// Fixing it means driving `_target` from the LIVE `_zoom` each frame — i.e. inverting
				// the law above for p — rather than easing it independently.
				this._isUserControllingTruck = true;
				this._targetFollowsDolly = true;
				this._needsUpdate = true;
				return;

			}

			this._targetFollowsDolly = false;
			baseZoomInternal( delta, x, y );

		};

	}

	/**
	 * Dolly/zoom-to-cursor moves the target as PART OF the dolly, so ease it on the dolly's
	 * clock (the zoom's, for orthographic) instead of the truck's. `controlSmoothTime.truck = 0`
	 * is a natural setting for map-style 1:1 drag panning; without this the target would snap
	 * there while the radius kept easing, breaking the lockstep the exact anchoring depends on
	 * and yanking the world out from under the cursor. Resolved the same way the radius/zoom
	 * ease resolves its own smooth-time, so the two always match.
	 *
	 * Falls back to the base (truck) resolution for real pans, and — via
	 * `_isUserControllingTruck`, which every programmatic move clears — whenever the target is
	 * no longer under user control.
	 */
	protected _getTargetSmoothTime(): number {

		if ( this._targetFollowsDolly && this._isUserControllingTruck ) {

			return isOrthographicCamera( this._camera ) ?
				( this._isUserControllingZoom  ? this._controlSmoothTime.zoom  : this._smoothTime.zoom  ) :
				( this._isUserControllingDolly ? this._controlSmoothTime.dolly : this._smoothTime.dolly );

		}

		return super._getTargetSmoothTime();

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
