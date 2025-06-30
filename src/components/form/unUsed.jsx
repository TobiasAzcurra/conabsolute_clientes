// const SPECIAL_CODES = ['AUTODROMOXANHELO', 'ANHELOUSD'];

// const isSpecialCode = (code) => {
//   return SPECIAL_CODES.includes(code.toUpperCase());
// };

// const getSpecialCodeInfo = (code) => {
//   const upperCode = code.toUpperCase();

//   switch (upperCode) {
//     case 'AUTODROMOXANHELO':
//       return {
//         discount: 0.5, // 50%
//         message:
//           'Este código aplica un 50% de descuento y no puede canjearse junto a más códigos',
//         validMessage: '¡Código válido! (50% descuento)',
//       };
//     case 'ANHELOUSD':
//       return {
//         discount: 0.5, // 30% por ejemplo
//         message:
//           'Este código aplica un 50% de descuento y no puede canjearse junto a más códigos',
//         validMessage: '¡Código válido! (50% descuento)',
//       };
//     default:
//       return null;
//   }
// };

// const validCoupons = couponCodes.filter(
//   (code, index) =>
//     code.trim() !== '' &&
//     (voucherStatus[index] === '¡Código válido!' ||
//       voucherStatus[index] === '¡Código válido! (Hamburguesa gratis)' ||
//       voucherStatus[index] === '¡Código válido! (50% descuento)')
// );

// if (validCoupons.length > 0) {
//   const canjeSuccess = await canjearVouchers(validCoupons);
//   if (!canjeSuccess) {
//     console.error('Error al canjear los cupones');
//   }
// }

// let totalDiscount = descuento + freeBurgerDiscount;

// Si hay código especial, usar su descuento en lugar del normal
// if (hasSpecialCode) {
//   // Encontrar qué código especial está siendo usado
//   const currentSpecialCode = couponCodes.find((code) =>
//     isSpecialCode(code)
//   );
//   if (currentSpecialCode) {
//     const specialCodeInfo = getSpecialCodeInfo(currentSpecialCode);
//     console.log(
//       `🔢 Calculando descuento especial para ${currentSpecialCode.toUpperCase()}`
//     );

//     // Calcular solo con productos no promocionales
//     const { nonPromoProducts } = getPromoAndNonPromoProducts(cart);

//     // Calcular total de productos no promocionales
//     let nonPromoTotal = 0;
//     nonPromoProducts.forEach((item) => {
//       // Precio base * cantidad
//       const basePrice = item.price * item.quantity;

//       nonPromoTotal += basePrice;
//     });

//     totalDiscount = Math.round(nonPromoTotal * specialCodeInfo.discount);
//     console.log('💰 Descuento especial calculado:', totalDiscount);
//   }
// }

// console.log('📊 Enviando pedido con descuento:', totalDiscount);

// // Si es voucher gratis
// if (gratis) {
//   console.log('🎟️ PROCESANDO VOUCHER GRATIS');

//   // NUEVA VALIDACIÓN: Verificar si hay hamburguesas  "satisfyer" elegibles
//   const eligibleBurgers = nonPromoProducts.filter((item) => {
//     const lowerName = item.name.toLowerCase();
//     const isSatisfyer = lowerName.includes('satisfyer');

//     console.log(`🔍 Verificando elegibilidad de "${item.name}":`, {
//       categoria: item.category,
//       nombreEnMinúsculas: lowerName,
//       contieneSatisfyer: isSatisfyer,
//       esElegible:
//         (item.category === 'burger' || item.category === 'burgers') &&
//         isSatisfyer,
//     });

//     return (
//       (item.category === 'burger' || item.category === 'burgers') &&
//       isSatisfyer
//     );
//   });

//   console.log('🍔 HAMBURGUESAS ELEGIBLES ENCONTRADAS:', eligibleBurgers);

//   const totalElegibleBurgers = eligibleBurgers.reduce(
//     (sum, item) => sum + item.quantity,
//     0
//   );

//   console.log('🔢 RESUMEN DE HAMBURGUESAS ELEGIBLES:', {
//     hamburgesasElegibles: eligibleBurgers,
//     cantidadTotal: totalElegibleBurgers,
//   });

