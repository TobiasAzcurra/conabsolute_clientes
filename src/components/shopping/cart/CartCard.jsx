import React from "react";
import currencyFormat from "../../../helpers/currencyFormat";

const CartCard = ({
	item,
	index,
	getDefaultImage,
	decrementQuantity,
	incrementQuantity,
	deleteItem,
}) => {
	const { name, price, quantity, category, img } = item;

	return (
		<div className="flex items-center bg-white shadow-md rounded-lg p-4  w-full max-w-md">
			<img
				src={img ? `/menu/${img}` : getDefaultImage(item)}
				alt={name}
				className="w-16 h-16 object-cover rounded"
			/>
			<div className="ml-4 flex-1">
				<h3 className="text-lg font-semibold">{name}</h3>
				<p className="text-gray-600">{currencyFormat(price)}</p>
				<p className="text-gray-500 capitalize">{category}</p>
			</div>
			<div className="flex items-center">
				<button
					onClick={() => decrementQuantity(index, quantity)}
					className="px-2 py-1 bg-gray-200 rounded"
				>
					-
				</button>
				<span className="mx-2">{quantity}</span>
				<button
					onClick={() => incrementQuantity(index)}
					className="px-2 py-1 bg-gray-200 rounded"
				>
					+
				</button>
			</div>
			<button
				onClick={() => deleteItem(index)}
				className="ml-4 text-red-500 hover:text-red-700"
			>
				🗑️
			</button>
		</div>
	);
};

export default CartCard;
