import QuickAddToCart from "./quickAddToCart";
import currencyFormat from "../../../helpers/currencyFormat";
import { Link } from "react-router-dom";

const Card = ({ name, description, price, img, path, id, category }) => {
	// Función para capitalizar cada palabra con solo la primera letra en mayúscula
	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	return (
		<div className="relative flex flex-col items-center border border-black border-opacity-20 rounded-3xl bg-gray-100 transition duration-300 w-full max-w-[400px] text-black">
			{/* Botón QuickAddToCart fuera del Link para evitar la redirección */}
			<div className="absolute right-2 top-2 z-40">
				<QuickAddToCart
					product={{ name, description, price, img, path, id, category }}
				/>
			</div>

			{/* Contenido de la tarjeta que redirige */}
			<Link to={`/menu/${path}/${id}`} className="w-full">
				<div className="h-[130px] overflow-hidden rounded-t-3xl w-full bg-gradient-to-b from-gray-100 to-gray-300  relative ">
					<img
						className="object-cover w-full h-full"
						src={`/menu/${img}`}
						alt={img}
						style={{
							objectPosition: "center",
						}}
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
