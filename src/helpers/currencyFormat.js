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
        `No se encontró el ingrediente ${nombre} en la lista de materiales.`
      );
    }
  }

  return costoTotal;
};

export const getPromoAndNonPromoProducts = (cart) => {
  const promoProducts = cart.filter((item) => item.type === "promo");
  const nonPromoProducts = cart.filter((item) => item.type !== "promo");
  return { promoProducts, nonPromoProducts };
};

export const calculateDiscountedTotal = (
  cart,
  numCoupons,
  freeVouchers = 0
) => {
  console.log("🔢 INICIO CÁLCULO DE DESCUENTOS", { numCoupons, freeVouchers });

  // Separar productos promocionales y no promocionales
  const { promoProducts, nonPromoProducts } = getPromoAndNonPromoProducts(cart);
  console.log("🛒 PRODUCTOS SEPARADOS", {
    totalProductos: cart.length,
    productosPromo: promoProducts.length,
    productosNoPromo: nonPromoProducts.length,
  });

  // 1. Crear array de todas las hamburguesas no promocionales con sus precios
  let allBurgers = [];
  nonPromoProducts.forEach((item) => {
    if (item.category === "burger" || item.category === "burgers") {
      for (let i = 0; i < item.quantity; i++) {
        allBurgers.push({
          name: item.name,
          price: item.price,
          toppingsPrice: item.toppings.reduce(
            (sum, topping) => sum + topping.price,
            0
          ),
        });
      }
    }
  });

  console.log("🍔 HAMBURGUESAS PARA DESCUENTO", {
    totalBurgers: allBurgers.length,
    burgers: allBurgers.map((b) => ({
      nombre: b.name,
      precio: b.price,
      precioToppings: b.toppingsPrice,
      total: b.price + b.toppingsPrice,
    })),
  });

  // 2. Ordenar todas las hamburguesas de mayor a menor precio
  allBurgers.sort(
    (a, b) => a.price + a.toppingsPrice - (b.price + b.toppingsPrice)
  );

  console.log("📊 HAMBURGUESAS ORDENADAS (de menor a mayor precio)", {
    ordenDeMenorAMayor: allBurgers.map((b) => ({
      nombre: b.name,
      precioTotal: b.price + b.toppingsPrice,
    })),
  });

  // 3. Calcular el total original antes de descuentos
  const originalTotal = cart.reduce((sum, item) => {
    const itemTotal =
      item.price * item.quantity +
      (item.toppings?.reduce((tSum, t) => tSum + t.price * item.quantity, 0) ||
        0);
    return sum + itemTotal;
  }, 0);

  console.log("💲 TOTAL ORIGINAL", { originalTotal });

  // 4. Aplicar descuentos para vouchers gratis (a las hamburguesas más baratas)
  const freeBurgerDiscount = allBurgers
    .slice(0, freeVouchers)
    .reduce((sum, burger) => sum + burger.price + burger.toppingsPrice, 0);

  console.log("🎁 DESCUENTO POR HAMBURGUESAS GRATIS", {
    freeBurgerDiscount,
    burgersGratis: allBurgers.slice(0, freeVouchers).map((b) => ({
      nombre: b.name,
      precio: b.price,
      toppings: b.toppingsPrice,
      total: b.price + b.toppingsPrice,
    })),
  });

  // 5. Aplicar descuentos 2x1 a las hamburguesas restantes
  let newTotal = originalTotal - freeBurgerDiscount;
  let processedBurgers = freeVouchers;
  let appliedCoupons = 0;
  let descuentos2x1 = [];

  // Ordenar las hamburguesas restantes de mayor a menor precio para el 2x1
  const remainingBurgers = allBurgers.slice(freeVouchers);
  remainingBurgers.sort(
    (a, b) => b.price + b.toppingsPrice - (a.price + a.toppingsPrice)
  );

  console.log("2️⃣✖️1️⃣ INICIO APLICACIÓN 2x1", {
    newTotalAntes2x1: newTotal,
    burgersLibres: remainingBurgers.length,
    cuponesDisponibles: numCoupons,
  });

  while (appliedCoupons < numCoupons && remainingBurgers.length >= 2) {
    // Tomar las dos hamburguesas de mayor precio
    const burger1 = remainingBurgers.shift();
    const burger2 = remainingBurgers.shift();

    // Calcular el precio del par y dividirlo por 2 (verdadero 2x1)
    const pairTotal =
      (burger1.price +
        burger1.toppingsPrice +
        burger2.price +
        burger2.toppingsPrice) /
      2;

    console.log(`🔄 PAREJA ${appliedCoupons + 1} DE HAMBURGUESAS 2x1`, {
      burger1: {
        nombre: burger1.name,
        precio: burger1.price,
        toppings: burger1.toppingsPrice,
        total: burger1.price + burger1.toppingsPrice,
      },
      burger2: {
        nombre: burger2.name,
        precio: burger2.price,
        toppings: burger2.toppingsPrice,
        total: burger2.price + burger2.toppingsPrice,
      },
      totalPareja:
        burger1.price +
        burger1.toppingsPrice +
        burger2.price +
        burger2.toppingsPrice,
      descuento: pairTotal,
    });

    newTotal -= pairTotal; // Restar el descuento del par
    descuentos2x1.push({
      pareja: appliedCoupons + 1,
      hamburguesas: [burger1, burger2],
      descuento: pairTotal,
    });

    appliedCoupons++;
  }

  // Calcular el descuento total aplicado
  const totalDescuento = originalTotal - newTotal - freeBurgerDiscount;

  console.log("🏁 RESULTADO FINAL DESCUENTOS", {
    totalOriginal: originalTotal,
    descuentoGratis: freeBurgerDiscount,
    descuento2x1: totalDescuento,
    totalConDescuentos: newTotal,
    cuponesGratisAplicados: freeVouchers,
    cupones2x1Aplicados: appliedCoupons,
    detalleDescuentos2x1: descuentos2x1,
  });

  return {
    newTotal,
    totalDescuento,
    freeBurgerDiscount,
  };
};
