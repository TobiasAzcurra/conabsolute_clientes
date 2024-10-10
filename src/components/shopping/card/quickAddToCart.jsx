import { useDispatch, useSelector } from "react-redux";
import { addItem, updateItemQuantity } from "../../../redux/cart/cartSlice";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

const QuickAddToCart = ({ product }) => {
	const dispatch = useDispatch();
	const { cart } = useSelector((state) => state.cartState);
	const [quantity, setQuantity] = useState(1);
	const [isAdding, setIsAdding] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const quantityRef = useRef(quantity);

	const cartItem = cart.find((item) => item.name === product.name);
	const cartQuantity = cartItem ? cartItem.quantity : 0;

	const handleIncrement = () => {
		console.log("Incrementing quantity");
		setQuantity((prevQuantity) => {
			const newQuantity = prevQuantity + 1;
			quantityRef.current = newQuantity;
			return newQuantity;
		});
	};

	const handleDecrement = () => {
		if (quantity > 1) {
			console.log("Decrementing quantity");
			setQuantity((prevQuantity) => {
				const newQuantity = prevQuantity - 1;
				quantityRef.current = newQuantity;
				return newQuantity;
			});
		}
	};

	const startAddingProcess = () => {
		console.log("Starting adding process");
		setIsEditing(true);
		setIsAdding(true);
		setTimeout(() => {
			if (quantityRef.current >= 1) {
				if (cartItem) {
					console.log("Updating item quantity in cart", {
						name: product.name,
						quantity: quantityRef.current,
					});
					dispatch(
						updateItemQuantity({
							name: product.name,
							toppings: [],
							quantity: quantityRef.current,
						})
					);
				} else {
					console.log("Adding item to cart", {
						name: product.name,
						quantity: quantityRef.current,
					});
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
				console.log("Current cart state:", cart);
			}
			setIsAdding(false);
			console.log("Finished adding item");
			setTimeout(() => {
				setIsEditing(false);
				console.log("Finished editing");
			}, 300); // Añadimos un pequeño retraso para completar la animación de cierre
		}, 2000);
	};

	return (
		<div className="pt-0.5 w-[35px] h-[35px] text-center cursor-pointer flex items-center justify-center relative">
			{isEditing ? (
				<motion.div
					initial={{ width: 35 }}
					animate={{ width: isAdding ? 100 : 35 }}
					transition={{ duration: 0.3 }}
					className="flex items-center absolute right-0 top-0 flex-row rounded-lg font-black border border-black border-opacity-20 bg-gray-100"
				>
					<div
						className="text-black font-bold text-center items-center flex justify-center w-[35px] h-[35px] cursor-pointer"
						onClick={handleDecrement}
					>
						-
					</div>
					<span className="font-antonio font-bold text-center items-center flex justify-center w-[35px] h-[35px]">
						{quantity}
					</span>
					<div
						className="text-black font-bold text-center items-center flex justify-center w-[35px] h-[35px] cursor-pointer"
						onClick={handleIncrement}
					>
						+
					</div>
				</motion.div>
			) : (
				<div
					className={`${
						cartQuantity > 0
							? "bg-black border border-gray-100  border-opacity-100 text-gray-100"
							: "bg-gray-100"
					} rounded-lg font-black border border-black border-opacity-20 pt-0.5 w-[35px] h-[35px] text-center cursor-pointer`}
					onClick={startAddingProcess}
				>
					{cartQuantity > 0 ? cartQuantity : "+"}
				</div>
			)}
		</div>
	);
};

export default QuickAddToCart;
