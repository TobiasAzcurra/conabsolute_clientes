import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { app } from '../config/firebaseConfig';

const db = getFirestore(app);

export const getProductsByClient = async (empresa, sucursal) => {
  const ref = collection(
    db,
    'absoluteClientes',
    empresa,
    'sucursales',
    sucursal,
    'productos'
  );
  const snapshot = await getDocs(ref);

  const productos = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let categoryId = null;

      try {
        if (data.category) {
          if (typeof data.category === 'string') {
            categoryId = data.category;
          } else if (data.category.path) {
            const categoryRef = doc(db, data.category.path);
            const catDoc = await getDoc(categoryRef);
            if (catDoc.exists()) {
              categoryId = catDoc.id;
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Error al obtener categoría:', e);
      }

      return {
        id: docSnap.id,
        ...data,
        categoryId,
      };
    })
  );

  const porCategoria = productos.reduce((acc, prod) => {
    const key = prod.categoryId || 'sin-categoria';
    console.log('🧪 Agregando producto', prod.name, 'a categoría', key);
    if (!acc[key]) acc[key] = [];
    acc[key].push(prod);
    return acc;
  }, {});

  console.log('🔍 Categorías obtenidas:', Object.keys(porCategoria));

  return {
    todos: productos,
    porCategoria,
  };
};
