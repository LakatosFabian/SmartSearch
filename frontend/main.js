const resultsGrid = document.getElementById("results-grid");
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const autocompleteList = document.getElementById("autocomplete-list");


// display recipes on screen
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


//fetch recipes from api
async function searchRecipes(query) {
  const res = await fetch(
    `http://localhost:3000/api/search?q=${encodeURIComponent(query)}`
  );

  return await res.json();
}


// handles search submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const query = input.value;
  const results = await searchRecipes(query);

  displayRecipes(results);
  autocompleteList.innerHTML = "";
});


// autocomplete logic
let debounceTimeout;

input.addEventListener("input", (e) => {
  clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(async () => {
    const query = e.target.value.trim();

    autocompleteList.innerHTML = "";
    if (!query) return;

    const results = await searchRecipes(query);

    results.slice(0, 5).forEach(recipe => {
      const li = document.createElement("li");
      li.textContent = recipe.name;

      li.addEventListener("click", () => {
        input.value = recipe.name;
        autocompleteList.innerHTML = "";
        displayRecipes([recipe]);
      });

      autocompleteList.appendChild(li);
    });
  }, 100);
});


// close autocomplete when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    autocompleteList.innerHTML = "";
  }
});