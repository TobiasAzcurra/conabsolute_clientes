// AppRouter.jsx

import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Section from "./components/shopping/section";
import RouterMenu from "./common/RouterMenu";
import Carrusel from "./components/Carrusel";
import NavMenu from "./components/NavMenu";
import burgers from "./assets/burgers-v1.json";
import combos from "./assets/combos.json";
import papas from "./assets/papas-v1.json";
import drinks from "./assets/drinks-v1.json";
import DetailCard from "./components/shopping/detail";
import CartItems from "./components/shopping/cart";
import OrderForm from "./pages/order";
import Footer from "./components/Footer";
import React, { useEffect, useState } from "react";
import Pedido from "./pages/pedido/Pedido";
import Feedback from "./components/mercadopago/Feedback";
import { useSelector } from "react-redux";
import FloatingCart from "./components/shopping/FloatingCart";
import SuccessPage from "./pages/menu/SuccessPage";
import AppleModal from "./components/AppleModal";
import { updateRatingForOrder } from "./firebase/uploadOrder";
import { getOrderById } from "./firebase/getPedido"; // Importamos la función getOrderById

const burgersArray = Object.values(burgers);
const combosArray = Object.values(combos);
const papasArray = Object.values(papas);
const drinksArray = Object.values(drinks);

const AppRouter = () => {
	const { pathname } = useLocation();
	const [pathLocation, setPathLocation] = useState("");
	const cart = useSelector((state) => state.cartState.cart);
	const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
	const [phoneNumber, setPhoneNumber] = useState("");
	const navigate = useNavigate();
	const [selectedItem, setSelectedItem] = useState("");
	const [showExplanation, setShowExplanation] = useState(false);

	// Estados para la calificación
	const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
	const [selectedOrderId, setSelectedOrderId] = useState(null);
	const [selectedOrderProducts, setSelectedOrderProducts] = useState([]);
	const [additionalProducts, setAdditionalProducts] = useState([]);
	const [isRatingLoading, setIsRatingLoading] = useState(false);

	// Estado para controlar si la animación ha terminado
	const [animationCompleted, setAnimationCompleted] = useState(false);

	// Estado para almacenar el pedido pendiente
	const [pendingOrder, setPendingOrder] = useState(null);

	const handleItemClick = (name) => {
		setSelectedItem(name);
	};

	useEffect(() => {
		const pathParts = pathname.split("/");
		const lastPart = pathParts[pathParts.length - 1];

		if (lastPart === "") {
			setPathLocation("NADA");
		} else {
			setPathLocation(lastPart);

			if (["burgers", "combos", "bebidas", "papas"].includes(lastPart)) {
				setSelectedItem(lastPart);
			}
		}
	}, [pathname]);

	// Mostrar Carrusel y NavMenu solo cuando la ruta es /menu o una de sus subrutas, pero no contiene un ID adicional
	const shouldShowCarruselAndNavMenu =
		pathname.startsWith("/menu") &&
		!pathname.match(/\/menu\/(burgers|combos|bebidas|papas)\/.+/);

	// Función para manejar el evento al presionar Enter
	const handleKeyDown = async (e) => {
		if (e.key === "Enter") {
			if (phoneNumber.trim() === "") {
				alert("Por favor, ingresa un número de teléfono válido.");
				return;
			}

			navigate("/pedido", { state: { phoneNumber } });
		}
	};

	useEffect(() => {
		console.log(
			"🔍 Verificando si hay una calificación pendiente en localStorage."
		);

		const checkPendingRating = async () => {
			// Verifica si hay una calificación pendiente en el localStorage
			const pendingRating = localStorage.getItem("pendingRating");
			if (pendingRating) {
				const {
					selectedOrderId,
					selectedOrderProducts,
					additionalProducts,
					fecha,
				} = JSON.parse(pendingRating);
				setSelectedOrderId(selectedOrderId);
				setSelectedOrderProducts(selectedOrderProducts);
				setAdditionalProducts(additionalProducts);

				console.log(
					`📦 Calificación pendiente encontrada para el pedido ID ${selectedOrderId}.`
				);

				if (!fecha) {
					console.error("❌ Fecha no encontrada en la calificación pendiente.");
					return;
				}

				try {
					// Fetch the order from Firebase using the date
					console.log(
						`🔄 Obteniendo el pedido ID ${selectedOrderId} para la fecha ${fecha}`
					);
					const order = await getOrderById(selectedOrderId, fecha);
					if (order) {
						console.log("📥 Pedido obtenido desde Firebase:", order);

						// Check if 'entregado' prop exists
						if (order.entregado) {
							console.log(
								`✅ El pedido ID ${selectedOrderId} ha sido entregado. Mostrando modal de calificación.`
							);
							// Order has been delivered, show the rating modal
							setPendingOrder(order);
							setIsRatingModalOpen(true);
						} else {
							// Order has not been delivered, do not show the modal
							console.log(
								`⚠️ El pedido ID ${selectedOrderId} aún no ha sido entregado. No se mostrará el modal de calificación.`
							);
							// Opcional: puedes eliminar la calificación pendiente del localStorage
							// localStorage.removeItem("pendingRating");
						}
					} else {
						console.warn(`⚠️ Pedido con ID ${selectedOrderId} no encontrado.`);
						// Opcional: eliminar la calificación pendiente del localStorage
						// localStorage.removeItem("pendingRating");
					}
				} catch (error) {
					console.error("❌ Error al obtener el pedido:", error);
				}
			} else {
				console.log("ℹ️ No hay calificaciones pendientes en localStorage.");
			}
		};

		// Solo ejecutamos la verificación si la animación ha terminado o si no estamos en la página inicial
		if (pathname !== "/" || animationCompleted) {
			checkPendingRating();
		}
	}, [pathname, animationCompleted]);

	const handleRateOrder = async (ratings) => {
		if (!selectedOrderId) {
			console.error("❌ No hay Order ID seleccionado para calificar");
			return;
		}

		setIsRatingLoading(true);

		try {
			// Use the fetched order's date
			const fecha = pendingOrder.fecha;

			if (!fecha) {
				console.error("❌ La fecha del pedido no está definida.");
				throw new Error("Fecha del pedido no disponible.");
			}

			console.log("📝 Enviando calificación para el pedido:", {
				fecha,
				selectedOrderId,
				ratings,
			});

			await updateRatingForOrder(fecha, selectedOrderId, ratings);

			// Elimina la calificación pendiente del localStorage
			localStorage.removeItem("pendingRating");

			console.log("✅ Calificación enviada exitosamente.");

			setIsRatingModalOpen(false);
		} catch (err) {
			console.error("❌ Error al enviar la calificación:", err);
		} finally {
			setIsRatingLoading(false);
			setSelectedOrderId(null);
			setAdditionalProducts([]);
			setSelectedOrderProducts([]);
			setPendingOrder(null);
		}
	};

	return (
		<div className="flex flex-col">
			{/* Mostrar NavMenu y Carrusel solo en las rutas específicas */}
			{shouldShowCarruselAndNavMenu && (
				<div className="relative mb-[90px]">
					<div className="flex justify-center w-full">
						{/* Search by phonenumber */}
						<div className="bg-gray-100 md:w-[500px] shadow-black h-10 flex items-center justify-center absolute z-50 top-4 font-coolvetica rounded-full px-4 left-4 right-4 opacity-80 focus-within:opacity-100 transition-opacity duration-300 ease-in-out md:left-auto md:right-auto">
							{/* Ícono de búsqueda */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								stroke="currentColor"
								strokeWidth="1"
								className="mr-1 h-6 opacity-20"
							>
								<path
									fillRule="evenodd"
									d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
									clipRule="evenodd"
								/>
							</svg>

							{/* Input para el número de teléfono */}
							<input
								type="text"
								value={phoneNumber}
								onChange={(e) => {
									setPhoneNumber(e.target.value);
								}}
								onKeyDown={handleKeyDown}
								placeholder="Busca tu pedido con tu número de cel"
								className="text-opacity-60 font-coolvetica text-black bg-transparent outline-none w-full"
							/>

							{/* Ícono de información */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="mr-[-8px] h-8 cursor-pointer"
								onClick={() => {
									setShowExplanation(!showExplanation);
								}}
								title="Información sobre el formato del número"
							>
								<path
									fillRule="evenodd"
									d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
									clipRule="evenodd"
								/>
							</svg>
						</div>

						{/* Explicación del formato, renderizado condicionalmente */}
						{showExplanation && (
							<div className="bg-black md:w-[500px] shadow-black h-16 flex items-center justify-center absolute z-50 top-[62px] font-coolvetica rounded-lg px-4 left-4 right-4 md:left-auto opacity-80 md:right-auto">
								<p className="text-center w-full text-xs text-gray-100 font-medium">
									Ingresa tu número con el código de área sin espacios ni
									símbolos. Ej:
									<span className="font-bold opacity-100"> 3585168971</span>
								</p>
							</div>
						)}
					</div>
					<Carrusel />
					<div className="top-[215px] inset-0 absolute">
						<NavMenu
							selectedItem={selectedItem}
							handleItemClick={handleItemClick}
						/>
					</div>
				</div>
			)}
			<Routes>
				{/* Rutas definidas aquí */}
				<Route
					path="/"
					element={
						<RouterMenu onAnimationEnd={() => setAnimationCompleted(true)} />
					}
				/>
				<Route
					path="/menu/burgers"
					element={<Section path={"burgers"} products={burgersArray} />}
				/>
				<Route
					path="/menu/combos"
					element={<Section path={"combos"} products={combosArray} />}
				/>
				<Route
					path="/menu/bebidas"
					element={<Section path={"bebidas"} products={drinksArray} />}
				/>
				<Route
					path="/menu/papas"
					element={<Section path={"papas"} products={papasArray} />}
				/>
				{/* Rutas de detalles */}
				<Route
					path="/menu/burgers/:id"
					element={<DetailCard products={burgersArray} type={"burgers"} />}
				/>
				<Route
					path="/menu/combos/:id"
					element={<DetailCard products={combosArray} type={"combos"} />}
				/>
				<Route
					path="/menu/bebidas/:id"
					element={<DetailCard products={drinksArray} type={"bebidas"} />}
				/>
				<Route
					path="/menu/papas/:id"
					element={<DetailCard products={papasArray} type={"papas"} />}
				/>
				{/* Otras rutas */}
				<Route path="/carrito" element={<CartItems />} />
				<Route path="/order" element={<OrderForm />} />
				<Route path="/success/:orderId" element={<SuccessPage />} />
				<Route path="/pedido/:orderId" element={<Pedido />} />
				<Route path="/pedido" element={<Pedido />} />
				<Route path="/feedback" element={<Feedback />} />
				<Route
					path="*"
					element={
						<div className="flex flex-col">
							<p className="font-bold text-xs text-center mt-8">
								¿Te perdiste? Esta no te la esperabas,
							</p>
							<p className="font-bold text-xs text-center">
								elegí arriba alguna burger.
							</p>
						</div>
					}
				/>
			</Routes>

			{/* Mostrar el carrito flotante si hay productos en el carrito y no está en rutas excluidas */}
			{totalQuantity > 0 &&
				pathname !== "/" &&
				pathname !== "/carrito" &&
				pathname !== "/pedido" &&
				!pathname.startsWith("/pedido/") &&
				!pathname.startsWith("/success") && (
					<FloatingCart totalQuantity={totalQuantity} cart={cart} />
				)}

			{/* Modal para calificar el pedido anterior */}
			<AppleModal
				isOpen={isRatingModalOpen}
				onClose={() => setIsRatingModalOpen(false)}
				title="¡Califica tu pedido anterior!"
				isRatingModal={true}
				orderProducts={pendingOrder ? pendingOrder.detallePedido : []}
				additionalProducts={additionalProducts}
				onConfirm={handleRateOrder}
				isLoading={isRatingLoading}
			>
				<p>¡Nos gustaría conocer tu opinión sobre tu último pedido!</p>
			</AppleModal>
		</div>
	);
};

export default AppRouter;
