// =======================================
// MODULO VENTAS - FINAL FUNCIONAL
// =======================================

let productos = [];
let carrito = [];

// ELEMENTOS DOM (COINCIDEN CON TU HTML)
const formVenta = document.getElementById('formVenta');
const btnAgregar = document.getElementById('btnAgregarProducto');
const inputProducto = document.getElementById('idProducto');
const inputCantidad = document.getElementById('cantidadProducto');
const tablaBody = document.querySelector('#tablaVentas tbody');
const tablaCarrito = document.getElementById('listaProductosVenta');
const totalInput = document.getElementById('totalVenta');
const clienteInput = document.getElementById('clienteVenta');

// =======================================
// INICIALIZAR
// =======================================
document.addEventListener('DOMContentLoaded', async () => {
  await cargarProductos();
});

// =======================================
// CARGAR PRODUCTOS
// =======================================
async function cargarProductos() {
  try {
    const res = await fetch('/api/productos');
    productos = await res.json();
  } catch (err) {
    console.error('Error productos:', err);
  }
}

// =======================================
// AGREGAR PRODUCTO
// =======================================
if (btnAgregar) {
  btnAgregar.addEventListener('click', () => {
    const id = inputProducto.value;
    const cantidad = parseInt(inputCantidad.value);

    if (!id || cantidad <= 0) return;

    const prod = productos.find(p => String(p.id) === String(id));
    if (!prod) return;

    const existente = carrito.find(p => p.id == id);

    if (existente) {
      existente.cantidad += cantidad;
      existente.subtotal = existente.cantidad * existente.precio;
    } else {
      carrito.push({
        id: prod.id,
        nombre: prod.nombre,
        precio: Number(prod.precio),
        cantidad,
        subtotal: Number(prod.precio) * cantidad
      });
    }

    renderCarrito();
  });
}

// =======================================
// RENDER CARRITO
// =======================================
function renderCarrito() {
  tablaCarrito.innerHTML = '';
  let total = 0;

  carrito.forEach((p, i) => {
    total += p.subtotal;

    tablaCarrito.innerHTML += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>${p.precio}</td>
        <td>${p.subtotal}</td>
        <td><button onclick="eliminar(${i})">X</button></td>
      </tr>
    `;
  });

  totalInput.value = total;
}

window.eliminar = function (i) {
  carrito.splice(i, 1);
  renderCarrito();
};

// =======================================
// GUARDAR VENTA
// =======================================
if (formVenta) {
  formVenta.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (carrito.length === 0) return;

    const venta = {
      id: Date.now(),
      cliente: clienteInput.value || 'Cliente General',
      fecha: new Date().toISOString().split('T')[0],
      productos: carrito,
      total: Number(totalInput.value)
    };

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venta)
      });

      const data = await res.json();

      if (data.success) {
        alert('Venta guardada');

        carrito = [];
        renderCarrito();
        formVenta.reset();

        await cargarProductos();
      }
    } catch (err) {
      console.error(err);
    }
  });
}
