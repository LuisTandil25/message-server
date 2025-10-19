const express = require('express');
const cors = require('cors');

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

// Ruta principal para recibir mensajes (GET)
app.get('/message.php', (req, res) => {
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

    // 🔧 LÓGICA DE RESPUESTA
    let replyMessage = generarRespuesta(sender, message);
    
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
app.post('/message.php', (req, res) => {
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

    let replyMessage = generarRespuesta(sender, message);
    
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

// Manejar preflight OPTIONS requests
app.options('/message.php', (req, res) => {
  console.log('🛬 Preflight OPTIONS request recibida');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send();
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
    usage: {
      example: 'https://message-server-production-6b01.up.railway.app/message.php?app=WhatsApp&sender=Juan&message=Hola',
      parameters: {
        'app': 'Nombre de la aplicación',
        'sender': 'Nombre del remitente', 
        'message': 'Contenido del mensaje',
        'group-name': 'Nombre del grupo (opcional)',
        'phone': 'Número de teléfono (opcional)'
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
});