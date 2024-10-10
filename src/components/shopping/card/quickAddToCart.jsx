import { useDispatch } from "react-redux";
import { addItem } from "../../../redux/cart/cartSlice";
import { useState } from "react";

const QuickAddToCart = ({ product }) => {
	const dispatch = useDispatch();
	const [quantity, setQuantity] = useState(1);
	const [isAdding, setIsAdding] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

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
			setIsEditing(false);
		}, 2000);
	};

	return (
		<div className="  pt-0.5 w-[35px] h-[35px] text-center cursor-pointer flex items-center justify-center relative">
			{isEditing ? (
				<div className="flex items-center absolute right-0 top-0 flex-row w-[100px]  rounded-lg font-black border border-black border-opacity-20 bg-gray-100">
					<div
						className=" text-black font-bold text-center items-center flex justify-center w-[35px] h-[35px]"
						onClick={handleDecrement}
					>
						-
					</div>
					<span className="font-antonio font-bold text-center items-center flex justify-center  w-[35px] h-[35px]">
						{quantity}
					</span>
					<div
						className=" text-block font-bold  text-center items-center flex justify-center w-[35px] h-[35px]"
						onClick={handleIncrement}
					>
						+
					</div>
				</div>
			) : (
				<div
					className="bg-gray-100 rounded-lg font-black border border-black border-opacity-20 pt-0.5 w-[35px] h-[35px] text-center cursor-pointer"
					onClick={startAddingProcess}
				>
					+
				</div>
			)}
		</div>
	);
};

export default QuickAddToCart;
