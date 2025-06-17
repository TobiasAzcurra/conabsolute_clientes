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

export const getProductsByCategoryPosition = async (slug) => {
  const db = getFirestore();

  const categoriesRef = collection(db, 'absoluteClientes', slug, 'categories');
  const categoriesSnapshot = await getDocs(categoriesRef);

  const orderedCategories = categoriesSnapshot.docs
    .filter((doc) => doc.data().position !== undefined)
    .sort((a, b) => a.data().position - b.data().position);

  const categoryOrder = orderedCategories.map((doc) => doc.id);

  if (categoryOrder.length === 0) return [];

  const productsRef = collection(db, 'absoluteClientes', slug, 'productos');
  const batches = [];

  let remaining = [...categoryOrder];
  while (remaining.length) {
    const batch = remaining.splice(0, 10);
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
