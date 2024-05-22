
function makeIndexIterator(indices) {
    let ndx = 0;
    const fn = () => indices[ndx++];
    fn.reset = () => { ndx = 0; };
    fn.numElements = indices.length;
    return fn;
  }
  
  function makeUnindexedIterator(positions) {
    let ndx = 0;
    const fn = () => ndx++;
    fn.reset = () => { ndx = 0; };
    fn.numElements = positions.length / 3;
    return fn;
  }
  
  const subtractVector2 = (a, b) => a.map((v, ndx) => v - b[ndx]);
  
  function generateTangents(position, texcoord, indices) {
    const getNextIndex = indices ? makeIndexIterator(indices) : makeUnindexedIterator(position);
    const numFaceVerts = getNextIndex.numElements;
    const numFaces = numFaceVerts / 3;
  
    const tangents = [];
    for (let i = 0; i < numFaces; ++i) {
      const n1 = getNextIndex();
      const n2 = getNextIndex();
      const n3 = getNextIndex();
  
      const p1 = position.slice(n1 * 3, n1 * 3 + 3);
      const p2 = position.slice(n2 * 3, n2 * 3 + 3);
      const p3 = position.slice(n3 * 3, n3 * 3 + 3);
  
      const uv1 = texcoord.slice(n1 * 2, n1 * 2 + 2);
      const uv2 = texcoord.slice(n2 * 2, n2 * 2 + 2);
      const uv3 = texcoord.slice(n3 * 2, n3 * 2 + 2);
  
      const dp12 = m4.subtractVectors(p2, p1);
      const dp13 = m4.subtractVectors(p3, p1);
  
      const duv12 = subtractVector2(uv2, uv1);
      const duv13 = subtractVector2(uv3, uv1);
  
      const f = 1.0 / (duv12[0] * duv13[1] - duv13[0] * duv12[1]);
      const tangent = Number.isFinite(f)
        ? m4.normalize(m4.scaleVector(m4.subtractVectors(
          m4.scaleVector(dp12, duv13[1]),
          m4.scaleVector(dp13, duv12[1]),
        ), f))
        : [1, 0, 0];
  
      tangents.push(...tangent, ...tangent, ...tangent);
    }
  
    return tangents;
  }
  