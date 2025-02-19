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
import React, { useEffect, useState } from "react";
import OrderChecker from "./components/OrderChecker";
import Pedido from "./pages/pedido/Pedido";
import Feedback from "./components/mercadopago/Feedback";
import { useSelector } from "react-redux";
import FloatingCart from "./components/shopping/FloatingCart";
import SuccessPage from "./pages/menu/SuccessPage";
import Reclamos from "./pages/Reclamos";
import AppleModal from "./components/AppleModal";
import { updateRatingForOrder } from "./firebase/uploadOrder";
import { getOrderById } from "./firebase/getPedido";

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
	const [isSearching, setIsSearching] = useState(false);

	// States for autosuggest
	const [showSuggestion, setShowSuggestion] = useState(false);
	const [previousPhone, setPreviousPhone] = useState('');

	// Estados para la calificación
	const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
	const [selectedOrderId, setSelectedOrderId] = useState(null);
	const [selectedOrderProducts, setSelectedOrderProducts] = useState([]);
	const [additionalProducts, setAdditionalProducts] = useState([]);
	const [isRatingLoading, setIsRatingLoading] = useState(false);
	const [animationCompleted, setAnimationCompleted] = useState(false);
	const [pendingOrder, setPendingOrder] = useState(null);

	const handleItemClick = (name) => {
		setSelectedItem(name);
	};

	// Load previous phone from localStorage
	useEffect(() => {
		const storedPhone = localStorage.getItem('customerPhone');
		if (storedPhone) {
			setPreviousPhone(storedPhone);
		}
	}, []);

	const handleInputFocus = () => {
		const storedPhone = localStorage.getItem('customerPhone');
		if (storedPhone && !phoneNumber) {
			setPreviousPhone(storedPhone);
			setShowSuggestion(true);
		}
	};

	const handleInputBlur = () => {
		setTimeout(() => setShowSuggestion(false), 300);
	};

	const handlePhoneChange = (e) => {
		setPhoneNumber(e.target.value);
		if (e.target.value) {
			setShowSuggestion(false);
		}
	};

	const handleSuggestionClick = () => {
		setPhoneNumber(previousPhone);
		setShowSuggestion(false);
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

	const shouldShowCarruselAndNavMenu =
		pathname.startsWith("/menu") &&
		!pathname.match(/\/menu\/(burgers|combos|bebidas|papas)\/.+/);

	const handleSearch = () => {
		if (phoneNumber.trim() === "") {
			alert("Por favor, ingresa un número de teléfono válido.");
			return;
		}
		setIsSearching(true);
		navigate("/pedido", { state: { phoneNumber } });
		setIsSearching(false);
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

			if (
				requiredPrefixes.some((prefix) =>
					nombreLimpio.startsWith(prefix.toLowerCase())
				)
			) {
				return true;
			}

			const excluded = excludedPrefixes.some((prefix) =>
				nombreLimpio.startsWith(prefix.toLowerCase())
			);

			return !excluded;
		});

		const computedAdditionalProducts = [];

		if (shouldIncludePapasAnhelo) {
			const isAlreadyInOrder = order.detallePedido.some(
				(producto) =>
					producto.burger.toLowerCase() === "papas anhelo ®".toLowerCase()
			);

			if (!isAlreadyInOrder) {
				computedAdditionalProducts.push("Papas Anhelo ®");
			}
		}

		return computedAdditionalProducts;
	};

	useEffect(() => {
		const checkPendingRating = async () => {
			const pendingRating = localStorage.getItem("pendingRating");
			if (pendingRating) {
				const { selectedOrderId, selectedOrderProducts, fecha } =
					JSON.parse(pendingRating);
				setSelectedOrderId(selectedOrderId);
				setSelectedOrderProducts(selectedOrderProducts);

				if (!fecha) {
					console.error("❌ Fecha no encontrada en la calificación pendiente.");
					return;
				}

				try {
					const order = await getOrderById(selectedOrderId, fecha);
					if (order) {
						const computedAdditionalProducts = computeAdditionalProducts(order);
						setAdditionalProducts(computedAdditionalProducts);
						setPendingOrder(order);
						setIsRatingModalOpen(true);
					} else {
						console.warn(`⚠️ Pedido con ID ${selectedOrderId} no encontrado.`);
					}
				} catch (error) {
					console.error("❌ Error al obtener el pedido:", error);
				}
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
			const fecha = pendingOrder.fecha;

			if (!fecha) {
				console.error("❌ La fecha del pedido no está definida.");
				throw new Error("Fecha del pedido no disponible.");
			}

			await updateRatingForOrder(fecha, selectedOrderId, ratings);
			localStorage.removeItem("pendingRating");
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

			{shouldShowCarruselAndNavMenu && (
				<div className="relative mb-[90px]">
					<div className="flex justify-center w-full ">
						{/* Search by phonenumber with autosuggest */}
						<div className="bg-opacity-60 border border-gray-100 shadow-black h-10 flex items-center absolute z-50 top-4 right-4 left-4 rounded-full  w-auto backdrop-blur-sm">
							<div className="flex items-center w-full relative">
								<input
									type="tel"
									value={phoneNumber}
									onChange={handlePhoneChange}
									onKeyDown={(e) => e.key === "Enter" && handleSearch()}
									onFocus={handleInputFocus}
									onBlur={handleInputBlur}
									placeholder="Busca tu pedido con tu telefono ej: 3585168275"
									className="text-gray-100 font-light pl-4 placeholder:text-gray-100 font-coolvetica text-xs bg-transparent outline-none w-full"
								/>
								<button
									onClick={handleSearch}
									disabled={isSearching || phoneNumber.length < 8}
									className="bg-gray-100 h-10 w-20 flex items-center justify-center rounded-r-full"
								>

									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5">
										<path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
									</svg>
								</button>

								{/* Autosuggest dropdown */}
								{showSuggestion && previousPhone && (
									<div className="absolute font-coolvetica left-0 right-0 top-12 h-10 bg-gray-100 shadow-lg rounded-full border border-gray-200 z-50">
										<button
											onClick={handleSuggestionClick}
											className="w-full font-bold text-left px-4 h-10 rounded-md text-xs flex items-center "
										>
											<svg xmlns="http://www.w3.org/2000/svg" className="h-4 text-0 mr-1" viewBox="0 0 24 24" fill="currentColor">
												<path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
											</svg>
											<p className='text text-xs font-light  mr-2'>
												Ultimo pedido:
											</p>
											<p className=" text-sm">

												{previousPhone}
											</p>
										</button>
									</div>
								)}
							</div>
						</div>
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
				<Route path="/reclamos" element={<Reclamos />} />
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
