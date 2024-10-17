import React, { useRef, useState, useEffect } from "react";
import { ReadOrdersForTodayById } from "../../firebase/getPedido";
import { CardPedido } from "./CardPedido";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../../assets/anheloTMblack.png";
import arrow from "../../assets/arrowIcon.png";
import gato from "../../assets/carrusel2.jpg";
import ArrowBack from "../../components/back";
import StickerCanvas from "../../components/StickerCanvas";

export const Pedido = () => {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [order, setOrder] = useState({});
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { orderId } = useParams();

	function sumarMinutos(hora, minutosASumar) {
		if (!hora) return "";
		const [horaStr, minutoStr] = hora.split(":");
		const horas = parseInt(horaStr, 10);
		const minutos = parseInt(minutoStr, 10);

		const fecha = new Date();
		fecha.setHours(horas);
		fecha.setMinutes(minutos);
		fecha.setMinutes(fecha.getMinutes() + minutosASumar);

		const nuevasHoras = fecha.getHours().toString().padStart(2, "0");
		const nuevosMinutos = fecha.getMinutes().toString().padStart(2, "0");

		return `${nuevasHoras}:${nuevosMinutos}`;
	}

	useEffect(() => {
		setLoading(true);
		ReadOrdersForTodayById(orderId, (pedido) => {
			setOrder(pedido);
			setLoading(false);
		});
	}, [orderId]);

	const containerRef = useRef(null);
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				const width = containerRef.current.offsetWidth;
				const height = containerRef.current.offsetHeight;
				console.log("Container Width:", width, "Container Height:", height);
				setContainerSize({ width, height });
			}
		};

		// Inicializar el tamaño
		updateSize();

		// Actualizar el tamaño al cambiar el tamaño de la ventana
		window.addEventListener("resize", updateSize);
		return () => window.removeEventListener("resize", updateSize);
	}, []);

	return (
		<div
			ref={containerRef} // Asignar la referencia aquí
			className="bg-gray-100 relative flex justify-between flex-col h-screen "
		>
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

			<StickerCanvas
				containerWidth={containerSize.width}
				containerHeight={containerSize.height}
			/>
			{/* contenido */}
			<div className="justify-center my-auto items-center  flex flex-col">
				<div className="flex items-center flex-col">
					<img src={logo} className="w-1/2" alt="Logo" />
					<p className="text-black font-coolvetica font-bold mt-[-3px]">
						RIDERS
					</p>
				</div>
				{/* Mostrar un spinner de carga si los pedidos aún no están cargados */}
				{loading && <div className="spinner">Cargando...</div>}

				{(!loading && order && (
					<div className="flex items-center flex-col w-full px-4 mt-8">
						{/* Línea horizontal con animación */}
						<div className="flex flex-col w-full ">
							<div className="mb-6">
								<div className="w-full flex flex-row gap-2">
									<div className="w-1/4 h-2 bg-black animated-loading rounded-full"></div>
									<div className="w-1/4 h-2 rounded-full bg-gray-100 border-opacity-20 border-black border-1 border"></div>
									<div className="w-1/2 h-2 bg-gray-100 border-opacity-20 border-black border-1 border rounded-full"></div>
								</div>
								<p className="text-black font-coolvetica font-bold   text-center mt-2">
									Anhelo está preparando tu pedido...
								</p>
							</div>
							<div className="flex flex-col text-center">
								<p className="text-black font-coolvetica font-medium ">
									Entrega estimada: {sumarMinutos(order.hora, 30)} a{" "}
									{sumarMinutos(order.hora, 50)}
								</p>
								<p className="text-black font-coolvetica font-medium ">
									Envio a cargo de: {order.cadete}
								</p>
								<p className="text-black font-coolvetica font-medium">
									Destino: {order.direccion.split(",")[0]}
								</p>

								<p className="text-black font-coolvetica font-medium ">
									Total: ${order.total}
								</p>
							</div>
						</div>
					</div>
				)) ||
					(!loading && !order && (
						<div>No se encontraron pedidos para hoy.</div>
					))}
			</div>
		</div>
	);
};

export default Pedido;
