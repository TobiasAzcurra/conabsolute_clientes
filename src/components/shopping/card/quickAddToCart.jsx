import { useDispatch, useSelector } from "react-redux";
import {
	addItem,
	updateItemQuantity,
	removeItem,
} from "../../../redux/cart/cartSlice";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const QuickAddToCart = ({ product }) => {
	const dispatch = useDispatch();
	const { cart } = useSelector((state) => state.cartState);
	const [quantity, setQuantity] = useState(1);
	const [isAdding, setIsAdding] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const quantityRef = useRef(quantity);
	const location = useLocation();

	const cartItem = cart.find((item) => item.name === product.name);
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
				const itemIndex = cart.findIndex((item) => item.name === product.name);
				dispatch(removeItem(itemIndex));
			} else if (quantityRef.current >= 1) {
				if (cartItem) {
					dispatch(
						updateItemQuantity({
							name: product.name,
							toppings: [],
							quantity: quantityRef.current,
						})
					);
				} else {
					const burgerObject = {
						name: product.name,
						price: product.price,
						img: product.img,
						toppings: [],
						quantity: quantityRef.current,
						category: product.category || "default",
					};

					dispatch(addItem(burgerObject));
				}
			}
			setIsAdding(false);
			setTimeout(() => {
				setIsEditing(false);
			}, 300);
		}, 2000);
	};

	const isBurgerPage = location.pathname.startsWith("/menu/burgers/");
	const isCarritoPage = location.pathname === "/carrito";

	return (
		<div className="pt-0.5 w-[35px] h-[35px] text-center cursor-pointer flex items-center justify-center relative">
			{isEditing ? (
				<motion.div
					initial={{ width: 35 }}
					animate={{ width: isAdding ? 100 : 35 }}
					transition={{ duration: 0.3 }}
					className={`flex items-center absolute left-1/2 top-0 transform -translate-x-1/2 flex-row rounded-lg font-black border-black border-2 bg-gray-100`}
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
			) : (
				<div
					className={`${
						cartQuantity > 0 ? "bg-black border text-gray-100" : ""
					} rounded-lg font-black font-coolvetica border border-black  flex items-center justify-center ${
						isBurgerPage
							? "pt-2 pb-3 px-5 text-4xl font-medium border-2 text-gray-100 bg-black  rounded-full "
							: "w-[35px] border-opacity-20 text-black bg-gray-100 h-[35px]"
					} text-center cursor-pointer whitespace-nowrap`}
					onClick={startAddingProcess}
				>
					{isBurgerPage && cartQuantity === 0
						? "Comprar"
						: cartQuantity > 0
						? cartQuantity
						: "+"}
				</div>
			)}
		</div>
	);
};

export default QuickAddToCart;
