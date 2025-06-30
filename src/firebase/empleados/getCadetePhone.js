export const getCadetePhone = async (nombreCadete) => {
  const firestore = getFirestore();
  const empleadosRef = collection(firestore, 'empleados');
  const q = query(
    empleadosRef,
    where('category', '==', 'cadete'),
    where('name', '==', nombreCadete)
  );

  // console.log("🔍 Buscando cadete con nombre:", nombreCadete);
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const empleadoData = querySnapshot.docs[0].data();
    // console.log("📱 Teléfono del cadete encontrado:", empleadoData.telefono);
    return empleadoData.telefono;
  } else {
    console.warn('⚠️ Cadete no encontrado');
    return null;
  }
};
