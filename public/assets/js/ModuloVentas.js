// =========================================================================
// ModuloVentas.js - Código Completo y Sincronizado con Stock (Opción A)
// =========================================================================

// Variables globales del módulo
let productos = [];        // Lista completa de productos cargados desde el servidor
let productosEnVenta = []; // Carrito local de la venta actual

// Elementos del DOM
const formVenta = document.getElementById('formVenta');
const selectProducto = document.getElementById('idProducto');
const inputCantidad = document.getElementById('cantidadProducto');
const tablaBody = document.querySelector('#tablaVentas tbody');
const listaProductosVenta = document.getElementById('listaProductosVenta');
const totalVentaElem = document.getElementById('totalVenta');

/**
 * 1. Inicialización y carga de datos desde el servidor
 */
async function inicializarModuloVentas() {
  try {
    // Cargamos los productos directamente desde tu API existente
    const res = await fetch('/api/productos');
    productos = await res.json();
    
    console.debug('ModuloVentas: Productos cargados con éxito', productos);
    llenarSelectProductos();
  } catch (error) {
    console.error('ModuloVentas: Error al inicializar el módulo:', error);
    if (window.ui && ui.showToast) ui.showToast('Error al cargar la lista de productos', 'error');
  }
}

/**
 * 2. Llena el menú desplegable (Select) con los productos y su stock disponible
 */
function llenarSelectProductos() {
  if (!selectProducto) return;
  
  selectProducto.innerHTML = '<option value="">-- Seleccione un Producto --</option>';
  
  productos.forEach(p => {
    const stockActual = parseInt(p.stock) || 0;
    // Solo mostramos productos que tengan stock disponible
    if (stockActual > 0) {
      const option = document.createElement('option');
      option.value = p.id;
      // Mostramos el nombre, precio y stock para que el usuario esté informado
      option.textContent = `${p.nombre} (Disponibles: ${stockActual}) - $${p.precio}`;
      selectProducto.appendChild(option);
    }
  });
}

/**
 * 3. Evento para AGREGAR un producto al carrito local (Antes de facturar)
 */
