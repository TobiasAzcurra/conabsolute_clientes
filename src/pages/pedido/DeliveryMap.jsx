// components/maps/DeliveryMap.jsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Marker, // ← fallback si no hay Map ID
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
  className = "rounded-3xl overflow-hidden",
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
      // Cargamos las libs que usamos (places para otros compo, routes para Directions, marker para AdvancedMarker)
      libraries={["places", "routes", "marker"]}
    >
      <div className={className} style={{ aspectRatio: "1/1" }}>
        <Map
          disableDefaultUI
          gestureHandling="greedy"
          defaultZoom={13}
          defaultCenter={storeCoords || clientCoords}
          // ⚠️ Importante para AdvancedMarker sin warnings
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
    map.fitBounds(bounds, { top: 32, right: 32, bottom: 32, left: 32 });
  }, [map, bounds, drawRoute]);

  // Dibujar / limpiar ruta cuando corresponde
  useEffect(() => {
    if (!map || !routesLib) return;

    // Limpiar renderer previo siempre que cambien dependencias
    if (rendererRef.current) {
      rendererRef.current.setMap(null);
      rendererRef.current = null;
    }

    if (drawRoute && storeCoords && clientCoords) {
      const service = new google.maps.DirectionsService();
      const renderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#000000",
          strokeWeight: 5,
          strokeOpacity: 0.9,
        },
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
            renderer.setDirections(result);
            const rBounds = result.routes?.[0]?.bounds;
            if (rBounds) {
              map.fitBounds(rBounds, {
                top: 32,
                right: 32,
                bottom: 32,
                left: 32,
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
            <div className="bg-gray-100/50 backdrop-blur-md p-2 rounded-md">
              <img src={logo} className="h-4    " />
            </div>
          </AdvancedMarker>
        ) : (
          <Marker position={storeCoords} />
        ))}

      {/* Cliente */}
      {clientCoords &&
        (hasMapId ? (
          <AdvancedMarker position={clientCoords}>
            <div className=" bg-gray-100/50 backdrop-blur-md p-2 rounded-full   ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
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
