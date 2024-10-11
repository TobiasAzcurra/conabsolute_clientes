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
		<div className="flex flex-row border w-full h-[150px] border-black border-opacity-20 rounded-xl">
			<img
				src={img ? `/menu/${img}` : getDefaultImage(item)}
				alt={name}
				className="w-16 h-16 object-cover rounded"
			/>
			<div className="flex flex-col justify-between py-2">
				<div>
					<h3 className="text-2xl font-bold mb-1">{name}</h3>
					<p className="text-xs font-medium">Sin aclaraciones</p>
					<p className="text-xs font-medium">Presiona para editar</p>
				</div>
				<div>
					<p className="text-2xl font-bold">{currencyFormat(price)}</p>
				</div>
			</div>
		</div>
	);
};

export default CartCard;
