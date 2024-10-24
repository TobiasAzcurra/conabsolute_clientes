import QuickAddToCart from "./quickAddToCart";
import currencyFormat from "../../../helpers/currencyFormat";
import { Link } from "react-router-dom";

const Card = ({ name, description, price, img, path, id, category }) => {
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
			// Agrega más productos y porcentajes aquí si es necesario
			"2x1 BCN Cheeseburger": "85%",
		};

		// Retorna el porcentaje específico, o un valor por defecto si no está definido
		return imagePositions[productName] || "50%";
	};

	// Obtener el porcentaje para este producto
	const imgPosition = getImagePosition(name);

	return (
		<div className="relative flex flex-col items-center border border-black border-opacity-20 bg-gray-100 rounded-3xl transition duration-300 w-full max-w-[400px] text-black z-50">
			{/* Botón QuickAddToCart fuera del Link para evitar la redirección */}
			<div className="absolute right-4 top-3 z-40">
				<QuickAddToCart
					product={{ name, description, price, img, path, id, category }}
				/>
			</div>

			{/* Contenido de la tarjeta que redirige */}
			<Link to={`/menu/${path}/${id}`} className="w-full">
				<div className="h-[130px] overflow-hidden rounded-t-3xl w-full bg-gradient-to-b from-gray-100 to-gray-300 relative">
					<img
						className="object-cover w-full h-full"
						style={{ objectPosition: `center ${imgPosition}` }}
						src={`/menu/${img}`}
						alt={img}
					/>
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
