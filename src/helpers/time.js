export const adjustHora = (hora) => {
  const [hours, minutes] = hora.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() - 30);
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

export const getAvailableTimeSlots = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const allSlots = [
    '20:30',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
    '23:00',
    '23:30',
  ];

  const nextSlotMinutes =
    Math.ceil((currentHour * 60 + currentMinute) / 30) * 30 + 30;
  const nextSlotHour = Math.floor(nextSlotMinutes / 60);
  const nextSlotMinute = nextSlotMinutes % 60;

  return allSlots.filter((slot) => {
    let [h, m] = slot.split(':').map(Number);
    if (h === 0) h = 24;
    return h * 60 + m >= nextSlotHour * 60 + nextSlotMinute;
  });
};
