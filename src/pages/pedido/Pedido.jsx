// pages/Pedido.jsx
import React, { useEffect, useRef, useState } from "react";
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
  doc,
  getDoc,
} from "firebase/firestore";
import { app } from "../../firebase/config";
import { useClient } from "../../contexts/ClientContext";
import StickerCanvas from "../../components/StickerCanvas";
import LoadingPoints from "../../components/LoadingPoints";
import currencyFormat from "../../helpers/currencyFormat";
import DeliveryMap from "./DeliveryMap";

const db = getFirestore(app);

const Pedido = () => {
  const { clientPhone } = useParams();
  const {
    empresaId,
    sucursalId,
    clientConfig,
    clientData,
    clientAssets,
    branchCoordinates,
    setBranchCoordinates,
  } = useClient();

  const [recentOrder, setRecentOrder] = useState(null);
  const [olderOrders, setOlderOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

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

  // Medición contenedor
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

  // Cargar pedido más reciente
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
          const docSnap = snapshot.docs[0];
          const orderData = { id: docSnap.id, ...docSnap.data() };
          setRecentOrder(orderData);
          setLastDoc(docSnap);
          setHasMore(true);
        } else {
          setRecentOrder(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error al cargar pedido:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clientPhone, empresaId, sucursalId]);

  // Cargar coordenadas de sucursal si no están en contexto
  useEffect(() => {
    const loadBranchCoords = async () => {
      try {
        if (!empresaId || !sucursalId || branchCoordinates) return;
        const sucRef = doc(
          db,
          "absoluteClientes",
          empresaId,
          "sucursales",
          sucursalId
        );
        const sucSnap = await getDoc(sucRef);
        if (sucSnap.exists()) {
          const data = sucSnap.data();
          const arr = data?.coordinates; // [lat, lng]
          if (
            Array.isArray(arr) &&
            arr.length === 2 &&
            arr.every((n) => typeof n === "number")
          ) {
            setBranchCoordinates({ lat: arr[0], lng: arr[1] });
          }
        }
      } catch (e) {
        console.error("No se pudieron cargar coordenadas de sucursal:", e);
      }
    };
    loadBranchCoords();
  }, [empresaId, sucursalId, branchCoordinates, setBranchCoordinates]);

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
        snapshot.forEach((d) => {
          newOrders.push({ id: d.id, ...d.data() });
          lastDocument = d;
        });
        setOlderOrders((prev) => [...prev, ...newOrders]);
        setLastDoc(lastDocument);
        setHasMore(snapshot.docs.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error cargando más pedidos:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderOrder = (currentOrder, index) => {
    const config = statusConfig[currentOrder.status] || statusConfig.Pending;
    const isDelivery = currentOrder.fulfillment?.method === "delivery";
    const total = currentOrder.payment?.financeSummary?.total || 0;
    const isPaid = currentOrder.payment?.status === "completed";

    // Coordenadas del cliente (si delivery)
    const clientArr = currentOrder?.fulfillment?.coordinates; // [lat, lng]
    const clientCoords =
      Array.isArray(clientArr) &&
      clientArr.length === 2 &&
      clientArr.every((n) => typeof n === "number")
        ? { lat: clientArr[0], lng: clientArr[1] }
        : null;

    return (
      <div className="flex flex-col   w-full">
        <div className="bg-gray-50 p-1 rounded-3xl shadow-lg shadow-gray-200">
          {/* 📍 Mapa (solo para el pedido más reciente) */}
          {index === 0 && (branchCoordinates || isDelivery) && (
            <div className="  flex flex-col">
              <DeliveryMap
                storeCoords={branchCoordinates || null}
                clientCoords={isDelivery ? clientCoords : null}
                method={isDelivery ? "delivery" : "takeaway"}
                status={currentOrder.status}
                logo={clientAssets?.logo}
              />
              <p className={`font-primary font-medium px-3 py-4 text-left `}>
                {config.label}
              </p>
            </div>
          )}
          {olderOrders.length >= 1 && index > 0 && (
            <h2 className=" font-medium font-primary  p-4">
              Pedido {index + 1}
            </h2>
          )}

          <div className="px-3 pb-3 ">
            {/* Información del pedido */}
            <div className="flex flex-col gap-1 ">
              {/* Dirección */}
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="h-6 text-gray-400"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg>

                <p className="font-primary font-light text-xs text-gray-400">
                  {isDelivery
                    ? currentOrder.fulfillment?.address ||
                      "Dirección no disponible"
                    : `Retiro en ${clientData?.name || "el local"}`}
                </p>
              </div>

              {/* Total */}
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="h-6 text-gray-400"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                  />
                </svg>

                <p className="font-primary font-light text-xs text-gray-400">
                  {currencyFormat(total)}
                </p>
              </div>
            </div>

            {/* Botones */}
            {index === 0 && (
              <div className="flex flex-row gap-1 mt-4">
                {!isPaid && (
                  <button
                    onClick={() =>
                      handlePaymentClick(total, currentOrder.customer?.phone)
                    }
                    className="text-gray-900 bg-gray-200 text-xs font-primary h-10 px-4 rounded-full font-light"
                  >
                    Pagar virtualmente
                  </button>
                )}
                <button
                  onClick={handleSupportClick}
                  className="bg-gray-200 font-primary text-xs h-10 px-4 rounded-full font-light"
                >
                  Soporte
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="bg-gray-100 relative flex justify-between flex-col min-h-screen"
    >
      <StickerCanvas
        containerWidth={containerSize.width}
        containerHeight={containerSize.height}
      />

      <div className="justify-center my-auto pb-4 items-center flex flex-col">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center px-8">
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
          <div className="flex flex-col p-4 w-full space-y-2">
            {/* Pedido reciente */}
            {recentOrder && renderOrder(recentOrder, 0)}

            {/* Pedidos anteriores */}
            {olderOrders.map((order, index) => renderOrder(order, index + 1))}
          </div>
        )}

        {/* Botón cargar más */}
        {hasMore && !loadingMore && (
          <div className="px-4  w-full">
            <button
              onClick={loadMoreOrders}
              className=" font-primary text-blue-500 font-light text-xs"
            >
              Ver pedidos anteriores
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
