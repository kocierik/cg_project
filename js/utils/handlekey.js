// Funzione per gestire gli eventi di pressione dei tasti
function handleKeyDown(e) {
    var key
    if (typeof (e) != "number") {
      key = e.keyCode;
    } else {
      key = e
    }
  
    var right = vec3.create();
    vec3.cross(forward, up, right);
    var rotateMatrix = mat4.create();
    mat4.identity(rotateMatrix);
     switch (key) {
      case 87: // w
        vertical_angular_velocity = -0.30;
        break;
      case 83: // s
        vertical_angular_velocity = 0.30;
        break;
      case 65: // a
        roll_angular_velocity = -0.30;
        break;
      case 68: // d
        roll_angular_velocity = 0.30;
        break;
      case 189: // -
        velocity -= 0.01;
        break;
      case 187: // +
        velocity += 0.01;
        break;
    }
  }
  
  // Bind degli eventi di pressione dei tasti
  $(document).bind('keydown', handleKeyDown);
  // Bind degli eventi di click per i bottoni delle frecce direzionali
  document.querySelectorAll(".arrow-key").forEach(function(button) {
    button.addEventListener("click", function() {
      var keyCode = parseInt(button.getAttribute("data-key"));
      handleKeyDown(keyCode);
    });
  });
  
  
  // Funzione per gestire gli eventi di rilascio dei tasti
  function handleKeyUp(e) {
    const key = e.keyCode;
  
    if (key === 83 || key === 87) { // s o w
      vertical_angular_velocity = 0;
    }
    if (key === 65 || key === 68) { // a o d
      roll_angular_velocity = 0;
    }
  }
  
  // Bind degli eventi di rilascio dei tasti
  $(document).bind('keyup', handleKeyUp);
  