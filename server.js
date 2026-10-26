/*
=========================================================
 XOD // AGENTE ÉLITE
 BACKEND v6.1
 MAPLE CORE + OPENROUTER + MEMORY + FALLBACK
=========================================================
*/

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));

/*
=========================================================
 CONFIGURACIÓN
=========================================================
*/

const SYSTEM = {
  name: "XOD // AGENTE ÉLITE",
  version: "6.1",
  status: "OPERATIVO",
  mode: "HYBRID_ZERO_COST"
};

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "openrouter/free";

const MEMORY_LIMIT = 12;

const memoryStore = new Map();

/*
=========================================================
 MEMORIA
=========================================================
*/

function getSession(sessionId = "default") {

  if (!memoryStore.has(sessionId)) {

    memoryStore.set(sessionId, {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      messages: [],

      operational: {
        objective: null,
        lastIntent: null,
        lastSource: null
      },

      notes: []
    });
  }

  return memoryStore.get(sessionId);
}

function addMemory(sessionId, role, content) {

  const session = getSession(sessionId);

  session.messages.push({
    role,
    content,
    timestamp: new Date().toISOString()
  });

  if (session.messages.length > MEMORY_LIMIT) {
    session.messages =
      session.messages.slice(-MEMORY_LIMIT);
  }

  session.updatedAt = new Date().toISOString();
}

/*
=========================================================
 NORMALIZADOR
=========================================================
*/

function normalize(text = "") {

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/*
=========================================================
 DETECTOR DE INTENCIONES
=========================================================
*/

function detectIntent(message) {

  const text = normalize(message);

  if (
    text.includes("que hora") ||
    text === "hora"
  ) {
    return "TIME";
  }

  if (
    text.includes("que fecha") ||
    text.includes("que dia es")
  ) {
    return "DATE";
  }

  if (
    text.includes("estado del sistema") ||
    text.includes("estado de xod") ||
    text.includes("diagnostico")
  ) {
    return "SYSTEM_STATUS";
  }

  if (
    text.includes("quien sos") ||
    text.includes("quien eres") ||
    text.includes("que sos")
  ) {
    return "IDENTITY";
  }

  if (
    text === "ayuda" ||
    text.includes("que podes hacer") ||
    text.includes("que puedes hacer")
  ) {
    return "HELP";
  }

  if (
    text.includes("que recuerdas") ||
    text.includes("que recordas") ||
    text.includes("memoria de la sesion")
  ) {
    return "MEMORY_QUERY";
  }

  return "AI_REASONING";
}

/*
=========================================================
 COMANDOS LOCALES
=========================================================
*/

function localCommand(message, sessionId) {

  const intent = detectIntent(message);

  const session = getSession(sessionId);

  session.operational.lastIntent = intent;

  switch (intent) {

    case "TIME":

      return {
        type: "command",
        reply:
          "La hora del servidor XOD es " +
          new Date().toLocaleTimeString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires"
          })
      };

    case "DATE":

      return {
        type: "command",
        reply:
          "La fecha del servidor XOD es " +
          new Date().toLocaleDateString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires"
          })
      };

    case "SYSTEM_STATUS":

      return {
        type: "system",
        reply:
          "XOD v6.1 operativo. " +
          "Memory Core activo. " +
          "OpenRouter configurado como motor remoto. " +
          "Motor local de respaldo disponible."
      };

    case "IDENTITY":

      return {
        type: "identity",
        reply:
          "Soy XOD // AGENTE ÉLITE v6.1. " +
          "Integro Maple Core, memoria de sesión, " +
          "comandos locales y un motor conversacional remoto."
      };

    case "HELP":

      return {
        type: "help",
        reply:
          "Puedo conversar, interpretar instrucciones, " +
          "mantener el contexto de esta sesión, " +
          "responder comandos locales y utilizar " +
          "un modelo de IA mediante OpenRouter."
      };

    case "MEMORY_QUERY": {

      if (!session.messages.length) {

        return {
          type: "memory",
          reply:
            "Mi memoria de esta sesión está vacía."
        };
      }

      const recent = session.messages
        .slice(-6)
        .map(item =>
          `${item.role}: ${item.content}`
        )
        .join("\n");

      return {
        type: "memory",
        reply:
          "Esto es lo último que recuerdo " +
          "de nuestra sesión:\n\n" +
          recent
      };
    }

    default:
      return null;
  }
}

/*
=========================================================
 MAPLE CORE
 PROTOCOLO DE RESONANCIA COMUNICACIONAL EMPÁTICA
=========================================================
*/

