import { getFirestore, collection, getDocs } from 'firebase/firestore';

export const getCategoriesByClient = async (slug) => {
  const db = getFirestore();
  const categoriesRef = collection(db, `absoluteClientes/${slug}/categories`);

  try {
    const snapshot = await getDocs(categoriesRef);
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return categories;
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    throw error;
  }
};
