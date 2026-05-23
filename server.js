// ============================================
// SERVIDOR BACKEND - GESTIÓN DE INVENTARIOS
// ============================================
// Importación de módulos necesarios
const express = require('express');                     // Framework para crear el servidor
const path = require('path');                           // Módulo para manejar rutas de archivos
const fs = require('fs').promises;                      // Módulo para leer y escribir archivos de forma asíncrona
const crypto = require('crypto');                       // Módulo para generar hash de contraseñas
const app = express();                                  // Inicialización de la aplicación Express
const port = process.env.PORT || 3000;                  // Puerto de escucha del servidor

// Rutas de archivos de almacenamiento local
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTOS_FILE = path.join(DATA_DIR, 'productos.json');
const CLIENTES_FILE = path.join(DATA_DIR, 'clientes.json');
const PROVEEDORES_FILE = path.join(DATA_DIR, 'proveedores.json');
const VENTAS_FILE = path.join(DATA_DIR, 'ventas.json');

// ============================================
// CONFIGURACIÓN DE MIDDLEWARE
// ============================================

// Middleware para interpretar el cuerpo de las peticiones como JSON
app.use(express.json());

// Middleware para registrar en consola cada petición recibida
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware para permitir peticiones desde otros orígenes (CORS)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204); // Respuesta rápida a preflight
  next();
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Genera un hash SHA-256 de una contraseña
 * @param {string} password - Contraseña en texto plano
 * @returns {string} Hash de la contraseña en formato hexadecimal
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Lee un archivo JSON y devuelve su contenido parseado
 * Si el archivo no existe, devuelve el contenido por defecto
 * @param {string} filePath - Ruta del archivo a leer
 * @param {object} defaultContent - Contenido por defecto si el archivo no existe
 * @returns {Promise<object>} Contenido del archivo parseado como objeto
 */
async function readFile(filePath, defaultContent) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data || JSON.stringify(defaultContent));
  } catch (err) {
    return defaultContent;
  }
}

/**
 * Escribe datos en un archivo JSON
 * @param {string} filePath - Ruta del archivo donde escribir
 * @param {object} data - Datos a escribir en el archivo
 * @returns {Promise<void>}
 */
async function writeFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================
// ENDPOINTS DE LA API - USUARIOS
// ============================================

/**
 * POST /api/register
 * Registra un nuevo usuario en el sistema
 * Valida que el correo no esté duplicado y hashea la contraseña
 */
app.post('/api/register', async (req, res) => {
  const { nombre, documento, correo, telefono, password } = req.body || {};

  // Validar que todos los campos requeridos estén presentes
  if (!nombre || !documento || !correo || !telefono || !password) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos.' });
  }

  const users = await readFile(USERS_FILE, []);

  // Verificar si el correo ya está registrado
  const exists = users.find(u => u.correo && u.correo.toLowerCase() === correo.toLowerCase());
  if (exists) {
    return res.status(409).json({ success: false, message: 'El correo ya está registrado.' });
  }

  // Crear nuevo usuario con contraseña hasheada
  const newUser = {
    id: Date.now(),
    nombre,
    documento,
    correo: correo.toLowerCase(),
    telefono,
    password: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeFile(USERS_FILE, users);

  return res.json({ success: true, message: 'Usuario registrado correctamente.' });
});

/**
 * POST /api/login
 * Autentica un usuario verificando email y contraseña
 * Devuelve datos del usuario (sin contraseña) si la autenticación es exitosa
 */
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};

  // Validar campos requeridos
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Faltan campos.' });
  }

  const users = await readFile(USERS_FILE, []);
  const user = users.find(u => u.correo === (email || '').toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
  }

  // Verificar contraseña
  if (user.password === hashPassword(password)) {
    const safeUser = { id: user.id, nombre: user.nombre, correo: user.correo };
    return res.json({ success: true, message: 'Login exitoso.', user: safeUser });
  }

  return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
});

/**
 * GET /api/users
 * Obtiene la lista de todos los usuarios registrados
 */
app.get('/api/users', async (req, res) => {
  const users = await readFile(USERS_FILE, []);
  res.json({ success: true, usuarios: users });
});

// ============================================
// ENDPOINTS DE LA API - PRODUCTOS
// ============================================

/**
 * GET /api/productos
 * Obtiene la lista completa de productos
 */
app.get('/api/productos', async (req, res) => {
  const data = await readFile(PRODUCTOS_FILE, { productos: [] });
  res.json(data.productos);
});

/**
 * POST /api/productos
 * Agrega un nuevo producto al inventario
 * Genera un ID automático si no se proporciona
 */
