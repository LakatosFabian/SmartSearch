const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// connect to mongodb database
mongoose.connect("mongodb://lakatosfabian:XA2LC1Mjr46Vm5U7@ac-1irlecb-shard-00-00.3iyxint.mongodb.net:27017,ac-1irlecb-shard-00-01.3iyxint.mongodb.net:27017,ac-1irlecb-shard-00-02.3iyxint.mongodb.net:27017/smart_recipesDB?ssl=true&replicaSet=atlas-s155vj-shard-0&authSource=admin&appName=smart-recipes-cluster")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error(err));

// recipe schema 
const recipeSchema = new mongoose.Schema({
  name: String,
  description: String,
  ingredients: [String]
});

const Recipe = mongoose.model("Recipe", recipeSchema);

// normalize search query 
function normalizeQuery(query) {
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

// comparing similarity between 2 strings
function similarity(a, b) {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return 0;

  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }

  return matches / Math.max(a.length, b.length);
}

// scoring system for search ranking
const SCORE = {
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

// calculate relevance score for a recipe
function getScore(recipe, words) {
  let score = 0;

  const name = recipe.name?.toLowerCase() || "";
  const desc = recipe.description?.toLowerCase() || "";
  const ingredients = (recipe.ingredients || []).map(i => i.toLowerCase());

  for (const word of words) {

    // name matches
    if (name === word) score += SCORE.nameExact;
    else if (name.startsWith(word)) score += SCORE.nameStarts;
    else if (name.includes(word)) score += SCORE.nameIncludes;
    else if (name.split(" ").some(w => similarity(w, word) > 0.6)) {
      score += SCORE.nameFuzzy;
    }

    // ingedient matches
    if (ingredients.some(i => i === word)) score += SCORE.ingredientExact;
    else if (ingredients.some(i => i.includes(word))) score += SCORE.ingredientPartial;
    else if (ingredients.some(i => similarity(i, word) > 0.6)) {
      score += SCORE.ingredientFuzzy;
    }

    // description matches
    if (
      desc.includes(word) ||
      desc.split(" ").some(w => similarity(w, word) > 0.6)
    ) {
      score += SCORE.description;
    }
  }

  // perfect match bonus
  const allMatch = words.every(w =>
    name.includes(w) ||
    desc.includes(w) ||
    ingredients.some(i => i.includes(w))
  );

  if (allMatch && words.length > 1) {
    score += SCORE.allWordsBonus;
  }

  return score;
}

// search API endpoint
app.get("/api/search", async (req, res) => {
  const query = req.query.q || "";

  //return default recipes if no search query
  if (!query.trim()) {
    const recipes = await Recipe.find().limit(10);
    return res.json(recipes);
  }

  const words = normalizeQuery(query);

  const recipes = await Recipe.find();

  // score and rank recipes
  const scored = recipes
    .map(recipe => ({
      recipe,
      score: getScore(recipe, words)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.recipe);

  res.json(scored);
});


// start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});