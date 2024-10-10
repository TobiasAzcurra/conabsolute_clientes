import { useDispatch } from "react-redux";
import { addItem } from "../../../redux/cart/cartSlice";

const QuickAddToCart = ({ product }) => {
	const dispatch = useDispatch();

	const addToCart = () => {
		// Crear el objeto del producto con los detalles necesarios
		const burgerObject = {
			name: product.name,
			price: product.price,
			img: product.img,
			toppings: [], // Asumiendo que no hay toppings en quick add
			quantity: 1,
			category: product.category || "default", // Ajusta según tu lógica
		};

		// Despachar la acción para agregar el producto al carrito
		dispatch(addItem(burgerObject));
	};

	return (
		<div
			className="bg-gray-100 rounded-lg font-black border border-black border-opacity-20 pt-0.5 w-[35px] h-[35px] text-center cursor-pointer"
			onClick={addToCart}
		>
			+
		</div>
	);
};

export default QuickAddToCart;
