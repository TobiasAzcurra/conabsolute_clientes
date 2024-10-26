import React, { useState } from "react";
import QuickAddToCart from "./quickAddToCart";
import currencyFormat from "../../../helpers/currencyFormat";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Card = ({ name, description, price, img, path, id, category }) => {
	// Lista de nombres de productos para los cuales no se mostrará la calificación
	const excludedNames = [
		"Coca-Cola (310 ml.)",
		"Fanta de naranja (310 ml.)",
		"Sprite (310 ml.)",
		// Puedes agregar más nombres aquí si es necesario
	];

	// Función para capitalizar cada palabra con solo la primera letra en mayúscula
	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Lógica para asignar un porcentaje de posición de imagen a cada producto
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
			"2x1 BCN Cheeseburger": "85%",
			"Papas Anhelo ®": "50%",
			"Papas con Cheddar ®": "50%",
			"Pote Cheddar": "50%",
			// Agrega más productos y porcentajes aquí si es necesario
		};

		// Retorna el porcentaje específico, o un valor por defecto si no está definido
		return imagePositions[productName] || "50%";
	};

	// Obtener el porcentaje para este producto
	const imgPosition = getImagePosition(name);

	// Datos de puntuación falsos (puedes reemplazar esto con datos reales más tarde)
	const fakeRatings = {
		"Satisfyer Easter Egg": { score: 4.3, reviews: 15 },
		"Satisfyer BCN Cheeseburger": { score: 4.7, reviews: 8 },
		"Satisfyer ANHELO Classic": { score: 4.1, reviews: 22 },
		"Simple Chessburger": { score: 4.5, reviews: 5 },
		"Doble Cheeseburger": { score: 4.9, reviews: 12 },
		"Triple Cheeseburger": { score: 4.0, reviews: 9 },
		"Cuadruple Cheeseburger": { score: 4.2, reviews: 14 },
		"Crispy BCN": { score: 4.6, reviews: 11 },
		"ANHELO Classic": { score: 4.1, reviews: 18 },
		"BCN Cheeseburger": { score: 4.7, reviews: 10 },
		"BBQ BCN Cheeseburger": { score: 4.6, reviews: 7 },
		"Easter Egg": { score: 4.5, reviews: 16 },
		"Mario Inspired": { score: 4.2, reviews: 4 },
		"2x1 BCN Cheeseburger": { score: 4.7, reviews: 20 },
		"Papas Anhelo ®": { score: 4.1, reviews: 20 },
		"Papas con Cheddar ®": { score: 4.1, reviews: 20 },
		"Pote Cheddar": { score: 4.1, reviews: 20 },
		// Agrega más productos y puntuaciones aquí si es necesario
	};

	// Obtener la puntuación y el número de críticas para este producto, o valores por defecto si no están definidos
	const { score: rawScore, reviews } = fakeRatings[name] || {
		score: 3,
		reviews: 10,
	};
	const score = Number(rawScore); // Asegurarse de que sea un número

	// Función para renderizar estrellas basadas en la puntuación
	const renderStars = (score) => {
		const stars = [];
		const fullStars = Math.floor(score);
		const hasHalfStar = score - fullStars >= 0.5;
		const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

		// Agregar estrellas completas
		for (let i = 0; i < fullStars; i++) {
			stars.push(
				<FontAwesomeIcon
					key={`full-${i}`}
					icon="star"
					className="text-red-main h-3"
					aria-label="Estrella completa"
				/>
			);
		}

		// Agregar media estrella si aplica
		if (hasHalfStar) {
			stars.push(
				<FontAwesomeIcon
					key="half"
					icon="star-half-alt"
					className="text-red-main h-3"
					aria-label="Media estrella"
				/>
			);
		}

		// Agregar estrellas vacías
		for (let i = 0; i < emptyStars; i++) {
			stars.push(
				<FontAwesomeIcon
					key={`empty-${i}`}
					icon={["far", "star"]}
					className="text-red-main h-3"
					aria-label="Estrella vacía"
				/>
			);
		}

		return stars;
	};

	// Estado para manejar la carga de la imagen
	const [isLoaded, setIsLoaded] = useState(false);

	return (
		<div className="group relative flex flex-col rounded-3xl items-center border border-black border-opacity-30 bg-gray-100  transition duration-300 w-full max-w-[400px] text-black z-50 ">
			{/* Botón QuickAddToCart fuera del Link para evitar la redirección */}
			<div className="absolute right-3.5 top-2.5 z-40">
				<QuickAddToCart
					product={{ name, description, price, img, path, id, category }}
				/>
			</div>

			{/* Contenido de la tarjeta que redirige */}
			<Link to={`/menu/${path}/${id}`} className="w-full">
				<div className="relative h-[160px] overflow-hidden rounded-t-3xl w-full">
					{/* Placeholder de carga */}
					{!isLoaded && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
							<span className="text-gray-400 text-sm">Cargando...</span>
						</div>
					)}
					{/* Fondo con gradient overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-gray-300 via-transparent to-transparent opacity-50"></div>
					<img
						className={`object-cover w-full h-full transition-transform duration-300 transform group-hover:scale-105 ${
							isLoaded ? "opacity-100" : "opacity-0"
						}`}
						style={{ objectPosition: `center ${imgPosition}` }}
						src={`/menu/${img}`}
						alt={name}
						onLoad={() => setIsLoaded(true)}
					/>
				</div>

				<div className="flex px-4 flex-col justify-between leading-normal font-coolvetica text-left ">
					<h5 className="mt-4 text-2xl w-full text-left font-bold ">
						{capitalizeWords(name)}
					</h5>
					<p className="text-left text-xs text-opacity-30 text-black">
						{description}
					</p>
					<div className="flex w-full mt-4 items-left justify-between mb-6">
						<span className="font-bold text-4xl text-black ">
							{currencyFormat(price)}
						</span>
						{/* Condicional para mostrar la calificación solo si el nombre NO está en excludedNames */}
						{!excludedNames.includes(name) && (
							<div className="flex items-center gap-2 ">
								<div className="flex items-center mb-0.5 ">
									{renderStars(score)}
								</div>
								{/* <span className="text-xs text-gray-600 ml-2">
									({reviews} reviews)
								</span> */}
								<div className="text-xs bg-red-main text-gray-100 h-7 flex items-center text-center justify-center w-8 font-bold rounded-md">
									{score.toFixed(1)}
								</div>
							</div>
						)}
					</div>
				</div>
			</Link>
		</div>
	);
};

export default Card;
