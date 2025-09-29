import {
  getFirestore,
  collection,
  doc,
  runTransaction,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { app } from "../config";
import { v4 as uuidv4 } from "uuid";
import { cleanPhoneNumber } from "../utils/phoneUtils";

const db = getFirestore(app);

export const UploadOrder = async (empresaId, sucursalId, orderDetail) => {
  const pedidoId = uuidv4();
  const pedidosCollectionRef = collection(
    db,
    "absoluteClientes",
    empresaId,
    "sucursales",
    sucursalId,
    "pedidos"
  );
  const pedidoDocRef = doc(pedidosCollectionRef, pedidoId);
  try {
    await setDoc(pedidoDocRef, {
      ...orderDetail,
      id: pedidoId,
      createdAt: serverTimestamp(),
      enCamino: false,
    });
    console.log("✅ Pedido subido exitosamente con ID:", pedidoId);
    return pedidoId;
  } catch (error) {
    console.error("❌ Error al subir el pedido:", error);
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
        const data = doc.data();
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
    })
  );
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
    })
  );
  return fetchedData.flat();
};

export const addTelefonoCliente = async (
  empresaId,
  sucursalId,
  phoneNumber,
  fecha
) => {
  const cleanPhone = cleanPhoneNumber(phoneNumber);

  const clienteDocRef = doc(
    db,
    "absoluteClientes",
    empresaId,
    "sucursales",
    sucursalId,
    "clientes",
    cleanPhone
  );

  try {
    const docSnap = await getDocs(
      query(
        collection(
          db,
          "absoluteClientes",
          empresaId,
          "sucursales",
          sucursalId,
          "clientes"
        ),
        where("telefono", "==", cleanPhone)
      )
    );

    if (!docSnap.empty) {
      await updateDoc(clienteDocRef, {
        lastOrder: fecha,
      });
      console.log(
        `📲 Cliente ${cleanPhone} actualizado con lastOrder: ${fecha}`
      );
    } else {
      await setDoc(clienteDocRef, {
        telefono: cleanPhone,
        lastOrder: fecha,
      });
      console.log(`✅ Cliente ${cleanPhone} creado en Firebase`);
    }
  } catch (error) {
    console.error("❌ Error al agregar o actualizar cliente:", error);
  }
};
