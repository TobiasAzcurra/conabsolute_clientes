// MenuPage.jsx

import React, { useEffect, useState } from "react";
import logo from "../../assets/Logo APM-07.png";
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
    // Navegar después de la animación completa
    const timer = setTimeout(() => {
      navigate("/menu/mates");
      if (onAnimationEnd) {
        onAnimationEnd();
      }
    }, 5000); // Duración total de la animación

    return () => clearTimeout(timer);
  }, [navigate, onAnimationEnd]);

  // Inyecta estilos en el encabezado del documento
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes skyMovement {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }

      @keyframes mateSlurp {
        0% {
          height: 15vh;
          opacity: 0.9;
          transform: translateX(-50%) translateY(0);
        }
        30% {
          height: 10vh;
          opacity: 1;
          transform: translateX(-50%) translateY(3vh);
        }
        60% {
          height: 5vh;
          opacity: 0.8;
          transform: translateX(-50%) translateY(8vh);
        }
        90% {
          height: 2vh;
          opacity: 0.6;
          transform: translateX(-50%) translateY(15vh);
        }
        100% {
          height: 0vh;
          opacity: 0;
          transform: translateX(-50%) translateY(18vh);
        }
      }

     @keyframes bombillaEffect {
  0% {
    transform: translateX(-50%) rotate(15deg) scaleX(1);
    opacity: 0.7;
  }
  50% {
    transform: translateX(-50%) rotate(15deg) scaleX(1.1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) rotate(15deg) scaleX(1);
    opacity: 0.8;
  }
}

      @keyframes mateBubbles {
        0% {
          transform: translateY(0) scale(0);
          opacity: 0;
        }
        20% {
          transform: translateY(-10px) scale(1);
          opacity: 0.8;
        }
        80% {
          transform: translateY(-40px) scale(1.2);
          opacity: 0.6;
        }
        100% {
          transform: translateY(-60px) scale(0);
          opacity: 0;
        }
      }

      @keyframes logoAppear {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.1);
          opacity: 0.8;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }

     

      /* Fondo celeste con movimiento suave */
      .sky-background {
        background: linear-gradient(135deg, #87CEEB 0%, #87CEFA 25%, #B0E0E6 50%, #ADD8E6 75%, #E0F6FF 100%);
        background-size: 300% 300%;
        animation: skyMovement 10s ease-in-out infinite;
        position: relative;
        overflow: hidden;
      }

      /* Efecto de mate siendo bebido */
      .mate-liquid {
        position: absolute;
        top: 45vh;
        left: 50%;
        width: 160px;
        background: linear-gradient(to bottom, 
          rgba(34, 139, 34, 0.9) 0%, 
          rgba(107, 142, 35, 1) 15%, 
          rgba(154, 205, 50, 0.9) 30%, 
          rgba(144, 238, 144, 0.8) 50%, 
          rgba(34, 139, 34, 0.7) 70%, 
          rgba(0, 100, 0, 0.5) 85%,
          rgba(0, 80, 0, 0.3) 100%);
        border-radius: 60px;
        animation: mateSlurp 4s ease-in-out 0s forwards;
        z-index: 1;
        filter: blur(6px);
        box-shadow: 0 0 20px rgba(34, 139, 34, 0.3);
      }

      /* Bombilla simulada */
     .bombilla-effect {
  position: absolute;
  top: 30vh;
  left: 50%;
  width: 8px;
  height: 13vh;
  background: linear-gradient(to bottom, 
    rgba(192, 192, 192, 0.8) 0%,
    rgba(169, 169, 169, 0.9) 50%,
    rgba(128, 128, 128, 0.7) 100%);
  border-radius: 4px;
  transform-origin: bottom center; /* Punto de rotación en la base */
  animation: bombillaEffect 4s 0s forwards;
  z-index: 2;
  filter: blur(1px);
}

      /* Burbujas del mate */
      .mate-bubble {
        position: absolute;
        background: rgba(144, 238, 144, 0.7);
        border-radius: 50%;
        animation: mateBubbles 3s ease-out infinite;
        z-index: 2;
      }

      .mate-bubble:nth-child(1) {
        left: 58%;
        top: 50vh;
        width: 24px;
        height: 24px;
        animation-delay: 0.5s;
      }

      .mate-bubble:nth-child(2) {
        left: 62%;
        top: 25vh;
        width: 8px;
        height: 8px;
        animation-delay: 1s;
      }

      .mate-bubble:nth-child(3) {
        left: 59%;
        top: 18vh;
        width: 6px;
        height: 6px;
        animation-delay: 1.5s;
      }

      .mate-bubble:nth-child(4) {
        left: 61%;
        top: 22vh;
        width: 10px;
        height: 10px;
        animation-delay: 2s;
      }

      /* Logo centrado */
      .logo-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
        animation: logoAppear 1s ease-out 0s forwards;
        opacity: 0;
      }
        /* Burbujas adicionales del mate */
.mate-bubble:nth-child(5) {
  left: 57%;
  top: 30vh;
  width: 12px;
  height: 12px;
  animation-delay: 0.8s;
}

.mate-bubble:nth-child(6) {
  left: 63%;
  top: 30vh;
  width: 6px;
  height: 6px;
  animation-delay: 1.2s;
}

.mate-bubble:nth-child(7) {
  left: 60.5%;
  top: 30vh;
  width: 8px;
  height: 8px;
  animation-delay: 1.8s;
}

.mate-bubble:nth-child(8) {
  left: 59.5%;
  top: 30vh;
  width: 10px;
  height: 10px;
  animation-delay: 2.3s;
}

.mate-bubble:nth-child(9) {
  left: 61.5%;
  top: 30vh;
  width: 5px;
  height: 5px;
  animation-delay: 0.3s;
}

.mate-bubble:nth-child(10) {
  left: 58.5%;
  top: 30vh;
  width: 7px;
  height: 7px;
  animation-delay: 1.6s;
}

.mate-bubble:nth-child(11) {
  left: 62.5%;
  top: 30vh;
  width: 9px;
  height: 9px;
  animation-delay: 2.8s;
}

.mate-bubble:nth-child(12) {
  left: 57.5%;
  top: 30vh;
  width: 4px;
  height: 4px;
  animation-delay: 0.6s;
}
      
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="sky-background flex items-center justify-center h-screen">
      {/* Efecto de bombilla */}
      <div className="bombilla-effect"></div>

      {/* Efecto de mate siendo bebido */}
      <div className="mate-liquid"></div>

      {/* Burbujas del mate */}
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>
      <div className="mate-bubble"></div>

      {/* Logo centrado que aparece después */}
      <div className="logo-container z-50">
        <img className="w-full" src={logo} alt="APM" />
      </div>
    </div>
  );
};

export default MenuPage;
