// Variabili per memorizzare lo stato dei tasti
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    plus: false,
    minus: false,
    '-': false,
    '+': false
  };

  // Event listeners per i tasti
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    keys[key] = true;
    updateCameraPosition();
  }

  function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    keys[key] = false;
    updateCameraPosition();
  }

  // Event listeners per i bottoni direzionali
  document.querySelectorAll(".arrow-key").forEach(function (button) {
    const keyCode = button.getAttribute("data-key");

    button.addEventListener("mousedown", function (e) {
      keys[keyCode] = true;
      updateCameraPosition();
    });

    button.addEventListener("mouseup", function (e) {
      keys[keyCode] = false;
      updateCameraPosition();
    });

    button.addEventListener("mouseout", function (e) {
      keys[keyCode] = false;
      updateCameraPosition();
    });
  });



  // Funzione per aggiornare la posizione della camera in base ai tasti premuti
  function updateCameraPosition() {
    if (keys['w']) {
      m4.translate(cameraPositionMain, 0, 0, -velocity, cameraPositionMain);
    }
    if (keys['a']) {
      m4.translate(cameraPositionMain, -velocity, 0, 0, cameraPositionMain);
    }
    if (keys['s']) {
      m4.translate(cameraPositionMain, 0, 0, velocity, cameraPositionMain);
    }
    if (keys['d']) {
      m4.translate(cameraPositionMain, velocity, 0, 0, cameraPositionMain);
      // cameraPositionMain = m4.translation(10, 10, 10);
    }
    if (keys['ArrowUp']) {
      m4.translate(cameraPositionMain, 0, velocity, 0, cameraPositionMain);
    }
    if (keys['ArrowDown']) {
      m4.translate(cameraPositionMain, 0, -velocity, 0, cameraPositionMain);
    }
    if (keys['ArrowLeft']) {
      m4.yRotate(cameraPositionMain, degToRad(0.5), cameraPositionMain);
      m4.zRotate(spaceshipCamera, degToRad(-0.1), spaceshipCamera);
      initialSpaceshipRotation -= 0.1
    }
    if (keys['ArrowRight']) {
      m4.yRotate(cameraPositionMain, degToRad(-0.5), cameraPositionMain);
      m4.zRotate(spaceshipCamera, degToRad(0.1), spaceshipCamera);
      initialSpaceshipRotation += 0.1
    }
    if (keys['arrowup']) {
      m4.translate(cameraPositionMain, 0, velocity, 0, cameraPositionMain);
    }
    if (keys['arrowdown']) {
      m4.translate(cameraPositionMain, 0, -velocity, 0, cameraPositionMain);
    }
    if (keys['arrowleft']) {
      m4.yRotate(cameraPositionMain, degToRad(0.5), cameraPositionMain);
      m4.zRotate(spaceshipCamera, degToRad(-0.1), spaceshipCamera);
      initialSpaceshipRotation -= 0.1
    }
    if (keys['arrowright']) {
      m4.yRotate(cameraPositionMain, degToRad(-0.5), cameraPositionMain);
      m4.zRotate(spaceshipCamera, degToRad(0.1), spaceshipCamera);
      initialSpaceshipRotation += 0.1
    }
    if (keys['plus']) {
      velocity += 1
    }
    if (keys['minus']) {
      velocity--
    }
    if (keys['+']) {
      velocity += 1
    }
    if (keys['-']) {
      velocity--
    }
  }