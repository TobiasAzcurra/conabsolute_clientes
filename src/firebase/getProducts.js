// firebase/getProducts.js
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

const CLIENT_ID = "e2dbff1c-e6ec-43c9-bbe4-06c0dc3eb347"; // ID del cliente "A puro mate"

// Función para obtener todos los productos del cliente
export const getProductsByClient = async () => {
  const firestore = getFirestore();

  try {
    // Referencia a la colección de productos del cliente específico
    const productosRef = collection(
      firestore,
      "absoluteClientes",
      CLIENT_ID,
      "productos"
    );

    // Obtener todos los documentos de la colección
    const querySnapshot = await getDocs(productosRef);

    const productos = [];

    querySnapshot.forEach((doc) => {
      const productData = {
        id: doc.id,
        ...doc.data(),
      };
      productos.push(productData);
    });

    console.log("📦 Productos obtenidos de Firebase:", productos);
    console.log(`📊 Total de productos: ${productos.length}`);

    // Agrupar productos por categoría para facilitar su uso
    const productosPorCategoria = {
      mates: productos.filter(
        (p) => p.categoria === "mates" || p.categoria === "mate"
      ),
      termos: productos.filter(
        (p) => p.categoria === "termos" || p.categoria === "termo"
      ),
      bombillas: productos.filter(
        (p) => p.categoria === "bombillas" || p.categoria === "bombilla"
      ),
      yerbas: productos.filter(
        (p) => p.categoria === "yerbas" || p.categoria === "yerba"
      ),
      canastas: productos.filter(
        (p) => p.categoria === "canastas" || p.categoria === "canasta"
      ),
      accesorios: productos.filter(
        (p) => p.categoria === "accesorios" || p.categoria === "accesorio"
      ),
    };

    console.log("🗂️ Productos por categoría:", productosPorCategoria);

    // Mostrar estadísticas por categoría
    Object.entries(productosPorCategoria).forEach(([categoria, items]) => {
      if (items.length > 0) {
        console.log(`📋 ${categoria.toUpperCase()}: ${items.length} productos`);
        items.forEach((item) => {
          console.log(
            `  - ${item.data?.name || "Sin nombre"} - $${item.data?.price || 0}`
          );
        });
      }
    });

    return {
      todos: productos,
      porCategoria: productosPorCategoria,
    };
  } catch (error) {
    console.error("❌ Error al obtener productos de Firebase:", error);
    throw error;
  }
};

// Función para obtener un producto específico por ID
export const getProductById = async (productId) => {
  const firestore = getFirestore();

  try {
    const productRef = doc(
      firestore,
      "absoluteClientes",
      CLIENT_ID,
      "productos",
      productId
    );
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const productData = {
        id: productSnap.id,
        ...productSnap.data(),
      };
      console.log("🔍 Producto específico obtenido:", productData);
      return productData;
    } else {
      console.log("❌ No se encontró el producto con ID:", productId);
      return null;
    }
  } catch (error) {
    console.error("❌ Error al obtener producto específico:", error);
    throw error;
  }
};

// Función para obtener productos por categoría específica
export const getProductsByCategory = async (categoria) => {
  try {
    const productos = await getProductsByClient();
    const productosFiltrados = productos.todos.filter(
      (p) => p.categoria?.toLowerCase() === categoria.toLowerCase()
    );

    console.log(
      `🏷️ Productos de categoría "${categoria}":`,
      productosFiltrados
    );
    return productosFiltrados;
  } catch (error) {
    console.error(
      `❌ Error al obtener productos de categoría ${categoria}:`,
      error
    );
    throw error;
  }
};

// Función para verificar el stock disponible de un producto
export const getAvailableStock = (producto) => {
  if (!producto.stock || !Array.isArray(producto.stock)) {
    return 0;
  }

  return producto.stock.reduce((total, lote) => {
    return total + (lote.stockRestante || 0);
  }, 0);
};

// Función para obtener el costo promedio de un producto
export const getAverageCost = (producto) => {
  if (!producto.stock || !Array.isArray(producto.stock)) {
    return 0;
  }

  const lotesConStock = producto.stock.filter((lote) => lote.stockRestante > 0);

  if (lotesConStock.length === 0) {
    return 0;
  }

  const costoTotal = lotesConStock.reduce((total, lote) => {
    return total + lote.costoUnitario * lote.stockRestante;
  }, 0);

  const stockTotal = lotesConStock.reduce((total, lote) => {
    return total + lote.stockRestante;
  }, 0);

  return stockTotal > 0 ? costoTotal / stockTotal : 0;
};
