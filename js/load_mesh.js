// async function loadMTLFile(MTLfileName) {
//     try {
//         const result = await $.ajax({
//             type: "GET",
//             url: MTLfileName,
//             dataType: "text",
//         });
//         return parseMTL(result);
//     } catch (error) {
//         console.error('Error loading MTL file:', error);
//         throw error; // Rilancia l'errore per gestirlo nell'ambito chiamante, se necessario
//     }
// }












// /*========== Loading and storing the geometry ==========*/
// async function LoadMesh(gl,mesh) {
//     await retrieveDataFromSource(mesh);
//     console.log(mesh)
//     mesh.textures =[];

//     let baseHref = mesh.sourceMesh;
//     const r = /[^\/]*$/;
//     baseHref = baseHref.replace(r, '');

//     mesh.textures = {
//         defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
//     };

//     for (const material of Object.values(mesh.materials)) {
//         for (const [key1, filename] of Object.entries(material)
//             .filter(([key]) => key.endsWith('Map'))) {
//                 let texture = mesh.textures[filename];
//                 if (!texture) {
//                     const textureHref = baseHref + filename
//                     texture = await createTexture(gl, textureHref).catch(error => alert(error.message));
//                     mesh.textures[filename] = texture;
//                 }
//                 material[key1] = texture;
//             }
//     }

//     await Promise.resolve(mesh)
// }


// //Funzione che serve per recuperare i dati della mesh da un file OBJ
// async function retrieveDataFromSource(mesh){
//     await loadMeshFromOBJ(mesh);
//     if(mesh.fileMTL) {
//         await readMTLFile(mesh.fileMTL, mesh.data);

//         mesh.materials = mesh.data.materials;
//         delete mesh.data.materials;
//     }
// }



// //Funzione che utilizza la libreria glm_utils per leggere un file OBJ
// //contenente la definizione della mesh
// async function loadMeshFromOBJ(mesh) {
//     return $.ajax({
//         type: "GET",
//         url: mesh.sourceMesh,
//         dataType: "text",
//         async: false,
//         success: parseobjFile,
//         error: handleError,
//     });

//     function parseobjFile(result){
//         mesh.data = parseOBJ(result)
//     }

//     function handleError(jqXhr, textStatus, errorMessage){
//         console.error('Error : ' + errorMessage);
//     }
// }


function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

//Funzione che carica una texture
async function loadTexture(gl, path, fileName) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType, pixel);

    if(fileName){
        const image = new Image();
        image.onload = function() {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,srcFormat, srcType, image);
            if (isPowerOf2(image.width) && isPowerOf2(image.height))
                gl.generateMipmap(gl.TEXTURE_2D); // Yes, it's a power of 2. Generate mips.
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
        };
        image.src = path + fileName;
    }
    return texture;
}

// //Funzione che utilizza la libreria glm_utils per leggere un eventuale 
// //file MTL associato alla mesh
// async function readMTLFile(MTLfileName, mesh){
//     return $.ajax({
//         type: "GET",
//         url: MTLfileName,
//         dataType: "text",
//         async: false,
//         success: parseMTLFile,
//         error: handleError,
//     });
//     function parseMTLFile(result){
//         //glmReadMTL(result, mesh);
//         mesh.materials = parseMTL(result);
//     }
//     function handleError(jqXhr, textStatus, errorMessage){
//         console.error('Error : ' + errorMessage);
//     }
// }


// async function getMTLFile(MTLfileName, mesh){
//     return $.ajax({
//         type: "GET",
//         url: MTLfileName,
//         dataType: "text",
//         async: false,
//         success: parseMTLFile,
//         error: handleError,
//     });
//     function parseMTLFile(result){
//         let mtl = parseMTL(result)

//     }
//     function handleError(jqXhr, textStatus, errorMessage){
//         console.error('Error : ' + errorMessage);
//     }
// }


// function parseMTL(text) {
//     const materials = {};
//     let material;

//     const keywords = {
//         newmtl(parts, unparsedArgs) {
//             material = {};
//             materials[unparsedArgs] = material;
//         },
//         /* eslint brace-style:0 */
//         Ns(parts)       { material.shininess      = parseFloat(parts[0]); },
//         Ka(parts)       { material.ambient        = parts.map(parseFloat); },
//         Kd(parts)       { material.diffuse        = parts.map(parseFloat); },
//         Ks(parts)       { material.specular       = parts.map(parseFloat); },
//         Ke(parts)       { material.emissive       = parts.map(parseFloat); },
//         map_Kd(parts, unparsedArgs)   { material.diffuseMap = unparsedArgs; },
//         map_Ns(parts, unparsedArgs)   { material.specularMap = unparsedArgs; },
//         map_Bump(parts, unparsedArgs) { material.normalMap = unparsedArgs; },
//         Ni(parts)       { material.opticalDensity = parseFloat(parts[0]); },
//         d(parts)        { material.opacity        = parseFloat(parts[0]); },
//         illum(parts)    { material.illum          = parseInt(parts[0]); },
//     };

