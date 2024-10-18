import React, { useRef, useState, useEffect } from "react";
import { ReadOrdersForTodayById } from "../../firebase/getPedido";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import logo from "../../assets/anheloTMblack.png";
import StickerCanvas from "../../components/StickerCanvas";

const Pedido = () => {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [order, setOrder] = useState(null); // Para un pedido individual
	const [pedidos, setPedidos] = useState([]); // Para múltiples pedidos
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { orderId } = useParams();
	const location = useLocation(); // Para acceder al estado pasado en la navegación

	// Nuevo estado para controlar la visualización de la dirección completa
	const [showFullAddress, setShowFullAddress] = useState(false);

	// Función para sumar minutos a una hora dada
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
		// Manejar el caso de un pedido individual basado en orderId
		if (orderId) {
			setLoading(true);
			ReadOrdersForTodayById(orderId, (pedido) => {
				if (pedido && typeof pedido.direccion === "string") {
					setOrder(pedido);
				} else {
					setOrder(null);
				}
				setLoading(false);
			});
		}

		// Manejar el caso de múltiples pedidos pasados por estado (búsqueda por teléfono)
		if (!orderId && location.state && location.state.pedidos) {
			const { pedidos } = location.state;
			setPedidos(pedidos);
			console.log("Pedidos encontrados por número de teléfono:", pedidos);
			// Puedes añadir más lógica aquí si deseas manejar los pedidos de otra manera
		}
	}, [orderId, location.state]);

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

	console.log(order); // Registrar el pedido individual en la consola

	// Funciones para determinar las clases de las barras de progreso
	const getFirstBarClass = (currentOrder) => {
		if (!currentOrder) return "";
		if (!currentOrder.elaborado) {
			return "animated-loading";
		}
		return "bg-black";
	};

	const getSecondBarClass = (currentOrder) => {
		if (!currentOrder) return "";
		if (currentOrder.elaborado && currentOrder.cadete === "NO ASIGNADO") {
			return "animated-loading";
		} else if (
			currentOrder.elaborado &&
			currentOrder.cadete !== "NO ASIGNADO"
		) {
			return "bg-black";
		}
		return "bg-gray-100 border-opacity-20 border-black border-1 border";
	};

	const getThirdBarClass = (currentOrder) => {
		if (!currentOrder) return "";
		if (currentOrder.elaborado && currentOrder.cadete !== "NO ASIGNADO") {
			return "animated-loading";
		}
		return "bg-gray-100 border-opacity-20 border-black border-1 border";
	};

	return (
		<div
			ref={containerRef} // Asignar la referencia aquí
			className="bg-gray-100 relative flex justify-between flex-col h-screen"
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
                      #555 100%,
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
			{/* Contenido */}
			<div className="justify-center my-auto items-center flex flex-col">
				<div className="flex items-center flex-col pt-8">
					<img src={logo} className="w-1/2" alt="Logo" />
				</div>
				{/* Mostrar el spinner mientras se cargan los datos */}
				{loading && (
					<div className="flex items-center justify-center">
						<div
							className="mt-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-e-transparent align-[-0.125em] motion-reduce:animate-spin"
							role="status"
						>
							<span className="sr-only">Cargando...</span>
						</div>
					</div>
				)}

				{/* Mostrar los pedidos una vez que se han cargado los datos */}
				{!loading && (order || pedidos.length > 0) && (
					<div className="flex items-center flex-col w-full px-4 mt-8 space-y-16 overflow-y-auto">
						{/* Pedido individual */}
						{order && (
							<div className="flex items-center flex-col w-full ">
								{/* Línea horizontal con animación */}
								<div className="flex flex-col w-full">
									<div className="mb-10">
										<div className="w-full flex flex-row gap-2 relative">
											{/* Primera barra */}
											<div
												className={`w-1/4 h-2.5 rounded-full ${getFirstBarClass(
													order
												)}`}
											></div>

											{/* Segunda barra */}
											<div
												className={`w-1/4 h-2.5 rounded-full ${getSecondBarClass(
													order
												)}`}
											></div>

											{/* Tercera barra */}
											<div
												className={`w-1/2 h-2.5 rounded-full ${getThirdBarClass(
													order
												)}`}
											></div>

											{/* SVG permanece igual */}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												className="h-6 absolute right-2 bottom-4"
											>
												<path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
												<path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
											</svg>
										</div>
										<p className="text-black font-coolvetica font-bold text-left mt-2">
											{!order.elaborado
												? "Anhelo está preparando tu pedido..."
												: order.cadete !== "NO ASIGNADO"
												? "En camino... Atención, te va a llamar tu cadete."
												: "Tu cadete está llegando a Anhelo..."}
										</p>
									</div>
									<div className="flex flex-col text-left gap-2">
										<div className="flex flex-row gap-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												className="h-6"
											>
												<path
													fillRule="evenodd"
													d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
													clipRule="evenodd"
												/>
											</svg>

											<p className="text-black font-coolvetica font-medium">
												Entrega estimada: {sumarMinutos(order.hora, 30)} a{" "}
												{sumarMinutos(order.hora, 50)}
											</p>
										</div>
										<div className="flex flex-row gap-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												className="h-6"
											>
												<path
													fillRule="evenodd"
													d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
													clipRule="evenodd"
												/>
											</svg>

											<p className="text-black font-coolvetica font-medium">
												Envío a cargo de:{" "}
												{order.cadete !== "NO ASIGNADO"
													? order.cadete.charAt(0).toUpperCase() +
													  order.cadete.slice(1).toLowerCase()
													: "Aún sin asignar."}
											</p>
										</div>
										<div className="flex flex-row gap-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												className="h-6"
											>
												<path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
												<path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
											</svg>
											<p
												className="text-black font-coolvetica font-medium cursor-pointer"
												onClick={() => setShowFullAddress(!showFullAddress)}
											>
												Destino:{" "}
												{showFullAddress
													? order.direccion || "No disponible"
													: (order.direccion?.split(",")[0].trim() ||
															"No disponible") + "..."}
											</p>
										</div>
										<div className="flex flex-row gap-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												className="h-6"
											>
												<path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
												<path
													fillRule="evenodd"
													d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
													clipRule="evenodd"
												/>
												<path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
											</svg>
											<p className="text-black font-coolvetica font-medium">
												Total: ${order.total || "0.00"}
											</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Múltiples pedidos */}
						{pedidos.length > 0 &&
							pedidos.map((currentOrder, index) => (
								<div
									key={currentOrder.id}
									className={`flex items-center flex-col w-full ${
										index !== 0 ? "" : "mt-8"
									}`}
								>
									{/* Línea horizontal con animación */}
									<div className="flex flex-col w-full">
										<div className="mb-10">
											<div className="w-full flex flex-row gap-2 relative">
												{/* Primera barra */}
												<div
													className={`w-1/4 h-2.5 rounded-full ${getFirstBarClass(
														currentOrder
													)}`}
												></div>

												{/* Segunda barra */}
												<div
													className={`w-1/4 h-2.5 rounded-full ${getSecondBarClass(
														currentOrder
													)}`}
												></div>

												{/* Tercera barra */}
												<div
													className={`w-1/2 h-2.5 rounded-full ${getThirdBarClass(
														currentOrder
													)}`}
												></div>

												{/* SVG permanece igual */}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6 absolute right-2 bottom-4"
												>
													<path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
													<path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
												</svg>
											</div>
											<p className="text-black font-coolvetica font-bold text-left mt-2">
												{!currentOrder.elaborado
													? "Anhelo está preparando tu pedido..."
													: currentOrder.cadete !== "NO ASIGNADO"
													? "En camino... Atención, te va a llamar tu cadete."
													: "Tu cadete está llegando a Anhelo..."}
											</p>
										</div>
										<div className="flex flex-col text-left gap-2">
											<div className="flex flex-row gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6"
												>
													<path
														fillRule="evenodd"
														d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
														clipRule="evenodd"
													/>
												</svg>

												<p className="text-black font-coolvetica font-medium">
													Entrega estimada:{" "}
													{sumarMinutos(currentOrder.hora, 30)} a{" "}
													{sumarMinutos(currentOrder.hora, 50)}
												</p>
											</div>
											<div className="flex flex-row gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6"
												>
													<path
														fillRule="evenodd"
														d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
														clipRule="evenodd"
													/>
												</svg>

												<p className="text-black font-coolvetica font-medium">
													Envío a cargo de:{" "}
													{currentOrder.cadete !== "NO ASIGNADO"
														? currentOrder.cadete.charAt(0).toUpperCase() +
														  currentOrder.cadete.slice(1).toLowerCase()
														: "Aún sin asignar."}
												</p>
											</div>
											<div className="flex flex-row gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6"
												>
													<path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
													<path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
												</svg>
												<p
													className="text-black font-coolvetica font-medium cursor-pointer"
													onClick={() => setShowFullAddress(!showFullAddress)}
												>
													Destino:{" "}
													{showFullAddress
														? currentOrder.direccion || "No disponible"
														: (currentOrder.direccion?.split(",")[0].trim() ||
																"No disponible") + "..."}
												</p>
											</div>
											<div className="flex flex-row gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6"
												>
													<path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
													<path
														fillRule="evenodd"
														d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
														clipRule="evenodd"
													/>
													<path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
												</svg>
												<p className="text-black font-coolvetica font-medium">
													Total: ${currentOrder.total || "0.00"}
												</p>
											</div>
										</div>
									</div>

									{/* Línea horizontal fina y negra, excepto en el último elemento */}
									{index < pedidos.length - 1 && (
										<div className="w-full h-px bg-black opacity-20 mt-8"></div>
									)}
								</div>
							))}
					</div>
				)}

				{/* Mostrar mensaje si no hay pedidos */}
				{!loading && !order && pedidos.length === 0 && (
					<div className="flex flex-col items-center justify-center mt-8">
						<p className="text-gray-700 text-lg">
							No se encontraron pedidos para hoy.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Pedido;
