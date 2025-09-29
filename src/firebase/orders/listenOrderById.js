import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { app } from "../config";

const db = getFirestore(app);

export const listenOrderById = (empresaId, sucursalId, orderId, callback) => {
  const pedidoDocRef = doc(
    db,
    "absoluteClientes",
    empresaId,
    "sucursales",
    sucursalId,
    "pedidos",
    orderId
  );

  return onSnapshot(
    pedidoDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback(docSnapshot.data());
      } else {
        console.warn(`⚠️ Pedido con ID ${orderId} no encontrado.`);
        callback(null);
      }
    },
    (error) => {
      console.error("❌ Error al escuchar el pedido:", error);
    }
  );
};
