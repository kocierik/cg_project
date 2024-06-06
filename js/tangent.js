// Creates an iterator to traverse through an array of indices.
function makeIndexIterator(indices) {
  let ndx = 0; // Keeps track of the current position in the index array.
  
  // Function that returns the current index and increments ndx.
  const fn = () => indices[ndx++];
  
  // Function to reset ndx to 0.
  fn.reset = () => { ndx = 0; };
  
  // Returns the number of elements in the indices.
  fn.numElements = indices.length;
  
  return fn; // Returns the iterator function.
}

// Creates an iterator to traverse through positions without using indices.
function makeUnindexedIterator(positions) {
  let ndx = 0; // Keeps track of the current position.
  
  // Function that returns the current index and increments ndx.
  const fn = () => ndx++;
  
  // Function to reset ndx to 0.
  fn.reset = () => { ndx = 0; };
  
  // Returns the number of elements divided by 3 (each position is a 3D vector).
  fn.numElements = positions.length / 3;
  
  return fn; // Returns the iterator function.
}

// Function to subtract two 2D vectors.
const subtractVector2 = (a, b) => a.map((v, ndx) => v - b[ndx]);

// Main function to generate tangents.
function generateTangents(position, texcoord, indices) {
  // If indices are provided, use an index iterator; otherwise, use an unindexed iterator.
  const getNextIndex = indices ? makeIndexIterator(indices) : makeUnindexedIterator(position);
  
  const numFaceVerts = getNextIndex.numElements; // Number of total vertices.
  const numFaces = numFaceVerts / 3; // Number of faces (triangles) in the model.

  const tangents = []; // Array to store the generated tangents.
  
  for (let i = 0; i < numFaces; ++i) {
      // Get the indices of the three vertices of the triangle.
      const n1 = getNextIndex();
      const n2 = getNextIndex();
      const n3 = getNextIndex();

      // Extract the positions corresponding to the three vertices.
      const p1 = position.slice(n1 * 3, n1 * 3 + 3);
      const p2 = position.slice(n2 * 3, n2 * 3 + 3);
      const p3 = position.slice(n3 * 3, n3 * 3 + 3);

      // Extract the texture coordinates corresponding to the three vertices.
      const uv1 = texcoord.slice(n1 * 2, n1 * 2 + 2);
      const uv2 = texcoord.slice(n2 * 2, n2 * 2 + 2);
      const uv3 = texcoord.slice(n3 * 2, n3 * 2 + 2);

      // Compute the difference vectors between the positions of the vertices.
      const dp12 = m4.subtractVectors(p2, p1);
      const dp13 = m4.subtractVectors(p3, p1);

      // Compute the difference vectors between the texture coordinates.
      const duv12 = subtractVector2(uv2, uv1);
      const duv13 = subtractVector2(uv3, uv1);

      // Compute the factor for calculating the tangent vector.
      const f = 1.0 / (duv12[0] * duv13[1] - duv13[0] * duv12[1]);
      
      // If the factor is finite, calculate the tangent vector.
      const tangent = Number.isFinite(f)
          ? m4.normalize(m4.scaleVector(m4.subtractVectors(
              m4.scaleVector(dp12, duv13[1]),
              m4.scaleVector(dp13, duv12[1]),
          ), f))
          : [1, 0, 0]; // If the factor is not finite, assign a default tangent vector.

      // Add the calculated tangent vector three times (once for each vertex of the triangle).
      tangents.push(...tangent, ...tangent, ...tangent);
  }

  return tangents; // Return the array of tangents.
}
