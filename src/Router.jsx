import { Route, Routes, useLocation } from "react-router-dom";
import Section from "./components/shopping/section";
import { RouterMenu } from "./common/RouterMenu";
import burgers from "./assets/burgers-v1.json";
import combos from "./assets/combos.json";
import papas from "./assets/papas-v1.json";
import drinks from "./assets/drinks-v1.json";
import DetailCard from "./components/shopping/detail";
import CartItems from "./components/shopping/cart";
import OrderForm from "./pages/order";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useEffect, useState } from "react";
import NavNSectionSpace from "./components/NavNSectionSpace";
import { Pedido } from "./pages/pedido/Pedido";
import Feedback from "./components/mercadopago/Feedback";

const burgersArray = Object.values(burgers);
const combosArray = Object.values(combos);
const papasArray = Object.values(papas);
const drinksArray = Object.values(drinks);

const AppRouter = () => {
	const { pathname } = useLocation();
	const [pathLocation, setPathLocation] = useState("");

	useEffect(() => {
		const pathParts = pathname.split("/");
		const lastPart = pathParts[pathParts.length - 1];

		if (lastPart === "") {
			setPathLocation("NADA");
		} else {
			setPathLocation(lastPart);
		}
	}, [pathname]);

	return (
		<div className="flex flex-col">
			{/* {pathLocation === "menu" || pathLocation === "NADA" ? null : (
				<>
					<div className="fixed z-[9999] w-full">
						<Navbar />
					</div>
					<NavNSectionSpace />
				</>
			)} */}

			<Routes>
				<Route path="/menu" element={<RouterMenu />}>
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
				</Route>

				{/* details */}

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
				<Route path="/" element={<RouterMenu />} />
				<Route path="/carrito" element={<CartItems />} />
				<Route path="/order" element={<OrderForm />} />
				<Route path="/pedido" element={<Pedido />} />
				<Route path="/feedback" element={<Feedback />} />
				<Route path="*" element={<h4>Esta pagina no existe</h4>} />
			</Routes>

			{pathLocation === "menu" || pathLocation === "NADA" ? null : (
				<>
					<Footer />
				</>
			)}
		</div>
	);
};

export default AppRouter;
