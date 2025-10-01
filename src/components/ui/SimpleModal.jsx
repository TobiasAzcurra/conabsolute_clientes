import ReactDOM from "react-dom";

const SimpleModal = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "Entendido",
  twoButtons = false,
  onConfirm,
  cancelText = "Cancelar",
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-8">
      <div className="bg-gray-50 flex flex-col items-center justify-center rounded-3xl shadow-xl w-fit max-w-md  font-primary  pt-4">
        {title && (
          <h2 className="text-sm font-light px-6 text-center mb-4">{title}</h2>
        )}

        <div className="px-8 text-center mb-4">
          <p className="text-xs font-light text-gray-400">{message}</p>
        </div>

        <div className="w-full">
          {twoButtons ? (
            <div className="flex border-t">
              <button
                onClick={onClose}
                className="flex-1 h-12 text-sm text-gray-600 font-light border-r"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 h-12 text-sm text-blue-700 font-light"
              >
                {confirmText}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full h-12 border-t text-sm text-blue-700 font-light"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default SimpleModal;
