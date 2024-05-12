var audio = document.getElementById("backgroundAudio");
var audioControlButton = document.getElementById("audioControl");

audioControlButton.addEventListener("click", function () {
if (audio.paused) {
    audio.play();
    audioControlButton.textContent = "Pause Audio";
} else {
    audio.pause();
    audioControlButton.textContent = "Play Audio";
}
});
