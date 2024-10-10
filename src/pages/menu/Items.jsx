import { Link } from "react-router-dom";

const Items = ({ selectedItem, img, name, handleItemClick }) => {
	// Función para capitalizar cada palabra
	const capitalizeWords = (str) => {
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	return (
		<Link
			className={`flex flex-col items-center border border-black border-opacity-20 rounded-xl bg-gray-100 hover:shadow-lg p-1 transition duration-300 w-full max-w-[400px] text-black`}
			to={name === "PROMOCIONES" ? "/menu/burgers" : `/menu/${name}`}
			onClick={() => handleItemClick(name)}
		>
			<div className="h-[70px] w-full rounded-t-xl overflow-hidden bg-gradient-to-b from-gray-300 to-red-400  relative flex  justify-center">
				<img
					className="object-cover absolute top-2.5 h-[70px] "
					src={img}
					alt={name}
				/>
			</div>
			<div className=" h-[50px] font-coolvetica text-center">
				<h5 className=" mt-1 text-xs font-medium tracking-tight">
					{capitalizeWords(name)}
				</h5>
			</div>
		</Link>
	);
};

export default Items;
