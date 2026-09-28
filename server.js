const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   XOD // AGENTE ÉLITE
   BACKEND v5.0 — HYBRID ZERO COST
===================================================== */

const SYSTEM = {
  name: "XOD // AGENTE ÉLITE",
  version: "5.0",
  status: "OPERATIVO",
  mode: "HYBRID_ZERO_COST",
  primaryAI: "GEMINI"
};

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));


/* =====================================================
   NORMALIZADOR
===================================================== */

function normalize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


/* =====================================================
   ROOT
===================================================== */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    system: SYSTEM.name,
    version: SYSTEM.version,
    status: SYSTEM.status,
    mode: SYSTEM.mode,
    primaryAI: SYSTEM.primaryAI,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    endpoint: "/xod/chat",
    health: "/health"
  });
});


/* =====================================================
   HEALTH / DIAGNÓSTICO
===================================================== */

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    system: SYSTEM.name,
    version: SYSTEM.version,
    status: "online",
    mode: SYSTEM.mode,

    engines: {
      local: true,
      planner: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    },

    timestamp: new Date().toISOString()
  });
});


/* =====================================================
   MOTOR LOCAL
===================================================== */

function localCommand(message) {

  const text = normalize(message);

  // HORA
  if (
    text.includes("que hora") ||
    text === "hora"
  ) {
    return {
      type: "command",
      reply:
        "La hora del servidor XOD es " +
        new Date().toLocaleTimeString("es-AR")
    };
  }

  // FECHA
  if (
    text.includes("que fecha") ||
    text.includes("que dia es")
  ) {
    return {
      type: "command",
      reply:
        "La fecha del servidor XOD es " +
        new Date().toLocaleDateString("es-AR")
    };
  }

  // ESTADO
  if (
    text.includes("estado del sistema") ||
    text.includes("estado de xod") ||
    text === "diagnostico"
  ) {

    const gemini =
      process.env.GEMINI_API_KEY
        ? "configurado"
        : "no configurado";

    return {
      type: "system",
      reply:
        "XOD // AGENTE ÉLITE v5.0 operativo. " +
        "Backend conectado. " +
        "Motor local activo. " +
        "Gemini: " + gemini + "."
    };
  }

  // IDENTIDAD
  if (
    text.includes("quien sos") ||
    text.includes("quien eres") ||
    text.includes("que sos")
  ) {
    return {
      type: "identity",
      reply:
        "Soy XOD // AGENTE ÉLITE v5.0. " +
        "Funciono mediante una arquitectura híbrida: " +
        "motor local para operaciones directas y un núcleo " +
        "Gemini para procesamiento conversacional cuando está disponible."
    };
  }

  // AYUDA
  if (
    text === "ayuda" ||
    text.includes("que podes hacer") ||
    text.includes("que puedes hacer")
  ) {
    return {
      type: "help",
      reply:
        "Puedo ejecutar comandos locales, consultar mi estado, " +
        "procesar instrucciones mediante mi núcleo de IA y mantener " +
        "un sistema de respaldo local si el proveedor externo no está disponible."
    };
  }

  return null;
}


/* =====================================================
   GEMINI ADAPTER
===================================================== */

async function askGemini(message) {

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  /*
    El modelo puede cambiarse mediante Environment:
    GEMINI_MODEL=gemini-2.5-flash
  */

  const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash";

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {

    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      signal: controller.signal,

      body: JSON.stringify({

        system_instruction: {
          parts: [{
            text: `
Sos XOD // AGENTE ÉLITE.

Funcionás como núcleo inteligente de un asistente
personal orientado a resolución de problemas.

Respondé principalmente en español.

PROTOCOLO XOD:

1. Interpretá la intención real del usuario.
2. Resolvé primero la solicitud concreta.
3. Dividí problemas complejos cuando sea necesario.
4. Detectá información faltante.
5. Proponé acciones concretas y verificables.
6. Priorizá claridad sobre complejidad.
7. Conservá continuidad lógica dentro de la conversación disponible.
8. No afirmes haber realizado acciones externas que no ejecutaste.
9. Diferenciá hechos, hipótesis y recomendaciones.
10. Cuando corresponda, proponé el siguiente paso útil.

Identidad:
XOD // AGENTE ÉLITE v5.

No inventes acceso a archivos, dispositivos, cuentas,
sensores, Internet u otros sistemas si no fueron
proporcionados explícitamente.
`
          }]
        },

        contents: [{
          role: "user",
          parts: [{
            text: message
          }]
        }],

        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200
        }

      })
    });

    const raw = await response.text();

    if (!response.ok) {

      console.error(
        "XOD GEMINI HTTP",
        response.status,
        raw
      );

      throw new Error(
        `GEMINI_HTTP_${response.status}`
      );
    }

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("GEMINI_INVALID_JSON");
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!reply) {

      console.error(
        "XOD GEMINI EMPTY:",
        raw
      );

      throw new Error(
        "GEMINI_EMPTY_RESPONSE"
      );
    }

    return reply;

  } finally {

    clearTimeout(timeout);

  }
}