//   if (totalElegibleBurgers === 0) {
//     updatedVoucherStatus[index] =
//       'Para canjear un voucher gratis solo podes hacerlo con hamburguesas Satisfyer';
//     setVoucherStatus(updatedVoucherStatus);
//     console.log('⚠️ NO HAY HAMBURGUESAS ELEGIBLES PARA VOUCHER GRATIS', {
//       updatedVoucherStatus,
//     });
//     return;
//   }

//   const totalFreeVouchers =
//     freeVouchers +
//     (updatedVoucherStatus[index] ===
//     '¡Código válido! (Hamburguesa gratis)'
//       ? 0
//       : 1);

//   console.log('🧮 CÁLCULO DE VOUCHERS GRATIS TOTALES:', {
//     vouchersGratisActuales: freeVouchers,
//     nuevoVoucherGratis:
//       updatedVoucherStatus[index] !==
//       '¡Código válido! (Hamburguesa gratis)',
//     totalVouchersGratis: totalFreeVouchers,
//   });

//   if (totalFreeVouchers > totalElegibleBurgers) {
//     updatedVoucherStatus[index] =
//       'No hay suficientes hamburguesas simples para aplicar todos los vouchers gratis.';
//     setVoucherStatus(updatedVoucherStatus);
//     console.log('⚠️ INSUFICIENTES HAMBURGUESAS SIMPLES PARA VOUCHERS', {
//       vouchersGratis: totalFreeVouchers,
//       hamburguesasElegibles: totalElegibleBurgers,
//       updatedVoucherStatus,
//     });
//     return;
//   }

//   updatedVoucherStatus[index] = '¡Código válido! (Hamburguesa gratis)';
//   setVoucherStatus(updatedVoucherStatus);

//   const discountResult = calculateDiscountedTotal(
//     cart,
//     normalVouchers,
//     totalFreeVouchers
//   );

//   console.log('📊 RESULTADO DEL CÁLCULO DE DESCUENTOS:', discountResult);

//   setFreeBurgerDiscount(discountResult.freeBurgerDiscount);
//   console.log('💰 DESCUENTO POR HAMBURGUESAS GRATIS ACTUALIZADO', {
//     nuevoDescuento: discountResult.freeBurgerDiscount,
//   });

//   setDescuento(discountResult.totalDescuento);
//   setDiscountedTotal(discountResult.newTotal);

//   console.log('🏁 DESCUENTOS FINALES RECALCULADOS', {
//     nuevoTotal: discountResult.newTotal,
//     descuento2x1: discountResult.totalDescuento,
//     descuentoGratis: discountResult.freeBurgerDiscount,
//     totalConDescuento: discountResult.newTotal,
//   });
// }
// // Si es voucher 2x1
// else {
//   console.log('2️⃣✖️1️⃣ PROCESANDO VOUCHER 2x1');

//   const numCoupons =
//     normalVouchers +
//     (updatedVoucherStatus[index] === '¡Código válido!' ? 0 : 1);

//   console.log('🧮 CONTEO TOTAL DE VOUCHERS 2x1:', {
//     numCoupons,
//     normalVouchersActuales: normalVouchers,
//     nuevoVoucher2x1: updatedVoucherStatus[index] !== '¡Código válido!',
//     burgersPorParejas: numCoupons * 2,
//   });

//   // Obtener todas las hamburguesas disponibles después de aplicar vouchers gratis
//   // Primero, filtrar las hamburguesas elegibles para vouchers gratis
//   const eligibleForFree = nonPromoProducts
//     .filter(
//       (item) =>
//         (item.category === 'burger' || item.category === 'burgers') &&
//         (item.name.toLowerCase().includes('simple') ||
//           item.name.toLowerCase().includes('satisfyer'))
//     )
//     .reduce((sum, item) => sum + item.quantity, 0);

//   console.log('🍔 HAMBURGUESAS ELEGIBLES PARA GRATIS:', {
//     cantidad: eligibleForFree,
//     detalles: nonPromoProducts.filter(
//       (item) =>
//         (item.category === 'burger' || item.category === 'burgers') &&
//         (item.name.toLowerCase().includes('simple') ||
//           item.name.toLowerCase().includes('satisfyer'))
//     ),
//   });

//   // Determinar cuántas hamburguesas elegibles se utilizarán para vouchers gratis
//   const freeVouchersToApply = Math.min(freeVouchers, eligibleForFree);

