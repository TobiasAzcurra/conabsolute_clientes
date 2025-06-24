const getCurrentTimeInArgentina = () => {
  const now = new Date();
  const argentinaTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
  );
  return argentinaTime;
};

export const isWithinOrderTimeRange = () => {
  const currentTime = getCurrentTimeInArgentina();

  // Morning range (10:00 - 13:59)
  const morningStartTime = new Date(currentTime);
  morningStartTime.setHours(10, 0, 0, 0);
  const morningEndTime = new Date(currentTime);
  morningEndTime.setHours(13, 59, 59, 999);

  // Evening range (20:00 - 23:59)
  const eveningStartTime = new Date(currentTime);
  eveningStartTime.setHours(20, 0, 0, 0);
  const eveningEndTime = new Date(currentTime);
  eveningEndTime.setHours(23, 59, 59, 999);

  // Check if current time falls within either range
  const isInMorningRange = currentTime >= morningStartTime && currentTime <= morningEndTime;
  const isInEveningRange = currentTime >= eveningStartTime && currentTime <= eveningEndTime;

  return isInMorningRange || isInEveningRange;
};

export const isWithinClosedDays = () => {
  const currentTime = getCurrentTimeInArgentina();
  const currentDay = currentTime.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado

  // Verificamos si es lunes (1), martes (2) o miércoles (3)
  return currentDay >= 1 && currentDay <= 2;
};