"use strict";
var cameraPositionMain = m4.identity()
let viewMatrixMain;
let lightsEnabled = true;
let bumpEnabled = false;
let fov = 60
let gl
let lightx = 60
let lighty = 60
let lightz = 60
let velocity = 10
var spaceshipCamera = m4.identity()
let initialSpaceshipRotation = 0


async function loadModel(objHref, resizeObj, positionObj, rotation, rotatePosition, spaceship, velocity, reflection) {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // compiles and links the shaders, looks up attribute and uniform locations
  const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

  const response = await fetch(objHref);
  const text = await response.text();
  const obj = parseOBJ(text);
  const baseHref = new URL(objHref, window.location.href);
  const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
    const matHref = new URL(filename, baseHref).href;
    const response = await fetch(matHref);
    return await response.text();
  }));
  const materials = parseMTL(matTexts.join('\n'));

  const textures = {
    defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
    defaultNormal: create1PixelTexture(gl, [127, 127, 255, 0]),
  };

  // load texture for materials
  for (const material of Object.values(materials)) {
    Object.entries(material)
      .filter(([key]) => key.endsWith('Map'))
      .forEach(([key, filename]) => {
        let texture = textures[filename];
        if (!texture) {
          const textureHref = new URL(filename, baseHref).href;
          texture = createTexture(gl, textureHref);
          textures[filename] = texture;
        }
        material[key] = texture;
      });
  }

  // hack the materials so we can see the specular map
  Object.values(materials).forEach(m => {
    m.shininess = 25;
    m.specular = [3, 2, 1];
  });

  const defaultMaterial = {
    diffuse: [1, 1, 1],
    diffuseMap: textures.defaultWhite,
    normalMap: textures.defaultNormal,
    ambient: [0, 0, 0],
    specular: [1, 1, 1],
    specularMap: textures.defaultWhite,
    shininess: 400,
    opacity: 1,
  };

  const parts = obj.geometries.map(({ material, data }) => {

    if (data.color) {
      if (data.position.length === data.color.length) {
        // it's 3. The our helper library assumes 4 so we need
        // to tell it there are only 3.
        data.color = { numComponents: 3, data: data.color };
      }
    } else {
      // there are no vertex colors so just use constant white
      data.color = { value: [1, 1, 1, 1] };
    }

    // generate tangents if we have the data to do so.
    if (data.texcoord && data.normal) {
      data.tangent = generateTangents(data.position, data.texcoord);
    } else {
      // There are no tangents
      data.tangent = { value: [1, 0, 0] };
    }

    if (!data.texcoord) {
      data.texcoord = { value: [0, 0] };
    }

    if (!data.normal) {
      // we probably want to generate normals if there are none
      data.normal = { value: [0, 0, 1] };
    }

    // create a buffer for each array by calling
    // gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
    return {
      material: {
        ...defaultMaterial,
        ...materials[material],
      },
      bufferInfo,
    };
  });

  function getExtents(positions) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
      for (let j = 0; j < 3; ++j) {
        const v = positions[i + j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
      }
    }
    return { min, max };
  }



  function getGeometriesExtents(geometries) {
    return geometries.reduce(({ min, max }, { data }) => {
      const minMax = getExtents(data.position);
      return {
        min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
        max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
      };
    }, {
      min: Array(3).fill(Number.POSITIVE_INFINITY),
      max: Array(3).fill(Number.NEGATIVE_INFINITY),
    });
  }

  const extents = getGeometriesExtents(obj.geometries);
  const range = m4.subtractVectors(extents.max, extents.min);
  // amount to move the object so its center is at the origin
  const objOffset = m4.scaleVector(
    m4.addVectors(
      extents.min,
      m4.scaleVector(range, 0.5)),
    -1);
  const radius = m4.length(range) * 0.5;


  // Set zNear and zFar to something hopefully appropriate
  // for the size of this object.
  const zNear = radius / 100;
  const zFar = radius * 10000;

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function render(time) {
    time *= rotation;  // convert to seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.clearColor(0, 0, 0, 1);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    const fieldOfViewRadians = degToRad(fov);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    var sharedUniforms
    viewMatrixMain = m4.inverse(cameraPositionMain);
    sharedUniforms = {
      u_lightDirection: m4.normalize([lightx, lighty, -lightz]), // Vecchia luce
      u_frontLightDirection: m4.normalize([10, 50, -10]), // Nuova luce frontale
      u_lightsEnabled: lightsEnabled ? 1 : 0,
      u_bumpMappingEnabled: bumpEnabled ? 1 : 0,
      u_view: viewMatrixMain,
      u_projection: projection,
      u_viewWorldPosition: spaceshipCamera,
    };

    if (spaceship) {
      viewMatrixMain = m4.inverse(spaceshipCamera);
      sharedUniforms = {
        u_lightDirection: m4.normalize([0, 0, 0]),
        u_lightsEnabled: lightsEnabled ? 1 : 0,
        u_bumpMappingEnabled: bumpEnabled ? 1 : 0,
        u_view: viewMatrixMain,
        u_projection: projection,
        u_viewWorldPosition: spaceshipCamera,
      };
    }


    if (initialSpaceshipRotation > 0) {
      m4.zRotate(spaceshipCamera, degToRad(-0.1), spaceshipCamera);
      initialSpaceshipRotation -= 0.1
    } else if (initialSpaceshipRotation < 0) {
      m4.zRotate(spaceshipCamera, degToRad(0.1), spaceshipCamera);
      initialSpaceshipRotation += 0.1
    }

    gl.useProgram(meshProgramInfo.program);



    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    // compute the world matrix once since all parts
    // are at the same space.
    let u_world = m4.yRotation(time);
    u_world = m4.translate(u_world, ...objOffset);

    // Ridimensiona l'oggetto
    u_world = resizeObject(resizeObj, u_world);

    u_world = moveObject(positionObj, u_world)

    u_world = rotateObject(rotatePosition, u_world)


    for (const { bufferInfo, material } of parts) {
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
      // calls gl.uniform
      webglUtils.setUniforms(meshProgramInfo, {
        u_world,
      }, material);
      // calls gl.drawArrays or gl.drawElements
      webglUtils.drawBufferInfo(gl, bufferInfo);
    }

    requestAnimationFrame(render);
    updateCameraPosition(velocity)
  }

  requestAnimationFrame(render);
}


document.addEventListener("DOMContentLoaded", function () {
  // var loadingText = document.getElementById("loadingText");
  // var canvas = document.getElementById("canvas");

  // function hideLoadingText() {
  //   loadingText.style.display = "none";
  //   canvas.style.display = "block";
  // }

  loadModel(
    'assets/solar/solar.obj',
    40, // Resize object: [scaleX, scaleY, scaleZ]
    [1000, 500, -1500], // Position object: [x, y, z]
    0.0001,         //  rotation
    [0, 0, 0], // Rotate position: [rotateX, rotateY, rotateZ]
    false,      // spaceship mode
    10,        // velocity
    false      // reflection
  );
  loadModel("assets/spaceship/justigue league flying vehicle.obj", 1, [0, -90, -400], 0, [0, 180, 0], true, velocity, false);
  loadModel("assets/solsystem/system.obj", 20, [4000, 1600, 5000], 0.0001, [-90, 0, 0], false, 10, false);
  loadModel("assets/rainbow/rainbow.obj", 100, [0, 350, -180], 0, [180, 230, 170], false, 10, true);
  // setTimeout(hideLoadingText, 3000);
});
