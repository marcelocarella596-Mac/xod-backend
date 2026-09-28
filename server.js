const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   XOD // AGENTE ÉLITE
   BACKEND v6.0 — MEMORY CORE + GEMINI + FALLBACK
===================================================== */

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));


/* =====================================================
   SYSTEM
===================================================== */

const SYSTEM = {
  name: "XOD // AGENTE ÉLITE",
  version: "6.0",
  status: "OPERATIVO",
  mode: "HYBRID_ZERO_COST"
};


/* =====================================================
   MEMORY CORE
   FASE 1: memoria RAM
===================================================== */

const memoryStore = new Map();

const MEMORY_LIMIT = 12;


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

  /*
     Evitamos crecimiento infinito.
  */

  if (session.messages.length > MEMORY_LIMIT) {
    session.messages =
      session.messages.slice(-MEMORY_LIMIT);
  }

  session.updatedAt =
    new Date().toISOString();
}


function buildMemoryContext(sessionId) {

  const session = getSession(sessionId);

  if (!session.messages.length) {
    return "No existe conversación previa.";
  }

  return session.messages
    .map(item =>
      `${item.role.toUpperCase()}: ${item.content}`
    )
    .join("\n");
}


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
   INTENT CLASSIFIER
===================================================== */

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


/* =====================================================
   LOCAL COMMAND ENGINE
===================================================== */

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
          new Date().toLocaleTimeString("es-AR")
      };


    case "DATE":

      return {
        type: "command",
        reply:
          "La fecha del servidor XOD es " +
          new Date().toLocaleDateString("es-AR")
      };


    case "SYSTEM_STATUS":

      return {
        type: "system",
        reply:
          "XOD // AGENTE ÉLITE v6.0 operativo. " +
          "Memory Core activo. Orquestador activo. " +
          "Gemini configurado como núcleo remoto " +
          "con motor local de respaldo."
      };


    case "IDENTITY":

      return {
        type: "identity",
        reply:
          "Soy XOD // AGENTE ÉLITE v6.0. " +
          "Funciono mediante una arquitectura híbrida " +
          "con memoria de sesión, orquestador, " +
          "motor local y núcleo IA remoto."
      };


    case "HELP":

      return {
        type: "help",
        reply:
          "Puedo interpretar instrucciones, mantener " +
          "contexto durante esta sesión, ejecutar comandos " +
          "locales y utilizar el núcleo IA remoto para " +
          "solicitudes que requieren razonamiento."
      };


    case "MEMORY_QUERY":

      if (!session.messages.length) {

        return {
          type: "memory",
          reply:
            "Mi memoria de esta sesión todavía está vacía."
        };

      }

      const recent =
        session.messages
          .slice(-6)
          .map(
            item =>
              `${item.role}: ${item.content}`
          )
          .join("\n");

      return {
        type: "memory",
        reply:
          "Esto es lo último que tengo en la memoria " +
          "de esta sesión:\n\n" +
          recent
      };


    default:

      return null;
  }

}


/* =====================================================
   GEMINI ENGINE
===================================================== */

