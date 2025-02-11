import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Unsubscribe } from 'firebase/auth';

// Interfaces para tipar los datos
export interface AltaDemandaProps {
  delayMinutes: number;
  highDemandStartTime: Date;
  isHighDemand: boolean;
  open: boolean;
  out: boolean;
  message: string;
  priceFactor: number;
}

// Función para leer una sola vez
export const readAltaDemanda = async (): Promise<AltaDemandaProps | null> => {
  console.log('Iniciando lectura de Alta Demanda...');
  const firestore = getFirestore();
  try {
    const docRef = doc(firestore, 'constantes', 'altaDemanda');
    console.log('Referencia al documento creada');

    const docSnap = await getDoc(docRef);
    console.log('Snapshot del documento obtenido');

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Datos encontrados:', data);
      return {
        delayMinutes: data.delayMinutes,
        highDemandStartTime: data.highDemandStartTime.toDate(),
        isHighDemand: data.isHighDemand,
        open: data.open,
        out: data.out,  // Incluir out aquí también
        message: data.message,
        priceFactor: data.priceFactor

      };
    } else {
      console.log('No se encontró el documento de Alta Demanda');
      return null;
    }
  } catch (error) {
    console.error('Error al leer Alta Demanda:', error);
    throw error;
  }
};

// Función para escuchar cambios en tiempo real
export const listenToAltaDemanda = (
  callback: (altaDemanda: AltaDemandaProps) => void
): Unsubscribe => {
  console.log('Iniciando escucha de cambios en Alta Demanda...');
  const firestore = getFirestore();
  const docRef = doc(firestore, 'constantes', 'altaDemanda');

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Cambios detectados en Alta Demanda:', data);
        callback({
          delayMinutes: data.delayMinutes,
          highDemandStartTime: data.highDemandStartTime?.toDate
            ? data.highDemandStartTime.toDate()
            : null,
          isHighDemand: data.isHighDemand,
          open: data.open,
          out: data.out,  // Incluir out en el callback
          message: data.message,
          priceFactor: data.priceFactor


        });
      } else {
        console.log('El documento de Alta Demanda no existe');
      }
    },
    (error) => {
      console.error('Error en la escucha de Alta Demanda:', error);
    }
  );
};
