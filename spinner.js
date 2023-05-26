// code that shows and hides the spinner
document.addEventListener('DOMContentLoaded', function () {
    const recipeLinks = document.querySelectorAll('.recipe-link');
  
    recipeLinks.forEach((link) => {
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        const recipeName = event.target.getAttribute('data-recipe-name');
        showSpinner();
  
        try {
          const response = await fetch(`/recipe/${recipeName}`);
          const data = await response.json();
          // Update the DOM with the received data
          hideSpinner();
        } catch (error) {
          console.error(error);
          hideSpinner();
        }
      });
    });
  });
  