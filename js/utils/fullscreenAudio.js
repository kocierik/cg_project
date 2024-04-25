var audio = document.getElementById("backgroundAudio");
audio.play();

var fullscreenButton = document.getElementById("fullscreenButton");

// Aggiungi un listener per il click sul bottone
fullscreenButton.addEventListener("click", function() {
  var canvas = document.getElementById("canvas");

  // Controlla se il browser supporta la modalità fullscreen
  if (document.fullscreenEnabled) {
    // Richiedi la modalità fullscreen per il canvas
    canvas.requestFullscreen();
  } else {
    alert("Fullscreen non supportato dal browser.");
  }
});



// This is needed if the images are not on the same domain
// NOTE: The server providing the images must give CORS permissions
// in order to be able to use the image with WebGL. Most sites
// do NOT give permission.
// See: http://webgl2fundamentals.org/webgl/lessons/webgl-cors-permission.html
function requestCORSIfNotSameOrigin(img, url) {
  if ((new URL(url, window.location.href)).origin !== window.location.origin) {
    img.crossOrigin = "";
  }
}