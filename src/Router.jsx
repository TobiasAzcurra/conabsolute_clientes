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
import OrderChecker from "./components/OrderChecker"

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

	const handleSearch = () => {
		if (phoneNumber.trim() === "") {
			alert("Por favor, ingresa un número de teléfono válido.");
			return;
		}
		navigate("/pedido", { state: { phoneNumber } });
	};

	const computeAdditionalProducts = (order) => {
		const excludedPrefixes = [
			"Satisfyer",
			"Coca",
			"Fanta",
			"Sprite",
			"Papas Con",
			"Pote",
		];
		const requiredPrefixes = [
			"simple",
			"doble",
			"triple",
			"cuadruple",
			"crispy",
			"anhelo",
			"bcn",
			"bbq",
			"mario",
			"easter",
			"2x1",
		];

		const shouldIncludePapasAnhelo = order.detallePedido.some((producto) => {
			const nombreLimpio = producto.burger.trim().toLowerCase();
			console.log("🍔 Verificando producto:", nombreLimpio);

			if (
				requiredPrefixes.some((prefix) =>
					nombreLimpio.startsWith(prefix.toLowerCase())
				)
			) {
				console.log("✅ Producto requiere Papas Anhelo:", nombreLimpio);
				return true;
			}

			const excluded = excludedPrefixes.some((prefix) =>
				nombreLimpio.startsWith(prefix.toLowerCase())
			);
			console.log(
				excluded ? "❌ Producto excluido:" : "✅ Producto válido:",
				nombreLimpio
			);

			return !excluded;
		});

		const computedAdditionalProducts = [];

		if (shouldIncludePapasAnhelo) {
			const isAlreadyInOrder = order.detallePedido.some(
				(producto) =>
					producto.burger.toLowerCase() === "papas anhelo ®".toLowerCase()
			);
			console.log("🍟 Verificación Papas Anhelo:", {
				isAlreadyInOrder,
			});

			if (!isAlreadyInOrder) {
				console.log("✅ Agregando Papas Anhelo a productos adicionales");
				computedAdditionalProducts.push("Papas Anhelo ®");
			}
		}

		return computedAdditionalProducts;
	};

	useEffect(() => {
		console.log(
			"🔍 Verificando si hay una calificación pendiente en localStorage."
		);

		const checkPendingRating = async () => {
			const pendingRating = localStorage.getItem("pendingRating");
			if (pendingRating) {
				const { selectedOrderId, selectedOrderProducts, fecha } =
					JSON.parse(pendingRating);
				setSelectedOrderId(selectedOrderId);
				setSelectedOrderProducts(selectedOrderProducts);

				console.log(
					`📦 Calificación pendiente encontrada para el pedido ID ${selectedOrderId}.`
				);

				if (!fecha) {
					console.error("❌ Fecha no encontrada en la calificación pendiente.");
					return;
				}

				try {
					console.log(
						`🔄 Obteniendo el pedido ID ${selectedOrderId} para la fecha ${fecha}`
					);
					const order = await getOrderById(selectedOrderId, fecha);
					if (order) {
						console.log("📥 Pedido obtenido desde Firebase:", order);

						// Recompute additionalProducts
						const computedAdditionalProducts = computeAdditionalProducts(order);
						setAdditionalProducts(computedAdditionalProducts);

						console.log(
							"📥 Productos adicionales:",
							computedAdditionalProducts
						);

						// Set the pending order and open the modal
						setPendingOrder(order);
						setIsRatingModalOpen(true);
					} else {
						console.warn(`⚠️ Pedido con ID ${selectedOrderId} no encontrado.`);
					}
				} catch (error) {
					console.error("❌ Error al obtener el pedido:", error);
				}
			} else {
				console.log("ℹ️ No hay calificaciones pendientes en localStorage.");
			}
		};

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
			<OrderChecker />

			{/* Mostrar NavMenu y Carrusel solo en las rutas específicas */}
			{shouldShowCarruselAndNavMenu && (
				<div className="relative mb-[90px]">
					<div className="flex justify-center w-full">
						{/* Search by phonenumber */}
						<div className="bg-gray-100 bg-opacity-60  border border-black border-opacity-30 md:w-[500px] shadow-black h-10 flex items-center absolute z-50 top-4 rounded-full pl-4 left-4 right-4  md:left-auto md:right-auto backdrop-blur-sm">
							<div className="flex items-center w-full">
								<input
									type="text"
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="Busca tu pedido con tu telefono ej: 3585168275"
									className="text-black placeholder:text-gray-600 font-coolvetica font-light text-xs bg-transparent outline-none w-full"
								/>
								<button onClick={handleSearch} className="bg-gray-100 border-black  border border-opacity-30 h-10 w-20 flex items-center justify-center rounded-r-full">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5">
										<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clip-rule="evenodd" />
									</svg>

								</button>

							</div>
						</div>

						{/* Explicación del formato, renderizado condicionalmente */}
						{showExplanation && (
							<div className="bg-black md:w-[500px] shadow-black h-16 flex items-center justify-center absolute z-50 top-[62px] font-coolvetica rounded-lg px-4 left-4 right-4 md:left-auto opacity-80 md:right-auto">
								<p className="text-center w-full text-xs text-gray-100 font-medium">
									Ingresa tu número con el código de área sin espacios ni
									símbolos. Ej:
									<span className="font-bold opacity-100"> 3584306832</span>
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
					<>
						<div className="fixed inset-x-0 bottom-0 z-50 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none backdrop-blur-sm" />
						<FloatingCart totalQuantity={totalQuantity} cart={cart} />
					</>
				)}

			{/* Modal para calificar el pedido anterior */}
			<AppleModal
				isOpen={isRatingModalOpen}
				onClose={() => setIsRatingModalOpen(false)}
				title="¡Califica tu pedido anterior!"
				isRatingModal={true}
				orderProducts={pendingOrder ? pendingOrder.detallePedido : []}
				additionalProducts={additionalProducts} // This now has the correct data
				onConfirm={handleRateOrder}
				isLoading={isRatingLoading}
			>
				<p>¡Nos gustaría conocer tu opinión sobre tu último pedido!</p>
			</AppleModal>
		</div>
	);
};

export default AppRouter;
