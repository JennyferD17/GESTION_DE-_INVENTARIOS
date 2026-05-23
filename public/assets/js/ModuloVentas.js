// ModuloVentas.js – Gestión de Ventas con paginación

document.addEventListener('DOMContentLoaded', function () {
  /**
   * Módulo de Ventas
   * Gestiona la creación, edición y eliminación de ventas con soporte para múltiples productos.
   */
  const btnNuevaVenta = document.getElementById('btnNuevaVenta');
  const formularioVenta = document.getElementById('formularioVenta');
  const cancelarVenta = document.getElementById('cancelarVenta');
  const tablaBody = document.querySelector('#tablaVentas tbody');
  const formVenta = document.getElementById('formVenta');
  const btnAgregarProducto = document.getElementById('btnAgregarProducto');
  const listaProductosVenta = document.getElementById('listaProductosVenta');
  const productosAgregados = document.getElementById('productosAgregados');

  let editingId = null;
  let productosEnVenta = []; // productos agregados a la venta actual
  let productos = []; // cache de productos
  let clientes = []; // cache de clientes
  let salesData = []; // cache de ventas
  let pagination = null; // instancia de Pagination

  /**
   * Crea una fila de tabla para una venta.
   */
  function createRow(venta) {
    const tr = document.createElement('tr');
    tr.dataset.id = venta.id;
    tr.innerHTML = `
      <td>${venta.id}</td>
      <td>${venta.cliente}</td>
      <td>${venta.fecha}</td>
      <td>${venta.estado}</td>
      <td>$${parseFloat(venta.total).toLocaleString('es-CO')}</td>
      <td>${venta.descripcion || 'N/A'}</td>
      <td>${venta.admin}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-detail" title="Ver Detalle"><span class="icono">👁️</span></button>
          <button class="btn-edit" title="Editar"><span class="icono">✏️</span></button>
          <button class="btn-delete" title="Eliminar"><span class="icono eliminar">🗑️</span></button>
        </div>
      </td>
    `;
    return tr;
  }

  /**
   * Muestra el modal con el detalle de la venta.
   */
  function showDetail(venta) {
    document.getElementById('detalleId').textContent = venta.id;
    document.getElementById('detalleCliente').textContent = venta.cliente;
    document.getElementById('detalleFecha').textContent = venta.fecha;
    document.getElementById('detalleEstado').textContent = venta.estado;
    document.getElementById('detalleAdmin').textContent = venta.admin;
    document.getElementById('detalleTotal').textContent = `$${parseFloat(venta.total).toLocaleString('es-CO')}`;

    const tbody = document.getElementById('detalleProductosBody');
    tbody.innerHTML = '';

    if (venta.productos && Array.isArray(venta.productos)) {
      venta.productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="padding: 8px; border: 1px solid #ddd;">${p.nombre}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${p.cantidad}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${parseFloat(p.precio).toLocaleString('es-CO')}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${(p.precio * p.cantidad).toLocaleString('es-CO')}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay información de productos detallada.</td></tr>';
    }

    document.getElementById('modalDetalleVenta').style.display = 'block';
  }

  // Cerrar modal
  const modal = document.getElementById('modalDetalleVenta');
  const spanClose = document.querySelector('.close-modal');
  if (spanClose) {
    spanClose.onclick = function () {
      modal.style.display = "none";
    };
  }
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  /**
   * Carga las ventas desde el backend y muestra la página actual.
   */
  async function loadSales() {
    try {
      const res = await fetch('/api/ventas');
      const sales = await res.json();
      console.log('Ventas cargadas:', sales.length);
      salesData = sales;
      pagination = new Pagination(salesData, 10);
      const renderCurrentPage = () => {
        tablaBody.innerHTML = '';
        pagination.getCurrentPageItems().forEach(item => tablaBody.appendChild(createRow(item)));
      };
      pagination.onPageChange = renderCurrentPage;
      renderCurrentPage();
      pagination.renderControls('paginationVentas');
    } catch (err) {
      console.error('Error al cargar ventas:', err);
    }
  }

  /**
   * Carga productos y clientes para el formulario.
   * AJUSTADO: Ahora pobla dinámicamente el elemento <select> de productos
   */
  async function loadData() {
    try {
      const [resProductos, resClientes] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/clientes')
      ]);
      productos = await resProductos.json();
      clientes = await resClientes.json();
      console.log('Datos cargados:', productos.length, 'productos,', clientes.length, 'clientes');

      // --- CAMBIO: Rellenar el elemento select de productos ---
      const selectProducto = document.getElementById('idProducto');
      if (selectProducto) {
        selectProducto.innerHTML = '<option value="">-- Seleccione un producto --</option>';
        productos.forEach(p => {
          const option = document.createElement('option');
          option.value = p.id;
          // Formateamos visualmente para el vendedor: Nombre - Precio (Stock disponible)
          const precioFormateado = parseFloat(p.precio).toLocaleString('es-CO');
          option.textContent = `${p.nombre} - $${precioFormateado} (Stock: ${p.stock || 0})`;
          selectProducto.appendChild(option);
        });
      }

    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  }

  // Inicializar datos
  loadSales();
  loadData();
  console.debug('ModuloVentas: inicializando...');

  // --- FILTRADO DE TABLA ---
  const filtroInput = document.getElementById('filtroVentas');
  if (filtroInput) {
    filtroInput.addEventListener('input', function () {
      const term = this.value.toLowerCase();
      const filtered = salesData.filter(s => Object.values(s).some(v => String(v).toLowerCase().includes(term)));
      pagination.updateItems(filtered);
      pagination.renderControls('paginationVentas');
      pagination.onPageChange();
    });
  }

  /**
   * Actualiza la tabla de productos dentro de la venta y el total.
   */
  function actualizarTablaProductos() {
    listaProductosVenta.innerHTML = '';
    let total = 0;
    productosEnVenta.forEach((item, index) => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 8px; border: 1px solid #ddd;">${item.nombre}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.cantidad}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${item.precio.toLocaleString('es-CO')}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${subtotal.toLocaleString('es-CO')}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          <button type="button" class="btn-delete" data-index="${index}" title="Eliminar">
            <span class="icono eliminar">🗑️</span>
          </button>
        </td>
      `;
      listaProductosVenta.appendChild(tr);
    });
    document.getElementById('totalVenta').value = total;
    productosAgregados.style.display = productosEnVenta.length > 0 ? 'block' : 'none';
  }

  /**
   * Buscar cliente por ID (Tab).
   */
  const idClienteInput = document.getElementById('idCliente');
  const clienteVentaInput = document.getElementById('clienteVenta');
  if (idClienteInput) {
    idClienteInput.addEventListener('keydown', async function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const id = this.value.trim();
        if (!id) return;
        const cliente = clientes.find(c => c.id == id);
        if (cliente) {
          clienteVentaInput.value = cliente.nombre;
          if (window.ui && ui.showToast) ui.showToast('Cliente encontrado', 'success');
        } else {
          clienteVentaInput.value = '';
          if (window.ui && ui.showToast) ui.showToast('Cliente no encontrado', 'warning');
        }
      }
    });
  }

  /**
   * Agregar producto a la venta.
   * AJUSTADO: Lee el ID directamente desde el select y devuelve la selección a su estado base limpio
   */
  btnAgregarProducto.addEventListener('click', async function () {
    const idProducto = document.getElementById('idProducto').value; // Removido .trim() innecesario para un select
    const cantidad = parseInt(document.getElementById('cantidadProducto').value) || 1;
    
    if (!idProducto) {
      if (window.ui && ui.showToast) ui.showToast('Por favor, seleccione un producto de la lista', 'warning');
      return;
    }
    
    const producto = productos.find(p => p.id == idProducto);
    if (producto) {
      // Validación extra: Verificar si hay stock suficiente antes de añadir al carrito
      if (producto.stock && cantidad > producto.stock) {
        if (window.ui && ui.showToast) ui.showToast(`Stock insuficiente. Solo quedan ${producto.stock} unidades`, 'warning');
        return;
      }

      const existente = productosEnVenta.find(p => p.id == idProducto);
      if (existente) {
        existente.cantidad += cantidad;
      } else {
        productosEnVenta.push({
          id: producto.id,
          nombre: producto.nombre,
          precio: parseFloat(producto.precio),
          cantidad: cantidad
        });
      }
      actualizarTablaProductos();
      
      // Reseteamos el selector al estado inicial por defecto ("-- Seleccione un producto --")
      document.getElementById('idProducto').value = '';
      document.getElementById('cantidadProducto').value = 1;
      if (window.ui && ui.showToast) ui.showToast('Producto agregado al carrito', 'success');
    } else {
      if (window.ui && ui.showToast) ui.showToast('Producto no encontrado', 'warning');
    }
  });

  /**
   * Eliminar producto de la lista.
   */
  listaProductosVenta.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-delete');
    if (btn) {
      const idx = parseInt(btn.dataset.index);
      productosEnVenta.splice(idx, 1);
      actualizarTablaProductos();
      if (window.ui && ui.showToast) ui.showToast('Producto eliminado de la venta', 'info');
    }
  });

  /**
   * Mostrar formulario para crear nueva venta.
   */
  btnNuevaVenta.addEventListener('click', function () {
    formularioVenta.style.display = 'block';
    editingId = null;
    productosEnVenta = [];
    actualizarTablaProductos();
    formularioVenta.classList.remove('editing');
    const submitBtn = formVenta.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.textContent = 'Guardar'; submitBtn.classList.remove('update'); }
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaVenta').value = today;
    document.getElementById('clienteVenta').value = '';
    document.getElementById('idCliente').value = '';
    document.getElementById('idProducto').value = ''; // Limpiar select
  });

  /**
   * Cancelar formulario.
   */
  cancelarVenta.addEventListener('click', function () {
    editingId = null;
    productosEnVenta = [];
    formularioVenta.classList.remove('editing');
    const submitBtn = formVenta.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.textContent = 'Guardar'; submitBtn.classList.remove('update'); }
    formVenta.reset();
    formularioVenta.style.display = 'none';
    actualizarTablaProductos();
  });

  /**
   * Guardar venta (crear o actualizar).
   */
  formVenta.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.debug('ModuloVentas: submit detectado');
    if (productosEnVenta.length === 0) {
      if (window.ui && ui.showToast) ui.showToast('Debe agregar al menos un producto', 'warning');
      return;
    }
    const cliente = document.getElementById('clienteVenta').value.trim();
    const fecha = document.getElementById('fechaVenta').value;
    const estado = document.getElementById('estadoVenta').value;
    const total = parseFloat(document.getElementById('totalVenta').value) || 0;
    const admin = document.getElementById('adminVenta').value.trim();
    const descripcion = productosEnVenta.map(p => `${p.nombre} (x${p.cantidad})`).join(', ');
    const sale = {
      id: editingId || Date.now(),
      cliente,
      fecha,
      estado,
      total,
      descripcion,
      admin,
      productos: productosEnVenta
    };

    const url = editingId ? `/api/ventas/${editingId}` : '/api/ventas';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      if (res.ok) {
        if (window.ui && ui.showToast) ui.showToast(editingId ? 'Venta actualizada' : 'Venta guardada', 'success');
        loadSales();
        productosEnVenta = [];
        actualizarTablaProductos();
        formVenta.reset();
        formularioVenta.style.display = 'none';
        editingId = null;
        formularioVenta.classList.remove('editing');
        const submitBtn = formVenta.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.textContent = 'Guardar'; submitBtn.classList.remove('update'); }
      } else {
        if (window.ui && ui.showToast) ui.showToast('Error al guardar', 'error');
      }
    } catch (err) {
      console.error('ModuloVentas: error al guardar venta:', err);
      if (window.ui && ui.showToast) ui.showToast('Error de conexión', 'error');
    }
  });

  /**
   * Delegación de eventos para editar, ver detalle y eliminar ventas.
   */
  tablaBody.addEventListener('click', async function (e) {
    const btnEdit = e.target.closest('.btn-edit');
    const btnDelete = e.target.closest('.btn-delete');
    const btnDetail = e.target.closest('.btn-detail');

    if (btnDetail) {
      const row = btnDetail.closest('tr');
      const id = row.dataset.id;
      const venta = salesData.find(v => v.id == id);
      if (venta) {
        showDetail(venta);
      }
    }

    if (btnEdit) {
      const row = btnEdit.closest('tr');
      const id = row.dataset.id;
      const venta = salesData.find(v => v.id == id);
      if (venta) {
        console.log('Editando venta:', venta);
        editingId = venta.id;

        // Poblar formulario
        document.getElementById('clienteVenta').value = venta.cliente;
        const clienteObj = clientes.find(c => c.nombre === venta.cliente);
        if (clienteObj) document.getElementById('idCliente').value = clienteObj.id;

        document.getElementById('fechaVenta').value = venta.fecha.split('T')[0];
        document.getElementById('estadoVenta').value = venta.estado;
        document.getElementById('adminVenta').value = venta.admin;

        // Poblar productos
        productosEnVenta = venta.productos || [];
        actualizarTablaProductos();

        // Mostrar formulario en modo edición
        formularioVenta.style.display = 'block';
        formularioVenta.classList.add('editing');
        const submitBtn = formVenta.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.textContent = 'Actualizar'; submitBtn.classList.add('update'); }

        window.scrollTo(0, 0);
      }
    }

    if (btnDelete) {
      const row = btnDelete.closest('tr');
      const id = row.dataset.id;
      if (window.ui && ui.confirmAction) {
        const confirmed = await ui.confirmAction('¿Eliminar esta venta?');
        if (confirmed) {
          console.log('Eliminar venta:', id);
          if (window.ui && ui.showToast) ui.showToast('Función de eliminación en desarrollo', 'info');
        }
      } else {
        if (confirm('¿Está seguro de eliminar esta venta?')) {
          console.log('Eliminar venta:', id);
          if (window.ui && ui.showToast) ui.showToast('Función de eliminación en desarrollo', 'info');
        }
      }
    }
  });
});
