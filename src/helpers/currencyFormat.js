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
  console.log("🔢 INICIO CÁLCULO DE DESCUENTOS", {
    numCoupons,
    freeVouchers,
    carrito: cart,
  });

  // Separar productos promocionales y no promocionales
  const { promoProducts, nonPromoProducts } = getPromoAndNonPromoProducts(cart);
  console.log("🛒 PRODUCTOS SEPARADOS", {
    totalProductos: cart.length,
    productosPromo: promoProducts.length,
    productosNoPromo: nonPromoProducts.length,
    detalleNoPromo: nonPromoProducts,
  });

  // 1. Crear array de todas las hamburguesas no promocionales con sus precios
  let allBurgers = [];
  nonPromoProducts.forEach((item) => {
    if (item.category === "burger" || item.category === "burgers") {
      const isEligibleForFree = item.name.toLowerCase().includes("satisfyer");

      console.log(`🍔 ANALIZANDO HAMBURGUESA: ${item.name}`, {
        categoria: item.category,
        tipo: item.type,
        cantidad: item.quantity,
        precio: item.price,
        toppings: item.toppings,
        elegibleParaVoucherGratis: isEligibleForFree,
      });

      for (let i = 0; i < item.quantity; i++) {
        allBurgers.push({
          name: item.name,
          price: item.price,
          toppingsPrice: item.toppings.reduce(
            (sum, topping) => sum + topping.price,
            0
          ),
          isEligibleForFree: isEligibleForFree,
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
      elegibleParaGratis: b.isEligibleForFree,
    })),
  });

  // Filtrar hamburguesas elegibles para vouchers gratis
  const eligibleForFreeBurgers = allBurgers.filter(
    (burger) => burger.isEligibleForFree
  );

  console.log("🍔 HAMBURGUESAS ELEGIBLES PARA VOUCHER GRATIS", {
    total: eligibleForFreeBurgers.length,
    elegibles: eligibleForFreeBurgers.map((b) => ({
      nombre: b.name,
      precio: b.price + b.toppingsPrice,
    })),
  });

  if (freeVouchers > 0 && eligibleForFreeBurgers.length === 0) {
    console.warn("⚠️ NO HAY HAMBURGUESAS ELEGIBLES PARA VOUCHERS GRATIS");
  }

  // 2. Ordenar hamburguesas elegibles de menor a mayor precio (para vouchers gratis)
  eligibleForFreeBurgers.sort(
    (a, b) => a.price + a.toppingsPrice - (b.price + b.toppingsPrice)
  );

  console.log("📊 HAMBURGUESAS ELEGIBLES ORDENADAS (de menor a mayor precio)", {
    ordenDeMenorAMayor: eligibleForFreeBurgers.map((b) => ({
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

  // 4. Aplicar descuentos para vouchers gratis (solo a hamburguesas elegibles)
  // Si hay más vouchers que hamburguesas elegibles, limitamos a las disponibles
  const applicableFreeBurgers = Math.min(
    freeVouchers,
    eligibleForFreeBurgers.length
  );

  console.log("🎫 APLICACIÓN DE VOUCHERS GRATIS", {
    vouchersDisponibles: freeVouchers,
    hamburguesasElegiblesDisponibles: eligibleForFreeBurgers.length,
    vouchersAplicados: applicableFreeBurgers,
  });

  const freeBurgerDiscount = eligibleForFreeBurgers
    .slice(0, applicableFreeBurgers)
    .reduce((sum, burger) => sum + burger.price + burger.toppingsPrice, 0);

  console.log("🎁 DESCUENTO POR HAMBURGUESAS GRATIS", {
    freeBurgerDiscount,
    burgersGratis: eligibleForFreeBurgers
      .slice(0, applicableFreeBurgers)
      .map((b) => ({
        nombre: b.name,
        precio: b.price,
        toppings: b.toppingsPrice,
        total: b.price + b.toppingsPrice,
      })),
    vouchersAplicados: applicableFreeBurgers,
    vouchersSolicitados: freeVouchers,
  });

  // 5. Marcar las hamburguesas ya usadas para vouchers gratis
  const usedFreeBurgers = eligibleForFreeBurgers.slice(
    0,
    applicableFreeBurgers
  );

  // 6. Obtener las hamburguesas restantes para 2x1 (excluyendo las usadas para vouchers gratis)
  const remainingBurgers = [...allBurgers];

  // Eliminar hamburguesas usadas para vouchers gratis
  for (const freeBurger of usedFreeBurgers) {
    const index = remainingBurgers.findIndex(
      (b) =>
        b.name === freeBurger.name &&
        b.price === freeBurger.price &&
        b.toppingsPrice === freeBurger.toppingsPrice
    );

    if (index !== -1) {
      console.log(
        `🔄 ELIMINANDO HAMBURGUESA USADA PARA VOUCHER GRATIS: ${remainingBurgers[index].name}`
      );
      remainingBurgers.splice(index, 1);
    }
  }

  // Ordenamos de mayor a menor para 2x1 (diferente al orden para vouchers gratis)
  remainingBurgers.sort(
    (a, b) => b.price + b.toppingsPrice - (a.price + a.toppingsPrice)
  );

  // 7. Aplicar descuentos 2x1 a las hamburguesas restantes
  let newTotal = originalTotal - freeBurgerDiscount;
  let appliedCoupons = 0;
  let descuentos2x1 = [];

  console.log("2️⃣✖️1️⃣ INICIO APLICACIÓN 2x1", {
    newTotalAntes2x1: newTotal,
    burgersLibres: remainingBurgers.length,
    cuponesDisponibles: numCoupons,
    hamburguesas2x1: remainingBurgers.map((b) => ({
      nombre: b.name,
      precio: b.price + b.toppingsPrice,
    })),
  });

  // Verificar si hay suficientes hamburguesas para aplicar los vouchers 2x1
  if (remainingBurgers.length < numCoupons * 2) {
    console.log(
      "⚠️ NO HAY SUFICIENTES HAMBURGUESAS PARA TODOS LOS VOUCHERS 2x1",
      {
        disponibles: remainingBurgers.length,
        necesarias: numCoupons * 2,
      }
    );

    // Ajustar la cantidad de cupones aplicables
    const applicableCoupons = Math.floor(remainingBurgers.length / 2);
    console.log(
      `👉 Solo se aplicarán ${applicableCoupons} cupones 2x1 de los ${numCoupons} disponibles`
    );
    numCoupons = applicableCoupons;
  }

  // Aplicar los vouchers 2x1
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

  // Calcular el descuento total aplicado por 2x1
  const discount2x1 = descuentos2x1.reduce((sum, d) => sum + d.descuento, 0);

  console.log("🏁 RESULTADO FINAL DESCUENTOS", {
    totalOriginal: originalTotal,
    descuentoGratis: freeBurgerDiscount,
    descuento2x1: discount2x1,
    descuentoTotal: freeBurgerDiscount + discount2x1,
    totalConDescuentos: newTotal,
    cuponesGratisAplicados: applicableFreeBurgers,
    cupones2x1Aplicados: appliedCoupons,
    detalleDescuentos2x1: descuentos2x1,
  });

  return {
    newTotal,
    totalDescuento: discount2x1,
    freeBurgerDiscount,
  };
};
