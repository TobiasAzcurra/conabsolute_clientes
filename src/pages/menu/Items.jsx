import { Link } from "react-router-dom";

const Items = ({ selectedItem, img, name, handleItemClick }) => {
	return (
		<li>
			<Link
				className={`flex flex-col items-center justify-center text-center py-2 px-4 h-32 w-32 sm:h-44 sm:w-44 hover:bg-red-main  hover:text-black  transition duration-200 ${
					selectedItem === name ? "bg-red-main text-black" : "text-white"
				}`}
				to={name === "PROMOCIONES" ? "/menu/burgers" : `/menu/${name}`}
				onClick={() => handleItemClick(name)}
			>
				<div className="flex flex-col items-center">
					<img
						src={img}
						alt={name}
						className={`${
							name === "bebidas" || "burgers" ? "h-16" : " h-16 w-16"
						} mb-4 md:h-20 md:mb-4  flex-shrink-0`}
					/>
					<span className="text-xs font-bold whitespace-nowrap  font-antonio">
						{name.toLocaleUpperCase()}
					</span>
				</div>
			</Link>
		</li>
	);
};

export default Items;
