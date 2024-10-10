import { Link } from "react-router-dom";

const Items = ({ selectedItem, img, name, handleItemClick }) => {
	// Función para capitalizar cada palabra
	const capitalizeWords = (str) => {
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	return (
		<Link
			className={`flex flex-col items-center border border-black border-opacity-20 rounded-xl bg-gray-100 hover:shadow-lg transition duration-300 w-full max-w-[400px] text-black`}
			to={name === "PROMOCIONES" ? "/menu/burgers" : `/menu/${name}`}
			onClick={() => handleItemClick(name)}
		>
			<div className="h-[130px] overflow-hidden rounded-t-xl w-full bg-gradient-to-b from-gray-300 to-red-400 relative">
				<img
					className="object-cover w-full h-full"
					src={img}
					alt={name}
					style={{ objectPosition: "center" }}
				/>
			</div>
			<div className="flex px-4 flex-col items-center justify-between leading-normal font-coolvetica text-center">
				<h5 className="mb-1 mt-4 text-2xl font-bold tracking-tight">
					{capitalizeWords(name)}
				</h5>
			</div>
		</Link>
	);
};

export default Items;
