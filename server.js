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

  const cliente = data.clientes.find(c => c.idCliente == req.params.id);

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
// SERVER START
// ============================================

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
