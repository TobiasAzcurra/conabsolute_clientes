import React from "react";
import { Link } from "react-router-dom";
import currencyFormat from "../../helpers/currencyFormat";

const FloatingCart = ({ totalQuantity, cart }) => {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-gray-100 shadow-[0px_-10px_15px_-3px_rgba(0,0,0,0.3),0px_-4px_6px_-2px_rgba(0,0,0,0.1)] pb-3 pt-3 px-4 flex flex-row items-center justify-between font-coolvetica w-full">
			<div className="flex flex-col items-center ">
				<p className=" text-xs font-bold ">
					{totalQuantity} {totalQuantity === 1 ? "producto" : "productos"}
				</p>
				<p className="text-4xl font-bold mt-[-5px]">
					{currencyFormat(
						cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
					)}
				</p>
			</div>
			<Link
				to="/carrito"
				className="bg-red-600 w-2/3 text-center text-gray-100 h-10 text-xs px-6 py-3 rounded-lg font-bold "
			>
				Ver carrito
			</Link>
		</div>
	);
};

export default FloatingCart;
