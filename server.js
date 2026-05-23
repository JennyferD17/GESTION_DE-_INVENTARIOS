// ============================================
// SERVER INVENTARIOS
// ============================================

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// ============================================
// ARCHIVOS JSON
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

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// ============================================
// FUNCIONES
// ============================================

function hashPassword(password) {

  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}

async function readFile(filePath, defaultContent) {

  try {

    const data = await fs.readFile(
      filePath,
      'utf8'
    );

    return JSON.parse(data);

  } catch {

    return defaultContent;
  }
}

async function writeFile(filePath, data) {

  await fs.mkdir(DATA_DIR, {
    recursive: true
  });

  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

// ============================================
// REGISTER
// ============================================

app.post('/api/register', async (req, res) => {

  try {

    const {
      nombre,
      documento,
      correo,
      telefono,
      password
    } = req.body;

    if (
      !nombre ||
      !documento ||
      !correo ||
      !telefono ||
      !password
    ) {

      return res.status(400).json({
        success: false,
        message: 'Campos requeridos'
      });
    }

    const users = await readFile(
      USERS_FILE,
      []
    );

    const exists = users.find(
      u => u.correo === correo.toLowerCase()
    );

    if (exists) {

      return res.status(409).json({
        success: false,
        message: 'Correo ya existe'
      });
    }

    users.push({

      id: Date.now(),

      nombre,
      documento,

      correo: correo.toLowerCase(),

      telefono,

      password: hashPassword(password)
    });

    await writeFile(USERS_FILE, users);

    res.json({
      success: true,
      message: 'Usuario registrado'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Error registro'
    });
  }
});

// ============================================
// LOGIN
// ============================================

app.post('/api/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    const users = await readFile(
      USERS_FILE,
      []
    );

    const user = users.find(
      u => u.correo === email.toLowerCase()
    );

    if (!user) {

      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (
      user.password !==
      hashPassword(password)
    ) {

      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Error login'
    });
  }
});

// ============================================
// PRODUCTOS
// ============================================

app.get('/api/productos', async (req, res) => {

  const data = await readFile(
    PRODUCTOS_FILE,
    { productos: [] }
  );

  res.json(data.productos || []);
});

app.post('/api/productos', async (req, res) => {

  try {

    const producto = req.body;

    if (
      !producto ||
      !producto.nombre ||
      !producto.proveedor
    ) {

      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const data = await readFile(
      PRODUCTOS_FILE,
      { productos: [] }
    );

    if (!Array.isArray(data.productos)) {
      data.productos = [];
    }

    const index = data.productos.findIndex(
      p => p.id == producto.id
    );

    if (index !== -1) {

      data.productos[index] = producto;

    } else {

      producto.id = Date.now();
      data.productos.push(producto);
    }

    await writeFile(PRODUCTOS_FILE, data);

    res.json({
      success: true,
      message: 'Producto guardado'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Error guardando producto'
    });
  }
});

// ============================================
// CLIENTES
// ============================================

app.get('/api/clientes', async (req, res) => {

  const data = await readFile(
    CLIENTES_FILE,
    { clientes: [] }
  );

  res.json(data.clientes || []);
});

app.post('/api/clientes', async (req, res) => {

  try {

    const cliente = req.body;

    if (!cliente || !cliente.nombre) {

      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const data = await readFile(
      CLIENTES_FILE,
      { clientes: [] }
    );

    cliente.id = Date.now();

    data.clientes.push(cliente);

    await writeFile(CLIENTES_FILE, data);

    res.json({
      success: true,
      message: 'Cliente guardado'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Error clientes'
    });
  }
});

// ============================================
// PROVEEDORES
// ============================================

app.get('/api/proveedores', async (req, res) => {

  const data = await readFile(
    PROVEEDORES_FILE,
    { proveedores: [] }
  );

  res.json(data.proveedores || []);
});

app.post('/api/proveedores', async (req, res) => {

  try {

    const proveedor = req.body;

    if (!proveedor || !proveedor.nombre) {

      return res.status(400).json({
        success: false,
        message: 'Nombre requerido'
      });
    }

    const data = await readFile(
      PROVEEDORES_FILE,
      { proveedores: [] }
    );

    if (!Array.isArray(data.proveedores)) {
      data.proveedores = [];
    }

    const existe = data.proveedores.find(
      p =>
        p.nombre.toLowerCase() ===
        proveedor.nombre.toLowerCase()
    );

    if (!existe) {

      proveedor.id = Date.now();

      data.proveedores.push(proveedor);

      await writeFile(
        PROVEEDORES_FILE,
        data
      );
    }

    res.json({
      success: true,
      message: 'Proveedor guardado'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Error guardando proveedor'
    });
  }
});

// ============================================
// VENTAS
// ============================================

app.get('/api/ventas', async (req, res) => {

  const data = await readFile(
    VENTAS_FILE,
    { ventas: [] }
  );

  res.json(data.ventas || []);
});

// ============================================
// ARCHIVOS ESTÁTICOS
// ============================================

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);

// ============================================
// HOME
// ============================================

app.get('/', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'public',
      'Login.html'
    )
  );
});

// ============================================
// PING
// ============================================

app.get('/ping', (req, res) => {

  res.json({
    ok: true,
    time: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(port, '0.0.0.0', () => {

  console.log(
    `Servidor iniciado puerto ${port}`
  );
});
