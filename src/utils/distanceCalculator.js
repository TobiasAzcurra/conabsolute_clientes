/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {Array} coord1 - [lat, lng] del punto 1
 * @param {Array} coord2 - [lat, lng] del punto 2
 * @returns {number} - Distancia en kilómetros
 */
export const calculateHaversineDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length !== 2 || coord2.length !== 2) {
    console.warn("Coordenadas inválidas para calcular distancia");
    return null;
  }

  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  // Radio de la Tierra en km
  const R = 6371;

  // Convertir grados a radianes
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
};

/**
 * Calcula el costo de envío basado en la distancia
 * @param {number} distance - Distancia en km
 * @param {Object} pricingConfig - Configuración de precios
 * @returns {Object} - { fee, isWithinRange, details }
 */
export const calculateDeliveryFee = (distance, pricingConfig) => {
  if (!pricingConfig || distance === null) {
    return {
      fee: pricingConfig?.fallbackPrice || 4000,
      isWithinRange: true,
      details: {
        distance: null,
        basePrice: pricingConfig?.fallbackPrice || 4000,
        distancePrice: 0,
        isFallback: true,
      },
    };
  }

  const {
    basePrice = 2000,
    pricePerKm = 350,
    freeDistance = 2,
    maxDistance = 12,
    fallbackPrice = 4000,
  } = pricingConfig;

  // Validar radio máximo
  if (distance > maxDistance) {
    return {
      fee: 0,
      isWithinRange: false,
      details: {
        distance,
        maxDistance,
        basePrice: 0,
        distancePrice: 0,
        isFallback: false,
      },
    };
  }

  // Calcular distancia cobrable (después de la distancia gratis)
  const chargeableDistance = Math.max(0, distance - freeDistance);

  // Calcular costo adicional por distancia
  const distancePrice = Math.round(chargeableDistance * pricePerKm);

  // Total
  const rawFee = basePrice + distancePrice;
  const totalFee = Math.round(rawFee / 10) * 10; // ✅ Redondear a múltiplo de 10

  return {
    fee: totalFee,
    isWithinRange: true,
    details: {
      distance,
      basePrice,
      distancePrice,
      chargeableDistance,
      freeDistance,
      isFallback: false,
    },
  };
};

/**
 * Formatea la información de distancia para mostrar al usuario
 * @param {number} distance - Distancia en km
 * @param {number} fee - Costo de envío
 * @returns {string}
 */
export const formatDistanceInfo = (distance, fee) => {
  if (distance === null) return "";
  return `${distance.toFixed(1)} km`;
};
