// components/maps/DeliveryMap.jsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

/**
 * Props:
 * - apiKey?: string (opcional; si no, usa import.meta.env.VITE_API_GOOGLE_MAPS)
 * - mapId?: string (opcional; si no, usa import.meta.env.VITE_GOOGLE_MAPS_MAP_ID)
 * - storeCoords: {lat:number, lng:number} | null
 * - clientCoords?: {lat:number, lng:number} | null
 * - method: 'delivery' | 'takeaway'
 * - status: string ('Pending' | 'Confirmed' | 'Ready' | 'Delivered' | 'Client' | ...)
 * - className?: string
 */
const DeliveryMap = ({
  apiKey,
  mapId,
  storeCoords,
  clientCoords,
  method,
  logo,
  status,
  className = "rounded-t-3xl overflow-hidden",
}) => {
  const resolvedKey = apiKey || import.meta.env.VITE_API_GOOGLE_MAPS;
  const resolvedMapId = mapId || import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

  const shouldShowClient = method === "delivery" && !!clientCoords;
  const shouldShowStore = !!storeCoords;
  const shouldShowRoute =
    method === "delivery" &&
    status === "Delivered" &&
    !!storeCoords &&
    !!clientCoords;

  if (!shouldShowStore && !shouldShowClient) return null;

  // Logs de verificación
  console.log("GMAPS KEY?", (resolvedKey || "").slice(0, 8) + "...");
  console.log("MAP ID?", (resolvedMapId || "").slice(0, 8) + "...");

  return (
    <APIProvider
      apiKey={resolvedKey}
      libraries={["places", "routes", "marker"]}
    >
      <div className={className} style={{ aspectRatio: "1/1" }}>
        <Map
          disableDefaultUI
          gestureHandling="greedy"
          defaultZoom={13}
          defaultCenter={storeCoords || clientCoords}
          mapId={resolvedMapId}
          style={{ width: "100%", height: "100%" }}
        >
          <MapContent
            storeCoords={storeCoords}
            logo={logo}
            clientCoords={shouldShowClient ? clientCoords : null}
            drawRoute={shouldShowRoute}
            hasMapId={!!resolvedMapId}
          />
        </Map>
      </div>
    </APIProvider>
  );
};

export default DeliveryMap;

