// hooks/useAIChat.js
import { useState, useCallback, useEffect, useRef } from "react";
import { useClient } from "../contexts/ClientContext";

const STORAGE_KEY_PREFIX = "aiChat_messages_";
const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const MAX_IMAGE_DIMENSION = 1024; // px
const MAX_IMAGES_PER_MESSAGE = 3;
const MAX_STORED_MESSAGES = 50; // ✅ NUEVO

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export const useAIChat = ({ context, systemPrompt }) => {
  const { empresaId, sucursalId } = useClient();

  const storageKey = `${STORAGE_KEY_PREFIX}${empresaId}_${sucursalId}`;

  const abortControllerRef = useRef(null);

  // ✅ MODIFICADO: Cargar mensajes (ahora sin imágenes persistidas)
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log(
          `📦 Mensajes cargados desde localStorage: ${parsed.length}`
        );
        console.log(`⚠️ Las imágenes no persisten entre sesiones`);
        return parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error("❌ Error cargando mensajes desde localStorage:", error);
    }
    return [];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  // ✅ MODIFICADO: Persistir sin imágenes + límite de mensajes
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Tomar solo los últimos N mensajes
        const recentMessages = messages.slice(-MAX_STORED_MESSAGES);

        // Stripear imágenes antes de guardar (solo metadata)
        const messagesToStore = recentMessages.map((msg) => {
          if (msg.images && msg.images.length > 0) {
            return {
              ...msg,
              // Reemplazar array de imágenes con metadata
              hasImages: true,
              imageCount: msg.images.length,
              images: undefined, // No guardar el base64
            };
          }
          return msg;
        });

        localStorage.setItem(storageKey, JSON.stringify(messagesToStore));

        const savedCount = messagesToStore.length;
        const withImages = messagesToStore.filter((m) => m.hasImages).length;
        console.log(
          `💾 ${savedCount} mensajes guardados (${withImages} con metadata de imágenes)`
        );
      } catch (error) {
        console.error("❌ Error guardando mensajes en localStorage:", error);

        // ✅ NUEVO: Fallback si localStorage está lleno
        if (error.name === "QuotaExceededError") {
          console.warn("⚠️ localStorage lleno, intentando limpiar...");
          try {
            // Intentar guardar solo los últimos 20 mensajes
            const emergencyMessages = messages.slice(-20).map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              // Sin imágenes ni metadata
            }));

            localStorage.setItem(storageKey, JSON.stringify(emergencyMessages));
            console.log(`✅ Guardados últimos 20 mensajes (modo emergencia)`);
          } catch (e) {
            console.error(
              "❌ No se pudo guardar ni en modo emergencia, limpiando storage..."
            );
            try {
              localStorage.removeItem(storageKey);
            } catch (cleanError) {
              console.error("❌ No se pudo limpiar localStorage");
            }
          }
        }
      }
    }
  }, [messages, storageKey]);

  const compressImage = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_IMAGE_DIMENSION;
              width = MAX_IMAGE_DIMENSION;
            } else {
              width = (width / height) * MAX_IMAGE_DIMENSION;
              height = MAX_IMAGE_DIMENSION;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.8;
          let base64 = canvas.toDataURL(file.type, quality);

          while (base64.length > MAX_IMAGE_SIZE && quality > 0.1) {
            quality -= 0.1;
            base64 = canvas.toDataURL(file.type, quality);
          }

          console.log(
            `📸 Imagen comprimida: ${(base64.length / 1024).toFixed(2)}KB`
          );

          resolve({
            data: base64.split(",")[1],
            mimeType: file.type,
            preview: base64,
          });
        };

        img.onerror = () => reject(new Error("Error al cargar la imagen"));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(file);
    });
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("🛑 Cancelando generación...");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTyping(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (userInput, imageFiles = []) => {
      if ((!userInput.trim() && imageFiles.length === 0) || isTyping) return;

      if (imageFiles.length > MAX_IMAGES_PER_MESSAGE) {
        setError(`Máximo ${MAX_IMAGES_PER_MESSAGE} imágenes por mensaje`);
        return;
      }

      let imagesData = [];

      if (imageFiles.length > 0) {
        try {
          console.log(`📷 Procesando ${imageFiles.length} imágenes...`);
          const compressionPromises = imageFiles.map((file) =>
            compressImage(file)
          );
          imagesData = await Promise.all(compressionPromises);
          console.log(`✅ ${imagesData.length} imágenes procesadas`);
        } catch (err) {
          console.error("❌ Error procesando imágenes:", err);
          setError("Error al procesar las imágenes");
          return;
        }
      }

      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content:
          userInput.trim() ||
          `[${imagesData.length} imagen${
            imagesData.length > 1 ? "es" : ""
          } adjunta${imagesData.length > 1 ? "s" : ""}]`,
        timestamp: new Date(),
        ...(imagesData.length > 0 && { images: imagesData }),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
      setError(null);

      abortControllerRef.current = new AbortController();

      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          throw new Error("API Key de Gemini no configurada");
        }

        const defaultSystemPrompt =
          systemPrompt ||
          "Eres un asistente de atención al cliente. Responde en español de manera profesional, clara y concisa.";

        let fullPrompt = `${defaultSystemPrompt}\n\n${context}\n\n`;

        messages.forEach((msg) => {
          const imageCount = msg.images?.length || msg.imageCount || 0;
          const content =
            imageCount > 0
              ? `${msg.content} [${imageCount} imagen${
                  imageCount > 1 ? "es" : ""
                } adjunta${imageCount > 1 ? "s" : ""}]`
              : msg.content;
          fullPrompt += `${
            msg.role === "user" ? "Usuario" : "Asistente"
          }: ${content}\n\n`;
        });

        console.log("===========================================");
        console.log("🤖 MENSAJE ENVIADO A GEMINI (Cliente):");
        console.log("===========================================");
        console.log("Historial de mensajes:", messages.length);
        console.log("Con imágenes:", imagesData.length);
        console.log("===========================================\n");

        const textContent = `${fullPrompt}Usuario: ${userMessage.content}\n\nAsistente:`;

        const parts = [{ text: textContent }];

        if (imagesData.length > 0) {
          imagesData.forEach((img) => {
            parts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: img.data,
              },
            });
          });
        }

        const requestBody = {
          contents: [
            {
              parts: parts,
            },
          ],
        };

        console.log("📤 Request body:", {
          partsCount: parts.length,
          hasImages: imagesData.length > 0,
        });

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API Error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        const aiResponse =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Lo siento, no pude generar una respuesta.";

        console.log("===========================================");
        console.log("✅ RESPUESTA DE GEMINI:");
        console.log("===========================================");
        console.log(aiResponse);
        console.log("===========================================\n");

        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("⚠️ Generación cancelada por el usuario");
          setError(null);

          const cancelMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "[Generación cancelada]",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, cancelMessage]);
        } else {
          console.error("Error al enviar mensaje:", err);
          setError(
            err instanceof Error ? err.message : "Error al conectar con la IA"
          );

          const errorMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.",
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, errorMessage]);
        }
      } finally {
        setIsTyping(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isTyping, context, systemPrompt, compressImage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(storageKey);
      console.log(`🗑️ Mensajes eliminados de localStorage`);
    } catch (error) {
      console.error("❌ Error limpiando localStorage:", error);
    }
  }, [storageKey]);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    cancelGeneration,
    clearMessages,
    MAX_IMAGES_PER_MESSAGE,
  };
};
