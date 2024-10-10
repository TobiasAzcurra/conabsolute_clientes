import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../../../redux/cart/cartSlice";
import { useState } from "react";
import { motion } from "framer-motion";

const QuickAddToCart = ({ product }) => {
	const dispatch = useDispatch();
	const { cart } = useSelector((state) => state.cartState);
	const [quantity, setQuantity] = useState(1);
	const [isAdding, setIsAdding] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const cartItem = cart.find((item) => item.name === product.name);
	const cartQuantity = cartItem ? cartItem.quantity : 0;

	const handleIncrement = () => {
		setQuantity((prevQuantity) => prevQuantity + 1);
	};

	const handleDecrement = () => {
		if (quantity > 1) {
			setQuantity((prevQuantity) => prevQuantity - 1);
		}
	};

	const startAddingProcess = () => {
		setIsEditing(true);
		setIsAdding(true);
		setTimeout(() => {
			if (quantity >= 1) {
				const burgerObject = {
					name: product.name,
					price: product.price,
					img: product.img,
					toppings: [],
					quantity,
					category: product.category || "default",
				};

				dispatch(addItem(burgerObject));
			}
			setIsAdding(false);
			setTimeout(() => {
				setIsEditing(false);
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
