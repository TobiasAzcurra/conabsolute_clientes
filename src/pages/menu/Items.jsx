import { Link, useLocation } from "react-router-dom";
import QuickAddToCart from "../../components/shopping/card/quickAddToCart";

const Items = ({ selectedItem, img, name, handleItemClick }) => {
	// Importamos useLocation para obtener la ruta actual
	const location = useLocation();

	// Función para capitalizar cada palabra con solo la primera letra en mayúscula
	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Verificamos si estamos en la ruta /carrito
	const isCarrito = location.pathname === "/carrito";

	// Ajustamos las clases de los estilos dependiendo de la ruta actual
	const className = `flex flex-col items-center border border-black border-opacity-20 rounded-xl bg-gray-100 p-1 transition duration-300 text-black ${
		isCarrito ? "w-[110px]" : "w-full max-w-[400px]"
	}`;

	// Ajustamos la fuente de la imagen solo si estamos en /carrito
	let imageSrc = img;
	if (isCarrito) {
		imageSrc =
			img.startsWith("/menu/") || img.startsWith("http") ? img : `/menu/${img}`;
	}

	const content = (
		<>
			<div className="h-[70px] w-full rounded-t-xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-300 relative flex justify-center">
				<img
					className="object-cover absolute top-2.5 h-[70px]"
					src={imageSrc}
					alt={name}
				/>
			</div>
			<div
				className={` font-coolvetica text-center ${
					isCarrito
						? "flex flex-col items-center justify-between h-[93px]"
						: "h-[50px]"
				}`}
			>
				<h5 className="mt-1 text-xs font-medium tracking-tight">
					{capitalizeWords(name)}
				</h5>
				{isCarrito && selectedItem && (
					<div className=" pb-3">
						<QuickAddToCart product={selectedItem} animateFromCenter={true} />
					</div>
				)}
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
