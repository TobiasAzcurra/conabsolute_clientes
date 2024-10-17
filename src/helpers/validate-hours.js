const getCurrentTimeInArgentina = () => {
  const now = new Date();
  const argentinaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }),
  );
  return argentinaTime;
};

export const isWithinOrderTimeRange = () => {
  const currentTime = getCurrentTimeInArgentina();
  const startTime = new Date(currentTime); // 20:00 hs
  startTime.setHours(20, 0, 0, 0);

  const endTime = new Date(currentTime); // 23:50 hs
  endTime.setHours(23, 50, 0, 0);

  return currentTime >= startTime && currentTime <= endTime;
};
