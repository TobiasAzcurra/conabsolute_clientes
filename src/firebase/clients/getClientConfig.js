import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../config/firebaseConfig';

const db = getFirestore(app);

export const getClientConfig = async (empresa, sucursal) => {
  const configPaths = ['labels', 'logistics'];

  const promises = configPaths.map(async (subdoc) => {
    const ref = doc(
      db,
      'absoluteClientes',
      empresa,
      'sucursales',
      sucursal,
      'config',
      subdoc
    );
    const snapshot = await getDoc(ref);
    return { [subdoc]: snapshot.exists() ? snapshot.data() : null };
  });

  const results = await Promise.all(promises);

  const combinedConfig = results.reduce((acc, item) => {
    return { ...acc, ...item };
  }, {});

  return combinedConfig;
};
