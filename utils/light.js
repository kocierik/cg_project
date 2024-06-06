const toggleLightsButton = document.querySelector(
    "#toggle-lights-button"
  );

  toggleLightsButton.addEventListener("click", () => {
    lightsEnabled = !lightsEnabled; 

    toggleLightsButton.textContent = lightsEnabled
      ? "Light: On"
      : "Light: Off";
  });


