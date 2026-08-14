import confetti from 'canvas-confetti';

export function fireSuccessConfetti() {
  try {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']
    });
  } catch (err) {
    // Fail silently if canvas not supported
  }
}