//     const keywordRE = /(\w*)(?: )*(.*)/;
//     const lines = text.split('\n');
//     for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
//         const line = lines[lineNo].trim();
//         if (line === '' || line.startsWith('#')) {
//             continue;
//         }
//         const m = keywordRE.exec(line);
//         if (!m) {
//             continue;
//         }
//         const [, keyword, unparsedArgs] = m;
//         const parts = line.split(/\s+/).slice(1);
//         const handler = keywords[keyword];
//         if (!handler) {
//             console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
//             continue;
//         }
//         handler(parts, unparsedArgs);
//     }

//     return materials;
// }

// function create1PixelTexture(gl, pixel) {
//     const texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
//         new Uint8Array(pixel));
//     return texture;
// }

// async function createTexture(gl, url) {
//     const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
//     // Asynchronously load an image
//     const image = new Image();
//     image.src = url;
//     image.addEventListener('load', function() {
//         // Now that the image has loaded make copy it to the texture.
//         gl.bindTexture(gl.TEXTURE_2D, texture);
//         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
//         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

//         // Check if the image is a power of 2 in both dimensions.
//         if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
//             // Yes, it's a power of 2. Generate mips.
//             gl.generateMipmap(gl.TEXTURE_2D);
//         } else {
//             // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//         }
//     });
//     return texture;
// }

// function parseOBJ(text) {
//     // because indices are base 1 let's just fill in the 0th data
//     const objPositions = [[0, 0, 0]];
//     const objTexcoords = [[0, 0]];
//     const objNormals = [[0, 0, 0]];
//     const objColors = [[0, 0, 0]];

//     // same order as `f` indices
//     const objVertexData = [
//         objPositions,
//         objTexcoords,
//         objNormals,
//         objColors,
//     ];

//     // same order as `f` indices
//     let webglVertexData = [
//         [],   // positions
//         [],   // texcoords
//         [],   // normals
//         [],   // colors
//     ];

//     const materialLibs = [];
//     const geometries = [];
//     let geometry;
//     let groups = ['default'];
//     let material = 'default';
//     let object = 'default';

//     const noop = () => {};

//     function newGeometry() {
//         if (geometry && geometry.data.position.length) {
//             geometry = undefined;
//         }
//     }

//     function setGeometry() {
//         if (!geometry) {
//             const position = [];
//             const texcoord = [];
//             const normal = [];
//             const color = [];
//             webglVertexData = [
//                 position,
//                 texcoord,
//                 normal,
//                 color,
//             ];
//             geometry = {
//                 object,
//                 groups,
//                 material,
//                 data: {
//                     position,
//                     texcoord,
//                     normal,
//                     color,
//                 },
//             };
//             geometries.push(geometry);
//         }
//     }

//     function addVertex(vert) {
//         const ptn = vert.split('/');
//         ptn.forEach((objIndexStr, i) => {
//             if (!objIndexStr) {
//                 return;
//             }
//             const objIndex = parseInt(objIndexStr);
//             const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
//             webglVertexData[i].push(...objVertexData[i][index]);
//             // if this is the position index (index 0) and we parsed
//             // vertex colors then copy the vertex colors to the webgl vertex color data
//             if (i === 0 && objColors.length > 1) {
//                 geometry.data.color.push(...objColors[index]);
//             }
//         });
//     }

//     const keywords = {
//         v(parts) {
//             // if there are more than 3 values here they are vertex colors
//             if (parts.length > 3) {
//                 objPositions.push(parts.slice(0, 3).map(parseFloat));
//                 objColors.push(parts.slice(3).map(parseFloat));
//             } else {
//                 objPositions.push(parts.map(parseFloat));
//             }
//         },
//         vn(parts) {
//             objNormals.push(parts.map(parseFloat));
//         },
//         vt(parts) {
//             // should check for missing v and extra w?
//             objTexcoords.push(parts.map(parseFloat));
//         },
//         f(parts) {
//             setGeometry();
//             const numTriangles = parts.length - 2;
//             for (let tri = 0; tri < numTriangles; ++tri) {
//                 addVertex(parts[0]);
//                 addVertex(parts[tri + 1]);
//                 addVertex(parts[tri + 2]);
//             }
//         },
//         s: noop,    // smoothing group
//         mtllib(parts, unparsedArgs) {
//             // the spec says there can be multiple filenames here
//             // but many exist with spaces in a single filename
//             materialLibs.push(unparsedArgs);
//         },
//         usemtl(parts, unparsedArgs) {
//             material = unparsedArgs;
//             newGeometry();
//         },
//         g(parts) {
//             groups = parts;
//             newGeometry();
//         },
//         o(parts, unparsedArgs) {
//             object = unparsedArgs;
//             newGeometry();
//         },
//     };

//     const keywordRE = /(\w*)(?: )*(.*)/;
//     const lines = text.split('\n');
//     for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
//         const line = lines[lineNo].trim();
//         if (line === '' || line.startsWith('#')) {
//             continue;
//         }
//         const m = keywordRE.exec(line);
//         if (!m) {
//             continue;
//         }
//         const [, keyword, unparsedArgs] = m;
//         const parts = line.split(/\s+/).slice(1);
//         const handler = keywords[keyword];
//         if (!handler) {
//             console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
//             continue;
//         }
//         handler(parts, unparsedArgs);
//     }

//     // remove any arrays that have no entries.
//     for (const geometry of geometries) {
//         geometry.data = Object.fromEntries(
//             Object.entries(geometry.data).filter(([, array]) => array.length > 0));
//     }

//     return {
//         geometries,
//         materialLibs,
//     };
// }
