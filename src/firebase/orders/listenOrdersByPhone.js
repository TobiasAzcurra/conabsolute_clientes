import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { app } from '../config/firebaseConfig';

const db = getFirestore(app);

export const listenOrdersByPhone = (
  empresaId,
  sucursalId,
  phoneNumber,
  callback
) => {
  const pedidosCollectionRef = collection(
    db,
    'absoluteClientes',
    empresaId,
    'sucursales',
    sucursalId,
    'pedidos'
  );

  const pedidosQuery = query(
    pedidosCollectionRef,
    where('telefono', '==', phoneNumber)
  );
  return onSnapshot(
    pedidosQuery,
    (querySnapshot) => {
      const pedidos = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.canceled) {
          pedidos.push({ id: doc.id, ...data });
        }
      });
      callback(pedidos);
    },
    (error) => {
      console.error(
        '[listenOrdersByPhone] ❌ Error al escuchar los pedidos por teléfono:',
        error
      );
      callback([]);
    }
  );
};
