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
			<div className="w-1/3 bg-gradient-to-b flex items-center from-gray-300 to-red-400 rounded-l-xl overflow-hidden">
				<img
					src={img ? `/menu/${img}` : getDefaultImage(item)}
					alt={name}
					className=" h-[300px] object-cover"
				/>
			</div>

			<div className="flex flex-col w-2/3 justify-between px-4 pt-2 pb-4">
				<div>
					<h3 className="text-2xl font-bold mb-1.5 leading-6">{name}</h3>
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
