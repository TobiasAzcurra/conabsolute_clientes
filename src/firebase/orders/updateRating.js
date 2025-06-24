import {
  collection,
  doc,
  getFirestore,
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import { useClient } from '../../contexts/ClientContext';

export const updateRatingForOrder = (fechaPedido, pedidoId, rating) => {
  const firestore = getFirestore();
  const { slugEmpresa, slugSucursal } = useClient();

  return new Promise((resolve, reject) => {
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

    // console.log("🔄 updateRatingForOrder llamado con:", {
    // 	fechaPedido,
    // 	pedidoId,
    // 	rating,
    // });

    runTransaction(firestore, async (transaction) => {
      const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
      if (!pedidoDocSnapshot.exists()) {
        console.error('❌ El pedido no existe para la fecha especificada.');
        throw new Error('El pedido no existe para la fecha especificada.');
      }

      const existingData = pedidoDocSnapshot.data();
      const pedidosDelDia = existingData.pedidos || [];

      const pedidosActualizados = pedidosDelDia.map((pedido) => {
        if (pedido.id === pedidoId) {
          return {
            ...pedido,
            rating: {
              ...rating,
              comentario: rating.comentario || '',
            },
          };
        } else {
          return pedido;
        }
      });

      Transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosActualizados,
      });
      // console.log("✅ Pedido actualizado con la calificación:", pedidoId);
    })
      .then(() => {
        // console.log(
        // 	"✅ Transacción completada exitosamente para el pedido:",
        // 	pedidoId
        // );
        resolve();
      })
      .catch((error) => {
        console.error(
          '❌ Error actualizando el rating para el pedido:',
          pedidoId,
          error
        );
        reject(error);
      });
  });
};
