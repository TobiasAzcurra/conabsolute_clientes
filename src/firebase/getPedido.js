import { getFirestore, doc, onSnapshot } from "firebase/firestore";

export const obtenerFechaActual = () => {
  const fechaActual = new Date();
  const dia = String(fechaActual.getDate()).padStart(2, "0");
  const mes = String(fechaActual.getMonth() + 1).padStart(2, "0");
  const anio = fechaActual.getFullYear();

  // Formatea la fecha como "DD/MM/AAAA"
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  return fechaFormateada;
};

export const ReadOrdersForTodayByPhone = (phoneNumber, callback) => {
  const firestore = getFirestore();
  const todayDateString = obtenerFechaActual(); // Asumiendo que tienes una función obtenerFechaActual() definida en otro lugar

  // Obtener el año, mes y día actual
  const [day, month, year] = todayDateString.split("/");

  // Referencia al documento del día actual dentro de la colección del mes actual
  const ordersDocRef = doc(firestore, "pedidos", year, month, day);

  // Escuchar cambios en el documento del día actual
  return onSnapshot(
    ordersDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        // Si el documento existe, obtener el arreglo de pedidos
        const pedidosDelDia = docSnapshot.data()?.pedidos || [];

        // Filtrar los pedidos por el número de teléfono
        const pedidosFiltrados = pedidosDelDia.filter(
          (pedido) => pedido.telefono === phoneNumber,
        );
        console.log(pedidosFiltrados);

        // Llamar a la función de devolución de llamada con los pedidos filtrados
        callback(pedidosFiltrados);
      } else {
        // Si el documento no existe, no hay pedidos para el día actual
        callback([]); // Llamar a la función de devolución de llamada con un arreglo vacío
      }
    },
    (error) => {
      console.error("Error al obtener los pedidos para el día actual:", error);
    },
  );
};
