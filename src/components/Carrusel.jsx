import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import carrusel1 from "../assets/carrusel1.jpg";
import carrusel2 from "../assets/carrusel2.jpg";
import carrusel3 from "../assets/carrusel3.jpg";
import carrusel4 from "../assets/carrusel4.jpg";

const Carrusel = () => {
	const location = useLocation();
	const images = [carrusel1, carrusel2, carrusel3, carrusel4];
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
		}, 100);

		return () => clearInterval(interval);
	}, [images.length]);

	const isCarritoPage = location.pathname === "/carrito";

	return (
		<div className="w-full h-[300px] overflow-hidden relative">
			<img
				src={images[currentIndex]}
				alt={`Carrusel ${currentIndex + 1}`}
				className={`object-cover w-full h-full ${
					isCarritoPage ? "brightness-50" : ""
				}`}
			/>
			{!isCarritoPage && (
				<div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent"></div>
			)}
		</div>
	);
};

export default Carrusel;
