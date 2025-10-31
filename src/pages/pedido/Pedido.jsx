import { useState, useEffect } from "react";
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

const db = getFirestore(app);

const Pedido = () => {
  const { clientPhone } = useParams();
  const { empresaId, sucursalId } = useClient();

  // Estados
  const [recentOrder, setRecentOrder] = useState(null);
  const [olderOrders, setOlderOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    // Query para el pedido más reciente
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

  // Función para cargar más pedidos
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

        // Si recibimos menos de 10 documentos, no hay más
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

  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    const statusMap = {
      Pending: "Pendiente de confirmación",
      Confirmed: "Confirmado - En preparación",
      Ready: "Listo para retirar/entregar",
      Delivered: "En camino",
      Client: "Entregado",
      CanceledByCustomer: "Cancelado por el cliente",
      CanceledByEnterprise: "Cancelado por el negocio",
    };
    return statusMap[status] || status;
  };

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    const colorMap = {
      Pending: "text-yellow-600 bg-yellow-50",
      Confirmed: "text-blue-600 bg-blue-50",
      Ready: "text-green-600 bg-green-50",
      Delivered: "text-purple-600 bg-purple-50",
      Client: "text-gray-600 bg-gray-50",
      CanceledByCustomer: "text-red-600 bg-red-50",
      CanceledByEnterprise: "text-red-600 bg-red-50",
    };
    return colorMap[status] || "text-gray-600 bg-gray-50";
  };

  // Función para obtener el ícono del estado
  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return "⏳";
      case "Confirmed":
        return "✅";
      case "Ready":
        return "📦";
      case "Delivered":
        return "🚚";
      case "Client":
        return "✔️";
      case "CanceledByCustomer":
      case "CanceledByEnterprise":
        return "❌";
      default:
        return "📋";
    }
  };

  // Función para renderizar un pedido
  const renderOrder = (order, index) => (
    <div key={order.id} className="mb-8 pb-8 border-b last:border-b-0">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold">ID:</p>
            <p className="text-sm text-gray-600">#{order.id.slice(-6)}</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(
              order.status
            )}`}
          >
            <span>{getStatusIcon(order.status)}</span>
            <span>{getStatusText(order.status)}</span>
          </div>
        </div>

        <div>
          <p className="font-semibold">Fecha:</p>
          <p className="text-sm text-gray-600">
            {order.timestamps?.createdAt?.toDate?.()?.toLocaleString() ||
              "No disponible"}
          </p>
        </div>

        <div>
          <p className="font-semibold">Método:</p>
          <p>
            {order.fulfillment?.method === "delivery"
              ? "🚚 Delivery"
              : "🏪 Retiro en local"}
          </p>
          {order.fulfillment?.address && (
            <p className="text-sm text-gray-600 mt-1">
              {order.fulfillment.address}
            </p>
          )}
        </div>

        <div>
          <p className="font-semibold">Items:</p>
          {order.items?.map((item, idx) => (
            <div key={idx} className="ml-4 text-sm mt-1">
              <p>
                {item.quantity}x {item.productName}
              </p>
              <p className="text-gray-600">
                ${item.financeSummary?.totalPrice}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <div>
            <p className="font-semibold">Total:</p>
            <p className="text-xl font-bold">
              ${order.payment?.financeSummary?.total}
            </p>
          </div>
          <div>
            <p className="font-semibold">Pago:</p>
            <p>
              {order.payment?.method === "cash" ? "💵 Efectivo" : "💳 Virtual"}
            </p>
          </div>
        </div>

        {order.orderNotes && (
          <div className="mt-2 p-3 bg-gray-100 rounded-lg">
            <p className="font-semibold text-sm">Notas:</p>
            <p className="text-sm text-gray-600 mt-1">{order.orderNotes}</p>
          </div>
        )}
      </div>
    </div>
  );

  // Estados de carga y error
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Cargando pedidos...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!recentOrder && olderOrders.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p className="text-lg">No se encontraron pedidos para este número</p>
      </div>
    );
  }

  // Render principal
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {olderOrders.length === 0
          ? "Tu pedido"
          : `Tus pedidos (${olderOrders.length + 1})`}
      </h1>

      {/* Pedido más reciente */}
      {recentOrder && (
        <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🆕</span>
            Pedido más reciente
          </h2>
          {renderOrder(recentOrder, 0)}
        </div>
      )}

      {/* Pedidos anteriores */}
      {olderOrders.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Pedidos anteriores</h2>
          {olderOrders.map((order, index) => renderOrder(order, index + 1))}
        </div>
      )}

      {/* Botón ver más */}
      {hasMore && !loadingMore && (
        <button
          onClick={loadMoreOrders}
          className="w-full mt-6 py-3 px-4 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 font-medium"
        >
          {olderOrders.length === 0 ? "Ver más pedidos" : "Cargar más pedidos"}
        </button>
      )}

      {/* Loading más pedidos */}
      {loadingMore && (
        <div className="text-center mt-6 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <p className="mt-2">Cargando más pedidos...</p>
        </div>
      )}

      {/* No hay más pedidos */}
      {!hasMore && olderOrders.length > 0 && (
        <div className="text-center mt-6 text-gray-500">
          <p>No hay más pedidos</p>
        </div>
      )}
    </div>
  );
};

export default Pedido;
