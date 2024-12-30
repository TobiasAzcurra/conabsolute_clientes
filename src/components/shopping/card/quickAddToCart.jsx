import { useDispatch, useSelector } from "react-redux";
import {
	addItem,
	updateItemQuantity,
	removeItem,
} from "../../../redux/cart/cartSlice";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const QuickAddToCart = ({
	product,
	animateFromCenter,
	toppings,
	isOrderItem = false,
	onOrderQuantityChange = null,
	initialOrderQuantity = null,
}) => {
	const dispatch = useDispatch();
	const { cart } = useSelector((state) => state.cartState);
	const location = useLocation();

	// Validar que el producto tenga una categoría
	if (!product.category) {
		console.warn(
			"El producto no tiene una categoría definida. Se usará 'default'.",
			product
		);
	}

	// Definir los toppings efectivos
	const effectiveToppings =
		toppings && toppings.length > 0 ? toppings : product.toppings || [];

	// Función auxiliar para comparar toppings
	const compareToppings = (toppings1, toppings2) => {
		if (!toppings1 || !toppings2) return false;
		if (toppings1.length !== toppings2.length) return false;
		const sorted1 = [...toppings1].sort((a, b) => a.id - b.id);
		const sorted2 = [...toppings2].sort((a, b) => a.id - b.id);
		return JSON.stringify(sorted1) === JSON.stringify(sorted2);
	};

	// Encontrar el ítem en el carrito que coincide con el producto y toppings
	const cartItem = !isOrderItem
		? cart.find(
				(item) =>
					item.name === product.name &&
					item.category === (product.category || "default") &&
					compareToppings(item.toppings, effectiveToppings)
		  )
		: null;

	// Usar la cantidad inicial del pedido si es un item de pedido, si no usar la cantidad del carrito
	const initialQuantity = isOrderItem
		? initialOrderQuantity || product.quantity
		: cartItem
		? cartItem.quantity
		: 0;

	const [quantity, setQuantity] = useState(initialQuantity);
	const [isAdding, setIsAdding] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const quantityRef = useRef(quantity);
	const pendingUpdateRef = useRef(null);

	// Actualizar el estado local cuando el carrito o la cantidad inicial cambian
	useEffect(() => {
		if (isOrderItem) {
			setQuantity(initialOrderQuantity || product.quantity);
			quantityRef.current = initialOrderQuantity || product.quantity;
		} else {
			setQuantity(cartItem ? cartItem.quantity : 0);
			quantityRef.current = cartItem ? cartItem.quantity : 0;
		}
	}, [cartItem, initialOrderQuantity, isOrderItem, product.quantity]);

	// Limpiar timeout al desmontar
	useEffect(() => {
		return () => {
			if (pendingUpdateRef.current) {
				clearTimeout(pendingUpdateRef.current);
			}
		};
	}, []);

	// Manejar incremento de cantidad
	const handleIncrement = () => {
		setQuantity((prevQuantity) => {
			const newQuantity = prevQuantity + 1;
			quantityRef.current = newQuantity;
			return newQuantity;
		});
	};

	// Manejar decremento de cantidad
	const handleDecrement = () => {
		if (quantity > 0) {
			setQuantity((prevQuantity) => {
				const newQuantity = prevQuantity - 1;
				quantityRef.current = newQuantity;
				return newQuantity;
			});
		}
	};

	// Iniciar el proceso de agregar al carrito
	const startAddingProcess = () => {
		setIsEditing(true);
		setIsAdding(true);

		// Limpiar cualquier actualización pendiente
		if (pendingUpdateRef.current) {
			clearTimeout(pendingUpdateRef.current);
		}

		pendingUpdateRef.current = setTimeout(() => {
			if (!isOrderItem) {
				// Lógica original del carrito
				if (quantityRef.current === 0 && cartItem) {
					const itemIndex = cart.findIndex(
						(item) =>
							item.name === product.name &&
							item.category === (product.category || "default") &&
							compareToppings(item.toppings, effectiveToppings)
					);
					dispatch(removeItem(itemIndex));
				} else if (quantityRef.current >= 1) {
					if (cartItem) {
						const updatePayload = {
							name: product.name,
							category: product.category || "default",
							toppings: effectiveToppings,
							quantity: quantityRef.current,
						};
						dispatch(updateItemQuantity(updatePayload));
					} else {
						const newItem = {
							name: product.name,
							price: product.price,
							img: product.img,
							toppings: effectiveToppings,
							quantity: quantityRef.current,
							category: product.category || "default",
						};
						dispatch(addItem(newItem));
					}
				}
			} else if (onOrderQuantityChange) {
				// Solo actualizar Firestore cuando la animación termine
				onOrderQuantityChange(quantityRef.current);
			}

			setIsAdding(false);
			setTimeout(() => {
				setIsEditing(false);
			}, 300);
		}, 2000);
	};

	// Determinar la página actual para animaciones
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
					} top-0 flex-row rounded-3xl font-black border-black border-2 bg-gray-100`}
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
			) : isMenuProductPage && quantity === 0 && !isOrderItem ? (
				<button
					className="bg-black flex flex-row items-center gap-4 font-coolvetica font-medium text-white rounded-3xl pl-4 pr-5 pt-2 pb-4 text-4xl"
					onClick={startAddingProcess}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6"
					>
						<path
							fillRule="evenodd"
							d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z"
							clipRule="evenodd"
						/>
					</svg>
					Agregar
				</button>
			) : (
				<div
					className={`${
						quantity > 0 ? "bg-black border text-gray-100" : "bg-gray-100"
					} rounded-3xl font-black border border-black border-opacity-20 flex items-center justify-center pb-0.5 w-[35px] h-[35px] text-center cursor-pointer`}
					onClick={startAddingProcess}
				>
					{quantity > 0 ? quantity : "+"}
				</div>
			)}
		</div>
	);
};

export default QuickAddToCart;
