import React from "react";
import { Link } from "react-router-dom";
import currencyFormat from "../../helpers/currencyFormat";

const FloatingCart = ({ totalQuantity, cart }) => {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-gray-100 shadow-[0px_-10px_15px_-3px_rgba(0,0,0,0.3),0px_-4px_6px_-2px_rgba(0,0,0,0.1)] p-4 flex items-center justify-between">
			<span className="text-black text-lg font-bold">
				{totalQuantity} {totalQuantity === 1 ? "producto" : "productos"} -{" "}
				{currencyFormat(
					cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
				)}
			</span>
			<Link
				to="/carrito"
				className="bg-red-600 text-gray-100 px-6 py-3 rounded-lg font-bold text-lg"
			>
				Ver carrito
			</Link>
		</div>
	);
};

export default FloatingCart;
