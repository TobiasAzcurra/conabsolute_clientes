// Pedido.jsx
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
import {
	getCadetePhone,
	updateRatingForOrder,
} from "../../firebase/uploadOrder";

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
	const [currentTime, setCurrentTime] = useState(new Date());

	// Estado para el modal de calificación
	const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
	const [orderRatings, setOrderRatings] = useState({});
	const [selectedOrderProducts, setSelectedOrderProducts] = useState([]);
	const [additionalProducts, setAdditionalProducts] = useState([]);
	const [ratedOrders, setRatedOrders] = useState(new Set());
	const containerRef = useRef(null);

	// Agregar useEffect para el cronómetro
	useEffect(() => {
		console.log("🕒 Iniciando cronómetro...");
		const timer = setInterval(() => {
			const newTime = new Date();
			console.log("⏱️ Actualizando tiempo:", newTime.toLocaleTimeString());
			setCurrentTime(newTime);
		}, 60000); // Actualizar cada minuto

		return () => {
			console.log("🛑 Limpiando cronómetro");
			clearInterval(timer);
		};
	}, []);

	const getOrderDateTime = (fechaStr, horaStr) => {
		if (!fechaStr || !horaStr) {
			console.log("⚠️ Fecha u hora faltante:", { fechaStr, horaStr });
			return null;
		}

		const fechaValida = /^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr);
		const horaValida = /^\d{2}:\d{2}$/.test(horaStr);

		if (!fechaValida || !horaValida) {
			console.warn(
				`⚠️ Formato inválido: Fecha - ${fechaStr}, Hora - ${horaStr}`
			);
			return null;
		}

		const [dia, mes, anio] = fechaStr.split("/").map(Number);
		const [horas, minutos] = horaStr.split(":").map(Number);

		const orderDateTime = new Date(anio, mes - 1, dia, horas, minutos, 0, 0);

		if (isNaN(orderDateTime)) {
			console.warn(`⚠️ Fecha inválida: Fecha - ${fechaStr}, Hora - ${horaStr}`);
			return null;
		}

		console.log("📅 Fecha del pedido creada:", orderDateTime.toLocaleString());
		return orderDateTime;
	};

	const isDelayed = (order) => {
		const { fecha, hora } = order;
		let { entregado } = order;

		console.log("🔍 Verificando demora para pedido:", order.id);
		console.log("📅 Fecha pedido:", fecha);
		console.log("🕒 Hora pedido:", hora);
		console.log("✅ Entregado:", entregado);

		if (!fecha || !hora) {
			console.warn(`⚠️ Pedido ${order.id}: falta fecha u hora`);
			return false;
		}

		if (entregado === undefined) {
			entregado = false;
			console.warn(
				`⚠️ Pedido ${order.id}: entregado undefined, asignando false`
			);
		}

		const orderDateTime = getOrderDateTime(fecha, hora);
		if (!orderDateTime) {
			console.warn(`⚠️ Pedido ${order.id}: fecha/hora inválida`);
			return false;
		}

		const diffMs = currentTime - orderDateTime;
		const diffMinutes = diffMs / (1000 * 60);

		console.log(`⏱️ Minutos de demora: ${diffMinutes.toFixed(2)}`);

		const retrasado = diffMinutes > 40 && !entregado;
		console.log(`🚨 Pedido retrasado: ${retrasado}`);

		return retrasado;
	};

	// Función para obtener el tiempo de demora actual
	const getDelayTime = (order) => {
		const { fecha, hora } = order;
		const orderDateTime = getOrderDateTime(fecha, hora);

		if (!orderDateTime) {
			console.log(
				"⚠️ No se pudo calcular el tiempo de demora - fecha/hora inválida"
			);
			return null;
		}

		const diffMs = currentTime - orderDateTime;
		const diffMinutes = Math.floor(diffMs / (1000 * 60));

		console.log(`⏱️ Tiempo de demora calculado: ${diffMinutes} minutos`);
		return diffMinutes;
	};

	const handleRateOrder = async (ratings) => {
		console.log("📥 Ratings received:", ratings);
		if (!selectedOrderId) {
			console.error("❌ No se ha seleccionado un Order ID para calificar.");
			return;
		}

		console.log("🔍 Selected Order ID:", selectedOrderId);
		console.log("📦 Selected Order Products:", selectedOrderProducts);
		console.log("📦 Additional Products to Rate:", additionalProducts);

		setMessage(null);
		setError(null);

		try {
			const {
				tiempo,
				temperatura,
				presentacion,
				pagina,
				comentario,
				...productRatings
			} = ratings;

			console.log("📝 Desglose de calificaciones:", {
				tiempo,
				temperatura,
				presentacion,
				pagina,
				comentario,
				productRatings,
			});

			const currentOrder = pedidosPagados.find(
				(order) => order.id === selectedOrderId
			);
			if (!currentOrder) {
				console.error("❌ Pedido no encontrado en pedidosPagados.");
				throw new Error("Pedido no encontrado.");
			}

			const fecha = currentOrder.fecha;
			console.log("📅 Fecha del pedido:", fecha);

			if (!fecha) {
				console.error("❌ La fecha del pedido no está definida.");
				throw new Error("Fecha del pedido no disponible.");
			}

			console.log("🔄 Llamando a updateRatingForOrder con:", {
				fecha,
				selectedOrderId,
				rating: ratings,
			});
			await updateRatingForOrder(fecha, selectedOrderId, ratings);
			console.log("✅ Calificación actualizada exitosamente.");

			setOrderRatings((prevRatings) => ({
				...prevRatings,
				[selectedOrderId]: ratings,
			}));

			setRatedOrders((prev) => new Set(prev).add(selectedOrderId));

			setMessage("¡Gracias por calificar tu pedido!");
			setIsRatingModalOpen(false);
		} catch (err) {
			console.error("❌ Error al enviar la calificación:", err);
			setError("Hubo un problema al calificar el pedido. Inténtalo de nuevo.");
		} finally {
			setSelectedOrderId(null);
			setAdditionalProducts([]);
		}
	};

	function sumarMinutos(hora, minutosASumar) {
		if (!hora) return "";
		const [horaStr, minutoStr] = hora.split(":");
		const horas = parseInt(horaStr, 10);
		const minutos = parseInt(minutoStr, 10);

		const fecha = new Date();
		fecha.setHours(horas, minutos, 0, 0);
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
			console.log("🔍 Fetching order by ID:", orderId);
			setLoading(true);
			unsubscribeOrder = ReadOrdersForTodayById(orderId, (pedido) => {
				console.log("📦 Order fetched by ID:", pedido);
				if (pedido && typeof pedido.direccion === "string") {
					setOrder(pedido);
					setPhoneNumber(pedido.telefono);
					console.log("✅ Order set:", pedido);
				} else {
					setOrder(null);
					setPhoneNumber("");
					console.warn("⚠️ Order is null or direccion is not a string");
				}
				setLoading(false);
			});
		}

		if (!orderId && location.state && location.state.phoneNumber) {
			const { phoneNumber } = location.state;
			console.log(
				"🔍 Fetching orders by phone number from location state:",
				phoneNumber
			);
			setPhoneNumber(phoneNumber);
		}

		if (phoneNumber) {
			console.log("🔔 Listening to orders by phone number:", phoneNumber);
			setLoading(true);
			unsubscribePhoneNumber = ListenOrdersForTodayByPhoneNumber(
				phoneNumber,
				(pedidosActualizados) => {
					console.log(
						"📦 Orders fetched by phone number:",
						pedidosActualizados
					);
					const pedidosConPago = pedidosActualizados.filter(
						(pedido) => pedido.paid === true
					);
					const pedidosSinPago = pedidosActualizados.filter(
						(pedido) => pedido.paid === false
					);

					console.log("💰 Paid orders:", pedidosConPago);
					console.log("💸 Unpaid orders:", pedidosSinPago);

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

	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				const width = containerRef.current.offsetWidth;
				const height = containerRef.current.offsetHeight;
				setContainerSize({ width, height });
				console.log("📏 Container size updated:", { width, height });
			}
		};

		updateSize();

		window.addEventListener("resize", updateSize);
		return () => window.removeEventListener("resize", updateSize);
	}, []);

	const eliminarPedido = async () => {
		if (!selectedOrderId) return;

		console.log("🗑️ Eliminando pedido:", selectedOrderId);
		setIsDeleting(true);
		setMessage(null);
		setError(null);

		try {
			await deleteOrder(selectedOrderId);
			console.log("✅ Pedido cancelado exitosamente:", selectedOrderId);
			setMessage("Pedido cancelado exitosamente.");

			if (orderId) {
				setOrder(null);
				console.log("🧹 Order state cleared.");
			}

			setPedidosPagados((prevPedidos) =>
				prevPedidos.filter((pedido) => pedido.id !== selectedOrderId)
			);

			setIsModalOpen(false);
		} catch (err) {
			console.error("❌ Hubo un problema al cancelar el pedido:", err);
			setError("Hubo un problema al cancelar el pedido. Inténtalo de nuevo.");
		} finally {
			setIsDeleting(false);
			setSelectedOrderId(null);
		}
	};

	const handleCancelClick = (orderId) => {
		console.log("🛑 Solicitando cancelación para pedido:", orderId);
		setSelectedOrderId(orderId);
		setIsModalOpen(true);
	};

	const handleRateClick = (orderId) => {
		const order = pedidosPagados.find((pedido) => pedido.id === orderId);
		if (!order) {
			console.error("Pedido no encontrado:", orderId);
			return;
		}

		setSelectedOrderProducts(order.detallePedido || []);
		setSelectedOrderId(orderId);

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
			return !excludedPrefixes.some((prefix) =>
				nombreLimpio.startsWith(prefix.toLowerCase())
			);
		});

		if (shouldIncludePapasAnhelo) {
			setAdditionalProducts((prevProducts) => {
				const isAlreadyInOrder = order.detallePedido.some(
					(producto) =>
						producto.burger.toLowerCase() === "papas anhelo ®".toLowerCase()
				);
				if (!isAlreadyInOrder && !prevProducts.includes("Papas Anhelo ®")) {
					return [...prevProducts, "Papas Anhelo ®"];
				}
				return prevProducts;
			});
			console.log("📌 Se incluirá 'Papas Anhelo ®' en las calificaciones.");
		} else {
			setAdditionalProducts((prevProducts) =>
				prevProducts.filter((product) => product !== "Papas Anhelo ®")
			);
			console.log("📌 No se incluirá 'Papas Anhelo ®' en las calificaciones.");
		}

		setIsRatingModalOpen(true);
	};

	const handleCadeteCall = async (cadete) => {
		console.log("📞 Intentando llamar al cadete:", cadete);
		const telefonoCadete = await getCadetePhone(cadete);

		if (telefonoCadete) {
			console.log("📲 Teléfono del cadete encontrado:", telefonoCadete);
			window.open(`tel:${telefonoCadete}`, "_self");
		} else {
			console.warn("⚠️ Cadete no encontrado");
			alert("Cadete no encontrado");
		}
	};

	const handleSupportClick = () => {
		const phoneNumber = "543584306832";
		const message =
			"Hola! Mi pedido lleva más de 40 minutos de demora y aún no tiene cadete asignado.";
		const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
			message
		)}`;
		window.open(whatsappUrl, "_blank");
	};

	useEffect(() => {
		const orderToRate = pedidosPagados.find(
			(order) => order.tiempoEntregado && !ratedOrders.has(order.id)
		);

		if (orderToRate && !isRatingModalOpen) {
			console.log("🔔 Pedido encontrado para calificar:", orderToRate.id);
			handleRateClick(orderToRate.id);
		}
	}, [pedidosPagados, ratedOrders, isRatingModalOpen]);

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
				{message && (
					<div className="mt-4 text-green-600 font-medium">{message}</div>
				)}

				{!loading && pedidosPagados.length > 0 && (
					<div className="flex items-center flex-col w-full px-4 mt-8 space-y-16 overflow-y-auto">
						{pedidosPagados
							.filter(
								(currentOrder) =>
									!currentOrder.entregado || !ratedOrders.has(currentOrder.id)
							)
							.map((currentOrder, index) => {
								const retrasado = isDelayed(currentOrder);
								const delayMinutes = getDelayTime(currentOrder);
								const showSupportButton =
									retrasado && currentOrder.cadete === "NO ASIGNADO";

								return (
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
														className={`w-1/4 h-2.5 rounded-full ${
															!currentOrder.elaborado
																? "animated-loading"
																: "bg-black"
														}`}
													></div>

													<div
														className={`w-1/4 h-2.5 rounded-full ${
															currentOrder.elaborado &&
															currentOrder.cadete === "NO ASIGNADO"
																? "animated-loading"
																: currentOrder.elaborado
																? "bg-black"
																: "bg-gray-100 border-opacity-20 border-black border-1 border"
														}`}
													></div>

													<div
														className={`w-1/2 h-2.5 rounded-full ${
															currentOrder.elaborado &&
															currentOrder.cadete !== "NO ASIGNADO"
																? "animated-loading"
																: "bg-gray-100 border-opacity-20 border-black border-1 border"
														}`}
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
															d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 17.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
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

										<div className="w-full">
											{showSupportButton ? (
												<div
													onClick={handleSupportClick}
													className="bg-black w-full text-gray-100 font-coolvetica text-center justify-center h-20 flex items-center text-2xl rounded-3xl mt-12 font-bold cursor-pointer transition-colors duration-300"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 24 24"
														fill="currentColor"
														className="h-5 mr-2"
													>
														<path
															fillRule="evenodd"
															d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
															clipRule="evenodd"
														/>
													</svg>
													Escribir a soporte
												</div>
											) : (
												currentOrder.cadete !== "NO ASIGNADO" && (
													<div
														onClick={() =>
															handleCadeteCall(currentOrder.cadete)
														}
														className="bg-black w-full text-gray-100 font-coolvetica text-center justify-center h-20 flex items-center text-2xl rounded-3xl mt-12 font-bold cursor-pointer transition-colors duration-300"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 24 24"
															fill="currentColor"
															className="h-5 mr-2"
														>
															<path
																fillRule="evenodd"
																d="M15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-4.72 4.72a.75.75 0 11-1.06-1.06l4.72-4.72h-2.69a.75.75 0 01-.75-.75z"
																clipRule="evenodd"
															/>
															<path
																fillRule="evenodd"
																d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
																clipRule="evenodd"
															/>
														</svg>
														Llamar cadete
													</div>
												)
											)}

											<div
												onClick={() => handleCancelClick(currentOrder.id)}
												className={`${
													isDeleting
														? "opacity-50 cursor-not-allowed"
														: "cursor-pointer"
												} bg-gray-300 w-full text-red-main font-coolvetica text-center justify-center h-20 flex items-center text-2xl rounded-3xl mt-2 font-bold`}
											>
												{isDeleting ? (
													<div className="flex items-center justify-center space-x-2">
														<LoadingPoints className="h-4 w-4" />
													</div>
												) : (
													<div className="bg-gray-300 w-full text-red-main font-coolvetica text-center justify-center h-20 flex items-center text-2xl rounded-3xl mt-2 font-bold cursor-pointer transition-colors duration-300">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 24 24"
															fill="currentColor"
															className="h-5 mr-2"
														>
															<path
																fillRule="evenodd"
																d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
																clipRule="evenodd"
															/>
														</svg>
														Cancelar pedido
													</div>
												)}
											</div>
										</div>

										{index < pedidosPagados.length - 1 && (
											<div className="w-full h-px bg-black opacity-20 mt-8"></div>
										)}
									</div>
								);
							})}
					</div>
				)}

				{!loading && pedidosPagados.length === 0 && (
					<div className="flex flex-col items-center justify-center mt-4">
						<p className="text-gray-700">No se encontraron pedidos para hoy.</p>
					</div>
				)}
			</div>

			<div className="w-full">
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
			</div>
		</div>
	);
};

export default Pedido;
