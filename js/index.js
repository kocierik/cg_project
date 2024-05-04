class WebGLApp {
  constructor() {
    this.terrain_size;
    this.size_x;
    this.size_y;
    this.noise_size_x;
    this.noise_size_y;
    this.max_height;
    this.ufo_mode;
    this.coinGeometries = [];
    this.numCoinVertices;
    this.gl;
    this.shaderProgram;
    this.pMatrix = mat4.create();
    this.angle = 0;
    this.last = 0;
    this.forward = vec3.create([0, 0.9924753308296204, -0.12244734913110733]);
    this.up = vec3.create([0, 0, 1, 0]);
    this.positionActor = vec3.create([12, 0, 1.2, 1]);
    this.velocity = 0.20;
    this.vertical_angular_velocity = 0;
    this.roll_angular_velocity = 0;
    this.mountainVertexPositionBuffer;
    this.mountainVertexNormalBuffer;
    this.coinBoundingBox;
    this.coinTranslationOffset = [5, 1, -3]; 
    this.collided = false; 
    this.points = 0
  }

  async initializeAndStart() {
    // Get option values
    this.terrain_size = parseFloat($('#terrain_size').val());
    this.size_x = parseFloat($('#size_x').val());
    this.size_y = parseFloat($('#size_y').val());
    this.noise_size_x = parseFloat($('#noise_size_x').val());
    this.noise_size_y = parseFloat($('#noise_size_y').val());
    this.max_height = parseFloat($('#max_height').val());
    this.positionActor = vec3.create([this.terrain_size / 2, 0, 1.2, 1]);

    // Start the program
    this.main(document.getElementById("canvas"));
  }

  isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }


 createTexture(url) {
  const texture = create1PixelTexture(this.gl, [128, 192, 255, 255]);
  // Asynchronously load an image
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // Now that the image has loaded make copy it to the texture.
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,this.gl.UNSIGNED_BYTE, image);

    // Check if the image is a power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       this.gl.generateMipmap(this.gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
       this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
       this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
       this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    }
  });
  return texture;
}




 parseMTL(text) {
    const materials = {};
    let material;

    const keywords = {
        newmtl(parts, unparsedArgs) {
            material = {};
            materials[unparsedArgs] = material;
        },
        /* eslint brace-style:0 */
        Ns(parts)       { material.shininess      = parseFloat(parts[0]); },
        Ka(parts)       { material.ambient        = parts.map(parseFloat); },
        Kd(parts)       { material.diffuse        = parts.map(parseFloat); },
        Ks(parts)       { material.specular       = parts.map(parseFloat); },
        Ke(parts)       { material.emissive       = parts.map(parseFloat); },
        map_Kd(parts, unparsedArgs)   { material.diffuseMap = unparsedArgs; },
        map_Ns(parts, unparsedArgs)   { material.specularMap = unparsedArgs; },
        map_Bump(parts, unparsedArgs) { material.normalMap = unparsedArgs; },
        Ni(parts)       { material.opticalDensity = parseFloat(parts[0]); },
        d(parts)        { material.opacity        = parseFloat(parts[0]); },
        illum(parts)    { material.illum          = parseInt(parts[0]); },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    return materials;
}



setMaterialProperties(material) {
  if (!material) {
      console.error("Material is undefined");
      return;
  }

  // Set diffuse color
  if (material.diffuse) {
      const [r, g, b] = material.diffuse;
      this.gl.uniform3f(this.gl.getUniformLocation(this.shaderProgram, "uDiffuseColor"), r, g, b);
  } else {
      console.error("Diffuse color not found in material:", material);
  }

  // Set specular color
  if (material.specular) {
      const [r, g, b] = material.specular;
      this.gl.uniform3f(this.gl.getUniformLocation(this.shaderProgram, "uSpecularColor"), r, g, b);
  } else {
      console.error("Specular color not found in material:", material);
  }

  // Set shininess
  if (material.shininess !== undefined) {
      this.gl.uniform1f(this.gl.getUniformLocation(this.shaderProgram, "uShininess"), material.shininess);
  } else {
      console.error("Shininess not found in material:", material);
  }

}

async loadSpaceshipModel(scaleFactor, translation) {
  const objHref = '../solar.obj'; // Sostituisci con il percorso corretto del file OBJ
  const mtlHref = '../solar.mtl'; // Sostituisci con il percorso corretto del file MTL

  // Carica il file MTL
  const mtlResponse = await fetch(mtlHref);
  const mtlText = await mtlResponse.text();
  const mtlData = this.parseMTL(mtlText); // Devi implementare la funzione parseMTL

  // Carica il file OBJ
  const objResponse = await fetch(objHref);
  const objText = await objResponse.text();
  const objData = parseOBJ(objText);

  // Continua solo se sia l'OBJ che l'MTL sono stati caricati correttamente
  if (objData && objData.geometries && objData.geometries.length > 0 && mtlData) {
    // Itera sui materiali nel file MTL
    for (const materialName in mtlData) {
      // console.log(materialName)
      const material = mtlData[materialName];
      // Associa il materiale ai vertici corrispondenti nell'OBJ
      for (let i = 0; i < objData.geometries.length; i++) {
        const geometry = objData.geometries[i];
        if (geometry.material === materialName) {
          geometry.material = material;
        }
      }
    }

    // Continua il caricamento del modello OBJ
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    if (objData && objData.geometries && objData.geometries.length > 0) {
      for (let i = 0; i < objData.geometries.length; i++) {
        const geometry = objData.geometries[i];
        const data = geometry.data;
        if (data.position && data.normal) {
          const positions = data.position.map((pos, index) => {
            // Scale each coordinate by scaleFactor
            return pos * scaleFactor;
          });

          // Apply rotation (rotate around the y-axis by 90 degrees)
          const rotationAngle = Math.PI / 2; // 90 degrees in radians
          for (let j = 0; j < positions.length; j += 3) {
            // Rotate each vertex position
            const x = positions[j];
            const z = positions[j + 2];
            positions[j] = x * Math.cos(rotationAngle) - z * Math.sin(rotationAngle);
            positions[j + 2] = x * Math.sin(rotationAngle) + z * Math.cos(rotationAngle);
          }

          // Apply translation
          for (let j = 0; j < positions.length; j += 3) {
            positions[j] += translation[0]; // x
            positions[j + 1] += translation[1]; // y
            positions[j + 2] += translation[2]; // z

            // Update bounding box coordinates
            minX = Math.min(minX, positions[j]);
            minY = Math.min(minY, positions[j + 1]);
            minZ = Math.min(minZ, positions[j + 2]);
            maxX = Math.max(maxX, positions[j]);
            maxY = Math.max(maxY, positions[j + 1]);
            maxZ = Math.max(maxZ, positions[j + 2]);
          }

          const normals = data.normal;

          const verticesBuffer = this.gl.createBuffer();
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, verticesBuffer);
          this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

          const normalsBuffer = this.gl.createBuffer();
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalsBuffer);
          this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);

          // Retrieve material information from MTL
          const material = geometry.material;

          this.coinGeometries.push({
            verticesBuffer: verticesBuffer,
            normalsBuffer: normalsBuffer,
            numVertices: positions.length / 3,
            material: material // Aggiungi il materiale al geometria
          });
        }
      }
      this.numCoinVertices = this.coinGeometries.reduce((total, geometry) => total + geometry.numVertices, 0);
    }

    // Store bounding box dimensions
    const boundingBox = {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ }
    };
    this.coinBoundingBox = boundingBox;

  } else {
    console.error('Failed to load OBJ or MTL file.');
  }
}



