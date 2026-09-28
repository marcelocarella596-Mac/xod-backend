const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));


/* =====================================================
   XOD // AGENTE ÉLITE
   BACKEND v4.0 — MODO $0
===================================================== */

const SYSTEM = {
  name: "XOD // AGENTE ÉLITE",
  version: "4.0",
  status: "OPERATIVO",
  mode: "ZERO_COST"
};


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
    endpoint: "/xod/chat",
    health: "/health"
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
    mode: "ZERO_COST",
    timestamp: new Date().toISOString()
  });

});


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
   MOTOR LOCAL XOD
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
    text.includes("diagnostico")
  ) {

    return {
      type: "system",
      reply:
        "XOD // AGENTE ÉLITE v4.0 operativo. " +
        "Backend conectado. Modo $0 activo. " +
        "Motor local disponible."
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
        "Soy XOD // AGENTE ÉLITE. " +
        "Estoy funcionando mediante el backend XOD v4.0 " +
        "en modo ZERO_COST."
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
        "Puedo ejecutar comandos locales, informar mi estado, " +
        "procesar instrucciones básicas y actuar como núcleo " +
        "del sistema XOD. El motor de lenguaje externo se encuentra " +
        "desacoplado para mantener el sistema en modo $0."
    };

  }


  return null;

}


/* =====================================================
   PLANIFICADOR LOCAL
===================================================== */

function localPlanner(message) {

  const text = message.trim();

  /*
    Esto NO pretende fingir ser un LLM.

    Cuando XOD no reconoce un comando,
    genera una estructura operativa local.
  */

  return {
    type: "planner",

    reply:
`XOD recibió la instrucción:

"${text}"

MODO: ZERO_COST

Análisis local:
• Instrucción recibida correctamente.
• Backend XOD operativo.
• No se utilizó ninguna API de pago.
• Esta solicitud requiere razonamiento de lenguaje avanzado.

Próximo nivel:
Conectar un motor IA gratuito o local al núcleo XOD
sin modificar la interfaz principal.`
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


    /* MOTOR LOCAL */

    const local = localCommand(message);

    if (local) {

      console.log("XOD LOCAL >", local.type);

      return res.json({
        ok: true,
        agent: "XOD",
        source: "local",
        mode: "ZERO_COST",
        type: local.type,
        reply: local.reply
      });

    }


    /* PLANIFICADOR */

    const plan = localPlanner(message);

    console.log("XOD PLANNER");


    return res.json({
      ok: true,
      agent: "XOD",
      source: "local-planner",
      mode: "ZERO_COST",
      type: plan.type,
      reply: plan.reply
    });


  } catch (error) {

    console.error("XOD ERROR:", error);

    return res.status(500).json({
      ok: false,
      agent: "XOD",
      error: "INTERNAL_ERROR",
      reply: "Error interno del núcleo XOD."
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
    error: "Ruta XOD no encontrada"
  });

});


/* =====================================================
   START
===================================================== */

app.listen(PORT, "0.0.0.0", () => {

  console.log("================================");
  console.log("XOD // AGENTE ÉLITE");
  console.log("BACKEND v4.0");
  console.log("MODO: ZERO_COST");
  console.log("STATUS: OPERATIVO");
  console.log("PORT:", PORT);
  console.log("ENDPOINT: /xod/chat");
  console.log("================================");

});
