// QuickAddToCart.jsx

import { useDispatch, useSelector } from "react-redux";
import {
	addItem,
	updateItemQuantity,
	removeItem,
} from "../../../redux/cart/cartSlice";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const QuickAddToCart = ({ product, animateFromCenter, toppings = [] }) => {
	const dispatch = useDispatch();
	const { cart } = useSelector((state) => state.cartState);
	const [quantity, setQuantity] = useState(1);
	const [isAdding, setIsAdding] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const quantityRef = useRef(quantity);
	const location = useLocation();

	const cartItem = cart.find(
		(item) =>
			item.name === product.name && compareToppings(item.toppings, toppings)
	);
	const cartQuantity = cartItem ? cartItem.quantity : 0;

	const handleIncrement = () => {
		setQuantity((prevQuantity) => {
			const newQuantity = prevQuantity + 1;
			quantityRef.current = newQuantity;
			return newQuantity;
		});
	};

	const handleDecrement = () => {
		if (quantity > 0) {
			setQuantity((prevQuantity) => {
				const newQuantity = prevQuantity - 1;
				quantityRef.current = newQuantity;
				return newQuantity;
			});
		}
	};

	const startAddingProcess = () => {
		setIsEditing(true);
		setIsAdding(true);
		setTimeout(() => {
			if (quantityRef.current === 0 && cartItem) {
				const itemIndex = cart.findIndex(
					(item) =>
						item.name === product.name &&
						compareToppings(item.toppings, toppings)
				);
				dispatch(removeItem(itemIndex));
			} else if (quantityRef.current >= 1) {
				if (cartItem) {
					dispatch(
						updateItemQuantity({
							name: product.name,
							toppings: toppings,
							quantity: quantityRef.current,
						})
					);
				} else {
					const burgerObject = {
						name: product.name,
						price: product.price,
						img: product.img,
						toppings: toppings,
						quantity: quantityRef.current,
						category: product.category || "default",
					};

					dispatch(addItem(burgerObject));
				}
			}
			setIsAdding(false);
			setTimeout(() => {
				setIsEditing(false);
			}, 300); // Añadimos un pequeño retraso para completar la animación de cierre
		}, 2000);
	};

	const isCarritoPage = location.pathname === "/carrito";
	const shouldAnimateBothSides =
		/^\/menu\/(burgers|bebidas|papas)\/[^\/]+$/.test(location.pathname) ||
		animateFromCenter;

	const isMenuProductPage = /^\/menu\/(burgers|bebidas|papas)\/[^\/]+$/.test(
		location.pathname
	);

	return (
		<div className="pt-0.5 w-[35px] h-[35px] text-center cursor-pointer flex items-center justify-center relative">
			{isEditing ? (
				<motion.div
					initial={{ width: 35 }}
					animate={{ width: isAdding ? 100 : 35 }}
					transition={{ duration: 0.3 }}
					className={`flex items-center absolute ${
						shouldAnimateBothSides
							? "left-1/2 transform -translate-x-1/2"
							: isCarritoPage
							? "left-0"
							: "right-0"
					} top-0 flex-row rounded-lg font-black border-black border-2 bg-gray-100`}
				>
					<div
						className="text-black font-coolvetica font-black text-center items-center flex justify-center w-[35px] h-[35px] cursor-pointer"
						onClick={handleDecrement}
					>
						-
					</div>
					<span className="font-coolvetica font-black text-center items-center flex justify-center w-[35px] h-[35px]">
						{quantity}
					</span>
					<div
						className="text-black font-coolvetica font-black text-center items-center flex justify-center w-[35px] h-[35px] cursor-pointer"
						onClick={handleIncrement}
					>
						+
					</div>
				</motion.div>
			) : isMenuProductPage && cartQuantity === 0 ? (
				<button
					className="bg-black font-coolvetica font-bold  text-white rounded-full px-6 pt-2 pb-4 text-4xl"
					onClick={startAddingProcess}
				>
					Agregar
				</button>
			) : (
				<div
					className={`${
						cartQuantity > 0 ? "bg-black border text-gray-100" : "bg-gray-100"
					} rounded-lg font-black border border-black border-opacity-20 flex items-center justify-center pb-0.5 w-[35px] h-[35px] text-center cursor-pointer`}
					onClick={startAddingProcess}
				>
					{cartQuantity > 0 ? cartQuantity : "+"}
				</div>
			)}
		</div>
	);
};

// Función auxiliar para comparar toppings
const compareToppings = (toppings1, toppings2) => {
	if (toppings1.length !== toppings2.length) return false;
	const sorted1 = [...toppings1].sort((a, b) => a.id - b.id);
	const sorted2 = [...toppings2].sort((a, b) => a.id - b.id);
	return sorted1.every((t, index) => t.id === sorted2[index].id);
};

export default QuickAddToCart;
