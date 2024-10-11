// vamos hacer un componente funcional para buscar un pedido por el numero de telefono

import { useState } from "react";
import { ReadOrdersForTodayByPhone } from "../../firebase/getPedido";
import { CardPedido } from "./CardPedido";
import logo from "../../assets/anheloTMblack.png";

export const Pedido = () => {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(false);

	const handlePhoneNumberChange = (event) => {
		setPhoneNumber(event.target.value);
	};

	const handleSearchClick = () => {
		setLoading(true);
		ReadOrdersForTodayByPhone(phoneNumber, (pedidos) => {
			setOrders(pedidos);
			setLoading(false);
		});
	};

	return (
		// <div>
		//   <h1>Buscar Pedido</h1>
		//   <input
		//     type="text"
		//     placeholder="Ingrese su numero de telefono"
		//     value={phoneNumber}
		//     onChange={handlePhoneNumberChange}
		//     className="
		//       text-black
		//       bg-gray-200
		//       p-2
		//       border
		//       border-gray-400
		//       rounded-md
		//       shadow-sm
		//       focus:outline-none
		//       focus:border-blue-500
		//       focus:ring
		//       focus:ring-blue-500
		//       focus:ring-opacity-50
		//     "
		//   />
		//   <button
		//     onClick={handleSearchClick}
		//     className="
		//       text-white
		//       bg-blue-500
		//       hover:bg-blue-700
		//       py-2
		//       px-4
		//       border
		//       border-blue-700
		//       rounded
		//       shadow-md
		//       cursor-pointer
		//       mt-2
		//     "
		//   >
		//     Buscar
		//   </button>

		//   {loading && (
		//     <div role="status">
		//       <svg
		//         aria-hidden="true"
		//         className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
		//         viewBox="0 0 100 101"
		//         fill="none"
		//         xmlns="http://www.w3.org/2000/svg"
		//       >
		//         <path
		//           d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
		//           fill="currentColor"
		//         />
		//         <path
		//           d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
		//           fill="currentFill"
		//         />
		//       </svg>
		//       <span className="sr-only">Loading...</span>
		//     </div>
		//   )}

		//   {!loading && orders.length > 0 && (
		//     <ul
		//       className="
		//         mt-4
		//         bg-gray-200
		//         p-4
		//         rounded-lg
		//         shadow-md
		//       "
		//     >
		//       {orders.map((pedido) => (
		//         <li key={pedido.id}>
		//           <CardPedido pedido={pedido} />
		//         </li>
		//       ))}
		//     </ul>
		//   )}

		//   {!loading && orders.length === 0 && (
		//     <p className="mt-4">
		//       No se encontraron pedidos para el número de teléfono proporcionado.
		//     </p>
		//   )}
		// </div>
		<div className="bg-gray-100 flex flex-col items-center h-screen justify-center">
			<div className="flex items-center flex-col">
				<img src={logo} className="w-1/2" alt="Logo" />
				<p className="text-black font-coolvetica font-bold mt-[-3px]">RIDERS</p>
			</div>
			<div className="flex items-center flex-col w-full px-4 mt-4">
				{/* Línea horizontal */}
				<div className="w-full flex flex-row gap-2">
					<div className="w-1/4 h-3.5 bg-black"></div>
					<div className="w-1/4 h-3.5 bg-black"></div>
					<div className="w-1/2 h-3.5 bg-black"></div>
				</div>
				<p className="text-black font-coolvetica font-bold mt-2">
					Anhelo está preparando tu pedido
				</p>
				<p className="text-black font-coolvetica font-medium mt-2">
					Entrega estimada:{" "}
					<span className="font-bold font-coolvetica">23:20hs - 23:50 hs</span>
				</p>
				<p className="text-black font-coolvetica font-medium mt-2">
					Pedido a cargo de: <span className="font-bold">Mauri</span>
				</p>
				<p className="text-black font-coolvetica font-medium mt-2">
					Destino:{" "}
					<span className="font-bold font-coolvetica">
						Av. Amadeo Sabattini 2043
					</span>
				</p>
				<p className="text-black font-coolvetica font-medium mt-2">
					Total: <span className="font-bold font-coolvetica">$10.100</span>
				</p>
			</div>
		</div>
	);
};
