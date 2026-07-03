document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.course-tab');
  const lists = document.querySelectorAll('.subject-list');
  const toast = document.getElementById('toast');
  let toastTimeout;

  // Lógica para cambiar de curso (pestañas)
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Eliminar clase active de todas las pestañas
      tabs.forEach(t => t.classList.remove('active'));
      // Añadir active a la pestaña clicada
      tab.classList.add('active');

      // Ocultar todas las listas de asignaturas
      lists.forEach(list => list.classList.add('hidden'));
      
      // Mostrar la lista correspondiente al target
      const targetId = tab.getAttribute('data-target');
      const targetList = document.getElementById(targetId);
      if (targetList) {
        targetList.classList.remove('hidden');
      }
    });
  });

  // Lógica global para mostrar el aviso toast
  window.showToast = function(e) {
    e.preventDefault();
    
    // Si hay un timeout anterior, limpiarlo para reiniciar la animación
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    // Mostrar toast
    toast.classList.add('show');

    // Ocultar toast después de 3 segundos
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  };
});
