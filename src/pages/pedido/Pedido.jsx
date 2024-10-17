import React, { useState } from "react";
import { ReadOrdersForTodayById } from "../../firebase/getPedido";
import { CardPedido } from "./CardPedido";
import { useNavigate, useParams } from "react-router-dom"; // Importar useNavigate
import logo from "../../assets/anheloTMblack.png";
import arrow from "../../assets/arrowIcon.png";
import ArrowBack from "../../components/back";
import { useEffect } from "react";

export const Pedido = () => {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [order, setOrder] = useState({});
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate(); // Inicializar useNavigate
	const { orderId } = useParams();

	function sumarMinutos(hora, minutosASumar) {
		if (!hora) return ""; // Verifica que la hora esté definida
		// Descomponer la hora en horas y minutos
		const [horaStr, minutoStr] = hora.split(":");
		const horas = parseInt(horaStr, 10);
		const minutos = parseInt(minutoStr, 10);

		// Crear un objeto Date a partir de la hora descompuesta
		const fecha = new Date();
		fecha.setHours(horas);
		fecha.setMinutes(minutos);

		// Sumar los minutos
		fecha.setMinutes(fecha.getMinutes() + minutosASumar);

		// Obtener las nuevas horas y minutos
		const nuevasHoras = fecha.getHours().toString().padStart(2, "0");
		const nuevosMinutos = fecha.getMinutes().toString().padStart(2, "0");

		// Devolver la nueva hora en formato HH:MM
		return `${nuevasHoras}:${nuevosMinutos}`;
	}

	useEffect(() => {
		setLoading(true);
		ReadOrdersForTodayById(orderId, (pedido) => {
			setOrder(pedido);
			setLoading(false);
		});
	}, [orderId]);

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
				<div className="flex items-center flex-col">
					<img src={logo} className="w-1/2" alt="Logo" />
					<p className="text-black font-coolvetica font-bold mt-[-3px]">
						RIDERS
					</p>
				</div>

				{/* Mostrar un spinner de carga si los pedidos aún no están cargados */}
				{loading && <div className="spinner">Cargando...</div>}

				{!loading && order && (
					<div className="flex items-center flex-col w-full px-4 mt-8">
						{/* Línea horizontal con animación */}
						<div className="w-full flex flex-row gap-2">
							<div className="w-1/4 h-3.5 bg-black animated-loading rounded-l-full"></div>
							<div className="w-1/4 h-3.5 bg-gray-100 border-opacity-20 border-black border-1 border"></div>
							<div className="w-1/2 h-3.5 bg-gray-100 border-opacity-20 border-black border-1 border rounded-r-full"></div>
						</div>
						<p className="text-black font-coolvetica font-bold mt-2">
							Anhelo está preparando tu pedido...
						</p>
						<p className="text-black font-coolvetica font-medium mt-2">
							Entrega estimada:{" "}
							<span className="font-bold font-coolvetica">
								{sumarMinutos(order.hora, 30)} a {sumarMinutos(order.hora, 50)}
							</span>
						</p>
						<p className="text-black font-coolvetica font-medium mt-2">
							Pedido a cargo de:{" "}
							<span className="font-bold">{order.cadete}</span>
						</p>
						<p className="text-black text-center font-coolvetica font-medium mt-2">
							Destino:{" "}
							<span className="font-bold font-coolvetica">
								{order.direccion}
							</span>
						</p>
						<p className="text-black font-coolvetica font-medium mt-2">
							Total:{" "}
							<span className="font-bold font-coolvetica">${order.total}</span>
						</p>
					</div>
				)}

				{/* Si no hay pedidos, mostrar un mensaje */}
				{!loading && !order && <div>No se encontraron pedidos para hoy.</div>}
			</div>
		</div>
	);
};

export default Pedido;
