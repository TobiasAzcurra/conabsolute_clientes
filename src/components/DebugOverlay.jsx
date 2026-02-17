import { useEffect, useState, useRef } from "react";

const MAX_LOGS = 80;

const DebugOverlay = () => {
  const [logs, setLogs] = useState([]);
  const [visible, setVisible] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const capture =
      (type) =>
      (...args) => {
        const message = args
          .map((a) => {
            if (typeof a === "string") return a;
            try {
              return JSON.stringify(a, null, 1);
            } catch {
              return String(a);
            }
          })
          .join(" ");

        setLogs((prev) => {
          const next = [
            ...prev,
            {
              type,
              message,
              ts: new Date().toISOString().split("T")[1].split("Z")[0],
            },
          ];
          return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
        });

        // Llamamos al original también
        if (type === "log") originalLog(...args);
        if (type === "warn") originalWarn(...args);
        if (type === "error") originalError(...args);
      };

    console.log = capture("log");
    console.warn = capture("warn");
    console.error = capture("error");

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // Auto-scroll al último log cuando el overlay está abierto
  useEffect(() => {
    if (visible) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, visible]);

  const colorFor = (type) => {
    if (type === "error") return "#ff6b6b";
    if (type === "warn") return "#ffd93d";
    return "#a8ff78";
  };

  return (
    <>
      {/* Botón toggle — esquina inferior izquierda para no tapar el contenido */}
      <button
        onClick={() => setVisible((v) => !v)}
        style={{
          position: "fixed",
          bottom: 24,
          left: 16,
          zIndex: 99999,
          background: "rgba(0,0,0,0.75)",
          color: "#a8ff78",
          border: "1px solid #a8ff78",
          borderRadius: 999,
          padding: "6px 14px",
          fontSize: 11,
          fontFamily: "monospace",
          backdropFilter: "blur(8px)",
          cursor: "pointer",
        }}
      >
        {visible ? "✕ cerrar" : `🐛 logs (${logs.length})`}
      </button>

      {/* Panel de logs */}
      {visible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99998,
            background: "rgba(0,0,0,0.92)",
            overflowY: "auto",
            padding: "48px 12px 80px",
            fontFamily: "monospace",
            fontSize: 11,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <button
            onClick={() => setLogs([])}
            style={{
              alignSelf: "flex-end",
              background: "transparent",
              color: "#888",
              border: "1px solid #444",
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 10,
              cursor: "pointer",
              marginBottom: 8,
            }}
          >
            limpiar
          </button>

          {logs.length === 0 && (
            <span style={{ color: "#555" }}>Sin logs todavía...</span>
          )}

          {logs.map((log, i) => (
            <div
              key={i}
              style={{
                color: colorFor(log.type),
                borderBottom: "1px solid #1a1a1a",
                paddingBottom: 4,
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
              }}
            >
              <span style={{ color: "#555", marginRight: 6 }}>{log.ts}</span>
              {log.message}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </>
  );
};

export default DebugOverlay;
