import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../config";

const db = getFirestore(app);

/**
 * Obtiene un producto específico con datos actualizados incluyendo stock
 * @param {string} empresaId - ID de la empresa
 * @param {string} sucursalId - ID de la sucursal
 * @param {string} productId - ID del producto
 * @param {number} retries - Número de reintentos (por defecto 2)
 * @returns {Object|null} - Producto actualizado o null si no existe
 */
export const getProductById = async (
  empresaId,
  sucursalId,
  productId,
  retries = 2
) => {
  try {
    const productRef = doc(
      db,
      "absoluteClientes",
      empresaId,
      "sucursales",
      sucursalId,
      "productos",
      productId
    );

    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      console.warn(`❌ Producto ${productId} no encontrado`);
      return null;
    }

    const data = productDoc.data();
    let categoryId = null;

    // Obtener categoría si existe
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

    const result = {
      id: productDoc.id,
      ...data,
      categoryId,
      lastUpdated: Date.now(), // Timestamp de última actualización
    };

    console.log(`📦 Producto ${productId} obtenido exitosamente`);
    return result;
  } catch (error) {
    console.error(
      `❌ Error obteniendo producto (intento ${3 - retries}):`,
      error
    );

    // Retry automático con delay exponencial
    if (retries > 0) {
      const delay = Math.pow(2, 3 - retries) * 1000; // 1s, 2s, 4s
      console.log(`🔄 Reintentando en ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return getProductById(empresaId, sucursalId, productId, retries - 1);
    }

    return null;
  }
};
