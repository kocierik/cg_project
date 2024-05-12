var fullscreenButton = document.getElementById("fullscreenButton");

// Aggiungi un listener per il click sul bottone
fullscreenButton.addEventListener("click", function () {
  var canvas = document.getElementById("canvas");

  // Controlla se il browser supporta la modalità fullscreen
  if (document.fullscreenEnabled) {
    // Richiedi la modalità fullscreen per il canvas
    canvas.requestFullscreen();
  } else {
    alert("Fullscreen non supportato dal browser.");
  }
});