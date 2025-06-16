import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export const getProductsByCategory = async (slug, categoryId) => {
  const db = getFirestore();
  const ref = collection(db, 'absoluteClientes', slug, 'productos');
  const q = query(ref, where('category', '==', categoryId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
