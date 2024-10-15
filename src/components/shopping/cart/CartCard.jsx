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
	const { name, price, quantity, category, img, toppings } = item;

	// Función para capitalizar cada palabra con solo la primera letra en mayúscula
	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Función para formatear los toppings en una oración
	const formatToppings = (toppingsArray) => {
		if (!toppingsArray || toppingsArray.length === 0) return "";

		const names = toppingsArray.map((topping) => capitalizeWords(topping.name));

		if (names.length === 1) {
			return names[0];
		} else if (names.length === 2) {
			return `${names[0]} y ${names[1]}`;
		} else {
			const last = names.pop();
			return `${names.join(", ")} y ${last}`;
		}
	};

	console.log(item);

	return (
		<div className="flex flex-row border w-full h-[250px] border-black border-opacity-20 rounded-xl mb-4">
			<div className="w-1/3 bg-gradient-to-b flex items-center from-gray-300 to-red-400 rounded-l-xl overflow-hidden">
				<img
					src={img ? `/menu/${img}` : getDefaultImage(item)}
					alt={name}
					className="h-full object-cover"
				/>
			</div>

			<div className="flex flex-col w-2/3 justify-between px-4 pt-2 pb-4">
				<div>
					<h3 className="text-2xl font-bold mb-1.5 leading-6">
						{capitalizeWords(name)}
					</h3>

					{/* Aclaraciones */}
					<div className="flex flex-col space-y-1">
						{/* Mostrar toppings formateados */}
						{toppings && toppings.length > 0 && (
							<p className="text-xs font-medium">
								Toppings: {formatToppings(toppings)}.
							</p>
						)}
						<p className="text-xs font-medium">
							Presiona para agregar una aclaracion
						</p>
					</div>
				</div>
				<div className="flex flex-col items-start">
					<p className="text-2xl font-bold mb-2">{currencyFormat(price)}</p>
					<QuickAddToCart product={item} />
				</div>
			</div>
		</div>
	);
};

export default CartCard;
