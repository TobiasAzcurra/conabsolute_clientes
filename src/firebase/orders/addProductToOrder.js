import { collection, doc, getFirestore } from 'firebase/firestore';
import { useClient } from '../../contexts/ClientContext';
import { obtenerFechaActual } from '../utils/dateHelpers';

export const addProductToOrder = async (orderId, product, quantity) => {
  const firestore = getFirestore();
  const { slugEmpresa, slugSucursal } = useClient();
  const fechaActual = obtenerFechaActual();
  const [dia, mes, anio] = fechaActual.split('/');
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
        (pedido) => pedido.id === orderId
      );

      if (pedidoIndex === -1) {
        throw new Error('Pedido no encontrado');
      }

      const pedido = pedidosDelDia[pedidoIndex];

      // Guardamos el total con descuento original
      const totalOriginalConDescuento = pedido.total;

      // Crear nuevo item para el pedido
      const newOrderItem = {
        burger: product.name,
        priceBurger: product.price,
        quantity: quantity,
        toppings: product.toppings || [],
        subTotal: product.price * quantity,
        costoBurger: product.costoBurger || 0,
        extra: true,
        isConfirmed: false,
      };

      // Agregar el nuevo item al detallePedido
      pedido.detallePedido.push(newOrderItem);
      pedido.onEditByUser = true;

      // Actualizar subtotal
      pedido.subTotal = pedido.subTotal + newOrderItem.subTotal;

      // El nuevo total es: total original con descuento + precio completo del nuevo producto
      pedido.total = totalOriginalConDescuento + newOrderItem.subTotal;

      // Actualizar el documento
      pedidosDelDia[pedidoIndex] = pedido;
      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosDelDia,
      });
    });

    return true;
  } catch (error) {
    console.error('❌ Error al agregar producto al pedido:', error);
    throw error;
  }
};
