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
	const { name, price, quantity, category, img, toppings, extra } = item;
	const isConfirmed = item.isConfirmed || false;
	const [isUpdating, setIsUpdating] = useState(false);

	console.log("🔍 Renderizando CartCard para:", name);
	console.log("📦 Props del item:", {
		extra,
		isConfirmed,
		isPedidoComponente,
		hasExtraProp: item.hasOwnProperty("extra"),
	});

	// Un producto estará deshabilitado si:
	// 1. No tiene la prop extra O tiene extra undefined (producto original)
	// 2. O tiene extra:true y está confirmado
	const isDisabled =
		isPedidoComponente &&
		(!item.hasOwnProperty("extra") ||
			item.extra === undefined ||
			(extra === true && isConfirmed));

	console.log("🔒 Estado de disabled:", {
		isDisabled,
		noTieneExtra: !item.hasOwnProperty("extra"),
		extraUndefined: item.extra === undefined,
		esExtraConfirmado: extra === true && isConfirmed,
		isPedidoComponente,
	});

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

		const names = toppingsArray
			.map((topping) => {
				if (typeof topping === "string") {
					return capitalizeWords(topping);
				}
				return topping && typeof topping === "object" && topping.name
					? capitalizeWords(topping.name)
					: "";
			})
			.filter((name) => name);

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
		<div className="relative">
			<div
				className={`flex flex-row border w-full h-[250px] border-black border-opacity-20 rounded-3xl md:w-[450px] ${
					isDisabled ? "blur-sm cursor-not-allowed bg-gray-100" : ""
				}`}
			>
				<div
					className={`w-1/3 bg-gradient-to-b flex items-center from-gray-100 via-gray-100 to-gray-300 rounded-l-3xl overflow-hidden`}
				>
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
						<div className="flex flex-row items-center gap-2">
							<QuickAddToCart
								product={item}
								isOrderItem={!!currentOrder}
								isPedidoComponente={true}
								initialOrderQuantity={quantity}
								onOrderQuantityChange={
									currentOrder ? handleQuantityChange : undefined
								}
								isUpdating={isUpdating}
								disabled={isDisabled}
							/>
						</div>
					</div>
				</div>
			</div>
			{isDisabled && (
				<div className="absolute border-2 border-black inset-0 flex items-center justify-center rounded-3xl bg-black bg-opacity-40">
					<div className="flex flex-col items-center space-y-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="white"
							className="h-12 w-12"
						>
							<path
								fillRule="evenodd"
								d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
								clipRule="evenodd"
							/>
						</svg>
						<span className="text-white font-bold text-2xl">
							Ya cocinándose
						</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default CartCard;
