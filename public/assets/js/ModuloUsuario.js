document.addEventListener(
  'DOMContentLoaded',
  function () {

    const btnNuevo =
      document.getElementById(
        'btnNuevoUsuario'
      );

    const formulario =
      document.getElementById(
        'formularioUsuario'
      );

    const cancelar =
      document.getElementById(
        'cancelarUsuario'
      );

    const form =
      document.getElementById(
        'formUsuario'
      );

    const tabla =
      document.querySelector(
        '#tablaUsuarios tbody'
      );

    let editingId = null;

    // ============================
    // CARGAR USUARIOS
    // ============================

    async function cargarUsuarios() {

      try {

        const res =
          await fetch('/api/users');

        const data =
          await res.json();

        tabla.innerHTML = '';

        data.usuarios.forEach(user => {

          tabla.innerHTML += `

            <tr data-id="${user.id}">

              <td>${user.id}</td>

              <td>${user.nombre}</td>

              <td>${user.correo}</td>

              <td>${user.rol || 'usuario'}</td>

              <td>
                ${
                  user.activo === false
                    ? 'Inactivo'
                    : 'Activo'
                }
              </td>

              <td>

                <button
                  class="btn-edit"
                >

                  ✏️

                </button>

              </td>

            </tr>
          `;
        });

      } catch (error) {

        console.error(error);
      }
    }

    // ============================
    // NUEVO
    // ============================

    btnNuevo.addEventListener(
      'click',
      function () {

        editingId = null;

        form.reset();

        formulario.style.display =
          'block';
      }
    );

    // ============================
    // CANCELAR
    // ============================

    cancelar.addEventListener(
      'click',
      function () {

        formulario.style.display =
          'none';

        form.reset();
      }
    );

    // ============================
    // GUARDAR
    // ============================

    form.addEventListener(
      'submit',
      async function (e) {

        e.preventDefault();

        const usuario = {

          id:
            editingId || Date.now(),

          nombre:
            document.getElementById(
              'nombreUsuario'
            ).value,

          documento:
            document.getElementById(
              'documentoUsuario'
            ).value,

          correo:
            document.getElementById(
              'correoUsuario'
            ).value,

          telefono:
            document.getElementById(
              'telefonoUsuario'
            ).value,

          password:
            document.getElementById(
              'passwordUsuario'
            ).value,

          rol:
            document.getElementById(
              'rolUsuario'
            ).value
        };

        try {

          const res =
            await fetch(
              '/api/register',
              {

                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify(usuario)
              }
            );

          const data =
            await res.json();

          if (data.success) {

            alert(
              'Usuario guardado'
            );

            form.reset();

            formulario.style.display =
              'none';

            cargarUsuarios();

          } else {

            alert(data.message);
          }

        } catch (error) {

          console.error(error);
        }
      }
    );

    // ============================
    // EDITAR
    // ============================

    tabla.addEventListener(
      'click',
      function (e) {

        const btn =
          e.target.closest(
            '.btn-edit'
          );

        if (!btn) return;

        const row =
          btn.closest('tr');

        const cells =
          row.querySelectorAll('td');

        editingId =
          row.dataset.id;

        document.getElementById(
          'nombreUsuario'
        ).value =
          cells[1].textContent;

        document.getElementById(
          'correoUsuario'
        ).value =
          cells[2].textContent;

        document.getElementById(
          'rolUsuario'
        ).value =
          cells[3].textContent;

        formulario.style.display =
          'block';
      }
    );

    cargarUsuarios();
  }
);