//   // Calcular las hamburguesas disponibles para 2x1 (excluyendo las usadas para gratis)
//   const totalNonPromoBurgers = getTotalBurgers(nonPromoProducts);
//   const availableBurgers = totalNonPromoBurgers - freeVouchersToApply;

//   console.log('🍔 HAMBURGUESAS DISPONIBLES PARA 2x1', {
//     totalBurgersNoPromo: totalNonPromoBurgers,
//     elegiblesParaGratis: eligibleForFree,
//     usadasPorVouchersGratis: freeVouchersToApply,
//     disponiblesParaVouchers2x1: availableBurgers,
//   });

//   // Verificar si hay suficientes hamburguesas disponibles para este voucher 2x1
//   if (availableBurgers < numCoupons * 2) {
//     updatedVoucherStatus[index] = `Necesitas al menos ${
//       numCoupons * 2
//     } hamburguesas no promocionales disponibles para canjear los vouchers 2x1. Ya usaste ${freeVouchersToApply} con vouchers gratis.`;
//     setVoucherStatus(updatedVoucherStatus);
//     console.log('⚠️ NO HAY SUFICIENTES HAMBURGUESAS PARA 2x1', {
//       updatedVoucherStatus,
//     });
//     return;
//   }

//   if (promoProducts.length > 0 && nonPromoProducts.length > 0) {
//     const hasEnoughNonPromoBurgers = availableBurgers >= numCoupons * 2;
//     console.log('🔍 VERIFICANDO HAMBURGUESAS NO PROMOCIONALES PARA 2x1', {
//       hasEnoughNonPromoBurgers,
//       required: numCoupons * 2,
//       totalNonPromoBurgers,
//       disponibles: availableBurgers,
//     });

//     if (!hasEnoughNonPromoBurgers) {
//       updatedVoucherStatus[index] = `Necesitas al menos ${
//         numCoupons * 2
//       } hamburguesas no promocionales disponibles para canjear los vouchers 2x1. Ya usaste ${freeVouchersToApply} con vouchers gratis.`;
//       setVoucherStatus(updatedVoucherStatus);
//       console.log(
//         '⚠️ NO HAY SUFICIENTES HAMBURGUESAS NO PROMOCIONALES PARA 2x1',
//         { updatedVoucherStatus }
//       );
//       return;
//     }
//   }

//   if (totalBurgers < numCoupons * 2) {
//     updatedVoucherStatus[index] = `Necesitas al menos ${
//       numCoupons * 2
//     } hamburguesas para canjear los vouchers 2x1.`;
//     setVoucherStatus(updatedVoucherStatus);
//     console.log('⚠️ NO HAY SUFICIENTES HAMBURGUESAS TOTALES PARA 2x1', {
//       updatedVoucherStatus,
//     });
//     return;
//   }

//   updatedVoucherStatus[index] = '¡Código válido!';
//   setVoucherStatus(updatedVoucherStatus);
//   console.log('✅ VOUCHER 2x1 VÁLIDO', { updatedVoucherStatus });

//   console.log('💰 RECALCULANDO DESCUENTOS CON VOUCHERS 2x1:', {
//     numCoupons,
//     freeVouchers,
//   });

//   const discountResult = calculateDiscountedTotal(
//     cart,
//     numCoupons,
//     freeVouchers
//   );

//   console.log(
//     '📊 RESULTADO DEL CÁLCULO DE DESCUENTOS 2x1:',
//     discountResult
//   );

//   if (descuentoForOneUnit === 0) {
//     setDescuentoForOneUnit(discountResult.totalDescuento / numCoupons);
//     console.log('💰 DESCUENTO POR UNIDAD ESTABLECIDO:', {
//       descuentoPorUnidad: discountResult.totalDescuento / numCoupons,
//     });
//   }

//   setDescuento(discountResult.totalDescuento);
//   setFreeBurgerDiscount(discountResult.freeBurgerDiscount);
//   setDiscountedTotal(discountResult.newTotal);

//   console.log('🏁 DESCUENTOS 2x1 RECALCULADOS', {
//     nuevoTotal: discountResult.newTotal,
//     descuento2x1: discountResult.totalDescuento,
//     descuentoGratis: discountResult.freeBurgerDiscount,
//   });
// }
