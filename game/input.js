// input.js — mouse, touch and keyboard input for Emberfall Saga.
// Pointer coordinates are converted from page space to the 1280x720 canvas
// using the stage's current scale, so taps work on desktop and phone alike.

export function attachInput(canvas, hooks) {
  function toCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    return { x: cx, y: cy };
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    hooks.onTap(toCanvas(e));
  });

  canvas.addEventListener('pointermove', (e) => {
    hooks.onHover(toCanvas(e));
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key;
    if (k === '1' || k === '2' || k === '3' || k === '4') {
      hooks.onActionKey(Number(k));
    } else if (k === 'Enter' || k === ' ') {
      hooks.onConfirm();
    } else if (k === 'Escape') {
      hooks.onBack();
    } else if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      hooks.onArrow(k);
    } else if (k === 'm' || k === 'M') {
      hooks.onMute();
    }
  });

  // Touch buttons in the HTML touch bar.
  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) muteBtn.addEventListener('click', () => hooks.onMute());
  const menuBtn = document.getElementById('btn-menu');
  if (menuBtn) menuBtn.addEventListener('click', () => hooks.onBack());
}
