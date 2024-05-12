const toggleLightsButton = document.querySelector(
    "#toggle-lights-button"
  );
  // lightsEnabled = true; // Aggiungi questa variabile globale per tenere traccia dello stato delle luci

  toggleLightsButton.addEventListener("click", () => {
    lightsEnabled = !lightsEnabled; // Cambia lo stato delle luci

    // Modifica il testo del pulsante in base allo stato delle luci
    toggleLightsButton.textContent = lightsEnabled
      ? "Light: On"
      : "Light: Off";
  });