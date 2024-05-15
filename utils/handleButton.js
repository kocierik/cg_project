window.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("mySlider");
  const fovText = document.getElementById("fovText");

  slider.addEventListener("input", function () {
    const fovValue = parseInt(this.value);
    fov = fovValue;
    fovText.textContent = fovValue;
    updateFov(fov);
  });
});

window.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("lightx");
  const fovText = document.getElementById("lightxText");

  slider.addEventListener("input", function () {
    const fovValue = parseInt(this.value);
    lightx = fovValue;
    fovText.textContent = fovValue;
    updateFov(fov);
  });
});

window.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("lighty");
  const fovText = document.getElementById("lightyText");

  slider.addEventListener("input", function () {
    const fovValue = parseInt(this.value);
    lighty = fovValue;
    fovText.textContent = fovValue;
    updateFov(fov);
  });
});

window.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("lightz");
  const fovText = document.getElementById("lightzText");

  slider.addEventListener("input", function () {
    const fovValue = parseInt(this.value);
    lightz = fovValue;
    fovText.textContent = fovValue;
    updateFov(fov);
  });
});
