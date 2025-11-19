// hooks/useAIChat.js
import { useState, useCallback, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { useClient } from "../contexts/ClientContext";

const STORAGE_KEY_PREFIX = "aiChat_messages_";

export const useAIChat = ({ context, systemPrompt }) => {
  const { empresaId, sucursalId } = useClient();

  // Key única por sucursal para persistencia
  const storageKey = `${STORAGE_KEY_PREFIX}${empresaId}_${sucursalId}`;

  // ✅ Cargar mensajes desde localStorage al montar
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
          timestamp: new Date(msg.timestamp), // Rehidratar Date objects
        }));
      }
    } catch (error) {
      console.error("❌ Error cargando mensajes desde localStorage:", error);
    }
    return [];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Persistir mensajes en localStorage cada vez que cambien
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

  const sendMessage = useCallback(
    async (userInput) => {
      if (!userInput.trim() || isTyping) return;

      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: userInput.trim(),
        timestamp: new Date(),
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

        // Construir prompt completo con contexto
        const defaultSystemPrompt =
          systemPrompt ||
          "Eres un asistente de atención al cliente. Responde en español de manera profesional, clara y concisa.";

        let fullPrompt = `${defaultSystemPrompt}\n\n${context}\n\n`;

        // Agregar historial de conversación
        messages.forEach((msg) => {
          fullPrompt += `${msg.role === "user" ? "Usuario" : "Asistente"}: ${
            msg.content
          }\n\n`;
        });

        // Agregar mensaje actual
        fullPrompt += `Usuario: ${userMessage.content}\n\nAsistente:`;

        console.log("===========================================");
        console.log("🤖 MENSAJE ENVIADO A GEMINI (Cliente):");
        console.log("===========================================");
        console.log("Historial de mensajes:", messages.length);
        console.log("\n📝 PROMPT COMPLETO:");
        console.log(fullPrompt);
        console.log("===========================================\n");

        // Generar respuesta
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: fullPrompt,
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
    [messages, isTyping, context, systemPrompt]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    // ✅ Limpiar también del localStorage
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
