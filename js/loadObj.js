function parseOBJ(text) {
  // Initialize arrays with a default entry for base 1 indexing
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];
  const objColors = [[0, 0, 0]];

  // Container for vertex data in the order of `f` indices (position, texcoord, normal, color)
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
    objColors,
  ];

  // WebGL-ready vertex data storage
  let webglVertexData = [
    [], // positions
    [], // texcoords
    [], // normals
    [], // colors
  ];

  const materialLibs = []; // List of material libraries
  const geometries = []; // List of geometries
  let geometry; // Current geometry being processed
  let groups = ['default']; // Current groups
  let material = 'default'; // Current material
  let object = 'default'; // Current object

  // No-operation function
  const noop = () => { };

  // Function to start a new geometry if the current one is not empty
  function newGeometry() {
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  // Function to set up a new geometry
  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      const color = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
        color,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
          color,
        },
      };
      geometries.push(geometry);
    }
  }

  // Function to add a vertex to the current geometry
  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
      // Copy vertex colors if available
      if (i === 0 && objColors.length > 1) {
        geometry.data.color.push(...objColors[index]);
      }
    });
  }

  // Keyword handlers for the OBJ file format
  const keywords = {
    v(parts) {
      // Vertex position, and possibly color if more than 3 values
      if (parts.length > 3) {
        objPositions.push(parts.slice(0, 3).map(parseFloat));
        objColors.push(parts.slice(3).map(parseFloat));
      } else {
        objPositions.push(parts.map(parseFloat));
      }
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop, // Smoothing group
    mtllib(parts, unparsedArgs) {
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  // Regular expression to parse keywords and arguments
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
      console.warn('unhandled keyword:', keyword);
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // Filter out empty arrays in geometry data
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
      Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}

  
  function parseMapArgs(unparsedArgs) {
    return unparsedArgs;
  }

function parseMTL(text) {
    const materials = {};
    let material;

    // Keyword handlers for the MTL file format
    const keywords = {
      newmtl(parts, unparsedArgs) {
        material = {};
        materials[unparsedArgs] = material;
      },
      Ns(parts) { material.shininess = parseFloat(parts[0]); },
      Ka(parts) { material.ambient = parts.map(parseFloat); },
      Kd(parts) { material.diffuse = parts.map(parseFloat); },
      Ks(parts) { material.specular = parts.map(parseFloat); },
      Ke(parts) { material.emissive = parts.map(parseFloat); },
      map_Kd(parts, unparsedArgs) { material.diffuseMap = parseMapArgs(unparsedArgs); },
      map_Ns(parts, unparsedArgs) { material.specularMap = parseMapArgs(unparsedArgs); },
      map_Bump(parts, unparsedArgs) { material.normalMap = parseMapArgs(unparsedArgs); },
      Ni(parts) { material.opticalDensity = parseFloat(parts[0]); },
      d(parts) { material.opacity = parseFloat(parts[0]); },
      illum(parts) { material.illum = parseInt(parts[0]); },
    };

    // Regular expression to parse keywords and arguments
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
        console.warn('unhandled keyword:', keyword);
        continue;
      }
      handler(parts, unparsedArgs);
    }

    return materials;
  }
