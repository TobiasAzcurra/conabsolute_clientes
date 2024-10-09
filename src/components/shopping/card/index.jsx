import { Link } from "react-router-dom";
import currencyFormat from "../../../helpers/currencyFormat";

const Card = ({ name, description, price, img, path, id }) => {
	if (img === "proximamente") {
		return (
			<Link
				to={`/menu/${path}/${id}`}
				onClick={(e) => {
					if (img === "proximamente") e.preventDefault();
				}}
				className="flex items-center justify-center p-24 gap-4 shadow-md rounded-xl bg-gray-200 text-gray-700 min-w-full max-w-[400px] hover:shadow-lg transition duration-300"
			>
				<div className="flex flex-col items-center justify-center leading-normal font-coolvetica">
					<h5 className="mb-2 text-2xl font-bold tracking-tight uppercase">
						próximamente
					</h5>
				</div>
			</Link>
		);
	}
	// Función para capitalizar cada palabra
	const capitalizeWords = (str) => {
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};
	return (
		<Link
			to={`/menu/${path}/${id}`}
			className="flex  flex-col items-center border border-black border-1 border-opacity-20 rounded-xl bg-gray-100 hover:shadow-lg transition duration-300  w-full max-w-[400px] text-black"
		>
			<div className="h-[150px] overflow-hidden rounded-t-xl w-full bg-gradient-to-b from-gray-300 to-red-400">
				<img
					className="object-cover w-full h-full"
					src={`/menu/${img}`}
					alt={img}
					style={{
						objectPosition: "center", // Ajusta la posición según lo que prefieras
					}}
				/>
			</div>
			<div className="flex p-4 flex-col items-center justify-between leading-normal font-coolvetica  text-center">
				<h5 className="mb-1 text-2xl  font-bold tracking-tight">
					{capitalizeWords(name)}
				</h5>
				<p className="mb-1 text-xs text-gray-600">{description}</p>
				<span className="font-bold text-2xl mb-3 text-black">
					{currencyFormat(price)}
				</span>
			</div>
		</Link>
	);
};

export default Card;
