import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getFirestore,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { app } from "../../firebase/config";
import { useClient } from "../../contexts/ClientContext";
import StickerCanvas from "../../components/StickerCanvas";
import LoadingPoints from "../../components/LoadingPoints";
import currencyFormat from "../../helpers/currencyFormat";

const db = getFirestore(app);

const Pedido = () => {
  const { clientPhone } = useParams();
  const { empresaId, sucursalId, clientConfig, clientData, clientAssets } =
    useClient();

  // Estados (manteniendo los originales)
  const [recentOrder, setRecentOrder] = useState(null);
  const [olderOrders, setOlderOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  // Mapeo de estados a UI (replicado del original)
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
    Delivered: { label: "En camino...", color: "text-gray-600", barSteps: 4 },
    Client: { label: "Entregado", color: "text-gray-600", barSteps: 4 },
    CanceledByCustomer: {
      label: "Cancelado por el cliente",
      color: "text-red-600",
      barSteps: 0,
    },
    CanceledByEnterprise: {
      label: "Cancelado por el negocio",
      color: "text-red-600",
      barSteps: 0,
    },
  };

  // Handlers (sin cleanPhoneNumber)
  const handleSupportClick = () => {
    const phone = clientConfig?.logistics?.phone || "";
    const msg = "Hola! Necesito ayuda con mi pedido.";
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      msg
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePaymentClick = (orderTotal, orderPhone) => {
    const phone = clientConfig?.logistics?.phone || "+5493585168971";
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

  // Efecto para medir contenedor
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

  // Cargar el pedido más reciente
  useEffect(() => {
    if (!clientPhone || !empresaId || !sucursalId) {
      setLoading(false);
      setError("Faltan parámetros necesarios");
      return;
    }

    const ordersRef = collection(
      db,
      "absoluteClientes",
      empresaId,
      "sucursales",
      sucursalId,
      "pedidos"
    );

    const recentQuery = query(
      ordersRef,
      where("customer.phone", "==", clientPhone),
      orderBy("timestamps.createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      recentQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const orderData = { id: doc.id, ...doc.data() };
          setRecentOrder(orderData);
          setLastDoc(doc);
          setHasMore(true);
        } else {
          setRecentOrder(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar pedido:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clientPhone, empresaId, sucursalId]);

  // Función para cargar más pedidos (sin cambios)
  const loadMoreOrders = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);

    try {
      const ordersRef = collection(
        db,
        "absoluteClientes",
        empresaId,
        "sucursales",
        sucursalId,
        "pedidos"
      );

      const moreQuery = query(
        ordersRef,
        where("customer.phone", "==", clientPhone),
        orderBy("timestamps.createdAt", "desc"),
        startAfter(lastDoc),
        limit(10)
      );

      const snapshot = await getDocs(moreQuery);

      if (!snapshot.empty) {
        const newOrders = [];
        let lastDocument = null;

        snapshot.forEach((doc) => {
          const orderData = { id: doc.id, ...doc.data() };
          newOrders.push(orderData);
          lastDocument = doc;
        });

        setOlderOrders([...olderOrders, ...newOrders]);
        setLastDoc(lastDocument);
        setHasMore(snapshot.docs.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error cargando más pedidos:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Barra de progreso (replicada)
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

  // Render de un pedido (UI replicada)
  const renderOrder = (currentOrder, index) => {
    const config = statusConfig[currentOrder.status] || statusConfig.Pending;
    const isDelivery = currentOrder.fulfillment?.method === "delivery";
    const total = currentOrder.payment?.financeSummary?.total || 0;
    const isPaid = currentOrder.payment?.status === "completed";

    return (
      <div className="flex  flex-col px-4 w-full ">
        {/* Título si hay más de un pedido */}
        {olderOrders.length >= 1 && (
          <h2 className="text-2xl px-4 font-bold font-primary mb-4">
            Pedido {index + 1}
          </h2>
        )}

        {/* Barra de progreso */}
        {renderProgressBar(currentOrder.status)}

        {/* Estado actual */}
        <p
          className={`font-primary font-light text-xs text-left mb-4 ${config.color}`}
        >
          {config.label}
        </p>

        {/* Información del pedido */}
        <div className="flex flex-col gap-1 mb-4">
          {/* Teléfono */}
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6"
            >
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-primary font-light text-xs text-gray-400">
              {currentOrder.customer?.phone || "Teléfono no disponible"}
            </p>
          </div>

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
            <p className="font-primary font-light text-xs text-gray-400">
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
                d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.4a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
                clipRule="evenodd"
              />
              <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
            </svg>
            <p className="font-primary font-light text-xs text-gray-400">
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
            <p className="font-primary font-light text-xs text-gray-400">
              {currentOrder.payment?.method === "online"
                ? "Virtual"
                : currentOrder.payment?.method === "cash"
                ? "Efectivo"
                : "Ambos"}{" "}
              -
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-row gap-1">
          {!isPaid && (
            <button
              onClick={() =>
                handlePaymentClick(total, currentOrder.customer?.phone)
              }
              className="text-blue-700 bg-gray-300 text-sm font-primary h-10 px-4 rounded-full font-medium"
            >
              Pagar virtualmente
            </button>
          )}
          <button
            onClick={handleSupportClick}
            className="bg-gray-300 font-primary text-sm h-10 px-4 rounded-full font-medium"
          >
            Soporte
          </button>
        </div>
      </div>
    );
  };

  // Render principal
  return (
    <div
      ref={containerRef}
      className="bg-gray-150 relative flex justify-between flex-col min-h-screen"
    >
      <StickerCanvas
        containerWidth={containerSize.width}
        containerHeight={containerSize.height}
      />

      <div className="justify-center my-auto pb-8 items-center flex flex-col">
        {/* Logo */}
        <div className="flex items-center flex-col pt-16">
          <img src={clientAssets?.logo} className="w-2/3" alt="Logo" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center mt-8 px-8">
            <LoadingPoints color="text-gray-900" />
            <p className="font-light text-gray-400 text-center font-primary text-xs mt-4">
              Buscando tus pedidos...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 text-red-500 font-primary text-xs font-light text-center px-4">
            {error}
          </div>
        )}

        {/* Pedidos */}
        {!loading && (recentOrder || olderOrders.length > 0) && (
          <div className="flex flex-col w-full mt-8 space-y-8">
            {/* Pedido reciente */}
            {recentOrder && renderOrder(recentOrder, 0)}

            {/* Pedidos anteriores */}
            {olderOrders.map((order, index) => renderOrder(order, index + 1))}
          </div>
        )}

        {/* Botón cargar más */}
        {hasMore && !loadingMore && (
          <div className="px-4 mt-8 w-full">
            <button
              onClick={loadMoreOrders}
              className="px-4 h-10 bg-black text-white rounded-full font-primary font-medium text-sm"
            >
              Cargar más pedidos
            </button>
          </div>
        )}

        {/* Loading más */}
        {loadingMore && (
          <div className="flex flex-col items-center justify-center mt-8 px-8">
            <LoadingPoints color="text-gray-900" />
            <p className="font-light text-gray-400 text-center font-primary text-xs mt-4">
              Cargando más pedidos...
            </p>
          </div>
        )}

        {/* Sin pedidos */}
        {!loading && !recentOrder && olderOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-8 px-8">
            <p className="font-light text-gray-400 text-center font-primary text-xs">
              No se encontraron pedidos activos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pedido;
