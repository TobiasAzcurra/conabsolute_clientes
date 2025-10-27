// hooks/useFormStates.js - MIGRADO
import { useState } from "react";
import { useCart } from "../contexts/CartContext"; // ← NUEVO: Reemplaza Redux

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

  // ← CAMBIO: Reemplazar Redux con Context
  // OLD: const dispatch = useDispatch();
  const { setEnvioExpress } = useCart(); // ← NUEVO

  const handleExpressToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    // ← CAMBIO: Usar función del Context en lugar de dispatch
    // OLD: dispatch(setEnvioExpress(newValue ? expressDeliveryFee : 0));
    setEnvioExpress(newValue ? expressDeliveryFee : 0); // ← NUEVO
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
