import { useState, useEffect } from "react";
import QuickAddToCart from "./quickAddToCart";
import currencyFormat from "../../../helpers/currencyFormat";
import { Link } from "react-router-dom";

const Card = ({ name, description, price, img, path, id, category }) => {
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageSrc, setImageSrc] = useState(null);

	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const getImagePosition = (productName) => {
		const imagePositions = {
			"Satisfyer Easter Egg": "65%",
			"Satisfyer BCN Cheeseburger": "40%",
			"Satisfyer ANHELO Classic": "50%",
			"Simple Chessburger": "70%",
			"Doble Cheeseburger": "60%",
			"Triple Cheeseburger": "40%",
			"Cuadruple Cheeseburger": "35%",
			"Crispy BCN": "65%",
			"ANHELO Classic": "55%",
			"BCN Cheeseburger": "65%",
			"BBQ BCN Cheeseburger": "55%",
			"Easter Egg": "70%",
			"Mario Inspired": "45%",
		};

		return imagePositions[productName] || "50%";
	};

	const imgPosition = getImagePosition(name);

	useEffect(() => {
		const image = new Image();
		image.src = `/menu/${img}`;
		image.onload = () => {
			setImageSrc(image.src);
			// Pequeño delay para asegurar que la transición sea visible
			setTimeout(() => {
				setImageLoaded(true);
			}, 50);
		};
	}, [img]);

	return (
		<div className="relative flex flex-col items-center border border-black border-opacity-20 bg-gray-100 rounded-3xl transition duration-300 w-full max-w-[400px] text-black z-50">
			<div className="absolute right-4 top-3 z-40">
				<QuickAddToCart
					product={{ name, description, price, img, path, id, category }}
				/>
			</div>

			<Link to={`/menu/${path}/${id}`} className="w-full">
				<div className="h-[130px] overflow-hidden rounded-t-3xl w-full bg-gradient-to-b from-gray-100 to-gray-300 relative">
					{/* Skeleton loader con animación mejorada */}
					<div
						className={`absolute inset-0 bg-gray-200 animate-pulse transition-opacity duration-300 ease-in-out ${
							imageLoaded ? "opacity-0" : "opacity-100"
						}`}
					/>

					{/* Imagen con fade-in mejorado */}
					{imageSrc && (
						<div className="w-full h-full">
							<img
								className={`object-cover w-full h-full transform transition-all duration-500 ease-in-out ${
									imageLoaded
										? "opacity-100 translate-y-0"
										: "opacity-0 translate-y-4"
								}`}
								style={{ objectPosition: `center ${imgPosition}` }}
								src={imageSrc}
								alt={name}
								loading="lazy"
								decoding="async"
							/>
						</div>
					)}
				</div>

				<div className="flex px-4 flex-col items-center justify-between leading-normal font-coolvetica text-center">
					<h5 className="mb-1 mt-4 text-2xl font-bold tracking-tight">
						{capitalizeWords(name)}
					</h5>
					<p className="mb-1 text-xs text-gray-600">{description}</p>
					<span className="font-bold text-2xl mb-5 text-black">
						{currencyFormat(price)}
					</span>
				</div>
			</Link>
		</div>
	);
};

export default Card;
