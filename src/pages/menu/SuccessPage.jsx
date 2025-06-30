import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient } from '../../contexts/ClientContext';

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

          @keyframes backgroundMovement {
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

          .circle-animation {
            stroke-dasharray: 157;
            stroke-dashoffset: 157;
            animation: drawCircle 2s ease-out;
          }

          .check-animation {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: drawCheck 1s ease-out;
            animation-delay: 1s; /* Inicia después de que el círculo empiece */
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

          .blue-gradient-background {
            background: linear-gradient(135deg, #1E4F95 0%, #396FB7 25%, #2E5FA6 50%, #4479C4 75%, #5089D1 100%);
            background-size: 300% 300%;
            animation: backgroundMovement 8s ease-in-out infinite;
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
      <div className="blue-gradient-background flex items-center justify-center h-screen">
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
