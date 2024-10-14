import { Route, Routes, useLocation } from "react-router-dom";
import Section from "./components/shopping/section";
import { RouterMenu } from "./common/RouterMenu";
import Carrusel from "./components/Carrusel"; // Importa el componente Carrusel
import NavMenu from "./components/NavMenu";
import burgers from "./assets/burgers-v1.json";
import combos from "./assets/combos.json";
import papas from "./assets/papas-v1.json";
import drinks from "./assets/drinks-v1.json";
import DetailCard from "./components/shopping/detail";
import CartItems from "./components/shopping/cart";
import OrderForm from "./pages/order";
import Footer from "./components/Footer";
import { useEffect, useState } from "react";
import { Pedido } from "./pages/pedido/Pedido";
import Feedback from "./components/mercadopago/Feedback";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import FloatingCart from "./components/shopping/FloatingCart";
import SuccessPage from "./pages/menu/SuccessPage";

const burgersArray = Object.values(burgers);
const combosArray = Object.values(combos);
const papasArray = Object.values(papas);
const drinksArray = Object.values(drinks);

const AppRouter = () => {
	const { pathname } = useLocation();
	const [pathLocation, setPathLocation] = useState("");
	const cart = useSelector((state) => state.cartState.cart);
	const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

	useEffect(() => {
		const pathParts = pathname.split("/");
		const lastPart = pathParts[pathParts.length - 1];

		if (lastPart === "") {
			setPathLocation("NADA");
		} else {
			setPathLocation(lastPart);
		}
	}, [pathname]);

	// Mostrar Carrusel y NavMenu solo cuando la ruta es /menu o una de sus subrutas, pero no contiene un ID adicional
	const shouldShowCarruselAndNavMenu =
		pathname.startsWith("/menu") &&
		!pathname.match(/\/menu\/(burgers|combos|bebidas|papas)\/.+/);

	return (
		<div className="flex flex-col">
			{/* Mostrar NavMenu y Carrusel solo en las rutas específicas */}
			{shouldShowCarruselAndNavMenu && (
				<div className="relative mb-[90px]">
					<div className="flex justify-center w-full ">
						<div className="bg-gray-100 border border-black border-opacity-20 shadow-black h-10 flex items-center justify-center absolute z-50 top-4 font-coolvetica rounded-3xl px-4 left-4 right-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="ml-[-10px] opacity-20 mr-[10px] h-6"
							>
								<path
									fillRule="evenodd"
									d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
									clipRule="evenodd"
								/>
							</svg>
							<span className="text-opacity-20 text-black">
								Busca tu pedido con tu número de cel:
							</span>
						</div>
					</div>
					<Carrusel />
					<div className="top-[215px] inset-0 absolute">
						<NavMenu />
					</div>
				</div>
			)}
			<Routes>
				{/* Mostrar RouterMenu solo en la ruta raíz */}
				<Route path="/" element={<RouterMenu />} />

				{/* Rutas del menú */}
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
				<Route path="/success" element={<SuccessPage />} />
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
								elegi arriba alguna burger.
							</p>
						</div>
					}
				/>
			</Routes>

			{/* Mostrar el carrito flotante si hay productos en el carrito y no está en la ruta raíz ni en la ruta del carrito */}
			{totalQuantity > 0 && pathname !== "/" && pathname !== "/carrito" && (
				<FloatingCart totalQuantity={totalQuantity} cart={cart} />
			)}
		</div>
	);
};

export default AppRouter;
