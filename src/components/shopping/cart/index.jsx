import { useSelector, useDispatch } from "react-redux";
import currencyFormat from "../../../helpers/currencyFormat";
import {
	addOneItem,
	removeOneItem,
	clearCart,
	removeItem,
} from "../../../redux/cart/cartSlice";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Items from "../../../pages/menu/Items";
import box from "../../../assets/box.png";
import fries from "../../../assets/fries.png";
import burgers from "../../../assets/burgers-v1.json";
import papas from "../../../assets/papas-v1.json";
import drinks from "../../../assets/drinks-v1.json";

// Agregar la categoría a cada producto
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

// Concatenar todos los productos en un solo array
const allProducts = [...papasArray, ...drinksArray, ...burgersArray];

export const items = {
	burgers: "burgers",
	papas: "papas",
	bebidas: "bebidas",
};

const CartItems = () => {
	const { cart, total } = useSelector((state) => state.cartState);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	// Hacer console.log de todos los productos disponibles
	useEffect(() => {
		console.log("Todos los productos disponibles:", allProducts);
	}, []);

	const deleteItem = (i) => {
		// ... código de Swal.fire para eliminar ítems
	};

	const clearAll = () => {
		// ... código de Swal.fire para vaciar el carrito
	};

	useEffect(() => {
		if (cart.length <= 0) {
			return navigate("/menu");
		}
	}, [cart]);

	const decrementQuantity = (index, quantity) => {
		if (quantity > 1) {
			dispatch(removeOneItem(index));
		}
	};

	const incrementQuantity = (index) => {
		dispatch(addOneItem(index));
	};

	// Función para obtener la imagen predeterminada basada en la categoría
	const getDefaultImage = (product) => {
		if (product.category === "burgers") {
			return box;
		} else if (product.category === "papas") {
			return fries;
		} else if (product.category === "bebidas") {
			return "/menu/coca.png";
		} else {
			return "/ruta/a/imagen/default.png";
		}
	};

	return (
		<div className="flex flex-col font-coolvetica">
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Tu carrito</p>
				<div>Card del carrito</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-start">
				<p className="text-2xl font-bold mx-auto mb-2">
					Agrega. Esto no es para tibios.
				</p>
				<div
					className="flex gap-2 overflow-x-auto overflow-y-hidden ml-4 custom-scrollbar"
					style={{
						maxHeight: "300px", // Ajusta este valor según el espacio que necesites
						paddingBottom: "1rem",
						scrollBehavior: "smooth",
						WebkitOverflowScrolling: "touch",
						width: "100%",
					}}
				>
					<div
						className="flex gap-2"
						style={{
							display: "flex",
							width: "max-content",
						}}
					>
						{allProducts.map((product, index) => (
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
							/>
						))}
					</div>
				</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Detalle de la entrega</p>
				<div>Mapa + form</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Metodo de pago</p>
				<div>Form</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Resumen</p>
				<div>Detalle</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Pedir</p>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Imagen</p>
			</div>
			<style>
				{`
				.custom-scrollbar::-webkit-scrollbar {
					height: 8px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: #f3f4f6; /* bg-gray-100 */
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #f3f4f6; /* bg-gray-100 */
					border-radius: 10px;
					border: 2px solid transparent;
					background-clip: padding-box;
				}
				.custom-scrollbar {
					scrollbar-width: thin; /* Firefox */
					scrollbar-color: #f3f4f6 #f3f4f6; /* Firefox */
				}
			`}
			</style>
		</div>
	);
};

export default CartItems;
