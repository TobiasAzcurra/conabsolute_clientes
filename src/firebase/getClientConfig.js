import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from './config';

const db = getFirestore(app);

export const getClientConfig = async (empresa, sucursal) => {
  const ref = doc(
    db,
    'absoluteClientes',
    empresa,
    'sucursales',
    sucursal,
    'config'
  );
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
};

export const getClientData = async (slug) => {
  const ref = doc(db, 'absoluteClientes', slug);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
};

export const getClientAssets = async (empresa, sucursal) => {
  const ref = doc(
    db,
    'absoluteClientes',
    empresa,
    'sucursales',
    sucursal,
    'config',
    'assets'
  );
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
};
