import React from "react";
import image from "../assets/advisory.png";

const Carrusel = () => {
	return (
		<div className="w-full h-[140px] overflow-hidden">
			<img src={image} alt="Carrusel" className="object-cover w-full h-full" />
		</div>
	);
};

export default Carrusel;
