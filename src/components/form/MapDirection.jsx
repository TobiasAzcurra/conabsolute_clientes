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
      setFieldValue("address", formattedAddress); // Actualiza la dirección en Formik
    }
  }, [selectedPlace]);

  return (
    <APIProvider
      apiKey={APIKEY}
      solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
    >
      <div
        className="w-full px-2 pt-2 rounded-t-[45px] "
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
          defaultCenter={position}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
        >
          <AdvancedMarker
            ref={markerRef}
            position={selectedPlace?.geometry?.location}
            draggable={true}
          />
        </Map>
        <MapHandler
          place={selectedPlace}
          marker={marker}
          setPlace={setSelectedPlace}
        />
      </div>

      {/* Colocamos el input debajo del mapa */}
      <div className="m">
        <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
      </div>
    </APIProvider>
  );
};

const MapHandler = ({ place, marker, setPlace }) => {
  const map = useMap();

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

    // Use Google Maps event listener directly
    google.maps.event.addListener(marker, "dragend", handleDragEnd);

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      google.maps.event.clearListeners(marker, "dragend");
    };
  }, [map, place, marker, setPlace]);

  return null;
};

const PlaceAutocomplete = ({ onPlaceSelect }) => {
  const [placeAutocomplete, setPlaceAutocomplete] = useState(null);
  const inputRef = useRef(null);
  const places = useMapsLibrary("places");
  const [inputValue, setInputValue] = useState(""); // Estado para el valor del input

  useEffect(() => {
    if (!places || !inputRef.current) return;

    // Create a bounding box with sides ~20km away from the center point
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
        setInputValue(place.formatted_address); // 🔥 Actualizar el texto mostrado
      }
      onPlaceSelect(place);
    });
  }, [onPlaceSelect, placeAutocomplete]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value); // Actualiza el valor del input
  };

  return (
    <div className="flex flex-row pl-4 items-center ">
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
        onChange={handleInputChange} // Maneja el cambio de valor del input
        placeholder="Escribi tu direccion"
        style={{ width: "100%", boxSizing: "border-box" }}
      />
    </div>
  );
};
