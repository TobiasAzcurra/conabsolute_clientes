import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import logo from "../../assets/anheloTMwhite.png";

export const items = {
	burgers: "burgers",
	combos: "combos",
	papas: "papas",
	bebidas: "bebidas",
};

const SuccessPage = () => {
	const { pathname } = useLocation();
	// Eliminamos navigate ya que ya no lo usaremos para redireccionar
	// const navigate = useNavigate();

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

	// Eliminamos el useEffect que redirige automáticamente
	/*
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/menu/burgers");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);
  */

	return (
		<>
			{/* Definición de las animaciones dentro del componente */}
			<style>
				{`
          @keyframes fadeInScale {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            70% {
              opacity: 0.7;
              transform: scale(1.05);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
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

          /* Animación que se repite infinitamente */
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

          .success-icon {
            animation: pulse 1.5s infinite;
          }

          .logo-animation {
            animation: fadeInUpCustom 1s ease-out forwards;
            animation-delay: 0.5s;
          }

          .text-animation {
            animation: fadeInUpCustom 1s ease-out forwards;
            animation-delay: 1s;
          }
        `}
			</style>

			<div className="bg-gradient-to-b from-black via-black to-red-main flex items-center justify-center h-screen">
				<div className="text-center">
					{/* Ícono de éxito con animación */}
					<svg
						className="success-icon mb-4 w-16 h-16 mx-auto text-gray-100"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 52 52"
						aria-label="Operación exitosa"
					>
						<circle
							cx="26"
							cy="26"
							r="25"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						/>
						<path
							fill="none"
							stroke="currentColor"
							strokeWidth="5"
							d="M14 27 L22 35 L38 19"
						/>
					</svg>
				</div>
			</div>
		</>
	);
};

export default SuccessPage;