async recreateSpaceship() {
  // Remove all geometries of the current spaceship
  this.coinGeometries = [];

  // Generate new random coordinates within the bounds of the terrain
  const randomX = Math.random() * this.terrain_size;
  const randomY = Math.random() * this.terrain_size;

  const randomZ = 2; // Assuming the spaceship is on the surface of the terrain
  this.coinTranslationOffset = [randomX, randomY, randomZ];

  // Create a new spaceship with a new position and translation
  await this.loadSpaceshipModel(0.03, this.coinTranslationOffset);

  // Reset the collision flag
  this.collided = false;
}


  async main(canvas) {
    this.initGL(canvas);
    this.coinTranslationOffset = [6, 1, 1]
    this.initBuffers();
    this.initShaders();
    
    await this.loadSpaceshipModel(0.03,this.coinTranslationOffset);

    this.gl.clearColor(0.5, 0.7, 1.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.tick();
  }

  initGL(canvas) {
    try {
      this.gl = canvas.getContext("webgl");
      if (!this.gl) {
        this.gl = canvas.getContext("experimental-webgl");
      }
      if (!this.gl) {
        throw new Error("WebGL context could not be initialized.");
      }
      this.gl.viewportWidth = canvas.width;
      this.gl.viewportHeight = canvas.height;
    } catch (e) {
      console.error("Error initializing WebGL:", e.message);
    }
  }

  initShaders() {
    const vertexShader = this.getShader(this.gl, "shader-vs-mountain");
    const fragmentShader = this.getShader(this.gl, "shader-fs-mountain");

    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      alert("Could not initialize shader program.");
    }

    this.gl.useProgram(program);

    // Set vertex attribute locations
    program.vertexPositionAttribute = this.gl.getAttribLocation(program, "aVertexPosition");
    this.gl.enableVertexAttribArray(program.vertexPositionAttribute);

    program.vertexNormalAttribute = this.gl.getAttribLocation(program, "aVertexNormal");
    this.gl.enableVertexAttribArray(program.vertexNormalAttribute);

    // Set uniform locations
    program.pMatrixUniform = this.gl.getUniformLocation(program, "uPMatrix");
    program.useLightingUniform = this.gl.getUniformLocation(program, "uUseLighting");
    program.ambientColorUniform = this.gl.getUniformLocation(program, "uAmbientColor");
    program.lightingDirectionUniform = this.gl.getUniformLocation(program, "uLightingDirection");
    program.directionalColorUniform = this.gl.getUniformLocation(program, "uDirectionalColor");
    program.positionUniform = this.gl.getUniformLocation(program, "uPosition");
    program.forwardUniform = this.gl.getUniformLocation(program, "uForward");
    program.upUniform = this.gl.getUniformLocation(program, "uUp");

    this.shaderProgram = program;
  }

  setMatrixUniforms() {
    this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
  }

  initBuffers() {
    const mountain = MountainGenerator.generateMountain(this.terrain_size, this.size_x, this.size_y, this.noise_size_x, this.noise_size_y, this.max_height);
    const mountainVertices = mountain[0];
    const mountainNormals = mountain[1];

    this.mountainVertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mountainVertexPositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mountainVertices), this.gl.STATIC_DRAW);
    this.mountainVertexPositionBuffer.itemSize = 3;
    this.mountainVertexPositionBuffer.numItems = mountainVertices.length / 3;

    this.mountainVertexNormalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mountainVertexNormalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mountainNormals), this.gl.STATIC_DRAW);
    this.mountainVertexNormalBuffer.itemSize = 3;
    this.mountainVertexNormalBuffer.numItems = mountainNormals.length / 3;
  }


  checkCollision() {
    if (!this.coinBoundingBox) {
        // Spaceship bounding box not initialized
        return false;
    }

    // Get your position (assuming it's stored in this.positionActor)
    const myPosition = this.positionActor;

    // Check for collision between your position and the spaceship's bounding box
    const spaceshipMin = this.coinBoundingBox.min;
    const spaceshipMax = this.coinBoundingBox.max;

    // Check if your position is within the bounding box of the spaceship
    if (
        myPosition[0] >= spaceshipMin.x && myPosition[0] <= spaceshipMax.x &&
        myPosition[1] >= spaceshipMin.y && myPosition[1] <= spaceshipMax.y &&
        myPosition[2] >= spaceshipMin.z && myPosition[2] <= spaceshipMax.z
    ) {
        // Collision detected
        this.points += 1
        return true;
    }

    // No collision detected
    return false;
}




  async tick() {
    requestAnimationFrame(this.tick.bind(this));
    this.display();

            // Rilevamento della collisione
      if (!this.collided) { // Controlla se non è già stata gestita una collisione
        const collided = this.checkCollision();

        if (collided) {
          console.log("Collisione rilevata con l'oggetto caricato!");
          // Esegui altre azioni in risposta alla collisione, se necessario
          
          this.collided = true;
          await this.recreateSpaceship();
        }
      }

    const now = new Date().getTime();
    if (this.last != 0) {
      const delta = (now - this.last) / 1000;

      this.positionActor[0] += delta * this.velocity * this.forward[0];
      this.positionActor[1] += delta * this.velocity * this.forward[1];
      this.positionActor[2] += delta * this.velocity * this.forward[2];

      const n_fz = vec3.create();
      vec3.cross(this.forward, vec3.create([0, 0, 1]), n_fz);
      vec3.normalize(n_fz);
      const roll = vec3.dot(n_fz, this.up);

      const rotateMatrix = mat4.create();
      mat4.identity(rotateMatrix);
      mat4.rotate(rotateMatrix, -1 * delta * Math.tan(roll), this.up);
      mat4.multiplyVec3(rotateMatrix, this.forward);

      const right = vec3.create();
      vec3.cross(this.forward, this.up, right);
      mat4.identity(rotateMatrix);
      mat4.rotate(rotateMatrix, delta * this.vertical_angular_velocity, right);
      mat4.multiplyVec3(rotateMatrix, this.up);
      mat4.multiplyVec3(rotateMatrix, this.forward);

      mat4.identity(rotateMatrix);
      mat4.rotate(rotateMatrix, delta * this.roll_angular_velocity, this.forward);
      mat4.multiplyVec3(rotateMatrix, this.up);
    }
    this.last = now;
  }

  async display() {
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    mat4.perspective(90, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mountainVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.mountainVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mountainVertexNormalBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.uniform3f(this.shaderProgram.ambientColorUniform, 0.8, 0.8, 0.8);
    const lightingDirection = ufo_mode ? this.forward : [0, 0.8944714069366455, -0.44713249802589417];
    const adjustedLD = vec3.create();
    vec3.normalize(lightingDirection, adjustedLD);
    vec3.scale(adjustedLD, -1);
    this.gl.uniform3fv(this.shaderProgram.lightingDirectionUniform, adjustedLD);
    
    this.gl.uniform3f(this.shaderProgram.directionalColorUniform, 0.9, 0.9, 0.9);

    this.gl.uniform3fv(this.shaderProgram.positionUniform, this.positionActor);
    this.gl.uniform3fv(this.shaderProgram.forwardUniform, this.forward);
    this.gl.uniform3fv(this.shaderProgram.upUniform, this.up);

    this.setMatrixUniforms();
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.mountainVertexPositionBuffer.numItems);
    if (this.coinGeometries.length > 0) {
      for (let i = 0; i < this.coinGeometries.length; i++) {
        const geometry = this.coinGeometries[i];
        const material = geometry.material;
        // Set material properties
        this.setMaterialProperties(material);
  
        // Bind vertex buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.verticesBuffer);
        this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);
  
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.normalsBuffer);
        this.gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, 3, this.gl.FLOAT, false, 0, 0);
  
        // Draw geometry
        this.setMatrixUniforms();
        this.gl.drawArrays(this.gl.TRIANGLES, 0, geometry.numVertices);
      }
    } 
    document.getElementById('score-display').innerText = `Punteggio: ${this.points}`;
  }

  getShader(gl, id) {
    const script = document.getElementById(id);
    if (!script) return null;

    let source = "";
    let currentElement = script.firstChild;
    while (currentElement) {
      if (currentElement.nodeType == 3) {
        source += currentElement.textContent;
      }
      currentElement = currentElement.nextSibling;
    }

    let shader;
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

  // Function to handle key down events
  handleKeyDown(e) {
    var key;
    if (typeof (e) != "number") {
      key = e.keyCode;
    } else {
      key = e;
    }

    var right = vec3.create();
    vec3.cross(this.forward, this.up, right);
    var rotateMatrix = mat4.create();
    mat4.identity(rotateMatrix);
    switch (key) {
      case 87: // w
        this.vertical_angular_velocity = -0.30;
        break;
      case 83: // s
        this.vertical_angular_velocity = 0.30;
        break;
      case 65: // a
        this.roll_angular_velocity = -0.30;
        break;
      case 68: // d
        this.roll_angular_velocity = 0.30;
        break;
      case 189: // -
        this.velocity -= 0.01;
        break;
      case 187: // +
        this.velocity += 0.01;
        break;
    }
  }

  // Function to handle key up events
  handleKeyUp(e) {
    const key = e.keyCode;

    if (key === 83 || key === 87) { // s o w
      this.vertical_angular_velocity = 0;
    }
    if (key === 65 || key === 68) { // a o d
      this.roll_angular_velocity = 0;
    }
  }

  // Method to bind key down and key up events
  bindKeyEvents() {
    $(document).bind('keydown', this.handleKeyDown.bind(this));

    $(document).bind('keyup', this.handleKeyUp.bind(this));

    // Bind events for arrow buttons
    document.querySelectorAll(".arrow-key").forEach(function (button) {
      button.addEventListener("click", function () {
        var keyCode = parseInt(button.getAttribute("data-key"));
        this.handleKeyDown(keyCode);
      }.bind(this));
    }.bind(this));
  }

}

$(document).ready(function(){
  $('#start').click(function(){
    $('#ufo_mode').change(function(){
      ufo_mode = $(this).prop('checked');
    });

    const webGLApp = new WebGLApp();
    webGLApp.initializeAndStart();
    webGLApp.bindKeyEvents();
  });
});
