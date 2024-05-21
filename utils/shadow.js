(function() {
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    // Vertex shader program
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying lowp vec4 vColor;
        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
    `;

    // Fragment shader program
    const fsSource = `
        varying lowp vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
        }
    `;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    const buffers = initBuffers(gl);

    function render() {
        drawScene(gl, programInfo, buffers);

        // Draw mirrored reflection
        const mirrorMatrix = m4.scaling(1, -1, 1);
        drawScene(gl, programInfo, buffers, mirrorMatrix);
    }

    render();

    function initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function initBuffers(gl) {
        const positions = [
            // Triangle vertices
            1.0,  1.0, 0.0,
           -1.0,  1.0, 0.0,
            1.0, -1.0, 0.0,
           -1.0, -1.0, 0.0,
        ];

        const colors = [
            // Vertex colors
            1.0,  1.0,  1.0,  1.0,    
            1.0,  0.0,  0.0,  1.0,    
            0.0,  1.0,  0.0,  1.0,    
            0.0,  0.0,  1.0,  1.0,    
        ];

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            color: colorBuffer,
        };
    }

    function drawScene(gl, programInfo, buffers, mirrorMatrix = null) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = 45 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = m4.perspective(fieldOfView, aspect, zNear, zFar);

        const modelViewMatrix = m4.identity();

        if (mirrorMatrix) {
            m4.multiply(modelViewMatrix, mirrorMatrix, modelViewMatrix);
        }

        m4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        }

        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
            gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        }

        gl.useProgram(programInfo.program);

        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        {
            const offset = 0;
            const vertexCount = 4;
            gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
        }
    }
})();











// function Shadows(){
//     // Obj containing all variables used for shadows
//     let shadow = [];

//     // Program used to draw from the light perspective
//     shadow.colorProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);

//     // Program used to draw from the camera perspective
//     shadow.textureProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

//     // Shadow map texture
//     shadow.depthTexture = gl.createTexture(); 
//     shadow.depthTextureSize = 2048; // Texture resolution
//     gl.bindTexture(gl.TEXTURE_2D, shadow.depthTexture);
//     gl.texImage2D(
//         gl.TEXTURE_2D,                 // target
//         0,                             // mip level
//         gl.DEPTH_COMPONENT,            // internal format
//         shadow.depthTextureSize,       // width
//         shadow.depthTextureSize,       // height
//         0,                             // border
//         gl.DEPTH_COMPONENT,            // format
//         gl.UNSIGNED_INT,               // type
//         null);                         // models
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

//     shadow.depthFramebuffer = gl.createFramebuffer();
//     // gl.bindFramebuffer(gl.FRAMEBUFFER, shadow.depthFramebuffer);
//     gl.framebufferTexture2D(
//         gl.FRAMEBUFFER,            // target
//         gl.DEPTH_ATTACHMENT,       // attachment point
//         gl.TEXTURE_2D,             // texture target
//         shadow.depthTexture,       // texture
//         0);                       // mip level

//     // Shadow settings
    
//     shadow.enable = false;
//     shadow.fov = 90;
//     shadow.projWidth = 3;
//     shadow.projHeight = 1;
//     shadow.zFarProj = 25;
//     shadow.bias = -0.0001;
//     shadow.showFrustum = false;

//     return shadow;
// }