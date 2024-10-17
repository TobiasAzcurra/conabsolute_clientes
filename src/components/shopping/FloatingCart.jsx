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
		<div className="fixed bottom-0 left-0 right-0 h-20 bg-gray-100 shadow-[0px_-10px_15px_-3px_rgba(0,0,0,0.1),0px_-4px_6px_-2px_rgba(0,0,0,0.1)]  px-4 flex flex-row items-center justify-between md:justify-center gap-4 font-coolvetica w-full z-50">
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
				className="bg-red-main w-full items-center flex justify-center md:w-[500px] h-12  px-6  rounded-3xl  "
			>
				<p className="text-gray-100 mb-1 text-2xl font-bold text-center">
					Ver pedido
				</p>
			</Link>
		</div>
	);
};

export default FloatingCart;
