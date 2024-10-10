import { Link, useLocation } from "react-router-dom";

const Items = ({ selectedItem, img, name, handleItemClick }) => {
	// Importamos useLocation para obtener la ruta actual
	const location = useLocation();

	// Función para capitalizar cada palabra
	const capitalizeWords = (str) => {
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Verificamos si estamos en la ruta /carrito
	const isCarrito = location.pathname === "/carrito";

	const className =
		"flex flex-col items-center border border-black border-opacity-20 rounded-xl bg-gray-100 p-1 transition duration-300 w-full max-w-[400px] text-black";

	// Ajustamos la fuente de la imagen solo si estamos en /carrito
	let imageSrc = img;
	if (isCarrito) {
		imageSrc =
			img.startsWith("/menu/") || img.startsWith("http") ? img : `/menu/${img}`;
	}

	const content = (
		<>
			<div className="h-[70px] w-full rounded-t-xl overflow-hidden bg-gradient-to-b from-gray-300 to-red-400 relative flex justify-center">
				<img
					className="object-cover absolute top-2.5 h-[70px]"
					src={imageSrc}
					alt={name}
				/>
			</div>
			<div className="h-[50px] font-coolvetica text-center">
				<h5 className="mt-1 text-xs font-medium tracking-tight">
					{capitalizeWords(name)}
				</h5>
			</div>
		</>
	);

	if (isCarrito) {
		// Cuando estás en /carrito, renderizamos un <div> en lugar de un <Link>
		return <div className={className}>{content}</div>;
	} else {
		// Comportamiento normal cuando no estás en /carrito
		return (
			<Link
				className={className}
				to={name === "PROMOCIONES" ? "/menu/burgers" : `/menu/${name}`}
				onClick={() => handleItemClick(name)}
			>
				{content}
			</Link>
		);
	}
};

export default Items;
