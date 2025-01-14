import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ListenOrdersForTodayByPhoneNumber } from '../firebase/getPedido';
import AppleModal from './AppleModal';

const OrderChecker = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe;
    
    const checkForActiveOrders = () => {
      const phoneNumber = localStorage.getItem('customerPhone');
      
      // Solo verificar si:
      // 1. Hay un número de teléfono guardado
      // 2. No estamos ya en la página de pedido
      // 3. No estamos en la ruta raíz
      if (phoneNumber && 
          !location.pathname.includes('/pedido') && 
          location.pathname !== '/') {
        
        unsubscribe = ListenOrdersForTodayByPhoneNumber(phoneNumber, (pedidos) => {
          const pedidosActivos = pedidos.filter(pedido => 
            !pedido.entregado && !pedido.canceled);
            
          if (pedidosActivos.length > 0 && !hasActiveOrder) {
            setHasActiveOrder(true);
            setIsModalOpen(true);
          }
        });
      }
    };

    checkForActiveOrders();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [location.pathname, hasActiveOrder]);

  const handleViewOrder = () => {
    const phoneNumber = localStorage.getItem('customerPhone');
    navigate('/pedido', { state: { phoneNumber } });
    setIsModalOpen(false);
  };

  return (
    <AppleModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title="Tenés un pedido en curso"
      twoOptions={true}
      onConfirm={handleViewOrder}
    >
      <p className='text-center '>¿Querés ver su estado?</p>
    </AppleModal>
  );
};

export default OrderChecker;