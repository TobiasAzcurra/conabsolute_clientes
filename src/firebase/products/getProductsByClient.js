import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { app } from "../config";

const db = getFirestore(app);

export const getProductsByClient = async (empresa, sucursal) => {
  const ref = collection(
    db,
    "absoluteClientes",
    empresa,
    "sucursales",
    sucursal,
    "productos"
  );
  const snapshot = await getDocs(ref);

  const productos = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();

      // ✅ Filtrar productos inactivos
      if (data.active === false) {
        return null;
      }

      let categoryId = null;

      try {
        if (data.category) {
          if (typeof data.category === "string") {
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
        console.warn("⚠️ Error al obtener categoría:", e);
      }

      return {
        id: docSnap.id,
        ...data,
        categoryId,
      };
    })
  );

  // ✅ Filtrar los null (productos inactivos)
  const productosActivos = productos.filter((prod) => prod !== null);

  const porCategoria = productosActivos.reduce((acc, prod) => {
    const key = prod.categoryId || "sin-categoria";
    if (!acc[key]) acc[key] = [];

    const alreadyExists = acc[key].some((p) => p.id === prod.id);
    if (!alreadyExists) {
      acc[key].push(prod);
    }

    return acc;
  }, {});

  console.log("🔍 Categorías obtenidas:", Object.keys(porCategoria));
  console.log(
    `✅ Productos activos: ${productosActivos.length}/${productos.length}`
  );

  return {
    todos: productosActivos,
    porCategoria,
  };
};
