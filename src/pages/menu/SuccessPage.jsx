import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useClient } from "../../contexts/ClientContext";

const SuccessPage = () => {
  const { slugEmpresa, slugSucursal } = useClient();
  const { orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/${slugEmpresa}/${slugSucursal}/pedido/${orderId}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      <style>
        {`
          @keyframes drawCircle {
            from {
              stroke-dashoffset: 157;
            }
            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes drawCheck {
            from {
              stroke-dashoffset: 50;
            }
            to {
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
            animation: drawCircle 2s ease-out;
          }

          .check-animation {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: drawCheck 1s ease-out;
            animation-delay: 1s;
          }

          .success-icon {
            animation: pulse 2s;
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
      <div className="bg-primary flex items-center justify-center h-screen">
        <div className="text-center">
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
        </div>
      </div>
    </>
  );
};

export default SuccessPage;
