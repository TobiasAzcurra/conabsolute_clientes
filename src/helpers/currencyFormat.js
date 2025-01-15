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
  // 1. Crear array de todas las hamburguesas individuales con sus precios
  let allBurgers = [];
  cart.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      allBurgers.push({
        price: item.price,
        toppingsPrice: item.toppings.reduce(
          (sum, topping) => sum + topping.price,
          0
        ),
      });
    }
  });

  // 2. Ordenar todas las hamburguesas de mayor a menor precio
  allBurgers.sort(
    (a, b) => b.price + b.toppingsPrice - (a.price + a.toppingsPrice)
  );

  // 3. Calcular el total original antes de descuentos
  const originalTotal = allBurgers.reduce(
    (sum, burger) => sum + burger.price + burger.toppingsPrice,
    0
  );

  // 4. Aplicar descuentos por pares
  let newTotal = 0;
  let processedBurgers = 0;
  let appliedCoupons = 0;

  while (processedBurgers < allBurgers.length && appliedCoupons < numCupones) {
    // Verificar si quedan al menos 2 hamburguesas para aplicar el 2x1
    if (processedBurgers + 1 < allBurgers.length) {
      // Tomar el par de hamburguesas actual
      const burger1 = allBurgers[processedBurgers];
      const burger2 = allBurgers[processedBurgers + 1];
      
      // Calcular el precio del par y dividirlo por 2 (verdadero 2x1)
      const pairTotal = (burger1.price + burger1.toppingsPrice + 
                        burger2.price + burger2.toppingsPrice) / 2;
      newTotal += pairTotal;
      
      processedBurgers += 2; // Avanzar al siguiente par
      appliedCoupons++; // Incrementar cupones usados
    } else {
      // Si queda una hamburguesa suelta, se paga completa
      const burger = allBurgers[processedBurgers];
      newTotal += burger.price + burger.toppingsPrice;
      processedBurgers++;
    }
  }

  // 5. Agregar el costo de las hamburguesas restantes sin descuento
  for (let i = processedBurgers; i < allBurgers.length; i++) {
    newTotal += allBurgers[i].price + allBurgers[i].toppingsPrice;
  }

  const totalDescuento = originalTotal - newTotal;

  return {
    newTotal,
    totalDescuento,
  };
};