if (btnAgregar) {
  btnAgregar.addEventListener('click', function () {
    const productoId = selectProducto.value;
    const cantidad = parseInt(inputCantidad.value) || 0;

    if (!productoId) {
      if (window.ui && ui.showToast) ui.showToast('Por favor, seleccione un producto', 'warning');
      return;
    }

    if (cantidad <= 0) {
      if (window.ui && ui.showToast) ui.showToast('La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    // Buscamos el producto en nuestra lista global local
    const prodOriginal = productos.find(p => p.id == productoId);

    if (!prodOriginal) return;

    const stockDisponible = parseInt(prodOriginal.stock) || 0;

    // Verificamos si ya está en el carrito para sumar la cantidad deseada
    const itemEnCarrito = productosEnVenta.find(item => item.id == productoId);
    const cantidadTotalIntentada = itemEnCarrito ? (itemEnCarrito.cantidad + cantidad) : cantidad;

    // Control de seguridad de stock en el Frontend
    if (cantidadTotalIntentada > stockDisponible) {
      if (window.ui && ui.showToast) {
        ui.showToast(`Stock insuficiente. Solo quedan ${stockDisponible} unidades de ${prodOriginal.nombre}`, 'danger');
      }
      return;
    }

    if (itemEnCarrito) {
      // Si ya existía, actualizamos la cantidad y los subtotales
      itemEnCarrito.cantidad = cantidadTotalIntentada;
      itemEnCarrito.subtotal = itemEnCarrito.cantidad * itemEnCarrito.precio;
    } else {
      // Si es nuevo, lo empujamos al array del carrito
      productosEnVenta.push({
        id: prodOriginal.id,
        nombre: prodOriginal.nombre,
        precio: parseFloat(prodOriginal.precio) || 0,
        cantidad: cantidad,
        subtotal: (parseFloat(prodOriginal.precio) || 0) * cantidad
      });
    }

    // Limpiamos los controles para el siguiente producto
    selectProducto.value = '';
    inputCantidad.value = '1';

    actualizarTablaVenta();
  });
}

/**
 * 4. Actualiza visualmente la tabla de la venta en curso y calcula el total
 */
function actualizarTablaVenta() {
  if (!tablaCuerpoVenta || !totalVentaElem) return;

  tablaCuerpoVenta.innerHTML = '';
  let totalAcumulado = 0;

  productosEnVenta.forEach((item, index) => {
    totalAcumulado += item.subtotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nombre}</td>
      <td class="text-center">$${item.precio}</td>
      <td class="text-center">${item.cantidad}</td>
      <td class="text-center">$${item.subtotal}</td>
      <td class="text-center">
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarItemCarrito(${index})">
          Quitar
        </button>
      </td>
    `;
    tablaCuerpoVenta.appendChild(tr);
  });

  totalVentaElem.textContent = `$${totalAcumulado}`;
}

/**
 * 5. Permite quitar un artículo de la tabla antes de guardar la venta
 */
window.eliminarItemCarrito = function (index) {
  productosEnVenta.splice(index, 1);
  actualizarTablaVenta();
};

/**
 * 6. Evento Principal: PROCESAR Y GUARDAR LA VENTA + DESCUENTO DE STOCK
 */
if (formVenta) {
  formVenta.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.debug('ModuloVentas: submit detectado');
    
    if (productosEnVenta.length === 0) {
      if (window.ui && ui.showToast) ui.showToast('Debe agregar al menos un producto a la venta', 'warning');
      return;
    }

    const cliente = document.getElementById('cliente_venta').value;
    const total = parseFloat(totalVentaElem.textContent.replace('$', '')) || 0;

    // Estructuramos la nueva venta
    const nuevaVenta = {
      id: Date.now(),
      fecha: new Date().toISOString().split('T')[0], // Formato AAAA-MM-DD
      cliente: cliente || 'Cliente General',
      productos: productosEnVenta.map(p => ({
        id: p.id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio,
        subtotal: p.subtotal
      })),
      total: total
    };

    try {
      // Guardamos la venta en el endpoint de ventas
      const resVenta = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaVenta)
      });

      const dataVenta = await resVenta.json();

      if (dataVenta.success) {
        console.log('Venta registrada con éxito. Iniciando descuento de inventario...');

        // DESCUENTO DE STOCK MEDIANTE TU POST ORIGINAL DE PRODUCTOS
        for (const item of productosEnVenta) {
          const prodOriginal = productos.find(p => p.id == item.id);
          
          if (prodOriginal) {
            // Calculamos las nuevas existencias
            const nuevoStock = Math.max(0, (parseInt(prodOriginal.stock) || 0) - item.cantidad);
            
            // Enviamos el producto actualizado con su mismo ID a tu endpoint existente
            await fetch('/api/productos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...prodOriginal, // Mantiene nombre, proveedor, precio, etc.
                stock: nuevoStock // Sobrescribe únicamente las existencias
              })
            });
          }
        }

        if (window.ui && ui.showToast) ui.showToast('Venta procesada e inventario actualizado con éxito', 'success');
        
        // Reseteamos el estado del módulo para la próxima venta
        productosEnVenta = [];
        actualizarTablaVenta();
        formVenta.reset();
        
        // Volvemos a consultar los productos para que reflejen el nuevo stock disponible inmediatamente
        await inicializarModuloVentas();

      } else {
        if (window.ui && ui.showToast) ui.showToast('Error al guardar la venta: ' + dataVenta.message, 'error');
      }

    } catch (error) {
      console.error('Error durante el proceso de facturación:', error);
      if (window.ui && ui.showToast) ui.showToast('Error de comunicación con el servidor', 'error');
    }
  });
}

// Arrancamos el módulo al cargar el script
document.addEventListener('DOMContentLoaded', inicializarModuloVentas);