app.post('/api/productos', async (req, res) => {
  try {
    const producto = req.body;

    if (!producto || !producto.nombre) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const data = await readFile(PRODUCTOS_FILE, { productos: [] });

    // Buscar si ya existe
    const index = data.productos.findIndex(
      p => p.id == producto.id
    );

    if (index !== -1) {
      // ACTUALIZAR
      data.productos[index] = producto;
    } else {
      // CREAR
      producto.id = producto.id || Date.now();
      data.productos.push(producto);
    }

    await writeFile(PRODUCTOS_FILE, data);

    res.json({
      success: true,
      message: 'Producto guardado correctamente'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Error interno'
    });
  }
});
// ============================================
// ENDPOINTS DE LA API - CLIENTES
// ============================================

/**
 * GET /api/clientes
 * Obtiene la lista completa de clientes
 */
app.get('/api/clientes', async (req, res) => {
  const data = await readFile(CLIENTES_FILE, { clientes: [] });
  res.json(data.clientes);
});

/**
 * POST /api/clientes
 * Agrega un nuevo cliente al sistema
 * Genera un ID automático si no se proporciona
 */
app.post('/api/clientes', async (req, res) => {
  const nuevoCliente = req.body;

  // Validar datos mínimos del cliente
  if (!nuevoCliente || !nuevoCliente.nombre) {
    return res.status(400).json({ success: false, message: 'Datos incompletos del cliente.' });
  }

  // Generar ID si no existe
  if (!nuevoCliente.id) nuevoCliente.id = Date.now();

  const data = await readFile(CLIENTES_FILE, { clientes: [] });
  data.clientes.push(nuevoCliente);
  await writeFile(CLIENTES_FILE, data);

  res.status(201).json({ success: true, message: 'Cliente agregado correctamente.' });
});

// ============================================
// ENDPOINTS DE LA API - PROVEEDORES
// ============================================

/**
 * GET /api/proveedores
 * Obtiene la lista completa de proveedores
 */
app.get('/api/proveedores', async (req, res) => {
  const data = await readFile(PROVEEDORES_FILE, { proveedores: [] });
  res.json(data.proveedores);
});

/**
 * POST /api/proveedores
 * Agrega un nuevo proveedor al sistema
 * Genera un ID automático si no se proporciona
 */
app.post('/api/proveedores', async (req, res) => {
  const nuevoProveedor = req.body;

  // Validar datos mínimos del proveedor
  if (!nuevoProveedor || !nuevoProveedor.nombre) {
    return res.status(400).json({ success: false, message: 'Datos incompletos del proveedor.' });
  }

  // Generar ID si no existe
  if (!nuevoProveedor.id) nuevoProveedor.id = Date.now();

  const data = await readFile(PROVEEDORES_FILE, { proveedores: [] });
  data.proveedores.push(nuevoProveedor);
  await writeFile(PROVEEDORES_FILE, data);

  res.status(201).json({ success: true, message: 'Proveedor agregado correctamente.' });
});

// ============================================
// ENDPOINTS DE LA API - VENTAS
// ============================================

/**
 * GET /api/ventas
 * Obtiene la lista completa de ventas registradas
 */
app.get('/api/ventas', async (req, res) => {
  const data = await readFile(VENTAS_FILE, { ventas: [] });
  res.json(data.ventas);
});

/**
 * PUT /api/ventas/:id
 * Actualiza una venta existente
 */
app.put('/api/ventas/:id', async (req, res) => {
  const { id } = req.params;
  const ventaActualizada = req.body;

  if (!ventaActualizada || !ventaActualizada.total) {
    return res.status(400).json({ success: false, message: 'Datos incompletos de la venta.' });
  }

  const data = await readFile(VENTAS_FILE, { ventas: [] });
  const index = data.ventas.findIndex(v => v.id == id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Venta no encontrada.' });
  }

  // Mantener el ID original y actualizar el resto
  data.ventas[index] = { ...data.ventas[index], ...ventaActualizada, id: Number(id) };
  await writeFile(VENTAS_FILE, data);

  res.json({ success: true, message: 'Venta actualizada correctamente.' });
});

// ============================================
// CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS Y RUTAS
// ============================================

// Middleware para servir archivos estáticos (HTML, JS, CSS) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET /ping
 * Endpoint de verificación para comprobar que el servidor está activo
 */
app.get('/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/**
 * GET /
 * Ruta raíz - carga el archivo Login.html por defecto
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Login.html'));
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================

/**
 * Inicia el servidor en el puerto especificado
 * Escucha en todas las interfaces de red (0.0.0.0)
 */
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor iniciado en http://0.0.0.0:${port}`);
  console.log('Puedes acceder usando:');
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- Red local: http://<tu-ip-local>:${port}`);
});
