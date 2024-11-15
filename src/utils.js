// Function to check if it's the specified time (6:00 to 6:05)
export function isMorning() {
  const now = new Date();
  const hours = now.getHours(); // Get current hours
  const minutes = now.getMinutes(); // Get current minutes
  return hours === 6 && minutes >= 0 && minutes <= 5;
}

export function hourAlmostOver() {
  const now = new Date();
  const minutes = now.getMinutes();
  return minutes >= 54;
}
