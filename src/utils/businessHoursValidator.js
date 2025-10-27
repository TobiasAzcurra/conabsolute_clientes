// Verificar si la empresa está abierta AHORA
export const isBusinessOpen = (businessHours) => {
  if (!businessHours?.schedule) return { isOpen: true }; // Fallback: permitir pedido

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

  // 1️⃣ PRIMERO: Verificar specialDates
  if (businessHours.specialDates?.length > 0) {
    const today = new Intl.DateTimeFormat("es-AR", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(now)
      .split("/")
      .reverse()
      .join("-"); // Formato: "2025-10-03"

    const specialDay = businessHours.specialDates.find(
      (sd) => sd.date === today
    );

    if (specialDay) {
      // Si el día especial está cerrado
      if (!specialDay.isOpen) {
        return {
          isOpen: false,
          reason: "special_date_closed",
          message: specialDay.reason || "Cerrado por fecha especial",
        };
      }

      // Si está abierto, verificar timeSlots especiales
      const isInSpecialSlot = specialDay.timeSlots?.some((slot) => {
        return currentTime >= slot.openTime && currentTime < slot.closeTime;
      });

      if (!isInSpecialSlot) {
        const nextSlot = specialDay.timeSlots?.[0];
        return {
          isOpen: false,
          reason: "outside_special_hours",
          message: `${specialDay.reason || "Horario especial"}. ${
            nextSlot ? `Abrimos a las ${nextSlot.openTime}` : "Estamos cerrados"
          }`,
          nextOpenTime: nextSlot?.openTime,
        };
      }

      // Está dentro del horario especial
      return { isOpen: true, reason: "special_date" };
    }
  }

  // 2️⃣ SEGUNDO: Si no hay fecha especial, usar horario regular
  const daySchedule = businessHours.schedule[currentWeekday];

  if (!daySchedule?.isOpen) {
    return {
      isOpen: false,
      reason: "closed_today",
      message: "Lo sentimos, hoy estamos cerrados",
    };
  }

  // Verificar timeSlots regulares
  const isInTimeSlot = daySchedule.timeSlots?.some((slot) => {
    return currentTime >= slot.openTime && currentTime < slot.closeTime;
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
