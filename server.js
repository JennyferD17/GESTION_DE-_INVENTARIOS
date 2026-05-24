// ============================================
// SERVER INVENTARIOS PRO - ESTABLE
// ============================================

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// ============================================
// ARCHIVOS
// ============================================

const DATA_DIR = path.join(__dirname, 'data');

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTOS_FILE = path.join(DATA_DIR, 'productos.json');
const CLIENTES_FILE = path.join(DATA_DIR, 'clientes.json');
const PROVEEDORES_FILE = path.join(DATA_DIR, 'proveedores.json');
const VENTAS_FILE = path.join(DATA_DIR, 'ventas.json');

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// UTILIDADES
// ============================================

async function readFile(file, fallback) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

async function writeFile(file, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

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
// CLIENTES (NO TOCAR - FUNCIONANDO)
// ============================================

app.get('/api/clientes', async (req, res) => {
  const data = await readFile(CLIENTES_FILE, { clientes: [] });

  const normalizados = (data.clientes || []).map(c => ({
    idCliente: c.idCliente,
    tipoDocumento: c.tipoDocumento,
    numeroDocumento: c.numeroDocumento,
    nombre: c.nombre,
    email: c.email,
    telefono: c.telefono,
    fecha: c.fecha,
    pedidos: c.pedidos ?? 0,
    comprado: c.comprado ?? 0
  }));

  res.json(normalizados);
});

app.get('/api/clientes/:id', async (req, res) => {
  const data = await readFile(CLIENTES_FILE, { clientes: [] });

 const cliente = data.clientes.find(
  c => c.numeroDocumento == req.params.id
);

  if (!cliente) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  res.json(cliente);
});

app.post('/api/clientes', async (req, res) => {
  try {
    const cliente = req.body;
    const data = await readFile(CLIENTES_FILE, { clientes: [] });

    if (!Array.isArray(data.clientes)) data.clientes = [];

    if (!cliente.nombre || !cliente.numeroDocumento || !cliente.tipoDocumento) {
      return res.status(400).json({ success: false });
    }

    if (!cliente.idCliente) {
      const existe = data.clientes.find(c =>
        c.tipoDocumento === cliente.tipoDocumento &&
        c.numeroDocumento === cliente.numeroDocumento
      );

      if (existe) {
        return res.status(409).json({ success: false, message: 'Cliente ya existe' });
      }

      cliente.idCliente = crypto.randomUUID();
      cliente.pedidos = 0;
      cliente.comprado = 0;

      data.clientes.push(cliente);
    } else {
      const index = data.clientes.findIndex(c => c.idCliente === cliente.idCliente);
      if (index !== -1) {
        data.clientes[index] = { ...data.clientes[index], ...cliente };
      }
    }

    await writeFile(CLIENTES_FILE, data);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ============================================
// PRODUCTOS (NO TOCAR)
// ============================================

app.get('/api/productos', async (req, res) => {
  const data = await readFile(PRODUCTOS_FILE, { productos: [] });
  res.json(data.productos);
});

app.post('/api/productos', async (req, res) => {
  try {
    const producto = req.body;
    const data = await readFile(PRODUCTOS_FILE, { productos: [] });

    const index = data.productos.findIndex(p => p.id == producto.id);

    if (index !== -1) {
      data.productos[index] = producto;
    } else {
      producto.id = Date.now();
      producto.stock = producto.stock || 0;
      data.productos.push(producto);
    }

    await writeFile(PRODUCTOS_FILE, data);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// PROVEEDORES (NO TOCAR)
// ============================================

app.get('/api/proveedores', async (req, res) => {
  const data = await readFile(PROVEEDORES_FILE, { proveedores: [] });
  res.json(data.proveedores);
});

app.post('/api/proveedores', async (req, res) => {
  try {
    const proveedor = req.body;
    const data = await readFile(PROVEEDORES_FILE, { proveedores: [] });

    const existe = data.proveedores.find(
      p => p.nombre.toLowerCase() === proveedor.nombre.toLowerCase()
    );

    if (!existe) {
      proveedor.id = Date.now();
      data.proveedores.push(proveedor);
      await writeFile(PROVEEDORES_FILE, data);
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// VENTAS (ARREGLADO SIN ROMPER CLIENTES)
// ============================================

app.get('/api/ventas', async (req, res) => {
  const data = await readFile(VENTAS_FILE, { ventas: [] });
  res.json(data.ventas);
});

app.post('/api/ventas', async (req, res) => {
  try {
    const venta = req.body;

    if (!venta.idCliente || !venta.productos?.length) {
      return res.status(400).json({ success: false });
    }

    const productosDB = await readFile(PRODUCTOS_FILE, { productos: [] });
    const clientesDB = await readFile(CLIENTES_FILE, { clientes: [] });
    const ventasDB = await readFile(VENTAS_FILE, { ventas: [] });

    // VALIDAR STOCK
    for (const item of venta.productos) {
      const prod = productosDB.productos.find(p => p.id == item.id);

      if (!prod) {
        return res.status(404).json({ message: `Producto no existe` });
      }

      if ((prod.stock || 0) < item.cantidad) {
        return res.status(400).json({ message: `Stock insuficiente` });
      }
    }

    // DESCONTAR STOCK
    for (const item of venta.productos) {
      const prod = productosDB.productos.find(p => p.id == item.id);
      if (prod) prod.stock -= item.cantidad;
    }

    await writeFile(PRODUCTOS_FILE, productosDB);

    // GUARDAR VENTA
    venta.id = Date.now();
    ventasDB.ventas.push(venta);

    await writeFile(VENTAS_FILE, ventasDB);

    // ACTUALIZAR CLIENTE (SIN ROMPER CLIENTES)
    const cliente = clientesDB.clientes.find(c => c.idCliente == venta.idCliente);

    if (cliente) {
      cliente.pedidos = (cliente.pedidos || 0) + 1;
      cliente.comprado = (cliente.comprado || 0) + venta.total;
      await writeFile(CLIENTES_FILE, clientesDB);
    }

    res.json({ success: true, message: 'Venta guardada' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
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
