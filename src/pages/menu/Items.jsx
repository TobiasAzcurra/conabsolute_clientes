import { Link, useLocation } from "react-router-dom";
import QuickAddToCart from "../../components/shopping/card/quickAddToCart";
import { useState } from "react";
import { listenToAltaDemanda } from '../../firebase/readConstants'
import { useEffect } from "react";

const Items = ({
	selectedItem,
	img,
	name,
	currentOrder,
	handleItemClick,
	isPedidoComponente = false,
}) => {
	// Importamos useLocation para obtener la ruta actual
	const [priceFactor, setPriceFactor] = useState(1);
	const location = useLocation();



	useEffect(() => {
		const unsubscribe = listenToAltaDemanda((altaDemanda) => {
			setPriceFactor(altaDemanda.priceFactor);
		});

		return () => unsubscribe();
	}, []);


	const adjustedPrice = selectedItem?.price * priceFactor;

	// Cuando pasamos el producto a QuickAddToCart, incluimos el precio ajustado
	const adjustedProduct = {
		...selectedItem,
		price: adjustedPrice
	};

	// Función para capitalizar cada palabra con solo la primera letra en mayúscula
	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Verificamos si estamos en la ruta /carrito
	const isCarrito = location.pathname === "/carrito";
	// Determinamos si este item está seleccionado
	const isSelected = selectedItem === name;

	// Ajustamos las clases de los estilos dependiendo de si está seleccionado
	const borderStyle = isSelected
		? "border-2 border-black border-opacity-100"
		: "border border-black border-opacity-20";

	const className = `flex flex-col items-center ${borderStyle} rounded-3xl bg-gray-100 p-1 transition duration-300 text-black ${isCarrito || isPedidoComponente ? "w-[110px]" : "w-full max-w-[200px]"
		}`;

	// Ajustamos la fuente de la imagen solo si estamos en /carrito
	let imageSrc = img;
	if (isCarrito) {
		imageSrc =
			img.startsWith("/menu/") || img.startsWith("http") ? img : `/menu/${img}`;
	}



	const content = (
		<>
			<div className="h-[70px] w-full rounded-t-3xl overflow-hidden bg-gradient-to-b from-gray-100 via-gray-100 to-gray-300 relative flex justify-center">
				<img
					className="object-cover absolute top-2.5 h-[70px]"
					src={imageSrc}
					alt={name}
				/>
			</div>
			<div
				className={`font-coolvetica text-center ${isCarrito || isPedidoComponente
					? "flex flex-col items-center justify-between h-[93px]"
					: "h-[50px]"
					}`}
			>
				<h5 className="mt-1 text-xs font-medium tracking-tight">
					{capitalizeWords(name)}
				</h5>
				{isCarrito && selectedItem && (
					<div className="pb-3">
						<QuickAddToCart product={adjustedProduct} animateFromCenter={true} />
					</div>
				)}
				{isPedidoComponente && selectedItem && (
					<div className="pb-3">
						<QuickAddToCart
							product={adjustedProduct}
							animateFromCenter={true}
							isPedidoComponente={isPedidoComponente}
							currentOrder={currentOrder}
						/>
					</div>
				)}
			</div>
		</>
	);

	if (isCarrito || isPedidoComponente) {
		// Cuando estás en /carrito, renderizamos un <div> en lugar de un <Link>
		return <div className={className}>{content}</div>;
	} else {
		// Comportamiento normal cuando no estás en /carrito
		return (
			<Link
				className={className}
				to={`/menu/${name}`}
				onClick={() => handleItemClick(name)}
			>
				{content}
			</Link>
		);
	}
};

export default Items;
