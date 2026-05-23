// ModuloCliente.js – Gestión de Clientes con paginación

document.addEventListener('DOMContentLoaded', function () {

  const btnNuevoCliente = document.getElementById('btnNuevoCliente');
  const formularioCliente = document.getElementById('formularioCliente');
  const cancelarCliente = document.getElementById('cancelarCliente');
  const tablaBody = document.querySelector('#tablaClientes tbody');
  const formCliente = document.getElementById('formCliente');
  const filtroInput = document.getElementById('filtroClientes');

  let editingId = null;
  let clientsData = [];
  let pagination = null;

  /**
   * Crear fila de cliente
   */
  function createRow(cliente) {
    const tr = document.createElement('tr');
    tr.dataset.id = cliente.id;

    tr.innerHTML = `
      <td>${cliente.id}</td>
      <td>${cliente.nombre}</td>
      <td>${cliente.email}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.fecha}</td>
      <td>${cliente.pedidos || 0}</td>
      <td>$${parseFloat(cliente.comprado || 0).toLocaleString('es-CO')}</td>
      <td>
        <button class="btn-edit" title="Editar"><span class="icono">✏️</span></button>
        <button class="btn-delete" title="Eliminar"><span class="icono eliminar">🗑️</span></button>
      </td>
    `;

    return tr;
  }

  /**
   * Cargar clientes
   */
  async function loadClients() {
    try {
      const res = await fetch('/api/clientes');
      const clients = await res.json();

      clientsData = clients;

      pagination = new Pagination(clientsData, 10);

      const render = () => {
        tablaBody.innerHTML = '';
        pagination.getCurrentPageItems().forEach(c =>
          tablaBody.appendChild(createRow(c))
        );
      };

      pagination.onPageChange = render;
      render();
      pagination.renderControls('paginationClientes');

    } catch (err) {
      console.error('Error al cargar clientes:', err);
    }
  }

  loadClients();

  /**
   * Filtro
   */
  if (filtroInput) {
    filtroInput.addEventListener('input', function () {
      const term = this.value.toLowerCase();

      const filtered = clientsData.filter(c =>
        Object.values(c).some(v =>
          String(v).toLowerCase().includes(term)
        )
      );

      pagination.updateItems(filtered);
      pagination.renderControls('paginationClientes');
      pagination.onPageChange();
    });
  }

  /**
   * Abrir formulario
   */
  function openForm(edit = false) {
    formularioCliente.style.display = 'block';
    formularioCliente.classList.toggle('editing', edit);

    const btn = formCliente.querySelector('button[type="submit"]');
    if (btn) {
      btn.textContent = edit ? 'Actualizar' : 'Guardar';
      btn.classList.toggle('update', edit);
    }
  }

  btnNuevoCliente.addEventListener('click', function () {
    editingId = null;
    formCliente.reset();
    openForm(false);
  });

  cancelarCliente.addEventListener('click', function () {
    editingId = null;
    formularioCliente.style.display = 'none';
    formCliente.reset();
  });

  /**
   * Guardar cliente (CORREGIDO)
   */
  formCliente.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombreCliente').value.trim();
    const email = document.getElementById('emailCliente').value.trim();
    const telefono = document.getElementById('telefonoCliente').value.trim();
    const fecha = document.getElementById('fechaRegistro').value;

    const cliente = {
      id: editingId || Date.now(),
      nombre,
      email,
      telefono,
      fecha,

      // 🔥 IMPORTANTE: siempre inician en 0
      pedidos: 0,
      comprado: 0
    };

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente)
      });

      if (res.ok) {
        if (window.ui?.showToast) ui.showToast('Cliente guardado', 'success');
        loadClients();
      } else {
        if (window.ui?.showToast) ui.showToast('Error al guardar', 'error');
      }

    } catch (err) {
      console.error('Error:', err);
    }

    formularioCliente.style.display = 'none';
    editingId = null;
    formCliente.reset();
  });

  /**
   * Editar / eliminar
   */
  tablaBody.addEventListener('click', function (e) {

    const btnEdit = e.target.closest('.btn-edit');
    const btnDelete = e.target.closest('.btn-delete');
    const row = e.target.closest('tr');

    if (!row) return;

    const id = row.dataset.id ? parseInt(row.dataset.id, 10) : null;

    if (btnEdit) {
      if (!id) return;

      const cells = row.querySelectorAll('td');

      document.getElementById('nombreCliente').value = cells[1].textContent;
      document.getElementById('emailCliente').value = cells[2].textContent;
      document.getElementById('telefonoCliente').value = cells[3].textContent;
      document.getElementById('fechaRegistro').value = cells[4].textContent;

      editingId = id;
      openForm(true);
    }

    if (btnDelete) {
      if (!id) return;

      if (confirm('¿Eliminar este cliente?')) {
        if (window.ui?.showToast) ui.showToast('Eliminar pendiente en backend', 'info');
      }
    }
  });

});
