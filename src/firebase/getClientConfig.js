import { getFirestore, doc, getDoc } from 'firebase/firestore';

const db = getFirestore();

export const getClientIntro = async (slug) => {
  const ref = doc(db, 'absoluteClientes', slug, 'config', 'intro');
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
};
