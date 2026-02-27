import { useState, useEffect } from "react";
import {
  calculateHaversineDistance,
  calculateDeliveryFee,
} from "../utils/distanceCalculator";
import { calculateRealDistance } from "../utils/googleDistanceMatrix";

export const useDeliveryDistance = (
  branchCoordinates,
  clientCoordinates,
  pricingConfig,
  deliveryMethod,
  useRealDistance = true // Por defecto usar distancia real
) => {
  const [distance, setDistance] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [details, setDetails] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  useEffect(() => {
    // Solo calcular si es delivery
    if (deliveryMethod !== "delivery") {
      setDistance(null);
      setDeliveryFee(0);
      setIsOutOfRange(false);
      setDetails(null);
      setEstimatedTime(null);
      return;
    }

    // Validar coordenadas
    if (
      !branchCoordinates ||
      !clientCoordinates ||
      !Array.isArray(branchCoordinates) ||
      !Array.isArray(clientCoordinates) ||
      branchCoordinates.length !== 2 ||
      clientCoordinates.length !== 2
    ) {
      console.log("⏳ Esperando coordenadas válidas...");
      setDistance(null);
      setDeliveryFee(pricingConfig?.fallbackPrice || 4000);
      setIsOutOfRange(false);
      return;
    }

    // Validar que sean números
    if (
      typeof branchCoordinates[0] !== "number" ||
      typeof branchCoordinates[1] !== "number" ||
      typeof clientCoordinates[0] !== "number" ||
      typeof clientCoordinates[1] !== "number"
    ) {
      console.log("⚠️ Coordenadas contienen valores inválidos");
      setDistance(null);
      setDeliveryFee(pricingConfig?.fallbackPrice || 4000);
      return;
    }

    console.log("✅ Iniciando cálculo de distancia...");
    setIsCalculating(true);

    const calculateDistance = async () => {
      try {
        let calculatedDistance;
        let duration = null;

        if (useRealDistance) {
          // Usar Google Distance Matrix API
          console.log("🗺️ Calculando distancia real con Google Maps...");
          const result = await calculateRealDistance(
            branchCoordinates,
            clientCoordinates
          );
          calculatedDistance = result.distance;
          duration = result.duration;

          console.log("📍 Distancia real calculada:", {
            distancia: `${calculatedDistance} km`,
            texto: result.distanceText,
            duracion: result.durationText,
          });
        } else {
          // Fallback: Haversine (línea recta)
          console.log("📐 Calculando distancia con Haversine...");
          calculatedDistance = calculateHaversineDistance(
            branchCoordinates,
            clientCoordinates
          );
          console.log("📍 Distancia Haversine:", calculatedDistance);
        }

        setDistance(calculatedDistance);
        setEstimatedTime(duration);

        // Calcular costo
        const result = calculateDeliveryFee(calculatedDistance, pricingConfig);

        console.log("💰 Cálculo de envío:", {
          distancia: `${calculatedDistance} km`,
          costo: `$${result.fee}`,
          dentroDelRadio: result.isWithinRange,
          tiempoEstimado: duration ? `${duration} min` : null,
          detalles: result.details,
        });

        setDeliveryFee(result.fee);
        setIsOutOfRange(!result.isWithinRange);
        setDetails(result.details);
      } catch (error) {
        console.error("❌ Error calculando distancia real:", error);
        console.log("🔄 Fallback a Haversine...");

        // Fallback a Haversine si falla la API
        try {
          const calculatedDistance = calculateHaversineDistance(
            branchCoordinates,
            clientCoordinates
          );

          console.log("📍 Distancia Haversine (fallback):", calculatedDistance);

          setDistance(calculatedDistance);
          const result = calculateDeliveryFee(
            calculatedDistance,
            pricingConfig
          );
          setDeliveryFee(result.fee);
          setIsOutOfRange(!result.isWithinRange);
          setDetails({
            ...result.details,
            isFallback: true,
            fallbackReason: error.message,
          });
        } catch (fallbackError) {
          console.error("❌ Error en fallback Haversine:", fallbackError);
          setDeliveryFee(pricingConfig?.fallbackPrice || 4000);
          setDistance(null);
          setIsOutOfRange(false);
          setDetails({ isFallback: true, error: fallbackError.message });
        }
      } finally {
        setIsCalculating(false);
      }
    };

    calculateDistance();
  }, [
    branchCoordinates,
    clientCoordinates,
    pricingConfig,
    deliveryMethod,
    useRealDistance,
  ]);

  return {
    distance,
    deliveryFee,
    isCalculating,
    isOutOfRange,
    details,
    estimatedTime,
  };
};
