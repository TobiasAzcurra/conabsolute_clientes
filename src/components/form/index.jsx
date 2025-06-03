import { ErrorMessage, Field, Form, Formik } from "formik";
import MyTextInput from "./MyTextInput";
import validations from "./validations";
import handleSubmit from "./handleSubmit";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addLastCart, setEnvioExpress } from "../../redux/cart/cartSlice";
import { useEffect, useState, useMemo, useRef } from "react";
import { MapDirection } from "./MapDirection";
import AppleErrorMessage from "./AppleErrorMessage";
import {
  validarVoucher,
  canjearVouchers,
} from "../../firebase/validateVoucher";
import Payment from "../mercadopago/Payment";
import currencyFormat from "../../helpers/currencyFormat";
import { calculateDiscountedTotal } from "../../helpers/currencyFormat";
import isologo from "../../assets/isologo.png";
import {
  isWithinClosedDays,
  isWithinOrderTimeRange,
} from "../../helpers/validate-hours";
import LoadingPoints from "../LoadingPoints";
import Toggle from "../Toggle";
import AppleModal from "../AppleModal";
import { listenToAltaDemanda } from "../../firebase/readConstants";
import Tooltip from "../Tooltip";

const envio = parseInt(import.meta.env.VITE_ENVIO) || 2000;
const expressDeliveryFee = 2000;

// NUEVAS CONSTANTES Y FUNCIONES PARA CÓDIGOS ESPECIALES
const SPECIAL_CODES = ["AUTODROMOXANHELO", "ANHELOUSD"];

// Función helper para verificar si un código es especial
const isSpecialCode = (code) => {
  return SPECIAL_CODES.includes(code.toUpperCase());
};

// Función helper para obtener información del código especial
const getSpecialCodeInfo = (code) => {
  const upperCode = code.toUpperCase();

  switch (upperCode) {
    case "AUTODROMOXANHELO":
      return {
        discount: 0.5, // 50%
        message:
          "Este código aplica un 50% de descuento y no puede canjearse junto a más códigos",
        validMessage: "¡Código válido! (50% descuento)",
      };
    case "ANHELOUSD":
      return {
        discount: 0.5, // 30% por ejemplo
        message:
          "Este código aplica un 50% de descuento y no puede canjearse junto a más códigos",
        validMessage: "¡Código válido! (50% descuento)",
      };
    default:
      return null;
  }
};

