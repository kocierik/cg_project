var fullscreenButton = document.getElementById("fullscreenButton");

fullscreenButton.addEventListener("click", function () {
  var canvas = document.getElementById("canvas");

  if (document.fullscreenEnabled) {
    canvas.requestFullscreen();
  } else {
    alert("Fullscreen non supportato dal browser.");
  }
});