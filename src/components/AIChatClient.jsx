// components/clientApp/AIChatClient.jsx
import { useState, useEffect, useRef } from "react";
import { useClient } from "../contexts/ClientContext";
import { useClientAppAIContext } from "../hooks/useClientAppAIContext";
import { useAIChat } from "../hooks/useAIChat";

const AIChatClient = () => {
  const { rawProducts, categories, clientConfig, aiBotConfig, clientAssets } =
    useClient();

  const { context, systemPrompt } = useClientAppAIContext({
    products: rawProducts,
    categories,
    businessHours: clientConfig?.logistics?.businessHours,
    aiBotConfig,
  });

  const {
    messages,
    isTyping,
    error,
    sendMessage,
    cancelGeneration,
    clearMessages,
    MAX_IMAGES_PER_MESSAGE,
  } = useAIChat({
    context,
    systemPrompt,
  });

  const [inputValue, setInputValue] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll inicial al montar con historial
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      const timer = setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-scroll cuando llegan mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (selectedImages.length + files.length > MAX_IMAGES_PER_MESSAGE) {
      alert(`Máximo ${MAX_IMAGES_PER_MESSAGE} imágenes por mensaje`);
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} no es una imagen válida`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} es muy grande (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearAllImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputValue.trim() && selectedImages.length === 0) || isTyping) return;

    const text = inputValue;
    const imgs = [...selectedImages];

    setInputValue("");
    handleClearAllImages();

    sendMessage(text, imgs);
  };

  const handleStop = () => {
    cancelGeneration();
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
  };

  const suggestions = [
    "¿Qué productos tenés disponibles?",
    "¿Cuál es el horario de atención?",
    "¿Hacen delivery?",
    "¿Cuánto sale...?",
  ];

  if (!aiBotConfig || !aiBotConfig.enabled) {
    return null;
  }

  const botAvatar = aiBotConfig.botAvatarUrl || clientAssets?.logo;
  const botName = aiBotConfig?.name || "Asistente Virtual"; // ✅ NUEVO

  return (
    <div className="h-full flex font-primary font-light flex-col">
      {/* Header del chat */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200/20">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
          {botAvatar ? (
            <img
              src={botAvatar}
              className="w-full h-full object-cover"
              alt="Bot"
            />
          ) : (
            <span className="text-sm font-semibold text-gray-900">AI</span>
          )}
        </div>
        <div className="flex-1">
          {/* ✅ MODIFICADO: Usar nombre dinámico */}
          <h3 className="text-sm font-medium text-white">{botName}</h3>
        </div>
      </div>

      {/* Área de mensajes con ref */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4  gap-4 flex flex-col"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              {botAvatar ? (
                <img
                  src={botAvatar}
                  className="w-12 h-12 object-cover rounded-full"
                  alt="Bot"
                />
              ) : (
                <span className="text-2xl">🤖</span>
              )}
            </div>
            <p className="text-sm text-white/90 mb-6 max-w-sm">
              ¡Hola! Estoy acá para ayudarte. Preguntame lo que necesites sobre
              nuestros productos, horarios o cualquier otra consulta.
            </p>

            <div className="space-y-2 w-full max-w-sm">
              <p className="text-xs text-white/70 mb-2">
                Preguntas frecuentes:
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white text-left transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                botAvatar={botAvatar}
              />
            ))}

            {isTyping && <TypingIndicator botAvatar={botAvatar} />}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/20 border-t border-red-500/30">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200/20"
      >
        {/* Preview de imágenes */}
        {imagePreviews.length > 0 && (
          <div className="pb-2 ">
            <div className="flex gap-2 overflow-x-auto">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border-2 border-white/20"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}

              {selectedImages.length < MAX_IMAGES_PER_MESSAGE && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 flex-shrink-0 bg-white/10 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <span className="text-2xl text-white/50">+</span>
                </button>
              )}
            </div>

            <p className="text-xs text-red-500 mt-1">
              Clickea una imagen para eliminarla.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={
              isTyping || selectedImages.length >= MAX_IMAGES_PER_MESSAGE
            }
            className="h-10 w-10 flex items-center justify-center bg-white rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
            title="Adjuntar imagen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 text-gray-900"
            >
              <path
                fillRule="evenodd"
                d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 h-10 bg-white  rounded-full text-xs text-gray-900 placeholder:text-gray-900/50 focus:outline-none disabled:opacity-50"
          />

          {isTyping ? (
            <button
              type="button"
              onClick={handleStop}
              className="h-10 w-10 bg-red-500 flex items-center justify-center text-white rounded-full hover:bg-red-600 transition-colors"
              title="Detener generación"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4"
              >
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim() && selectedImages.length === 0}
              className="h-10 w-10 flex items-center justify-center bg-white rounded-full hover:bg-gray-100 transition-colors disabled:bg-white/20 disabled:text-white/50 text-gray-900 disabled:cursor-not-allowed"
              title="Enviar mensaje"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 "
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const MessageBubble = ({ message, botAvatar }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
          isUser ? "bg-white" : "bg-white/10"
        }`}
      >
        {isUser ? (
          <span className="text-xs font-semibold text-gray-900">Tú</span>
        ) : botAvatar ? (
          <img
            src={botAvatar}
            className="w-full h-full object-cover"
            alt="Bot"
          />
        ) : (
          <span className="text-xs">🤖</span>
        )}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-white text-gray-900" : "bg-primary  text-white"
        }`}
      >
        {message.images && message.images.length > 0 && (
          <div
            className={`mb-2 ${
              message.images.length > 1 ? "grid grid-cols-2 gap-2" : ""
            }`}
          >
            {message.images.map((img, index) => (
              <img
                key={index}
                src={img.preview}
                alt={`Imagen ${index + 1}`}
                className="rounded-lg max-w-full h-auto"
              />
            ))}
          </div>
        )}

        <p className="text-xs leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <p
          className={`text-xs mt-1 ${
            isUser ? "text-gray-500" : "text-white/50"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

const TypingIndicator = ({ botAvatar }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
      {botAvatar ? (
        <img src={botAvatar} className="w-full h-full object-cover" alt="Bot" />
      ) : (
        <span className="text-xs">🤖</span>
      )}
    </div>
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-1">
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
      <div
        className="w-2 h-2 bg-white rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className="w-2 h-2 bg-white rounded-full animate-bounce"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  </div>
);

export default AIChatClient;
