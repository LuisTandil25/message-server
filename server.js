const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS más permisiva
app.use(cors({
  origin: '*', // Permite todas las origins
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ... el resto de tu código igual
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tus rutas aquí...
app.get('/message.php', (req, res) => {
  // Tu código actual
});

// ... resto del código