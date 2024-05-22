  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function resizeObject(resizeObj, u_world) {
    // Crea la matrice di scala
    const scaleMatrix = m4.scaling(resizeObj, resizeObj, resizeObj);
    // Moltiplica la matrice di scala per u_world
    return m4.multiply(u_world, scaleMatrix);
  }

  function moveObject(positionObj, u_world) {
    // Crea la matrice di traslazione
    const translationMatrix = m4.translation(positionObj[0], positionObj[1], positionObj[2]);

    // Moltiplica la matrice di traslazione per u_world
    return m4.multiply(translationMatrix, u_world);
  }

  function rotateObject(rotatePosition, u_world) {
    // Crea le matrici di rotazione per gli assi x, y e z
    const xRotationMatrix = m4.xRotation(degToRad(rotatePosition[0]));
    const yRotationMatrix = m4.yRotation(degToRad(rotatePosition[1]));
    const zRotationMatrix = m4.zRotation(degToRad(rotatePosition[2]));

    // Moltiplica le matrici di rotazione per u_world
    return m4.multiply(m4.multiply(m4.multiply(u_world, xRotationMatrix), yRotationMatrix), zRotationMatrix);
  }