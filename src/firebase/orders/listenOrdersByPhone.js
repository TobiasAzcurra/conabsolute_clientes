export const ListenOrdersForTodayByPhoneNumber = (phoneNumber, callback) => {
  const firestore = getFirestore();
  const todayDateString = obtenerFechaActual();

  // Obtener el año, mes y día actual
  const [day, month, year] = todayDateString.split('/');

  // Referencia al documento del día actual dentro de la colección del mes actual
  const ordersDocRef = doc(firestore, 'pedidos', year, month, day);

  // console.log(
  // 	`📡 Escuchando pedidos para el número de teléfono ${phoneNumber} en la fecha ${day}/${month}/${year}`
  // );

  // Escuchar cambios en el documento del día actual
  return onSnapshot(
    ordersDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const pedidosDelDia = docSnapshot.data()?.pedidos || [];

        // Filtrar los pedidos por el número de teléfono
        const pedidosFiltrados = pedidosDelDia.filter(
          (pedido) => pedido.telefono === phoneNumber && !pedido.canceled
        );

        // console.log(
        // 	`📦 Pedidos filtrados para el número ${phoneNumber}:`,
        // 	pedidosFiltrados
        // );

        callback(pedidosFiltrados); // Devuelve un array de pedidos filtrados
      } else {
        // Si el documento no existe, no hay pedidos para el día actual
        console.warn(
          `⚠️ No existen pedidos para la fecha ${day}/${month}/${year}.`
        );
        callback([]); // Devuelve un array vacío
      }
    },
    (error) => {
      console.error(
        '❌ Error al escuchar los pedidos para el día actual:',
        error
      );
      callback([]); // Devuelve un array vacío en caso de error
    }
  );
};
