document.addEventListener('DOMContentLoaded', () => {

  const formVenta = document.getElementById('formVenta');
  const btnNuevaVenta = document.getElementById('btnNuevaVenta');
  const cancelarVenta = document.getElementById('cancelarVenta');

  const idClienteInput = document.getElementById('idCliente');
  const clienteInput = document.getElementById('clienteVenta');
  const adminInput = document.getElementById('adminVenta');

  const selectProducto = document.getElementById('idProducto');
  const cantidadInput = document.getElementById('cantidadProducto');

  const tablaProductos = document.getElementById('listaProductosVenta');
  const totalInput = document.getElementById('totalVenta');

  let productos = [];
  let clientes = [];
  let carrito = [];

  // ==============================
  // 🔐 USUARIO EN SESIÓN
  // ==============================
  const usuario = JSON.parse(localStorage.getItem('usuarioActivo') || '{}');
  adminInput.value = usuario.nombre || 'Invitado';
  document.getElementById('topbarUser').textContent = usuario.nombre || 'Invitado';

  // ==============================
  // CARGAR DATOS
  // ==============================
  async function loadData() {
    const [pRes, cRes] = await Promise.all([
      fetch('/api/productos'),
      fetch('/api/clientes')
    ]);

    productos = await pRes.json();
    clientes = await cRes.json();

    selectProducto.innerHTML = `<option value="">-- Seleccione --</option>`;
    productos.forEach(p => {
      selectProducto.innerHTML += `
        <option value="${p.id}">
          ${p.nombre} - $${Number(p.precio).toLocaleString('es-CO')}
        </option>`;
    });
  }

  loadData();

  // ==============================
  // 🔎 AUTOCOMPLETE CLIENTE
  // ==============================
  idClienteInput.addEventListener('blur', async () => {
    const id = idClienteInput.value.trim();
    if (!id) return;

    const res = await fetch(`/api/clientes/${id}`);
    if (!res.ok) {
      clienteInput.value = '';

      if (confirm('Cliente no existe. ¿Desea crearlo?')) {
        window.location.href = `ModuloCliente.html?nuevoId=${id}`;
      }
      return;
    }

    const cliente = await res.json();
    clienteInput.value = cliente.nombre;
  });

  // ==============================
  // 🛒 AGREGAR PRODUCTO
  // ==============================
  document.getElementById('btnAgregarProducto').addEventListener('click', () => {

    const id = selectProducto.value;
    const cantidad = parseInt(cantidadInput.value || 1);

    if (!id) return alert('Seleccione producto');

    const prod = productos.find(p => p.id == id);
    if (!prod) return;

    const item = carrito.find(p => p.id == id);

    if (item) {
      item.cantidad += cantidad;
    } else {
      carrito.push({
        id: prod.id,
        nombre: prod.nombre,
        precio: Number(prod.precio),
        cantidad
      });
    }

    renderCarrito();

    selectProducto.value = '';
    cantidadInput.value = 1;
  });

  // ==============================
  // 🧾 RENDER CARRITO
  // ==============================
  function renderCarrito() {
    tablaProductos.innerHTML = '';
    let total = 0;

    carrito.forEach((p, i) => {
      const sub = p.precio * p.cantidad;
      total += sub;

      tablaProductos.innerHTML += `
        <tr>
          <td>${p.nombre}</td>
          <td style="text-align:center">${p.cantidad}</td>
          <td style="text-align:right">${p.precio.toLocaleString('es-CO')}</td>
          <td style="text-align:right">${sub.toLocaleString('es-CO')}</td>
          <td>
            <button type="button" onclick="removeItem(${i})">🗑️</button>
          </td>
        </tr>
      `;
    });

    totalInput.value = total;
  }

  window.removeItem = (i) => {
    carrito.splice(i, 1);
    renderCarrito();
  };

  // ==============================
  // 💾 GUARDAR VENTA
  // ==============================
  formVenta.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!carrito.length) {
      return alert('Agrega productos');
    }

    const venta = {
      idCliente: idClienteInput.value,
      cliente: clienteInput.value,
      fecha: document.getElementById('fechaVenta').value,
      estado: document.getElementById('estadoVenta').value,
      total: Number(totalInput.value),
      admin: adminInput.value,
      productos: carrito
    };

    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venta)
    });

    if (!res.ok) {
      alert('Error al guardar venta');
      return;
    }

    alert('Venta registrada correctamente');

    carrito = [];
    renderCarrito();
    formVenta.reset();

    adminInput.value = usuario.nombre || 'Invitado';
  });

  // ==============================
  // CANCELAR
  // ==============================
  cancelarVenta.addEventListener('click', () => {
    carrito = [];
    renderCarrito();
    formVenta.reset();
  });

  // ==============================
  // NUEVA VENTA
  // ==============================
  btnNuevaVenta.addEventListener('click', () => {
    document.getElementById('formularioVenta').style.display = 'block';
  });

});