async function askGemini(message, sessionId) {

  const API_KEY =
    process.env.GEMINI_API_KEY;

  if (!API_KEY) {

    throw new Error(
      "GEMINI_API_KEY_NOT_CONFIGURED"
    );

  }


  const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite";


  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`;


  const memory =
    buildMemoryContext(sessionId);


  const controller =
    new AbortController();


  const timeout =
    setTimeout(() => {
      controller.abort();
    }, 30000);


  try {

    const response =
      await fetch(url, {

        method: "POST",

        signal: controller.signal,

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          contents: [

            {
              role: "user",

              parts: [

                {
                  text:
`Sos XOD // AGENTE ÉLITE.

Funcionás como núcleo inteligente de un
sistema de agentes orientado a objetivos.

Tu arquitectura conceptual incluye:

- Orquestador
- Memoria
- Planificador
- Ejecutor
- Crítico
- Verificador

Respondé principalmente en español.

REGLAS:

1. Interpretá la intención del usuario.
2. Utilizá el contexto disponible.
3. Resolvé la solicitud concreta.
4. Dividí problemas complejos cuando sea útil.
5. Detectá información faltante.
6. Proponé acciones concretas.
7. No afirmes haber ejecutado acciones externas
   que realmente no ejecutaste.
8. Diferenciá memoria de razonamiento.
9. Evitá inventar recuerdos.
10. Sé claro y operativo.

MEMORIA RECIENTE:

${memory}

INSTRUCCIÓN ACTUAL:

${message}`
                }

              ]

            }

          ],

          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1200
          }

        })

      });


    if (!response.ok) {

      const body =
        await response.text();

      console.error(
        "GEMINI HTTP ERROR:",
        response.status,
        body
      );

      throw new Error(
        `GEMINI_HTTP_${response.status}`
      );

    }


    const data =
      await response.json();


    const reply =
      data?.candidates?.[0]
        ?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();


    if (!reply) {

      console.error(
        "GEMINI EMPTY RESPONSE:",
        JSON.stringify(data)
      );

      throw new Error(
        "GEMINI_EMPTY_RESPONSE"
      );

    }


    return reply;


  } catch (error) {

    if (error.name === "AbortError") {

      throw new Error(
        "GEMINI_TIMEOUT"
      );

    }

    throw error;


  } finally {

    clearTimeout(timeout);

  }

}


/* =====================================================
   FALLBACK PLANNER
===================================================== */

function localPlanner(message, errorCode = null) {

  return {
    type: "planner",

    reply:
`XOD recibió la instrucción:

"${message}"

MODO: HYBRID_ZERO_COST

Estado:
• Backend XOD operativo.
• Memory Core operativo.
• Motor local operativo.
• El núcleo IA remoto no pudo responder en esta solicitud.
• XOD permaneció activo mediante el sistema de respaldo.

Diagnóstico interno: ${errorCode || "REMOTE_AI_UNAVAILABLE"}

La instrucción quedó registrada en la memoria de sesión.`
  };

}


/* =====================================================
   ORCHESTRATOR
===================================================== */

async function orchestrate(message, sessionId) {

  const session =
    getSession(sessionId);


  /*
     1. Detectamos intención
  */

  const intent =
    detectIntent(message);

  session.operational.lastIntent =
    intent;


  /*
     2. Probamos motor local
  */

  const local =
    localCommand(
      message,
      sessionId
    );


  if (local) {

    session.operational.lastSource =
      "local";

    return {
      source: "local",
      type: local.type,
      reply: local.reply
    };

  }


  /*
     3. IA REMOTA
  */

  try {

    const ai =
      await askGemini(
        message,
        sessionId
      );


    session.operational.lastSource =
      "gemini";


    return {
      source: "gemini",
      type: "reasoning",
      reply: ai
    };


  } catch (error) {

    console.error(
      "XOD REMOTE ERROR:",
      error.message
    );


    session.operational.lastSource =
      "fallback";


    const fallback =
      localPlanner(
        message,
        error.message
      );


    return {
      source: "local-fallback",
      type: fallback.type,
      reply: fallback.reply
    };

  }

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

    architecture: [
      "orchestrator",
      "memory",
      "planner",
      "local-engine",
      "gemini",
      "fallback"
    ],

    endpoints: {
      chat: "/xod/chat",
      health: "/health",
      memory: "/xod/memory/:sessionId"
    }

  });

});


/* =====================================================
   HEALTH
===================================================== */

app.get("/health", (req, res) => {

  res.json({

    ok: true,

    system: SYSTEM.name,

    version: SYSTEM.version,

    status: "online",

    mode: SYSTEM.mode,

    memorySessions:
      memoryStore.size,

    geminiConfigured:
      Boolean(
        process.env.GEMINI_API_KEY
      ),

    timestamp:
      new Date().toISOString()

  });

});


/* =====================================================
   MEMORY INSPECTOR
===================================================== */

app.get(
  "/xod/memory/:sessionId",
  (req, res) => {

    const sessionId =
      req.params.sessionId ||
      "default";


    const session =
      getSession(sessionId);


    return res.json({

      ok: true,

      agent: "XOD",

      sessionId,

      memory: session

    });

  }
);


/* =====================================================
   CLEAR MEMORY
===================================================== */

app.delete(
  "/xod/memory/:sessionId",
  (req, res) => {

    const sessionId =
      req.params.sessionId ||
      "default";


    memoryStore.delete(
      sessionId
    );


    return res.json({

      ok: true,

      agent: "XOD",

      sessionId,

      reply:
        "Memoria de sesión eliminada."

    });

  }
);


/* =====================================================
   XOD CHAT
===================================================== */

app.post(
  "/xod/chat",
  async (req, res) => {

    try {

      const message =
        (
          req.body.message ||
          req.body.prompt ||
          req.body.text ||
          ""
        )
          .toString()
          .trim();


      const sessionId =
        (
          req.body.sessionId ||
          "xod-main"
        )
          .toString()
          .trim()
          .slice(0, 100);


      if (!message) {

        return res
          .status(400)
          .json({

            ok: false,

            agent: "XOD",

            error:
              "EMPTY_MESSAGE",

            reply:
              "XOD no recibió ninguna instrucción."

          });

      }


      console.log(
        `XOD [${sessionId}] >`,
        message
      );


      /*
         IMPORTANTE:

         Guardamos primero el mensaje
         del usuario.
      */

      addMemory(
        sessionId,
        "user",
        message
      );


      /*
         ORQUESTADOR
      */

      const result =
        await orchestrate(
          message,
          sessionId
        );


      /*
         Guardamos respuesta XOD
      */

      addMemory(
        sessionId,
        "assistant",
        result.reply
      );


      return res.json({

        ok: true,

        agent: "XOD",

        version:
          SYSTEM.version,

        mode:
          SYSTEM.mode,

        sessionId,

        source:
          result.source,

        type:
          result.type,

        memory: {
          active: true,
          messages:
            getSession(sessionId)
              .messages.length
        },

        reply:
          result.reply

      });


    } catch (error) {

      console.error(
        "XOD ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          ok: false,

          agent: "XOD",

          error:
            "INTERNAL_ERROR",

          reply:
            "Error interno del núcleo XOD."

        });

    }

  }
);


/* =====================================================
   404
===================================================== */

app.use((req, res) => {

  res
    .status(404)
    .json({

      ok: false,

      system:
        SYSTEM.name,

      version:
        SYSTEM.version,

      error:
        "Ruta XOD no encontrada"

    });

});


/* =====================================================
   START
===================================================== */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "================================"
    );

    console.log(
      "XOD // AGENTE ÉLITE"
    );

    console.log(
      "BACKEND v6.0"
    );

    console.log(
      "MEMORY CORE: ACTIVE"
    );

    console.log(
      "ORCHESTRATOR: ACTIVE"
    );

    console.log(
      "MODE:",
      SYSTEM.mode
    );

    console.log(
      "PORT:",
      PORT
    );

    console.log(
      "ENDPOINT: /xod/chat"
    );

    console.log(
      "================================"
    );

  }
);
