import { DEGREES_IN_HALF_TURN, EARTH_RADIUS_M } from './track-distance.constant';

/**
 * Great-circle distance between two samples, in metres. Over the length of one stride it agrees
 * with a tape measure, which is all the accuracy a sum of ten thousand strides can use.
 */
export function metersBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / DEGREES_IN_HALF_TURN;
}
