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

  function validarDocumento(tipo, numero) {
    if (!numero) return false;

    switch (tipo) {
      case 'CC': return /^[0-9]{6,12}$/.test(numero);
      case 'NIT': return /^[0-9]{9}-?[0-9]$/.test(numero);
      case 'PEP':
      case 'PPT':
      case 'PAS':
      case 'CE':
        return /^[A-Z0-9\-]{6,20}$/.test(numero);
      default:
        return false;
    }
  }

  function createRow(cliente) {
    const tr = document.createElement('tr');
    tr.dataset.id = cliente.idCliente;

    tr.innerHTML = `
      <td>${cliente.tipoDocumento}</td>
      <td>${cliente.numeroDocumento}</td>
      <td>${cliente.nombre}</td>
      <td>${cliente.email}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.fecha}</td>
      <td>${cliente.pedidos || 0}</td>
      <td>$${parseFloat(cliente.comprado || 0).toLocaleString('es-CO')}</td>
      <td>
        <button class="btn-edit">✏️</button>
        <button class="btn-delete">🗑️</button>
      </td>
    `;
    return tr;
  }

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
      console.error(err);
    }
  }

  loadClients();

  // FILTRO
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

  // NUEVO CLIENTE
  btnNuevoCliente.addEventListener('click', () => {
    editingId = null;
    formCliente.reset();
    formularioCliente.style.display = 'block';
  });

  cancelarCliente.addEventListener('click', () => {
    formularioCliente.style.display = 'none';
    formCliente.reset();
    editingId = null;
  });

  // GUARDAR CLIENTE
  formCliente.addEventListener('submit', async function (e) {
    e.preventDefault();

    const tipoDocumento = document.getElementById('tipoDocumento').value;
    const numeroDocumento = document.getElementById('numeroDocumento').value.trim();

    if (!validarDocumento(tipoDocumento, numeroDocumento)) {
      alert('Documento inválido');
      return;
    }

    const cliente = {
      idCliente: editingId,
      tipoDocumento,
      numeroDocumento,
      nombre: document.getElementById('nombreCliente').value.trim(),
      email: document.getElementById('emailCliente').value.trim(),
      telefono: document.getElementById('telefonoCliente').value.trim(),
      fecha: document.getElementById('fechaRegistro').value
    };

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Error guardando cliente');
        return;
      }

      loadClients();

      formularioCliente.style.display = 'none';
      formCliente.reset();
      editingId = null;

    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  });

  // EDITAR / ELIMINAR
  tablaBody.addEventListener('click', function (e) {
    const row = e.target.closest('tr');
    if (!row) return;

    const id = row.dataset.id;

    if (e.target.classList.contains('btn-edit')) {
      const cells = row.querySelectorAll('td');

      document.getElementById('tipoDocumento').value = cells[0].textContent;
      document.getElementById('numeroDocumento').value = cells[1].textContent;
      document.getElementById('nombreCliente').value = cells[2].textContent;
      document.getElementById('emailCliente').value = cells[3].textContent;
      document.getElementById('telefonoCliente').value = cells[4].textContent;
      document.getElementById('fechaRegistro').value = cells[5].textContent;

      editingId = id;
      formularioCliente.style.display = 'block';
    }

    if (e.target.classList.contains('btn-delete')) {
      alert('Eliminar aún no implementado');
    }
  });

});
