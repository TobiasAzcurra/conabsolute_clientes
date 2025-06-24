export const handleConfirmChanges = async (orderId) => {
  const firestore = getFirestore();
  const fechaActual = obtenerFechaActual();
  const [dia, mes, anio] = fechaActual.split('/');
  const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
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

      // Marcar todos los productos extra como confirmados
      pedidosDelDia[pedidoIndex].detallePedido = pedidosDelDia[
        pedidoIndex
      ].detallePedido.map((item) => {
        if (item.extra && !item.isConfirmed) {
          return {
            ...item,
            isConfirmed: true,
          };
        }
        return item;
      });

      // Reset the onEditByUser flag
      pedidosDelDia[pedidoIndex].onEditByUser = false;

      // Update the document
      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosDelDia,
      });
    });

    // console.log("✅ Cambios confirmados exitosamente");
    return true;
  } catch (error) {
    console.error('❌ Error al confirmar los cambios:', error);
    throw error;
  }
};
