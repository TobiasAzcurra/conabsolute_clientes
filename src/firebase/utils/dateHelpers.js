export const obtenerFechaActual = () => {
  const fechaActual = new Date();
  const dia = String(fechaActual.getDate()).padStart(2, '0');
  const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
  const anio = fechaActual.getFullYear();

  // Formatea la fecha como "DD/MM/AAAA"
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  return fechaFormateada;
};

const generateDatePaths = (days = 7) => {
  const paths = [];
  const today = new Date();

  // Iteramos por 7 días en lugar de months * 30
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    paths.push({
      path: `pedidos/${year}/${month}/${day}`,
      formattedDate: `${day}/${month}/${year}`,
    });
  }

  return paths;
};
