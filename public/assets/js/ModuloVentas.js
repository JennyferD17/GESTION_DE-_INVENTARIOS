// ============================================
// MODULO VENTAS 
// ============================================

document.addEventListener('DOMContentLoaded', function () {

  // Elementos del DOM
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

  const selectProducto = document.getElementById('idProducto');

  // Variables de estado
  let editingId = null;
  let productosEnVenta = [];
  let productos = [];
  let clientes = [];
  let salesData = [];

  // =========================
  // CREAR FILA DE LA TABLA
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
  // CARGAR VENTAS DESDE EL API
  // =========================
  async function loadSales() {
    try {
      const res = await fetch('/api/ventas');
      const data = await res.json();

      salesData = data;
      tablaBody.innerHTML = '';

      data.forEach(v => tablaBody.appendChild(createRow(v)));
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    }
  }

  // =========================
  // CARGAR PRODUCTOS Y CLIENTES
  // =========================
  async function loadData() {
    try {
      const [rProd, rCli] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/clientes')
      ]);

      productos = await rProd.json();
      clientes = await rCli.json();

      selectProducto.innerHTML = '<option value="">-- Seleccione un producto --</option>';

      productos.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.nombre} - $${Number(p.precio).toLocaleString('es-CO')}`;
        selectProducto.appendChild(opt);
      });
    } catch (error) {
      console.error('Error al cargar productos/clientes:', error);
    }
  }

  // =========================
  // EVENTO: BOTÓN NUEVA VENTA
  // =========================
  btnNuevaVenta.addEventListener('click', () => {
    editingId = null;
    formVenta.reset();
    productosEnVenta = [];
    renderProductos();
    
    // Asigna la fecha actual automáticamente en formato YYYY-MM-DD
    document.getElementById('fechaVenta').value = new Date().toISOString().split('T')[0];
    
    // Muestra el formulario en pantalla
    formularioVenta.style.display = 'block';
    productosAgregados.style.display = 'none'; // Oculto hasta que agreguen algo
  });

  // =========================
  // EVENTO: BOTÓN CANCELAR VENTA
  // =========================
  cancelarVenta.addEventListener('click', () => {
    formVenta.reset();
    productosEnVenta = [];
    formularioVenta.style.display = 'none';
    editingId = null;
  });

  // =========================
  // BUSCAR CLIENTE POR ID (TAB)
  // =========================
  idClienteInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    e.preventDefault();

    const id = idClienteInput.value.trim();
    const cliente = clientes.find(c => c.id == id);

    if (!cliente) {
      clienteVentaInput.value = '';
      alert('Cliente no encontrado en el sistema.');
      return;
    }

    clienteVentaInput.value = cliente.nombre;
  });

  // =========================
  // AGREGAR PRODUCTO AL CARRITO
  // =========================
  btnAgregarProducto.addEventListener('click', () => {
    const id = selectProducto.value;
    const cantidad = Number(document.getElementById('cantidadProducto').value || 1);

    if (!id) {
      alert('Por favor, seleccione un producto.');
      return;
    }

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

    // Mostrar la tabla de productos si estaba oculta
    if (productosEnVenta.length > 0) {
      productosAgregados.style.display = 'block';
    }

    renderProductos();
    
    // Resetear selección de producto y cantidad por comodidad
    selectProducto.value = '';
    document.getElementById('cantidadProducto').value = '1';
  });

  // =========================
  // RENDERIZAR TABLA DE PRODUCTOS AGRUPADOS
  // =========================
  function renderProductos() {
    listaProductosVenta.innerHTML = '';
    let total = 0;

    productosEnVenta.forEach((p, i) => {
      const subtotal = p.precio * p.cantidad;
      total += subtotal;

      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td style="padding: 8px; border: 1px solid #ddd;">${p.nombre}</td>
        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${p.cantidad}</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">$${p.precio.toLocaleString('es-CO')}</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">$${subtotal.toLocaleString('es-CO')}</td>
        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">
          <button data-i="${i}" class="del" type="button" style="background: none; border: none; cursor: pointer;">🗑️</button>
        </td>
      `;

      listaProductosVenta.appendChild(tr);
    });

    document.getElementById('totalVenta').value = total;
  }

  // ELIMINAR UN PRODUCTO DEL CARRITO
  listaProductosVenta.addEventListener('click', (e) => {
    // Busca si el clic fue en el botón de basura o dentro de él
    const botonBorrar = e.target.closest('.del');
    if (!botonBorrar) return;

    const i = botonBorrar.dataset.i;
    productosEnVenta.splice(i, 1);
    
    if (productosEnVenta.length === 0) {
      productosAgregados.style.display = 'none';
    }
    
    renderProductos();
  });

  // =========================
  // GUARDAR VENTA (SUBMIT FORM)
  // =========================
  formVenta.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (productosEnVenta.length === 0) {
      alert('Debe añadir al menos un producto a la venta.');
      return;
    }

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

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venta)
      });

      if (response.ok) {
        productosEnVenta = [];
        formVenta.reset();
        formularioVenta.style.display = 'none';
        loadSales();
      } else {
        alert('Hubo un problema al intentar procesar la venta en el servidor.');
      }
    } catch (error) {
      console.error('Error al guardar venta:', error);
      alert('Error de conexión con el servidor.');
    }
  });

  // =========================
  // INICIALIZACIÓN
  // =========================
  loadSales();
  loadData();
});
