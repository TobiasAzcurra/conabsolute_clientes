import ReactDOM from "react-dom";

const SimpleModal = ({
  isOpen,
  onClose,
  title,
  message,
  errorList = [],
  onUpdateStock,
  onRemoveItem,
  onAdjustStock,
  twoButtons = false,
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  onConfirm,
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
                      onClick={() => {
                        if (error.errorType === "RACE_CONDITION") {
                          onUpdateStock(error.itemId);
                        } else if (error.errorType === "ADJUSTABLE_STOCK") {
                          onAdjustStock(error.itemId, error.availableStock);
                        } else {
                          onRemoveItem(error.itemId);
                        }
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded-full whitespace-nowrap ${
                        error.errorType === "RACE_CONDITION"
                          ? "text-blue-700 border border-blue-700"
                          : error.errorType === "ADJUSTABLE_STOCK"
                          ? "text-yellow-500 bg-yellow-50"
                          : "text-red-500 bg-red-50"
                      }`}
                    >
                      {error.errorType === "RACE_CONDITION"
                        ? "Actualizar"
                        : error.errorType === "ADJUSTABLE_STOCK"
                        ? "Ajustar"
                        : "Eliminar"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-xs font-light text-gray-400">{message}</div>
          )}
        </div>

        {/* ✨ NUEVO: Layout condicional de botones */}
        {twoButtons ? (
          <div className="w-full flex border-t">
            <button
              onClick={onClose}
              className="flex-1 h-12 text-sm font-light text-gray-500  border-r"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-12 text-sm font-light text-blue-700 "
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <div className="w-full">
            <button
              onClick={onClose}
              className="w-full h-12 border-t text-sm text-blue-700 font-light"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default SimpleModal;
