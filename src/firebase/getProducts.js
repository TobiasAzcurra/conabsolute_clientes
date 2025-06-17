// firebase/getProducts.js
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

const CLIENT_ID = 'e2dbff1c-e6ec-43c9-bbe4-06c0dc3eb347'; // ID del cliente "A puro mate"

// Función para obtener todos los productos del cliente
export const getProductsByClient = async () => {
  const firestore = getFirestore();

  try {
    // Referencia a la colección de productos del cliente específico
    const productosRef = collection(
      firestore,
      'absoluteClientes',
      CLIENT_ID,
      'productos'
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

    // Agrupar productos por categoría para facilitar su uso
    const productosPorCategoria = {
      mates: productos.filter(
        (p) => p.categoria === 'mates' || p.categoria === 'mate'
      ),
      termos: productos.filter(
        (p) => p.categoria === 'termos' || p.categoria === 'termo'
      ),
      bombillas: productos.filter(
        (p) => p.categoria === 'bombillas' || p.categoria === 'bombilla'
      ),
      yerbas: productos.filter(
        (p) => p.categoria === 'yerbas' || p.categoria === 'yerba'
      ),
      canastas: productos.filter(
        (p) => p.categoria === 'canastas' || p.categoria === 'canasta'
      ),
      accesorios: productos.filter(
        (p) => p.categoria === 'accesorios' || p.categoria === 'accesorio'
      ),
    };

    // Mostrar estadísticas por categoría
    Object.entries(productosPorCategoria).forEach(([categoria, items]) => {
      if (items.length > 0) {
        console.log(`📋 ${categoria.toUpperCase()}: ${items.length} productos`);
        items.forEach((item) => {
          console.log(
            `  - ${item.data?.name || 'Sin nombre'} - $${item.data?.price || 0}`
          );
        });
      }
    });

    return {
      todos: productos,
      porCategoria: productosPorCategoria,
    };
  } catch (error) {
    console.error('❌ Error al obtener productos de Firebase:', error);
    throw error;
  }
};

// Nueva funcion para obtener todsos los productos del cliente
export const getProductsByClientV2 = async (slug) => {
  const db = getFirestore();
  const productosRef = collection(db, `absoluteClientes/${slug}/productos`);
  const snapshot = await getDocs(productosRef);

  const productos = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let categoryName = null;

      try {
        if (data.category) {
          if (typeof data.category === 'string') {
            // Caso: categoría como string simple
            categoryName = data.category.toLowerCase();
          } else if (data.category.path) {
            // Caso: categoría como referencia
            const categoryRef = doc(db, data.category.path);
            const catDoc = await getDoc(categoryRef);
            if (catDoc.exists()) {
              categoryName = catDoc.data()?.name?.toLowerCase() || null;
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Error al obtener categoría:', e);
      }

      return {
        id: docSnap.id,
        ...data,
        categoryName,
      };
    })
  );

  const porCategoria = productos.reduce((acc, prod) => {
    const key = prod.categoryName || 'sin-categoria';
    if (!acc[key]) acc[key] = [];
    acc[key].push(prod);
    return acc;
  }, {});

  console.log('🔍 Productos parseados con categoría:', productos);
  console.log('🔍 Categorías obtenidas:', Object.keys(porCategoria));

  return {
    todos: productos,
    porCategoria,
  };
};

// Función para obtener un producto específico por ID
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
}

// export const getProductsByCategory = async (categoria) => {
//   try {
//     const productos = await getProductsByClient();
//     const productosFiltrados = productos.todos.filter(
//       (p) => p.categoria?.toLowerCase() === categoria.toLowerCase()
//     );
//     return productosFiltrados;
//   } catch (error) {
//     console.error(
//       `❌ Error al obtener productos de categoría ${categoria}:`,
//       error
//     );
//     throw error;
//   }
// };

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
