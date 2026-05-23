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

  // ========================================================
  // PASO 1: ASIGNAR EVENTOS INMEDIATAMENTE (Anti-bloqueo)
  // ========================================================

  if (btnNuevaVenta) {
    btnNuevaVenta.addEventListener('click', () => {
      editingId = null;
      formVenta.reset();
      productosEnVenta = [];
      renderProductos();
      
      // Asigna la fecha actual automáticamente en formato YYYY-MM-DD
      const fechaInput = document.getElementById('fechaVenta');
      if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
      }
      
      // Muestra el formulario en pantalla
      if (formularioVenta) formularioVenta.style.display = 'block';
      if (productosAgregados) productosAgregados.style.display = 'none';
    });
  }

  if (cancelarVenta) {
    cancelarVenta.addEventListener('click', () => {
      formVenta.reset();
      productosEnVenta = [];
      if (formularioVenta) formularioVenta.style.display = 'none';
      editingId = null;
    });
  }

  if (btnAgregarProducto) {
    btnAgregarProducto.addEventListener('click', () => {
      const id = selectProducto.value;
      const cantidadInput = document.getElementById('cantidadProducto');
      const cantidad = Number(cantidadInput ? cantidadInput.value : 1);

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

      if (productosEnVenta.length > 0 && productosAgregados) {
        productosAgregados.style.display = 'block';
      }

      renderProductos();
      
      selectProducto.value = '';
      if (cantidadInput) cantidadInput.value = '1';
    });
  }

  if (idClienteInput) {
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
  }

  if (listaProductosVenta) {
    listaProductosVenta.addEventListener('click', (e) => {
      const botonBorrar = e.target.closest('.del');
      if (!botonBorrar) return;

      const i = botonBorrar.dataset.i;
      productosEnVenta.splice(i, 1);
      
      if (productosEnVenta.length === 0 && productosAgregados) {
        productosAgregados.style.display = 'none';
      }
      
      renderProductos();
    });
  }

  if (formVenta) {
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
          if (formularioVenta) formularioVenta.style.display = 'none';
          loadSales();
        } else {
          alert('Hubo un problema al intentar procesar la venta en el servidor.');
        }
      } catch (error) {
        console.error('Error al guardar venta:', error);
        alert('Error de conexión con el servidor.');
      }
    });
  }

  // ========================================================
  // PASO 2: FUNCIONES DE RENDERIZADO INTERNO
  // ========================================================

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

  function renderProductos() {
    if (!listaProductosVenta) return;
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

    const totalInput = document.getElementById('totalVenta');
    if (totalInput) totalInput.value = total;
  }

  // ========================================================
  // PASO 3: ASINCRONÍA REORGANIZADA CON CONTROLES DE ERROR
  // ========================================================

  async function loadSales() {
    try {
      const res = await fetch('/api/ventas');
      if (!res.ok) throw new Error('Error en respuesta de ventas');
      const data = await res.json();

      salesData = data;
      if (tablaBody) {
        tablaBody.innerHTML = '';
        data.forEach(v => tablaBody.appendChild(createRow(v)));
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    }
  }

  async function loadData() {
    try {
      const [rProd, rCli] = await Promise.all([
        fetch('/api/productos').catch(() => null),
        fetch('/api/clientes').catch(() => null)
      ]);

      if (rProd && rProd.ok) {
        productos = await rProd.json();
        if (selectProducto) {
          selectProducto.innerHTML = '<option value="">-- Seleccione un producto --</option>';
          productos.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.nombre} - $${Number(p.precio).toLocaleString('es-CO')}`;
            selectProducto.appendChild(opt);
          });
        }
      }

      if (rCli && rCli.ok) {
        clientes = await rCli.json();
      }
    } catch (error) {
      console.error('Error general al cargar productos/clientes:', error);
    }
  }

  // Ejecutamos las llamadas al servidor al final de todo de manera segura
  loadSales();
  loadData();
});
