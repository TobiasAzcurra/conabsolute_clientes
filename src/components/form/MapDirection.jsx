import React, { useState, useEffect, useRef } from "react";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";

const position = { lat: -33.117142, lng: -64.347756 };

export const MapDirection = ({
  setUrl,
  setValidarUbi,
  setNoEncontre,
  setFieldValue,
  branchCoordinates,
  logo,
}) => {
  const APIKEY = import.meta.env.VITE_API_GOOGLE_MAPS;

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [markerRef, marker] = useAdvancedMarkerRef();

  useEffect(() => {
    if (selectedPlace) {
      const lat = selectedPlace.geometry?.location.lat();
      const lng = selectedPlace.geometry?.location.lng();
      const formattedAddress = selectedPlace.formatted_address;
      const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      const formattedGoogleMapsUrl =
        `https://www.google.com/maps?q=${lat},${lng}`.replace(
          "https://",
          "https ://"
        );
      setUrl(googleMapsUrl);
      setFieldValue("address", formattedAddress);
    }
  }, [selectedPlace]);

  const branchLatLng = branchCoordinates
    ? Array.isArray(branchCoordinates)
      ? { lat: branchCoordinates[0], lng: branchCoordinates[1] }
      : branchCoordinates
    : null;

  return (
    <APIProvider
      apiKey={APIKEY}
      solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
    >
      <div
        className="w-full px-2 pt-2 rounded-t-[45px]"
        style={{
          aspectRatio: "1/1",
          overflow: "hidden",
          maskImage: "radial-gradient(circle, white, black)",
        }}
      >
        <Map
          style={{
            height: "100%",
            width: "100%",
          }}
          mapId={"bf51a910020fa25a"}
          defaultZoom={13}
          defaultCenter={branchLatLng || position}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
        >
          {/* Marcador de sucursal */}
          {branchLatLng && (
            <AdvancedMarker position={branchLatLng}>
              <div className="bg-white p-2 rounded-xl shadow-lg">
                {logo ? (
                  <img src={logo} className="h-4" alt="Sucursal" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 text-gray-900"
                  >
                    <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                    <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                  </svg>
                )}
              </div>
            </AdvancedMarker>
          )}

          {/* ✅ Marcador del cliente con estilo personalizado */}
          <AdvancedMarker
            ref={markerRef}
            position={selectedPlace?.geometry?.location}
            draggable={true}
          >
            <div className="bg-white h-10 w-10 flex items-center justify-center rounded-full shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 text-gray-900"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </AdvancedMarker>

          <MapHandler
            place={selectedPlace}
            marker={marker}
            setPlace={setSelectedPlace}
            branchCoordinates={branchLatLng}
          />
        </Map>
      </div>

      <div className="m">
        <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
      </div>
    </APIProvider>
  );
};

const MapHandler = ({ place, marker, setPlace, branchCoordinates }) => {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !place || !marker) return;

    if (place.geometry?.viewport) {
      map.fitBounds(place.geometry?.viewport);
    }

    marker.position = place.geometry?.location;

    const handleDragEnd = (event) => {
      const latLng = event.latLng;
      setPlace((prevPlace) => ({
        ...prevPlace,
        geometry: {
          ...prevPlace.geometry,
          location: latLng,
        },
      }));
    };

    google.maps.event.addListener(marker, "dragend", handleDragEnd);

    return () => {
      google.maps.event.clearListeners(marker, "dragend");
    };
  }, [map, place, marker, setPlace]);

  useEffect(() => {
    if (!map || !routesLib || !branchCoordinates || !place) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: branchCoordinates,
        destination: place.geometry.location,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }

        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          const path = route.overview_path;

          const polyline = new google.maps.Polyline({
            path: path,
            strokeColor: "#000000",
            strokeOpacity: 0.6,
            strokeWeight: 3,
            geodesic: true,
            map: map,
          });

          polylineRef.current = polyline;

          const bounds = route.bounds;
          if (bounds) {
            map.fitBounds(bounds, {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50,
            });
          }
        } else {
          console.warn("No se pudo calcular la ruta:", status);
        }
      }
    );

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, routesLib, branchCoordinates, place]);

  return null;
};

const PlaceAutocomplete = ({ onPlaceSelect }) => {
  const [placeAutocomplete, setPlaceAutocomplete] = useState(null);
  const inputRef = useRef(null);
  const places = useMapsLibrary("places");
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const defaultBounds = {
      north: position.lat + 0.2,
      south: position.lat - 0.2,
      east: position.lng + 0.2,
      west: position.lng - 0.2,
    };
    const options = {
      fields: ["geometry", "name", "formatted_address"],
      bounds: defaultBounds,
      strictBounds: true,
    };

    const autocomplete = new places.Autocomplete(inputRef.current, options);
    setPlaceAutocomplete(autocomplete);
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener("place_changed", () => {
      const place = placeAutocomplete.getPlace();
      if (place.formatted_address) {
        setInputValue(place.formatted_address);
      }
      onPlaceSelect(place);
    });
  }, [onPlaceSelect, placeAutocomplete]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex flex-row pl-4 items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 text-gray-400"
      >
        <path
          fillRule="evenodd"
          d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          clipRule="evenodd"
        />
      </svg>
      <input
        className={`bg-transparent text-xs font-light h-10 text-black outline-none w-full pl-2 ${
          inputValue ? "opacity-100" : "text-gray-400"
        }`}
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Escribi tu direccion"
        style={{ width: "100%", boxSizing: "border-box" }}
      />
    </div>
  );
};