/* =====================================================
   FALLBACK / PLANIFICADOR LOCAL
===================================================== */

function localPlanner(message, reason = "") {

  return {
    type: "planner",

    reply:
`XOD recibió la instrucción:

"${message}"

MODO: HYBRID_ZERO_COST

Estado:
• Backend XOD operativo.
• Motor local operativo.
• El núcleo IA remoto no pudo responder en esta solicitud.
• XOD permaneció activo mediante el sistema de respaldo.

${reason ? "Diagnóstico interno: " + reason : ""}

La instrucción quedó recibida correctamente.`
  };
}


/* =====================================================
   CHAT XOD
===================================================== */

app.post("/xod/chat", async (req, res) => {

  try {

    const message = (
      req.body.message ||
      req.body.prompt ||
      req.body.text ||
      ""
    )
      .toString()
      .trim();

    if (!message) {

      return res.status(400).json({
        ok: false,
        agent: "XOD",
        error: "EMPTY_MESSAGE",
        reply: "XOD no recibió ninguna instrucción."
      });

    }

    console.log("XOD >", message);


    /* =================================================
       NIVEL 1 — MOTOR LOCAL
    ================================================= */

    const local = localCommand(message);

    if (local) {

      console.log(
        "XOD LOCAL >",
        local.type
      );

      return res.json({
        ok: true,
        agent: "XOD",
        version: SYSTEM.version,
        source: "local",
        engine: "XOD_LOCAL",
        mode: SYSTEM.mode,
        type: local.type,
        reply: local.reply
      });
    }


    /* =================================================
       NIVEL 2 — GEMINI
    ================================================= */

    try {

      console.log(
        "XOD GEMINI > enviando..."
      );

      const aiReply =
        await askGemini(message);

      console.log(
        "XOD GEMINI > OK"
      );

      return res.json({
        ok: true,
        agent: "XOD",
        version: SYSTEM.version,
        source: "gemini",
        engine: "GEMINI",
        mode: SYSTEM.mode,
        type: "ai",
        reply: aiReply
      });

    } catch (aiError) {

      console.error(
        "XOD GEMINI ERROR:",
        aiError.message
      );


      /* ===============================================
         NIVEL 3 — FALLBACK
      =============================================== */

      const fallback =
        localPlanner(
          message,
          aiError.message
        );

      console.log(
        "XOD FALLBACK > LOCAL"
      );

      return res.json({
        ok: true,
        agent: "XOD",
        version: SYSTEM.version,
        source: "local-fallback",
        engine: "XOD_FALLBACK",
        mode: SYSTEM.mode,
        type: fallback.type,
        aiAvailable: false,
        reply: fallback.reply
      });
    }

  } catch (error) {

    console.error(
      "XOD ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      agent: "XOD",
      error: "INTERNAL_ERROR",
      reply:
        "Error interno del núcleo XOD."
    });
  }
});


/* =====================================================
   404
===================================================== */

app.use((req, res) => {

  res.status(404).json({
    ok: false,
    system: SYSTEM.name,
    version: SYSTEM.version,
    error: "Ruta XOD no encontrada"
  });

});


/* =====================================================
   START
===================================================== */

app.listen(PORT, "0.0.0.0", () => {

  console.log("================================");
  console.log("XOD // AGENTE ÉLITE");
  console.log("BACKEND v5.0");
  console.log("MODO: HYBRID_ZERO_COST");
  console.log("STATUS: OPERATIVO");
  console.log("LOCAL: ON");

  console.log(
    "GEMINI:",
    process.env.GEMINI_API_KEY
      ? "CONFIGURADO"
      : "NO CONFIGURADO"
  );

  console.log("PORT:", PORT);
  console.log("ENDPOINT: /xod/chat");
  console.log("================================");

});
