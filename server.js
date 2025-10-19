const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS más permisiva
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: false
}));

// Middleware para logging de todas las requests
app.use((req, res, next) => {
  console.log('🔍 Nueva solicitud:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Google Sheets con tus credenciales
const sheets = google.sheets('v4');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Configura las credenciales desde variables de entorno
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID || 'message-server-bot',
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || '93d202a2a5715a406982d9d17fb9001bb0e35761',
    private_key: (process.env.GOOGLE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCLTefe2RyVSfXh
0sP+IyoRPP5+sStFckYlij/whw0FPmqPKohg83iMq7noY5bok3i23ISN5jsHKR//
PEColymfNHrEcMwuskRbJB5R2rw55+U2QvOPmdV7l3OFdacui0q9Ky6cdS4238/y
t/RWGSkJg7pCNspVGZumizRuORTkm8z2V9lWp4SjbBTsyD6jJ/q4BSctngFLHT8J
Z6nX8uY8FLR1qtsahN5XfkqL8dnOfhXwqg2pfefmNH5Z4zcpm31qhMvZXaL//uAM
drxulmn6DgKoN3/v3zc9aVriptNh+nYv2Z1feKvEcJFns7R4iakpE73G/JLwhd68
d1pJ6QhrAgMBAAECggEACrM/PkTbBzSZKHFyEJFO5+gRfFXLhxgR/0wxQR5+h4qV
0M1pkFjjR5rhOtJ7gv3g5drma6flnNUx2f8c0FZcIhh73Z70cBnNWlrZ4Vu13ZTM
bHCUGNGuLkIh43x4DQEyCnnIqMfvdtOWO4SZxgtEtbBinDdtL0A6Tn6e1mCYFD8u
Z5qlAIbYqtEySDDUbA7dIeHFEXyZBWIMCqLOzWtac59poBSW7PbZUm1xDVj1Tvl5
KqW1Kcnru4jW9AwCPh033hD5KfDqBbDuzoKQXp7jHuiIjtYWmhyzvqXHn9Z33DXj
jfq0QImxeI6ERkNrOn/UssvZtKIYdjwfjLOrtqooEQKBgQDCC1iu55HeOQ2cAcXE
v5KTfaLJKO7eg9gnySNViTkHNFyHfJ2HXNBZ+2I7yOkwSLtsX03I1sAb30TTbwGD
pOEQ5wyeoWLJ69xSRdzXHX6xLfP/OspbEjVhEgKgQINaRdvAGvJj/kdGRsm6uQ52
fyt6BITGVz7LJdhtnthRnPQc/QKBgQC3yELFYMBbk0NCowuZRZCqAzZhg6IXY1aD
IP/Ocp8G2acGc39+lTyWmjbvZUIYFTst/Go2Z/6CAta5aq4e0IdD9+H+FMjpODFg
v09mhyM6YletAeNBiZYCwDmOgujNfkgETVaVQsjxBaLucTqtc101NqJ4ErAykZbf
oXmVhlBrhwKBgHLUghunQEQwoSQkTGPdNqF/pNjEF2+ouD77IaTZutzPmL44+YQE
YewN/pkAkTaYpAlC8OYcZ71WyAUTWOMNrH7zLB2nxa1WnaA2ZbULaFDzr8Pnh56T
TPFv1gv9gX3nf17U04JnFMi61WBhaPSo1xKzH9u7/5X6hHSCnuLVLgUFAoGBALI3
+FAxh7gGMYZwWDIVHLlRji24Gbq2cVGN8aMA0igxbuA5ppxZGj0tZTJ3rkVuaUop
6dHCvTLUj+eUhS+KpnGJ81SSUVagUHnya4wQZmAat80k9H08cAVQ5T/GwP1thWbu
nJT4A6Z/AcZadT14jx2oUps//C+9sWJB04bljh0HAoGBAJkoNpJr4X8RUfxWtDRG
5asjXcuG/zx9NnbvaghVyAa+C0eV6N/QDKaO+oWg3UbF1IU3+uo26SeTDpUmH7hS
xuFxNqAD9cg2EmrGU17PEwIU/6cweiYJ7gzNKA5RvQnfafW44HAZ6KF02FLivvtb
PunzythGOGaCQ/jbxFV5QArB
-----END PRIVATE KEY-----`).replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL || 'message-server-sheets@message-server-bot.iam.gserviceaccount.com',
    client_id: process.env.GOOGLE_CLIENT_ID || '110138692261590478010',
  },
  scopes: SCOPES,
});

// ID de tu hoja de Google Sheets
const SPREADSHEET_ID = '1NLPpVF7eNUXYc1xnmLA2ecLWQJL7hSOytdvZktwNIEg';
const SHEET_NAME = 'Pedidos';

// Función para buscar cliente por nombre y actualizar
async function buscarYActualizarPorNombre(nombreCliente) {
  try {
    console.log(`🔍 Buscando cliente: "${nombreCliente}" en Google Sheets...`);
    
    const authClient = await auth.getClient();
    
    // Obtener todos los datos de la hoja
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:J`, // Desde columna A hasta J
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('❌ No se encontraron datos en la hoja');
      return { encontrado: false, telefono: null };
    }

    console.log(`📊 Encontradas ${rows.length} filas en la hoja`);

    // Buscar la fila que coincida con el nombre (columna B, índice 1 - "Usuario")
    let filaEncontrada = -1;
    let telefonoEncontrado = null;
    let clienteEncontrado = null;
    
    for (let i = 1; i < rows.length; i++) { // Empezar desde 1 para saltar los headers
      const row = rows[i];
      if (row && row.length > 1) {
        const nombreEnFila = row[1] ? row[1].toString().trim().toLowerCase() : '';
        const nombreBuscado = nombreCliente.toString().trim().toLowerCase();
        
        console.log(`🔍 Comparando fila ${i + 1}: "${nombreEnFila}" con "${nombreBuscado}"`);
        
        if (nombreEnFila === nombreBuscado) {
          filaEncontrada = i + 1; // +1 porque las filas en Sheets empiezan en 1
          telefonoEncontrado = row[8] ? row[8].toString().trim() : null; // Columna I (índice 8) - Telefono
          clienteEncontrado = row[1] ? row[1].toString().trim() : null;
          console.log(`✅ Cliente encontrado en fila: ${filaEncontrada}, Teléfono: ${telefonoEncontrado}`);
          break;
        }
      }
    }

    if (filaEncontrada === -1) {
      console.log(`❌ No se encontró registro para el cliente: ${nombreCliente}`);
      return { encontrado: false, telefono: null };
    }

    // Actualizar la columna J (índice 9) con "Presup. Aceptado"
    await sheets.spreadsheets.values.update({
      auth: authClient,
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!J${filaEncontrada}`,
      valueInputOption: 'RAW',
      resource: {
        values: [['Presup. Aceptado']]
      }
    });

    console.log(`✅ Presupuesto aceptado para: ${clienteEncontrado} - Tel: ${telefonoEncontrado} en fila: ${filaEncontrada}`);
    return { 
      encontrado: true, 
      telefono: telefonoEncontrado,
      cliente: clienteEncontrado,
      fila: filaEncontrada
    };

  } catch (error) {
    console.error('❌ Error al actualizar Google Sheets:', error);
    throw error;
  }
}

// Ruta principal para recibir mensajes (GET)
app.get('/message.php', async (req, res) => {
  try {
    console.log('📨 Mensaje recibido - Detalles completos:', {
      query: req.query,
      headers: req.headers,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Extraer parámetros
    const { 
      app: appName, 
      sender, 
      message, 
      'group-name': groupName, 
      phone 
    } = req.query;

    // Validar campos requeridos
    if (!appName || !sender || !message) {
      console.log('❌ Faltan campos requeridos');
      return res.status(400).json({
        reply: "Error: Faltan campos requeridos (app, sender, message)",
        received: req.query
      });
    }

    // 🔧 LÓGICA DE RESPUESTA - Verificar si el mensaje es "si"
    let replyMessage = '';
    const lowerMessage = message.toLowerCase().trim();

    if (lowerMessage === 'si' || lowerMessage === 'sí') {
      try {
        // Buscar automáticamente por nombre del remitente
        const resultado = await buscarYActualizarPorNombre(sender);
        
        if (resultado.encontrado) {
          replyMessage = `¡Excelente ${sender}! ✅ He registrado tu aceptación del presupuesto. Pronto nos pondremos en contacto contigo al ${resultado.telefono || 'teléfono registrado'}.`;
        } else {
          replyMessage = `¡Me alegra que aceptes ${sender}! No encontré tus datos en el sistema. Por favor, contacta con nosotros directamente para confirmar tu aceptación.`;
        }
      } catch (error) {
        console.error('Error al actualizar Google Sheets:', error);
        replyMessage = `¡Excelente ${sender}! Hubo un error al registrar tu aceptación. Por favor, contacta con nosotros directamente para confirmar.`;
      }
    } else {
      replyMessage = generarRespuesta(sender, message);
    }
    
    console.log('📤 Respuesta enviada:', replyMessage);

    // Configurar headers para evitar caché
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Enviar respuesta
    res.json({
      reply: replyMessage,
      status: 'success',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);
    res.status(500).json({
      reply: "Error interno del servidor",
      error: error.message
    });
  }
});

// Ruta POST alternativa
app.post('/message.php', async (req, res) => {
  try {
    console.log('📨 Mensaje POST recibido:', {
      body: req.body,
      headers: req.headers
    });

    const { app: appName, sender, message, groupName, phone } = req.body;

    if (!appName || !sender || !message) {
      return res.status(400).json({
        reply: "Error: Faltan campos requeridos (app, sender, message)"
      });
    }

    let replyMessage = '';
    const lowerMessage = message.toLowerCase().trim();

    if (lowerMessage === 'si' || lowerMessage === 'sí') {
      try {
        // Buscar automáticamente por nombre del remitente
        const resultado = await buscarYActualizarPorNombre(sender);
        
        if (resultado.encontrado) {
          replyMessage = `¡Excelente ${sender}! ✅ He registrado tu aceptación del presupuesto. Pronto nos pondremos en contacto contigo al ${resultado.telefono || 'teléfono registrado'}.`;
        } else {
          replyMessage = `¡Me alegra que aceptes ${sender}! No encontré tus datos en el sistema. Por favor, contacta con nosotros directamente para confirmar tu aceptación.`;
        }
      } catch (error) {
        console.error('Error al actualizar Google Sheets:', error);
        replyMessage = `¡Excelente ${sender}! Hubo un error al registrar tu aceptación. Por favor, contacta con nosotros directamente para confirmar.`;
      }
    } else {
      replyMessage = generarRespuesta(sender, message);
    }
    
    res.json({
      reply: replyMessage,
      status: 'success',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error procesando mensaje POST:', error);
    res.status(500).json({
      reply: "Error interno del servidor"
    });
  }
});

// Función para generar respuestas
function generarRespuesta(sender, message) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Saludos
  if (lowerMessage.includes('hola') || lowerMessage.includes('hi') || lowerMessage.includes('buenas')) {
    return `¡Hola ${sender}! 👋 ¿En qué puedo ayudarte hoy?`;
  }
  
  // Despedidas
  if (lowerMessage.includes('adiós') || lowerMessage.includes('bye') || lowerMessage.includes('chao')) {
    return `¡Hasta luego ${sender}! 😊 ¡Que tengas un excelente día!`;
  }
  
  // Agradecimientos
  if (lowerMessage.includes('gracias') || lowerMessage.includes('thanks')) {
    return `¡De nada ${sender}! 😄 ¿Necesitas algo más?`;
  }
  
  // Información
  if (lowerMessage.includes('información') || lowerMessage.includes('info') || lowerMessage.includes('servicios')) {
    return `Te proporciono información sobre nuestros servicios. Contamos con soporte 24/7. ¿Qué específicamente necesitas saber?`;
  }
  
  // Precios
  if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('cuánto')) {
    return `Los precios varían según el servicio. ¿Podrías decirme qué servicio te interesa?`;
  }
  
  // Contacto
  if (lowerMessage.includes('contacto') || lowerMessage.includes('teléfono') || lowerMessage.includes('email')) {
    return `Puedes contactarnos al +1-234-567-8900 o email@soporte.com. ¿En qué más puedo ayudarte?`;
  }
  
  // Estado del servidor
  if (lowerMessage.includes('estado') || lowerMessage.includes('status') || lowerMessage.includes('funcionando')) {
    return `¡El servidor está funcionando correctamente! ✅ Todo está en orden.`;
  }
  
  // Respuesta por defecto
  return `Hola ${sender}, recibí tu mensaje: "${message}". ¿En qué más puedo asistirte?`;
}

// Manejar preflight OPTIONS requests
app.options('/message.php', (req, res) => {
  console.log('🛬 Preflight OPTIONS request recibida');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send();
});

// Ruta de salud mejorada
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente en Railway ✅',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      'GET /message.php': 'Recibir mensajes',
      'POST /message.php': 'Recibir mensajes (POST)',
      'GET /health': 'Verificar estado del servidor'
    },
    googleSheets: {
      configured: true,
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      busquedaAutomatica: true
    }
  });
});

// Ruta de inicio
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Servidor de Mensajes API - Desplegado en Railway',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    googleSheets: {
      connected: true,
      spreadsheetId: SPREADSHEET_ID,
      busquedaAutomatica: 'Por nombre del remitente'
    },
    usage: {
      example: 'https://message-server-production-6b01.up.railway.app/message.php?app=WhatsApp&sender=Luis&message=si',
      parameters: {
        'app': 'Nombre de la aplicación',
        'sender': 'Nombre del remitente (se usa para buscar en Sheets)', 
        'message': 'Contenido del mensaje (usa "si" para aceptar presupuesto)',
        'group-name': 'Nombre del grupo (opcional)',
        'phone': 'Número de teléfono (opcional - backup)'
      }
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  console.log('❌ Ruta no encontrada:', req.originalUrl);
  res.status(404).json({
    error: "Ruta no encontrada",
    availableRoutes: [
      "GET /message.php",
      "POST /message.php",
      "GET /health",
      "GET /"
    ]
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('💥 Error global:', error);
  res.status(500).json({
    reply: "Error interno del servidor",
    error: process.env.NODE_ENV === 'production' ? null : error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 Health check: https://message-server-production-6b01.up.railway.app/health`);
  console.log(`📍 Mensajes: https://message-server-production-6b01.up.railway.app/message.php`);
  console.log(`📍 Inicio: https://message-server-production-6b01.up.railway.app/`);
  console.log(`📊 Google Sheets conectado: ${SPREADSHEET_ID}`);
  console.log(`🔍 Búsqueda automática: ACTIVADA - Busca por nombre del remitente`);
  console.log(`👤 Cliente ejemplo: Luis - 2494603544`);
});
