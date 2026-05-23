document.addEventListener('DOMContentLoaded', function () {
  /**
   * Módulo de Productos con Paginación
   * Muestra 10 productos por página con navegación
   */
  const btnNuevo = document.getElementById('btnNuevoProducto');
  const formulario = document.getElementById('formularioProducto');
  const cancelar = document.getElementById('cancelarProducto');
  const tablaBody = document.querySelector('#tablaProductos tbody');
  const formProducto = document.getElementById('formProducto');

  let editingId = null;
  let paginationInstance = null;
  let allProducts = [];

  /**
   * createRow(product) -> HTMLElement
   * Crea y devuelve un elemento <tr> con los datos del producto.
   */
  function createRow(product) {
    const tr = document.createElement('tr');
    tr.dataset.id = product.id;
    tr.innerHTML = `
      <td>${product.id}</td>
      <td>${product.nombre}</td>
      <td>${product.categoria}</td>
      <td>${product.marca}</td>
      <td>$${parseFloat(product.precio).toLocaleString('es-CO')}</td>
      <td>${product.stock}</td>
      <td>${product.proveedor}</td>
      <td>${product.estado}</td>
      <td>
        <button class="btn-edit" title="Editar"><span class="icono">✏️</span></button>
        <button class="btn-delete" title="Eliminar"><span class="icono eliminar">🗑️</span></button>
      </td>
    `;
    return tr;
  }

  /**
   * renderCurrentPage()
   * Renderiza solo los productos de la página actual
   */
  function renderCurrentPage() {
    const pageItems = paginationInstance.getCurrentPageItems();
    tablaBody.innerHTML = '';
    pageItems.forEach(p => tablaBody.appendChild(createRow(p)));
    paginationInstance.renderControls('paginationControls');
  }

  /**
   * loadProducts()
   * Carga todos los productos y configura la paginación
   */
  async function loadProducts() {
    try {
      const res = await fetch('/api/productos');
      const products = await res.json();
      allProducts = products;

      // Crear o actualizar paginación
      if (!paginationInstance) {
        paginationInstance = new Pagination(products, 10);
        paginationInstance.onPageChange = renderCurrentPage;
      } else {
        paginationInstance.updateItems(products);
      }

      renderCurrentPage();
    } catch (err) {
      console.error('Error al cargar productos desde el servidor:', err);
    }
  }

  // Carga inicial
  loadProducts();
  console.debug('ModuloProductos: inicializando con paginación...');

  // --- FILTRADO DE TABLA ---
  const filtroInput = document.getElementById('filtroProductos');
  if (filtroInput) {
    filtroInput.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase();

      if (searchTerm === '') {
        // Sin filtro: mostrar todos con paginación
        paginationInstance.updateItems(allProducts);
        renderCurrentPage();
      } else {
        // Con filtro: filtrar y actualizar paginación
        const filtered = allProducts.filter(product => {
          const text = `${product.id} ${product.nombre} ${product.categoria} ${product.marca} ${product.proveedor}`.toLowerCase();
          return text.includes(searchTerm);
        });
        paginationInstance.updateItems(filtered);
        renderCurrentPage();
      }
    });
  }

  // Mostrar el formulario para crear un nuevo producto
  btnNuevo.addEventListener('click', function () {
    formulario.style.display = 'block';
    editingId = null;
    formulario.classList.remove('editing');
    const submitBtn = formProducto.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Guardar';
      submitBtn.classList.remove('update');
    }
  });

  // Cancelar creación/edición
  cancelar.addEventListener('click', function () {
    editingId = null;
    formulario.classList.remove('editing');
    const submitBtn = formProducto.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Guardar';
      submitBtn.classList.remove('update');
    }
    formProducto.reset();
    formulario.style.display = 'none';
  });

  // Envío del formulario para crear o actualizar producto
  formProducto.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.debug('ModuloProductos: submit detectado');

    const nombre = document.getElementById('nombreProducto').value.trim();
    const categoria = document.getElementById('categoriaProducto').value.trim();
    const marca = document.getElementById('marcaProducto').value.trim();
    const precio = parseFloat(document.getElementById('precioProducto').value) || 0;
    const stock = parseInt(document.getElementById('stockProducto').value, 10) || 0;
    const proveedor = document.getElementById('proveedorProducto').value.trim();
    const estado = document.getElementById('estadoProducto').value;

    const producto = {
      id: editingId || Date.now(),
      nombre,
      categoria,
      marca,
      precio,
      stock,
      proveedor,
      estado
    };

  try {

  const res = await fetch('/api/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });

  const data = await res.json();

  console.log('Respuesta del servidor:', data);

  if (data.success) {

    if (window.ui && ui.showToast) {
      ui.showToast('Producto guardado', 'success');
    }

    loadProducts();

  } else {

    if (window.ui && ui.showToast) {
      ui.showToast(data.message, 'warning');
    }
  }

} catch (err) {

  console.error('Error al guardar producto en el servidor:', err);

  if (window.ui && ui.showToast) {
    ui.showToast('Error al guardar', 'error');
  }
}

    formProducto.reset();
    formulario.style.display = 'none';
    editingId = null;
    formulario.classList.remove('editing');
  });

  // Delegación de eventos para editar y eliminar
  tablaBody.addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const row = btn.closest('tr');
    const id = row && row.dataset && row.dataset.id ? parseInt(row.dataset.id, 10) : null;

    if (btn.classList.contains('btn-edit') || btn.title === 'Editar') {
      if (!id) return;
      const cells = row.querySelectorAll('td');
      document.getElementById('nombreProducto').value = cells[1].textContent;
      document.getElementById('categoriaProducto').value = cells[2].textContent;
      document.getElementById('marcaProducto').value = cells[3].textContent;
      // Remover formato de precio para edición
      document.getElementById('precioProducto').value = cells[4].textContent.replace(/\$|\.| /g, '');
      document.getElementById('stockProducto').value = cells[5].textContent;
      document.getElementById('proveedorProducto').value = cells[6].textContent;
      document.getElementById('estadoProducto').value = cells[7].textContent;

      editingId = id;
      formulario.style.display = 'block';
      formulario.classList.add('editing');
      const submitBtn = formProducto.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Actualizar';
        submitBtn.classList.add('update');
      }
    }

    if (btn.classList.contains('btn-delete') || btn.title === 'Eliminar') {
      if (!id) return;
      if (confirm('¿Eliminar este producto?')) {
        console.warn('Eliminar producto aún no implementado en backend');
        if (window.ui && ui.showToast) ui.showToast('Función eliminar pendiente', 'info');
      }
    }
  });
});
