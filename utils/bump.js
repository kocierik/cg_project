const toggleBumpButton = document.querySelector(
    "#toggle-bump-button"
  );
  
  toggleBumpButton.addEventListener("click", () => {
    bumpEnabled = !bumpEnabled; 
  
    toggleBumpButton.textContent = bumpEnabled
      ? "Bump: On"
      : "Bump: Off";
  });