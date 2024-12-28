import React, { useState, useEffect, useRef } from "react";
import {
	APIProvider,
	AdvancedMarker,
	Map,
	useMap,
	useMapsLibrary,
	useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import Swal from "sweetalert2";
import { ErrorMessage } from "formik";

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

	const handleValidateLocation = () => {
		setValidarUbi(true);
		Swal.fire({
			title: "¡Ubicación Validada!",
			text: "La ubicación ha sido validada con éxito.",
			icon: "success",
			confirmButtonText: "OK",
			timer: 1200, // Tiempo en milisegundos (3000 ms = 3 segundos)
			timerProgressBar: true, // Muestra una barra de progreso para el temporizador
			didOpen: (toast) => {
				toast.addEventListener("mouseenter", Swal.stopTimer);
				toast.addEventListener("mouseleave", Swal.resumeTimer);
			},
		});
	};

	return (
		<APIProvider
			apiKey={APIKEY}
			solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
		>
			<div
				className="w-full"
				style={{
					height: "25vh",
					borderTopLeftRadius: "24px",
					borderTopRightRadius: "24px",
					overflow: "hidden", // Para asegurar que el contenido respete los bordes
					maskImage: "radial-gradient(circle, white, black)", // Para ajustar el canvas interno
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

			{/* <button
				className="w-full md:w-6/12 flex flex-row justify-center mt-[50px] text-xs text-white font-bold font-coolvetica p-2 uppercase bg-red-main focus:outline-none hover:bg-black hover:text-red-main"
				onClick={() => setNoEncontre(true)}
				type="button"
			>
				¿No encontras tu direccion?
			</button> */}
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

		setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
	}, [places]);

	useEffect(() => {
		if (!placeAutocomplete) return;

		placeAutocomplete.addListener("place_changed", () => {
			onPlaceSelect(placeAutocomplete.getPlace());
		});
	}, [onPlaceSelect, placeAutocomplete]);
	const [inputValue, setInputValue] = useState(""); // Estado para el valor del input

	const handleInputChange = (e) => {
		setInputValue(e.target.value); // Actualiza el valor del input
	};

	return (
		<div className="flex flex-row pl-3 items-center ">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				className="h-6"
			>
				<path
					fillRule="evenodd"
					d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
					clipRule="evenodd"
				/>
			</svg>
			<input
				className={`bg-transparent h-10 text-black outline-none w-full pl-2 ${
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
