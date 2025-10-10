import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { app } from '../config';

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

  // CORREGIDO: Usar customer.phone en lugar de telefono
  const pedidosQuery = query(
    pedidosCollectionRef,
    where('customer.phone', '==', phoneNumber)
  );

  return onSnapshot(
    pedidosQuery,
    (querySnapshot) => {
      const pedidos = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // CORREGIDO: status !== 'Cancelled' en lugar de !data.canceled
        if (data.status !== 'Cancelled') {
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
