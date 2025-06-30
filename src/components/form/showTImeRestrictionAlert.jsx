import Swal from "sweetalert2";

export const showTimeRestrictionAlert = () => {
  Swal.fire({
    title: "Horario no disponible",
    text: "Lo sentimos, los pedidos solo están disponibles entre las 20:00 y las 00:00.",
    icon: "warning", // Puedes cambiar a otros iconos como 'error', 'success', etc.
    confirmButtonText: "Entendido",
    confirmButtonColor: "#d33",
    background: "#f9f9f9",
    customClass: {
      popup: "rounded-lg shadow-lg",
      title: "text-3xl text-red-500 font-bold",
      content: "text-lg text-gray-700",
      confirmButton: "text-lg font-semibold",
    },
    backdrop: `rgba(0,0,0,0.5)`, // Efecto de fondo oscuro
  });
};
