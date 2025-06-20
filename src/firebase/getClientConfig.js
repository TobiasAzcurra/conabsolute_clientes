import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from './config';

const db = getFirestore(app);

export const getClientIntro = async (slug) => {
  const ref = doc(db, 'absoluteClientes', slug, 'config', 'intro');
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
};

export const getClientData = async (slug) => {
  const ref = doc(db, 'absoluteClientes', slug);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
};

export const getClientAssets = async (slug) => {
  const ref = doc(
    getFirestore(app),
    'absoluteClientes',
    slug,
    'config',
    'assets'
  );
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return { reels: [], logoFooter: '' };
  const data = snapshot.data();
  console.log('getClientAssets', data);
  return data;
};
