// Converts degrees to radians
function degToRad(deg) {
  return deg * Math.PI / 180;
}

// Resizes an object by scaling it uniformly along all three axes
function resizeObject(resizeObj, u_world) {
  // Create the scaling matrix
  const scaleMatrix = m4.scaling(resizeObj, resizeObj, resizeObj);
  // Multiply the scaling matrix by u_world
  return m4.multiply(u_world, scaleMatrix);
}

// Moves an object by translating it along the x, y, and z axes
function moveObject(positionObj, u_world) {
  // Create the translation matrix
  const translationMatrix = m4.translation(positionObj[0], positionObj[1], positionObj[2]);
  // Multiply the translation matrix by u_world
  return m4.multiply(translationMatrix, u_world);
}

// Rotates an object by creating rotation matrices for the x, y, and z axes
function rotateObject(rotatePosition, u_world) {
  // Create rotation matrices for the x, y, and z axes
  const xRotationMatrix = m4.xRotation(degToRad(rotatePosition[0]));
  const yRotationMatrix = m4.yRotation(degToRad(rotatePosition[1]));
  const zRotationMatrix = m4.zRotation(degToRad(rotatePosition[2]));

  // Multiply the rotation matrices by u_world
  return m4.multiply(m4.multiply(m4.multiply(u_world, xRotationMatrix), yRotationMatrix), zRotationMatrix);
}
