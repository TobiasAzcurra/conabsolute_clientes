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
				className="flex items-center justify-center p-24 gap-4 shadow-md rounded-lg bg-gray-200 text-gray-700 min-w-full max-w-[400px] hover:shadow-lg transition duration-300"
			>
				<div className="flex flex-col items-center justify-center leading-normal font-antonio">
					<h5 className="mb-2 text-2xl font-bold tracking-tight uppercase">
						próximamente
					</h5>
				</div>
			</Link>
		);
	}

	return (
		<Link
			to={`/menu/${path}/${id}`}
			className="flex flex-col items-center gap-4 shadow-md rounded-lg bg-gray-100 hover:shadow-lg transition duration-300 h-[340px] w-full max-w-[400px] text-black"
		>
			<div className="h-[150px] overflow-hidden rounded-t-lg w-full bg-gradient-to-b from-gray-300 to-red-400">
				<img
					className={`object-cover w-full h-full ${
						img === "bURGERS.png" ? "pb-4" : ""
					}`}
					src={`/menu/${img}`}
					alt={img}
					style={{
						objectPosition: "center", // Ajusta la posición según lo que prefieras
					}}
				/>
			</div>
			<div className="flex flex-col items-center justify-between leading-normal font-antonio px-2 text-center">
				<h5 className="mb-2 text-xl font-bold tracking-tight">
					{name.toUpperCase()}
				</h5>
				<p className="mb-2 text-sm text-gray-600">{description}</p>
				<span className="font-bold text-lg text-black">
					{currencyFormat(price)}
				</span>
			</div>
		</Link>
	);
};

export default Card;
