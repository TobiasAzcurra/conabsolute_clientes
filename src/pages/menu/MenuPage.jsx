// MenuPage.jsx

import React, { useEffect, useState } from "react";
import logo from "../../assets/anheloTMwhite.png";
import { useLocation, useNavigate } from "react-router-dom";
import "animate.css/animate.min.css";

export const items = {
	burgers: "burgers",
	combos: "combos",
	papas: "papas",
	bebidas: "bebidas",
};

const MenuPage = ({ onAnimationEnd }) => {
	const { pathname } = useLocation();
	const navigate = useNavigate();

	const [selectedItem, setSelectedItem] = useState("");
	const [locationMenu, setLocationMenu] = useState(true);
	const [isFirstAnimation, setIsFirstAnimation] = useState(true);
	const [isSecondAnimation, setIsSecondAnimation] = useState(true);

	const handleItemClick = (item) => {
		setSelectedItem(item);
	};

	useEffect(() => {
		const pathParts = pathname.split("/");
		const lastPart = pathParts[pathParts.length - 1];

		if (selectedItem === "PROMOCIONES") {
			setSelectedItem("PROMOCIONES");
		} else {
			setSelectedItem(lastPart);
		}

		setLocationMenu(pathname.startsWith("/menu/"));
	}, [pathname, selectedItem]);

	useEffect(() => {
		// Cambia a la segunda parte después de que termine la primera animación
		if (isFirstAnimation) {
			const timer = setTimeout(() => {
				setIsFirstAnimation(false);
			}, 1000); // Duración de la primera animación en milisegundos
			return () => clearTimeout(timer);
		}
	}, [isFirstAnimation]);

	useEffect(() => {
		// Cambia a redireccionar después de que termine la segunda animación
		if (!isFirstAnimation && isSecondAnimation) {
			const timer = setTimeout(() => {
				setIsSecondAnimation(false);
				navigate("/menu/burgers"); // Redirige a /menu/burgers después de que termine la segunda animación
				if (onAnimationEnd) {
					onAnimationEnd(); // Notificar al Router que la animación ha terminado
				}
			}, 4000); // Duración de la segunda animación en milisegundos
			return () => clearTimeout(timer);
		}
	}, [isFirstAnimation, isSecondAnimation, navigate, onAnimationEnd]);

	// Inyecta estilos en el encabezado del documento
	useEffect(() => {
		const style = document.createElement("style");
		style.innerHTML = `
      @keyframes moveRightToLeft {
        0% {
          transform: translateX(100vw) scale(6);
        }
        100% {
          transform: translateX(-50vw) scale(6);
        }
      }

      @keyframes gradientAnimation {
        0% {
          background-position: 0% 20%;
        }
        50% {
          background-position: 20% 50%;
        }
        100% {
          background-position: 50% 50%;
        }
      }

      .moving-logo-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .moving-logo {
        position: absolute;
        top: 50%;
        left: 100%;
        transform: translate(-50%, -50%) scale(4);
        animation: moveRightToLeft 1s linear forwards;
        will-change: transform;
      }

      /* Primer degradado */
      .breathing-gradient-first {
        background: linear-gradient(100deg, #000000 0%, #200000 25%, #ff0000 100%, #000000 75%, #000000 100%);
        background-size: 200% 200%;
        animation: gradientAnimation 6s ease infinite;
      }

      /* Segundo degradado (vertical) */
      .breathing-gradient-second {
        background: linear-gradient(to bottom, #000000 0%, #000000 50%, #ff0000 100%);
        background-size: 200% 200%;
        animation: gradientAnimation 6s ease infinite;
      }

      /* Clase para el resplandor suave del logo */
      .logo-glow {
        /* Utiliza drop-shadow para resplandor alrededor de las letras */
        filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.6));
        /* Opcional: Añade múltiples drop-shadows para un resplandor más intenso */
        /* filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.4)); */
      }
    `;
		document.head.appendChild(style);
		return () => {
			document.head.removeChild(style);
		};
	}, []);

	return (
		<div
			className={`${
				isFirstAnimation
					? "breathing-gradient-first"
					: "breathing-gradient-second"
			} flex items-center justify-center h-screen`}
		>
			{isFirstAnimation ? (
				// Primera animación: Logo moviéndose de derecha a izquierda
				<div className="moving-logo-container">
					<img className="moving-logo logo-glow" src={logo} alt="ANHELO" />
				</div>
			) : isSecondAnimation ? (
				// Segunda parte: Contenido existente con animación de aparición
				<div className="text-center">
					<img
						className="mb-1 w-72 animate__animated animate__fadeInUp animate__slow logo-glow"
						src={logo}
						alt="ANHELO"
					/>
					<p className="text-gray-100 text-sm font-semibold animate__animated animate__fadeInUp font-coolvetica animate__slow animate__delay-2s">
						Vas a pedir más.
					</p>
				</div>
			) : null}
		</div>
	);
};

export default MenuPage;
