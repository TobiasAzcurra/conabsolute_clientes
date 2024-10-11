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
		<div className="flex flex-row border w-full  border-black border-opacity-20 rounded-xl">
			<img
				src={img ? `/menu/${img}` : getDefaultImage(item)}
				alt={name}
				className="w-16 h-16 object-cover rounded"
			/>
			<div className="flex flex-col justify-between gap-5 pt-2 pb-4">
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
