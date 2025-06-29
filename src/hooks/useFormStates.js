import { useState, useEffect } from 'react';
import { listenToAltaDemanda } from '../firebase/constants/altaDemanda';
import { useDispatch } from 'react-redux';
import { setEnvioExpress } from '../redux/cart/cartSlice';

export function useFormStates(expressDeliveryFee) {
  const [altaDemanda, setAltaDemanda] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showHighDemandModal, setShowHighDemandModal] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [isModalConfirmLoading, setIsModalConfirmLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isTimeRestrictedModalOpen, setIsTimeRestrictedModalOpen] =
    useState(false);
  const [isCloseRestrictedModalOpen, setIsCloseRestrictedModalOpen] =
    useState(false);
  const [isOpenPaymentMethod, setIsOpenPaymentMethod] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    let unsubscribe = null;
    const init = async () => {
      try {
        unsubscribe = listenToAltaDemanda((data) => {
          setAltaDemanda(data);
        });
      } catch (error) {
        console.error('❌ Error Alta Demanda:', error);
      }
    };
    init();
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    setIsOpenPaymentMethod(altaDemanda?.open || false);
  }, [altaDemanda]);

  const handleExpressToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    dispatch(setEnvioExpress(newValue ? expressDeliveryFee : 0));
  };

  return {
    altaDemanda,
    isEnabled,
    handleExpressToggle,
    showHighDemandModal,
    setShowHighDemandModal,
    pendingValues,
    setPendingValues,
    showOutOfStockModal,
    setShowOutOfStockModal,
    isModalConfirmLoading,
    setIsModalConfirmLoading,
    showMessageModal,
    setShowMessageModal,
    isTimeRestrictedModalOpen,
    setIsTimeRestrictedModalOpen,
    isCloseRestrictedModalOpen,
    setIsCloseRestrictedModalOpen,
    isOpenPaymentMethod,
  };
}
