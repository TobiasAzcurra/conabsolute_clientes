import { collection, addDoc, getFirestore } from 'firebase/firestore';
import { app } from '../config/firebaseConfig';

const db = getFirestore(app);

export const addProduct = async (empresa, sucursal, productData) => {
  const ref = collection(
    db,
    'absoluteClientes',
    empresa,
    'sucursales',
    sucursal,
    'productos'
  );

  try {
    const docRef = await addDoc(ref, productData);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error al agregar producto:', error);
    throw error;
  }
};
