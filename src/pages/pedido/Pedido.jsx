import React, { useState } from "react";
import { ReadOrdersForTodayByPhone } from "../../firebase/getPedido";
import { CardPedido } from "./CardPedido";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import logo from "../../assets/anheloTMblack.png";
import arrow from "../../assets/arrowIcon.png";

export const Pedido = () => {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate(); // Inicializar useNavigate

	const handlePhoneNumberChange = (event) => {
		setPhoneNumber(event.target.value);
	};

	const handleSearchClick = () => {
		setLoading(true);
		ReadOrdersForTodayByPhone(phoneNumber, (pedidos) => {
			setOrders(pedidos);
			setLoading(false);
		});
	};

	const handleGoBack = () => {
		navigate("/"); // Navegar a la página principal
	};

	return (
		<div>
			{/* Definición de las animaciones dentro del componente */}
			<style>
				{`
          @keyframes loadingBar {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: 200px 0;
            }
          }

          .animated-loading {
            background: linear-gradient(
              to right,
              #000 0%,
              #000 40%,
              #555 50%,
              #000 60%,
              #000 100%
            );
            background-size: 400% 100%;
            animation: loadingBar 5s linear infinite;
          }
        `}
			</style>

			<div className="bg-gray-100 relative flex flex-col items-center h-screen justify-center">
				<div
					className="absolute top-2 left-4 flex flex-row items-center gap-2 cursor-pointer"
					onClick={handleGoBack}
				>
					<img src={arrow} className="h-2 rotate-180" alt="" />
					<p className="font-coolvetica font-bold">Volver</p>
				</div>
				<div className="flex items-center flex-col">
					<img src={logo} className="w-1/2" alt="Logo" />
					<p className="text-black font-coolvetica font-bold mt-[-3px]">
						RIDERS
					</p>
				</div>
				<div className="flex items-center flex-col w-full px-4 mt-8">
					{/* Línea horizontal con animación */}
					<div className="w-full flex flex-row gap-2">
						<div className="w-1/4 h-3.5 bg-black animated-loading"></div>
						<div className="w-1/4 h-3.5 bg-gray-100 border-opacity-20 border-black border-1 border"></div>
						<div className="w-1/2 h-3.5 bg-gray-100 border-opacity-20 border-black border-1 border"></div>
					</div>
					<p className="text-black font-coolvetica font-bold mt-2">
						Anhelo está preparando tu pedido...
					</p>
					<p className="text-black font-coolvetica font-medium mt-2">
						Entrega estimada:{" "}
						<span className="font-bold font-coolvetica">
							23:20hs - 23:50 hs
						</span>
					</p>
					<p className="text-black font-coolvetica font-medium mt-2">
						Pedido a cargo de: <span className="font-bold">Mauri</span>
					</p>
					<p className="text-black font-coolvetica font-medium mt-2">
						Destino:{" "}
						<span className="font-bold font-coolvetica">
							Av. Amadeo Sabattini 2043
						</span>
					</p>
					<p className="text-black font-coolvetica font-medium mt-2">
						Total: <span className="font-bold font-coolvetica">$10.100</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Pedido;
