import React from "react";
import { Link } from "react-router-dom";
import currencyFormat from "../../helpers/currencyFormat";

const FloatingCart = ({ totalQuantity, cart }) => {
	"este es el carrito", cart;

	const totalPrice = cart.reduce((acc, item) => {
		// Suma el precio de las hamburguesas
		let itemTotal = item.price * item.quantity;

		// Suma el precio de los toppings pagos
		const toppingsTotal = item.toppings.reduce((tAcc, topping) => {
			return tAcc + topping.price;
		}, 0);

		// Multiplica el total de toppings por la cantidad de hamburguesas
		itemTotal += toppingsTotal * item.quantity;

		return acc + itemTotal;
	}, 0);

	return (
		<div className="fixed border border-black border-opacity-30  bottom-4 rounded-2xl left-4 right-4 h-20 bg-white bg-opacity-80 backdrop-blur-sm pl-4 flex flex-row items-center justify-between md:justify-center gap-4 font-coolvetica  z-50">
			<div className="flex flex-col items-center">
				<p className=" text-xs font-medium ">
					{totalQuantity} {totalQuantity === 1 ? "producto" : "productos"}
				</p>
				<p className="text-4xl font-bold mt-[-5px]">
					{currencyFormat(totalPrice)}
				</p>
			</div>
			<Link
				to="/carrito"
				className="bg-red-main mr-2 w-full  items-center flex justify-center md:w-[500px] h-[62px] px-6  rounded-2xl  "
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 mr-2 text-gray-100">
					<path fill-rule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z" clip-rule="evenodd" />
				</svg>

				<p className="text-gray-100  text-2xl font-bold text-center">
					Ver pedido
				</p>
			</Link>
		</div>
	);
};

export default FloatingCart;
