const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Google Sheets
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1NLPpVF7eNUXYc1xnmLA2ecLWQJL7hSOytdvZktwNIEg';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// Cliente de autenticación para Google Sheets
let sheets;

// Inicializar Google Sheets
async function initializeSheets() {
  try {
    let credentials;
    
    // Opción A: Si está en variable de entorno (Railway)
    if (process.env.GOOGLE_CREDENTIALS) {
      console.log('🔧 Usando credenciales de variable de entorno');
      credentials = process.env.GOOGLE_CREDENTIALS;
    } 
    // Opción B: Si está como archivo (local)
    else {
      console.log('🔧 Usando credenciales de archivo local');
      try {
        credentials = await fs.readFile(CREDENTIALS_PATH, 'utf8');
      } catch (fileError) {
        console.error('❌ No se pudo leer el archivo de credenciales:', fileError.message);
        throw new Error('Credenciales de Google Sheets no configuradas');
      }
    }
    
    const credentialsJson = JSON.parse(credentials);
    
    const auth = new JWT({
      email: credentialsJson.client_email,
      key: credentialsJson.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheets = auth;
    console.log('✅ Google Sheets inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Google Sheets:', error);
    throw error;
  }
}

// Función para actualizar el presupuesto en Google Sheets
async function actualizarPresupuesto(telefono) {
  try {
    console.log(`🔍 Buscando teléfono: ${telefono} en Google Sheets...`);
    
    const response = await sheets.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Pedidos!A:Z`,
      method: 'GET'
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No se encontraron datos en la hoja');
    }

    // Buscar la fila con el teléfono (columna I - Teléfono, índice 8)
    const rowIndex = rows.findIndex(row => row[8] && row[8].toString().replace(/\D/g, '') === telefono.toString());
    
    if (rowIndex === -1) {
      throw new Error(`Teléfono ${telefono} no encontrado en la hoja`);
    }

    console.log(`✅ Teléfono encontrado en fila: ${rowIndex + 1}`);

    // Actualizar columna J (índice 9) - Pendiente con "SI"
    await sheets.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Pedidos!J${rowIndex + 1}`,
      method: 'PUT',
      data: {
        values: [['SI']],
        majorDimension: 'ROWS'
      },
      params: {
        valueInputOption: 'RAW'
      }
    });

    console.log(`✅ Google Sheets actualizado para teléfono: ${telefono}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error actualizando Google Sheets:', error);
    throw error;
  }
}

// Función para buscar información del cliente
async function buscarCliente(telefono) {
  try {
    console.log(`🔍 Buscando información del cliente: ${telefono}`);
    
    const response = await sheets.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Pedidos!A:Z`,
      method: 'GET'
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    // Buscar la fila con el teléfono (columna I - Teléfono, índice 8)
    const fila = rows.find(row => row[8] && row[8].toString().replace(/\D/g, '') === telefono.toString());
    
    if (!fila) {
      return null;
    }

    // TU ESTRUCTURA DE COLUMNAS:
    // A: Fecha (0), B: Usuario (1), C: Productos (2), D: Dirección (3), 
    // E: Referencia (4), F: Pago (5), G: Observaciones (6), H: Total (7), 
    // I: Telefono (8), J: Pendiente (9)
    
    const cliente = {
      fecha: fila[0] || '',
      usuario: fila[1] || '',
      productos: fila[2] || '',
      direccion: fila[3] || '',
      referencia: fila[4] || '',
      pago: fila[5] || '',
      observaciones: fila[6] || '',
      total: fila[7] || '',
      telefono: fila[8] || '',
      pendiente: fila[9] || 'NO' // Columna J
    };

    console.log(`✅ Cliente encontrado: ${cliente.usuario} - ${cliente.productos}`);
    return cliente;
    
  } catch (error) {
    console.error('❌ Error buscando cliente:', error);
    return null;
  }
}

// Endpoint principal para recibir mensajes
app.post('/webhook', async (req, res) => {
  try {
    console.log('📥 Mensaje recibido:', JSON.stringify(req.body, null, 2));

    const { From, Body } = req.body;
    
    if (!From || !Body) {
      return res.status(400).json({ 
        reply: 'Mensaje incompleto', 
        error: true 
      });
    }

    // Limpiar número de teléfono (solo últimos 10 dígitos)
    const telefono = From.replace(/\D/g, '').slice(-10);
    const mensaje = Body.trim().toUpperCase();

    console.log(`📱 Procesando mensaje de: ${telefono}`);
    console.log(`💬 Mensaje: ${mensaje}`);

    let respuesta = '';
    let sheetsUpdated = false;
    let sheetsMessage = '';

    // Detectar mensaje de confirmación "SI"
    if (mensaje === 'SI' || mensaje === 'SÍ') {
      console.log(`✅ MENSAJE "SI" DETECTADO - Teléfono: ${telefono}`);
      
      try {
        // Buscar información del cliente primero
        const cliente = await buscarCliente(telefono);
        
        if (!cliente) {
          respuesta = '❌ No se encontró tu información en nuestro sistema. Por favor contacta con soporte.';
          sheetsMessage = 'Cliente no encontrado';
        } else if (cliente.pendiente === 'SI') {
          respuesta = `✅ Hola! Ya habías confirmado tu pedido anteriormente. Tu pedido de ${cliente.productos} está en proceso.`;
          sheetsMessage = 'Ya estaba confirmado';
        } else {
          // Actualizar Google Sheets
          await actualizarPresupuesto(telefono);
          sheetsUpdated = true;
          sheetsMessage = 'Confirmación exitosa';
          
          respuesta = `¡Perfecto! He recibido tu confirmación. Tu pedido de ${cliente.productos} está ahora en proceso. Te mantendremos informado.`;
        }
      } catch (error) {
        console.error('❌ Error con Google Sheets:', error);
        respuesta = '¡Perfecto! He recibido tu confirmación, pero hubo un error técnico. Por favor contacta con soporte.';
        sheetsMessage = 'Error técnico al actualizar';
      }
    } else {
      // Mensaje no reconocido
      respuesta = 'Hola! Para confirmar tu pedido responde únicamente con la palabra "SI". Si tienes dudas, contacta con nuestro equipo de soporte.';
      sheetsMessage = 'Mensaje no reconocido';
    }

    console.log(`📤 Respuesta enviada: ${respuesta}`);

    res.json({
      reply: respuesta,
      sheetsUpdated: sheetsUpdated,
      sheetsMessage: sheetsMessage
    });

  } catch (error) {
    console.error('❌ Error general en el webhook:', error);
    res.status(500).json({ 
      reply: 'Error interno del servidor. Por favor intenta más tarde.',
      error: true 
    });
  }
});

// Endpoint de salud
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión con Google Sheets
    await sheets.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Pedidos!A1:A1`,
      method: 'GET'
    });
    
    res.json({ 
      status: 'OK', 
      message: 'Servidor funcionando correctamente',
      sheets: 'Conectado',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Problema con Google Sheets',
      error: error.message 
    });
  }
});

// Endpoint para probar búsqueda de cliente
app.get('/test-cliente/:telefono', async (req, res) => {
  try {
    const telefono = req.params.telefono.replace(/\D/g, '').slice(-10);
    const cliente = await buscarCliente(telefono);
    
    res.json({
      telefono: telefono,
      cliente: cliente,
      encontrado: !!cliente
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Endpoint para ver todas las filas (solo desarrollo)
app.get('/debug-filas', async (req, res) => {
  try {
    const response = await sheets.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Pedidos!A:Z`,
      method: 'GET'
    });

    const rows = response.data.values || [];
    
    // Mostrar primeras 5 filas para debug
    const filasDebug = rows.slice(0, 5).map((fila, index) => ({
      fila: index + 1,
      datos: fila,
      telefono: fila[8] || 'NO HAY TELÉFONO'
    }));

    res.json({
      totalFilas: rows.length,
      primerasFilas: filasDebug,
      estructura: [
        'A: Fecha (0)', 'B: Usuario (1)', 'C: Productos (2)', 'D: Dirección (3)',
        'E: Referencia (4)', 'F: Pago (5)', 'G: Observaciones (6)', 'H: Total (7)',
        'I: Telefono (8)', 'J: Pendiente (9)'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de información del servidor
app.get('/info', (req, res) => {
  res.json({
    name: 'Message Server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    railway: !!process.env.RAILWAY_ENVIRONMENT,
    spreadsheetId: SPREADSHEET_ID ? 'Configurado' : 'No configurado',
    googleCredentials: process.env.GOOGLE_CREDENTIALS ? 'Configurado' : 'No configurado'
  });
});

// Inicializar servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log('🔧 Entorno:', process.env.NODE_ENV || 'development');
    console.log('📊 Spreadsheet ID:', SPREADSHEET_ID);
    
    await initializeSheets();
    
    app.listen(PORT, () => {
      console.log(`🎉 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📊 Google Sheets ID: ${SPREADSHEET_ID}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 Test cliente: http://localhost:${PORT}/test-cliente/2494603544`);
      console.log(`🐛 Debug filas: http://localhost:${PORT}/debug-filas`);
      console.log(`ℹ️  Info: http://localhost:${PORT}/info`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no capturado:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
  process.exit(1);
});

// Iniciar servidor
startServer();