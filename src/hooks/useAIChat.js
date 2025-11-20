// hooks/useAIChat.js
import { useState, useCallback, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { useClient } from "../contexts/ClientContext";

const STORAGE_KEY_PREFIX = "aiChat_messages_";
const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const MAX_IMAGE_DIMENSION = 1024; // px

export const useAIChat = ({ context, systemPrompt }) => {
  const { empresaId, sucursalId } = useClient();

  const storageKey = `${STORAGE_KEY_PREFIX}${empresaId}_${sucursalId}`;

  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log(
          `📦 Mensajes cargados desde localStorage: ${parsed.length}`
        );
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

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
        console.log(
          `💾 Mensajes guardados en localStorage: ${messages.length}`
        );
      } catch (error) {
        console.error("❌ Error guardando mensajes en localStorage:", error);
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

  const sendMessage = useCallback(
    async (userInput, imageFile = null) => {
      if ((!userInput.trim() && !imageFile) || isTyping) return;

      let imageData = null;

      if (imageFile) {
        try {
          console.log(`📷 Procesando imagen: ${imageFile.name}`);
          imageData = await compressImage(imageFile);
        } catch (err) {
          console.error("❌ Error procesando imagen:", err);
          setError("Error al procesar la imagen");
          return;
        }
      }

      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: userInput.trim() || "[Imagen adjunta]",
        timestamp: new Date(),
        ...(imageData && { image: imageData }),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
      setError(null);

      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          throw new Error("API Key de Gemini no configurada");
        }

        const ai = new GoogleGenAI({ apiKey });

        const defaultSystemPrompt =
          systemPrompt ||
          "Eres un asistente de atención al cliente. Responde en español de manera profesional, clara y concisa.";

        let fullPrompt = `${defaultSystemPrompt}\n\n${context}\n\n`;

        messages.forEach((msg) => {
          const content = msg.image
            ? `${msg.content} [imagen adjunta]`
            : msg.content;
          fullPrompt += `${
            msg.role === "user" ? "Usuario" : "Asistente"
          }: ${content}\n\n`;
        });

        console.log("===========================================");
        console.log("🤖 MENSAJE ENVIADO A GEMINI (Cliente):");
        console.log("===========================================");
        console.log("Historial de mensajes:", messages.length);
        console.log("Con imagen:", !!imageData);
        console.log("===========================================\n");

        // ✅ FIX: Estructura correcta para Gemini con imágenes
        let promptParts;

        if (imageData) {
          // Con imagen: usar array de partes
          promptParts = [
            `${fullPrompt}Usuario: ${userMessage.content}\n\nAsistente:`,
            {
              inlineData: {
                // ← camelCase, no snake_case
                mimeType: imageData.mimeType,
                data: imageData.data,
              },
            },
          ];
        } else {
          // Sin imagen: solo texto
          fullPrompt += `Usuario: ${userMessage.content}\n\nAsistente:`;
          promptParts = fullPrompt;
        }

        // Generar respuesta
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptParts, // ← Pasar directamente el array o string
        });

        const aiResponse =
          response.text || "Lo siento, no pude generar una respuesta.";

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
      } finally {
        setIsTyping(false);
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
    clearMessages,
  };
};
