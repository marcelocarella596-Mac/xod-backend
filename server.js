const express = require("express");
const cors = require("cors");

const app = express();

const PORT =
  process.env.PORT || 3000;

app.use(cors({
  origin:"*",
  methods:["GET","POST","OPTIONS"],
  allowedHeaders:[
    "Content-Type",
    "Authorization"
  ]
}));

app.use(
  express.json({
    limit:"1mb"
  })
);


/* ========================================
   XOD SYSTEM
======================================== */

const SYSTEM = {

  name:
    "XOD // AGENTE ÉLITE",

  version:
    "3.0",

  status:
    "OPERATIVO"

};


/* ========================================
   ROOT
======================================== */

app.get("/",(req,res)=>{

  res.json({

    ok:true,

    system:
      SYSTEM.name,

    version:
      SYSTEM.version,

    status:
      SYSTEM.status,

    endpoint:
      "/xod/chat"

  });

});


/* ========================================
   HEALTH
======================================== */

app.get(
  "/health",
  (req,res)=>{

    res.json({

      ok:true,

      status:
        "online",

      timestamp:
        new Date()
        .toISOString()

    });

  }
);


/* ========================================
   LOCAL COMMAND ENGINE
======================================== */

function localCommand(message){

  const text =
    message.toLowerCase();


  if(
    text.includes(
      "qué hora"
    ) ||
    text.includes(
      "que hora"
    )
  ){

    return (
      "La hora del servidor es " +
      new Date()
      .toLocaleTimeString(
        "es-AR"
      )
    );

  }


  if(
    text.includes(
      "estado del sistema"
    )
  ){

    return (
      "XOD operativo. " +
      "Backend conectado."
    );

  }


  return null;

}


/* ========================================
   OPENAI
======================================== */

async function askAI(message){

  const API_KEY =
    process.env.OPENAI_API_KEY;


  if(!API_KEY){

    return null;

  }


  const response =
    await fetch(
      "https://api.openai.com/v1/responses",
      {

        method:"POST",

        headers:{

          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${API_KEY}`

        },


        body:JSON.stringify({

          model:
            "gpt-5-mini",

          instructions:`

Sos XOD // AGENTE ÉLITE.

Funcionás como núcleo inteligente
de un asistente personal.

Respondé principalmente en español.

Objetivos:

1. Interpretar la intención del usuario.
2. Resolver la solicitud.
3. Dividir problemas complejos.
4. Proponer acciones concretas.
5. Detectar información faltante.
6. Mantener respuestas claras.
7. Utilizar razonamiento orientado
   a objetivos.
8. No afirmar que realizaste
   acciones externas que realmente
   no ejecutaste.

Cuando corresponda podés identificarte
como XOD.

`,

          input:message

        })

      }
    );


  if(!response.ok){

    const error =
      await response.text();

    console.error(
      "OPENAI:",
      error
    );

    throw new Error(
      "Error núcleo IA"
    );

  }


  const data =
    await response.json();


  if(data.output_text){

    return data.output_text;

  }


  if(
    Array.isArray(
      data.output
    )
  ){

    for(
      const item
      of data.output
    ){

      if(
        !Array.isArray(
          item.content
        )
      ){
        continue;
      }


      for(
        const content
        of item.content
      ){

        if(
          content.type ===
          "output_text"
        ){

          return content.text;

        }

      }

    }

  }


  return null;

}


/* ========================================
   XOD CHAT
======================================== */

app.post(
  "/xod/chat",
  async(req,res)=>{

    try{

      const message =
        (
          req.body.message ||
          req.body.prompt ||
          req.body.text ||
          ""
        )
        .toString()
        .trim();


      if(!message){

        return res
          .status(400)
          .json({

            ok:false,

            reply:
              "XOD no recibió ninguna instrucción."

          });

      }


      console.log(
        "XOD >",
        message
      );


      /* LOCAL */

      const local =
        localCommand(
          message
        );


      if(local){

        return res.json({

          ok:true,

          agent:"XOD",

          source:"local",

          reply:local

        });

      }


      /* IA */

      try{

        const ai =
          await askAI(
            message
          );


        if(ai){

          return res.json({

            ok:true,

            agent:"XOD",

            source:"openai",

            reply:ai

          });

        }

      }catch(error){

        console.error(
          error
        );

      }


      /* FALLBACK */

      return res.json({

        ok:true,

        agent:"XOD",

        source:"local",

        reply:
          "Backend XOD conectado correctamente. " +
          "El núcleo IA todavía no tiene configurada " +
          "la variable OPENAI_API_KEY."

      });


    }catch(error){

      console.error(
        error
      );


      return res
        .status(500)
        .json({

          ok:false,

          reply:
            "Error interno del núcleo XOD."

        });

    }

  }
);


/* ========================================
   404
======================================== */

app.use(
  (req,res)=>{

    res
      .status(404)
      .json({

        ok:false,

        error:
          "Ruta XOD no encontrada"

      });

  }
);


/* ========================================
   START
======================================== */

app.listen(
  PORT,
  "0.0.0.0",
  ()=>{

    console.log(
      "=============================="
    );

    console.log(
      "XOD // AGENTE ÉLITE"
    );

    console.log(
      "BACKEND OPERATIVO"
    );

    console.log(
      "PORT:",
      PORT
    );

    console.log(
      "ENDPOINT: /xod/chat"
    );

    console.log(
      "=============================="
    );

  }
);
