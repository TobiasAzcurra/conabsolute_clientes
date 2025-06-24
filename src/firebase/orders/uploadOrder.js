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
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { cleanPhoneNumber } from '../utils/phoneUtils';
import { obtenerFechaActual } from '../utils/dateHelpers';

export const UploadOrder = async (orderDetail) => {
  const firestore = getFirestore();
  const pedidoId = uuidv4();
  const fechaFormateada = obtenerFechaActual();
  const [dia, mes, anio] = fechaFormateada.split('/');
  const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
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
    // console.log("✅ Pedido subido exitosamente con ID:", pedidoId);
    return pedidoId;
  } catch (error) {
    console.error('❌ Error al subir el pedido:', error);
    throw error;
  }
};

export const ReadMateriales = async () => {
  const firestore = getFirestore();
  const collections = ['materiales'];
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
  const collections = ['burgers', 'drinks', 'fries', 'toppings'];
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

export const addTelefonoFirebase = async (phoneNumber, fecha) => {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  const firestore = getFirestore();
  const collectionRef = collection(firestore, 'telefonos');
  const q = query(collectionRef, where('telefono', '==', cleanPhone));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    try {
      const docRef = await addDoc(collectionRef, {
        telefono: cleanPhone,
        fecha: fecha,
        lastOrder: fecha,
      });
      // console.log(
      // 	`Se agregó el número de teléfono ${cleanPhone} a Firebase con el ID: ${docRef.id}. Fecha: ${fecha}`
      // );
    } catch (e) {
      console.error('Error al agregar el número de teléfono a Firebase:', e);
    }
  } else {
    querySnapshot.forEach(async (documento) => {
      try {
        const docRef = doc(firestore, 'telefonos', documento.id);
        await updateDoc(docRef, {
          lastOrder: fecha,
        });
        // console.log(
        // 	`El número de teléfono ${cleanPhone} ya existe en la base de datos. Actualizado lastOrder a: ${fecha}`
        // );
      } catch (e) {
        console.error('Error al actualizar el campo lastOrder en Firebase:', e);
      }
    });
  }
};
