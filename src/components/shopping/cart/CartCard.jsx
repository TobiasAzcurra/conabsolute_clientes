import React, { useState, useEffect } from "react";
import {
	handleConfirmChanges,
	updateOrderItemQuantity,
} from "../../../firebase/uploadOrder";
import currencyFormat from "../../../helpers/currencyFormat";
import QuickAddToCart from "../card/quickAddToCart";
import LoadingPoints from "../../LoadingPoints";

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
	const [countdown, setCountdown] = useState(null);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		let timer;
		if (countdown !== null && countdown > 0) {
			timer = setTimeout(() => setCountdown(countdown - 1), 1000);
		} else if (countdown === 0) {
			handleAutoConfirm();
		}
		return () => clearTimeout(timer);
	}, [countdown]);

	const handleAutoConfirm = async () => {
		if (!currentOrder) return;
		setIsUpdating(true);
		try {
			await handleConfirmChanges(currentOrder.id);
			// console.log("✅ Producto confirmado automáticamente");
		} catch (error) {
			console.error("❌ Error al confirmar el producto:", error);
		} finally {
			setIsUpdating(false);
			setShowConfirmation(false);
		}
	};

	const handleDelete = async () => {
		if (!currentOrder || isDeleting) return;
		setIsDeleting(true);
		try {
			await updateOrderItemQuantity(
				currentOrder.id,
				currentOrder.fecha,
				index,
				0
			);
			// console.log("✅ Producto eliminado exitosamente");
		} catch (error) {
			console.error("❌ Error al eliminar el producto:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	useEffect(() => {
		if (extra && !isConfirmed && currentOrder?.onEditByUser) {
			setCountdown(10);
			setShowConfirmation(true);
		}
	}, [extra, isConfirmed, currentOrder]);

	const isDisabled =
		isPedidoComponente &&
		(!item.hasOwnProperty("extra") ||
			item.extra === undefined ||
			(extra === true && isConfirmed));

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
				if (typeof topping === "string") return capitalizeWords(topping);
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

	const totalPrice = calculateTotalPrice();

	return (
		<div className="relative">
			<div
				className={`flex flex-row border w-full h-[250px] border-black border-opacity-20 rounded-3xl md:w-[450px] ${isDisabled ? "blur-sm cursor-not-allowed bg-gray-100" : ""
					}`}
			>
				<div className="w-1/3 bg-gradient-to-b flex items-center from-gray-100 via-gray-100 to-gray-300 rounded-l-3xl overflow-hidden">
					<img
						src={img ? `/menu/${img}` : getDefaultImage(item)}
						alt={name || "Product"}
						className="h-[350px] object-cover"
					/>
				</div>

				<div className="flex flex-col w-2/3 justify-center px-4 pt-2 pb-4">
					<div>
						<h3
							className={`text-2xl font-bold mb-1.5 ${showConfirmation ? "truncate leading-none" : "leading-6"
								}`}
						>
							{capitalizeWords(name)}
						</h3>
						{toppings && toppings.length > 0 && (
							<p className="text-xs mb-4 font-medium">
								Toppings: {formatToppings(toppings)}.
							</p>
						)}
					</div>
					<div className="flex flex-col items-start">
						<p className="text-2xl font-bold mb-4 mt-[-5px]">
							{currencyFormat(totalPrice * quantity)}
						</p>
						<div className="flex flex-col w-full gap-2">
							<QuickAddToCart
								product={item}
								isOrderItem={!!currentOrder}
								isPedidoComponente={true}
								initialOrderQuantity={quantity}
								onOrderQuantityChange={
									currentOrder ? handleAutoConfirm : undefined
								}
								isUpdating={isUpdating}
								disabled={isDisabled}
							/>

							{showConfirmation && countdown !== null && (
								<div className="flex flex-col mt-2 items-center w-full">
									<p className="text-sm text-gray-600 font-medium">
										Tenés {countdown} segundos para cancelar este producto
									</p>
									<div className="w-full bg-gray-200 rounded-full h-2 mt-1">
										<div
											className="bg-black h-2 rounded-full transition-all duration-1000"
											style={{ width: `${(countdown / 10) * 100}%` }}
										/>
									</div>
									<button
										onClick={handleDelete}
										disabled={isDeleting}
										className={`mt-2 bg-gray-300 text-red-600 font-coolvetica text-center justify-center w-full h-10 flex items-center text-sm rounded-xl px-4 font-bold ${isDeleting
											? "opacity-50 cursor-not-allowed"
											: "cursor-pointer"
											}`}
									>
										<div className="flex items-center gap-1">
											{isDeleting ? (
												<LoadingPoints />
											) : (
												<>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 24 24"
														fill="currentColor"
														className="h-4 w-4"
													>
														<path
															fillRule="evenodd"
															d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
															clipRule="evenodd"
														/>
													</svg>
													ELIMINAR
												</>
											)}
										</div>
									</button>
								</div>
							)}
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
