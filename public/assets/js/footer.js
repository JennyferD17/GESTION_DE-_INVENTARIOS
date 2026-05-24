document.addEventListener('DOMContentLoaded', () => {

  const footer = document.createElement('footer');

  footer.className = 'footer-global';

  footer.innerHTML = `
  
    <p>
      © 2026 Sistema Gestión de Inventarios.
      Todos los derechos reservados.
    </p>

    <div class="footer-links">
      <a href="#">Quiénes somos</a>
      <a href="#">Equipo desarrollador</a>
      <a href="#">Privacidad</a>
      <a href="#">Contáctanos</a>
    </div>

    <p>
      Desarrollado por
      <strong>Jennyfer Díaz</strong>
      y
      <strong>John Carmona</strong>
    </p>

    <p>
      ✉️ jdiazp1@soy.sena.edu.co |
      jcarmonas6@soy.sena.edu.co
    </p>

    <p>
      Proyecto académico SENA
    </p>
  `;

  document.body.appendChild(footer);

});
