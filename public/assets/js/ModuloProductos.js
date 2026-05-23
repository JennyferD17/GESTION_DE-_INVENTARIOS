document.addEventListener('DOMContentLoaded', function () {

  /**
   * Módulo de Productos con Paginación
   */

  const btnNuevo = document.getElementById('btnNuevoProducto');
  const formulario = document.getElementById('formularioProducto');
  const cancelar = document.getElementById('cancelarProducto');
  const tablaBody = document.querySelector('#tablaProductos tbody');
  const formProducto = document.getElementById('formProducto');

  let editingId = null;
  let paginationInstance = null;
  let allProducts = [];
  let proveedoresGuardados = [];

  /**
   * Crear fila de producto
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
        <button class="btn-edit" title="Editar">
          <span class="icono">✏️</span>
        </button>

        <button class="btn-delete" title="Eliminar">
          <span class="icono eliminar">🗑️</span>
        </button>
      </td>
    `;

    return tr;
  }

  /**
   * Renderizar página actual
   */
  function renderCurrentPage() {

    if (!paginationInstance) return;

    const pageItems =
      paginationInstance.getCurrentPageItems();

    tablaBody.innerHTML = '';

    pageItems.forEach(product => {

      tablaBody.appendChild(
        createRow(product)
      );
    });

    paginationInstance.renderControls(
      'paginationControls'
    );
  }

  /**
   * Cargar productos
   */
  async function loadProducts() {

    try {

      const res =
        await fetch('/api/productos');

      const products =
        await res.json();

      console.log(
        'Productos cargados:',
        products
      );

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

    } catch (err) {

      console.error(
        'Error al cargar productos:',
        err
      );
    }
  }

  /**
   * Cargar proveedores
   */
  async function cargarProveedores() {

    try {

      const res =
        await fetch('/api/proveedores');

      const proveedores =
        await res.json();

      console.log(
        'Proveedores cargados:',
        proveedores
      );

      proveedoresGuardados = proveedores;

      const selectProveedor =
        document.getElementById(
          'proveedorProducto'
        );

      if (!selectProveedor) {

        console.error(
          'No existe proveedorProducto'
        );

        return;
      }

      // Limpiar opciones
      selectProveedor.innerHTML =
        '<option value="">Seleccione proveedor</option>';

      proveedores.forEach(proveedor => {

        const option =
          document.createElement('option');

        option.value = proveedor.nombre;

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
  // CARGA INICIAL
  // ============================================

  loadProducts();
  cargarProveedores();

  console.debug(
    'ModuloProductos inicializado'
  );

  // ============================================
  // FILTRADO
  // ============================================

  const filtroInput =
    document.getElementById(
      'filtroProductos'
    );

  if (filtroInput) {

    filtroInput.addEventListener(
      'input',
      function () {

        const searchTerm =
          this.value.toLowerCase();

        if (searchTerm === '') {

          paginationInstance.updateItems(
            allProducts
          );

          renderCurrentPage();

        } else {

          const filtered =
            allProducts.filter(product => {

              const text = `
                ${product.id}
                ${product.nombre}
                ${product.categoria}
                ${product.marca}
                ${product.proveedor}
              `.toLowerCase();

              return text.includes(searchTerm);
            });

          paginationInstance.updateItems(
            filtered
          );

          renderCurrentPage();
        }
      }
    );
  }

  // ============================================
  // NUEVO PRODUCTO
  // ============================================

  btnNuevo.addEventListener(
    'click',
    function () {

      formulario.style.display = 'block';

      editingId = null;

      formulario.classList.remove(
        'editing'
      );

      formProducto.reset();

      const submitBtn =
        formProducto.querySelector(
          'button[type="submit"]'
        );

      if (submitBtn) {

        submitBtn.textContent =
          'Guardar';

        submitBtn.classList.remove(
          'update'
        );
      }
    }
  );

  // ============================================
  // CANCELAR
  // ============================================

  cancelar.addEventListener(
    'click',
    function () {

      editingId = null;

      formulario.style.display = 'none';

      formulario.classList.remove(
        'editing'
      );

      formProducto.reset();

      const submitBtn =
        formProducto.querySelector(
          'button[type="submit"]'
        );

      if (submitBtn) {

        submitBtn.textContent =
          'Guardar';

        submitBtn.classList.remove(
          'update'
        );
      }
    }
  );

  // ============================================
  // GUARDAR PRODUCTO
  // ============================================

  formProducto.addEventListener(
    'submit',
    async function (e) {

      e.preventDefault();

      const nombre =
        document.getElementById(
          'nombreProducto'
        ).value.trim();

      const categoria =
        document.getElementById(
          'categoriaProducto'
        ).value.trim();

      const marca =
        document.getElementById(
          'marcaProducto'
        ).value.trim();

      const precio =
        parseFloat(
          document.getElementById(
            'precioProducto'
          ).value
        ) || 0;

      const stock =
        parseInt(
          document.getElementById(
            'stockProducto'
          ).value,
          10
        ) || 0;

      const proveedor =
        document.getElementById(
          'proveedorProducto'
        ).value.trim();

      const estado =
        document.getElementById(
          'estadoProducto'
        ).value;

      // Validación
      if (
        !nombre ||
        !categoria ||
        !marca ||
        !proveedor
      ) {

        if (window.ui && ui.showToast) {

          ui.showToast(
            'Complete todos los campos',
            'warning'
          );
        }

        return;
      }

      const producto = {

        id:
          editingId || Date.now(),

        nombre,
        categoria,
        marca,
        precio,
        stock,
        proveedor,
        estado
      };

      try {

        const res =
          await fetch('/api/productos', {

            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify(
              producto
            )
          });

        const data =
          await res.json();

        console.log(
          'Respuesta servidor:',
          data
        );

        if (data.success) {

          if (
            window.ui &&
            ui.showToast
          ) {

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

          formulario.classList.remove(
            'editing'
          );

        } else {

          if (
            window.ui &&
            ui.showToast
          ) {

            ui.showToast(
              data.message,
              'warning'
            );
          }
        }

      } catch (err) {

        console.error(
          'Error guardando producto:',
          err
        );

        if (
          window.ui &&
          ui.showToast
        ) {

          ui.showToast(
            'Error al guardar',
            'error'
          );
        }
      }
    }
  );

  // ============================================
  // EDITAR / ELIMINAR
  // ============================================

  tablaBody.addEventListener(
    'click',
    function (e) {

      const btn =
        e.target.closest('button');

      if (!btn) return;

      const row =
        btn.closest('tr');

      const id =
        row &&
        row.dataset &&
        row.dataset.id
          ? parseInt(
              row.dataset.id,
              10
            )
          : null;

      // ========================================
      // EDITAR
      // ========================================

      if (
        btn.classList.contains(
          'btn-edit'
        ) ||
        btn.title === 'Editar'
      ) {

        if (!id) return;

        const cells =
          row.querySelectorAll('td');

        document.getElementById(
          'nombreProducto'
        ).value =
          cells[1].textContent;

        document.getElementById(
          'categoriaProducto'
        ).value =
          cells[2].textContent;

        document.getElementById(
          'marcaProducto'
        ).value =
          cells[3].textContent;

        document.getElementById(
          'precioProducto'
        ).value =
          parseFloat(
            cells[4].textContent
              .replace('$', '')
              .replace(/\./g, '')
              .replace(',', '.')
          );

        document.getElementById(
          'stockProducto'
        ).value =
          cells[5].textContent;

        document.getElementById(
          'proveedorProducto'
        ).value =
          cells[6].textContent;

        document.getElementById(
          'estadoProducto'
        ).value =
          cells[7].textContent;

        editingId = id;

        formulario.style.display =
          'block';

        formulario.classList.add(
          'editing'
        );

        const submitBtn =
          formProducto.querySelector(
            'button[type="submit"]'
          );

        if (submitBtn) {

          submitBtn.textContent =
            'Actualizar';

          submitBtn.classList.add(
            'update'
          );
        }
      }

      // ========================================
      // ELIMINAR
      // ========================================

      if (
        btn.classList.contains(
          'btn-delete'
        ) ||
        btn.title === 'Eliminar'
      ) {

        if (!id) return;

        if (
          confirm(
            '¿Eliminar este producto?'
          )
        ) {

          console.warn(
            'Eliminar producto pendiente'
          );

          if (
            window.ui &&
            ui.showToast
          ) {

            ui.showToast(
              'Función eliminar pendiente',
              'info'
            );
          }
        }
      }
    }
  );
});
