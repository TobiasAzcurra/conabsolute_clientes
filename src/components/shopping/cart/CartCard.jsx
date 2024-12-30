import React, { useState } from "react";
import currencyFormat from "../../../helpers/currencyFormat";
import QuickAddToCart from "../card/quickAddToCart";
import { updateOrderItemQuantity } from "../../../firebase/uploadOrder";

const CartCard = ({
	item,
	index,
	getDefaultImage,
	decrementQuantity,
	isPedidoComponente,
	incrementQuantity,
	deleteItem,
	currentOrder = null,
	readOnly = false,
}) => {
	const { name, price, quantity, category, img, toppings } = item;
	const [isUpdating, setIsUpdating] = useState(false);

	const capitalizeWords = (str) => {
		if (!str) return "";
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const formatToppings = (toppingsArray) => {
		if (
			!toppingsArray ||
			!Array.isArray(toppingsArray) ||
			toppingsArray.length === 0
		)
			return "";

		// Manejar tanto arrays de strings como arrays de objetos
		const names = toppingsArray
			.map((topping) => {
				if (typeof topping === "string") {
					return capitalizeWords(topping);
				}
				return topping && typeof topping === "object" && topping.name
					? capitalizeWords(topping.name)
					: "";
			})
			.filter((name) => name); // Filtrar nombres vacíos

		if (names.length === 0) return "";
		if (names.length === 1) return names[0];
		if (names.length === 2) return `${names[0]} y ${names[1]}`;

		const last = names.pop();
		return `${names.join(", ")} y ${last}`;
	};

	const calculateTotalPrice = () => {
		const toppingsTotal =
			toppings && Array.isArray(toppings)
				? toppings.reduce((acc, topping) => {
						if (typeof topping === "object" && topping?.price) {
							return acc + topping.price;
						}
						return acc;
				  }, 0)
				: 0;
		return (price || 0) + toppingsTotal;
	};

	const handleQuantityChange = async (newQuantity) => {
		if (!currentOrder) return;

		setIsUpdating(true);
		try {
			await updateOrderItemQuantity(
				currentOrder.id,
				currentOrder.fecha,
				index,
				newQuantity
			);
			console.log(`✅ Cantidad actualizada para ${name}: ${newQuantity}`);
		} catch (error) {
			console.error("❌ Error al actualizar la cantidad:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const totalPrice = calculateTotalPrice();

	return (
		<div className="flex flex-row border w-full h-[250px] border-black border-opacity-20 rounded-3xl md:w-[450px]">
			<div className="w-1/3 bg-gradient-to-b flex items-center from-gray-100 via-gray-100 to-gray-300 rounded-l-3xl overflow-hidden">
				<img
					src={img ? `/menu/${img}` : getDefaultImage(item)}
					alt={name || "Product"}
					className="h-[350px] object-cover"
				/>
			</div>

			<div className="flex flex-col w-2/3 justify-center px-4 pt-2 pb-4">
				<div>
					<h3 className="text-2xl font-bold mb-1.5 leading-6">
						{capitalizeWords(name)}
					</h3>

					<div className="flex flex-col space-y-1">
						{toppings && toppings.length > 0 && (
							<p className="text-xs mb-4 font-medium">
								Toppings: {formatToppings(toppings)}.
							</p>
						)}
					</div>
				</div>
				<div className="flex flex-col items-start">
					<p className="text-2xl font-bold mb-4 mt-[-5px]">
						{currencyFormat(totalPrice)}
					</p>
					<QuickAddToCart
						product={item}
						isOrderItem={!!currentOrder}
						isPedidoComponente={true}
						initialOrderQuantity={quantity}
						onOrderQuantityChange={
							currentOrder ? handleQuantityChange : undefined
						}
						isUpdating={isUpdating}
					/>
				</div>
			</div>
		</div>
	);
};

export default CartCard;
