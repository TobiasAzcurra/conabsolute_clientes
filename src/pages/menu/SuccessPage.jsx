import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // Eliminamos useNavigate ya que no se usa
import logo from "../../assets/anheloTMwhite.png";

export const items = {
	burgers: "burgers",
	combos: "combos",
	papas: "papas",
	bebidas: "bebidas",
};

const SuccessPage = () => {
	const { pathname } = useLocation();

	const [selectedItem, setSelectedItem] = useState("");
	const [locationMenu, setLocationMenu] = useState(true);

	useEffect(() => {
		const pathParts = pathname.split("/");
		const lastPart = pathParts[pathParts.length - 1];
		// Si selecciono PROMOCIONES, que no se actualice el selectedItem

		if (selectedItem === "PROMOCIONES") {
			setSelectedItem("PROMOCIONES");
		} else {
			setSelectedItem(lastPart);
		}

		setLocationMenu(pathname.startsWith("/menu/"));
	}, [pathname, selectedItem]);

	return (
		<>
			{/* Definición de las animaciones dentro del componente */}
			<style>
				{`
          @keyframes drawCircle {
            from {
              stroke-dashoffset: 157; /* Circunferencia de un círculo con r=25: 2 * π * 25 ≈ 157 */
            }
            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes drawCheck {
            from {
              stroke-dashoffset: 50; /* Longitud aproximada del check */
            }
            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes drawIcon {
            0% {
              stroke-dashoffset: 157;
            }
            50% {
              stroke-dashoffset: 157;
            }
            60% {
              stroke-dashoffset: 107; /* 157 - 50 */
            }
            100% {
              stroke-dashoffset: 0;
            }
          }

          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          .circle-animation {
            stroke-dasharray: 157;
            stroke-dashoffset: 157;
            animation: drawCircle 2s ease-out infinite;
          }

          .check-animation {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: drawCheck 1s ease-out infinite;
            animation-delay: 1s; /* Inicia después de que el círculo empiece */
          }

          .success-icon {
            animation: pulse 2s infinite;
          }

          .logo-animation {
            animation: fadeInUpCustom 1s ease-out forwards;
            animation-delay: 0.5s;
          }

          .text-animation {
            animation: fadeInUpCustom 1s ease-out forwards;
            animation-delay: 1s;
          }

          @keyframes fadeInUpCustom {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
			</style>

			<div className="bg-gradient-to-b from-black via-black to-red-main flex items-center justify-center h-screen">
				<div className="text-center">
					{/* Ícono de éxito con animaciones de dibujo en bucle */}
					<svg
						className="success-icon mb-[-30px] w-[200px] h-[200px] mx-auto text-gray-100"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 52 52"
						aria-label="Operación exitosa"
					>
						<path
							className="check-animation"
							fill="none"
							stroke="currentColor"
							strokeWidth="5"
							d="M14 27 L22 35 L38 19"
						/>
					</svg>

					{/* Mensaje de éxito con animación */}
					<h2 className="text-gray-100 font-coolvetica text-2xl font-medium text-animation">
						¡Que lo disfrutes!
					</h2>
				</div>
			</div>
		</>
	);
};

export default SuccessPage;
