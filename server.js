// ============================================
// SERVER INVENTARIOS - CORREGIDO
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// ============================================
// UTILIDADES
// ============================================

async function readFile(filePath, defaultContent) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultContent;
  }
}

async function writeFile(filePath, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================
// CLIENTES (CORREGIDO COMPLETO)
// ============================================

app.get('/api/clientes', async (req, res) => {
  const data = await readFile(CLIENTES_FILE, { clientes: [] });
  res.json(data.clientes);
});

app.post('/api/clientes', async (req, res) => {
  try {
    const cliente = req.body;

    if (!cliente.nombre || !cliente.numeroDocumento || !cliente.tipoDocumento) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const data = await readFile(CLIENTES_FILE, { clientes: [] });

    if (!Array.isArray(data.clientes)) data.clientes = [];

    // 🔥 DUPLICADO POR DOCUMENTO
    const existe = data.clientes.find(c =>
      c.tipoDocumento === cliente.tipoDocumento &&
      c.numeroDocumento === cliente.numeroDocumento
    );

    if (existe && !cliente.idCliente) {
      return res.status(409).json({
        success: false,
        message: 'Cliente ya existe'
      });
    }

    // 🔥 ACTUALIZAR
    const index = data.clientes.findIndex(
      c => c.idCliente === cliente.idCliente
    );

    if (index !== -1) {
      data.clientes[index] = {
        ...data.clientes[index],
        ...cliente
      };
    } else {
      // 🔥 NUEVO CLIENTE
      cliente.idCliente = crypto.randomUUID();
      cliente.pedidos = 0;
      cliente.comprado = 0;

      data.clientes.push(cliente);
    }

    await writeFile(CLIENTES_FILE, data);

    res.json({
      success: true,
      message: 'Cliente guardado correctamente'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error en clientes'
    });
  }
});

// ============================================
// VENTAS (CORREGIDO)
// ============================================

app.get('/api/ventas', async (req, res) => {
  const data = await readFile(VENTAS_FILE, { ventas: [] });
  res.json(data.ventas);
});

app.post('/api/ventas', async (req, res) => {
  try {
    const nuevaVenta = req.body;

    if (!nuevaVenta.idCliente || !nuevaVenta.productos?.length) {
      return res.status(400).json({
        success: false,
        message: 'Datos de venta incompletos'
      });
    }

    const dataVentas = await readFile(VENTAS_FILE, { ventas: [] });

    nuevaVenta.id = Date.now();
    dataVentas.ventas.push(nuevaVenta);

    await writeFile(VENTAS_FILE, dataVentas);

    // 🔥 ACTUALIZAR CLIENTE POR ID
    const dataClientes = await readFile(CLIENTES_FILE, { clientes: [] });

    const index = dataClientes.clientes.findIndex(
      c => c.idCliente === nuevaVenta.idCliente
    );

    if (index !== -1) {
      dataClientes.clientes[index].pedidos =
        (dataClientes.clientes[index].pedidos || 0) + 1;

      dataClientes.clientes[index].comprado =
        (dataClientes.clientes[index].comprado || 0) + nuevaVenta.total;

      await writeFile(CLIENTES_FILE, dataClientes);
    }

    res.json({
      success: true,
      message: 'Venta registrada'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error ventas'
    });
  }
});

// ============================================
// PRODUCTOS
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
      data.productos.push(producto);
    }

    await writeFile(PRODUCTOS_FILE, data);

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
});

// ============================================
// PROVEEDORES
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

  } catch {
    res.status(500).json({ success: false });
  }
});

// ============================================
// ESTÁTICOS
// ============================================

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Login.html'));
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
// SERVER START (SOLO UNA VEZ)
// ============================================

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor iniciado puerto ${port}`);
});