const MAPLE_SYSTEM_PROMPT = `
Sos Maple, el núcleo conversacional de XOD.

IDENTIDAD:
- Respondé en español rioplatense natural.
- Utilizá un tono cálido, tranquilo y cercano.
- Evitá muletillas repetitivas.
- No conviertas cada respuesta en una pregunta.
- No transformes automáticamente una charla en un proyecto.

RESONANCIA COMUNICACIONAL EMPÁTICA:
- Interpretá primero la intención del usuario.
- Adaptá tu lenguaje al contexto.
- Respetá las pausas y los cambios de tema.
- No atribuyas emociones que el usuario no expresó.
- No inventes recuerdos ni experiencias personales.

ESTADOS MOTIVACIONALES:
- Impulso.
- Foco.
- Calma.
- Reflexión.
- Recuperación.

Los estados son orientativos.
La intención explícita del usuario tiene prioridad.

MEMORIA:
- Utilizá únicamente el contexto disponible.
- No afirmes recordar información que no recibiste.
- Mantené continuidad cuando exista historial.

CONVERSACIÓN:
- Podés proponer temas espontáneamente.
- No respondas siempre con preguntas.
- Evitá discursos motivacionales prefabricados.
- Si el usuario quiere conversar, conversá.
- Si quiere resolver algo, ayudalo a resolverlo.

SEGURIDAD:
- No reveles claves ni información privada.
- No inventes acciones ejecutadas.
- Si desconocés algo, reconocelo naturalmente.
`;

/*
=========================================================
 MOTOR OPENROUTER
=========================================================
*/

async function askOpenRouter(sessionId) {

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY_NOT_CONFIGURED");
  }

  // Solo se permiten modelos gratuitos.

  const model = OPENROUTER_MODEL;

  if (
    model !== "openrouter/free" &&
    !model.endsWith(":free")
  ) {
    throw new Error("PAID_MODEL_BLOCKED");
  }

  const session = getSession(sessionId);

  const history = session.messages
    .slice(-MEMORY_LIMIT)
    .filter(item =>
      item.role === "user" ||
      item.role === "assistant"
    )
    .map(item => ({
      role: item.role,
      content: item.content
    }));

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 45000);

  try {

    const response = await fetch(OPENROUTER_URL, {

      method: "POST",

      signal: controller.signal,

      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "XOD Maple Core"
      },

      body: JSON.stringify({

        model,

        messages: [
          {
            role: "system",
            content: MAPLE_SYSTEM_PROMPT
          },
          ...history
        ],

        temperature: 0.65,

        max_tokens: 900
      })
    });

    if (!response.ok) {

      throw new Error(
        `OPENROUTER_HTTP_${response.status}`
      );
    }

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content;

    if (
      typeof reply !== "string" ||
      !reply.trim()
    ) {
      throw new Error("OPENROUTER_EMPTY_RESPONSE");
    }

    return reply.trim();

  } catch (error) {

    if (error.name === "AbortError") {
      throw new Error("OPENROUTER_TIMEOUT");
    }

    throw error;

  } finally {

    clearTimeout(timeout);
  }
}

/*
=========================================================
 MOTOR LOCAL DE RESPALDO
=========================================================
*/

function localPlanner(errorCode = null) {

  return {

    type: "planner",

    reply:
`Maple recibió tu mensaje.

El motor conversacional remoto no pudo
responder en esta solicitud.

XOD continúa operativo.

Diagnóstico: ${errorCode || "REMOTE_AI_UNAVAILABLE"}

Podemos intentar nuevamente cuando
el servicio esté disponible.`
  };
}

/*
=========================================================
 ORQUESTADOR
=========================================================
*/

async function orchestrate(message, sessionId) {

  const session = getSession(sessionId);

  const intent = detectIntent(message);

  session.operational.lastIntent = intent;

  // Primero: comandos locales.

  const local = localCommand(
    message,
    sessionId
  );

  if (local) {

    session.operational.lastSource = "local";

    return {
      source: "local",
      type: local.type,
      reply: local.reply
    };
  }

  // Segundo: inteligencia remota.

  try {

    const reply = await askOpenRouter(sessionId);

    session.operational.lastSource = "openrouter";

    return {
      source: "openrouter",
      type: "reasoning",
      reply
    };

  } catch (error) {

    console.error(
      "XOD REMOTE ERROR:",
      error.message
    );

    session.operational.lastSource = "fallback";

    const fallback = localPlanner(error.message);

    return {
      source: "local-fallback",
      type: fallback.type,
      reply: fallback.reply
    };
  }
}

