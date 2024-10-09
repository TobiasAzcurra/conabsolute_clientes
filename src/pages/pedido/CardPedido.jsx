export const CardPedido = ({ pedido }) => {
  const {
    aclaraciones,
    detallePedido,
    direccion,
    elaborado,
    envio,
    fecha,
    hora,
    metodoPago,
    subTotal,
    telefono,
    total,
    referencias,
    id,
    piso,
    cadete,
    dislike,
    delay,
    tiempoElaborado,
    tiempoEntregado,
    entregado,
    map,
    kms,
    minutosDistancia,
  } = pedido;

  function sumarMinutos(hora, minutosASumar) {
    // Descomponer la hora en horas y minutos
    const [horaStr, minutoStr] = hora.split(':');
    const horas = parseInt(horaStr, 10);
    const minutos = parseInt(minutoStr, 10);

    // Crear un objeto Date a partir de la hora descompuesta
    const fecha = new Date();
    fecha.setHours(horas);
    fecha.setMinutes(minutos);

    // Sumar los minutos
    fecha.setMinutes(fecha.getMinutes() + minutosASumar);

    // Obtener las nuevas horas y minutos
    const nuevasHoras = fecha.getHours().toString().padStart(2, '0');
    const nuevosMinutos = fecha.getMinutes().toString().padStart(2, '0');

    // Devolver la nueva hora en formato HH:MM
    return `${nuevasHoras}:${nuevosMinutos}`;
  }

  return (
    <div>
      {/* aqui va la hora de ingreso del pedido */}

      <h2 className="text-xl font-bold">Pedido</h2>
      <p>
        <span className="font-bold">Hora de ingreso:</span> - {hora}
      </p>

      {/* y pone una hora estimada de entrega entre 30 y 50 de la hora */}

      <p>
        <span className="font-bold">Hora estimada de entrega:</span> -{' '}
        {sumarMinutos(hora, 30)} a {sumarMinutos(hora, 50)}
      </p>

      {!elaborado && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Pedido pendiente</p>
          <p>Tu pedido esta siendo elaborado</p>
        </div>
      )}

      {elaborado && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
          role="alert"
        >
          <p className="font-bold">Pedido listo</p>
          <p>Tu pedido esta listo para retirar</p>
        </div>
      )}

      {entregado && (
        <div
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4"
          role="alert"
        >
          <p className="font-bold">Pedido entregado</p>
          <p>Tu pedido fue entregado</p>
        </div>
      )}

      {cadete !== 'NO ASIGNADO' && (
        <div>
          <p>
            Entrega a cargo de
            <span className="font-bold"> {cadete.toUpperCase()}</span>
          </p>
        </div>
      )}
    </div>
  );
};
