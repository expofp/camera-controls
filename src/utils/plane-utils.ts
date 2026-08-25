function clamp( x: number, min: number, max: number ): number {

	return Math.max( min, Math.min( max, x ) );

}

function smoothstep( min: number, max: number, x: number ): number {

	if ( min === max ) return x < min ? 0 : 1;
	const t = clamp( ( x - min ) / ( max - min ), 0, 1 );
	return t * t * ( 3 - 2 * t );

}

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

/**
 * Blend weight for dolly-to-cursor: 0 when the cursor ray grazes the plane
 * ( angle <= minAngle ), 1 when it is steep ( angle >= maxAngle ), smoothstep
 * between. rayDirDotNormal = dot( unit ray dir, unit plane normal ).
 */
export function grazeWeight( rayDirDotNormal: number, minAngle: number, maxAngle: number ): number {

	const grazingAngle = Math.asin( clamp( Math.abs( rayDirDotNormal ), 0, 1 ) );
	return smoothstep( minAngle, maxAngle, grazingAngle );

}
