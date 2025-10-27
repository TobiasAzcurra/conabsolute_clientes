// firebase/products/getProducts.js
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { app } from "../config";

const db = getFirestore(app);

/**
 * Obtiene productos con filtros opcionales
 * @param {string} empresa - ID de la empresa
 * @param {string} sucursal - ID de la sucursal
 * @param {Object} options - Opciones de filtrado
 * @param {boolean} options.includeInactive - Incluir productos inactivos (default: false)
 * @param {string} options.categoryId - Filtrar por categoría específica
 * @param {string} options.productId - Obtener UN producto específico por ID
 * @returns {Promise<Array|Object|null>} - Array de productos, un producto, o null
 */
export const getProducts = async (empresa, sucursal, options = {}) => {
  const {
    includeInactive = false,
    categoryId = null,
    productId = null,
  } = options;

  // ========================================
  // CASO 1: Obtener UN producto específico
  // ========================================
  if (productId) {
    try {
      const productRef = doc(
        db,
        "absoluteClientes",
        empresa,
        "sucursales",
        sucursal,
        "productos",
        productId
      );

      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        console.warn(`❌ Producto ${productId} no encontrado`);
        return null;
      }

      const data = productDoc.data();

      // Aplicar filtro de activos
      if (!includeInactive && data.active === false) {
        console.warn(`⚠️ Producto ${productId} está inactivo`);
        return null;
      }

      let categoryIdResolved = null;

      // Resolver categoría
      try {
        if (data.category) {
          if (typeof data.category === "string") {
            categoryIdResolved = data.category;
          } else if (data.category.path) {
            const categoryRef = doc(db, data.category.path);
            const catDoc = await getDoc(categoryRef);
            if (catDoc.exists()) {
              categoryIdResolved = catDoc.id;
            }
          }
        }
      } catch (e) {
        console.warn("⚠️ Error al obtener categoría:", e);
      }

      return {
        id: productDoc.id,
        ...data,
        categoryId: categoryIdResolved,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error(`❌ Error obteniendo producto ${productId}:`, error);
      return null;
    }
  }

  // ========================================
  // CASO 2: Obtener múltiples productos
  // ========================================
  const ref = collection(
    db,
    "absoluteClientes",
    empresa,
    "sucursales",
    sucursal,
    "productos"
  );

  let q = ref;

  // Filtro de productos activos (en Firebase - más eficiente)
  if (!includeInactive) {
    q = query(q, where("active", "==", true));
  }

  // Filtro por categoría (en Firebase)
  if (categoryId) {
    q = query(q, where("category", "==", categoryId));
  }

  const snapshot = await getDocs(q);

  const productos = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let categoryIdResolved = null;

      try {
        if (data.category) {
          if (typeof data.category === "string") {
            categoryIdResolved = data.category;
          } else if (data.category.path) {
            const categoryRef = doc(db, data.category.path);
            const catDoc = await getDoc(categoryRef);
            if (catDoc.exists()) {
              categoryIdResolved = catDoc.id;
            }
          }
        }
      } catch (e) {
        console.warn("⚠️ Error al obtener categoría:", e);
      }

      return {
        id: docSnap.id,
        ...data,
        categoryId: categoryIdResolved,
      };
    })
  );

  console.log(`✅ ${productos.length} productos obtenidos`);
  return productos;
};
