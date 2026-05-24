document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('formVenta');
  const btnNueva = document.getElementById('btnNuevaVenta');
  const cancelar = document.getElementById('cancelarVenta');

  const idCliente = document.getElementById('idCliente');
  const cliente = document.getElementById('clienteVenta');
  const admin = document.getElementById('adminVenta');

  const select = document.getElementById('idProducto');
  const cantidad = document.getElementById('cantidadProducto');

  const tabla = document.getElementById('listaProductosVenta');
  const total = document.getElementById('totalVenta');

  let productos = [];
  let clientes = [];
  let carrito = [];

  const user = JSON.parse(localStorage.getItem('usuarioActivo') || '{}');

  admin.value = user.nombre || 'Admin';
  document.getElementById('topbarUser').textContent = user.nombre || 'Invitado';

  // =========================
  // CARGAR DATOS
  // =========================
  async function load() {
    const [p, c] = await Promise.all([
      fetch('/api/productos'),
      fetch('/api/clientes')
    ]);

    productos = await p.json();
    clientes = await c.json();

    select.innerHTML = '<option value="">-- Seleccione --</option>';
    productos.forEach(p => {
      select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
  }

  load();

  // =========================
// CLIENTE
// =========================

idCliente.addEventListener('blur', async () => {

  const id = idCliente.value.trim();

  if (!id) return;

  const res = await fetch(`/api/clientes/${id}`);

  if (!res.ok) {

    cliente.value = '';

    document.getElementById('nuevoClienteBox').style.display = 'block';

    document.getElementById('nuevoDoc').value = id;

    return;
  }

  const data = await res.json();

  cliente.value = data.nombre;

  document.getElementById('nuevoClienteBox').style.display = 'none';
});

  // =========================
// GUARDAR CLIENTE RÁPIDO
// =========================

document.getElementById('guardarClienteRapido').onclick = async () => {

  const nuevo = {

    tipoDocumento: 'CC',

    numeroDocumento:
      document.getElementById('nuevoDoc').value,

    nombre:
      document.getElementById('nuevoNombre').value,

    email:
      document.getElementById('nuevoEmail').value,

    telefono:
      document.getElementById('nuevoTelefono').value,

    fecha:
      new Date().toISOString().split('T')[0],

    pedidos: 0,
    comprado: 0
  };

  const res = await fetch('/api/clientes', {

    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify(nuevo)
  });

  const data = await res.json();

  if (!data.success) {
    return alert('Error creando cliente');
  }

  cliente.value = nuevo.nombre;

  idCliente.value = nuevo.numeroDocumento;

  document.getElementById('nuevoClienteBox').style.display = 'none';

  alert('Cliente creado');
};
  
  // =========================
  // AGREGAR PRODUCTO
  // =========================
  document.getElementById('btnAgregarProducto').onclick = () => {

    const id = select.value;
    const cant = parseInt(cantidad.value || 1);

    const p = productos.find(x => x.id == id);
    if (!p) return;

    const ex = carrito.find(x => x.id == id);

    if (ex) ex.cantidad += cant;
    else carrito.push({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precio),
      cantidad: cant
    });

    render();
  };

  function render() {
    tabla.innerHTML = '';
    let t = 0;

    carrito.forEach((p, i) => {
      const sub = p.precio * p.cantidad;
      t += sub;

      tabla.innerHTML += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.cantidad}</td>
          <td>${p.precio}</td>
          <td>${sub}</td>
          <td><button onclick="del(${i})">🗑️</button></td>
        </tr>
      `;
    });

    total.value = t;
  }

  window.del = (i) => {
    carrito.splice(i, 1);
    render();
  };

  // =========================
  // GUARDAR VENTA
  // =========================
  form.onsubmit = async (e) => {
    e.preventDefault();

    const venta = {
      idCliente: idCliente.value,
      cliente: cliente.value,
      fecha: document.getElementById('fechaVenta').value,
      estado: document.getElementById('estadoVenta').value,
      total: Number(total.value),
      admin: admin.value,
      productos: carrito
    };

    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venta)
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.message || 'Error');
    }

    alert('Venta guardada');

    carrito = [];
    render();
    form.reset();
    admin.value = user.nombre;
  };

  btnNueva.onclick = () => {
    document.getElementById('formularioVenta').style.display = 'block';
  };

  cancelar.onclick = () => {
    carrito = [];
    render();
    form.reset();
  };

  // =========================
// CARGAR TABLA VENTAS
// =========================

async function cargarVentas() {

  const res = await fetch('/api/ventas');

  const ventas = await res.json();

  const tbody =
    document.querySelector('#tablaVentas tbody');

  tbody.innerHTML = '';

  ventas.forEach(v => {

    tbody.innerHTML += `
      <tr>
        <td>${v.id || ''}</td>
        <td>${v.cliente || ''}</td>
        <td>${v.fecha || ''}</td>
        <td>${v.estado || ''}</td>
        <td>$${Number(v.total || 0).toLocaleString('es-CO')}</td>

        <td>
          ${
            v.productos
              ? v.productos.map(p =>
                  `${p.nombre} x${p.cantidad}`
                ).join(', ')
              : (v.descripcion || '')
          }
        </td>

        <td>${v.admin || ''}</td>

        <td>
          <button>✏️</button>
          <button>🗑️</button>
        </td>
      </tr>
    `;
  });
}

cargarVentas();
});
