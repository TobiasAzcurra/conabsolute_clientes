import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useClient } from '../../../contexts/ClientContext';
import currencyFormat from '../../../helpers/currencyFormat';
import { listenToAltaDemanda } from '../../../firebase/constants/altaDemanda';
import VideoSlider from './VideoSlider';
import QuickAddToCart from '../card/quickAddToCart';

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const DetailCard = () => {
  const { category, id } = useParams();
  const { productsByCategory, clientAssets, clientConfig } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useSelector((state) => state.cartState.cart);

  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [altaDemanda, setAltaDemanda] = useState(null);
  const prevImagesRef = useRef([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reels = clientAssets?.reels || [];
  const logo = clientAssets?.logoFooter || clientAssets?.logo || '';

  const product = useMemo(() => {
    if (location?.state?.product) return location.state.product;
    const list = productsByCategory?.[category] || [];
    return list.find((p) => p.id === id);
  }, [location?.state, productsByCategory, category, id]);

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
    const filteredVariants =
      product.variants?.filter((variant) => {
        return Object.entries(selectedVariants).every(([key, value]) => {
          if (!value) return true;
          const vAttr = variant.attributes?.[key];
          return vAttr && vAttr.toLowerCase() === value;
        });
      }) || [];

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
        const vAttr = variant.attributes?.[key];
        return vAttr && vAttr.toLowerCase() === value;
      });
    });
    setSelectedVariant(matched || null);
  }, [selectedVariants, product.variants]);

  useEffect(() => {
    if (!product?.variants || Object.keys(selectedVariants).length > 0) return;
    const initialSelection = {};
    const firstVariant = product.variants[0];
    if (firstVariant?.attributes) {
      Object.entries(firstVariant.attributes).forEach(([key, value]) => {
        initialSelection[key.toLowerCase()] = value.toLowerCase();
      });
    }
    setSelectedVariants(initialSelection);
  }, [product?.variants]);

  const productImages = useMemo(() => {
    const imgs = selectedVariant?.productImage?.length
      ? selectedVariant.productImage
      : product?.img || product?.image || product?.images || [];
    const normalized = Array.isArray(imgs) ? imgs : [imgs];
    const isSame =
      prevImagesRef.current.length === normalized.length &&
      prevImagesRef.current.every((img, i) => img === normalized[i]);
    if (!isSame) prevImagesRef.current = normalized;
    return prevImagesRef.current;
  }, [selectedVariant, product]);

  useEffect(() => {
    if (!productImages || productImages.length <= 1) return;
    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [productImages]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productImages]);

  const basePrice = product.price || 0;
  const variantPrice = selectedVariant?.price || 0;
  const totalBeforeFactor = basePrice + variantPrice;
  const priceFactor = altaDemanda?.priceFactor || 1;
  const totalPrice = Math.ceil((totalBeforeFactor * priceFactor) / 100) * 100;

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

  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((alta) => {
      setAltaDemanda(alta);
    });
    return () => unsubscribe();
  }, []);

  const handleVariantSelect = (key, value) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
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
            <div className="flex flex-row gap-2 items-center justify-center my-4">
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

            {product.detailDescription && (
              <p className="font-coolvetica text-xs text-gray-400 font-light pl-4 pr-16 leading-tight">
                {product.detailDescription.charAt(0).toUpperCase() +
                  product.detailDescription.slice(1).toLowerCase()}
              </p>
            )}

            {customization && (
              <div className="gap-2 w-full mt-8 flex justify-center px-4 flex flex-col">
                {Object.entries(variantStats).map(([key, values]) => (
                  <div key={key}>
                    <h5 className="font-coolvetica font-light mb-2 text-xs w-full text-gray-900">
                      {clientConfig?.labels?.[key] || capitalizeWords(key)}
                    </h5>
                    <div className="flex w-full overflow-auto">
                      <div className="flex">
                        {values.map((value, index) => {
                          const isSelected = selectedVariants[key] === value;
                          const isDisabled =
                            !availableOptions[key]?.includes(value);

                          const isFirst = index === 0;
                          const isLast = index === values.length - 1;
                          const isOnly = values.length === 1;

                          const borderRadiusClass = isOnly
                            ? 'rounded-full'
                            : isFirst
                            ? 'rounded-l-full'
                            : isLast
                            ? 'rounded-r-full'
                            : 'rounded-none';

                          const variant = (product.variants || []).find(
                            (v) =>
                              v.attributes?.[key] &&
                              v.attributes[key].toLowerCase() === value
                          );

                          const hasAttributeImage =
                            variant &&
                            Array.isArray(variant.attributeImage) &&
                            variant.attributeImage.length > 0;

                          return (
                            <button
                              key={value}
                              onClick={() =>
                                !isDisabled && handleVariantSelect(key, value)
                              }
                              disabled={isDisabled}
                              className={`px-4 h-10 font-coolvetica text-xs transition-all duration-200 border border-gray-200 font-light ${borderRadiusClass} ${
                                index > 0 ? '-ml-px' : ''
                              } flex items-center justify-center
                ${
                  !hasAttributeImage
                    ? isSelected
                      ? 'bg-black text-white'
                      : 'bg-gray-50 text-gray-400'
                    : ''
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
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
                                  src={variant.attributeImage[0]}
                                  alt={value}
                                  className={`w-full h-full object-cover transition-opacity duration-200 ${
                                    isSelected ? 'opacity-100' : 'opacity-50'
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

            <div className="flex flex-row items-center w-full mt-6 px-3 ">
              <QuickAddToCart
                product={productToSend}
                calculatedPrice={totalPrice}
                displayAsFullButton={true}
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
              <VideoSlider reels={reels} />
            </div>
            {logo && (
              <img
                src={logo}
                className="invert brightness-0 w-1/3 mx-auto flex justify-center my-16"
                alt=""
              />
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Flecha superior izquierda para cerrar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(false);
            }}
            className="absolute top-4 left-4 text-white bg-black bg-opacity-50 rounded-full p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div
            className="relative flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón izquierda (solo si hay más de una imagen) */}
            {productImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(
                    (prev) =>
                      (prev - 1 + productImages.length) % productImages.length
                  );
                }}
                className="absolute left-0 text-white text-3xl px-4"
              >
                ‹
              </button>
            )}

            {/* Imagen ampliada */}
            <img
              src={productImages[selectedImageIndex]}
              alt={product.name}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />

            {/* Botón derecha (solo si hay más de una imagen) */}
            {productImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(
                    (prev) => (prev + 1) % productImages.length
                  );
                }}
                className="absolute right-0 text-white text-3xl px-4"
              >
                ›
              </button>
            )}
          </div>

          {/* Circulitos dentro del modal (solo si hay más de una imagen) */}
          {productImages.length > 1 && (
            <div className="flex flex-row gap-2 mt-4">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(index);
                  }}
                  className={`h-12 w-12 rounded-full overflow-hidden border-2 transition-all duration-200 ${
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
          )}
        </div>
      )}
    </div>
  );
};

export default DetailCard;
