export const cleanPhoneNumber = (phoneNumber) => {
  const phoneStr = String(phoneNumber);
  const digitsOnly = phoneStr.replace(/\D/g, '');
  const without54 = digitsOnly.startsWith('54')
    ? digitsOnly.slice(2)
    : digitsOnly;
  const without9 = without54.startsWith('9') ? without54.slice(1) : without54;
  const without0 = without9.startsWith('0') ? without9.slice(1) : without9;
  return without0;
};
