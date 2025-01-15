import React, { useRef, useState, useEffect } from "react";
import {
    ReadOrdersForTodayById,
    ListenOrdersForTodayByPhoneNumber,
    cancelOrder,
} from "../../firebase/getPedido";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import logo from "../../assets/anheloTMblack.png";
import StickerCanvas from "../../components/StickerCanvas";
import LoadingPoints from "../../components/LoadingPoints";
import UpdatedPedidoSection from "./UpdatedPedidoSection";
import AppleModal from "../../components/AppleModal";
import isologo from "../../assets/isologo.png";
import {
    getCadetePhone,
    updateRatingForOrder,
} from "../../firebase/uploadOrder";
import EditAddressModal from './EditAddressModal';
import { doc, runTransaction, collection, getFirestore } from 'firebase/firestore';

const Pedido = () => {
    console.log("🔄 Inicializando componente Pedido");
    const [order, setOrder] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasBeenRated, setHasBeenRated] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const navigate = useNavigate();
    const { orderId } = useParams();
    const location = useLocation();
    const [pedidosPagados, setPedidosPagados] = useState([]);
    const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
const [editingOrderId, setEditingOrderId] = useState(null);
    const [pedidosNoPagados, setPedidosNoPagados] = useState([]);
    const [showFullAddress, setShowFullAddress] = useState(false);
    const [isEditTimeModalOpen, setIsEditTimeModalOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [isUpdatingTime, setIsUpdatingTime] = useState(false);
    const [isRatingLoading, setIsRatingLoading] = useState(false);
    const [orderRatings, setOrderRatings] = useState({});
    const [selectedOrderProducts, setSelectedOrderProducts] = useState([]);
    const [additionalProducts, setAdditionalProducts] = useState([]);
    const containerRef = useRef(null);
    const [modalAdditionalProducts, setModalAdditionalProducts] = useState([]);

    useEffect(() => {
        console.log("🕒 Iniciando cronómetro...");
        const timer = setInterval(() => {
            const newTime = new Date();
            console.log("⏱️ Actualizando tiempo:", newTime.toLocaleTimeString());
            setCurrentTime(newTime);
        }, 60000);

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
            console.warn(`⚠️ Formato inválido: Fecha - ${fechaStr}, Hora - ${horaStr}`);
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

        if (!fecha || !hora) {
            console.warn(`⚠️ Pedido ${order.id}: falta fecha u hora`);
            return false;
        }

        if (entregado === undefined) {
            entregado = false;
            console.warn(`⚠️ Pedido ${order.id}: entregado undefined, asignando false`);
        }

        const orderDateTime = getOrderDateTime(fecha, hora);
        if (!orderDateTime) {
            console.warn(`⚠️ Pedido ${order.id}: fecha/hora inválida`);
            return false;
        }

        const diffMs = currentTime - orderDateTime;
        const diffMinutes = diffMs / (1000 * 60);

        console.log(`⏱️ Minutos de demora: ${diffMinutes.toFixed(2)}`);

        const retrasado = diffMinutes > 50 && !entregado;
        console.log(`🚨 Pedido retrasado: ${retrasado}`);

        return retrasado;
    };

    const getDelayTime = (order) => {
        const { fecha, hora } = order;
        const orderDateTime = getOrderDateTime(fecha, hora);

        if (!orderDateTime) {
            console.log("⚠️ No se pudo calcular el tiempo de demora - fecha/hora inválida");
            return null;
        }

        const diffMs = currentTime - orderDateTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        console.log(`⏱️ Tiempo de demora calculado: ${diffMinutes} minutos`);
        return diffMinutes;
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

    const handleRateOrder = async (ratings) => {
        console.log("📥 Iniciando proceso de calificación");
        if (!selectedOrderId) {
            console.error("❌ Error: No hay Order ID seleccionado para calificar");
            return;
        }

        setMessage(null);
        setError(null);
        setIsRatingLoading(true);

        try {
            const currentOrder = pedidosPagados.find(
                (order) => order.id === selectedOrderId
            );
            if (!currentOrder) {
                throw new Error("Pedido no encontrado.");
            }

            const fecha = currentOrder.fecha;
            if (!fecha) {
                throw new Error("Fecha del pedido no disponible.");
            }

            await updateRatingForOrder(fecha, selectedOrderId, ratings);
            localStorage.removeItem("pendingRating");

            setPedidosPagados((prevPedidos) =>
                prevPedidos.map((pedido) =>
                    pedido.id === selectedOrderId
                        ? { ...pedido, rating: ratings }
                        : pedido
                )
            );

            setMessage("¡Gracias por calificar tu pedido!");
            setIsRatingModalOpen(false);
        } catch (err) {
            console.error("❌ Error al enviar la calificación:", err);
            setError("Hubo un problema al calificar el pedido. Inténtalo de nuevo.");
        } finally {
            setIsRatingLoading(false);
            setSelectedOrderId(null);
            setAdditionalProducts([]);
        }
    };

    const handleUpdateTime = async () => {
        if (!newTime) {
          setTimeError('Por favor selecciona una hora válida');
          return;
        }
      
        setIsUpdatingTime(true);
        setTimeError('');
      
        try {
          const firestore = getFirestore();
          const fechaActual = obtenerFechaActual();
          const [dia, mes, anio] = fechaActual.split("/");
          const pedidosCollectionRef = collection(firestore, "pedidos", anio, mes);
          const pedidoDocRef = doc(pedidosCollectionRef, dia);
      
          await runTransaction(firestore, async (transaction) => {
            const docSnapshot = await transaction.get(pedidoDocRef);
            if (!docSnapshot.exists()) {
              throw new Error("El pedido no existe para la fecha especificada.");
            }
      
            const existingData = docSnapshot.data();
            const pedidosDelDia = existingData.pedidos || [];
            const pedidoIndex = pedidosDelDia.findIndex(
              (pedido) => pedido.id === orderId
            );
      
            if (pedidoIndex === -1) {
              throw new Error("Pedido no encontrado");
            }
      
            // Ajustamos la hora según el método de entrega
            const pedido = pedidosDelDia[pedidoIndex];
            const isDelivery = pedido.direccion !== "";
            
            // Convertimos la hora seleccionada a minutos desde medianoche
            const [hours, minutes] = newTime.split(':').map(Number);
            let totalMinutes = hours * 60 + minutes;
            
            // Restamos el tiempo de preparación/envío según corresponda
            if (isDelivery) {
              totalMinutes -= 30; // Para delivery
            } else {
              totalMinutes -= 15; // Para takeaway
            }
            
            // Convertimos nuevamente a formato HH:mm
            const adjustedHours = Math.floor(totalMinutes / 60);
            const adjustedMinutes = totalMinutes % 60;
            const adjustedTime = `${String(adjustedHours).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}`;
      
            pedidosDelDia[pedidoIndex].hora = adjustedTime;
      
            transaction.set(pedidoDocRef, {
              ...existingData,
              pedidos: pedidosDelDia,
            });
          });
      
          onTimeSuccess?.(newTime);
          onClose();
        } catch (error) {
          console.error('❌ Error al actualizar la hora:', error);
          setTimeError('Hubo un problema al actualizar la hora. Por favor intenta nuevamente.');
        } finally {
          setIsUpdatingTime(false);
        }
      };

    const eliminarPedido = async () => {
        if (!selectedOrderId) return;
    
        console.log("🚫 Cancelando pedido:", selectedOrderId);
        setIsDeleting(true);
        setMessage(null);
        setError(null);
    
        try {
            await cancelOrder(selectedOrderId);
            console.log("✅ El pedido fue marcado como cancelado:", selectedOrderId);
            const pedidoCancelado = pedidosPagados.find(pedido => pedido.id === selectedOrderId);
            const tieneVouchers = pedidoCancelado?.couponCodes?.length > 0;
            
            setMessage(
                tieneVouchers 
                    ? "El pedido fue cancelado exitosamente, tus vouchers están disponibles para que los canjees en tu próximo pedido!"
                    : "El pedido fue cancelado exitosamente."
            );
    
            if (orderId) {
                setOrder(null);
            }
    
            setPedidosPagados((prevPedidos) =>
                prevPedidos.map((pedido) =>
                    pedido.id === selectedOrderId
                        ? { ...pedido, canceled: true }
                        : pedido
                )
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
        console.log("💬 Iniciando contacto con soporte");
        const phoneNumber = "543584306832";
        const message = "Hola! Mi pedido lleva más de 50 minutos de demora y aún no tiene cadete asignado.";
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    };

    const handleEditAddress = (orderId) => {
        setEditingOrderId(orderId);
        setIsEditAddressModalOpen(true);
    };

    const handleAddressUpdateSuccess = (newAddress) => {
        // Opcional: Puedes mostrar un mensaje de éxito aquí
        setMessage("¡Dirección actualizada exitosamente!");
        setTimeout(() => setMessage(null), 3000);
    };
    

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
                    if (pedido.entregado && !pedido.rating && !hasBeenRated) {
                        setSelectedOrderProducts(pedido.detallePedido || []);
                        setSelectedOrderId(pedido.id);
                        setIsRatingModalOpen(true);
                    }
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
            setPhoneNumber(phoneNumber);
        }

        if (phoneNumber) {
            unsubscribePhoneNumber = ListenOrdersForTodayByPhoneNumber(
                phoneNumber,
                (pedidosActualizados) => {
                    const pedidosConPago = pedidosActualizados.filter(
                        (pedido) => pedido.paid === true
                    );
                    const pedidosSinPago = pedidosActualizados.filter(
                        (pedido) => pedido.paid === false
                    );

                    const pedidoParaCalificar = pedidosConPago.find(
                        (pedido) => pedido.entregado && !pedido.rating && !hasBeenRated
                    );

                    if (pedidoParaCalificar) {
                        setSelectedOrderProducts(pedidoParaCalificar.detallePedido || []);
                        setSelectedOrderId(pedidoParaCalificar.id);
                        setIsRatingModalOpen(true);
                    }

                    setPedidosPagados(pedidosConPago);
                    setPedidosNoPagados(pedidosSinPago);
                    setLoading(false);
                }
            );
        }

        return cleanUp;
    }, [orderId, location.state, phoneNumber]);

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

    const handleEditTime = (orderId) => {
        setEditingOrderId(orderId);
        setIsEditTimeModalOpen(true);
      };
      
      const handleTimeUpdateSuccess = (newTime) => {
        setMessage("¡Hora actualizada exitosamente!");
        setTimeout(() => setMessage(null), 3000);
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
                    <img src={logo} className="w-2/3" alt="Logo" />
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
                    <div className="mt-4 text-green-600 font-medium text-center">
                        {message}
                    </div>
                )}{!loading && pedidosPagados.length > 0 && (
                    <div className="flex items-center flex-col w-full mt-8 space-y-4 overflow-y-auto">
                        {pedidosPagados
                            .filter(
                                (currentOrder) =>
                                    !currentOrder.entregado || !currentOrder.rating
                            )
                            .map((currentOrder, index) => {
                                if (currentOrder.rechazado) {
                                    return (
                                        <div key={currentOrder.id} className="px-4 w-full">
                                            <p className="text-red-600 font-medium mb-4 text-center">
                                                Anhelo rechazó tu pedido por falta de stock.
                                            </p>
                                        </div>
                                    );
                                }
    
                                console.log("🔄 Renderizando pedido:", currentOrder.id);
                                const retrasado = isDelayed(currentOrder);
                                const delayMinutes = getDelayTime(currentOrder);
                                const showSupportButton =
                                    retrasado && currentOrder.cadete === "NO ASIGNADO";
                                const showCadeteCallButton =
                                    retrasado && currentOrder.cadete !== "NO ASIGNADO";
                                const showCancelButton = !currentOrder.elaborado || retrasado;
                                const hasButtons =
                                    showSupportButton || showCadeteCallButton || showCancelButton;
    
                                return (
                                    <div
                                        key={currentOrder.id}
                                        className={`flex items-center flex-col w-full ${
                                            index !== 0 ? "mt-4" : ""
                                        } ${index === pedidosPagados.length - 1 ? "pb-4" : ""}`}
                                    >
{pedidosPagados.length > 1 && (
                                        <h2 className="text-2xl w-full px-4 text-left font-bold font-coolvetica mb-10">
                                            Pedido {index + 1}
                                        </h2>
                                    )}
                                    {/* info */}
                                    <div className="flex flex-col px-4 w-full">
                                        {currentOrder.aceptado && (
                                            <p className="text-green-600 font-medium mb-4 text-center">
                                                ¡Anhelo aceptó tu pedido!
                                            </p>
                                        )}

                                        <div className="mb-10">
                                            <div className="w-full flex flex-row gap-2 relative">
                                                {currentOrder.pendingOfBeingAccepted ? (
                                                    <>
                                                        <div className="w-full h-2.5 rounded-full animated-loading"></div>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            className="h-6 absolute right-2 bottom-4"
                                                        >
                                                            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                                                            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                                                        </svg>
                                                    </>) : currentOrder.direccion === "" ? (
                                                    <>
                                                        {(() => {
                                                            const horaPedido = currentOrder.hora;
                                                            const partesHora = horaPedido.split(":");
                                                            const fechaActual = new Date();
                                                            const fechaHoraPedido = new Date(
                                                                fechaActual.getFullYear(),
                                                                fechaActual.getMonth(),
                                                                fechaActual.getDate(),
                                                                parseInt(partesHora[0]),
                                                                parseInt(partesHora[1])
                                                            );
                                                            const diferenciaEnMinutos = (new Date() - fechaHoraPedido) / 60000;

                                                            return (
                                                                <>
                                                                    <div
                                                                        className={`w-1/2 h-2.5 rounded-full ${
                                                                            diferenciaEnMinutos <= 20
                                                                                ? "animated-loading"
                                                                                : "bg-black"
                                                                        }`}
                                                                    ></div>
                                                                    <div
                                                                        className={`w-1/2 h-2.5 rounded-full ${
                                                                            diferenciaEnMinutos > 20
                                                                                ? "animated-loading"
                                                                                : "bg-gray-100 border-opacity-20 border-black border-1 border"
                                                                        }`}
                                                                    ></div>
                                                                </>
                                                            );
                                                        })()}</>
                                                    ) : (
                                                        <>
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
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-black font-coolvetica font-bold text-left mt-2">
                                                    {currentOrder.pendingOfBeingAccepted 
                                                        ? "Tu pedido está pendiente de aprobación..."
                                                        : currentOrder.direccion === ""
                                                            ? (new Date() - new Date(currentOrder.hora)) / 60000 <= 20
                                                                ? "Anhelo está preparando tu pedido..."
                                                                : "Esperando que retires tu pedido..."
                                                            : !currentOrder.elaborado
                                                                ? "Anhelo está preparando tu pedido..."
                                                                : currentOrder.cadete !== "NO ASIGNADO"
                                                                    ? "En camino... Atención, te va a llamar tu cadete."
                                                                    : "Tu cadete está llegando a Anhelo..."}</p>
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
    <div className="flex flex-row items-center gap-2 flex-1">
        <p className="text-black font-coolvetica font-medium">
            {currentOrder.pendingOfBeingAccepted 
                ? "Entre 3 a 5 minutos para confirmar"
                : currentOrder.direccion === ""
                    ? `Retirar entre ${sumarMinutos(currentOrder.hora, 15)} hs y ${sumarMinutos(currentOrder.hora, 25)} hs`
                    : `Llega entre ${sumarMinutos(currentOrder.hora, 30)} hs a ${sumarMinutos(currentOrder.hora, 50)} hs`}
        </p>
        {!currentOrder.elaborado && (
            <button
                onClick={() => handleEditTime(currentOrder.id)}
                className="rounded-full hover:bg-gray-100"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                >
                    <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                </svg>
            </button>
        )}
    </div>
</div>
                                                                        
                                                                        {currentOrder.direccion !== "" && (
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
                                                        Envio a cargo de:{" "}
                                                        {currentOrder.cadete !== "NO ASIGNADO"
                                                            ? currentOrder.cadete.charAt(0).toUpperCase() +
                                                            currentOrder.cadete.slice(1).toLowerCase()
                                                            : "Aun sin asignar"}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex flex-row gap-2 items-center">
    {currentOrder.direccion === "" ? (
        <img
            src={isologo}
            className="h-6 brightness-0"
            alt=""
        />
    ) : (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6"
        >
            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
        </svg>
    )}
    <p
        className="text-black font-coolvetica font-medium cursor-pointer flex-1"
        onClick={() => setShowFullAddress(!showFullAddress)}
    >
        {currentOrder.direccion === "" ? (
            "Retirar por Buenos Aires 618"
        ) : (
            <>
                Destino a{" "}
                {showFullAddress
                    ? currentOrder.direccion
                    : (currentOrder.direccion
                            ?.split(",")[0]
                            .trim() || "No disponible") + "..."}
            </>
        )}
    </p>
    { !currentOrder.elaborado && (
  <div className="flex gap-2">
    <button
      onClick={() => handleEditAddress(currentOrder.id)}
      className="rounded-full hover:bg-gray-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
      </svg>
    </button>
    <button
      onClick={() => handleEditTime(currentOrder.id)}
      className="rounded-full hover:bg-gray-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
      </svg>
    </button>
  </div>
)}
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
                                                ${currentOrder.total || "0.00"}
                                            </p>
                                        </div>
                                    </div></div>
                                    {/* botones */}
                                    <div className={`w-full px-4 ${hasButtons ? "mt-11" : ""}`}>
                                        {showSupportButton && (
                                            <div
                                                onClick={handleSupportClick}
                                                className="bg-black w-full text-gray-100 font-coolvetica text-center justify-center h-20 flex items-center text-2xl rounded-3xl font-bold cursor-pointer transition-colors duration-300"
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
                                        )}
{showCancelButton && (
                                            <div
                                                onClick={() => handleCancelClick(currentOrder.id)}
                                                className={`${
                                                    isDeleting || currentOrder.canceled
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : "cursor-pointer"
                                                } bg-gray-300 w-full text-red-main font-coolvetica text-center justify-center h-20 flex items-center text-2xl rounded-3xl mt-2 font-bold`}
                                                disabled={isDeleting || currentOrder.canceled}
                                            >
                                                <div className="flex items-center">
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
                                                    {currentOrder.canceled ? "Pedido cancelado" : "Cancelar pedido"}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!currentOrder.elaborado &&
                                        currentOrder.metodoPago === "efectivo" && (
                                            <UpdatedPedidoSection
                                                currentOrder={currentOrder}
                                                showCancelButton={showCancelButton}
                                                isDeleting={isDeleting}
                                                handleCancelClick={handleCancelClick}
                                            />
                                    )}

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
            <AppleModal
                isOpen={isRatingModalOpen}
                onClose={() => setIsRatingModalOpen(false)}
                title="¡Califica tu pedido!"
                isRatingModal={true}
                orderProducts={selectedOrderProducts}
                additionalProducts={additionalProducts}
                onConfirm={handleRateOrder}
                isLoading={isRatingLoading}
            >
                <p>¡Nos gustaría conocer tu opinión sobre el pedido!</p>
            </AppleModal>
            <AppleModal
  isOpen={isEditTimeModalOpen}
  onClose={() => setIsEditTimeModalOpen(false)}
  title="Cambiar hora"
  isEditTimeModal={true}
  twoOptions={true}
  orderId={editingOrderId}
  onConfirm={handleUpdateTime}
  onTimeSuccess={handleTimeUpdateSuccess}
  isLoading={isUpdatingTime}
/>
            <AppleModal
    isOpen={isEditAddressModalOpen}
    onClose={() => setIsEditAddressModalOpen(false)}
    title="Cambiar direccion"
    isEditAddressModal={true}
    orderId={editingOrderId}
    currentAddress={pedidosPagados.find(p => p.id === editingOrderId)?.direccion || ''}
    onAddressSuccess={handleAddressUpdateSuccess}
/>
        </div>
    </div>
);


};

export default Pedido;