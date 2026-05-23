// ============================================
// MODULO VENTAS - CORREGIDO
// ============================================

document.addEventListener('DOMContentLoaded', function () {

  const btnNuevaVenta = document.getElementById('btnNuevaVenta');
  const formularioVenta = document.getElementById('formularioVenta');
  const cancelarVenta = document.getElementById('cancelarVenta');
  const tablaBody = document.querySelector('#tablaVentas tbody');
  const formVenta = document.getElementById('formVenta');
  const btnAgregarProducto = document.getElementById('btnAgregarProducto');
  const listaProductosVenta = document.getElementById('listaProductosVenta');
  const productosAgregados = document.getElementById('productosAgregados');

  const idClienteInput = document.getElementById('idCliente');
  const clienteVentaInput = document.getElementById('clienteVenta');
  const telefonoClienteInput = document.getElementById('telefonoCliente');
  const emailClienteInput = document.getElementById('emailCliente');

  const selectProducto = document.getElementById('idProducto');

  let editingId = null;
  let productosEnVenta = [];
  let productos = [];
  let clientes = [];
  let salesData = [];
  let pagination = null;

  // =========================
  // CREAR FILA
  // =========================
  function createRow(v) {
    const tr = document.createElement('tr');
    tr.dataset.id = v.id;

    tr.innerHTML = `
      <td>${v.id}</td>
      <td>${v.cliente}</td>
      <td>${v.fecha}</td>
      <td>${v.estado}</td>
      <td>$${Number(v.total).toLocaleString('es-CO')}</td>
      <td>${v.admin}</td>
      <td>
        <button class="btn-detail">👁️</button>
        <button class="btn-edit">✏️</button>
        <button class="btn-delete">🗑️</button>
      </td>
    `;
    return tr;
  }

  // =========================
  // CARGAR VENTAS
  // =========================
  async function loadSales() {
    const res = await fetch('/api/ventas');
    const data = await res.json();

    salesData = data;
    tablaBody.innerHTML = '';

    data.forEach(v => tablaBody.appendChild(createRow(v)));
  }

  // =========================
  // CARGAR DATOS
  // =========================
  async function loadData() {
    const [rProd, rCli] = await Promise.all([
      fetch('/api/productos'),
      fetch('/api/clientes')
    ]);

    productos = await rProd.json();
    clientes = await rCli.json();

    selectProducto.innerHTML = '<option value="">-- Producto --</option>';

    productos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.nombre} - $${Number(p.precio).toLocaleString('es-CO')}`;
      selectProducto.appendChild(opt);
    });
  }

  // =========================
  // BUSCAR CLIENTE
  // =========================
  idClienteInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    e.preventDefault();

    const id = idClienteInput.value.trim();
    const cliente = clientes.find(c => c.id == id);

    if (!cliente) {
      clienteVentaInput.value = '';
      telefonoClienteInput.value = '';
      emailClienteInput.value = '';
      return;
    }

    clienteVentaInput.value = cliente.nombre;
    telefonoClienteInput.value = cliente.telefono || '';
    emailClienteInput.value = cliente.email || '';
  });

  // =========================
  // AGREGAR PRODUCTO
  // =========================
  btnAgregarProducto.addEventListener('click', () => {

    const id = selectProducto.value;
    const cantidad = Number(document.getElementById('cantidadProducto').value || 1);

    const producto = productos.find(p => p.id == id);
    if (!producto) return;

    const existente = productosEnVenta.find(p => p.id == id);

    if (existente) {
      existente.cantidad += cantidad;
    } else {
      productosEnVenta.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precio),
        cantidad
      });
    }

    renderProductos();
  });

  // =========================
  // RENDER PRODUCTOS
  // =========================
  function renderProductos() {

    listaProductosVenta.innerHTML = '';

    let total = 0;

    productosEnVenta.forEach((p, i) => {

      const subtotal = p.precio * p.cantidad;
      total += subtotal;

      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>$${p.precio.toLocaleString('es-CO')}</td>
        <td>$${subtotal.toLocaleString('es-CO')}</td>
        <td><button data-i="${i}" class="del">🗑️</button></td>
      `;

      listaProductosVenta.appendChild(tr);
    });

    document.getElementById('totalVenta').value = total;
  }

  listaProductosVenta.addEventListener('click', (e) => {
    if (!e.target.classList.contains('del')) return;

    const i = e.target.dataset.i;
    productosEnVenta.splice(i, 1);
    renderProductos();
  });

  // =========================
  // GUARDAR VENTA
  // =========================
  formVenta.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (productosEnVenta.length === 0) return;

    const venta = {
      id: editingId || Date.now(),
      cliente: clienteVentaInput.value,
      idCliente: idClienteInput.value,
      fecha: document.getElementById('fechaVenta').value,
      estado: document.getElementById('estadoVenta').value,
      admin: document.getElementById('adminVenta').value,
      total: Number(document.getElementById('totalVenta').value),
      productos: productosEnVenta
    };

    const url = editingId ? `/api/ventas/${editingId}` : '/api/ventas';
    const method = editingId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venta)
    });

    productosEnVenta = [];
    formVenta.reset();
    formularioVenta.style.display = 'none';

    loadSales();
  });

  // =========================
  // INIT
  // =========================
  loadSales();
  loadData();
});
