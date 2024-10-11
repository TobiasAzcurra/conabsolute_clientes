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
			timer: 1200, // Tiempo en milisegundos (1200 ms = 1.2 segundos)
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
				className="w-full md:w-6/12 rounded-t-xl overflow-hidden"
				style={{
					height: "15vh",
				}}
			>
				{/* <div className="autocomplete-control w-full">
                    <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
                </div> */}
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
			{/* <button
                className="w-full md:w-6/12 flex flex-row justify-center mt-[50px] text-xs text-white font-bold font-antonio p-2 uppercase bg-red-main focus:outline-none hover:bg-black hover:text-red-main"
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

		// Usa directamente el listener de eventos de Google Maps
		google.maps.event.addListener(marker, "dragend", handleDragEnd);

		// Función de limpieza para remover el listener cuando el componente se desmonta
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

		// Crea un bounding box con lados ~20km alejados del punto central
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

	// Descomentar y ajustar el input según sea necesario
	// return (
	//     <div style={{ width: "100%" }}>
	//         <input
	//             className="font-antonio focus:border-none focus:outline-none bg-gray-300 text-xs p-2 mb-[-23px] text-black ml-[-23px]"
	//             ref={inputRef}
	//             placeholder="ESCRIBI TU DIRECCION"
	//             style={{ width: "100%", boxSizing: "border-box" }}
	//         />
	//     </div>
	// );
};
