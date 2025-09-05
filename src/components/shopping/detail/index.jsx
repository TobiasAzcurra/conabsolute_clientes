import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useClient } from '../../../contexts/ClientContext';
import currencyFormat from '../../../helpers/currencyFormat';
import { getProductById } from '../../../firebase/products/getProductById';
import { useToast, Toast } from '../../../hooks/useToast.jsx';
import VideoSlider from './VideoSlider';
import QuickAddToCart from '../card/quickAddToCart';

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const DetailCard = () => {
  const { category, id } = useParams();
  const { productsByCategory, clientAssets, clientConfig, empresaId, sucursalId } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useSelector((state) => state.cartState.cart);
  const { toasts, addToast, removeToast } = useToast();

  console.log("DetailCard params:", { category, id }); // ✅ Debug

  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [updatedProduct, setUpdatedProduct] = useState(null);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [lastStockUpdate, setLastStockUpdate] = useState(null);
  const prevImagesRef = useRef([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const lastTouchTimeRef = useRef(0);

  // Cache de 30 segundos para el stock
  const STOCK_CACHE_DURATION = 30 * 1000;

  const reels = clientAssets?.reels || [];
  const logo = clientAssets?.logoFooter || clientAssets?.logo || "";

  const product = useMemo(() => {
    // Si tenemos producto actualizado, usarlo; sino usar el de cache
    if (updatedProduct) return updatedProduct;
    if (location?.state?.product) return location.state.product;
    const list = productsByCategory?.[category] || [];
    return list.find((p) => p.id === id);
  }, [updatedProduct, location?.state, productsByCategory, category, id]);

  // Efecto para actualizar el stock del producto al entrar al detalle
  useEffect(() => {
    if (!empresaId || !sucursalId || !id) return;

    const updateProductStock = async () => {
      const now = Date.now();
      if (lastStockUpdate && (now - lastStockUpdate) < STOCK_CACHE_DURATION) {
        console.log('📦 Stock en cache, saltando actualización');
        return;
      }

      setIsUpdatingStock(true);
      try {
        const freshProduct = await getProductById(empresaId, sucursalId, id);
        if (freshProduct) {
          const filteredProduct = {
            ...freshProduct,
            variants: freshProduct.variants?.filter(variant => {
              if (!variant.price && variant.price !== 0) return true;              
              if (typeof variant.price !== 'number') return false;
              
              const basePrice = freshProduct.price || 0;
              const finalPrice = basePrice + variant.price;
              return finalPrice >= 0;
            }) || []
          };
          
          setUpdatedProduct(filteredProduct);
          setLastStockUpdate(now);
          console.log('✅ Stock del producto actualizado y variantes filtradas');
        }
      } catch (error) {
        console.error('❌ Error actualizando stock:', error);
        addToast('Error al actualizar stock', 'error');
      } finally {
        setIsUpdatingStock(false);
      }
    };

    updateProductStock();
  }, [empresaId, sucursalId, id, lastStockUpdate, STOCK_CACHE_DURATION]);

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center font-coolvetica text-gray-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  // ✅ VERIFICACIÓN TEMPRANA - ANTES de cualquier cálculo que use product
  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center font-coolvetica text-gray-900">
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
    for (const variant of product?.variants || []) {
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
  }, [product?.variants]);

  const customization = useMemo(() => {
    return Object.keys(variantStats).length > 0;
  }, [variantStats]);

  const availableOptions = useMemo(() => {
    const options = {};

    const hasSelections = Object.values(selectedVariants).some(
      (value) => value !== null && value !== undefined
    );

    const filteredVariants = hasSelections
      ? product.variants?.filter((variant) => {
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
      : product.variants || [];

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
  }, [product.variants, selectedVariants]);

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
    const matched = product.variants.find((variant) => {
      return Object.entries(selectedVariants).every(([key, value]) => {
        if (!value) return false;

        const attributeKey = Object.keys(variant.attributes || {}).find(
          (attrKey) => attrKey.toLowerCase() === key.toLowerCase()
        );
        const vAttr = attributeKey
          ? variant.attributes[attributeKey]
          : undefined;
        return vAttr && vAttr.toLowerCase() === value.toLowerCase();
      });
    });
    setSelectedVariant(matched || null);
  }, [selectedVariants, product.variants]);

  useEffect(() => {
    if (!product?.variants || Object.keys(selectedVariants).length > 0) return;

    const initialSelection = {};

    const defaultVariant = product.variants.find((v) => v.default);

    if (
      defaultVariant?.attributes &&
      Object.keys(defaultVariant.attributes).length > 0 &&
      defaultVariant.stockSummary?.totalStock > 0
    ) {
      Object.entries(defaultVariant.attributes).forEach(([key, value]) => {
        initialSelection[key.toLowerCase()] = value.toLowerCase();
      });
    } else {
      const firstAvailableVariant = product.variants.find(
        (v) =>
          v.attributes &&
          Object.keys(v.attributes).length > 0 &&
          v.stockSummary?.totalStock > 0
      );

      if (firstAvailableVariant?.attributes) {
        Object.entries(firstAvailableVariant.attributes).forEach(
          ([key, value]) => {
            initialSelection[key.toLowerCase()] = value.toLowerCase();
          }
        );
      }
    }

    setSelectedVariants(initialSelection);
  }, [product?.variants]);

  const productImages = useMemo(() => {
    const imgs = selectedVariant?.images?.length
      ? selectedVariant.images
      : product?.img || product?.image || product?.images || [];
    const normalized = Array.isArray(imgs) ? imgs : [imgs];
    const isSame =
      prevImagesRef.current.length === normalized.length &&
      prevImagesRef.current.every((img, i) => img === normalized[i]);
    if (!isSame)      prevImagesRef.current = normalized;
    return prevImagesRef.current;
  }, [selectedVariant, product]);

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

  const basePrice = product.price || 0;
  const variantPrice = selectedVariant?.price || 0;
  const totalPrice = basePrice + variantPrice;

  const finalName =
    selectedVariant?.name && !selectedVariant?.default
      ? capitalizeWords(selectedVariant.name)
      : product.name;

  const productToSend = useMemo(() => {
    return {
      ...product,
      id: product.id,
      name: finalName,
      category: product.category,
      img:
        selectedVariant?.productImage?.[0] || product.img?.[0] || product.img,
      price: totalPrice,
      basePrice: basePrice,
      finalPrice: totalPrice,
      variants: [selectedVariant],
    };
  }, [product, finalName, selectedVariant, totalPrice, basePrice]);

  const outOfStock = product.infiniteStock 
  ? false 
  : (
    selectedVariant &&
    selectedVariant.stockSummary &&
    selectedVariant.stockSummary.totalStock === 0)

  const handleVariantSelect = (key, value) => {
    setSelectedVariants((prev) => {
      const newSelections = { ...prev };

      if (newSelections[key] === value) {
        newSelections[key] = null;
        return newSelections;
      }

      newSelections[key] = value;

      const isCurrentSelectionValid = (product.variants || []).some(
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

        const variantsWithNewValue = (product.variants || []).filter(
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

  const handleRefreshStock = async () => {
    if (!empresaId || !sucursalId || !id || isUpdatingStock) return;
    
    setIsUpdatingStock(true);
    try {
      const freshProduct = await getProductById(empresaId, sucursalId, id);
      if (freshProduct) {
        setUpdatedProduct(freshProduct);
        setLastStockUpdate(Date.now());
        console.log('✅ Stock actualizado manualmente');
        addToast('Stock actualizado', 'success');
      }
    } catch (error) {
      console.error('❌ Error actualizando stock:', error);
      addToast('Error al actualizar stock', 'error');
    } finally {
      setIsUpdatingStock(false);
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
          const newIndex = modalImageIndex === 0 ? productImages.length - 1 : modalImageIndex - 1;
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
        const newIndex = modalImageIndex === 0 ? productImages.length - 1 : modalImageIndex - 1;
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
    
    if (productImages.length <= 1 || e.type === 'touchend') {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const imageWidth = rect.width;
    
    if (tapX < imageWidth / 2) {
      const newIndex = modalImageIndex === 0 ? productImages.length - 1 : modalImageIndex - 1;
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
    if (product?.vid?.length) return product.vid;

    if (selectedVariant?.videos?.length) return selectedVariant.videos;

    return reels;
  }, [product?.vid, selectedVariant?.videos, reels]);

  return (
    <div className="overflow-x-hidden">
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="flex flex-col">
        <div className="flex flex-col justify-items-center items-center ">
          <div className="w-full h-[200px] flex items-center justify-center relative">
            <img
              className="w-full h-[250px] object-cover object-center cursor-zoom-in"
              src={productImages[selectedImageIndex]}
              alt={product.name}
              onClick={handleImageClick}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-row gap-1">
              {productImages.length > 1 &&
                productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                      selectedImageIndex === index
                        ? 'border-white opacity-100 shadow-lg'
                        : 'border-white opacity-70 hover:opacity-90'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
            </div>
          </div>

          <div className="flex flex-col bg-gray-50 z-50 rounded-t-3xl ">
            <div className="flex flex-col my-4 px-4">
              <div className="flex items-center justify-center gap-1 mb-2">
                {isUpdatingStock ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                ) : (
                  <button
                    onClick={handleRefreshStock}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    title="Actualizar stock"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="h-3 w-3 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                  </button>
                )}
                
                {lastStockUpdate && (
                  <span className="text-xs text-gray-400 font-light">
                    {new Date(lastStockUpdate).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </div>
              
              <div className="flex flex-row gap-2 items-center">
                <button onClick={handleGoBack}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-6 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>
                <h4 className="font-coolvetica font-bold text-3xl text-gray-900 leading-9">
                  {finalName}
                </h4>
              </div>
            </div>

            {product.detailDescription && (
              <p className="font-coolvetica text-xs text-gray-400 font-light pl-4 pr-16 leading-tight">
                {product.detailDescription.charAt(0).toUpperCase() +
                  product.detailDescription.slice(1).toLowerCase()}
              </p>
            )}

            {customization && (
              <div className="gap-2 w-full mt-8 flex flex-col justify-center px-4">
                {Object.entries(variantStats).map(([key, values]) => (
                  <div key={key}>
                    <h5 className="font-coolvetica font-light mb-2 text-xs w-full text-gray-900">
                      {clientConfig?.labels?.[key] || capitalizeWords(key)}
                    </h5>
                    <div className="flex w-full">
                      <div className="grid grid-cols-3 gap-2">
                        {values.map((value, index) => {
                          const isSelected = selectedVariants[key] === value;

                          const isCompatible = (product.variants || []).some(
                            (variant) => {
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
                            }
                          );

                          const variantForValue = (product.variants || []).find(
                            (v) => {
                              if (!v.attributes) return false;

                              const attributeKey = Object.keys(
                                v.attributes
                              ).find(
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
                            }
                          );

                          const hasStock =
                            variantForValue?.stockSummary?.totalStock > 0;

                          const isClickable = hasStock;

                          const isFirst = index === 0;
                          const isLast = index === values.length - 1;
                          const isOnly = values.length === 1;

                          const borderRadiusClass = 'rounded-full' // isOnly
                            // ? 'rounded-full'
                            // : isFirst
                            // ? 'rounded-l-full'
                            // : isLast
                            // ? 'rounded-r-full'
                            // : 'rounded-none';

                          const hasAttributeImage =
                            variantForValue &&
                            variantForValue.attributeImages &&
                            variantForValue.attributeImages[key];

                          let borderStyle = 'border-gray-200';
                          let backgroundStyle = '';
                          let textStyle = '';
                          let cursorStyle = '';

                          if (isSelected) {
                            backgroundStyle = 'bg-black';
                            textStyle = 'text-white';
                          } else if (!hasStock) {
                            borderStyle = 'border-red-200 border-dashed';
                            backgroundStyle = 'bg-red-50';
                            textStyle = 'text-red-300';
                            cursorStyle = 'cursor-not-allowed';
                          } else if (!isCompatible) {
                            borderStyle = 'border-gray-300 border-dashed';
                            backgroundStyle = 'bg-gray-50';
                            textStyle = 'text-gray-400';
                          } else {
                            backgroundStyle = 'bg-gray-50';
                            textStyle = 'text-gray-400';
                          }

                          return (
                            <button
                              key={value}
                              onClick={() =>
                                isClickable && handleVariantSelect(key, value)
                              }
                              disabled={!isClickable}
                              className={`px-4 h-10 font-coolvetica text-xs transition-all duration-200 border ${borderStyle} font-light ${borderRadiusClass} ${
                                index > 0 ? '-ml-px' : ''
                              } flex items-center justify-center ${backgroundStyle} ${textStyle} ${cursorStyle}`}
                              style={
                                hasAttributeImage
                                  ? {
                                      padding: 0,
                                      width: '100%',
                                      height: 40,
                                      overflow: 'hidden',
                                    }
                                  : {}
                              }
                            >
                              {hasAttributeImage ? (
                                <img
                                  src={variantForValue.attributeImages[key]}
                                  alt={value}
                                  className={`w-full h-full object-cover transition-opacity duration-200 ${
                                    isSelected
                                      ? 'opacity-100'
                                      : !hasStock
                                      ? 'opacity-20 grayscale'
                                      : !isCompatible
                                      ? 'opacity-40'
                                      : 'opacity-50'
                                  }`}
                                  style={{ width: '100%', height: '100%' }}
                                />
                              ) : (
                                capitalizeWords(value)
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

            {outOfStock && (
              <p className="text-xs text-red-500 font-coolvetica font-light mt-4 px-4">
                Sin stock
              </p>
            )}

            {typeof product.deliveryAvailable === 'boolean' && (
              <div className="pl-4 pr-4 mt-3 mb-1 flex items-center">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-coolvetica text-xs font-medium shadow-sm
                    ${product.deliveryAvailable
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                  aria-label={product.deliveryAvailable ? 'Disponible para delivery' : 'No disponible para delivery'}
                >
                  {product.deliveryAvailable ? 'Delivery Disponible' : 'Delivery No disponible'}
                </span>
              </div>
            )}
            
            <div className="flex flex-row items-center w-full mt-6 px-3 ">
              <QuickAddToCart
                product={productToSend}
                calculatedPrice={totalPrice}
                displayAsFullButton={true}
                disabled={outOfStock}
              />
              <p className="text-xs pl-2 font-coolvetica font-light text-gray-900">
                Por {currencyFormat(totalPrice)}
              </p>
            </div>
            {product.deliveryDelay && (
              <p className="text-gray-500 text-xs font-light mt-3 px-4">
                {(() => {
                  const delayHours = product.deliveryDelay;
                  const delayText =
                    delayHours < 24
                      ? `${delayHours} hora${delayHours !== 1 ? 's' : ''}`
                      : `${Math.ceil(delayHours / 24)} día${
                          Math.ceil(delayHours / 24) !== 1 ? 's' : ''
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
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full h-full overflow-hidden"
          >
            <div
              className="flex transition-transform ease-out duration-500 h-full"
              style={{ 
                transform: `translateX(-${modalImageIndex * 100}%)`
              }}
            >
              {productImages.map((image, index) => (
                <div 
                  className="w-full h-full flex-shrink-0 flex items-center justify-center p-8" 
                  key={index}
                >
                  <img
                    src={image}
                    alt={`${product.name} - imagen ${index + 1}`}
                    className="max-w-full max-h-full object-contain cursor-pointer"
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
                        ? 'bg-white opacity-100'
                        : 'bg-white opacity-30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailCard;
