// assets/js/login.js
/**
 * Módulo de login
 * - Aplica prefill si viene desde la confirmación de registro.
 * - Envía credenciales al endpoint /api/login y guarda el usuario en localStorage.
 */
document.addEventListener("DOMContentLoaded", function () {
  // Revisar si hay datos para prellenar el login (vienen de la confirmación)
  try {
    const prefill = sessionStorage.getItem('prefillLogin');
    if (prefill) {
      const obj = JSON.parse(prefill);
      if (obj.email) {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = obj.email;
      }
      if (obj.password) {
        const passInput = document.getElementById('password');
        if (passInput) passInput.value = obj.password;
      }
      // Sólo usar una vez
      sessionStorage.removeItem('prefillLogin');
    }
  } catch (e) {
    console.warn('No se pudo aplicar prefillLogin:', e);
  }

  /**
   * API_BASE
   * Calcula la URL base del backend (útil cuando los HTML se sirven desde otro puerto).
   */
  const API_BASE = (function () {
    try {
      if (location.protocol === 'file:') return 'http://localhost:3000';
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        if (location.port && location.port !== '3000') return 'http://localhost:3000';
        return '';
      }
    } catch (e) {
      return 'http://localhost:3000';
    }
    return '';
  })();
  // Botón de inicio de sesión: al hacer click manda las credenciales al backend
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
  loginBtn.addEventListener("click", async function () {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (email === "" || password === "") {
        alert("Por favor, completa todos los campos.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          // Guardar usuario en localStorage y redirigir
          localStorage.setItem('loggedIn', 'true');
          localStorage.setItem('user', JSON.stringify(data.user || {}));
          window.location.href = 'Dashboard.html';
        } else {
          alert(data.message || 'Credenciales incorrectas.');
        }
      } catch (err) {
        console.error('Error en fetch /api/login:', err);
        alert('Error al conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3000');
      }
    });
  }

  // Botón de registro
  // Enlace de registro: navegar a la página de registro
  const registerLink = document.getElementById('registerLink');
  if (registerLink) {
    registerLink.addEventListener('click', function (e) {
      // navegación estándar por href está bien; mantenemos la redirección explícita
      e.preventDefault();
      window.location.href = 'Registro.html';
    });
  }
});
