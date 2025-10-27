// components/shopping/detail/DetailCard.js - REFACTORIZADO
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useCart } from "../../../contexts/CartContext";
import { useClient } from "../../../contexts/ClientContext.jsx";
import currencyFormat from "../../../helpers/currencyFormat.js";
import { calculateProductPrice } from "../../../helpers/priceCalculator.js";
import { useProductStock } from "../../../hooks/useProductStock.js"; // ✅ NUEVO
import { useToast, Toast } from "../../../hooks/useToast.jsx";
import VideoSlider from "./VideoSlider.jsx";
import QuickAddToCart from "../card/quickAddToCart.jsx";
import ModifierGroupSelector from "./ModifierGroupSelector.jsx";
import { createPortal } from "react-dom";

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const DetailCard = () => {
  const { category, id } = useParams();
  const { productsByCategory, clientAssets, clientConfig } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const { toasts, addToast, removeToast } = useToast();

  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const prevImagesRef = useRef([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const lastTouchTimeRef = useRef(0);

  // Estados para modifier groups
  const [modifierSelections, setModifierSelections] = useState({
    selections: {},
    additionalPrice: 0,
    isValid: true,
  });

  const reels = clientAssets?.reels || [];
  const logo = clientAssets?.logoFooter || clientAssets?.logo || "";
  const list = productsByCategory?.[category] || [];

  // ✅ CAMBIO: Obtener producto inicial del context
  const initialProduct = useMemo(() => {
    if (location?.state?.product) return location.state.product;
    return list.find((p) => p.id === id);
  }, [location?.state, list, id]);

  // ✅ CAMBIO: Usar el hook refactorizado
  const {
    product,
    isUpdating: isUpdatingStock,
    refreshStock,
  } = useProductStock(id, initialProduct);

  // ✅ CAMBIO: Filtrar variantes inválidas localmente
  const filteredProduct = useMemo(() => {
    if (!product) return null;

    return {
      ...product,
      variants:
        product.variants?.filter((variant) => {
          if (!variant.price && variant.price !== 0) return true;
          if (typeof variant.price !== "number") return false;

          const basePrice = product.price || 0;
          const finalPrice = basePrice + variant.price;
          return finalPrice >= 0;
        }) || [],
    };
  }, [product]);

  // ✅ CAMBIO: Usar producto filtrado en vez de updatedProduct
  const displayProduct = filteredProduct;

  if (!displayProduct) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center font-primary text-gray-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando producto...</p>
          <p className="text-xs text-gray-500 mt-2">
            Buscando en categoría: {category} | ID: {id}
          </p>
        </div>
      </div>
    );
  }

  const variantStats = useMemo(() => {
    const stats = {};
    for (const variant of displayProduct?.variants || []) {
      if (!variant.attributes) continue;
      Object.entries(variant.attributes).forEach(([key, value]) => {
        const k = key.toLowerCase();
        const v = value.toLowerCase();
        if (!stats[k]) stats[k] = new Set();
        stats[k].add(v);
      });
    }
    const result = {};
    for (const key in stats) {
      result[key] = Array.from(stats[key]);
    }
    return result;
  }, [displayProduct?.variants]);

  const customization = useMemo(() => {
    return Object.keys(variantStats).length > 0;
  }, [variantStats]);

  const availableOptions = useMemo(() => {
    const options = {};

    const hasSelections = Object.values(selectedVariants).some(
      (value) => value !== null && value !== undefined
    );

    const filteredVariants = hasSelections
      ? displayProduct.variants?.filter((variant) => {
          const match = Object.entries(selectedVariants).every(
            ([key, value]) => {
              if (!value) return true;

              const attributeKey = Object.keys(variant.attributes || {}).find(
                (attrKey) => attrKey.toLowerCase() === key.toLowerCase()
              );
              const vAttr = attributeKey
                ? variant.attributes[attributeKey]
                : undefined;
              const matches =
                vAttr && vAttr.toLowerCase() === value.toLowerCase();

              return matches;
            }
          );
          return match;
        }) || []
      : displayProduct.variants || [];

    for (const variant of filteredVariants) {
      if (!variant.attributes) continue;
      Object.entries(variant.attributes).forEach(([key, value]) => {
        const k = key.toLowerCase();
        const v = value.toLowerCase();
        if (!options[k]) options[k] = new Set();
        options[k].add(v);
      });
    }

    const result = {};
    for (const key in options) {
      result[key] = Array.from(options[key]);
    }

    return result;
  }, [displayProduct.variants, selectedVariants]);

  useEffect(() => {
    const newSelection = { ...selectedVariants };
    let changed = false;
    for (const [key, value] of Object.entries(newSelection)) {
      if (value && !availableOptions[key]?.includes(value)) {
        newSelection[key] = null;
        changed = true;
      }
    }

    if (changed) setSelectedVariants(newSelection);
  }, [availableOptions]);

  useEffect(() => {
    // console.log("🔄 ===== INICIO useEffect VARIANTE =====");

    // Verificar si el usuario ha hecho alguna selección
    const hasUserSelections = Object.values(selectedVariants).some(
      (value) => value !== null && value !== undefined && value !== ""
    );

    // console.log("👤 hasUserSelections:", hasUserSelections);
    // console.log("🎨 selectedVariants:", selectedVariants);
    // console.log("📊 variantStats:", variantStats);

    // CASO 1: Producto SIN customización (sin atributos)
    // → Usar variante default directamente
    if (Object.keys(variantStats).length === 0) {
      // console.log("✅ CASO 1: Producto SIN customización");
      const defaultVariant =
        displayProduct.variants?.find((v) => v.default) ||
        displayProduct.variants?.[0];
      // console.log("🎯 Variante default asignada:", defaultVariant);
      setSelectedVariant(defaultVariant || null);
      // console.log("🔄 ===== FIN useEffect VARIANTE =====\n");
      return;
    }

    // CASO 2: Producto CON customización (tiene atributos)
    // console.log("✅ CASO 2: Producto CON customización");

    // Si no hay selecciones, no hay variante válida
    if (!hasUserSelections) {
      // console.log("⚠️ No hay selecciones, selectedVariant = null");
      setSelectedVariant(null);
      // console.log("🔄 ===== FIN useEffect VARIANTE =====\n");
      return;
    }

    // Obtener todos los atributos requeridos
    const requiredAttributes = Object.keys(variantStats);
    // console.log("📋 Atributos requeridos:", requiredAttributes);

    // Verificar que TODOS los atributos requeridos estén seleccionados
    const allAttributesSelected = requiredAttributes.every((attr) => {
      const value = selectedVariants[attr];
      const isSelected = value !== null && value !== undefined && value !== "";
      // console.log(
      //   `  🔍 Atributo "${attr}": ${value} → ${isSelected ? "✅" : "❌"}`
      // );
      return isSelected;
    });

    // console.log("✔️ Todos los atributos seleccionados:", allAttributesSelected);

    // Si falta algún atributo, NO hay variante válida
    if (!allAttributesSelected) {
      // console.log("⚠️ Faltan atributos, selectedVariant = null");
      setSelectedVariant(null);
      // console.log("🔄 ===== FIN useEffect VARIANTE =====\n");
      return;
    }

    // Si está todo seleccionado, buscar el match exacto
    // console.log("🔍 Buscando match exacto...");
    // console.log(
    //   "📦 Total de variantes disponibles:",
    //   displayProduct.variants?.length
    // );

    // Mostrar todas las variantes con sus atributos
    // displayProduct.variants?.forEach((variant, index) => {
    //   console.log(`  Variante ${index}:`, {
    //     id: variant.id,
    //     name: variant.name,
    //     attributes: variant.attributes,
    //     default: variant.default,
    //   });
    // });

    const matched = displayProduct.variants.find((variant) => {
      // console.log(
      //   `\n  🎯 Comparando con variante: ${variant.name || variant.id}`
      // );
      // console.log(`     Atributos de la variante:`, variant.attributes);

      const result = Object.entries(selectedVariants).every(([key, value]) => {
        if (!value) {
          // console.log(`     ❌ ${key}: valor vacío`);
          return false;
        }

        const attributeKey = Object.keys(variant.attributes || {}).find(
          (attrKey) => attrKey.toLowerCase() === key.toLowerCase()
        );

        const vAttr = attributeKey
          ? variant.attributes[attributeKey]
          : undefined;
        const matches = vAttr && vAttr.toLowerCase() === value.toLowerCase();

        // console.log(
        //   `     ${
        //     matches ? "✅" : "❌"
        //   } ${key}: "${value}" vs "${vAttr}" (key: ${attributeKey})`
        // );

        return matches;
      });

      // console.log(`     Resultado: ${result ? "✅ MATCH!" : "❌ No match"}`);
      return result;
    });

    // console.log(
    //   "\n🎯 Variante matched final:",
    //   matched ? matched.name || matched.id : "null"
    // );
    setSelectedVariant(matched || null);
    // console.log("🔄 ===== FIN useEffect VARIANTE =====\n");
  }, [selectedVariants, variantStats, displayProduct.variants]);

  // Resetear modifier selections cuando cambia la variante
  useEffect(() => {
    if (selectedVariant?.hasModifiers) {
      setModifierSelections({
        selections: {},
        additionalPrice: 0,
        isValid: false,
      });
    } else {
      setModifierSelections({
        selections: {},
        additionalPrice: 0,
        isValid: true,
      });
    }
  }, [selectedVariant?.id]);

  const productImages = useMemo(() => {
    const imgs = selectedVariant?.images?.length
      ? selectedVariant.images
      : displayProduct?.img ||
        displayProduct?.image ||
        displayProduct?.images ||
        [];
    const normalized = Array.isArray(imgs) ? imgs : [imgs];
    const isSame =
      prevImagesRef.current.length === normalized.length &&
      prevImagesRef.current.every((img, i) => img === normalized[i]);
    if (!isSame) prevImagesRef.current = normalized;
    return prevImagesRef.current;
  }, [selectedVariant, displayProduct]);

  useEffect(() => {
    if (!productImages || productImages.length <= 1 || isModalOpen) return;
    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [productImages, isModalOpen]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productImages]);

  // Usar el helper centralizado para calcular precios
  const priceBreakdown = useMemo(() => {
    return calculateProductPrice(
      displayProduct,
      selectedVariant,
      modifierSelections
    );
  }, [displayProduct, selectedVariant, modifierSelections]);

  const { basePrice, variantPrice, modifiersPrice, totalPrice } =
    priceBreakdown;

  const productToSend = useMemo(() => {
    return {
      id: displayProduct.id,
      name: displayProduct.name,
      category: displayProduct.category,
      price: basePrice,
      selectedVariant: selectedVariant,
      variantId: selectedVariant?.id || "default",
      variantName: selectedVariant?.name || "default",
      variantPrice: variantPrice,
      basePrice: basePrice,
      finalPrice: totalPrice,
      img:
        selectedVariant?.productImage?.[0] ||
        displayProduct.img?.[0] ||
        displayProduct.img,
      infiniteStock: displayProduct.infiniteStock || false,
      availableStock: selectedVariant?.stockSummary?.totalStock || 0,
      stockReference: selectedVariant?.stockReference || "",
      variants: selectedVariant ? [selectedVariant] : [],
      restrictions: displayProduct.restrictions || {
        fulfillmentMethodsExcluded: [],
      },
      modifierSelections: selectedVariant?.hasModifiers
        ? modifierSelections.selections
        : {},
      modifiersPrice: modifiersPrice,
    };
  }, [
    displayProduct,
    selectedVariant,
    basePrice,
    variantPrice,
    modifiersPrice,
    totalPrice,
    modifierSelections,
  ]);

  const outOfStock = displayProduct.infiniteStock
    ? false
    : selectedVariant &&
      selectedVariant.stockSummary &&
      selectedVariant.stockSummary.totalStock === 0;

  const shouldDisable = useMemo(() => {
    const hasVariants = displayProduct?.variants?.length > 0;
    if (hasVariants && !selectedVariant) return true;

    if (selectedVariant?.hasModifiers && !modifierSelections.isValid) {
      return true;
    }

    if (!displayProduct.infiniteStock && outOfStock) return true;

    return false;
  }, [displayProduct, selectedVariant, outOfStock, modifierSelections.isValid]);

  const handleVariantSelect = (key, value) => {
    setSelectedVariants((prev) => {
      const newSelections = { ...prev };

      if (newSelections[key] === value) {
        newSelections[key] = null;
        return newSelections;
      }

      newSelections[key] = value;

      const isCurrentSelectionValid = (displayProduct.variants || []).some(
        (variant) => {
          if (!variant.attributes) return false;

          return Object.entries(newSelections).every(([attrKey, attrValue]) => {
            if (!attrValue) return true;

            const variantAttrKey = Object.keys(variant.attributes).find(
              (vKey) => vKey.toLowerCase() === attrKey.toLowerCase()
            );
            const variantAttrValue = variantAttrKey
              ? variant.attributes[variantAttrKey]
              : undefined;

            return (
              variantAttrValue &&
              variantAttrValue.toLowerCase() === attrValue.toLowerCase()
            );
          });
        }
      );

      if (!isCurrentSelectionValid) {
        const cleanedSelections = { [key]: value };

        const variantsWithNewValue = (displayProduct.variants || []).filter(
          (variant) => {
            if (!variant.attributes) return false;

            const variantAttrKey = Object.keys(variant.attributes).find(
              (vKey) => vKey.toLowerCase() === key.toLowerCase()
            );
            const variantAttrValue = variantAttrKey
              ? variant.attributes[variantAttrKey]
              : undefined;

            return (
              variantAttrValue &&
              variantAttrValue.toLowerCase() === value.toLowerCase()
            );
          }
        );

        if (variantsWithNewValue.length > 0) {
          const availableVariants = variantsWithNewValue.filter(
            (v) => v.stockSummary?.totalStock > 0
          );
          const targetVariants =
            availableVariants.length > 0
              ? availableVariants
              : variantsWithNewValue;

          const referenceVariant = targetVariants[0];

          if (referenceVariant.attributes) {
            Object.entries(referenceVariant.attributes).forEach(
              ([attrKey, attrValue]) => {
                const normalizedKey = attrKey.toLowerCase();
                const normalizedValue = attrValue.toLowerCase();

                if (normalizedKey !== key.toLowerCase()) {
                  cleanedSelections[normalizedKey] = normalizedValue;
                }
              }
            );
          }
        }

        return cleanedSelections;
      }

      return newSelections;
    });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // ✅ CAMBIO: Simplificado - ahora solo llama al hook
  const handleRefreshStock = async () => {
    if (isUpdatingStock) return;

    try {
      await refreshStock();
      addToast("Stock actualizado", "success");
    } catch (error) {
      console.error("❌ Error actualizando stock:", error);
      addToast("Error al actualizar stock", "error");
    }
  };

  const handleImageClick = () => {
    setModalImageIndex(selectedImageIndex);
    setIsModalOpen(true);
  };

  const handleTouchStart = (e) => {
    e.stopPropagation();
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    const diff = touchStartXRef.current - touchEndXRef.current;

    lastTouchTimeRef.current = Date.now();

    if (Math.abs(diff) < 50) {
      if (e.changedTouches && e.changedTouches[0]) {
        const rect = e.currentTarget.getBoundingClientRect();
        const tapX = e.changedTouches[0].clientX - rect.left;
        const imageWidth = rect.width;

        if (tapX < imageWidth / 2) {
          const newIndex =
            modalImageIndex === 0
              ? productImages.length - 1
              : modalImageIndex - 1;
          setModalImageIndex(newIndex);
        } else {
          const newIndex = (modalImageIndex + 1) % productImages.length;
          setModalImageIndex(newIndex);
        }
      }
    } else {
      if (diff > 50) {
        const newIndex = (modalImageIndex + 1) % productImages.length;
        setModalImageIndex(newIndex);
      } else if (diff < -50) {
        const newIndex =
          modalImageIndex === 0
            ? productImages.length - 1
            : modalImageIndex - 1;
        setModalImageIndex(newIndex);
      }
    }
  };

  const handleImageTap = (e) => {
    e.stopPropagation();

    const timeSinceLastTouch = Date.now() - lastTouchTimeRef.current;
    if (timeSinceLastTouch < 500) {
      return;
    }

    if (productImages.length <= 1 || e.type === "touchend") {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const imageWidth = rect.width;

    if (tapX < imageWidth / 2) {
      const newIndex =
        modalImageIndex === 0 ? productImages.length - 1 : modalImageIndex - 1;
      setModalImageIndex(newIndex);
    } else {
      const newIndex = (modalImageIndex + 1) % productImages.length;
      setModalImageIndex(newIndex);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const productVideos = useMemo(() => {
    if (displayProduct?.vid?.length) return displayProduct.vid;
    if (selectedVariant?.videos?.length) return selectedVariant.videos;
    return reels;
  }, [displayProduct?.vid, selectedVariant?.videos, reels]);

  const quickAddKey = useMemo(() => {
    const modifiersKey =
      Object.keys(modifierSelections.selections).length > 0
        ? JSON.stringify(modifierSelections.selections)
        : "no-modifiers";

    return `${displayProduct.id}-${
      selectedVariant?.id || "default"
    }-${modifiersKey}`;
  }, [displayProduct.id, selectedVariant?.id, modifierSelections.selections]);

  // 🔍 DEBUG: Logear lo que se agrega al carrito
  // useEffect(() => {
  //   console.log("════════════════════════════════════");
  //   console.log("📦 PRODUCTO PARA AGREGAR AL CARRITO:");
  //   console.log("════════════════════════════════════");
  //   console.log("✅ Variante seleccionada:", selectedVariant);
  //   console.log("🎨 Selecciones del usuario:", selectedVariants);
  //   console.log("💰 Precio total:", totalPrice);
  //   console.log("🚫 Botón deshabilitado:", shouldDisable);
  //   console.log("📤 Objeto productToSend:", productToSend);
  //   console.log("════════════════════════════════════\n");
  // }, [
  //   selectedVariant,
  //   selectedVariants,
  //   totalPrice,
  //   shouldDisable,
  //   productToSend,
  // ]);

  return (
    <div className="overflow-x-hidden">
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="flex flex-col">
        <div className="flex flex-col justify-items-center items-center">
          <div className="px-4 pt-4  h-full w-full">
            <div className="w-full bg-gray-200 aspect-square rounded-3xl bg-gray-100 flex items-center justify-center relative overflow-hidden">
              <img
                className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
                src={productImages[selectedImageIndex]}
                alt={displayProduct.name}
                onClick={handleImageClick}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-row gap-1">
                {productImages.length > 1 &&
                  (() => {
                    const totalImages = productImages.length;
                    const maxVisible = 5;

                    if (totalImages <= maxVisible) {
                      return productImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                            selectedImageIndex === index
                              ? "border-white opacity-100 shadow-lg"
                              : "border-white opacity-70 hover:opacity-90"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${displayProduct.name} - imagen ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ));
                    }

                    const halfVisible = Math.floor(maxVisible / 2);
                    let startIndex = Math.max(
                      0,
                      selectedImageIndex - halfVisible
                    );
                    let endIndex = Math.min(
                      totalImages,
                      startIndex + maxVisible
                    );

                    if (endIndex === totalImages) {
                      startIndex = Math.max(0, totalImages - maxVisible);
                    }

                    const visibleImages = [];

                    if (startIndex > 0) {
                      visibleImages.push(
                        <div
                          key="more-left"
                          className="flex items-center justify-center font-primary mr-2"
                        >
                          <span className="text-white text-xs font-light">
                            +{startIndex}
                          </span>
                        </div>
                      );
                    }

                    for (let i = startIndex; i < endIndex; i++) {
                      visibleImages.push(
                        <button
                          key={i}
                          onClick={() => setSelectedImageIndex(i)}
                          className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                            selectedImageIndex === i
                              ? "border-white opacity-100 shadow-lg scale-110"
                              : "border-white opacity-70 hover:opacity-90"
                          }`}
                        >
                          <img
                            src={productImages[i]}
                            alt={`${displayProduct.name} - imagen ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    }

                    if (endIndex < totalImages) {
                      visibleImages.push(
                        <div
                          key="more-right"
                          className="flex items-center ml-2 justify-center font-primary"
                        >
                          <span className="text-white text-xs font-light">
                            +{totalImages - endIndex}
                          </span>
                        </div>
                      );
                    }

                    return visibleImages;
                  })()}
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-gray-100 w-full overflow-hidden z-50 rounded-t-3xl">
            <div className="flex flex-row px-4 pt-4 items-center justify-between">
              <div className="flex flex-row gap-2 items-center">
                <button onClick={handleGoBack}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-6 text-blue-700"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>
                <h4 className="font-primary font-bold pr-4 capitalize text-xl text-gray-900 leading-tight">
                  {displayProduct.name}
                </h4>
              </div>

              <button
                onClick={handleRefreshStock}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualizar stock"
                disabled={isUpdatingStock}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className={`h-4 w-4 text-blue-700 ${
                    isUpdatingStock ? "animate-spin" : ""
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </button>
            </div>

            {displayProduct.detailDescription && (
              <p className="font-primary text-xs text-gray-400 font-light pl-4 pt-4 pr-16 leading-tight">
                {displayProduct.detailDescription.charAt(0).toUpperCase() +
                  displayProduct.detailDescription.slice(1).toLowerCase()}
              </p>
            )}

            {customization && (
              <div className="gap-2 w-full mt-8 flex flex-col justify-center">
                {Object.entries(variantStats).map(([key, values]) => (
                  <div key={key}>
                    <h5 className="font-primary px-4 font-light mb-2 text-xs w-full text-gray-900">
                      {clientConfig?.labels?.[key] || capitalizeWords(key)}
                    </h5>
                    <div className="flex w-full">
                      <div className="flex flex-row gap-1 overflow-x-auto px-4 scrollbar-hide">
                        {values.map((value, index) => {
                          const isSelected = selectedVariants[key] === value;

                          const isCompatible = (
                            displayProduct.variants || []
                          ).some((variant) => {
                            if (!variant.attributes) return false;

                            const attributeKey = Object.keys(
                              variant.attributes
                            ).find(
                              (attrKey) =>
                                attrKey.toLowerCase() === key.toLowerCase()
                            );
                            const attrValue = attributeKey
                              ? variant.attributes[attributeKey]
                              : undefined;

                            if (
                              !attrValue ||
                              attrValue.toLowerCase() !== value.toLowerCase()
                            ) {
                              return false;
                            }

                            return Object.entries(selectedVariants).every(
                              ([otherKey, otherValue]) => {
                                if (!otherValue || otherKey === key)
                                  return true;

                                const otherAttributeKey = Object.keys(
                                  variant.attributes || {}
                                ).find(
                                  (attrKey) =>
                                    attrKey.toLowerCase() ===
                                    otherKey.toLowerCase()
                                );
                                const otherAttrValue = otherAttributeKey
                                  ? variant.attributes[otherAttributeKey]
                                  : undefined;
                                return (
                                  otherAttrValue &&
                                  otherAttrValue.toLowerCase() ===
                                    otherValue.toLowerCase()
                                );
                              }
                            );
                          });

                          const variantForValue = (
                            displayProduct.variants || []
                          ).find((v) => {
                            if (!v.attributes) return false;

                            const attributeKey = Object.keys(v.attributes).find(
                              (attrKey) =>
                                attrKey.toLowerCase() === key.toLowerCase()
                            );
                            const attrValue = attributeKey
                              ? v.attributes[attributeKey]
                              : undefined;
                            return (
                              attrValue &&
                              attrValue.toLowerCase() === value.toLowerCase()
                            );
                          });

                          const hasStock =
                            displayProduct.infiniteStock ||
                            variantForValue?.stockSummary?.totalStock > 0;
                          const isClickable = hasStock;
                          const borderRadiusClass = "rounded-full";

                          const hasAttributeImage =
                            variantForValue &&
                            variantForValue.attributeImages &&
                            variantForValue.attributeImages[key];

                          let borderStyle = "border-gray-200";
                          let backgroundStyle = "";
                          let textStyle = "";
                          let cursorStyle = "";

                          if (isSelected) {
                            backgroundStyle = "bg-gray-300";
                            textStyle = "text-gray-700";
                          } else if (!hasStock) {
                            borderStyle = "border-red-200 border-dashed";
                            backgroundStyle = "bg-red-50";
                            textStyle = "text-red-300";
                            cursorStyle = "cursor-not-allowed";
                          } else if (!isCompatible) {
                            borderStyle = "border-yellow-200 border-dashed";
                            backgroundStyle = "bg-yellow-50";
                            textStyle = "text-yellow-300";
                          } else {
                            backgroundStyle = "bg-gray-50";
                            textStyle = "text-gray-400";
                          }

                          return (
                            <button
                              key={value}
                              onClick={() =>
                                isClickable && handleVariantSelect(key, value)
                              }
                              disabled={!isClickable}
                              className={`
                                ${hasAttributeImage ? "w-10" : "px-4"} 
                                h-10 
                                font-primary  
                                flex-shrink-0 
                                text-xs 
                                transition-all 
                                duration-200 
                                border 
                                ${borderStyle} 
                                font-light 
                                ${borderRadiusClass} 
                                ${index > 0 ? "-ml-px" : ""} 
                                flex 
                                items-center 
                                justify-center 
                                ${backgroundStyle} 
                                ${textStyle} 
                                ${cursorStyle}
                              `}
                              style={{
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                                ...(hasAttributeImage
                                  ? {
                                      padding: 0,
                                      height: 40,
                                    }
                                  : {}),
                              }}
                            >
                              {hasAttributeImage ? (
                                <img
                                  src={variantForValue.attributeImages[key]}
                                  alt={value}
                                  className={`w-full h-full object-cover transition-opacity duration-200 ${
                                    isSelected
                                      ? "opacity-100"
                                      : !hasStock
                                      ? "opacity-20 grayscale"
                                      : !isCompatible
                                      ? "opacity-40"
                                      : "opacity-50"
                                  }`}
                                />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span>{capitalizeWords(value)}</span>
                                  {!displayProduct.infiniteStock &&
                                    variantForValue?.stockSummary
                                      ?.totalStock !== undefined && (
                                      <span
                                        className={`text-[10px] font-light ${
                                          hasStock
                                            ? "text-gray-500"
                                            : "text-red-400"
                                        }`}
                                      >
                                        (
                                        {
                                          variantForValue.stockSummary
                                            .totalStock
                                        }
                                        u.)
                                      </span>
                                    )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedVariant?.hasModifiers &&
              selectedVariant?.modifierGroups?.length > 0 && (
                <div className="px-4 mt-8">
                  <ModifierGroupSelector
                    modifierGroups={selectedVariant.modifierGroups}
                    onSelectionChange={setModifierSelections}
                  />
                </div>
              )}

            <div className="flex flex-col w-full mt-6 px-4">
              <QuickAddToCart
                key={quickAddKey}
                product={productToSend}
                calculatedPrice={totalPrice}
                displayAsFullButton={true}
                disabled={shouldDisable}
              />
              <p className="text-xs font-primary pt-2 font-light text-gray-400">
                Por {currencyFormat(totalPrice)}
              </p>
            </div>

            {displayProduct.deliveryDelay && (
              <p className="text-gray-500 text-xs font-light mt-3 px-4">
                {(() => {
                  const delayHours = displayProduct.deliveryDelay;
                  const delayText =
                    delayHours < 24
                      ? `${delayHours} hora${delayHours !== 1 ? "s" : ""}`
                      : `${Math.ceil(delayHours / 24)} día${
                          Math.ceil(delayHours / 24) !== 1 ? "s" : ""
                        }`;
                  return `Este producto está en otra sucursal y demora ${delayText} en llegar.`;
                })()}
              </p>
            )}

            <div className="mt-12">
              <VideoSlider reels={productVideos} />
            </div>

            {logo && (
              <img
                src={logo}
                className="w-1/3 mx-auto flex justify-center my-16"
                alt=""
              />
            )}
          </div>
        </div>
      </div>

      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex flex-col items-center justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <div className="relative w-full h-full overflow-hidden">
              <div
                className="flex transition-transform ease-out duration-500 h-full"
                style={{
                  transform: `translateX(-${modalImageIndex * 100}%)`,
                }}
              >
                {productImages.map((image, index) => (
                  <div
                    className="w-full h-full flex-shrink-0 flex items-center justify-center p-8"
                    key={index}
                  >
                    <img
                      src={image}
                      alt={`${displayProduct.name} - imagen ${index + 1}`}
                      className="max-w-full max-h-full rounded-3xl object-contain cursor-pointer"
                      onClick={handleImageTap}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    />
                  </div>
                ))}
              </div>

              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {productImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        modalImageIndex === index
                          ? "bg-gray-50 opacity-100"
                          : "bg-gray-50 opacity-30"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DetailCard;
