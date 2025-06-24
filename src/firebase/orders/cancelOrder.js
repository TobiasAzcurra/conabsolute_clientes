import {
  getFirestore,
  doc,
  runTransaction,
  getDocs,
  collection,
} from 'firebase/firestore';
import { obtenerFechaActual } from '../utils/dateHelpers';
import { useClient } from '../../contexts/ClientContext';

export const cancelOrder = async (orderId) => {
  const { slugEmpresa, slugSucursal } = useClient();
  const firestore = getFirestore();
  const todayDateString = obtenerFechaActual();
  const [day, month, year] = todayDateString.split('/');

  // Referencia al documento del día actual bajo la empresa y sucursal
  const ordersDocRef = doc(
    firestore,
    'absoluteClientes',
    slugEmpresa,
    'sucursales',
    slugSucursal,
    'pedidos',
    year,
    month,
    day
  );

  // console.log(`🚫 Iniciando cancelación del pedido ID ${orderId} en la fecha ${day}/${month}/${year}`);

  try {
    await runTransaction(firestore, async (transaction) => {
      // 1. Obtener el documento actual de pedidos
      const docSnapshot = await transaction.get(ordersDocRef);
      if (!docSnapshot.exists()) {
        throw new Error('No existen pedidos para el día actual.');
      }

      const pedidosDelDia = docSnapshot.data()?.pedidos || [];
      const pedidoIndex = pedidosDelDia.findIndex(
        (pedido) => pedido.id === orderId
      );

      if (pedidoIndex === -1) {
        throw new Error('Pedido no encontrado en los pedidos del día.');
      }

      const pedido = pedidosDelDia[pedidoIndex];
      const couponCodes = pedido.couponCodes || [];

      // 2. Procesar los cupones si existen
      if (couponCodes.length > 0) {
        // console.log("📝 Procesando cupones del pedido:", couponCodes);

        // Obtener todos los documentos de vouchers una sola vez
        const vouchersSnapshot = await getDocs(
          collection(firestore, 'vouchers')
        );
        const vouchersMap = new Map();

        // Crear un mapa de documentos y sus actualizaciones
        for (const voucherDoc of vouchersSnapshot.docs) {
          const voucherData = voucherDoc.data();
          const codigosActualizados = [...voucherData.codigos];
          let requiresUpdate = false;

          // Procesar todos los cupones para este documento
          for (const codigo of couponCodes) {
            const codigoIndex = codigosActualizados.findIndex(
              (c) => c.codigo === codigo
            );
            if (codigoIndex !== -1) {
              // console.log(`🔄 Actualizando estado del cupón ${codigo} a disponible`);
              codigosActualizados[codigoIndex] = {
                ...codigosActualizados[codigoIndex],
                estado: 'disponible',
              };
              requiresUpdate = true;
            }
          }

          // Solo agregar al mapa si hay cambios
          if (requiresUpdate) {
            vouchersMap.set(voucherDoc.ref, codigosActualizados);
          }
        }

        // Realizar todas las actualizaciones de vouchers en la misma transacción
        for (const [voucherRef, updatedCodigos] of vouchersMap.entries()) {
          transaction.update(voucherRef, { codigos: updatedCodigos });
          // console.log(`✅ Actualizando documento de vouchers con ${updatedCodigos.length} códigos`);
        }
      }

      // 3. Actualizar el estado del pedido
      const now = new Date();
      const cancelTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      const pedidosActualizados = [...pedidosDelDia];
      pedidosActualizados[pedidoIndex] = {
        ...pedidosActualizados[pedidoIndex],
        canceled: cancelTime,
      };

      // 4. Actualizar el documento de pedidos en la misma transacción
      transaction.update(ordersDocRef, {
        pedidos: pedidosActualizados,
      });

      // console.log(`✅ Pedido ID ${orderId} marcado como cancelado a las ${cancelTime}`);
      if (couponCodes.length > 0) {
        // console.log(`✅ ${couponCodes.length} cupones restaurados a estado disponible:`, couponCodes);
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Error al cancelar el pedido:', error);
    throw error;
  }
};
