import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import carrusel1 from "../assets/carrusel1.jpg";
import carrusel2 from "../assets/carrusel2.jpg";
import carrusel3 from "../assets/carrusel3.jpg";
import carrusel4 from "../assets/carrusel4.jpg";
import carrusel5 from "../assets/carrusel5.jpg";
import carrusel6 from "../assets/carrusel6.jpg";

const Carrusel = () => {
	const location = useLocation();
	const isDesktop = useMediaQuery({ minWidth: 1024 });
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [imagesLoaded, setImagesLoaded] = useState({});
	const intervalRef = useRef(null);

	const images = isDesktop
		? [carrusel1, carrusel2, carrusel5, carrusel6]
		: [carrusel1, carrusel2, carrusel3, carrusel4, carrusel5, carrusel6];

	// Precargar imágenes
	const preloadImages = useCallback(() => {
		images.forEach((src, index) => {
			const img = new Image();
			img.src = src;
			img.onload = () => {
				setImagesLoaded((prev) => ({
					...prev,
					[index]: true,
				}));
			};
		});
	}, [images]);

	// Manejar la transición
	const transition = useCallback(() => {
		setIsTransitioning(true);
		setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);

		setTimeout(() => {
			setIsTransitioning(false);
		}, 500);
	}, [images.length]);

	// Configurar el intervalo
	useEffect(() => {
		preloadImages();

		intervalRef.current = setInterval(transition, 3000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [transition, preloadImages]);

	// Pausar el carrusel cuando la pestaña no está visible
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				clearInterval(intervalRef.current);
			} else {
				intervalRef.current = setInterval(transition, 3000);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [transition]);

	const isCarritoPage = location.pathname === "/carrito";

	// Obtener la siguiente imagen para precargarla
	const nextIndex = (currentIndex + 1) % images.length;

	return (
		<div className="w-full h-[300px] overflow-hidden relative">
			{/* Imagen actual */}
			<img
				src={images[currentIndex]}
				alt={`Carrusel ${currentIndex + 1}`}
				className={`object-cover w-full h-full transition-opacity duration-500 ${
					isTransitioning ? "opacity-0" : "opacity-100"
				} ${isCarritoPage ? "brightness-50" : ""}`}
				loading={currentIndex === 0 ? "eager" : "lazy"}
				decoding={currentIndex === 0 ? "sync" : "async"}
			/>

			{/* Precargar siguiente imagen */}
			<link rel="preload" as="image" href={images[nextIndex]} />

			{/* Degradados */}
			{!isCarritoPage && (
				<>
					<div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent opacity-50"></div>
					<div className="absolute opacity-30 top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent"></div>
				</>
			)}

			{/* Indicadores de navegación */}
			<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
				{images.map((_, index) => (
					<button
						key={index}
						className={`w-2 h-2 rounded-full transition-all duration-300 ${
							currentIndex === index
								? "bg-white scale-125"
								: "bg-white/50 scale-100"
						}`}
						onClick={() => {
							setCurrentIndex(index);
							clearInterval(intervalRef.current);
							intervalRef.current = setInterval(transition, 3000);
						}}
						aria-label={`Ir a imagen ${index + 1}`}
					/>
				))}
			</div>

			{/* Loading indicator */}
			{!imagesLoaded[currentIndex] && (
				<div className="absolute inset-0 bg-gray-200 animate-pulse" />
			)}
		</div>
	);
};

export default Carrusel;
