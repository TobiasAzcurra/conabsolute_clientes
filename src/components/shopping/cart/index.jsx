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
import CartCard from "./CartCard";
import arrow from "../../../assets/arrowIcon.png";
import Carrusel from "../../Carrusel";
import logo from "../../../assets/anheloTMwhite.png";

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

	// Agregar console.log para mostrar el carrito completo
	useEffect(() => {
		console.log("Current cart state:", cart);
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
				<div className="flex flex-col gap-2 w-full mt-2 px-4">
					{cart.map((item, index) => (
						<CartCard
							key={item.id || index}
							item={item}
							index={index}
							getDefaultImage={getDefaultImage}
							decrementQuantity={decrementQuantity}
							incrementQuantity={incrementQuantity}
							deleteItem={deleteItem}
						/>
					))}
				</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-start">
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
			<div className="flex justify-center flex-col mt-3.5 items-center px-4">
				<p className="text-2xl font-bold mb-2">Datos para la entrega</p>
				<div className="w-full items-center    rounded-xl border-2 border-black ">
					<div className="flex flex-row justify-between px-3 h-10 items-center border border-black border-opacity-20">
						<div className="flex flex-row gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="h-6"
							>
								<path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
								<path
									fill-rule="evenodd"
									d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
									clip-rule="evenodd"
								/>
								<path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
							</svg>

							<p className=" text-opacity-20 text-black">Efectivo</p>
						</div>
						<img src={arrow} className="h-2" alt="" />
					</div>
					<div className="flex flex-row gap-2 pl-3 h-10 items-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class="h-6"
						>
							<path
								fill-rule="evenodd"
								d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
								clip-rule="evenodd"
							/>
						</svg>

						<p className=" text-opacity-20 text-black">¿Tenes un cupon?</p>
					</div>
				</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center px-4">
				<p className="text-2xl font-bold mb-2">Metodo de pago</p>
				<div className="w-full items-center    rounded-xl border-2 border-black ">
					<div className="flex flex-row justify-between px-3 h-10 items-center border border-black border-opacity-20">
						<div className="flex flex-row gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="h-6"
							>
								<path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
								<path
									fill-rule="evenodd"
									d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
									clip-rule="evenodd"
								/>
								<path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
							</svg>

							<p className=" text-opacity-20 text-black">Efectivo</p>
						</div>
						<img src={arrow} className="h-2" alt="" />
					</div>
					<div className="flex flex-row gap-2 pl-3 h-10 items-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class="h-6"
						>
							<path
								fill-rule="evenodd"
								d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
								clip-rule="evenodd"
							/>
						</svg>

						<p className=" text-opacity-20 text-black">¿Tenes un cupon?</p>
					</div>
				</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Resumen</p>
				<div className="flex flex-row justify-between w-full px-4">
					<p>Productos</p>
					<p>{currencyFormat(total)}</p>
				</div>
				<div className="flex flex-row justify-between w-full px-4">
					<p>Envio</p>
					<p>$2.000</p>
				</div>
				<div className="flex flex-row justify-between w-full px-4">
					<p>Descuentos</p>
					<p>-$900</p>
				</div>
				<div className="flex flex-row justify-between w-full px-4">
					<p className="font-bold">Total</p>
					<p className="font-bold">{currencyFormat(total + 2000 - 900)}</p>
				</div>
			</div>
			<p className="text-2xl text-center mt-6 flex items-center justify-center bg-red-main text-gray-100 mx-4 rounded-xl h-[80px] font-bold">
				Pedir
			</p>
			<div className="flex justify-center flex-col mt-6 items-center relative">
				<p className="absolute top-4 text-left text-gray-100 z-50 left-4 right-4 text-xl font-bold">
					Cocinamos momentos que la gente ama, por eso quedan pidiendo más.
				</p>
				<img src={logo} className="absolute top-20 h-8 right-4 z-50" alt="" />

				<Carrusel />
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
