// Verificar si la empresa está abierta AHORA
export const isBusinessOpen = (businessHours) => {
  if (!businessHours?.schedule) return true; // Fallback: permitir pedido

  const timezone = businessHours.timezone || "America/Argentina/Buenos_Aires";
  const now = new Date();

  // Convertir a timezone de la empresa
  const localTime = new Intl.DateTimeFormat("es-AR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  }).formatToParts(now);

  const weekdayMap = {
    lunes: "monday",
    martes: "tuesday",
    miércoles: "wednesday",
    jueves: "thursday",
    viernes: "friday",
    sábado: "saturday",
    domingo: "sunday",
  };

  const currentWeekday =
    weekdayMap[localTime.find((p) => p.type === "weekday").value];
  const currentTime = `${localTime.find((p) => p.type === "hour").value}:${
    localTime.find((p) => p.type === "minute").value
  }`;

  // TODO: Verificar specialDates si existen

  const daySchedule = businessHours.schedule[currentWeekday];

  if (!daySchedule?.isOpen) {
    return {
      isOpen: false,
      reason: "closed_today",
      message: "Lo sentimos, hoy estamos cerrados",
    };
  }

  // Verificar timeSlots
  const isInTimeSlot = daySchedule.timeSlots?.some((slot) => {
    return currentTime >= slot.openTime && currentTime <= slot.closeTime;
  });

  if (!isInTimeSlot) {
    const nextSlot = daySchedule.timeSlots?.[0];
    return {
      isOpen: false,
      reason: "outside_hours",
      message: `Estamos cerrados. Abrimos a las ${
        nextSlot?.openTime || "09:00"
      }`,
      nextOpenTime: nextSlot?.openTime,
    };
  }

  return { isOpen: true };
};
