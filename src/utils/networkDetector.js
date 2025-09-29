// utils/networkDetector.js
export const getConnectionQuality = () => {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (!connection) {
    return "unknown"; // Desktop sin API, asumir buena conexión
  }

  const effectiveType = connection.effectiveType;
  const saveData = connection.saveData;

  // Si usuario activó "ahorro de datos", respetar
  if (saveData) {
    return "slow";
  }

  // Clasificar conexión
  if (effectiveType === "slow-2g" || effectiveType === "2g") {
    return "slow";
  }

  if (effectiveType === "3g") {
    return "medium";
  }

  // 4g, wifi, etc
  return "fast";
};

export const getPreloadStrategy = () => {
  const quality = getConnectionQuality();

  switch (quality) {
    case "slow":
      return {
        concurrency: 2,
        heroDelay: 1000,
        categoriesDelay: 2000,
        productsDelay: 3000,
        skipLowPriority: true,
        maxProducts: 6, // Solo above fold
      };

    case "medium":
      return {
        concurrency: 3,
        heroDelay: 500,
        categoriesDelay: 1000,
        productsDelay: 1500,
        skipLowPriority: false,
        maxProducts: 12,
      };

    case "fast":
    case "unknown":
    default:
      return {
        concurrency: 4,
        heroDelay: 500,
        categoriesDelay: 800,
        productsDelay: 1200,
        skipLowPriority: false,
        maxProducts: 15,
      };
  }
};
