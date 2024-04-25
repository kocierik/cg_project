var terrain_size;
var size_x;
var size_y;
var noise_size_x;
var noise_size_y;
var max_height;
var ufo_mode = false;
var spaceshipGeometries = []; // Array per memorizzare le geometrie dello spaceship

// Funzione per inizializzare e avviare il programma
function initializeAndStart() {
  // Ottieni i valori delle opzioni
  terrain_size = parseFloat($('#terrain_size').val());
  size_x = parseFloat($('#size_x').val());
  size_y = parseFloat($('#size_y').val());
  noise_size_x = parseFloat($('#noise_size_x').val());
  noise_size_y = parseFloat($('#noise_size_y').val());
  max_height = parseFloat($('#max_height').val());
  position = vec3.create([terrain_size / 2, 0, 1.2, 1]);

  // Avvia il programma
  main(document.getElementById("canvas"));
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

// Bind dell'evento ready del documento per inizializzare e avviare il programma
$(document).ready(initializeAndStart);

// Bind dell'evento change per l'elemento #ufo_mode per gestire il cambio di modalità UFO
$('#ufo_mode').change(function() {
  ufo_mode = $(this).prop('checked');
});


var numSpaceshipVertices; // Numero totale di vertici dello spaceship

async function loadSpaceshipModel() {
  const objHref = '../spaceship/prometheus.obj';
  // const objHref = '../Tree/Tree.obj';
  const response = await fetch(objHref);
  const objText = await response.text();
  const objData = parseOBJ(objText);

  // Assicurati che l'oggetto restituito da parseOBJ contenga i dati necessari
  if (objData && objData.geometries && objData.geometries.length > 0) {
    for (let i = 0; i < objData.geometries.length; i++) {
      const geometry = objData.geometries[i];
      const data = geometry.data;
      // Verifica se sono presenti vertici e normali
      if (data.position && data.normal) {
        const positions = data.position;
        const normals = data.normal;

        // Crea buffer per i vertici dello spaceship
        const verticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Crea buffer per le normali dello spaceship
        const normalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        // Aggiungi i buffer e il numero di vertici all'array di geometrie dello spaceship
        spaceshipGeometries.push({
          verticesBuffer: verticesBuffer,
          normalsBuffer: normalsBuffer,
          numVertices: positions.length / 3
        });
      }
    }
    // Calcola il numero totale di vertici dello spaceship
    numSpaceshipVertices = spaceshipGeometries.reduce((total, geometry) => total + geometry.numVertices, 0);
  }
}


var textures = []; // Array per memorizzare le texture caricate
let textureUrls = [];


async function loadTexturesFromMTL(mtlUrl) {
  const response = await fetch(mtlUrl);
  const mtlText = await response.text();

  // Trova tutti i riferimenti alle texture diffuse nel file MTL
  const textureMatches = mtlText.match(/^map_Kd\s+(.*)/gm);
  if (!textureMatches) {
    console.error("No diffuse textures found in MTL file.");
    return;
  }

  textureUrls = textureMatches.map(match => {
    // Ottieni il nome del file della texture dalla riga del MTL
    const textureFileName = match.split(/\s+/)[1];
    // Costruisci l'URL completo della texture JPEG utilizzando il percorso della directory
    return '../spaceship/' + textureFileName;
  });
console.log(textureUrls)
  // Carica le texture JPEG
  await loadTextures(textureUrls);
}


// Funzione per caricare le texture
async function loadTextures() {

  for (let i = 0; i < textureUrls.length; i++) {
    const texture = gl.createTexture();
    const image = new Image();
    image.onload = function() {
      handleTextureLoaded(image, texture);
    };
    image.src = textureUrls[i];
  }
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Calcola le dimensioni potenza di due più vicine
  var width = nearestPowerOfTwo(image.width);
  var height = nearestPowerOfTwo(image.height);

  // Ridimensiona l'immagine alla dimensione potenza di due
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);

  // Carica l'immagine ridimensionata nella texture WebGL
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

  // Imposta i parametri della texture e genera il mipmap
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);

  textures.push(texture);

  if (textures.length === textureUrls.length) {
    // Tutte le texture sono state caricate
    // Puoi procedere con l'avvio del rendering WebGL
    main(document.getElementById("canvas"));
  }
}

// Funzione per calcolare la dimensione potenza di due più vicina
function nearestPowerOfTwo(value) {
  return Math.pow(2, Math.ceil(Math.log(value) / Math.log(2)));
}




// Funzione principale per il rendering WebGL
async function main(canvas) {
  initGL(canvas);
  await loadSpaceshipModel();
  await loadTexturesFromMTL("../spaceship/prometheus.mtl")
  // loadTextures();

  initBuffers();
  initShaders();

  gl.clearColor(0.6, 0.8, 0.9, 1.0);
  gl.enable(gl.DEPTH_TEST);

  tick();
}

var gl;
var shaderProgram;
var pMatrix = mat4.create();

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl");
    if (!gl) {
      gl = canvas.getContext("experimental-webgl");
    }
    if (!gl) {
      throw new Error("WebGL context could not be initialized.");
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
    console.error("Error initializing WebGL:", e.message);
  }
}

/**
 * Inizializza gli shader
 */
