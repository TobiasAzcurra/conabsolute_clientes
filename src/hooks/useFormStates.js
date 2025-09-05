import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setEnvioExpress } from '../redux/cart/cartSlice';

export function useFormStates(expressDeliveryFee) {
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
  const [isOpenPaymentMethod, setIsOpenPaymentMethod] = useState(true);

  const dispatch = useDispatch();

  const handleExpressToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    dispatch(setEnvioExpress(newValue ? expressDeliveryFee : 0));
  };

  return {
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
