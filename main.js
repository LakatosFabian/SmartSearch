let recipes = [];

const resultsGrid = document.getElementById("results-grid");
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const autocompleteList = document.getElementById("autocomplete-list");

const SCORE_WEIGHTS = {
  nameExact: 100,
  nameStarts: 60,
  nameIncludes: 40,
  nameFuzzy: 25,

  ingredientExact: 50,
  ingredientPartial: 20,
  ingredientFuzzy: 15,

  description: 10,

  allWordsBonus: 80
};


// load recipes from json file
fetch("recipes.json")
  .then(response => response.json())
  .then(data => {
    recipes = data;
    displayRecipes(recipes);
  })
  .catch(error => console.error("Error loading recipes:", error));


// displays recipes on screen
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


// splits search
function normalizeQuery(query) {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
}

// fuzzy matching
function similarity(a, b) {
  if (a === b) return 1;

  if (a.length < 3 || b.length < 3) return 0;

  let matches = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }

  return matches / Math.max(a.length, b.length);
}


// scoring system for search relevance
function getScore(recipe, queryWords) {
  let score = 0;

  const name = recipe.name.toLowerCase();
  const description = recipe.description.toLowerCase();
  const ingredients = recipe.ingredients.map(i => i.toLowerCase());

  queryWords.forEach(word => {

    // name scoring
    if (name === word) {
      score += SCORE_WEIGHTS.nameExact;
    } else if (name.startsWith(word)) {
      score += SCORE_WEIGHTS.nameStarts;
    } else if (name.includes(word)) {
      score += SCORE_WEIGHTS.nameIncludes;
    } else if (name.split(" ").some(w => similarity(w, word) > 0.6)) {
      score += SCORE_WEIGHTS.nameFuzzy;
    }

    // ingredient scoring
    const ingredientMatch = ingredients.some(i => i === word);
    const ingredientPartial = ingredients.some(i => i.includes(word));
    const ingredientFuzzy = ingredients.some(i =>similarity(i, word) > 0.6);

    if (ingredientMatch) {
      score += SCORE_WEIGHTS.ingredientExact;
    } else if (ingredientPartial) {
      score += SCORE_WEIGHTS.ingredientPartial;
    } else if (ingredientFuzzy) {
      score += SCORE_WEIGHTS.ingredientFuzzy;
    }

    // description scoring
    if (
      description.includes(word) || 
      description.split(" ").some(w => similarity(w, word) > 0.6) 
    ) {
      score += SCORE_WEIGHTS.description;
    }
  });

  // bonus if all words match somewhere
  const allWordsMatch = queryWords.every(word =>
  name.includes(word) ||
  name.split(" ").some(w => similarity(w, word) > 0.6) ||

  description.includes(word) ||
  description.split(" ").some(w => similarity(w, word) > 0.6) ||

  ingredients.some(i => i.includes(word)) ||
  ingredients.some(i => similarity(i, word) > 0.6)
);

  if (allWordsMatch && queryWords.length > 1) {
    score += SCORE_WEIGHTS.allWordsBonus;
  }

  return score;
}


// handles search submit
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const queryWords = normalizeQuery(input.value);

  const scored = recipes
    .map(recipe => ({
      recipe,
      score: getScore(recipe, queryWords)
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.recipe);

  displayRecipes(scored);
});


// autocomplete input logic
let debounceTimeout;

input.addEventListener("input", (e) => {
  clearTimeout(debounceTimeout);

  const query = e.target.value.toLowerCase().trim();

  debounceTimeout = setTimeout(() => {
    autocompleteList.innerHTML = "";

    if (!query) return;

    const queryWords = normalizeQuery(query);

    const scored = recipes
      .map(recipe => ({
        recipe,
        score: getScore(recipe, queryWords)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    scored.forEach(item => {
      const recipe = item.recipe;

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


// close autocomplete when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    autocompleteList.innerHTML = "";
  }
});