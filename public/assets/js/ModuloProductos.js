document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // ELEMENTOS
  // ============================================

  const btnNuevo = document.getElementById('btnNuevoProducto');
  const formulario = document.getElementById('formularioProducto');
  const cancelar = document.getElementById('cancelarProducto');
  const tablaBody = document.querySelector('#tablaProductos tbody');
  const formProducto = document.getElementById('formProducto');
  const filtroInput = document.getElementById('filtroProductos');

  // PROVEEDORES
  const selectProveedor = document.getElementById('proveedorProducto');
  const btnNuevoProveedor = document.getElementById('btnNuevoProveedorRapido');
  const modalProveedor = document.getElementById('modalProveedorRapido');
  const guardarProveedor = document.getElementById('guardarProveedorRapido');
  const cerrarModalProveedor = document.getElementById('cerrarModalProveedor');

  // ============================================
  // VARIABLES
  // ============================================

  let editingId = null;
  let paginationInstance = null;
  let allProducts = [];

  // ============================================
  // CREAR FILA TABLA
  // ============================================

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
        <button class="btn-edit">✏️</button>
        <button class="btn-delete">🗑️</button>
      </td>
    `;

    return tr;
  }

  // ============================================
  // RENDER TABLA
  // ============================================

  function renderCurrentPage() {

    if (!paginationInstance) return;

    tablaBody.innerHTML = '';

    paginationInstance
      .getCurrentPageItems()
      .forEach(product => {

        tablaBody.appendChild(
          createRow(product)
        );
      });

    paginationInstance.renderControls(
      'paginationControls'
    );
  }

  // ============================================
  // CARGAR PRODUCTOS
  // ============================================

  async function loadProducts() {

    try {

      const res = await fetch('/api/productos');
      const products = await res.json();

      allProducts = products;

      if (!paginationInstance) {

        paginationInstance =
          new Pagination(products, 10);

        paginationInstance.onPageChange =
          renderCurrentPage;

      } else {

        paginationInstance.updateItems(products);
      }

      renderCurrentPage();

    } catch (error) {

      console.error(
        'Error cargando productos:',
        error
      );
    }
  }

  // ============================================
  // CARGAR PROVEEDORES
  // ============================================

  async function cargarProveedores() {

    try {

      const res =
        await fetch('/api/proveedores');

      const proveedores =
        await res.json();

      selectProveedor.innerHTML =
        '<option value="">Seleccione proveedor</option>';

      proveedores.forEach(proveedor => {

        const option =
          document.createElement('option');

        option.value =
          proveedor.nombre;

        option.textContent =
          proveedor.nombre;

        selectProveedor.appendChild(option);
      });

    } catch (error) {

      console.error(
        'Error cargando proveedores:',
        error
      );
    }
  }

  // ============================================
  // NUEVO PRODUCTO
  // ============================================

  btnNuevo.addEventListener('click', () => {

    editingId = null;

    formProducto.reset();

    formulario.style.display = 'block';
  });

  // ============================================
  // CANCELAR
  // ============================================

  cancelar.addEventListener('click', () => {

    formulario.style.display = 'none';

    formProducto.reset();

    editingId = null;
  });

  // ============================================
  // FILTRAR PRODUCTOS
  // ============================================

  filtroInput.addEventListener('input', function () {

    const search =
      this.value.toLowerCase();

    const filtered =
      allProducts.filter(product => {

        const text = `
          ${product.nombre}
          ${product.categoria}
          ${product.marca}
          ${product.proveedor}
        `.toLowerCase();

        return text.includes(search);
      });

    paginationInstance.updateItems(
      search ? filtered : allProducts
    );

    renderCurrentPage();
  });

  // ============================================
  // GUARDAR PRODUCTO
  // ============================================

  formProducto.addEventListener(
    'submit',
    async function (e) {

      e.preventDefault();

      const producto = {

        id: editingId || Date.now(),

        nombre:
          document.getElementById('nombreProducto')
          .value.trim(),

        categoria:
          document.getElementById('categoriaProducto')
          .value.trim(),

        marca:
          document.getElementById('marcaProducto')
          .value.trim(),

        precio:
          parseFloat(
            document.getElementById('precioProducto')
            .value
          ) || 0,

        stock:
          parseInt(
            document.getElementById('stockProducto')
            .value
          ) || 0,

        proveedor:
          selectProveedor.value.trim(),

        estado:
          document.getElementById('estadoProducto')
          .value
      };

      try {

        const res =
          await fetch('/api/productos', {

            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify(producto)
          });

        const data =
          await res.json();

        console.log(data);

        if (data.success) {

          if (window.ui && ui.showToast) {

            ui.showToast(
              'Producto guardado',
              'success'
            );
          }

          await loadProducts();

          formProducto.reset();

          formulario.style.display =
            'none';

          editingId = null;

        } else {

          alert(data.message);
        }

      } catch (error) {

        console.error(
          'Error guardando producto:',
          error
        );
      }
    }
  );

  // ============================================
  // EDITAR / ELIMINAR
  // ============================================

  tablaBody.addEventListener('click', function (e) {

    const btn =
      e.target.closest('button');

    if (!btn) return;

    const row =
      btn.closest('tr');

    const id =
      parseInt(row.dataset.id);

    // ========================================
    // EDITAR
    // ========================================

    if (btn.classList.contains('btn-edit')) {

      const cells =
        row.querySelectorAll('td');

      document.getElementById('nombreProducto').value =
        cells[1].textContent;

      document.getElementById('categoriaProducto').value =
        cells[2].textContent;

      document.getElementById('marcaProducto').value =
        cells[3].textContent;

      document.getElementById('precioProducto').value =
        cells[4]
          .textContent
          .replace('$', '')
          .replace(/\./g, '');

      document.getElementById('stockProducto').value =
        cells[5].textContent;

      selectProveedor.value =
        cells[6].textContent;

      document.getElementById('estadoProducto').value =
        cells[7].textContent;

      editingId = id;

      formulario.style.display = 'block';
    }

    // ========================================
    // ELIMINAR
    // ========================================

    if (btn.classList.contains('btn-delete')) {

      alert(
        'Eliminar pendiente backend'
      );
    }
  });

  // ============================================
  // ABRIR MODAL PROVEEDOR
  // ============================================

  btnNuevoProveedor.addEventListener(
    'click',
    () => {

      modalProveedor.style.display =
        'block';
    }
  );

  // ============================================
  // CERRAR MODAL
  // ============================================

  if (cerrarModalProveedor) {

    cerrarModalProveedor.addEventListener(
      'click',
      () => {

        modalProveedor.style.display =
          'none';
      }
    );
  }

  // ============================================
  // GUARDAR PROVEEDOR
  // ============================================

  guardarProveedor.addEventListener(
    'click',
    async () => {

      const nombre =
        document.getElementById(
          'nuevoProveedorNombre'
        ).value.trim();

      const contacto =
        document.getElementById(
          'nuevoProveedorContacto'
        ).value.trim();

      const correo =
        document.getElementById(
          'nuevoProveedorCorreo'
        ).value.trim();

      const telefono =
        document.getElementById(
          'nuevoProveedorTelefono'
        ).value.trim();

      const direccion =
        document.getElementById(
          'nuevoProveedorDireccion'
        ).value.trim();

      if (!nombre) {

        alert(
          'Ingrese nombre proveedor'
        );

        return;
      }

      try {

        const res =
          await fetch('/api/proveedores', {

            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

              nombre,
              contacto,
              correo,
              telefono,
              direccion
            })
          });

        const data =
          await res.json();

        if (data.success) {

          await cargarProveedores();

          selectProveedor.value =
            nombre;

          modalProveedor.style.display =
            'none';

          document.getElementById(
            'nuevoProveedorNombre'
          ).value = '';

          document.getElementById(
            'nuevoProveedorContacto'
          ).value = '';

          document.getElementById(
            'nuevoProveedorCorreo'
          ).value = '';

          document.getElementById(
            'nuevoProveedorTelefono'
          ).value = '';

          document.getElementById(
            'nuevoProveedorDireccion'
          ).value = '';

          if (window.ui && ui.showToast) {

            ui.showToast(
              'Proveedor creado',
              'success'
            );
          }
        }

      } catch (error) {

        console.error(
          'Error proveedor:',
          error
        );
      }
    }
  );

  // ============================================
  // INICIALIZAR
  // ============================================

  loadProducts();
  cargarProveedores();

});
