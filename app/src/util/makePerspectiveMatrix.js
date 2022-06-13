import multiplyMatrices from "./multiplyMatrices";

/**
 * This function returns the dot-product between two 3x3 matrices (flattened to 9x1)
 * @param {number} l left border of the calibration rectangle
 * @param {number} r border of the calibration rectangle
 * @param {number} b bottom border of the calibration rectangle
 * @param {number} t top border of the calibration rectangle
 * @param {number} alpha x axis deviation of the link between both wrists in angle degree
 * @returns {[number]} finalTransformation as 3x3 matrix
 */
export default function makePerspectiveMatrix(l, r, b, t, alpha) {
  // calculate n and f for perspective transformation
  const n = (0.5 * (t + b)) / Math.tan(alpha);
  const f = n + (r - l);

  // construct translation matrix
  const tTransl = [1, 0, n - 1, 0, 1, -0.5 * (t + b), 0, 0, 1];

  // construct rotation matrix
  const tRot = [0, 1, 0, -1, 0, 0, 0, 0, 1];

  // construct perspective transformation matrix
  const tPersp = [1, 0, 0, 0, 1 + f / n, f, 0, -1 / n, 0];

  // construct reverse rotation matrix
  const tRotRev = [0, -1, 0, 1, 0, 0, 0, 0, 1];

  // construct reverse translation Matrix
  const tTranslRev = [1, 0, -(n - 1), 0, 1, 0.5 * (t + b), 0, 0, 1];

  // combine them all
  const part1 = multiplyMatrices(tRot, tTransl);
  const part2 = multiplyMatrices(tRotRev, tPersp);
  const part3 = multiplyMatrices(part2, part1);
  const finalTransformation = multiplyMatrices(tTranslRev, part3);

  // Turn the result rows back into a single matrix
  return finalTransformation;
}
