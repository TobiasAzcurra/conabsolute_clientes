import React from "react";
import { Link } from "react-router-dom";
import currencyFormat from "../../helpers/currencyFormat";

const FloatingCart = ({ totalQuantity, cart }) => {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 flex items-center justify-between">
			<span className="text-black text-lg font-bold">
				{totalQuantity} {totalQuantity === 1 ? "producto" : "productos"} -{" "}
				{currencyFormat(
					cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
				)}
			</span>
			<Link
				to="/carrito"
				className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-lg"
			>
				Ver carrito
			</Link>
		</div>
	);
};

export default FloatingCart;
