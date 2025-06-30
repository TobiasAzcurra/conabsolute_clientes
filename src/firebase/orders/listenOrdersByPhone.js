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
    where('telefono', '==', phoneNumber),
    where('canceled', '!=', true)
  );

  return onSnapshot(
    pedidosQuery,
    (querySnapshot) => {
      const pedidos = [];
      querySnapshot.forEach((doc) => {
        pedidos.push({ id: doc.id, ...doc.data() });
      });
      callback(pedidos);
    },
    (error) => {
      console.error('❌ Error al escuchar los pedidos por teléfono:', error);
      callback([]);
    }
  );
};
