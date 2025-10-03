import { useRef, useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import StickerCanvas from "../../components/StickerCanvas";
import LoadingPoints from "../../components/LoadingPoints";
import SimpleModal from "../../components/ui/SimpleModal";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { listenOrderById } from "../../firebase/orders/listenOrderById";
import { listenOrdersByPhone } from "../../firebase/orders/listenOrdersByPhone";
import { useClient } from "../../contexts/ClientContext";
import currencyFormat from "../../helpers/currencyFormat";

const Pedido = () => {
  const { empresaId, sucursalId, clientConfig, clientData, clientAssets } =
    useClient();
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const { orderId } = useParams();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const containerRef = useRef(null);

  // Mapeo de estados a UI
  const statusConfig = {
    Pending: {
      label: "Pendiente de confirmación",
      color: "text-yellow-600",
      barSteps: 1,
    },
    Confirmed: {
      label: "Confirmado - En preparación",
      color: "text-blue-600",
      barSteps: 2,
    },
    Ready: {
      label: "Listo para retirar/entregar",
      color: "text-green-600",
      barSteps: 3,
    },
    Delivered: {
      label: "En camino...",
      color: "text-gray-600",
      barSteps: 4,
    },
    Cancelled: {
      label: "Cancelado",
      color: "text-red-600",
      barSteps: 0,
    },
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;

    setIsCancelling(true);
    setMessage(null);
    setError(null);

    try {
      const orderRef = doc(
        db,
        "absoluteClientes",
        empresaId,
        "sucursales",
        sucursalId,
        "pedidos",
        selectedOrderId
      );

      await updateDoc(orderRef, {
        status: "Cancelled",
        statusNote: "Cancelado por el cliente",
        "timestamps.canceledAt": new Date().toISOString(),
        "timestamps.updatedAt": new Date().toISOString(),
      });

      setMessage("Pedido cancelado exitosamente");
      setIsCancelModalOpen(false);
    } catch (err) {
      console.error("Error cancelando pedido:", err);
      setError("Error al cancelar el pedido. Intenta nuevamente.");
    } finally {
      setIsCancelling(false);
      setSelectedOrderId(null);
    }
  };

  const handleSupportClick = () => {
    const phone = clientConfig?.logistics?.phone || "";
    const msg = "Hola! Necesito ayuda con mi pedido.";
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      msg
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePaymentClick = (orderTotal, orderPhone) => {
    const phone = clientConfig?.logistics?.phone || "543584306832";
    const alias = clientConfig?.logistics?.alias || "AbsoluteHSAS.mp";
    const nameAlias = clientConfig?.logistics?.nameAlias || "________";
    const msg = `Hola! Hice un pedido de ${currencyFormat(
      orderTotal
    )} para el número ${orderPhone}. En breve envío foto del comprobante. Transferencia al alias: ${alias} a nombre de ${nameAlias}`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      msg
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  useEffect(() => {
    let unsubscribe;

    if (orderId) {
      // Ver un pedido específico
      setLoading(true);
      unsubscribe = listenOrderById(
        empresaId,
        sucursalId,
        orderId,
        (pedido) => {
          if (pedido) {
            setOrder(pedido);
            setPhoneNumber(pedido.customer?.phone || "");
          } else {
            setOrder(null);
          }
          setLoading(false);
        }
      );
    } else if (location.state?.phoneNumber) {
      // Ver pedidos por teléfono desde SuccessPage
      setPhoneNumber(location.state.phoneNumber);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId, location.state, empresaId, sucursalId]);

  useEffect(() => {
    if (!phoneNumber || orderId) return;

    const unsubscribe = listenOrdersByPhone(
      empresaId,
      sucursalId,
      phoneNumber,
      (pedidos) => {
        // Filtrar solo pedidos activos (no entregados ni cancelados)
        const activePedidos = pedidos.filter(
          (p) => p.status !== "Delivered" && p.status !== "Cancelled"
        );
        setOrders(activePedidos);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [phoneNumber, orderId, empresaId, sucursalId]);

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

  const renderProgressBar = (status) => {
    const config = statusConfig[status] || statusConfig.Pending;
    const totalSteps = 4;

    return (
      <div className="w-full bg-gray-300 p-0.5 rounded-full flex gap-1 mb-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full flex-1 ${
              index < config.barSteps
                ? "bg-black"
                : "bg-gray-300 border border-gray-400"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderOrder = (currentOrder) => {
    const config = statusConfig[currentOrder.status] || statusConfig.Pending;
    const isDelivery = currentOrder.fulfillment?.method === "delivery";
    const total = currentOrder.payment?.financeSummary?.total || 0;
    const isPaid = currentOrder.payment?.status === "completed";
    const canCancel = currentOrder.status === "Pending";

    return (
      <div className="flex flex-col px-4 w-full mb-8">
        {/* Barra de progreso */}
        {renderProgressBar(currentOrder.status)}

        {/* Estado actual */}
        <p
          className={` font-primary  font-light text-xs text-left mb-4 ${config.color}`}
        >
          {config.label}
        </p>

        {/* Información del pedido */}
        <div className="flex flex-col gap-1 mb-4">
          {/* Dirección */}
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6"
            >
              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
            </svg>
            <p className=" font-primary  font-light text-xs text-gray-400 ">
              {isDelivery
                ? currentOrder.fulfillment?.address || "Dirección no disponible"
                : `Retiro en ${clientData?.name || "el local"}`}
            </p>
          </div>

          {/* Total */}
          <div className="flex items-center gap-2">
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
            <p className=" font-primary  font-light text-xs text-gray-400 ">
              {currencyFormat(total)}
            </p>
          </div>

          {/* Método de pago */}
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6"
            >
              <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
              <path
                fillRule="evenodd"
                d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
                clipRule="evenodd"
              />
            </svg>
            <p className=" font-primary  font-light text-xs text-gray-400 ">
              {currentOrder.payment?.method === "online"
                ? "Virtual"
                : currentOrder.payment?.method === "cash"
                ? "Efectivo"
                : "Ambos"}
              {" - "}
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-row gap-1">
          {/* Pagar virtualmente */}
          {!isPaid && (
            <button
              onClick={() =>
                handlePaymentClick(total, currentOrder.customer?.phone)
              }
              className="text-blue-700 bg-gray-300 text-sm  font-primary  h-10 px-4 rounded-full font-medium"
            >
              Pagar virtualmente
            </button>
          )}

          {/* Contactar soporte */}
          <button
            onClick={handleSupportClick}
            className=" bg-gray-300  font-primary  text-sm h-10 px-4 rounded-full font-medium"
          >
            Soporte
          </button>

          {/* Cancelar pedido */}
          {canCancel && (
            <button
              onClick={() => {
                setSelectedOrderId(currentOrder.id);
                setIsCancelModalOpen(true);
              }}
              className="bg-gray-300 text-red-600  font-primary  h-12 rounded-full font-bold"
            >
              Cancelar pedido
            </button>
          )}
        </div>
      </div>
    );
  };

  const displayOrders = orderId ? (order ? [order] : []) : orders;

  console.log(clientConfig);

  return (
    <div
      ref={containerRef}
      className="bg-gray-150 relative flex justify-between flex-col min-h-screen"
    >
      <StickerCanvas
        containerWidth={containerSize.width}
        containerHeight={containerSize.height}
      />

      <div className="justify-center my-auto items-center flex flex-col">
        {/* Logo */}
        <div className="flex items-center flex-col pt-16">
          <img src={clientAssets?.logo} className="w-2/3" alt="Logo" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center mt-8 px-8">
            <LoadingPoints color="text-gray-900" />
            <p className="font-light text-gray-400 text-center  font-primary  text-xs mt-4">
              Buscando tus pedidos...
            </p>
          </div>
        )}

        {/* Mensajes */}
        {error && (
          <div className="mt-4 text-red-500  font-primary  text-xs font-light text-center px-4">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 text-green-500  font-primary  text-xs font-light text-center px-4">
            {message}
          </div>
        )}

        {/* Pedidos */}
        {!loading && displayOrders.length > 0 && (
          <div className="flex flex-col w-full mt-8 space-y-6">
            {displayOrders.map((currentOrder, index) => (
              <div key={currentOrder.id}>
                {displayOrders.length > 1 && (
                  <h2 className="text-2xl px-4 font-bold  font-primary  mb-4">
                    Pedido {index + 1}
                  </h2>
                )}
                {renderOrder(currentOrder)}
                {index < displayOrders.length - 1 && (
                  <div className="w-full h-px bg-gray-300 my-6" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sin pedidos */}
        {!loading && displayOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-8 px-8">
            <p className="font-light text-gray-400 text-center  font-primary  text-xs">
              No se encontraron pedidos activos.
            </p>
          </div>
        )}
      </div>

      {/* Modal de cancelación */}
      <SimpleModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedOrderId(null);
        }}
        title="Cancelar pedido"
        message="¿Estás seguro de que querés cancelar este pedido?"
        twoButtons={true}
        cancelText="No, volver"
        confirmText="Sí, cancelar"
        onConfirm={handleCancelOrder}
      />
    </div>
  );
};

export default Pedido;