const MapContent = ({
  storeCoords,
  clientCoords,
  drawRoute,
  hasMapId,
  logo,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const rendererRef = useRef(null);
  const animatedLineRef = useRef(null);
  const pathRef = useRef(null);

  const bounds = useMemo(() => {
    if (!storeCoords && !clientCoords) return null;
    const b = new google.maps.LatLngBounds();
    if (storeCoords) b.extend(storeCoords);
    if (clientCoords) b.extend(clientCoords);
    return b;
  }, [storeCoords, clientCoords]);

  // Fit bounds cuando solo hay marcadores (sin ruta)
  useEffect(() => {
    if (!map || !bounds || drawRoute) return;

    if (storeCoords && clientCoords) {
      map.fitBounds(bounds, { top: 32, right: 32, bottom: 32, left: 32 });
    } else {
      map.setCenter(storeCoords || clientCoords);
      map.setZoom(17);
    }
  }, [map, bounds, drawRoute, storeCoords, clientCoords]);

  // Función para animar la línea
  const animateLine = (path) => {
    if (!map || !path || path.length < 2) return;

    // Limpiar línea animada anterior
    if (animatedLineRef.current) {
      animatedLineRef.current.setMap(null);
    }

    // Crear línea base (más tenue)
    const baseLine = new google.maps.Polyline({
      path: path,
      strokeColor: "#000000",
      strokeOpacity: 0.15,
      strokeWeight: 4,
      map: map,
    });

    // Crear línea animada con gradiente
    const animatedLine = new google.maps.Polyline({
      path: [],
      strokeColor: "#000000",
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map: map,
    });

    animatedLineRef.current = animatedLine;

    // Variables para la animación
    let step = 0;
    const numSteps = 200; // Más pasos para animación más suave
    const interval = 20; // Intervalo en ms (más rápido = más fluido)

    // Función para interpolar puntos a lo largo de la ruta
    const interpolate = (p1, p2, fraction) => {
      const lat = p1.lat() + (p2.lat() - p1.lat()) * fraction;
      const lng = p1.lng() + (p2.lng() - p1.lng()) * fraction;
      return new google.maps.LatLng(lat, lng);
    };

    // Calcular la longitud total de la ruta
    const distances = [];
    let totalDistance = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const dist = google.maps.geometry.spherical.computeDistanceBetween(
        path[i],
        path[i + 1]
      );
      distances.push(dist);
      totalDistance += dist;
    }

    // Animación con easing
    const animate = () => {
      step++;

      // Función de easing (ease-in-out)
      let progress = step / numSteps;
      const easeProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const targetDistance = totalDistance * easeProgress;

      // Encontrar qué puntos de la ruta incluir
      const animatedPath = [];
      let accumulatedDistance = 0;

      for (let i = 0; i < path.length - 1; i++) {
        animatedPath.push(path[i]);

        if (accumulatedDistance + distances[i] >= targetDistance) {
          // Interpolar el punto final
          const remainingDistance = targetDistance - accumulatedDistance;
          const fraction = remainingDistance / distances[i];
          const interpolatedPoint = interpolate(path[i], path[i + 1], fraction);
          animatedPath.push(interpolatedPoint);
          break;
        }

        accumulatedDistance += distances[i];
      }

      // Si completamos toda la ruta
      if (easeProgress >= 1) {
        animatedPath.push(path[path.length - 1]);
      }

      animatedLine.setPath(animatedPath);

      // Continuar o reiniciar la animación
      if (step < numSteps) {
        requestAnimationFrame(animate);
      } else {
        // Reiniciar la animación después de una pausa
        setTimeout(() => {
          step = 0;
          animate();
        }, 2000); // Pausa de 2 segundos antes de reiniciar
      }
    };

    // Iniciar la animación
    animate();

    // Guardar referencia a la línea base para limpiarla después
    pathRef.current = baseLine;
  };

  // Dibujar / limpiar ruta cuando corresponde
  useEffect(() => {
    if (!map || !routesLib) return;

    // Limpiar renderer y líneas previas
    if (rendererRef.current) {
      rendererRef.current.setMap(null);
      rendererRef.current = null;
    }

    if (animatedLineRef.current) {
      animatedLineRef.current.setMap(null);
      animatedLineRef.current = null;
    }

    if (pathRef.current) {
      pathRef.current.setMap(null);
      pathRef.current = null;
    }

    if (drawRoute && storeCoords && clientCoords) {
      const service = new google.maps.DirectionsService();

      // Usamos un renderer invisible solo para obtener la ruta
      const renderer = new google.maps.DirectionsRenderer({
        map: null, // No lo mostramos
        suppressMarkers: true,
      });
      rendererRef.current = renderer;

      service.route(
        {
          origin: storeCoords,
          destination: clientCoords,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: false,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0];
            const path = route.overview_path;

            // Animar la línea
            animateLine(path);

            // Ajustar los límites del mapa
            const rBounds = route.bounds;
            if (rBounds) {
              map.fitBounds(rBounds, {
                top: 48,
                right: 48,
                bottom: 48,
                left: 48,
              });
            }
          } else if (bounds) {
            // Fallback: centramos al menos en ambos marcadores
            map.fitBounds(bounds, {
              top: 32,
              right: 32,
              bottom: 32,
              left: 32,
            });
          }
        }
      );
    }

    // Cleanup al desmontar o al cambiar dependencias
    return () => {
      if (rendererRef.current) {
        rendererRef.current.setMap(null);
        rendererRef.current = null;
      }
      if (animatedLineRef.current) {
        animatedLineRef.current.setMap(null);
        animatedLineRef.current = null;
      }
      if (pathRef.current) {
        pathRef.current.setMap(null);
        pathRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map,
    routesLib,
    drawRoute,
    storeCoords?.lat,
    storeCoords?.lng,
    clientCoords?.lat,
    clientCoords?.lng,
  ]);

  return (
    <>
      {/* Local */}
      {storeCoords &&
        (hasMapId ? (
          <AdvancedMarker position={storeCoords}>
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg">
              <img src={logo} className="h-5" alt="Store" />
            </div>
          </AdvancedMarker>
        ) : (
          <Marker position={storeCoords} />
        ))}

      {/* Cliente */}
      {clientCoords &&
        (hasMapId ? (
          <AdvancedMarker position={clientCoords}>
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 text-gray-700"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </AdvancedMarker>
        ) : (
          <Marker position={clientCoords} />
        ))}
    </>
  );
};