function initShaders() {
  var vertexShader = getShader(gl, "shader-vs-mountain");
  var fragmentShader = getShader(gl, "shader-fs-mountain");

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("Could not initialize shader program.");
  }

  gl.useProgram(program);

  // Set attributi dei vertici
  program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
  gl.enableVertexAttribArray(program.vertexPositionAttribute);

  // Set attributi delle normali
  program.vertexNormalAttribute = gl.getAttribLocation(program, "aVertexNormal");
  gl.enableVertexAttribArray(program.vertexNormalAttribute);

  // Set uniform locations
  program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
  program.useLightingUniform = gl.getUniformLocation(program, "uUseLighting");
  program.ambientColorUniform = gl.getUniformLocation(program, "uAmbientColor");
  program.lightingDirectionUniform = gl.getUniformLocation(program, "uLightingDirection");
  program.directionalColorUniform = gl.getUniformLocation(program, "uDirectionalColor");
  program.positionUniform = gl.getUniformLocation(program, "uPosition");
  program.forwardUniform = gl.getUniformLocation(program, "uForward");
  program.upUniform = gl.getUniformLocation(program, "uUp");

  shaderProgram = program;
}

/**
 * Imposta le variabili uniform delle matrici
 */
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
 * Inizializza i buffer
 */
var mountainVertexPositionBuffer;
var mountainVertexNormalBuffer;

function initBuffers() {
  var mountain = MountainGenerator.generateMountain(terrain_size, size_x, size_y, noise_size_x, noise_size_y, max_height);
  var mountainVertices = mountain[0];
  var mountainNormals = mountain[1];

  // Crea il buffer dei vertici
  mountainVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mountainVertexPositionBuffer);
  var vertices = mountainVertices;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  mountainVertexPositionBuffer.itemSize = 3;
  mountainVertexPositionBuffer.numItems = mountainVertices.length / 3;

  // Crea il buffer delle normali
  mountainVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mountainVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mountainNormals), gl.STATIC_DRAW);
  mountainVertexNormalBuffer.itemSize = 3;
  mountainVertexNormalBuffer.numItems = mountainNormals.length / 3;
}

var angle = 0;
var last = 0;
var forward = vec3.create([0, 0.9924753308296204, -0.12244734913110733]);
var up = vec3.create([0, 0, 1, 0]);
var position = vec3.create([12, 0, 1.2, 1]);
var velocity = 0.20;
var vertical_angular_velocity = 0;
var roll_angular_velocity = 0;

function tick() {
  requestAnimationFrame(tick);
  display();

  var now = new Date().getTime();
  if (last != 0) {
    var delta = (now - last) / 1000
    // Spostamento in avanti
    position[0] += delta * velocity * forward[0]; // Sposta lungo l'asse x
    position[1] += delta * velocity * forward[1]; // Sposta lungo l'asse y
    position[2] += delta * velocity * forward[2]; // Sposta lungo l'asse z

    // Rotazione basata su roll
    var n_fz = vec3.create();
    vec3.cross(forward, vec3.create([0, 0, 1]), n_fz);
    vec3.normalize(n_fz);
    var roll = vec3.dot(n_fz, up);

    var rotateMatrix = mat4.create();
    mat4.identity(rotateMatrix);
    mat4.rotate(rotateMatrix, -1 * delta * Math.tan(roll), up);
    mat4.multiplyVec3(rotateMatrix, forward);

    // Inclinazione su o giù
    var right = vec3.create();
    vec3.cross(forward, up, right);
    mat4.identity(rotateMatrix);
    mat4.rotate(rotateMatrix, delta * vertical_angular_velocity, right);
    mat4.multiplyVec3(rotateMatrix, up);
    mat4.multiplyVec3(rotateMatrix, forward);

    // Roll laterale
    mat4.identity(rotateMatrix);
    mat4.rotate(rotateMatrix, delta * roll_angular_velocity, forward);
    mat4.multiplyVec3(rotateMatrix, up);
  }
  last = now;
}

var spaceshipPosition = vec3.create([0, 0, 0]); // Posizione iniziale dell'OBJ

// Funzione per aggiornare la posizione dell'OBJ
function updateSpaceshipPosition(x, y, z) {
  spaceshipPosition[0] = x;
  spaceshipPosition[1] = y;
  spaceshipPosition[2] = z;
}


async function display() {
  // Imposta viewport
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // Cancella lo schermo
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Imposta matrice prospettica
  mat4.perspective(90, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, mountainVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mountainVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, mountainVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

  // Colore luce ambientale
  gl.uniform3f(shaderProgram.ambientColorUniform, 0.8, 0.6, 0.1);

  var lightingDirection = ufo_mode ? forward : [0, 0.8944714069366455, -0.44713249802589417];
  var adjustedLD = vec3.create();
  vec3.normalize(lightingDirection, adjustedLD);
  vec3.scale(adjustedLD, -1);
  gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

  gl.uniform3f(shaderProgram.directionalColorUniform, 0.9, 0.9, 0.9);

  gl.uniform3fv(shaderProgram.positionUniform, position);
  gl.uniform3fv(shaderProgram.forwardUniform, forward);
  gl.uniform3fv(shaderProgram.upUniform, up);

  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, mountainVertexPositionBuffer.numItems);

  // Disegna le geometrie dello spaceship
  if (spaceshipGeometries.length > 0) {
    for (let i = 0; i < spaceshipGeometries.length; i++) {
      const geometry = spaceshipGeometries[i];
      gl.bindBuffer(gl.ARRAY_BUFFER, geometry.verticesBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, geometry.normalsBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

      setMatrixUniforms();
      gl.drawArrays(gl.TRIANGLES, 0, geometry.numVertices);
    }
  }
  
}

/**
 * Funzione ausiliaria per ottenere lo shader dal DOM
 */
function getShader(gl, id) {
  var script = document.getElementById(id);
  if (!script) return null;

  var source = "";
  var currentElement = script.firstChild;
  while (currentElement) {
    if (currentElement.nodeType == 3) {
      source += currentElement.textContent;
    }
    currentElement = currentElement.nextSibling;
  }

  var shader;
  if (script.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else if (script.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else {
    alert("Unknown script type.");
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}
