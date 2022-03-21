/**
 * This function returns the dot-product between a 3x3 matrix (flattened) and a vector of size 3x1
 * @param {[number]} matrix
 * @param {[number]} vector
 * @returns {[number]} 3x3 matrix
 */
export default function matrixVectorMultiplication(matrix, vector) {
  // Decomposite matrix
  const m11 = matrix[0]; // column 0, row 0
  const m12 = matrix[1];
  const m13 = matrix[2];
  const m21 = matrix[3];
  const m22 = matrix[4];
  const m23 = matrix[5];
  const m31 = matrix[6];
  const m32 = matrix[7];
  const m33 = matrix[8];

  // Decomposite vector
  const x1 = vector[0];
  const x2 = vector[1];
  const x3 = vector[2];

  const transformedX1 = x1 * m11 + x2 * m12 + x3 * m13;
  const transformedX2 = x1 * m21 + x2 * m22 + x3 * m23;
  const transformedX3 = x1 * m31 + x2 * m32 + x3 * m33;

  return [transformedX1, transformedX2, transformedX3];
}
