import { Link, useLocation, useNavigate } from "react-router-dom";
import { useClient } from "../../contexts/ClientContext";

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const Items = ({
  img,
  name,
  categoryId,
  isPedidoComponente = false,
  handleItemClick,
  selectedItem,
  isActive = false,
}) => {
  const { slugEmpresa, slugSucursal } = useClient();

  const location = useLocation();
  const navigate = useNavigate();

  const isCarrito = location.pathname.includes("/carrito");
  // Usar categoryId si está disponible, sino usar name (para mantener compatibilidad)
  const itemId = categoryId || name;

  const className = `flex flex-col items-center shadow-lg shadow-gray-300 rounded-3xl bg-gray-50 transition duration-300 text-black ${
    isCarrito || isPedidoComponente
      ? "w-[128px]"
      : "min-w-[128px] max-w-[200px]"
  } ${isActive ? "border-2 border-gray-50" : ""}`;

  let imageSrc = img;
  if (isCarrito) {
    imageSrc =
      img.startsWith("/menu/") || img.startsWith("http") ? img : `/menu/${img}`;
  }

  // Console.log para ver la imagen que se va a mostrar
  // console.log("ee", imageSrc);

  const content = (
    <>
      <div className="w-full aspect-square rounded-3xl overflow-hidden bg-gray-100 relative flex items-center justify-center">
        {imageSrc === "/menu//placeholder-product.jpg" ? (
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
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
        ) : (
          <img
            className="absolute inset-0 w-full h-full object-cover"
            src={imageSrc}
            alt={name}
          />
        )}

        {/* Texto sobre la imagen con blur desvanecido */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Capa de blur desvanecido */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              maskImage:
                "linear-gradient(to top, black, black 20%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to top, black, black 20%, transparent)",
            }}
          />

          {/* Gradiente de color */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />

          {/* Texto con opacidad completa */}
          <div className="relative p-4">
            <h5 className="text-sm font-primary font-light text-white truncate">
              {capitalizeWords(name)}
            </h5>
          </div>
        </div>
      </div>
    </>
  );

  // ✅ Lógica de redirección inteligente
  if (isCarrito || isPedidoComponente) {
    const smartHandleClick = handleItemClick
      ? () => {
          if (isCarrito) {
            const productCategory = selectedItem?.category || "general";
            const productId =
              selectedItem?.id || selectedItem?.productId || itemId;
            const productUrl = `/${slugEmpresa}/${slugSucursal}/menu/${productCategory}/${productId}`;
            navigate(productUrl);
          } else {
            handleItemClick();
          }
        }
      : handleItemClick;

    return (
      <div
        className={className + (smartHandleClick ? " cursor-pointer" : "")}
        onClick={smartHandleClick}
      >
        {content}
      </div>
    );
  } else {
    const category = selectedItem?.category || itemId;
    const redirectUrl = `/${slugEmpresa}/${slugSucursal}/menu/${category}`;
    return (
      <Link className={className} to={redirectUrl}>
        {content}
      </Link>
    );
  }
};

export default Items;