const FormCustom = ({ cart, total }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formValidations = validations(total + envio);
  const [mapUrl, setUrl] = useState("");
  const [validarUbi, setValidarUbi] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [noEncontre, setNoEncontre] = useState(false);

  const [altaDemanda, setAltaDemanda] = useState(null);
  const [showHighDemandModal, setShowHighDemandModal] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);

  const [discountedTotal, setDiscountedTotal] = useState(total);
  const [couponCodes, setCouponCodes] = useState([""]);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);

  const [descuento, setDescuento] = useState(0);
  const [descuentoForOneUnit, setDescuentoForOneUnit] = useState(0);
  const [freeBurgerDiscount, setFreeBurgerDiscount] = useState(0);
  const [isModalConfirmLoading, setIsModalConfirmLoading] = useState(false);
  // Añadir este estado junto a los otros estados al inicio del componente FormCustom
  const [hasSpecialCode, setHasSpecialCode] = useState(false);

  const [voucherStatus, setVoucherStatus] = useState([""]);
  const [showCouponInput, setShowCouponInput] = useState(true);
  const [showReservaInput, setShowReservaInput] = useState(false);

  const [preferenceId, setPreferenceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const [isValidating, setIsValidating] = useState([false]);

  const [isTimeRestrictedModalOpen, setIsTimeRestrictedModalOpen] =
    useState(false);
  const [isCloseRestrictedModalOpen, setIsCloseRestrictedModalOpen] =
    useState(false);
  const [isOpenPaymentMethod, setIsOpenPaymentMethod] = useState(
    altaDemanda?.open || false
  );

  useEffect(() => {
    let unsubscribeAltaDemanda = null;

    const iniciarEscuchaAltaDemanda = async () => {
      try {
        unsubscribeAltaDemanda = listenToAltaDemanda((altaDemandaData) => {
          setAltaDemanda(altaDemandaData);
        });
      } catch (error) {
        console.error("❌ Error al conectar con Alta Demanda:", error);
      }
    };

    iniciarEscuchaAltaDemanda();

    return () => {
      if (unsubscribeAltaDemanda) {
        unsubscribeAltaDemanda();
      }
    };
  }, []);

  const handleExpressToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    dispatch(setEnvioExpress(newValue ? expressDeliveryFee : 0));
  };

  const processPedido = async (values, isReserva, message = "") => {
    try {
      const validCoupons = couponCodes.filter(
        (code, index) =>
          code.trim() !== "" &&
          (voucherStatus[index] === "¡Código válido!" ||
            voucherStatus[index] === "¡Código válido! (Hamburguesa gratis)" ||
            voucherStatus[index] === "¡Código válido! (50% descuento)")
      );

      if (validCoupons.length > 0) {
        const canjeSuccess = await canjearVouchers(validCoupons);
        if (!canjeSuccess) {
          console.error("Error al canjear los cupones");
          // return;
        }
      }

      let adjustedHora = values.hora;

      if (isReserva) {
        adjustedHora = adjustHora(values.hora);
      }

      if (altaDemanda?.isHighDemand && pendingValues) {
        const delayMinutes = altaDemanda.delayMinutes || 0;
        const currentTime = new Date();
        currentTime.setMinutes(currentTime.getMinutes() + delayMinutes);

        const adjustedHours = currentTime
          .getHours()
          .toString()
          .padStart(2, "0");
        const adjustedMinutes = currentTime
          .getMinutes()
          .toString()
          .padStart(2, "0");
        adjustedHora = `${adjustedHours}:${adjustedMinutes}`;
      }

      const updatedValues = {
        ...values,
        hora: adjustedHora,
        envioExpress: isEnabled ? expressDeliveryFee : 0,
      };

      // Calcular el descuento correcto
      let totalDiscount = descuento + freeBurgerDiscount;

      // Si hay código especial, usar su descuento en lugar del normal
      if (hasSpecialCode) {
        // Encontrar qué código especial está siendo usado
        const currentSpecialCode = couponCodes.find((code) =>
          isSpecialCode(code)
        );
        if (currentSpecialCode) {
          const specialCodeInfo = getSpecialCodeInfo(currentSpecialCode);
          console.log(
            `🔢 Calculando descuento especial para ${currentSpecialCode.toUpperCase()}`
          );

          // Calcular solo con productos no promocionales
          const { nonPromoProducts } = getPromoAndNonPromoProducts(cart);

          // Calcular total de productos no promocionales
          let nonPromoTotal = 0;
          nonPromoProducts.forEach((item) => {
            // Precio base * cantidad
            const basePrice = item.price * item.quantity;
            // Toppings * cantidad
            let toppingsPrice = 0;
            item.toppings.forEach((topping) => {
              toppingsPrice += topping.price * item.quantity;
            });

            nonPromoTotal += basePrice + toppingsPrice;
          });

          totalDiscount = Math.round(nonPromoTotal * specialCodeInfo.discount);
          console.log("💰 Descuento especial calculado:", totalDiscount);
        }
      }

      console.log("📊 Enviando pedido con descuento:", totalDiscount);

      const orderId = await handleSubmit(
        updatedValues,
        cart,
        discountedTotal,
        envio,
        mapUrl,
        couponCodes,
        totalDiscount, // Aquí usamos el descuento total correcto
        false,
        message,
        altaDemanda?.priceFactor || 1
      );

      if (orderId) {
        navigate(`/success/${orderId}`);
        dispatch(addLastCart());
      } else {
        console.error("Error al procesar la orden");
      }
    } catch (error) {
      console.error("Error al procesar el pedido:", error);
    }
  };

  const getTotalBurgers = (cartToCheck = cart) => {
    if (!Array.isArray(cartToCheck)) {
      console.error("Invalid cart passed to getTotalBurgers", cartToCheck);
      return 0;
    }
    const { nonPromoProducts } = getPromoAndNonPromoProducts(cartToCheck);
    return nonPromoProducts.reduce((sum, item) => {
      if (item.category === "burger" || item.category === "burgers") {
        return sum + item.quantity; // Asegúrate de multiplicar por la cantidad
      }
      return sum;
    }, 0);
  };

  const getBurgerPrices = (cartToCheck = cart) => {
    if (!Array.isArray(cartToCheck)) return [];
    const { nonPromoProducts } = getPromoAndNonPromoProducts(cartToCheck);
    const burgerPrices = [];
    nonPromoProducts.forEach((item) => {
      if (item.category === "burger" || item.category === "burgers") {
        for (let i = 0; i < item.quantity; i++) {
          burgerPrices.push(item.price);
        }
      }
    });
    return burgerPrices.sort((a, b) => a - b);
  };

  const getPromoAndNonPromoProducts = (cart) => {
    const promoProducts = cart.filter((item) => item.type === "promo");
    const nonPromoProducts = cart.filter((item) => item.type !== "promo");
    return { promoProducts, nonPromoProducts };
  };

  const addCouponField = () => {
    const totalNonPromoBurgers = getTotalBurgers();
    const freeVouchers = couponCodes.filter(
      (code, i) => voucherStatus[i] === "¡Código válido! (Hamburguesa gratis)"
    ).length;
    const normalVouchers = couponCodes.filter(
      (code, i) => voucherStatus[i] === "¡Código válido!"
    ).length;
    const remainingCapacity =
      totalNonPromoBurgers - freeVouchers - normalVouchers * 2;

    if (remainingCapacity > 0) {
      setCouponCodes((prev) => [...prev, ""]);
      setVoucherStatus((prev) => [...prev, ""]);
      setIsValidating((prev) => [...prev, false]);
    }
  };

  useEffect(() => {
    // Verificar si algún código especial ya no está presente en ningún campo
    const hasAnySpecialCode = couponCodes.some((code) => isSpecialCode(code));

    // Si hasSpecialCode es true pero ningún código especial está presente, resetearlo
    if (hasSpecialCode && !hasAnySpecialCode) {
      console.log("🔄 CÓDIGO ESPECIAL YA NO ESTÁ PRESENTE, RESETEANDO ESTADO");
      setHasSpecialCode(false);
    }
  }, [couponCodes, hasSpecialCode]);

  const handleCouponChange = (index, value, setFieldValue) => {
    const updatedCoupons = [...couponCodes];
    const oldValue = updatedCoupons[index]; // Guardar el valor anterior
    updatedCoupons[index] = value;

    // Verificar si estamos ingresando un código especial
    if (isSpecialCode(value)) {
      const specialCodeInfo = getSpecialCodeInfo(value);
      console.log(
        `🌟 CÓDIGO ESPECIAL ${value.toUpperCase()} - LIMPIANDO OTROS CÓDIGOS`
      );

      // Crear un nuevo array con un solo elemento que es el código especial
      const newCoupons = [""];
      newCoupons[0] = value;

      // Limpiar todos los estados relacionados con otros códigos
      setCouponCodes(newCoupons);
      setVoucherStatus([""]); // Lo actualizaremos más adelante
      setIsValidating([false]);
      setDescuento(0);
      setFreeBurgerDiscount(0);

      // Verificar si hay productos promocionales
      const { promoProducts } = getPromoAndNonPromoProducts(cart);

      // Crear un nuevo estado para el voucher
      const newVoucherStatus = [""];

      if (promoProducts.length > 0) {
        newVoucherStatus[0] = `El código '${value.toUpperCase()}' no puede aplicarse a productos en promoción.`;
        setHasSpecialCode(false);
      } else {
        // Aplicar el código especial
        newVoucherStatus[0] = specialCodeInfo.validMessage;
        setHasSpecialCode(true);

        // Calcular el descuento correspondiente
        const { nonPromoProducts } = getPromoAndNonPromoProducts(cart);
        let nonPromoTotal = 0;
        nonPromoProducts.forEach((item) => {
          const basePrice = item.price * item.quantity;
          let toppingsPrice = 0;
          item.toppings.forEach((topping) => {
            toppingsPrice += topping.price * item.quantity;
          });
          nonPromoTotal += basePrice + toppingsPrice;
        });

        const specialDiscount = Math.round(
          nonPromoTotal * specialCodeInfo.discount
        );
        console.log(
          `💰 Descuento especial calculado para ${value.toUpperCase()}:`,
          specialDiscount
        );
      }

      setVoucherStatus(newVoucherStatus);
      return;
    }

    // Si no es código especial, procedemos con la lógica normal
    setCouponCodes(updatedCoupons);

    // Verificar si el usuario está borrando un código especial
    if (isSpecialCode(oldValue) && !isSpecialCode(value)) {
      console.log("🔄 ELIMINANDO CÓDIGO ESPECIAL");
      setHasSpecialCode(false);
      const updatedVoucherStatus = [...voucherStatus];
      updatedVoucherStatus[index] = "";
      setVoucherStatus(updatedVoucherStatus);
      return;
    }

    // Resto de la lógica existente para códigos normales...
    const updatedVoucherStatus = [...voucherStatus];
    const updatedValidating = [...isValidating];
    if (updatedVoucherStatus.length <= index) updatedVoucherStatus.push("");
    if (updatedValidating.length <= index) updatedValidating.push(false);

    if (value.length < 5) {
      updatedVoucherStatus[index] = "Deben ser al menos 5 dígitos.";
    } else if (value.length === 5) {
      updatedVoucherStatus[index] = "";

      updatedValidating[index] = true;
      setIsValidating(updatedValidating);

      handleVoucherValidation(index, value, updatedCoupons, setFieldValue);
    } else {
      updatedVoucherStatus[index] =
        "El código debe tener exactamente 5 caracteres.";
    }

    setVoucherStatus(updatedVoucherStatus);
  };

  const handleVoucherValidation = async (
    index,
    value,
    updatedCoupons,
    setFieldValue
  ) => {
    console.log("🚀 INICIO DE VALIDACIÓN DE VOUCHER", {
      index,
      value,
      updatedCoupons,
      carrito: cart,
    });

    // Log detallado de cada producto en el carrito
    if (cart && cart.length > 0) {
      cart.forEach((item, i) => {
        console.log(`📦 PRODUCTO ${i + 1} EN CARRITO:`, {
          nombre: item.name,
          categoria: item.category,
          tipo: item.type,
          precio: item.price,
          cantidad: item.quantity,
          esSimpleOSatisfyer:
            item.name.toLowerCase().includes("simple") ||
            item.name.toLowerCase().includes("satisfyer"),
        });
      });
    }

    console.log("Estado isValidating ANTES:", isValidating);

    // Establecer el estado de validación a true
    setIsValidating((prev) => {
      const updated = [...prev];
      updated[index] = true;
      console.log("Nuevo estado isValidating que se va a establecer:", updated);
      return updated;
    });

    try {
      const totalBurgers = getTotalBurgers(cart);
      const burgerPrices = getBurgerPrices(cart);

      console.log("🍔 CONTEO DE HAMBURGUESAS:", {
        totalBurgers,
        burgerPrices,
      });

      const { promoProducts, nonPromoProducts } =
        getPromoAndNonPromoProducts(cart);

      console.log("📊 ANÁLISIS DEL CARRITO", {
        totalBurgers,
        burgerPrices,
        promoProducts,
        nonPromoProducts,
        totalEnCarrito: cart.length,
      });

      console.log("📊 ANÁLISIS DETALLADO DEL CARRITO", {
        elementosEnCarrito: cart.length,
        cantidadTotalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
        cantidadBurgersRegulares: nonPromoProducts.reduce(
          (sum, item) =>
            item.category === "burger" || item.category === "burgers"
              ? sum + item.quantity
              : sum,
          0
        ),
        cantidadBurgersPromo: promoProducts.reduce(
          (sum, item) =>
            item.category === "burger" || item.category === "burgers"
              ? sum + item.quantity
              : sum,
          0
        ),
      });

      if (updatedCoupons.indexOf(value) !== index) {
        const updatedVoucherStatus = [...voucherStatus];
        updatedVoucherStatus[index] = "Este código ya fue ingresado.";
        setVoucherStatus(updatedVoucherStatus);
        console.log("Código duplicado detectado", { updatedVoucherStatus });
        return;
      }

      if (promoProducts.length > 0 && nonPromoProducts.length === 0) {
        const updatedVoucherStatus = [...voucherStatus];
        updatedVoucherStatus[index] =
          "No se pueden aplicar vouchers a productos en promoción.";
        setVoucherStatus(updatedVoucherStatus);
        console.log("Solo productos promocionales", { updatedVoucherStatus });
        return;
      }

      console.log("⏳ LLAMANDO A validarVoucher CON CÓDIGO:", value);
      const validationResult = await validarVoucher(value);
      console.log("✅ RESULTADO DE VALIDACIÓN", validationResult);

      const { isValid, message, gratis } = validationResult;

      // Contar los vouchers gratis actuales
      const freeVouchers = updatedCoupons.filter((code, i) => {
        return (
          code.trim() !== "" &&
          voucherStatus[i] === "¡Código válido! (Hamburguesa gratis)"
        );
      }).length;

      // Contar los vouchers 2x1 actuales
      const normalVouchers = updatedCoupons.filter((code, i) => {
        return code.trim() !== "" && voucherStatus[i] === "¡Código válido!";
      }).length;

      console.log("📝 CONTEO DE VOUCHERS ACTUALES", {
        freeVouchers,
        normalVouchers,
        voucherStatus,
        updatedCoupons,
      });

      const updatedVoucherStatus = [...voucherStatus];

      if (!isValid) {
        updatedVoucherStatus[index] = message;
        setVoucherStatus(updatedVoucherStatus);
        console.log("❌ VOUCHER NO VÁLIDO:", { message, updatedVoucherStatus });
        return;
      }

      // Si es voucher gratis
      if (gratis) {
        console.log("🎟️ PROCESANDO VOUCHER GRATIS");

        // NUEVA VALIDACIÓN: Verificar si hay hamburguesas  "satisfyer" elegibles
        const eligibleBurgers = nonPromoProducts.filter((item) => {
          const lowerName = item.name.toLowerCase();
          const isSatisfyer = lowerName.includes("satisfyer");

          console.log(`🔍 Verificando elegibilidad de "${item.name}":`, {
            categoria: item.category,
            nombreEnMinúsculas: lowerName,
            contieneSatisfyer: isSatisfyer,
            esElegible:
              (item.category === "burger" || item.category === "burgers") &&
              isSatisfyer,
          });

          return (
            (item.category === "burger" || item.category === "burgers") &&
            isSatisfyer
          );
        });

        console.log("🍔 HAMBURGUESAS ELEGIBLES ENCONTRADAS:", eligibleBurgers);

        const totalElegibleBurgers = eligibleBurgers.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        console.log("🔢 RESUMEN DE HAMBURGUESAS ELEGIBLES:", {
          hamburgesasElegibles: eligibleBurgers,
          cantidadTotal: totalElegibleBurgers,
        });

        if (totalElegibleBurgers === 0) {
          updatedVoucherStatus[index] =
            "Para canjear un voucher gratis solo podes hacerlo con hamburguesas Satisfyer";
          setVoucherStatus(updatedVoucherStatus);
          console.log("⚠️ NO HAY HAMBURGUESAS ELEGIBLES PARA VOUCHER GRATIS", {
            updatedVoucherStatus,
          });
          return;
        }

        const totalFreeVouchers =
          freeVouchers +
          (updatedVoucherStatus[index] ===
          "¡Código válido! (Hamburguesa gratis)"
            ? 0
            : 1);

        console.log("🧮 CÁLCULO DE VOUCHERS GRATIS TOTALES:", {
          vouchersGratisActuales: freeVouchers,
          nuevoVoucherGratis:
            updatedVoucherStatus[index] !==
            "¡Código válido! (Hamburguesa gratis)",
          totalVouchersGratis: totalFreeVouchers,
        });

        if (totalFreeVouchers > totalElegibleBurgers) {
          updatedVoucherStatus[index] =
            "No hay suficientes hamburguesas simples para aplicar todos los vouchers gratis.";
          setVoucherStatus(updatedVoucherStatus);
          console.log("⚠️ INSUFICIENTES HAMBURGUESAS SIMPLES PARA VOUCHERS", {
            vouchersGratis: totalFreeVouchers,
            hamburguesasElegibles: totalElegibleBurgers,
            updatedVoucherStatus,
          });
          return;
        }

        updatedVoucherStatus[index] = "¡Código válido! (Hamburguesa gratis)";
        setVoucherStatus(updatedVoucherStatus);
        console.log("✅ VOUCHER GRATIS VALIDADO CORRECTAMENTE", {
          updatedVoucherStatus,
        });

        console.log("💰 RECALCULANDO DESCUENTOS CON NUEVA CONFIGURACIÓN:", {
          normalVouchers,
          totalFreeVouchers,
        });

        const discountResult = calculateDiscountedTotal(
          cart,
          normalVouchers,
          totalFreeVouchers
        );

        console.log("📊 RESULTADO DEL CÁLCULO DE DESCUENTOS:", discountResult);

        setFreeBurgerDiscount(discountResult.freeBurgerDiscount);
        console.log("💰 DESCUENTO POR HAMBURGUESAS GRATIS ACTUALIZADO", {
          nuevoDescuento: discountResult.freeBurgerDiscount,
        });

        setDescuento(discountResult.totalDescuento);
        setDiscountedTotal(discountResult.newTotal);

        console.log("🏁 DESCUENTOS FINALES RECALCULADOS", {
          nuevoTotal: discountResult.newTotal,
          descuento2x1: discountResult.totalDescuento,
          descuentoGratis: discountResult.freeBurgerDiscount,
          totalConDescuento: discountResult.newTotal,
        });
      }
      // Si es voucher 2x1
      else {
        console.log("2️⃣✖️1️⃣ PROCESANDO VOUCHER 2x1");

        const numCoupons =
          normalVouchers +
          (updatedVoucherStatus[index] === "¡Código válido!" ? 0 : 1);

        console.log("🧮 CONTEO TOTAL DE VOUCHERS 2x1:", {
          numCoupons,
          normalVouchersActuales: normalVouchers,
          nuevoVoucher2x1: updatedVoucherStatus[index] !== "¡Código válido!",
          burgersPorParejas: numCoupons * 2,
        });

        // Obtener todas las hamburguesas disponibles después de aplicar vouchers gratis
        // Primero, filtrar las hamburguesas elegibles para vouchers gratis
        const eligibleForFree = nonPromoProducts
          .filter(
            (item) =>
              (item.category === "burger" || item.category === "burgers") &&
              (item.name.toLowerCase().includes("simple") ||
                item.name.toLowerCase().includes("satisfyer"))
          )
          .reduce((sum, item) => sum + item.quantity, 0);

        console.log("🍔 HAMBURGUESAS ELEGIBLES PARA GRATIS:", {
          cantidad: eligibleForFree,
          detalles: nonPromoProducts.filter(
            (item) =>
              (item.category === "burger" || item.category === "burgers") &&
              (item.name.toLowerCase().includes("simple") ||
                item.name.toLowerCase().includes("satisfyer"))
          ),
        });

        // Determinar cuántas hamburguesas elegibles se utilizarán para vouchers gratis
        const freeVouchersToApply = Math.min(freeVouchers, eligibleForFree);

        // Calcular las hamburguesas disponibles para 2x1 (excluyendo las usadas para gratis)
        const totalNonPromoBurgers = getTotalBurgers(nonPromoProducts);
        const availableBurgers = totalNonPromoBurgers - freeVouchersToApply;

        console.log("🍔 HAMBURGUESAS DISPONIBLES PARA 2x1", {
          totalBurgersNoPromo: totalNonPromoBurgers,
          elegiblesParaGratis: eligibleForFree,
          usadasPorVouchersGratis: freeVouchersToApply,
          disponiblesParaVouchers2x1: availableBurgers,
        });

        // Verificar si hay suficientes hamburguesas disponibles para este voucher 2x1
        if (availableBurgers < numCoupons * 2) {
          updatedVoucherStatus[index] = `Necesitas al menos ${
            numCoupons * 2
          } hamburguesas no promocionales disponibles para canjear los vouchers 2x1. Ya usaste ${freeVouchersToApply} con vouchers gratis.`;
          setVoucherStatus(updatedVoucherStatus);
          console.log("⚠️ NO HAY SUFICIENTES HAMBURGUESAS PARA 2x1", {
            updatedVoucherStatus,
          });
          return;
        }

        if (promoProducts.length > 0 && nonPromoProducts.length > 0) {
          const hasEnoughNonPromoBurgers = availableBurgers >= numCoupons * 2;
          console.log("🔍 VERIFICANDO HAMBURGUESAS NO PROMOCIONALES PARA 2x1", {
            hasEnoughNonPromoBurgers,
            required: numCoupons * 2,
            totalNonPromoBurgers,
            disponibles: availableBurgers,
          });

          if (!hasEnoughNonPromoBurgers) {
            updatedVoucherStatus[index] = `Necesitas al menos ${
              numCoupons * 2
            } hamburguesas no promocionales disponibles para canjear los vouchers 2x1. Ya usaste ${freeVouchersToApply} con vouchers gratis.`;
            setVoucherStatus(updatedVoucherStatus);
            console.log(
              "⚠️ NO HAY SUFICIENTES HAMBURGUESAS NO PROMOCIONALES PARA 2x1",
              { updatedVoucherStatus }
            );
            return;
          }
        }

        if (totalBurgers < numCoupons * 2) {
          updatedVoucherStatus[index] = `Necesitas al menos ${
            numCoupons * 2
          } hamburguesas para canjear los vouchers 2x1.`;
          setVoucherStatus(updatedVoucherStatus);
          console.log("⚠️ NO HAY SUFICIENTES HAMBURGUESAS TOTALES PARA 2x1", {
            updatedVoucherStatus,
          });
          return;
        }

        updatedVoucherStatus[index] = "¡Código válido!";
        setVoucherStatus(updatedVoucherStatus);
        console.log("✅ VOUCHER 2x1 VÁLIDO", { updatedVoucherStatus });

        console.log("💰 RECALCULANDO DESCUENTOS CON VOUCHERS 2x1:", {
          numCoupons,
          freeVouchers,
        });

        const discountResult = calculateDiscountedTotal(
          cart,
          numCoupons,
          freeVouchers
        );

        console.log(
          "📊 RESULTADO DEL CÁLCULO DE DESCUENTOS 2x1:",
          discountResult
        );

        if (descuentoForOneUnit === 0) {
          setDescuentoForOneUnit(discountResult.totalDescuento / numCoupons);
          console.log("💰 DESCUENTO POR UNIDAD ESTABLECIDO:", {
            descuentoPorUnidad: discountResult.totalDescuento / numCoupons,
          });
        }

        setDescuento(discountResult.totalDescuento);
        setFreeBurgerDiscount(discountResult.freeBurgerDiscount);
        setDiscountedTotal(discountResult.newTotal);

        console.log("🏁 DESCUENTOS 2x1 RECALCULADOS", {
          nuevoTotal: discountResult.newTotal,
          descuento2x1: discountResult.totalDescuento,
          descuentoGratis: discountResult.freeBurgerDiscount,
        });
      }

      // Agregar un nuevo campo si es el último voucher válido y hay capacidad
      const totalNonPromoBurgers = getTotalBurgers(nonPromoProducts);
      if (
        (updatedVoucherStatus[index] === "¡Código válido!" ||
          updatedVoucherStatus[index] ===
            "¡Código válido! (Hamburguesa gratis)") &&
        index === updatedCoupons.length - 1 &&
        updatedCoupons.length < totalNonPromoBurgers
      ) {
        console.log("➕ AGREGANDO NUEVO CAMPO DE CUPÓN");
        addCouponField();
      }

      console.log("🧮 ESTADO FINAL DE DESCUENTOS", {
        descuento,
        freeBurgerDiscount,
        totalOriginal: total,
        totalConDescuento: discountedTotal,
      });

      console.log("📋 ESTADO FINAL DE VOUCHER STATUS", {
        updatedVoucherStatus,
      });
      setVoucherStatus(updatedVoucherStatus);
    } catch (error) {
      console.error("❌ ERROR EN VALIDACIÓN DE VOUCHER:", error);
      const updatedVoucherStatus = [...voucherStatus];
      updatedVoucherStatus[index] = "Error al validar el cupón.";
      setVoucherStatus(updatedVoucherStatus);
    } finally {
      setIsValidating((prev) => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
      console.log("🏁 FIN DE VALIDACIÓN DE VOUCHER");
    }
  };

  // Añade este effect al componente para monitorear los cambios de estado
  useEffect(() => {
    console.log("Estado de descuentos sincronizado:", {
      descuento,
      freeBurgerDiscount,
      total,
      discountedTotal,
    });
  }, [descuento, freeBurgerDiscount, total, discountedTotal]);

  useEffect(() => {
    let hasInvalidVoucher = false;
    let validCouponCount = 0;

    voucherStatus.forEach((v, index) => {
      if (
        v !== "¡Código válido!" &&
        v !== "¡Código válido! (Hamburguesa gratis)"
      ) {
        hasInvalidVoucher = true;
      } else {
        validCouponCount++;
      }
    });

    if (hasInvalidVoucher && (descuento !== 0 || freeBurgerDiscount !== 0)) {
      const newDescuento = descuentoForOneUnit * validCouponCount;
      setDescuento(newDescuento);
      setDiscountedTotal(total - newDescuento - freeBurgerDiscount);
    }
  }, [
    voucherStatus,
    setDescuento,
    setDiscountedTotal,
    descuento,
    freeBurgerDiscount,
    total,
    cart,
  ]);

  useEffect(() => {
    setDiscountedTotal(total);
  }, [total]);

  const [selectedHora, setSelectedHora] = useState("");

  const handleChange = (event) => {
    setSelectedHora(event.target.value);
  };

  const adjustHora = (hora) => {
    const [hours, minutes] = hora.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() - 30);

    const adjustedHours = date.getHours().toString().padStart(2, "0");
    const adjustedMinutes = date.getMinutes().toString().padStart(2, "0");
    const adjustedTime = `${adjustedHours}:${adjustedMinutes}`;
    return adjustedTime;
  };

  const getAvailableTimeSlots = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const allTimeSlots = [
      "20:30",
      "21:00",
      "21:30",
      "22:00",
      "22:30",
      "23:00",
      "23:30",
    ];

    const nextSlotMinutes =
      Math.ceil((currentHour * 60 + currentMinute) / 30) * 30 + 30;
    const nextSlotHour = Math.floor(nextSlotMinutes / 60);
    const nextSlotMinute = nextSlotMinutes % 60;

    return allTimeSlots.filter((timeSlot) => {
      let [slotHour, slotMinute] = timeSlot.split(":").map(Number);
      if (slotHour === 0) slotHour = 24;
      const slotTimeInMinutes = slotHour * 60 + slotMinute;
      const nextValidTimeInMinutes = nextSlotHour * 60 + nextSlotMinute;
      return slotTimeInMinutes >= nextValidTimeInMinutes;
    });
  };

  const TimeSelector = ({ selectedHora, handleChange, setFieldValue }) => {
    const availableTimeSlots = useMemo(getAvailableTimeSlots, []);

    return (
      <Field
        as="select"
        name="hora"
        className={`custom-select text-xs font-light ${
          selectedHora === "" ? "text-gray-400" : "text-black"
        }`}
        value={selectedHora}
        onChange={(e) => {
          handleChange(e);
          setFieldValue("hora", e.target.value);
        }}
      >
        <option value="" disabled>
          ¿Quieres reservar para más tarde?
        </option>
        {availableTimeSlots.map((timeSlot) => (
          <option key={timeSlot} value={timeSlot}>
            {timeSlot}
          </option>
        ))}
      </Field>
    );
  };

  const openTimeRestrictedModal = () => {
    setIsTimeRestrictedModalOpen(true);
  };

  const closeTimeRestrictedModal = () => {
    setIsTimeRestrictedModalOpen(false);
  };

  const openCloseModal = () => {
    setIsCloseRestrictedModalOpen(true);
  };

  const closeCloseRestrictedModal = () => {
    setIsCloseRestrictedModalOpen(false);
  };

  const calculateProductsTotal = () => {
    let productsTotal = 0;
    let totalToppings = 0;
    cart.forEach(({ price, quantity, toppings }) => {
      productsTotal += price * quantity;
      toppings.forEach(({ price }) => {
        totalToppings += price * quantity;
      });
    });
    return productsTotal + totalToppings;
  };

  useEffect(() => {
    setIsOpenPaymentMethod(altaDemanda?.open || false);
  }, [altaDemanda]);

  const prevCartRef = useRef(null);

  // Efecto para reiniciar vouchers cuando cambia el carrito
  useEffect(() => {
    console.log("🛒 DETECTADO CAMBIO EN EL CARRITO");

    // Si no es la primera vez que se ejecuta el efecto
    if (prevCartRef.current !== null) {
      console.log("🔍 VERIFICANDO CAMBIOS EN EL CARRITO", {
        cartAnteriorLength: prevCartRef.current.length,
        cartActualLength: cart.length,
        cambioDetectado:
          JSON.stringify(prevCartRef.current) !== JSON.stringify(cart),
      });

      // Verificar si hay vouchers aplicados
      const hayVouchersAplicados =
        couponCodes.some((code) => code.trim() !== "") ||
        descuento > 0 ||
        freeBurgerDiscount > 0;

      // Verificar si el carrito realmente cambió
      const cartCambio =
        JSON.stringify(prevCartRef.current) !== JSON.stringify(cart);

      console.log("📝 ESTADO DE VOUCHERS", {
        couponCodes,
        voucherStatus,
        descuento,
        freeBurgerDiscount,
        hayVouchersAplicados,
        cartCambio,
      });

      if (hayVouchersAplicados && cartCambio) {
        console.log("⚠️ REINICIANDO VOUCHERS DEBIDO A CAMBIOS EN EL CARRITO");

        // Reiniciar todos los estados relacionados con vouchers
        setCouponCodes([""]);
        setVoucherStatus([""]);
        setDescuento(0);
        setFreeBurgerDiscount(0);
        setDiscountedTotal(total);
        setIsValidating([false]);
        setDescuentoForOneUnit(0);

        console.log("✅ VOUCHERS REINICIADOS", {
          nuevosCouponCodes: [""],
          nuevosVoucherStatus: [""],
          nuevoDescuento: 0,
          nuevoFreeBurgerDiscount: 0,
          nuevoDiscountedTotal: total,
        });

        setHasSpecialCode(false);

        // Opcional: mostrar algún tipo de feedback al usuario
        // Si estás usando react-hot-toast u otra librería de notificaciones:
        // toast.info("Los cupones se han eliminado debido a cambios en tu carrito");
      } else if (cartCambio) {
        console.log("ℹ️ NO HAY VOUCHERS APLICADOS, NO ES NECESARIO REINICIAR");
      } else {
        console.log("🔄 NO SE DETECTARON CAMBIOS REALES EN EL CARRITO");
      }
    } else {
      console.log("🔄 PRIMERA CARGA DEL CARRITO, NO HAY ACCIÓN REQUERIDA");
    }

    // Actualizar la referencia al carrito actual para la próxima comparación
    prevCartRef.current = JSON.parse(JSON.stringify(cart));
  }, [cart, couponCodes, descuento, freeBurgerDiscount, total]);

  const calculateSpecialDiscount = () => {
    if (!hasSpecialCode) return 0;

    // Encontrar qué código especial está siendo usado
    const currentSpecialCode = couponCodes.find((code) => isSpecialCode(code));
    if (!currentSpecialCode) return 0;

    const specialCodeInfo = getSpecialCodeInfo(currentSpecialCode);
    if (!specialCodeInfo) return 0;

    // Calcular solo con productos no promocionales
    const { nonPromoProducts } = getPromoAndNonPromoProducts(cart);

    // Calcular total de productos no promocionales
    let nonPromoTotal = 0;
    nonPromoProducts.forEach((item) => {
      // Precio base * cantidad
      const basePrice = item.price * item.quantity;
      // Toppings * cantidad
      let toppingsPrice = 0;
      item.toppings.forEach((topping) => {
        toppingsPrice += topping.price * item.quantity;
      });

      nonPromoTotal += basePrice + toppingsPrice;
    });

    // Calcular descuento según el porcentaje del código
    return Math.round(nonPromoTotal * specialCodeInfo.discount);
  };

  return (
    <div className="flex mt-2 mr-4 mb-10 min-h-screen ml-4 flex-col">
      <style>{`
        .custom-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background: transparent;
          padding: 0;
          width: 100%;
          height: 40px;
          border: none;
          outline: none;
          font-size: 0.75rem;
        }
        .custom-select::placeholder {
          color: rgba(0, 0, 0, 0.5);
        }
      `}</style>
      <Formik
        initialValues={{
          subTotal: discountedTotal,
          phone: "",
          deliveryMethod: "delivery",
          references: "",
          paymentMethod: "efectivo",
          money: "",
          address: "",
          hora: "",
          efectivoCantidad: 0,
          mercadopagoCantidad: 0,
          aclaraciones: "",
        }}
        validationSchema={formValidations}
        onSubmit={async (values) => {
          if (altaDemanda?.message && altaDemanda.message !== "") {
            setPendingValues(values);
            setShowMessageModal(true);
            return;
          }

          if (altaDemanda?.out) {
            setShowOutOfStockModal(true);
            return;
          }

          if (!altaDemanda?.open) {
            if (values.paymentMethod === "mercadopago") {
              setFieldValue("paymentMethod", "efectivo");
            }
            setPendingValues({ ...values, paymentMethod: "efectivo" });
            openCloseModal();
            return;
          }

          const isReserva = values.hora.trim() !== "";
          if (!isReserva && altaDemanda?.isHighDemand) {
            setPendingValues(values);
            setShowHighDemandModal(true);
            return;
          }

          if (!isWithinOrderTimeRange()) {
            openTimeRestrictedModal();
            return;
          }

          if (values.paymentMethod === "efectivo") {
            await processPedido(values, isReserva);
          } else if (values.paymentMethod === "mercadopago") {
            // await processPedido(values, isReserva);
          }
        }}
      >
        {({
          getFieldProps,
          isSubmitting,
          setFieldValue,
          values,
          submitForm,
          isValid,
        }) => {
          const calculateFinalTotal = () => {
            let finalTotal = calculateProductsTotal();

            // Aplicar descuento del código especial (50%)
            if (hasSpecialCode) {
              // Calcular solo con productos no promocionales
              const { promoProducts, nonPromoProducts } =
                getPromoAndNonPromoProducts(cart);

              // Calcular total de productos no promocionales
              let nonPromoTotal = 0;
              nonPromoProducts.forEach((item) => {
                // Precio base * cantidad
                const basePrice = item.price * item.quantity;
                // Toppings * cantidad
                let toppingsPrice = 0;
                item.toppings.forEach((topping) => {
                  toppingsPrice += topping.price * item.quantity;
                });

                nonPromoTotal += basePrice + toppingsPrice;
              });

              // Aplicar descuento del 50%
              finalTotal -= Math.round(nonPromoTotal * 0.5);
            } else {
              // Descuentos normales para vouchers estándar
              finalTotal -= descuento + freeBurgerDiscount;
            }

            // Añadir costos de envío y express si corresponde
            if (values.deliveryMethod === "delivery") {
              finalTotal += envio;
            }
            if (isEnabled) {
              finalTotal += expressDeliveryFee;
            }

            return finalTotal;
          };

          return (
            <Form>
              <div className="flex flex-col mb-2">
                <div className="flex justify-center flex-col mt-7 items-center">
                  <p className="text-2xl font-bold mb-2">
                    Datos para la entrega
                  </p>
                  <div className="flex flex-row w-full gap-2 mb-4">
                    <button
                      type="button"
                      className={`h-20 flex-1 font-bold items-center flex justify-center gap-2 rounded-lg ${
                        values.deliveryMethod === "delivery"
                          ? "bg-black text-gray-100"
                          : "bg-gray-300 text-black"
                      }`}
                      onClick={() =>
                        setFieldValue("deliveryMethod", "delivery")
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 500 500"
                        className="h-8"
                      >
                        <path
                          d="M76.849,210.531C34.406,210.531,0,244.937,0,287.388c0,42.438,34.406,76.847,76.849,76.847 c30.989,0,57.635-18.387,69.789-44.819l18.258,14.078c0,0,134.168,0.958,141.538-3.206c0,0-16.65-45.469,4.484-64.688 c2.225-2.024,5.021-4.332,8.096-6.777c-3.543,8.829-5.534,18.45-5.534,28.558c0,42.446,34.403,76.846,76.846,76.846 c42.443,0,76.843-34.415,76.843-76.846c0-42.451-34.408-76.849-76.843-76.849c-0.697,0-1.362,0.088-2.056,0.102 c5.551-3.603,9.093-5.865,9.093-5.865l-5.763-5.127c0,0,16.651-3.837,12.816-12.167c-3.848-8.33-44.19-58.28-44.19-58.28 s7.146-15.373-7.634-26.261l-7.098,15.371c0,0-18.093-12.489-25.295-10.084c-7.205,2.398-18.005,3.603-21.379,8.884l-3.358,3.124 c0,0-0.95,5.528,4.561,13.693c0,0,55.482,17.05,58.119,29.537c0,0,3.848,7.933-12.728,9.844l-3.354,4.328l-8.896,0.479 l-16.082-36.748c0,0-15.381,4.082-23.299,10.323l1.201,6.24c0,0-64.599-43.943-125.362,21.137c0,0-44.909,12.966-76.37-26.897 c0,0-0.479-12.968-76.367-10.565l5.286,5.524c0,0-5.286,0.479-7.444,3.841c-2.158,3.358,1.2,6.961,18.494,6.961 c0,0,39.153,44.668,69.17,42.032l42.743,20.656l18.975,32.42c0,0,0.034,2.785,0.23,7.045c-4.404,0.938-9.341,1.979-14.579,3.09 C139.605,232.602,110.832,210.531,76.849,210.531z M390.325,234.081c29.395,0,53.299,23.912,53.299,53.299 c0,29.39-23.912,53.294-53.299,53.294c-29.394,0-53.294-23.912-53.294-53.294C337.031,257.993,360.932,234.081,390.325,234.081z M76.849,340.683c-29.387,0-53.299-23.913-53.299-53.295c0-29.395,23.912-53.299,53.299-53.299 c22.592,0,41.896,14.154,49.636,34.039c-28.26,6.011-56.31,11.99-56.31,11.99l3.619,19.933l55.339-2.444 C124.365,322.116,102.745,340.683,76.849,340.683z M169.152,295.835c1.571,5.334,3.619,9.574,6.312,11.394l-24.696,0.966 c1.058-3.783,1.857-7.666,2.338-11.662L169.152,295.835z"
                          fill="currentColor"
                        />
                      </svg>
                      Delivery
                    </button>
                    <button
                      type="button"
                      className={`h-20 flex-1 flex-col font-bold items-center flex justify-center rounded-lg ${
                        values.deliveryMethod === "takeaway"
                          ? "bg-black text-gray-100"
                          : "bg-gray-300 text-black"
                      }`}
                      onClick={() =>
                        setFieldValue("deliveryMethod", "takeaway")
                      }
                    >
                      <div className="flex flex-row items-center gap-2">
                        <img
                          src={isologo}
                          className={`h-4 ${
                            values.deliveryMethod === "takeaway"
                              ? "invert brightness-0"
                              : "brightness-0"
                          }`}
                          alt=""
                        />
                        <p className="font-bold text-">Retiro</p>
                      </div>
                      <p className="font-light text-xs">
                        por Mitre 614, Río Cuarto
                        <br />
                        Córdoba, Argentina
                      </p>
                    </button>
                  </div>
                  <div className="w-full items-center rounded-3xl border-2 border-black transition-all duration-300">
                    {values.deliveryMethod === "delivery" && (
                      <>
                        <MapDirection
                          setUrl={setUrl}
                          setValidarUbi={setValidarUbi}
                          setNoEncontre={setNoEncontre}
                          setFieldValue={setFieldValue}
                        />
                        <ErrorMessage
                          name="address"
                          component={AppleErrorMessage}
                        />
                        {noEncontre && (
                          <div className="flex flex-row justify-between px-3 h-10 items-center">
                            <div className="flex flex-row gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-6"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <MyTextInput
                                name="address"
                                type="text"
                                placeholder="Tu dirección"
                                className="bg-white font-light text-opacity-20 text-black outline-none px-2"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex flex-row border-t border-black border-opacity-20 gap-2 pl-3 h-10 items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-6"
                          >
                            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                          </svg>
                          <MyTextInput
                            label="Referencias"
                            name="references"
                            type="text"
                            placeholder="¿Referencias sobre la direccion? Ej: Casa de portón negro"
                            autoComplete="off"
                            className="bg-transparent text-xs font-light px-0 h-10 text-opacity-20 outline-none w-full"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex flex-row justify-between px-3 h-auto items-start border-y border-black border-opacity-20">
                      <div className="flex flex-row w-full items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-6"
                        >
                          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                        </svg>
                        <MyTextInput
                          label="Aclaraciones"
                          name="aclaraciones"
                          type="text"
                          placeholder="¿Aclaraciones sobre el pedido? Ej: La simple vegetariana"
                          autoComplete="off"
                          className="bg-transparent font-light text-xs px-0 h-10 text-opacity-20 outline-none w-full"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      {couponCodes.map((coupon, index) => (
                        <div
                          key={index}
                          className={`flex flex-col w-full transition-all duration-300 ${
                            index !== 0
                              ? "border-t border-black border-opacity-20"
                              : ""
                          }`}
                        >
                          <div className="flex flex-row gap-2 px-3 items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-6"
                            >
                              <path
                                fillRule="evenodd"
                                d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <MyTextInput
                              name={`couponCode${index}`}
                              type="text"
                              placeholder={
                                index === 0
                                  ? "¿Tenes algun codigo de descuento?"
                                  : "¿Tenes otro cupón?"
                              }
                              value={couponCodes[index]}
                              onChange={(e) => {
                                handleCouponChange(
                                  index,
                                  e.target.value,
                                  setFieldValue
                                );
                              }}
                              className="bg-transparent text-xs font-light px-0 h-10 text-opacity-20 outline-none w-full"
                            />
                            {console.log(
                              "Durante renderizado, isValidating[" +
                                index +
                                "] =",
                              isValidating[index]
                            )}

                            {isValidating[index] ? (
                              <div
                                className="inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-black"
                                role="status"
                              >
                                <span className="sr-only">Loading...</span>
                              </div>
                            ) : voucherStatus[index] === "¡Código válido!" ||
                              voucherStatus[index] ===
                                "¡Código válido! (Hamburguesa gratis)" ||
                              (isSpecialCode(couponCodes[index]) &&
                                hasSpecialCode) ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="green"
                                className="h-6"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.828 16.172a.75.75 0 0 1-1.06 0L5.47 11.875a.75.75 0 0 1 1.06-1.06l3.298 3.297 6.364-6.364a.75.75 0 1 1 1.06 1.06l-7.425 7.425Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : null}
                          </div>

                          {voucherStatus[index] &&
                            voucherStatus[index] !== "¡Código válido!" &&
                            voucherStatus[index] !==
                              "¡Código válido! (Hamburguesa gratis)" &&
                            voucherStatus[index] !==
                              "¡Código válido! (50% descuento)" &&
                            !(
                              couponCodes[index]
                                .toUpperCase()
                                .includes("AUTODROMO" || "ANHELO") &&
                              voucherStatus[index] === "Cupón no encontrado"
                            ) && (
                              <AppleErrorMessage voucher={true}>
                                {voucherStatus[index]}
                              </AppleErrorMessage>
                            )}
                          {/* Nuevo mensaje informativo para el código AUTODROMOXANHELO */}
                          {couponCodes[index].toUpperCase() ===
                            "AUTODROMOXANHELO" ||
                            ("ANHELOUSD" && hasSpecialCode && (
                              <div className="bg-green-500 text-white text-[10px] text-center p-4 py-1 ">
                                Este código aplica un 50% de descuento y no
                                puede canjearse junto a más códigos
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                    <div
                      className={`flex flex-col border-t border-black border-opacity-20 items-center transition-all duration-300 ${
                        values.deliveryMethod === "delivery" ? "" : ""
                      }`}
                    >
                      <div className="flex flex-row items-center pl-3 gap-2 w-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-6"
                        >
                          <path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
                          <path
                            fillRule="evenodd"
                            d="M8.625.75A3.375 3.375 0 0 0 5.25 4.125v15.75a3.375 3.375 0 0 0 3.375 3.375h6.75a3.375 3.375 0 0 0 3.375-3.375V4.125A3.375 3.375 0 0 0 15.375.75h-6.75ZM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 0 1 7.5 19.875V4.125Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <MyTextInput
                          name="phone"
                          type="text"
                          placeholder="Tu número de teléfono"
                          autoComplete="phone"
                          className="bg-transparent text-xs font-light px-0 h-10 text-opacity-20 outline-none w-full"
                        />
                      </div>
                      <div className="w-full">
                        <ErrorMessage
                          name="phone"
                          render={(msg) => (
                            <AppleErrorMessage>{msg}</AppleErrorMessage>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex flex-row justify-between px-3 h-auto items-start border-t border-black border-opacity-20">
                      <div className="flex flex-row items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-6"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <TimeSelector
                          selectedHora={selectedHora}
                          handleChange={handleChange}
                          setFieldValue={setFieldValue}
                        />
                        <ErrorMessage
                          name="hora"
                          component="span"
                          className="text-sm text-red-main font-coolvetica font-light mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center flex-col mt-6 items-center">
                  <p className="text-2xl font-bold w-full text-center">
                    Resumen
                  </p>
                  <div className="w-full flex flex-row justify-between items-center mb-4 mt-4">
                    <div className="flex flex-row items-center gap-2">
                      <Tooltip
                        text={`Si priorizas la <b>velocidad</b>, esta opcion es para vos: Tu pedido pasa al frente de la fila en cocinarse y, en caso de delivery, tu cadete sale solo con tu pedido. <br/> Si priorizas la <b>accesibilidad</b>, sin marcar esta opcion tu entrega sigue siendo lo mas eficiente posible.`}
                        duration={10000}
                        className="flex items-center"
                      />
                      <p className="font-coolvetica flex flex-row items-center gap-1">
                        Lo mas rapido posible
                        <p className="font-bold ">(+$2000)</p>
                      </p>
                    </div>
                    <Toggle isOn={isEnabled} onToggle={handleExpressToggle} />
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <p>Productos</p>
                    <p>{currencyFormat(calculateProductsTotal())}</p>
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <div className="flex flex-row items-center gap-2">
                      <Tooltip
                        text={`Mismo valor a toda la ciudad, independientemente de que tan lejos estes.`}
                        duration={10000}
                        className="flex items-center"
                      />
                      <p className="font-coolvetica flex flex-row items-center gap-1">
                        Envio
                      </p>
                    </div>
                    <p>
                      {values.deliveryMethod === "delivery"
                        ? currencyFormat(envio)
                        : currencyFormat(0)}
                    </p>
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <p className="font-coolvetica font-medium">
                      Velocidad extra
                    </p>
                    <p>
                      {isEnabled
                        ? currencyFormat(expressDeliveryFee)
                        : currencyFormat(0)}
                    </p>
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <p>Descuentos</p>
                    <p>
                      -
                      {currencyFormat(
                        hasSpecialCode
                          ? calculateSpecialDiscount()
                          : descuento + freeBurgerDiscount
                      )}
                    </p>
                  </div>
                  <div className="flex flex-row justify-between border-t border-opacity-20 border-black mt-4 pt-4 px-4 w-screen">
                    <p className="text-2xl font-bold">Total</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(calculateFinalTotal())}
                    </p>
                  </div>
                </div>
                {values.paymentMethod === "mercadopago" ? (
                  <Payment
                    cart={cart}
                    values={values}
                    discountedTotal={discountedTotal}
                    envio={envio}
                    mapUrl={mapUrl}
                    couponCodes={couponCodes}
                    calculateFinalTotal={calculateFinalTotal}
                    isEnabled={isEnabled}
                    isValid={isValid}
                    submitForm={submitForm}
                    altaDemanda={altaDemanda}
                    shouldValidate={true}
                  />
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`text-4xl z-50 text-center mt-6 flex items-center justify-center bg-blue-apm text-gray-100 rounded-3xl h-20 font-bold hover:bg-red-600 transition-colors duration-300 ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <LoadingPoints color="text-gray-100" />
                    ) : (
                      "Pedir"
                    )}
                  </button>
                )}
              </div>
            </Form>
          );
        }}
      </Formik>

      {/* Modales */}
      {/* por horario */}
      <AppleModal
        isOpen={isTimeRestrictedModalOpen}
        onClose={closeTimeRestrictedModal}
        title="Está cerrado"
      >
        <p className="font-medium text-center">
          Abrimos de lunes a domingo de 11:00 hs a 14:00 hs y de 20:00 hs a
          00:00 hs.
        </p>
      </AppleModal>

      {/* sin stock */}
      <AppleModal
        isOpen={showOutOfStockModal}
        onClose={() => setShowOutOfStockModal(false)}
        title="Sin stock"
      >
        <p className="font-medium text-center">
          Se vendieron +400 burgers ❤️‍🔥 No hay mas stock! Te esperamos esta noche{" "}
        </p>
      </AppleModal>

      {/* pendiente de confirmar */}
      <AppleModal
        isOpen={isCloseRestrictedModalOpen}
        onClose={closeCloseRestrictedModal}
        title="Pendiente de confirmar"
        twoOptions={true}
        isLoading={isModalConfirmLoading}
        onConfirm={async () => {
          setIsModalConfirmLoading(true);
          try {
            if (pendingValues) {
              const orderId = await handleSubmit(
                pendingValues,
                cart,
                discountedTotal,
                envio,
                mapUrl,
                couponCodes,
                descuento,
                true // isPending
              );
              if (orderId) {
                navigate(`/success/${orderId}`);
                dispatch(addLastCart());
              }
            }
          } catch (error) {
            console.error("Error al procesar el pedido pendiente:", error);
          } finally {
            setIsModalConfirmLoading(false);
            closeCloseRestrictedModal();
          }
        }}
      >
        <p className="font-medium text-center">
          Van +400 burgers ❤️‍🔥 En cocina están verificando si hay stock. Tu
          pedido estará pendiente de aprobación durante los próximos 3 a 5
          minutos, aceptas? <br />
        </p>
      </AppleModal>

      {/* esperas? */}
      <AppleModal
        isOpen={
          showHighDemandModal && pendingValues?.paymentMethod === "efectivo"
        }
        onClose={() => setShowHighDemandModal(false)}
        title="Alta Demanda"
        twoOptions={true}
        isLoading={isModalConfirmLoading}
        onConfirm={async () => {
          setIsModalConfirmLoading(true);
          if (pendingValues) {
            const isReserva = pendingValues.hora.trim() !== "";
            await processPedido(pendingValues, isReserva);
          }
          setIsModalConfirmLoading(false);
          setShowHighDemandModal(false);
        }}
      >
        <p className="font-medium text-center">
          Estamos en alta demanda, tu pedido comenzará a cocinarse dentro de{" "}
          {altaDemanda?.delayMinutes} minutos, ¿Lo esperas?
        </p>
      </AppleModal>

      {/* mensaje */}
      <AppleModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="Aviso importante"
        twoOptions={true}
        isLoading={isModalConfirmLoading}
        onConfirm={async () => {
          setIsModalConfirmLoading(true);
          if (pendingValues) {
            const isReserva = pendingValues.hora.trim() !== "";
            const orderId = await handleSubmit(
              // Guardamos el orderId que retorna handleSubmit
              pendingValues,
              cart,
              discountedTotal,
              envio,
              mapUrl,
              couponCodes,
              descuento,
              false,
              altaDemanda?.message || ""
            );

            if (orderId) {
              // Si se creó la orden exitosamente
              navigate(`/success/${orderId}`); // Redirigimos
              dispatch(addLastCart()); // Actualizamos el carrito
            }
          }
          setIsModalConfirmLoading(false);
          setShowMessageModal(false);
        }}
      >
        <p className="font-medium text-center">
          {altaDemanda?.message} <br />
          Tendras un boton para pedir tu compensacion ❤️‍🔥 Aceptas?
        </p>
      </AppleModal>
    </div>
  );
};

export default FormCustom;
