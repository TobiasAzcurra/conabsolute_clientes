const phone = '5493584306832';

const handleSubmit = (
  values,
  cart,
  total,
  envio,
  mapUrl,
  address,
  couponCodes
) => {
  const couponsText =
    couponCodes.length > 0 ? `- *Cupón:* ${couponCodes.join(', ')}` : '';

  let message =
    `¡Hola! Quiero hacer un pedido:\n\n` +
    `${couponsText}\n` + // Aquí concatenamos los cupones
    `- *Reserva:* ${values.hora}\n` +
    `- *Teléfono:* ${values.phone}\n` +
    `- *Forma de entrega:* ${values.deliveryMethod}\n` +
    `${
      values.deliveryMethod === 'delivery'
        ? `- *Dirección:* ${address}\n` +
          `- *Ubicación:* ${mapUrl}\n` +
          `- *Referencias:* ${values.references || 'no especificado'}\n`
        : ''
    }` +
    `- *Forma de pago:* ${values.paymentMethod}\n` +
    `${
      values.paymentMethod === 'ambos'
        ? `- *Monto en efectivo:* $${values.efectivoCantidad}\n` +
          `- *Monto con transferencia:* $${values.mercadopagoCantidad}\n`
        : ''
    }` +
    `Aquí está el detalle de mi pedido:\n\n`;

  let items = '';

  cart.forEach((item) => {
    items += `${item.quantity}x ${item.name}\n`;

    if (item.toppings.length > 0) {
      items += `Toppings:\n`;
      item.toppings.forEach((topping) => {
        items += `- ${topping.name}\n`;
      });
    }

    items += `: $ ${item.price}\n\n`;
  });

  items += `Subtotal: $ ${total}\n`;

  if (values.deliveryMethod === 'delivery') {
    items += `Costo de envío: $${envio}\n`;
    total += envio;
  }

  items += `TOTAL: $ ${total}\n\n`;

  message += items;
  message += 'Espero tu respuesta para confirmar mi pedido.';

  const encodedMessage = encodeURIComponent(message);

  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;

  window.open(url, '_blank');
};

export default handleSubmit;
