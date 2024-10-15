// QuickAddToCart.jsx

import { useDispatch, useSelector } from "react-redux";
import {
	addItem,
	updateItemQuantity,
	removeItem,
} from "../../../redux/cart/cartSlice";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const QuickAddToCart = ({ product, animateFromCenter, toppings }) => {
	const dispatch = useDispatch();
	const { cart } = useSelector((state) => state.cartState);
	const location = useLocation();

	// Definir los toppings efectivos: usar los toppings pasados como prop o los del producto
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
	const cartItem = cart.find(
		(item) =>
			item.name === product.name &&
			item.category === (product.category || "default") &&
			compareToppings(item.toppings, effectiveToppings)
	);
	const cartQuantity = cartItem ? cartItem.quantity : 0;

	// Sincronizar el estado local de cantidad con el carrito
	const [quantity, setQuantity] = useState(cartQuantity);
	const [isAdding, setIsAdding] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const quantityRef = useRef(quantity);

	// Actualizar el estado local cuando el carrito cambia
	useEffect(() => {
		setQuantity(cartQuantity);
		quantityRef.current = cartQuantity;
	}, [cartQuantity]);

	// Logs de depuración
	useEffect(() => {
		"Producto:", product;
		"Toppings efectivos:", effectiveToppings;
		"CartItem encontrado:", cartItem;
		"Cantidad en carrito:", cartQuantity;
	}, [product, effectiveToppings, cartItem, cartQuantity]);

	// Manejar incremento de cantidad
	const handleIncrement = () => {
		setQuantity((prevQuantity) => {
			const newQuantity = prevQuantity + 1;
			quantityRef.current = newQuantity;
			"Cantidad incrementada a:", newQuantity;
			return newQuantity;
		});
	};

	// Manejar decremento de cantidad
	const handleDecrement = () => {
		if (quantity > 0) {
			// Permitir que la cantidad llegue a 0
			setQuantity((prevQuantity) => {
				const newQuantity = prevQuantity - 1;
				quantityRef.current = newQuantity;
				"Cantidad decrementada a:", newQuantity;
				return newQuantity;
			});
		}
	};

	// Iniciar el proceso de agregar al carrito
	const startAddingProcess = () => {
		("Iniciando proceso de agregar al carrito");
		setIsEditing(true);
		setIsAdding(true);
		setTimeout(() => {
			// Mantén o elimina este setTimeout según tus necesidades
			if (quantityRef.current === 0 && cartItem) {
				const itemIndex = cart.findIndex(
					(item) =>
						item.name === product.name &&
						item.category === (product.category || "default") &&
						compareToppings(item.toppings, effectiveToppings)
				);
				"Eliminando ítem del carrito en el índice:", itemIndex;
				dispatch(removeItem(itemIndex));
			} else if (quantityRef.current >= 1) {
				if (cartItem) {
					const updatePayload = {
						name: product.name,
						category: product.category || "default",
						toppings: effectiveToppings,
						quantity: quantityRef.current,
					};
					"Actualizando ítem del carrito con:", updatePayload;
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
					"Agregando nuevo ítem al carrito:", newItem;
					dispatch(addItem(newItem));
				}
			}
			setIsAdding(false);
			setTimeout(() => {
				setIsEditing(false);
			}, 300); // Pequeño retraso para completar la animación de cierre
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
					className="bg-black flex flex-row items-center gap-4 font-coolvetica font-medium text-white rounded-xl  pl-4 pr-5 pt-2 pb-4 text-4xl"
					onClick={startAddingProcess}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6"
					>
						<path
							fill-rule="evenodd"
							d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z"
							clip-rule="evenodd"
						/>
					</svg>
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

export default QuickAddToCart;