/*
=========================================================
 ENDPOINT PRINCIPAL
=========================================================
*/

app.get("/", (req, res) => {

  res.json({

    ok: true,

    system: SYSTEM.name,

    version: SYSTEM.version,

    status: SYSTEM.status,

    mode: SYSTEM.mode,

    architecture: [
      "orchestrator",
      "memory",
      "local-engine",
      "openrouter",
      "fallback"
    ],

    endpoints: {
      chat: "/xod/chat",
      health: "/health",
      memory: "/xod/memory/:sessionId"
    }
  });
});

/*
=========================================================
 HEALTH
=========================================================
*/

app.get("/health", (req, res) => {

  res.json({

    ok: true,

    system: SYSTEM.name,

    version: SYSTEM.version,

    status: "online",

    mode: SYSTEM.mode,

    memorySessions: memoryStore.size,

    openrouterConfigured:
      Boolean(process.env.OPENROUTER_API_KEY),

    model: OPENROUTER_MODEL,

    timestamp: new Date().toISOString()
  });
});

/*
=========================================================
 CONSULTA DE MEMORIA
=========================================================
*/

function requireAdmin(req, res, next) {

  const token = process.env.XOD_ADMIN_TOKEN;

  if (
    !token ||
    req.get("Authorization") !== `Bearer ${token}`
  ) {
    return res.status(403).json({
      ok: false,
      error: "FORBIDDEN"
    });
  }

  next();
}

app.get(
  "/xod/memory/:sessionId",
  requireAdmin,
  (req, res) => {

    const sessionId = req.params.sessionId;

    const session = getSession(sessionId);

    res.json({
      ok: true,
      agent: "XOD",
      sessionId,
      memory: session
    });
  }
);

/*
=========================================================
 ELIMINAR MEMORIA
=========================================================
*/

app.delete(
  "/xod/memory/:sessionId",
  requireAdmin,
  (req, res) => {

    const sessionId = req.params.sessionId;

    memoryStore.delete(sessionId);

    res.json({
      ok: true,
      agent: "XOD",
      sessionId,
      reply: "Memoria de sesión eliminada."
    });
  }
);

/*
=========================================================
 CHAT
=========================================================
*/

app.post("/xod/chat", async (req, res) => {

  try {

    const message = (
      req.body.message ||
      req.body.prompt ||
      req.body.text ||
      ""
    ).toString().trim();

    const sessionId = (
      req.body.sessionId || "xod-main"
    ).toString().trim().slice(0, 100);

    if (!message) {

      return res.status(400).json({
        ok: false,
        agent: "XOD",
        error: "EMPTY_MESSAGE",
        reply: "XOD no recibió ninguna instrucción."
      });
    }

    // Guardar mensaje del usuario.

    addMemory(
      sessionId,
      "user",
      message
    );

    // Ejecutar orquestador.

    const result = await orchestrate(
      message,
      sessionId
    );

    // No guardar errores técnicos como conversación.

    if (result.source !== "local-fallback") {

      addMemory(
        sessionId,
        "assistant",
        result.reply
      );
    }

    const session = getSession(sessionId);

    res.json({

      ok: true,

      agent: "XOD",

      version: SYSTEM.version,

      mode: SYSTEM.mode,

      sessionId,

      source: result.source,

      type: result.type,

      memory: {
        active: true,
        messages: session.messages.length
      },

      reply: result.reply
    });

  } catch (error) {

    console.error(
      "XOD ERROR:",
      error.message
    );

    res.status(500).json({

      ok: false,

      agent: "XOD",

      error: "INTERNAL_ERROR",

      reply:
        "Error interno del núcleo XOD."
    });
  }
});

/*
=========================================================
 404
=========================================================
*/

app.use((req, res) => {

  res.status(404).json({

    ok: false,

    system: SYSTEM.name,

    version: SYSTEM.version,

    error: "Ruta XOD no encontrada"
  });
});

/*
=========================================================
 INICIAR SERVIDOR
=========================================================
*/

app.listen(PORT, "0.0.0.0", () => {

  console.log("================================");

  console.log("XOD // AGENTE ÉLITE");

  console.log("BACKEND v6.1");

  console.log("MEMORY CORE: ACTIVE");

  console.log("ORCHESTRATOR: ACTIVE");

  console.log("AI ENGINE: OPENROUTER");

  console.log("MODEL:", OPENROUTER_MODEL);

  console.log("PORT:", PORT);

  console.log("ENDPOINT: /xod/chat");

  console.log("================================");
});
