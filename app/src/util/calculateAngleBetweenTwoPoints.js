import { Vector2 } from 'three';
/**
 * Calculates the angles between two landmarks which are represented as position vectors.
 * @param {2-tuple} point1        Elbow/Knee
 * @param {2-tuple} point2        Wrist/Ankle
 *
 * @return {number} Returns the angle in radians
 */
export default function calculateAngleBetweenTwoPoints(point1, point2) {
  const joint1 = new Vector2(point1.x, point1.y); // Ref line 51
  const joint2 = new Vector2(point2.x, point2.y); // Ref line 52

  // See https://threejs.org/docs/#api/en/math/Vector2
  const link = joint2.sub(joint1);

  return -Math.atan2(link.x, link.y) + Math.PI;
  // Short: return -Math.atan2(point2.y - point1.y, point2.x - point1.x) + Math.PI
}
