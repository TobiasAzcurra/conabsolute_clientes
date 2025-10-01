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

  const className = `flex flex-col items-center shadow-lg shadow-gray-200 rounded-2xl bg-gray-50 transition duration-300 text-black ${
    isCarrito || isPedidoComponente
      ? "w-[110px]"
      : "min-w-[110px] max-w-[200px]"
  } ${isActive ? "border-2 border-gray-900" : ""}`;

  let imageSrc = img;
  if (isCarrito) {
    imageSrc =
      img.startsWith("/menu/") || img.startsWith("http") ? img : `/menu/${img}`;
  }

  // Console.log para ver la imagen que se va a mostrar
  console.log("ee", imageSrc);

  const content = (
    <>
      <div className="h-[70px] w-full rounded-t-[14px] overflow-hidden items-center   bg-gray-200 to-gray-300 relative flex justify-center">
        {imageSrc === "/menu//placeholder-product.jpg" ? (
          // SVG fallback si no hay imagen

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
            className="object-cover absolute h-full w-full"
            src={imageSrc}
            alt={name}
          />
        )}
      </div>
      <h5 className="h-10 flex items-center px-4 text-xs  font-primary   w-full font-light text-gray-900">
        <span className="truncate  max-w-[100px]">{capitalizeWords(name)}</span>
      </h5>
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
