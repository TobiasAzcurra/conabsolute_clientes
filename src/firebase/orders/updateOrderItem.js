import {
  collection,
  doc,
  getFirestore,
  runTransaction,
} from 'firebase/firestore';
import { useClient } from '../../contexts/ClientContext';

export const updateOrderItemQuantity = async (
  pedidoId,
  fechaPedido,
  itemIndex,
  newQuantity
) => {
  const firestore = getFirestore();
  const { slugEmpresa, slugSucursal } = useClient();
  const [dia, mes, anio] = fechaPedido.split('/');
  const pedidosCollectionRef = collection(
    firestore,
    'absoluteClientes',
    slugEmpresa,
    'sucursales',
    slugSucursal,
    'pedidos',
    anio,
    mes
  );
  const pedidoDocRef = doc(pedidosCollectionRef, dia);

  try {
    await runTransaction(firestore, async (transaction) => {
      const docSnapshot = await transaction.get(pedidoDocRef);
      if (!docSnapshot.exists()) {
        throw new Error('El pedido no existe para la fecha especificada.');
      }

      const existingData = docSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];
      const pedidoIndex = pedidosDelDia.findIndex(
        (pedido) => pedido.id === pedidoId
      );

      if (pedidoIndex === -1) {
        throw new Error('Pedido no encontrado');
      }

      const pedido = pedidosDelDia[pedidoIndex];
      if (!pedido.detallePedido[itemIndex]) {
        throw new Error('Item no encontrado en el pedido');
      }

      if (newQuantity === 0) {
        // Eliminamos el item del detallePedido
        pedido.detallePedido.splice(itemIndex, 1);

        // Si no quedan items en el pedido, eliminamos el pedido completo
        if (pedido.detallePedido.length === 0) {
          pedidosDelDia.splice(pedidoIndex, 1);

          // Si no quedan pedidos en el día, eliminamos el documento del día
          if (pedidosDelDia.length === 0) {
            transaction.delete(pedidoDocRef);
            // console.log("🗑️ Documento del día eliminado por no tener pedidos");
            return;
          } else {
            transaction.set(pedidoDocRef, {
              ...existingData,
              pedidos: pedidosDelDia,
            });
          }
          // console.log("🗑️ Pedido eliminado por no tener items:", pedidoId);
          return;
        }

        // Si aún quedan items, recalculamos los totales
        pedido.subTotal = pedido.detallePedido.reduce(
          (sum, item) => sum + item.subTotal,
          0
        );
        pedido.total = pedido.subTotal + (pedido.envio || 0);
      } else {
        // Si no es 0, actualizamos la cantidad y recalculamos subtotal
        const item = pedido.detallePedido[itemIndex];
        const oldSubTotal = item.subTotal;
        const pricePerUnit = item.priceBurger;

        item.quantity = newQuantity;
        item.subTotal = pricePerUnit * newQuantity;
        item.extra = true;

        // Marcar el pedido como editado por el usuario
        pedido.onEditByUser = true;

        // Recalcular totales del pedido
        const subTotalDifference = item.subTotal - oldSubTotal;
        pedido.subTotal = (pedido.subTotal || 0) + subTotalDifference;
        pedido.total = pedido.subTotal + (pedido.envio || 0);
      }

      // Solo actualizamos si no hemos eliminado el documento
      if (pedido.detallePedido.length > 0) {
        pedidosDelDia[pedidoIndex] = pedido;
        transaction.set(pedidoDocRef, {
          ...existingData,
          pedidos: pedidosDelDia,
        });
      }
    });

    // console.log(
    // 	"✅ Cantidad actualizada exitosamente para el pedido:",
    // 	pedidoId
    // );
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar la cantidad:', error);
    throw error;
  }
};
