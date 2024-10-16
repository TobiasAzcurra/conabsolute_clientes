export default function currencyFormat(num) {
  if (!num) return 0;
  return "$" + num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
}

export const obtenerFechaActual = () => {
  const fechaActual = new Date();
  const dia = String(fechaActual.getDate()).padStart(2, "0");
  const mes = String(fechaActual.getMonth() + 1).padStart(2, "0");
  const anio = fechaActual.getFullYear();

  // Formatea la fecha como "DD/MM/AAAA"
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  return fechaFormateada;
};

export const obtenerHoraActual = () => {
  // Obtener la hora actual
  const ahora = new Date();

  // Sumar 5 minutos
  ahora.setMinutes(ahora.getMinutes());

  // Obtener las horas y los minutos
  const horas = ahora.getHours().toString().padStart(2, "0");
  const minutos = ahora.getMinutes().toString().padStart(2, "0");

  // Formatear la hora como 'HH:mm'
  const horaFormateada = horas + ":" + minutos;

  return horaFormateada;
};

export const extractCoordinates = (url) => {
  const regex = /maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = url.match(regex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    return [lat, lng];
  }
  return [0, 0]; // Valor predeterminado si no se encuentran coordenadas
};

export const calcularCostoHamburguesa = (materiales, ingredientes) => {
  if (!ingredientes) {
    console.error("El objeto 'ingredientes' es null o undefined.");
    return 0;
  }

  let costoTotal = 0;

  // Iterar sobre las entradas del objeto ingredientes
  for (const [nombre, cantidad] of Object.entries(ingredientes)) {
    // Buscar el ingrediente en la lista de materiales
    const ingrediente = materiales.find((item) => item.nombre === nombre);
    if (ingrediente) {
      // Calcular el costo del ingrediente y sumarlo al costo total
      const costoIngrediente = ingrediente.costo * cantidad;
      costoTotal += costoIngrediente;
    } else {
      console.error(
        `No se encontró el ingrediente ${nombre} en la lista de materiales.`,
      );
    }
  }

  return costoTotal;
};

export const calculateDiscountedTotal = (cart, numCupones) => {
  // 1. Calcular la cantidad de hamburguesas a las que se aplicará el descuento
  const discountedBurgersCount = numCupones * 2;

  // 2. Crear un array con todas las hamburguesas, repitiendo según su cantidad
  let allBurgers = [];
  cart.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      allBurgers.push({
        price: item.price,
        toppingsPrice: item.toppings.reduce(
          (sum, topping) => sum + topping.price,
          0,
        ),
      });
    }
  });

  // Calcular el total original antes del descuento
  const originalTotal = allBurgers.reduce(
    (sum, burger) => sum + burger.price + burger.toppingsPrice,
    0,
  );

  // 3. Ordenar las hamburguesas de mayor a menor precio total
  allBurgers.sort(
    (a, b) => b.price + b.toppingsPrice - (a.price + a.toppingsPrice),
  );

  // 4. Seleccionar las hamburguesas mas caras según la cantidad de cupones
  const discountedBurgers = allBurgers.slice(0, discountedBurgersCount);

  // 5. Calcular el total de las hamburguesas con descuento
  const discountedTotal =
    discountedBurgers.reduce(
      (sum, burger) => sum + burger.price + burger.toppingsPrice,
      0,
    ) / 2;

  // 6. Calcular el total del resto del carrito
  const remainingBurgers = allBurgers.slice(discountedBurgersCount);
  const remainingTotal = remainingBurgers.reduce(
    (sum, burger) => sum + burger.price + burger.toppingsPrice,
    0,
  );

  // 7. Sumar ambos totales
  const newTotal = discountedTotal + remainingTotal;
  const totalDescuento = originalTotal - newTotal; // Descuento real aplicado

  return {
    newTotal,
    totalDescuento,
  };
};
