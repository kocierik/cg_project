// Function to check if a value is a power of 2.
function isPowerOf2(value) {
  return (value & (value - 1)) === 0; // Uses bitwise operations to check if value is a power of 2.
}

// Function to create a 1-pixel texture.
function create1PixelTexture(gl, pixel) {
  const texture = gl.createTexture(); // Create a new texture object.
  gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the texture as the current 2D texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
    new Uint8Array(pixel)); // Define a 1x1 pixel texture with the given color.
  return texture; // Return the created texture.
}

// Function to create a texture from an image URL.
function createTexture(gl, url) {
  // Create a 1-pixel placeholder texture with a default color.
  const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
  
  // Asynchronously load an image.
  const image = new Image();
  image.src = url; // Set the image source to the provided URL.
  image.addEventListener('load', function () {
      // Once the image has loaded, copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the texture as the current 2D texture.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // Flip the image's Y axis.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Copy the image to the texture.

      // Check if the image dimensions are powers of 2.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
          // If the image dimensions are powers of 2, generate mipmaps.
          gl.generateMipmap(gl.TEXTURE_2D);
      } else {
          // If not, disable mipmaps and set texture wrapping to clamp to edge.
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
  });
  return texture; // Return the texture object.
}
