export const searchOrdersByPhone = async (phoneNumber) => {
  const firestore = getFirestore();
  const orders = [];

  // console.log('🔍 Iniciando búsqueda para el teléfono:', phoneNumber);

  try {
    const datePaths = generateDatePaths(3);
    // console.log(`📅 Buscando en ${datePaths.length} días`);

    // Query each date path
    for (const { path, formattedDate } of datePaths) {
      const pedidosRef = doc(firestore, path);
      // console.log(`📄 Consultando: ${path}`);

      const pedidosDoc = await getDoc(pedidosRef);

      if (pedidosDoc.exists()) {
        const dayData = pedidosDoc.data();

        if (dayData.pedidos && Array.isArray(dayData.pedidos)) {
          const matchingOrders = dayData.pedidos.filter(
            (pedido) => pedido.telefono === phoneNumber
          );

          // Add matched orders with their dates
          matchingOrders.forEach((order) => {
            orders.push({
              ...order,
              fecha: formattedDate,
            });
          });

          if (matchingOrders.length > 0) {
            // console.log(`✅ Encontrados ${matchingOrders.length} pedidos en ${formattedDate}`);
          }
        }
      }
    }

    // console.log('\n📊 Resumen de búsqueda:');
    // console.log(`🔍 Total de pedidos encontrados: ${orders.length}`);

    // Sort orders by date (most recent first)
    const sortedOrders = orders.sort((a, b) => {
      const [diaA, mesA, anioA] = a.fecha.split('/');
      const [diaB, mesB, anioB] = b.fecha.split('/');
      const fechaA = new Date(anioA, mesA - 1, diaA);
      const fechaB = new Date(anioB, mesB - 1, diaB);
      return fechaB - fechaA;
    });

    // Log found orders
    // console.log('✅ Pedidos encontrados:');
    sortedOrders.forEach((order) => {
      // console.log(`📝 Pedido ${order.id} - Fecha: ${order.fecha} - Total: $${order.total}`);
    });

    return sortedOrders;
  } catch (error) {
    console.error('❌ Error buscando pedidos:', error);
    throw error;
  }
};
