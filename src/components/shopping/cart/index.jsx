import { useSelector, useDispatch } from "react-redux";
import {
	addOneItem,
	removeOneItem,
	clearCart,
	removeItem,
} from "../../../redux/cart/cartSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Items from "../../../pages/menu/Items";
import box from "../../../assets/box.png";
import fries from "../../../assets/fries.png";
import burgers from "../../../assets/burgers-v1.json";
import papas from "../../../assets/papas-v1.json";
import drinks from "../../../assets/drinks-v1.json";
import CartCard from "./CartCard";
import carrusel from "../../../assets/carrusel3.jpg";
import MovingRibbon from "../MovingRibbon";
import FormCustom from "../../form";

// Preparar los productos con sus categorías
const burgersArray = Object.values(burgers).map((product) => ({
	...product,
	category: "burgers",
}));

const papasArray = Object.values(papas).map((product) => ({
	...product,
	category: "papas",
}));

const drinksArray = Object.values(drinks).map((product) => ({
	...product,
	category: "bebidas",
}));

const allProducts = [...papasArray, ...drinksArray, ...burgersArray];

export const items = {
	burgers: "burgers",
	papas: "papas",
	bebidas: "bebidas",
};

// Función para precargar imágenes
const preloadImage = (src) => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.src = src;
		img.onload = resolve;
		img.onerror = reject;
	});
};

const CartItems = () => {
	const { cart, total } = useSelector((state) => state.cartState);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { pathname } = useLocation();
	const [imagesLoaded, setImagesLoaded] = useState(false);

	const getDefaultImage = (product) => {
		if (product.category === "burgers") return box;
		if (product.category === "papas") return fries;
		if (product.category === "bebidas") return "/menu/coca.png";
		return "/ruta/a/imagen/default.png";
	};

	// Precargar todas las imágenes necesarias
	useEffect(() => {
		const loadImages = async () => {
			try {
				const imagePromises = cart.map((item) =>
					preloadImage(item.img ? `/menu/${item.img}` : getDefaultImage(item))
				);

				// También precargamos las imágenes de los productos sugeridos
				const suggestedProducts = allProducts
					.filter(
						(product) =>
							!cart.some((cartItem) => cartItem.name === product.name)
					)
					.slice(0, 5); // Limitamos a los primeros 5 para optimizar

				const suggestedImagePromises = suggestedProducts.map((product) =>
					preloadImage(
						product.img ? `/menu/${product.img}` : getDefaultImage(product)
					)
				);

				await Promise.all([...imagePromises, ...suggestedImagePromises]);
				setImagesLoaded(true);
			} catch (error) {
				console.error("Error preloading images:", error);
				setImagesLoaded(true); // Permitimos que la UI se muestre incluso si hay errores
			}
		};

		loadImages();
	}, [cart]);

	// Rest of your existing code...

	return (
		<div className="flex flex-col font-coolvetica overflow-x-hidden">
			<div className="flex justify-center flex-col mt-8 items-center w-full">
				<p className="text-2xl font-bold">Tu pedido</p>
				<div
					className="flex flex-col md:flex-row gap-2 w-full mt-2 px-4 overflow-x-auto custom-scrollbar"
					style={{
						scrollBehavior: "smooth",
						WebkitOverflowScrolling: "touch",
					}}
				>
					<div className="flex flex-col md:flex-row gap-2 md:w-max">
						{cart.map((item, index) => (
							<CartCard
								key={item.id || index}
								item={item}
								index={index}
								getDefaultImage={getDefaultImage}
								decrementQuantity={decrementQuantity}
								incrementQuantity={incrementQuantity}
								deleteItem={deleteItem}
								isLoaded={imagesLoaded}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Productos sugeridos */}
			<div className="flex justify-center flex-col mt-6 items-start w-full">
				<p className="text-2xl font-bold mx-auto mb-2">
					Agrega. Esto no es para tibios.
				</p>
				<div
					className="flex gap-2 overflow-x-auto overflow-y-hidden pl-4 pr-4 custom-scrollbar"
					style={{
						maxHeight: "300px",
						paddingBottom: "1rem",
						scrollBehavior: "smooth",
						WebkitOverflowScrolling: "touch",
						width: "100%",
					}}
				>
					<div className="flex gap-2" style={{ width: "max-content" }}>
						{allProducts
							.filter(
								(product) =>
									!cart.some((cartItem) => cartItem.name === product.name)
							)
							.map((product, index) => (
								<Items
									key={product.id || index}
									selectedItem={product}
									img={
										product.img
											? `/menu/${product.img}`
											: getDefaultImage(product)
									}
									name={product.name}
									handleItemClick={() => {}}
									isCart
									priority={index < 5} // Priorizar la carga de las primeras 5 imágenes
								/>
							))}
					</div>
				</div>
			</div>

			<FormCustom cart={cart} total={total} />

			{/* ... rest of your component ... */}
		</div>
	);
};

export default CartItems;
