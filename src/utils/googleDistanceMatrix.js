import { getFunctions, httpsCallable } from "firebase/functions";

/**
 * Calcula la distancia real usando Routes API vía Cloud Function
 * @param {Array} origin - [lat, lng] del origen (sucursal)
 * @param {Array} destination - [lat, lng] del destino (cliente)
 * @returns {Promise<Object>} - { distance, duration, status }
 */
export const calculateRealDistance = async (origin, destination) => {
  if (
    !origin ||
    !destination ||
    origin.length !== 2 ||
    destination.length !== 2
  ) {
    throw new Error("Coordenadas inválidas");
  }

  console.log("🗺️ Llamando a Cloud Function calculateDistance...", {
    origen: origin,
    destino: destination,
  });

  try {
    const functions = getFunctions();
    const calculateDistanceFunc = httpsCallable(functions, "calculateDistance");

    // ✅ CAMBIO: Asegurar que enviamos arrays simples
    const payload = {
      origin: [origin[0], origin[1]], // Forzar array plano
      destination: [destination[0], destination[1]], // Forzar array plano
    };

    console.log("📤 Payload a enviar:", payload);

    const result = await calculateDistanceFunc(payload);

    console.log("✅ Respuesta de Cloud Function:", result.data);

    return {
      distance: result.data.distance,
      distanceText: `${result.data.distance} km`,
      duration: result.data.duration,
      durationText: `${result.data.duration} min`,
      status: result.data.status,
    };
  } catch (error) {
    console.error("❌ Error llamando Cloud Function:", error);
    console.error("📋 Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    throw error;
  }
};
