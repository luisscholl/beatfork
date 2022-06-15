import matrixVectorMultiplication from "./matrixVectorMultiplication";

/**
 * This function returns the dot-product between two 3x3 matrices (flattened to 9x1)
 * @param {[number]} matrix
 * @param {[number]} matrix
 * @returns {[number]} 3x3 matrix
 */
export default function multiplyMatrices(matrix1, matrix2) {
  // Slice the second matrix up into rows
  const row0 = [matrix2[0], matrix2[1], matrix2[2]];
  const row1 = [matrix2[3], matrix2[4], matrix2[5]];
  const row2 = [matrix2[6], matrix2[7], matrix2[8]];

  // Multiply each row by matrix1
  const newRow0 = matrixVectorMultiplication(matrix1, row0);
  const newRow1 = matrixVectorMultiplication(matrix1, row1);
  const newRow2 = matrixVectorMultiplication(matrix1, row2);

  // Turn the result rows back into a single matrix
  return [
    newRow0[0],
    newRow0[1],
    newRow0[2],
    newRow1[0],
    newRow1[1],
    newRow1[2],
    newRow2[0],
    newRow2[1],
    newRow2[2],
  ];
}
