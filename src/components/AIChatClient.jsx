// components/clientApp/AIChatClient.jsx
import { useState, useEffect, useRef } from "react";
import { useClient } from "../contexts/ClientContext";
import { useClientAppAIContext } from "../hooks/useClientAppAIContext";
import { useAIChat } from "../hooks/useAIChat";

const AIChatClient = () => {
  const { rawProducts, categories, clientConfig, aiBotConfig, clientAssets } =
    useClient();

  // Generar contexto pasando parámetros
  const { context, systemPrompt } = useClientAppAIContext({
    products: rawProducts,
    categories,
    businessHours: clientConfig?.logistics?.businessHours,
    aiBotConfig,
  });

  // Hook de chat con persistencia
  const { messages, isTyping, error, sendMessage, clearMessages } = useAIChat({
    context,
    systemPrompt,
  });

  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // ✅ NUEVO
  const [imagePreview, setImagePreview] = useState(null); // ✅ NUEVO
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); // ✅ NUEVO

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ✅ NUEVO: Manejar selección de imagen
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen válida");
      return;
    }

    // Validar tamaño (max 10MB antes de comprimir)
    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen es muy grande (max 10MB)");
      return;
    }

    setSelectedImage(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // ✅ NUEVO: Limpiar imagen seleccionada
  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ✅ MODIFICADO: Enviar con imagen opcional
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || isTyping) return;

    await sendMessage(inputValue, selectedImage);
    setInputValue("");
    handleClearImage();
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

  return (
    <div className="h-full flex flex-col">
      {/* Header del chat */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200/20">
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
          <h3 className="text-sm font-medium text-white">Asistente Virtual</h3>
          <p className="text-xs text-white/70">En línea</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-xs text-white/70 hover:text-white"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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

            {/* Sugerencias iniciales */}
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

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-500/20 border-t border-red-500/30">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {/* ✅ NUEVO: Preview de imagen seleccionada */}
      {imagePreview && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 w-20 object-cover rounded-lg border-2 border-white/20"
            />
            <button
              onClick={handleClearImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200/20"
      >
        <div className="flex items-center gap-2">
          {/* ✅ NUEVO: Botón adjuntar imagen */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTyping}
            className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
            title="Adjuntar imagen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
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
            className="flex-1 px-4 h-12 bg-white/10 backdrop-blur-sm rounded-xl text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={(!inputValue.trim() && !selectedImage) || isTyping}
            className="p-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors disabled:bg-white/20 disabled:text-white/50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

// ✅ MODIFICADO: MessageBubble con soporte para imágenes
const MessageBubble = ({ message, botAvatar }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
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
          isUser
            ? "bg-white text-gray-900"
            : "bg-white/10 backdrop-blur-sm text-white"
        }`}
      >
        {/* ✅ NUEVO: Mostrar imagen si existe */}
        {message.image && (
          <img
            src={message.image.preview}
            alt="Imagen adjunta"
            className="rounded-lg mb-2 max-w-full h-auto"
          />
        )}

        <p className="text-sm leading-relaxed whitespace-pre-wrap">
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

// Componente TypingIndicator
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
