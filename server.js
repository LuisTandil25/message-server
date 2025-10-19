const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta principal para recibir mensajes (GET)
app.get('/message.php', (req, res) => {
  try {
    console.log('📨 Mensaje recibido:', req.query);

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
      return res.status(400).json({
        reply: "Error: Faltan campos requeridos (app, sender, message)"
      });
    }

    // 🔧 LÓGICA DE RESPUESTA
    let replyMessage = generarRespuesta(sender, message);
    
    console.log('📤 Respuesta enviada:', replyMessage);

    // Enviar respuesta
    res.json({
      reply: replyMessage
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      reply: "Error interno del servidor"
    });
  }
});

// Función para generar respuestas
function generarRespuesta(sender, message) {
  const lowerMessage = message.toLowerCase().trim();
  
  if (lowerMessage.includes('hola') || lowerMessage.includes('hi')) {
    return `¡Hola ${sender}! 👋 ¿En qué puedo ayudarte?`;
  }
  
  if (lowerMessage.includes('información') || lowerMessage.includes('info')) {
    return `Te proporciono información sobre nuestros servicios. ¿Algo específico que necesites?`;
  }
  
  if (lowerMessage.includes('gracias') || lowerMessage.includes('thanks')) {
    return `¡De nada ${sender}! 😊 ¿Necesitas algo más?`;
  }
  
  if (lowerMessage.includes('precio') || lowerMessage.includes('costo')) {
    return `Los precios varían según el servicio. ¿Podrías decirme qué servicio te interesa?`;
  }
  
  // Respuesta por defecto
  return `Hola ${sender}, recibí tu mensaje: "${message}". ¿En qué más puedo ayudarte?`;
}

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando en Railway ✅',
    timestamp: new Date().toISOString()
  });
});

// Ruta de inicio
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Servidor de Mensajes desplegado en Railway',
    endpoints: {
      'GET /message.php': 'Recibir mensajes',
      'GET /health': 'Verificar estado del servidor'
    },
    usage: 'Ejemplo: /message.php?app=WhatsApp&sender=Juan&message=Hola'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
});