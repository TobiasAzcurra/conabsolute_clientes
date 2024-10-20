import React, { useRef, useState, useEffect } from "react";
import {
	ReadOrdersForTodayById,
	ListenOrdersForTodayByPhoneNumber,
	deleteOrder,
} from "../../firebase/getPedido";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import logo from "../../assets/anheloTMblack.png";
import StickerCanvas from "../../components/StickerCanvas";
import LoadingPoints from "../../components/LoadingPoints";
import AppleModal from "../../components/AppleModal";

const Pedido = () => {
	const [order, setOrder] = useState(null);
	const [pedidos, setPedidos] = useState([]);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { orderId } = useParams();
	const location = useLocation();
	const [pedidosPagados, setPedidosPagados] = useState([]);
	const [pedidosNoPagados, setPedidosNoPagados] = useState([]);
	const [showFullAddress, setShowFullAddress] = useState(false);
	const [phoneNumber, setPhoneNumber] = useState("");
	const [message, setMessage] = useState(null);
	const [error, setError] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedOrderId, setSelectedOrderId] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Updated states for rating functionality
	const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
	const [currentRating, setCurrentRating] = useState(0);
	const [orderRatings, setOrderRatings] = useState({});

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
		let unsubscribeOrder;
		let unsubscribePhoneNumber;

		const cleanUp = () => {
			if (unsubscribeOrder) unsubscribeOrder();
			if (unsubscribePhoneNumber) unsubscribePhoneNumber();
		};

		if (orderId) {
			setLoading(true);
			unsubscribeOrder = ReadOrdersForTodayById(orderId, (pedido) => {
				if (pedido && typeof pedido.direccion === "string") {
					setOrder(pedido);
					setPhoneNumber(pedido.telefono);
				} else {
					setOrder(null);
					setPhoneNumber("");
				}
				setLoading(false);
			});
		}

		if (!orderId && location.state && location.state.phoneNumber) {
			const { phoneNumber } = location.state;
			setPhoneNumber(phoneNumber);
		}

		if (phoneNumber) {
			setLoading(true);
			unsubscribePhoneNumber = ListenOrdersForTodayByPhoneNumber(
				phoneNumber,
				(pedidosActualizados) => {
					console.log("Pedidos pagados:", pedidosActualizados);

					const pedidosConPago = pedidosActualizados.filter(
						(pedido) => pedido.paid === true
					);
					const pedidosSinPago = pedidosActualizados.filter(
						(pedido) => pedido.paid === false
					);

					setPedidosPagados(pedidosConPago);
					setPedidosNoPagados(pedidosSinPago);

					setLoading(false);
				}
			);
		}

		return () => {
			cleanUp();
		};
	}, [orderId, location.state, phoneNumber]);

	const containerRef = useRef(null);
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				const width = containerRef.current.offsetWidth;
				const height = containerRef.current.offsetHeight;
				setContainerSize({ width, height });
			}
		};

		updateSize();

		window.addEventListener("resize", updateSize);
		return () => window.removeEventListener("resize", updateSize);
	}, []);

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

	const eliminarPedido = async () => {
		if (!selectedOrderId) return;

		setIsDeleting(true);
		setMessage(null);
		setError(null);

		try {
			await deleteOrder(selectedOrderId);
			setMessage("Pedido cancelado exitosamente.");

			if (orderId) {
				setOrder(null);
			}

			setPedidosPagados((prevPedidos) =>
				prevPedidos.filter((pedido) => pedido.id !== selectedOrderId)
			);

			setIsModalOpen(false);
		} catch (err) {
			setError("Hubo un problema al cancelar el pedido. Inténtalo de nuevo.");
		} finally {
			setIsDeleting(false);
			setSelectedOrderId(null);
		}
	};

	const handleCancelClick = (orderId) => {
		setSelectedOrderId(orderId);
		setIsModalOpen(true);
	};

	// Updated function to handle rating
	const handleRateOrder = async () => {
		if (!selectedOrderId || currentRating === 0) return;

		setMessage(null);
		setError(null);

		try {
			// Update the local state instead of calling an API
			setOrderRatings((prevRatings) => ({
				...prevRatings,
				[selectedOrderId]: currentRating,
			}));

			setPedidosPagados((prevPedidos) =>
				prevPedidos.map((pedido) =>
					pedido.id === selectedOrderId
						? { ...pedido, rating: currentRating }
						: pedido
				)
			);

			setMessage("Gracias por calificar tu pedido.");
			setIsRatingModalOpen(false);
		} catch (err) {
			setError("Hubo un problema al calificar el pedido. Inténtalo de nuevo.");
		} finally {
			setSelectedOrderId(null);
			setCurrentRating(0);
		}
	};

	// Function to open rating modal
	const handleRateClick = (orderId) => {
		setSelectedOrderId(orderId);
		setIsRatingModalOpen(true);
	};

	return (
		<div
			ref={containerRef}
			className="bg-gray-100 relative flex justify-between flex-col h-screen"
		>
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
			<div className="justify-center my-auto items-center flex flex-col">
				<div className="flex items-center flex-col pt-16">
					<img src={logo} className="w-1/2" alt="Logo" />
				</div>
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

				{error && <div className="mt-4 text-red-600 font-medium">{error}</div>}

				{!loading && pedidosPagados.length > 0 && (
					<div className="flex items-center flex-col w-full px-4 mt-8 space-y-16 overflow-y-auto">
						{pedidosPagados.map((currentOrder, index) => (
							<div
								key={currentOrder.id}
								className={`flex items-center flex-col w-full ${
									index !== 0 ? "" : "mt-8"
								} ${index === pedidosPagados.length - 1 ? "pb-16" : ""}`}
							>
								{pedidosPagados.length > 1 && (
									<h2 className="text-2xl w-full text-left font-bold font-coolvetica mb-10">
										Pedido {index + 1}
									</h2>
								)}

								<div className="flex flex-col w-full">
									<div className="mb-10">
										<div className="w-full flex flex-row gap-2 relative">
											<div
												className={`w-1/4 h-2.5 rounded-full ${getFirstBarClass(
													currentOrder
												)}`}
											></div>
											<div
												className={`w-1/4 h-2.5 rounded-full ${getSecondBarClass(
													currentOrder
												)}`}
											></div>
											<div
												className={`w-1/2 h-2.5 rounded-full ${getThirdBarClass(
													currentOrder
												)}`}
											></div>
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
												Entrega estimada: {sumarMinutos(currentOrder.hora, 30)}{" "}
												a {sumarMinutos(currentOrder.hora, 50)}
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

								<div
									onClick={() => handleCancelClick(currentOrder.id)}
									className={`${
										isDeleting
											? "opacity-50 cursor-not-allowed"
											: "cursor-pointer"
									} bg-gray-300 w-full text-red-main font-coolvetica text-center justify-center h-20 flex items-center text-2xl rounded-3xl mt-12 font-bold`}
								>
									{isDeleting ? (
										<div className="flex items-center justify-center space-x-2">
											<LoadingPoints className="h-4 w-4" />{" "}
										</div>
									) : (
										"Cancelar pedido"
									)}
								</div>

								{/* Updated button for rating */}
								<div
									onClick={() => handleRateClick(currentOrder.id)}
									className="bg-gray-300 w-full text-black font-coolvetica text-center justify-center h-20 flex items-center text-2xl rounded-3xl mt-4 font-bold cursor-pointer"
								>
									{orderRatings[currentOrder.id]
										? `Tu calificación: ${
												orderRatings[currentOrder.id]
										  } estrellas`
										: "Calificar pedido"}
								</div>

								{index < pedidosPagados.length - 1 && (
									<div className="w-full h-px bg-black opacity-20 mt-8"></div>
								)}
							</div>
						))}
					</div>
				)}

				{!loading && pedidosPagados.length === 0 && (
					<div className="flex flex-col items-center justify-center mt-4">
						<p className="text-gray-700">No se encontraron pedidos para hoy.</p>
					</div>
				)}
			</div>

			<AppleModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title="Confirmar Cancelación"
				twoOptions={true}
				onConfirm={eliminarPedido}
				isLoading={isDeleting}
			>
				<p>¿Estás seguro de que deseas cancelar este pedido?</p>
				{error && <p className="text-red-600 mt-2">{error}</p>}
			</AppleModal>

			{/* Updated AppleModal for rating */}
			<AppleModal
				isOpen={isRatingModalOpen}
				onClose={() => setIsRatingModalOpen(false)}
				title="Clasificación"
				twoOptions={false}
				onConfirm={handleRateOrder}
				isRatingModal={true}
				currentRating={currentRating}
				setCurrentRating={setCurrentRating}
			>
				{error && <p className="text-red-600 mt-2">{error}</p>}
			</AppleModal>
		</div>
	);
};

export default Pedido;
