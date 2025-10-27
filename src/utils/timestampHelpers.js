// utils/timestampHelpers.js - Utilidades centralizadas para timestamps
import { Timestamp, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

// ============================================
// CREACIÓN DE TIMESTAMPS
// ============================================

/**
 * Crea un timestamp del servidor (siempre UTC correcto)
 * Usar para: createdAt, updatedAt, y cualquier timestamp automático
 * @returns {FieldValue} serverTimestamp
 */
export const createServerTimestamp = () => {
  return serverTimestamp();
};

/**
 * Crea un timestamp del cliente (UTC desde el dispositivo)
 * ⚠️ USAR SOLO cuando serverTimestamp() no funciona
 * Casos de uso:
 * - Transactions que actualizan arrays (limitación de Firestore)
 * - Cuando necesitas el valor inmediato del timestamp
 *
 * Nota: Depende del reloj del dispositivo, puede tener desfase de milisegundos
 * vs serverTimestamp(), pero es aceptable para trazabilidad de stock.
 *
 * @returns {Timestamp} Firestore Timestamp generado en el cliente
 */
export const createClientTimestamp = () => {
  return Timestamp.now();
};

/**
 * Crea un timestamp a partir de una fecha/hora específica
 * Usar para: delays, reservas, fechas futuras calculadas en el cliente
 * @param {Date} date - Fecha a convertir
 * @returns {Timestamp} Firestore Timestamp
 */
export const createTimestamp = (date = new Date()) => {
  return Timestamp.fromDate(date);
};

/**
 * Crea un timestamp con delay en minutos desde ahora
 * @param {number} minutes - Minutos a agregar
 * @returns {Timestamp} Firestore Timestamp futuro
 */
export const createDelayedTimestamp = (minutes) => {
  const delayedDate = new Date();
  delayedDate.setMinutes(delayedDate.getMinutes() + minutes);
  return Timestamp.fromDate(delayedDate);
};

/**
 * Convierte milisegundos a Timestamp
 * @param {number} milliseconds - Milisegundos desde epoch
 * @returns {Timestamp} Firestore Timestamp
 */
export const createTimestampFromMillis = (milliseconds) => {
  return Timestamp.fromMillis(milliseconds);
};

/**
 * Parsea una hora en formato "HH:mm" y la convierte a Timestamp UTC
 * Asume que la hora es para HOY en el timezone especificado
 * @param {string} timeString - Hora en formato "HH:mm" (ej: "15:30")
 * @param {string} timezone - Zona horaria IANA
 * @returns {Timestamp} Firestore Timestamp en UTC
 */
export const parseTimeToTimestamp = (
  timeString,
  timezone = "America/Argentina/Buenos_Aires"
) => {
  try {
    if (!timeString || !timeString.includes(":")) {
      throw new Error("Formato de hora inválido");
    }

    const [hours, minutes] = timeString.split(":").map(Number);

    // Crear fecha con hora específica en timezone local
    const localDate = new Date();
    localDate.setHours(hours, minutes, 0, 0);

    // Convertir a UTC
    const utcDate = fromZonedTime(localDate, timezone);

    return Timestamp.fromDate(utcDate);
  } catch (error) {
    console.error("Error parseando hora a timestamp:", error);
    return Timestamp.now();
  }
};

/**
 * Convierte una fecha local del usuario a Timestamp UTC
 * @param {Date|string} localDate - Fecha en timezone local
 * @param {string} timezone - Zona horaria IANA
 * @returns {Timestamp} Firestore Timestamp en UTC
 */
export const createTimestampFromLocal = (
  localDate,
  timezone = "America/Argentina/Buenos_Aires"
) => {
  try {
    const date =
      typeof localDate === "string" ? new Date(localDate) : localDate;
    const utcDate = fromZonedTime(date, timezone);
    return Timestamp.fromDate(utcDate);
  } catch (error) {
    console.error("Error creando timestamp desde local:", error);
    return Timestamp.now();
  }
};

// ============================================
// FORMATEO DE TIMESTAMPS (display)
// ============================================

/**
 * Convierte un Firestore Timestamp a la zona horaria de la empresa
 * @param {Timestamp} firestoreTimestamp - Timestamp de Firestore
 * @param {string} timezone - Zona horaria IANA
 * @param {string} formatString - Formato de salida (default: 'dd/MM/yyyy HH:mm')
 * @returns {string} Fecha formateada en timezone local
 */
export const formatTimestampInTimezone = (
  firestoreTimestamp,
  timezone = "America/Argentina/Buenos_Aires",
  formatString = "dd/MM/yyyy HH:mm"
) => {
  if (!firestoreTimestamp) return "-";

  try {
    const utcDate = firestoreTimestamp.toDate();
    const zonedDate = toZonedTime(utcDate, timezone);
    return format(zonedDate, formatString);
  } catch (error) {
    console.error("Error formateando timestamp:", error);
    return "-";
  }
};

/**
 * Formatea un timestamp para mostrar solo la hora
 * @param {Timestamp} firestoreTimestamp - Timestamp de Firestore
 * @param {string} timezone - Zona horaria IANA
 * @returns {string} Hora formateada (ej: "15:30")
 */
export const formatTimeOnly = (
  firestoreTimestamp,
  timezone = "America/Argentina/Buenos_Aires"
) => {
  return formatTimestampInTimezone(firestoreTimestamp, timezone, "HH:mm");
};

/**
 * Formatea un timestamp para mostrar fecha completa con día de semana
 * @param {Timestamp} firestoreTimestamp - Timestamp de Firestore
 * @param {string} timezone - Zona horaria IANA
 * @returns {string} Fecha formateada (ej: "Lunes, 06/10/2025 15:30")
 */
export const formatDateTimeFull = (
  firestoreTimestamp,
  timezone = "America/Argentina/Buenos_Aires"
) => {
  return formatTimestampInTimezone(
    firestoreTimestamp,
    timezone,
    "EEEE, dd/MM/yyyy HH:mm"
  );
};

// ============================================
// UTILIDADES DE TIMESTAMPS
// ============================================

/**
 * Calcula la diferencia entre dos timestamps en minutos
 * @param {Timestamp} start - Timestamp inicial
 * @param {Timestamp} end - Timestamp final
 * @returns {number} Diferencia en minutos
 */
export const getDifferenceInMinutes = (start, end) => {
  if (!start || !end) return 0;

  const startDate = start.toDate();
  const endDate = end.toDate();

  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Verifica si un timestamp es de hoy
 * @param {Timestamp} firestoreTimestamp - Timestamp de Firestore
 * @param {string} timezone - Zona horaria IANA
 * @returns {boolean} true si es de hoy
 */
export const isToday = (
  firestoreTimestamp,
  timezone = "America/Argentina/Buenos_Aires"
) => {
  if (!firestoreTimestamp) return false;

  const utcDate = firestoreTimestamp.toDate();
  const zonedDate = toZonedTime(utcDate, timezone);
  const today = toZonedTime(new Date(), timezone);

  return (
    zonedDate.getDate() === today.getDate() &&
    zonedDate.getMonth() === today.getMonth() &&
    zonedDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Verifica si un valor es un serverTimestamp pendiente
 * @param {any} value - Valor a verificar
 * @returns {boolean}
 */
export const isPendingServerTimestamp = (value) => {
  return value && typeof value === "object" && "_methodName" in value;
};
