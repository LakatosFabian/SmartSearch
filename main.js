let recipes = [];

const resultsGrid = document.getElementById("results-grid");
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const autocompleteList = document.getElementById("autocomplete-list");


fetch("recipes.json")
  .then(response => response.json())
  .then(data => {
    recipes = data;
    displayRecipes(recipes);
  })
  .catch(error => console.error("Error loading recipes:", error));


function displayRecipes(recipesArray) {
  resultsGrid.innerHTML = "";

  recipesArray.slice(0, 8).forEach(recipe => {
    const div = document.createElement("div");
    div.classList.add("recipe-item");

    div.innerHTML = `
      <h3>${recipe.name}</h3>
      <p>${recipe.description}</p>
      <p>Ingredients: ${recipe.ingredients.join(", ")}</p>
    `;

    resultsGrid.appendChild(div);
  });
}


form.addEventListener("submit", function (e) {
  e.preventDefault();

  const query = input.value.toLowerCase();

  const filtered = recipes.filter(recipe => {
    return (
      recipe.name.toLowerCase().includes(query) ||
      recipe.ingredients.some(ingredient =>
        ingredient.toLowerCase().includes(query)
      )
    );
  });

  displayRecipes(filtered);
});

let debounceTimeout;

input.addEventListener("input", (e) => {
  clearTimeout(debounceTimeout);

  const query = e.target.value.toLowerCase().trim();

  debounceTimeout = setTimeout(() => {
    autocompleteList.innerHTML = "";

    if (!query) return;

    const matches = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(query)
    );

    matches.slice(0, 5).forEach(recipe => {
      const li = document.createElement("li");
      li.textContent = recipe.name;

      li.addEventListener("click", () => {
        input.value = recipe.name;
        autocompleteList.innerHTML = "";
        displayRecipes([recipe]);
      });

      autocompleteList.appendChild(li);
    });
  }, 150);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    autocompleteList.innerHTML = "";
  }
});