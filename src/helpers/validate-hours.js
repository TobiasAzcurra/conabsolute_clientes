const getCurrentTimeInArgentina = () => {
  const now = new Date();
  const argentinaTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
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

export const cleanPhoneNumber = (phoneNumber) => {
  // Asegurarse de que phoneNumber es una cadena
  const phoneStr = String(phoneNumber);
  // Remover todo excepto los dígitos
  const digitsOnly = phoneStr.replace(/\D/g, '');
  // Si el número comienza con "54", eliminarlo
  const without54 = digitsOnly.startsWith('54')
    ? digitsOnly.slice(2)
    : digitsOnly;
  // Si el número comienza con "9", eliminarlo
  const without9 = without54.startsWith('9') ? without54.slice(1) : without54;
  // Si el número comienza con "0", eliminarlo
  const without0 = without9.startsWith('0') ? without9.slice(1) : without9;
  // Retornar el número limpio
  return without0;
};
