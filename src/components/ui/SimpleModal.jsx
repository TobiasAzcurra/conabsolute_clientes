import ReactDOM from "react-dom";

const SimpleModal = ({
  isOpen,
  onClose,
  title,
  message,
  errorList = [],
  onUpdateStock,
  onRemoveItem,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-8">
      <div className="bg-gray-50 flex flex-col items-center justify-center rounded-3xl shadow-xl w-fit max-w-md font-primary pt-4">
        {title && (
          <h2 className="text-sm font-light px-6 text-center mb-4">{title}</h2>
        )}

        <div className="px-8 text-center mb-4 w-full">
          {errorList.length > 0 ? (
            <div className="text-xs font-light text-gray-400">
              <ul
                className={`list-disc list-inside ${
                  errorList.length > 5 ? "max-h-[400px] overflow-y-auto" : ""
                }`}
              >
                {errorList.map((error) => (
                  <li
                    key={error.itemId}
                    className="flex justify-between gap-2 w-full items-center mb-2"
                  >
                    <p className="text-left">
                      {error.productName}: {error.message}
                    </p>
                    <button
                      onClick={() =>
                        error.errorType === "RACE_CONDITION"
                          ? onUpdateStock(error.itemId)
                          : onRemoveItem(error.itemId)
                      }
                      className={`text-xs px-2.5 py-1.5 rounded-full ${
                        error.errorType === "RACE_CONDITION"
                          ? "text-blue-700 border border-blue-700"
                          : "text-red-500  bg-red-50"
                      }`}
                    >
                      {error.errorType === "RACE_CONDITION"
                        ? "Actualizar"
                        : "Eliminar"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs font-light text-gray-400">{message}</p>
          )}
        </div>

        <div className="w-full">
          <button
            onClick={onClose}
            className="w-full h-12 border-t text-sm text-blue-700 font-light"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default SimpleModal;
