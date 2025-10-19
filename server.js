const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para recibir mensajes (GET)
app.get('/message.php', (req, res) => {
  try {
    // Log de la solicitud recibida
    console.log('📨 Mensaje recibido:', {
      query: req.query,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    // Extraer parámetros de la query string
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

    // 🔧 AQUÍ PUEDES PERSONALIZAR LA LÓGICA DE RESPUESTA
    let replyMessage = "";
    
    // Ejemplo de lógica de respuesta basada en el mensaje
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hola') || lowerMessage.includes('hi')) {
      replyMessage = `¡Hola ${sender}! ¿En qué puedo ayudarte?`;
    } else if (lowerMessage.includes('información') || lowerMessage.includes('info')) {
      replyMessage = `Te proporciono información sobre nuestros servicios. ¿Algo más en lo que pueda ayudarte?`;
    } else if (lowerMessage.includes('gracias') || lowerMessage.includes('thanks')) {
      replyMessage = `¡De nada ${sender}! ¡Que tengas un buen día!`;
    } else {
      replyMessage = `Hola ${sender}, recibí tu mensaje: "${message}". ¿En qué más puedo ayudarte?`;
    }

    // Log de la respuesta
    console.log('📤 Respuesta enviada:', {
      reply: replyMessage,
      timestamp: new Date().toISOString()
    });

    // Enviar respuesta en formato JSON
    res.json({
      reply: replyMessage
    });

  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);
    res.status(500).json({
      reply: "Error interno del servidor"
    });
  }
});

// Ruta POST alternativa (por si necesitas)
app.post('/message.php', (req, res) => {
  try {
    const { app: appName, sender, message, groupName, phone } = req.body;
    
    console.log('📨 Mensaje POST recibido:', req.body);

    // Misma lógica de respuesta que en GET
    let replyMessage = `Hola ${sender}, recibí tu mensaje POST: "${message}"`;
    
    res.json({
      reply: replyMessage
    });

  } catch (error) {
    console.error('❌ Error procesando mensaje POST:', error);
    res.status(500).json({
      reply: "Error interno del servidor"
    });
  }
});

// Ruta de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor de mensajes funcionando',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    availableRoutes: [
      "GET /message.php",
      "POST /message.php", 
      "GET /health"
    ]
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});