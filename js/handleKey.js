// Variables to store the state of keys
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

// Event listeners for keyboard events
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// Function to handle keydown events
function handleKeyDown(event) {
const key = event.key.toLowerCase();
keys[key] = true;
updateCameraPosition();
}

// Function to handle keyup events
function handleKeyUp(event) {
const key = event.key.toLowerCase();
keys[key] = false;
updateCameraPosition();
}

// Event listeners for directional buttons
document.querySelectorAll(".arrow-key").forEach(function (button) {
const keyCode = button.getAttribute("data-key");

// Mouse down event
button.addEventListener("mousedown", function (e) {
  keys[keyCode] = true;
  updateCameraPosition();
});

// Mouse up event
button.addEventListener("mouseup", function (e) {
  keys[keyCode] = false;
  updateCameraPosition();
});

// Mouse out event
button.addEventListener("mouseout", function (e) {
  keys[keyCode] = false;
  updateCameraPosition();
});
});

// Function to update camera position based on pressed keys
function updateCameraPosition() {
// Move forwards
if (keys['w']) {
  m4.translate(cameraPositionMain, 0, 0, -velocity, cameraPositionMain);
}
// Move left
if (keys['a']) {
  m4.translate(cameraPositionMain, -velocity, 0, 0, cameraPositionMain);
}
// Move backwards
if (keys['s']) {
  m4.translate(cameraPositionMain, 0, 0, velocity, cameraPositionMain);
}
// Move right
if (keys['d']) {
  m4.translate(cameraPositionMain, velocity, 0, 0, cameraPositionMain);
}
// Look up
if (keys['ArrowUp']) {
  m4.translate(cameraPositionMain, 0, velocity, 0, cameraPositionMain);
}
// Look down
if (keys['ArrowDown']) {
  m4.translate(cameraPositionMain, 0, -velocity, 0, cameraPositionMain);
}
// Rotate left
if (keys['ArrowLeft']) {
  m4.yRotate(cameraPositionMain, degToRad(0.5), cameraPositionMain);
  m4.zRotate(spaceshipCamera, degToRad(-0.1), spaceshipCamera);
  initialSpaceshipRotation -= 0.1;
}
// Rotate right
if (keys['ArrowRight']) {
  m4.yRotate(cameraPositionMain, degToRad(-0.5), cameraPositionMain);
  m4.zRotate(spaceshipCamera, degToRad(0.1), spaceshipCamera);
  initialSpaceshipRotation += 0.1;
}
// Look up (alternative keys)
if (keys['arrowup']) {
  m4.translate(cameraPositionMain, 0, velocity, 0, cameraPositionMain);
}
// Look down (alternative keys)
if (keys['arrowdown']) {
  m4.translate(cameraPositionMain, 0, -velocity, 0, cameraPositionMain);
}
// Rotate left (alternative keys)
if (keys['arrowleft']) {
  m4.yRotate(cameraPositionMain, degToRad(0.5), cameraPositionMain);
  m4.zRotate(spaceshipCamera, degToRad(-0.1), spaceshipCamera);
  initialSpaceshipRotation -= 0.1;
}
// Rotate right (alternative keys)
if (keys['arrowright']) {
  m4.yRotate(cameraPositionMain, degToRad(-0.5), cameraPositionMain);
  m4.zRotate(spaceshipCamera, degToRad(0.1), spaceshipCamera);
  initialSpaceshipRotation += 0.1;
}
// Increase velocity
if (keys['plus'] || keys['+']) {
  velocity += 1;
}
// Decrease velocity
if (keys['minus'] || keys['-']) {
  velocity--;
}
}
