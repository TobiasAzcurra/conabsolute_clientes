export const getProductById = async (slug, id) => {
  const db = getFirestore();
  const productoRef = doc(db, `absoluteClientes/${slug}/productos/${id}`);

  try {
    const docSnap = await getDoc(productoRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      console.warn(`⚠️ Producto con ID ${id} no encontrado.`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error al obtener producto con ID ${id}:`, error);
    throw error;
  }
};
