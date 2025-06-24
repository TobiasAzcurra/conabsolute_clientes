import { doc, getFirestore } from 'firebase/firestore';
import { useClient } from '../../contexts/ClientContext';
import { obtenerFechaActual } from '../utils/dateHelpers';

export const ReadOrdersForTodayById = (orderId, callback) => {
  const firestore = getFirestore();
  const { slugEmpresa, slugSucursal } = useClient();
  const todayDateString = obtenerFechaActual();

  // Obtener el año, mes y día actual
  const [day, month, year] = todayDateString.split('/');

  // Referencia al documento del día actual dentro de la colección del mes actual
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

  // console.log(
  // 	`📡 Escuchando cambios en el pedido ID ${orderId} para la fecha ${day}/${month}/${year}`
  // );

  // Escuchar cambios en el documento del día actual
  return onSnapshot(
    ordersDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        // Si el documento existe, obtener el arreglo de pedidos
        const pedidosDelDia = docSnapshot.data()?.pedidos || [];

        // Filtrar los pedidos por el ID
        const pedidoFiltrado = pedidosDelDia.find(
          (pedido) => pedido.id === orderId
        );

        // Llamar a la función de devolución de llamada con el pedido filtrado, si se encuentra
        if (pedidoFiltrado) {
          // console.log("📦 Pedido actualizado recibido:", pedidoFiltrado);
          callback(pedidoFiltrado);
        } else {
          console.warn(
            `⚠️ Pedido con ID ${orderId} no encontrado en los pedidos del día.`
          );
          callback(null); // Si no se encuentra el pedido, devolver null
        }
      } else {
        // Si el documento no existe, no hay pedidos para el día actual
        console.warn(
          `⚠️ No existen pedidos para la fecha ${day}/${month}/${year}.`
        );
        callback(null); // Llamar a la función de devolución de llamada con null
      }
    },
    (error) => {
      console.error(
        '❌ Error al obtener los pedidos para el día actual:',
        error
      );
    }
  );
};
