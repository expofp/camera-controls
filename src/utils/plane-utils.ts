/**
 * Ray/plane intersection.
 * Plane is { p : dot( p, n ) = planeConstant }, n assumed unit-length.
 * Returns the ray parameter t ( point = origin + t * dir ), or null when the
 * ray is parallel to the plane. Caller checks t > 0 for "in front of origin".
 */
export function intersectRayPlane(
	ox: number, oy: number, oz: number,
	dx: number, dy: number, dz: number,
	nx: number, ny: number, nz: number,
	planeConstant: number,
): number | null {

	const denom = dx * nx + dy * ny + dz * nz;
	if ( Math.abs( denom ) < 1e-12 ) return null;
	const originDotN = ox * nx + oy * ny + oz * nz;
	return ( planeConstant - originDotN ) / denom;

}
