require("dotenv").config();
const functions = require("firebase-functions");
const fetch = require("node-fetch");

exports.calculateDistance = functions.https.onCall(async (data, context) => {
  const payload = data.data || data;

  console.log("📥 Payload recibido:", payload);

  const {origin, destination} = payload;

  // Validación
  if (!origin || !destination) {
    console.error("❌ Falta origin o destination");
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Falta origin o destination",
    );
  }

  if (!Array.isArray(origin) || !Array.isArray(destination)) {
    console.error("❌ No son arrays");
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Origin y destination deben ser arrays",
    );
  }

  if (origin.length !== 2 || destination.length !== 2) {
    console.error("❌ Longitud incorrecta");
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Arrays deben tener exactamente 2 elementos",
    );
  }

  if (
    typeof origin[0] !== "number" ||
    typeof origin[1] !== "number" ||
    typeof destination[0] !== "number" ||
    typeof destination[1] !== "number"
  ) {
    console.error("❌ No son números");
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Las coordenadas deben ser números",
    );
  }

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    console.error("❌ API key no configurada");
    throw new functions.https.HttpsError(
        "failed-precondition",
        "API key no configurada",
    );
  }

  const url =
    "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

  const requestBody = {
    origins: [
      {
        waypoint: {
          location: {
            latLng: {
              latitude: origin[0],
              longitude: origin[1],
            },
          },
        },
      },
    ],
    destinations: [
      {
        waypoint: {
          location: {
            latLng: {
              latitude: destination[0],
              longitude: destination[1],
            },
          },
        },
      },
    ],
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
  };

  try {
    console.log("📍 Calculando distancia para:", {origin, destination});

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "originIndex,destinationIndex,duration,distanceMeters,status",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error en Routes API:", errorText);
      throw new Error("Routes API error: " + response.status);
    }

    const result = await response.json();
    console.log("✅ Respuesta de Routes API:", result);

    // ✅ CAMBIO: Validar que exista el resultado y tenga distanceMeters
    if (!result[0] || !result[0].distanceMeters) {
      console.error("❌ Respuesta inválida:", result);
      throw new Error("No se pudo calcular la distancia");
    }

    const distanceInKm = result[0].distanceMeters / 1000;
    const durationString = result[0].duration.replace("s", "");
    const durationInSeconds = parseInt(durationString);
    const durationInMinutes = Math.round(durationInSeconds / 60);

    console.log("✅ Retornando:", {
      distance: Math.round(distanceInKm * 100) / 100,
      duration: durationInMinutes,
    });

    return {
      distance: Math.round(distanceInKm * 100) / 100,
      duration: durationInMinutes,
      status: "OK",
    };
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
