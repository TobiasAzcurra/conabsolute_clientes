import React, { useState, useEffect } from "react";
import currencyFormat from "../../../helpers/currencyFormat";
import QuickAddToCart from "../card/quickAddToCart";

const CartCard = ({
	item,
	index,
	getDefaultImage,
	decrementQuantity,
	incrementQuantity,
	deleteItem,
	isLoaded = false,
}) => {
	const { name, price, quantity, category, img, toppings } = item;
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageSrc, setImageSrc] = useState(null);

	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const formatToppings = (toppingsArray) => {
		if (!toppingsArray || toppingsArray.length === 0) return "";
		const names = toppingsArray.map((topping) => capitalizeWords(topping.name));
		if (names.length === 1) return names[0];
		if (names.length === 2) return `${names[0]} y ${names[1]}`;
		const last = names.pop();
		return `${names.join(", ")} y ${last}`;
	};

	const calculateTotalPrice = () => {
		const toppingsTotal = toppings
			? toppings.reduce((acc, topping) => acc + topping.price, 0)
			: 0;
		return price + toppingsTotal;
	};

	useEffect(() => {
		const image = new Image();
		const src = img ? `/menu/${img}` : getDefaultImage(item);
		image.src = src;

		image.onload = () => {
			setImageSrc(src);
			setTimeout(() => {
				setImageLoaded(true);
			}, 50);
		};
	}, [img, item, getDefaultImage]);

	const totalPrice = calculateTotalPrice();

	return (
		<div className="flex flex-row border w-full h-[250px] border-black border-opacity-20 rounded-3xl md:w-[450px]">
			<div className="w-1/3 bg-gradient-to-b flex items-center from-gray-100 via-gray-100 to-gray-300 rounded-l-3xl overflow-hidden relative">
				{/* Skeleton loader */}
				<div
					className={`absolute inset-0 bg-gray-200 animate-pulse transition-opacity duration-300 ease-in-out ${
						imageLoaded ? "opacity-0" : "opacity-100"
					}`}
				/>

				{/* Imagen con fade-in */}
				{imageSrc && (
					<img
						src={imageSrc}
						alt={name}
						className={`h-[350px] object-cover transition-opacity duration-500 ${
							imageLoaded ? "opacity-100" : "opacity-0"
						}`}
						loading="eager"
						decoding="sync"
						fetchPriority="high"
					/>
				)}
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
					<QuickAddToCart product={item} />
				</div>
			</div>
		</div>
	);
};

export default CartCard;
