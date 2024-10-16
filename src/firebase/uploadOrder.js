import {
  getFirestore,
  collection,
  doc,
  runTransaction,
  getDocs,
} from "firebase/firestore";
import { obtenerFechaActual } from "../helpers/currencyFormat";
import { v4 as uuidv4 } from "uuid";

export const UploadOrder = async (orderDetail) => {
  const firestore = getFirestore();
  const pedidoId = uuidv4();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split("/");
  const pedidosCollectionRef = collection(firestore, "pedidos", anio, mes);
  const pedidoDocRef = doc(pedidosCollectionRef, dia);

  try {
    await runTransaction(firestore, async (transaction) => {
      const docSnapshot = await transaction.get(pedidoDocRef);
      const existingData = docSnapshot.exists() ? docSnapshot.data() : {};
      const pedidosDelDia = existingData.pedidos || [];
      pedidosDelDia.push({ ...orderDetail, id: pedidoId, cerca: false });
      transaction.set(pedidoDocRef, {
        ...existingData,
        pedidos: pedidosDelDia,
      });
    });
    return pedidoId;
  } catch (error) {
    console.error("Error al subir el pedido:", error);
    throw error;
  }
};

export const ReadMateriales = async () => {
  const firestore = getFirestore();

  const collections = ["materiales"];

  const fetchedData = await Promise.all(
    collections.map(async (collectionName) => {
      const collectionRef = collection(firestore, collectionName);
      const snapshot = await getDocs(collectionRef);

      return snapshot.docs.map((doc) => {
        const data = doc.data(); // Datos del documento de Firestore
        // Convertir los datos a un objeto ProductoMaterial
        const productoMaterial = {
          id: doc.id,
          nombre: data.nombre,
          categoria: data.categoria,
          costo: data.costo,
          unit: data.unit,
          unidadPorPrecio: data.unidadPorPrecio,
          stock: data.stock,
        };
        return productoMaterial;
      });
    }),
  );

  // Hacer un flatten de fetchedData y devolver los datos como un arreglo de ProductoMaterial[]
  return fetchedData.flat();
};

export const ReadData = async () => {
  const firestore = getFirestore();

  const collections = ["burgers", "drinks", "fries", "toppings"];

  const fetchedData = await Promise.all(
    collections.map(async (collectionName) => {
      const collectionRef = collection(firestore, collectionName);
      const snapshot = await getDocs(collectionRef);

      const dataWithIds = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
        collectionName: collectionName,
      }));

      return dataWithIds;
    }),
  );

  return fetchedData.flat();
};
