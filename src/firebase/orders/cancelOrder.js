import {
  getFirestore,
  doc,
  runTransaction,
  getDocs,
  collection,
} from "firebase/firestore";
import { app } from "../config";

export const cancelOrder = async (empresaId, sucursalId, orderId) => {
  const firestore = getFirestore(app);
  const pedidoDocRef = doc(
    firestore,
    "absoluteClientes",
    empresaId,
    "sucursales",
    sucursalId,
    "pedidos",
    orderId
  );

  try {
    await runTransaction(firestore, async (transaction) => {
      const docSnapshot = await transaction.get(pedidoDocRef);
      if (!docSnapshot.exists()) {
        throw new Error("El pedido no existe.");
      }
      const pedido = docSnapshot.data();
      const couponCodes = pedido.couponCodes || [];

      if (couponCodes.length > 0) {
        const vouchersSnapshot = await getDocs(
          collection(firestore, "vouchers")
        );
        const vouchersMap = new Map();
        for (const voucherDoc of vouchersSnapshot.docs) {
          const voucherData = voucherDoc.data();
          const codigosActualizados = [...voucherData.codigos];
          let requiresUpdate = false;
          for (const codigo of couponCodes) {
            const codigoIndex = codigosActualizados.findIndex(
              (c) => c.codigo === codigo
            );
            if (codigoIndex !== -1) {
              codigosActualizados[codigoIndex] = {
                ...codigosActualizados[codigoIndex],
                estado: "disponible",
              };
              requiresUpdate = true;
            }
          }
          if (requiresUpdate) {
            vouchersMap.set(voucherDoc.ref, codigosActualizados);
          }
        }
        for (const [voucherRef, updatedCodigos] of vouchersMap.entries()) {
          transaction.update(voucherRef, { codigos: updatedCodigos });
        }
      }

      const now = new Date();
      const cancelTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      transaction.update(pedidoDocRef, {
        canceled: cancelTime,
      });
    });
    return true;
  } catch (error) {
    console.error("[cancelOrder] ❌ Error al cancelar el pedido:", error);
    throw error;
  }
};
