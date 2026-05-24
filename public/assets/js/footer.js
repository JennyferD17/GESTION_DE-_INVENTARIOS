document.addEventListener('DOMContentLoaded', () => {

  const footer = document.createElement('footer');

  footer.className = 'footer-global';

  footer.innerHTML = `
  
    <p>
      © 2026 Sistema Gestión de Inventarios.
      Todos los derechos reservados.
    </p>

   
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
