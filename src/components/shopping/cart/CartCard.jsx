import React from "react";
import currencyFormat from "../../../helpers/currencyFormat";
import QuickAddToCart from "../card/quickAddToCart";

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
		<div className="flex flex-row border w-full h-[200px] border-black border-opacity-20 rounded-xl">
			<div className="w-[150px] bg-gradient-to-b from-gray-300 to-red-400 rounded-l-xl">
				<img
					src={img ? `/menu/${img}` : getDefaultImage(item)}
					alt={name}
					className="h-full object-cover rounded"
				/>
			</div>

			<div className="flex flex-col justify-between px-4 pt-2 pb-4">
				<div>
					<h3 className="text-2xl font-bold mb-1">{name}</h3>
					<p className="text-xs font-medium">Sin aclaraciones</p>
					<p className="text-xs font-medium">Presiona para editar</p>
				</div>
				<div className="flex flex-col">
					<p className="text-2xl font-bold mb-2">{currencyFormat(price)}</p>
					<QuickAddToCart product={item} />
				</div>
			</div>
		</div>
	);
};

export default CartCard;
