export const getOrderById = async (orderId, fecha) => {
  const firestore = getFirestore();
  let day, month, year;

  if (fecha) {
    [day, month, year] = fecha.split('/');
  } else {
    console.error('❌ Fecha no proporcionada para obtener el pedido por ID.');
    return null;
  }

  const ordersDocRef = doc(firestore, 'pedidos', year, month, day);

  // console.log(
  // 	`🔍 Buscando el pedido ID ${orderId} en la fecha ${day}/${month}/${year}`
  // );

  try {
    const docSnapshot = await getDoc(ordersDocRef);
    if (docSnapshot.exists()) {
      const pedidosDelDia = docSnapshot.data()?.pedidos || [];

      // Buscar el pedido por ID
      const pedidoEncontrado = pedidosDelDia.find(
        (pedido) => pedido.id === orderId
      );

      if (pedidoEncontrado) {
        // console.log(
        // 	`✅ Pedido encontrado en ${day}/${month}/${year}:`,
        // 	pedidoEncontrado
        // );
        return pedidoEncontrado;
      } else {
        console.warn(
          `⚠️ Pedido con ID ${orderId} no encontrado en pedidos del día.`
        );
        return null;
      }
    } else {
      console.warn(
        `⚠️ No existen pedidos para la fecha ${day}/${month}/${year}.`
      );
      return null;
    }
  } catch (error) {
    console.error('❌ Error al obtener el pedido:', error);
    throw error;
  }
};
