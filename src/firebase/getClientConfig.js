import { getFirestore, doc, getDoc } from 'firebase/firestore';

export const getClientConfig = async (slug) => {
  const firestore = getFirestore();
  const docRef = doc(firestore, 'absoluteClientes', slug);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return data.config || null;
};
