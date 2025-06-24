import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { app } from '../config/firebaseConfig';

const db = getFirestore(app);

export const getProductsByCategory = async (empresa, sucursal, categoryId) => {
  const ref = collection(
    db,
    'absoluteClientes',
    empresa,
    'sucursales',
    sucursal,
    'productos'
  );

  const q = query(ref, where('category', '==', categoryId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getProductsByCategoryPosition = async (empresa, sucursal) => {
  const categoriesRef = collection(
    db,
    'absoluteClientes',
    empresa,
    'sucursales',
    sucursal,
    'categories'
  );

  const categoriesSnapshot = await getDocs(categoriesRef);

  const orderedCategories = categoriesSnapshot.docs
    .filter((doc) => doc.data().position !== undefined)
    .sort((a, b) => a.data().position - b.data().position);

  const categoryOrder = orderedCategories.map((doc) => doc.id);

  if (categoryOrder.length === 0) return [];

  const productsRef = collection(
    db,
    'absoluteClientes',
    empresa,
    'sucursales',
    sucursal,
    'productos'
  );

  const batches = [];
  let remaining = [...categoryOrder];

  while (remaining.length) {
    const batch = remaining.splice(0, 10); // Firestore limita `in` a 10
    const q = query(productsRef, where('category', 'in', batch));
    batches.push(getDocs(q));
  }

  const allProducts = (await Promise.all(batches)).flatMap((snap) =>
    snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  );

  const sortedProducts = categoryOrder.flatMap((categoryId) =>
    allProducts.filter((prod) => prod.category === categoryId)
  );

  return sortedProducts;
};
