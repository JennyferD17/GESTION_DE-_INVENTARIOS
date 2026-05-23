// ============================================
// LOGIN
// ============================================

document.addEventListener(  'DOMContentLoaded',  function () {

    const loginBtn =
      document.getElementById(
        'loginBtn'
      );

    const mensaje =
      document.getElementById(
        'mensajeLogin'
      );

    const olvidePassword =
      document.getElementById(
        'olvidePassword'
      );

    // =====================================
    // LOGIN
    // =====================================

    loginBtn.addEventListener(      'click',      async function () {

        const email =
          document.getElementById(
            'email'
          ).value.trim();

        const password =
          document.getElementById(
            'password'
          ).value.trim();

        // =========================
        // VALIDAR
        // =========================

        if (!email || !password) {
          mensaje.innerHTML =
            'Complete todos los campos';

          return;
        }

        try {

          const res =
            await fetch(
              '/api/login',
              {

                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body: JSON.stringify({

                  email,
                  password
                })
              }
            );

          const data =
            await res.json();

          console.log(data);

          // =====================
          // LOGIN OK
          // =====================

          if (data.success) {

            // =================
            // GUARDAR SESION
            // =================

            localStorage.setItem(
              'usuario',
              JSON.stringify(data.user)
            );

            mensaje.style.color =
              'green';

            mensaje.innerHTML =
              'Ingreso exitoso';

            // =================
            // REDIRECCION
            // =================

            setTimeout(() => {

              window.location.href =
                'Dashboard.html';

            }, 1000);

          } else {

            mensaje.style.color =
              'red';

            mensaje.innerHTML =
              data.message;
          }

        } catch (error) {

          console.error(error);

          mensaje.style.color =
            'red';

          mensaje.innerHTML =
            'Error conexión servidor';
        }
      }
    );

    // =====================================
    // OLVIDE PASSWORD
    // =====================================

    olvidePassword.addEventListener(
      'click',
      async function (e) {

        e.preventDefault();

        const correo =
          prompt(
            'Ingrese su correo'
          );

        if (!correo) return;

        try {

          const res =
            await fetch(
              '/api/reset-password',
              {

                method:'POST',

                headers:{
                  'Content-Type':
                    'application/json'
                },

                body: JSON.stringify({

                  correo
                })
              }
            );

          const data =
            await res.json();

          alert(data.message);

        } catch (error) {

          console.error(error);

          alert(
            'Error servidor'
          );
        }
      }
    );
  }
);
