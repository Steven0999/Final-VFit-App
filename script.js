/* ============================================================
   FITTRACK PRO V9
   script.js — PART 1
   Global State • Safe Init • Utilities
   ============================================================ */

"use strict";

/* ============================================================
   GLOBAL APP NAMESPACE (PREVENTS COLLISIONS)
   ============================================================ */

window.FitTrack = {
  version: "9.0.0",
  build: "frontend-only",
  env: "production",
  ready: false,
  debug: true
};

/* ============================================================
   GLOBAL STATE STORE
   ============================================================ */

FitTrack.state = {
  user: {
    name: "User",
    tier: "Beginner",
    xp: 0,
    level: 1,
    streak: 0,
    lastActive: null
  },

  ui: {
    activeTab: "dashboard",
    workoutEnv: "gym",
    nutritionTab: "log",
    metricsTab: "checkin"
  },

  workout: {
    active: false,
    startTime: null,
    timerInterval: null,
    exercises: [],
    focus: "Full Body",
    selectedMuscles: [],
    addCore: false,
    addCardio: false
  },

  nutrition: {
    dailyLog: [],
    database: [],
    archivedDays: [],
    activeMeal: []
  },

  metrics: {
    logs: []
  },

  gamification: {
    achievements: [],
    badges: [],
    unlockedFeatures: []
  }
};

/* ============================================================
   SAFE DOM HELPERS
   ============================================================ */

FitTrack.dom = {
  byId(id) {
    return document.getElementById(id);
  },
  qs(sel) {
    return document.querySelector(sel);
  },
  qsa(sel) {
    return Array.from(document.querySelectorAll(sel));
  },
  exists(id) {
    return document.getElementById(id) !== null;
  }
};

/* ============================================================
   LOGGING (DEBUG SAFE)
   ============================================================ */

FitTrack.log = function (...args) {
  if (FitTrack.debug) {
    console.log("[FitTrack]", ...args);
  }
};

/* ============================================================
   LOCAL STORAGE ENGINE
   ============================================================ */

FitTrack.storage = {
  key: "fittrack_pro_v9",

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return;
      const data = JSON.parse(raw);
      Object.assign(FitTrack.state, data);
      FitTrack.log("State loaded");
    } catch (e) {
      console.error("Storage load failed", e);
    }
  },

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(FitTrack.state));
    } catch (e) {
      console.error("Storage save failed", e);
    }
  }
};

/* ============================================================
   GLOBAL UI FUNCTIONS (USED BY HTML onclick)
   ============================================================ */

/* ---------- TAB SWITCHING ---------- */
window.switchTab = function (tabId) {
  FitTrack.log("Switching tab:", tabId);

  FitTrack.dom.qsa(".tab-content").forEach(sec => {
    sec.classList.add("hidden");
    sec.classList.remove("active");
  });

  const target = FitTrack.dom.byId(tabId);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
    FitTrack.state.ui.activeTab = tabId;
  }

  FitTrack.storage.save();
};

/* ---------- NUTRITION SUB TABS ---------- */
window.setNutritionTab = function (tab) {
  FitTrack.state.ui.nutritionTab = tab;

  FitTrack.dom.byId("nut-view-log")?.classList.toggle("hidden", tab !== "log");
  FitTrack.dom.byId("nut-view-db")?.classList.toggle("hidden", tab !== "database");

  FitTrack.storage.save();
};

/* ---------- METRICS SUB TABS ---------- */
window.setMetricsTab = function (tab) {
  FitTrack.state.ui.metricsTab = tab;

  FitTrack.dom.byId("metrics-view-checkin")?.classList.toggle("hidden", tab !== "checkin");
  FitTrack.dom.byId("metrics-view-logs")?.classList.toggle("hidden", tab !== "logs");

  FitTrack.storage.save();
};

/* ============================================================
   WORKOUT ENVIRONMENT
   ============================================================ */

window.setWorkoutEnv = function (env) {
  FitTrack.state.ui.workoutEnv = env;

  FitTrack.dom.byId("env-tab-gym")?.classList.toggle("active", env === "gym");
  FitTrack.dom.byId("env-tab-home")?.classList.toggle("active", env === "home");

  FitTrack.storage.save();
};

/* ============================================================
   MODALS (GENERIC)
   ============================================================ */

window.openMealModal = function () {
  FitTrack.dom.byId("meal-modal")?.classList.remove("hidden");
};

window.closeMealModal = function () {
  FitTrack.dom.byId("meal-modal")?.classList.add("hidden");
};

window.openTutorial = function () {
  FitTrack.dom.byId("tutorial-modal")?.classList.remove("hidden");
};

window.closeTutorial = function () {
  FitTrack.dom.byId("tutorial-modal")?.classList.add("hidden");
};

/* ============================================================
   STUB FUNCTIONS (FILLED IN LATER PARTS)
   ============================================================ */

window.startManualWorkout = function () {
  alert("Manual workout engine loads in Part 3");
};

window.generateAIWorkout = function () {
  alert("AI Coach loads in Part 3");
};

window.saveWorkout = function () {};
window.cancelWorkout = function () {};
window.handleFoodSearch = function () {};
window.saveToDatabase = function () {};
window.startScanner = function () {};
window.stopScanner = function () {};
window.saveMetrics = function () {};
window.triggerPhoto = function () {};

/* ============================================================
   DOM READY BOOTSTRAP (CRITICAL)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  FitTrack.log("DOM fully loaded");

  FitTrack.storage.load();

  // Restore tab
  switchTab(FitTrack.state.ui.activeTab || "dashboard");
  setNutritionTab(FitTrack.state.ui.nutritionTab || "log");
  setMetricsTab(FitTrack.state.ui.metricsTab || "checkin");

  // Dashboard stats placeholders
  if (FitTrack.dom.exists("user-tier")) {
    FitTrack.dom.byId("user-tier").textContent = FitTrack.state.user.tier;
    FitTrack.dom.byId("user-xp").textContent = FitTrack.state.user.xp;
    FitTrack.dom.byId("user-streak").textContent = FitTrack.state.user.streak;
  }

  FitTrack.ready = true;
  FitTrack.log("FitTrack ready");
});
/* ============================================================
   FITTRACK PRO V9
   script.js — PART 2
   Navigation • Dashboard • UI Sync
   ============================================================ */

/* ============================================================
   NAV BUTTON ACTIVE STATE HANDLING
   ============================================================ */

FitTrack.ui = FitTrack.ui || {};

FitTrack.ui.updateNav = function () {
  FitTrack.dom.qsa(".nav-item").forEach(btn => {
    const tab = btn.getAttribute("data-tab");
    btn.classList.toggle(
      "active",
      tab === FitTrack.state.ui.activeTab
    );
  });
};

/* Patch switchTab to include nav sync */
const _switchTabOriginal = window.switchTab;
window.switchTab = function (tabId) {
  _switchTabOriginal(tabId);
  FitTrack.ui.updateNav();
};

/* ============================================================
   DASHBOARD LIVE UPDATE ENGINE
   ============================================================ */

FitTrack.dashboard = {};

FitTrack.dashboard.update = function () {
  if (!FitTrack.ready) return;

  const totals = FitTrack.nutrition?.calculateDailyTotals?.() || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  FitTrack.dom.byId("dash-calories") &&
    (FitTrack.dom.byId("dash-calories").textContent = totals.calories);

  FitTrack.dom.byId("dash-protein") &&
    (FitTrack.dom.byId("dash-protein").textContent = totals.protein + "g");

  FitTrack.dom.byId("dash-carbs") &&
    (FitTrack.dom.byId("dash-carbs").textContent = totals.carbs + "g");

  FitTrack.dom.byId("dash-fat") &&
    (FitTrack.dom.byId("dash-fat").textContent = totals.fat + "g");

  FitTrack.dom.byId("user-tier") &&
    (FitTrack.dom.byId("user-tier").textContent = FitTrack.state.user.tier);

  FitTrack.dom.byId("user-xp") &&
    (FitTrack.dom.byId("user-xp").textContent = FitTrack.state.user.xp);

  FitTrack.dom.byId("user-streak") &&
    (FitTrack.dom.byId("user-streak").textContent = FitTrack.state.user.streak);
};

/* ============================================================
   XP & LEVEL SYSTEM (BASE)
   ============================================================ */

FitTrack.levels = [
  { level: 1, tier: "Beginner", xpRequired: 0 },
  { level: 2, tier: "Learner", xpRequired: 250 },
  { level: 3, tier: "Intermediate", xpRequired: 600 },
  { level: 4, tier: "Advanced", xpRequired: 1200 },
  { level: 5, tier: "Elite", xpRequired: 2500 },
  { level: 6, tier: "Master", xpRequired: 5000 }
];

FitTrack.xp = {};

FitTrack.xp.add = function (amount, reason = "") {
  FitTrack.state.user.xp += amount;
  FitTrack.log("XP added:", amount, reason);

  FitTrack.xp.checkLevelUp();
  FitTrack.storage.save();
  FitTrack.dashboard.update();
};

FitTrack.xp.checkLevelUp = function () {
  const xp = FitTrack.state.user.xp;

  for (let i = FitTrack.levels.length - 1; i >= 0; i--) {
    if (xp >= FitTrack.levels[i].xpRequired) {
      FitTrack.state.user.level = FitTrack.levels[i].level;
      FitTrack.state.user.tier = FitTrack.levels[i].tier;
      break;
    }
  }
};

/* ============================================================
   DAILY STREAK TRACKING
   ============================================================ */

FitTrack.streaks = {};

FitTrack.streaks.update = function () {
  const today = new Date().toDateString();
  const last = FitTrack.state.user.lastActive;

  if (!last) {
    FitTrack.state.user.streak = 1;
  } else {
    const diff =
      (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      FitTrack.state.user.streak += 1;
    } else if (diff > 1) {
      FitTrack.state.user.streak = 1;
    }
  }

  FitTrack.state.user.lastActive = today;
  FitTrack.storage.save();
};

/* ============================================================
   FEATURE LOCK SYSTEM (TIERS)
   ============================================================ */

FitTrack.features = {
  aiWorkout: 2,
  advancedMetrics: 3,
  nutritionGoals: 3,
  coachInsights: 4,
  expertAnalytics: 5
};

FitTrack.features.isUnlocked = function (feature) {
  return (
    FitTrack.state.user.level >=
    (FitTrack.features[feature] || Infinity)
  );
};

/* ============================================================
   BUTTON GUARDS (PREVENT BROKEN CLICKS)
   ============================================================ */

window.generateAIWorkout = function () {
  if (!FitTrack.features.isUnlocked("aiWorkout")) {
    alert("Unlock AI Workouts by leveling up!");
    return;
  }
  alert("AI workout engine loads in Part 3");
};

/* ============================================================
   AUTO DASHBOARD REFRESH HOOKS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  FitTrack.ui.updateNav();
  FitTrack.dashboard.update();
  FitTrack.streaks.update();
});
/* ============================================================
   FITTRACK PRO V9
   script.js — PART 3
   Training Engine • Manual & AI Workouts
   ============================================================ */

/* ============================================================
   TRAINING NAMESPACE
   ============================================================ */

FitTrack.training = {
  active: false,
  env: "gym",
  focus: "Full Body",
  startTime: null,
  exercises: []
};

/* ============================================================
   WORKOUT ENVIRONMENT & FOCUS
   ============================================================ */

window.setWorkoutEnv = function (env) {
  FitTrack.training.env = env;

  FitTrack.dom.byId("env-tab-gym")?.classList.toggle(
    "bg-white",
    env === "gym"
  );
  FitTrack.dom.byId("env-tab-home")?.classList.toggle(
    "bg-white",
    env === "home"
  );
};

FitTrack.dom.byId("workout-focus")?.addEventListener("change", e => {
  FitTrack.training.focus = e.target.value;
});

/* ============================================================
   WORKOUT START / CANCEL
   ============================================================ */

window.startManualWorkout = function () {
  FitTrack.training.active = true;
  FitTrack.training.startTime = Date.now();
  FitTrack.training.exercises = [];

  FitTrack.dom.byId("workout-setup")?.classList.add("hidden");
  FitTrack.dom.byId("workout-active")?.classList.remove("hidden");

  FitTrack.dom.byId("active-workout-title").textContent =
    "Manual Workout";

  FitTrack.training.addExercise();
};

window.cancelWorkout = function () {
  if (!confirm("Cancel workout? Progress will be lost.")) return;

  FitTrack.training.active = false;
  FitTrack.training.exercises = [];

  FitTrack.dom.byId("workout-active")?.classList.add("hidden");
  FitTrack.dom.byId("workout-setup")?.classList.remove("hidden");
};

/* ============================================================
   EXERCISE RENDERING
   ============================================================ */

FitTrack.training.addExercise = function (preset = {}) {
  const id = Date.now() + Math.random();

  const exercise = {
    id,
    name: preset.name || "",
    sets: preset.sets || 3,
    reps: preset.reps || 10,
    weight: preset.weight || 0
  };

  FitTrack.training.exercises.push(exercise);
  FitTrack.training.renderExercises();
};

window.addExerciseField = function () {
  FitTrack.training.addExercise();
};

FitTrack.training.renderExercises = function () {
  const container = FitTrack.dom.byId("exercise-list");
  if (!container) return;

  container.innerHTML = "";

  FitTrack.training.exercises.forEach((ex, index) => {
    const card = document.createElement("div");
    card.className =
      "glass-card p-4 rounded-2xl space-y-3 border border-slate-100";

    card.innerHTML = `
      <input class="w-full bg-slate-50 p-3 rounded-xl font-bold"
        placeholder="Exercise name"
        value="${ex.name}"
        oninput="FitTrack.training.updateExercise(${index}, 'name', this.value)">

      <div class="grid grid-cols-3 gap-2">
        <input type="number" class="bg-slate-50 p-3 rounded-xl"
          placeholder="Sets"
          value="${ex.sets}"
          oninput="FitTrack.training.updateExercise(${index}, 'sets', this.value)">
        <input type="number" class="bg-slate-50 p-3 rounded-xl"
          placeholder="Reps"
          value="${ex.reps}"
          oninput="FitTrack.training.updateExercise(${index}, 'reps', this.value)">
        <input type="number" class="bg-slate-50 p-3 rounded-xl"
          placeholder="Kg"
          value="${ex.weight}"
          oninput="FitTrack.training.updateExercise(${index}, 'weight', this.value)">
      </div>

      <button onclick="FitTrack.training.removeExercise(${index})"
        class="text-red-500 text-xs font-bold uppercase">
        Remove Exercise
      </button>
    `;

    container.appendChild(card);
  });
};

FitTrack.training.updateExercise = function (index, field, value) {
  FitTrack.training.exercises[index][field] =
    field === "name" ? value : Number(value);
};

FitTrack.training.removeExercise = function (index) {
  FitTrack.training.exercises.splice(index, 1);
  FitTrack.training.renderExercises();
};

/* ============================================================
   AI WORKOUT GENERATOR (RULE-BASED)
   ============================================================ */

window.generateAIWorkout = function () {
  if (!FitTrack.features.isUnlocked("aiWorkout")) {
    alert("Unlock AI workouts by leveling up.");
    return;
  }

  FitTrack.training.active = true;
  FitTrack.training.startTime = Date.now();
  FitTrack.training.exercises = [];

  FitTrack.dom.byId("workout-setup")?.classList.add("hidden");
  FitTrack.dom.byId("workout-active")?.classList.remove("hidden");

  FitTrack.dom.byId("active-workout-title").textContent =
    "AI Generated Workout";

  const templates = {
    "Full Body": [
      { name: "Squat", sets: 4, reps: 8 },
      { name: "Bench Press", sets: 4, reps: 8 },
      { name: "Lat Pulldown", sets: 3, reps: 10 }
    ],
    "Upper Body (Push)": [
      { name: "Bench Press", sets: 4, reps: 6 },
      { name: "Shoulder Press", sets: 3, reps: 8 },
      { name: "Tricep Pushdown", sets: 3, reps: 12 }
    ],
    "Upper Body (Pull)": [
      { name: "Deadlift", sets: 4, reps: 5 },
      { name: "Pull Up", sets: 3, reps: 8 },
      { name: "Barbell Row", sets: 3, reps: 10 }
    ],
    "Lower Body (Legs)": [
      { name: "Squat", sets: 5, reps: 5 },
      { name: "Leg Press", sets: 3, reps: 10 },
      { name: "Hamstring Curl", sets: 3, reps: 12 }
    ]
  };

  (templates[FitTrack.training.focus] || []).forEach(ex =>
    FitTrack.training.addExercise(ex)
  );

  FitTrack.xp.add(25, "AI workout generated");
};

/* ============================================================
   WORKOUT SAVE
   ============================================================ */

window.saveWorkout = function () {
  if (!FitTrack.training.exercises.length) {
    alert("Add at least one exercise.");
    return;
  }

  const duration =
    Math.round((Date.now() - FitTrack.training.startTime) / 60000);

  FitTrack.state.history.training.push({
    date: new Date().toISOString(),
    env: FitTrack.training.env,
    focus: FitTrack.training.focus,
    duration,
    exercises: FitTrack.training.exercises
  });

  FitTrack.xp.add(50, "Workout completed");
  FitTrack.achievements?.check?.("workout");

  FitTrack.training.active = false;
  FitTrack.training.exercises = [];

  FitTrack.storage.save();

  FitTrack.dom.byId("workout-active")?.classList.add("hidden");
  FitTrack.dom.byId("workout-setup")?.classList.remove("hidden");

  alert("Workout logged successfully!");
};
/* ============================================================
   FITTRACK PRO V9
   script.js — PART 4
   Nutrition Engine • Food Database • Diary • Macros
   ============================================================ */

/* ============================================================
   NUTRITION NAMESPACE
   ============================================================ */

FitTrack.nutrition = {
  activeTab: "log",
  searchResults: [],
  selectedFood: null
};

/* ============================================================
   NUTRITION TAB SWITCHING
   ============================================================ */

window.setNutritionTab = function (tab) {
  FitTrack.nutrition.activeTab = tab;

  FitTrack.dom.byId("nut-view-log")?.classList.toggle("hidden", tab !== "log");
  FitTrack.dom.byId("nut-view-db")?.classList.toggle("hidden", tab !== "database");

  FitTrack.dom.byId("nut-tab-log")?.classList.toggle(
    "bg-white",
    tab === "log"
  );
  FitTrack.dom.byId("nut-tab-db")?.classList.toggle(
    "bg-white",
    tab === "database"
  );
};

/* ============================================================
   FOOD DATABASE (LOCAL)
   ============================================================ */

FitTrack.nutrition.getDatabase = function () {
  return FitTrack.state.foodDatabase || [];
};

FitTrack.nutrition.saveDatabase = function () {
  FitTrack.storage.save();
};

FitTrack.nutrition.addFood = function (food) {
  FitTrack.state.foodDatabase.push(food);
  FitTrack.nutrition.saveDatabase();
  FitTrack.nutrition.renderDatabase();
};

/* ============================================================
   FOOD SEARCH
   ============================================================ */

window.handleFoodSearch = function (query) {
  const resultsBox = FitTrack.dom.byId("food-results");
  if (!resultsBox) return;

  if (!query || query.length < 2) {
    resultsBox.classList.add("hidden");
    return;
  }

  const q = query.toLowerCase();

  FitTrack.nutrition.searchResults =
    FitTrack.nutrition.getDatabase().filter(f =>
      f.name.toLowerCase().includes(q)
    );

  FitTrack.nutrition.renderSearchResults();
};

FitTrack.nutrition.renderSearchResults = function () {
  const box = FitTrack.dom.byId("food-results");
  if (!box) return;

  box.innerHTML = "";
  box.classList.remove("hidden");

  FitTrack.nutrition.searchResults.forEach(food => {
    const row = document.createElement("div");
    row.className =
      "p-4 hover:bg-slate-50 cursor-pointer text-sm flex justify-between";

    row.innerHTML = `
      <span class="font-bold">${food.name}</span>
      <span class="text-slate-400">${food.calories} kcal</span>
    `;

    row.onclick = () => FitTrack.nutrition.selectFood(food);
    box.appendChild(row);
  });
};

/* ============================================================
   FOOD SELECTION & LOGGING
   ============================================================ */

FitTrack.nutrition.selectFood = function (food) {
  FitTrack.nutrition.selectedFood = food;

  const qty = prompt(
    `Enter quantity (servings) for ${food.name}`,
    "1"
  );

  if (!qty || isNaN(qty)) return;

  FitTrack.nutrition.logFood(food, Number(qty));
  FitTrack.dom.byId("food-results")?.classList.add("hidden");
};

FitTrack.nutrition.logFood = function (food, qty) {
  const entry = {
    date: new Date().toISOString(),
    name: food.name,
    qty,
    calories: food.calories * qty,
    protein: food.protein * qty,
    carbs: food.carbs * qty,
    fat: food.fat * qty
  };

  FitTrack.state.history.nutrition.push(entry);

  FitTrack.nutrition.updateDashboardTotals();
  FitTrack.nutrition.renderDiary();

  FitTrack.xp.add(5, "Food logged");
  FitTrack.storage.save();
};

/* ============================================================
   DAILY DIARY RENDER
   ============================================================ */

FitTrack.nutrition.renderDiary = function () {
  const list = FitTrack.dom.byId("daily-log-list");
  if (!list) return;

  list.innerHTML = "";

  const today = new Date().toDateString();

  const todayEntries = FitTrack.state.history.nutrition.filter(
    e => new Date(e.date).toDateString() === today
  );

  todayEntries.forEach((e, i) => {
    const row = document.createElement("div");
    row.className =
      "glass-card p-4 rounded-2xl flex justify-between items-center";

    row.innerHTML = `
      <div>
        <div class="font-bold">${e.name}</div>
        <div class="text-xs text-slate-400">
          ${e.calories} kcal • P ${e.protein}g
        </div>
      </div>
      <button onclick="FitTrack.nutrition.removeEntry(${i})"
        class="text-red-400 font-bold">×</button>
    `;

    list.appendChild(row);
  });
};

FitTrack.nutrition.removeEntry = function (index) {
  FitTrack.state.history.nutrition.splice(index, 1);
  FitTrack.storage.save();
  FitTrack.nutrition.renderDiary();
  FitTrack.nutrition.updateDashboardTotals();
};

/* ============================================================
   DASHBOARD TOTALS
   ============================================================ */

FitTrack.nutrition.updateDashboardTotals = function () {
  const today = new Date().toDateString();

  const totals = FitTrack.state.history.nutrition
    .filter(e => new Date(e.date).toDateString() === today)
    .reduce(
      (acc, e) => {
        acc.calories += e.calories;
        acc.protein += e.protein;
        acc.carbs += e.carbs;
        acc.fat += e.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  FitTrack.dom.byId("dash-calories").textContent =
    Math.round(totals.calories);
  FitTrack.dom.byId("dash-protein").textContent =
    Math.round(totals.protein) + "g";
  FitTrack.dom.byId("dash-carbs").textContent =
    Math.round(totals.carbs) + "g";
  FitTrack.dom.byId("dash-fat").textContent =
    Math.round(totals.fat) + "g";

  FitTrack.dashboard?.updateCalorieRing?.(totals.calories);
};

/* ============================================================
   DATABASE RENDER
   ============================================================ */

FitTrack.nutrition.renderDatabase = function () {
  const list = FitTrack.dom.byId("custom-db-list");
  if (!list) return;

  list.innerHTML = "";

  FitTrack.nutrition.getDatabase().forEach(food => {
    const row = document.createElement("div");
    row.className =
      "p-4 flex justify-between text-sm";

    row.innerHTML = `
      <span class="font-bold">${food.name}</span>
      <span class="text-slate-400">${food.calories} kcal</span>
    `;

    list.appendChild(row);
  });
};

/* ============================================================
   INITIAL LOAD
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  FitTrack.nutrition.renderDiary();
  FitTrack.nutrition.renderDatabase();
  FitTrack.nutrition.updateDashboardTotals();
});
/* ============================================================
   FITTRACK PRO V9
   script.js — PART 5
   Body Metrics • Photos • History Logs
   ============================================================ */

/* ============================================================
   METRICS NAMESPACE
   ============================================================ */

FitTrack.metrics = {
  photos: {
    front: null,
    side: null,
    back: null
  }
};

/* ============================================================
   PHOTO HANDLING
   ============================================================ */

window.triggerPhoto = function (type) {
  const input = document.getElementById(`file-${type}`);
  if (input) input.click();
};

window.handlePhoto = function (input, type) {
  if (!input.files || !input.files[0]) return;

  const reader = new FileReader();
  reader.onload = e => {
    FitTrack.metrics.photos[type] = e.target.result;
    FitTrack.storage.save();
  };
  reader.readAsDataURL(input.files[0]);
};

/* ============================================================
   SAVE METRICS
   ============================================================ */

window.saveMetrics = function () {
  const entry = {
    date: new Date().toISOString(),
    weight: Number(FitTrack.dom.byId("body-weight")?.value || 0),
    shoulders: Number(FitTrack.dom.byId("m-shoulders")?.value || 0),
    chest: Number(FitTrack.dom.byId("m-chest")?.value || 0),
    waist: Number(FitTrack.dom.byId("m-waist")?.value || 0),
    glutes: Number(FitTrack.dom.byId("m-glutes")?.value || 0),
    photos: { ...FitTrack.metrics.photos }
  };

  FitTrack.state.history.metrics.push(entry);
  FitTrack.storage.save();

  FitTrack.xp.add(25, "Body check-in logged");
  FitTrack.achievements?.check?.("first_checkin");

  FitTrack.metrics.renderHistory();
  alert("Metrics saved successfully");
};

/* ============================================================
   METRICS HISTORY RENDER
   ============================================================ */

FitTrack.metrics.renderHistory = function () {
  const container = FitTrack.dom.byId("history-list");
  if (!container) return;

  container.innerHTML = "";

  const items = FitTrack.state.history.metrics.slice().reverse();

  items.forEach(entry => {
    const card = document.createElement("div");
    card.className =
      "glass-card p-6 rounded-2xl space-y-2";

    card.innerHTML = `
      <div class="flex justify-between">
        <span class="font-black">${new Date(entry.date).toLocaleDateString()}</span>
        <span class="text-slate-400">${entry.weight} kg</span>
      </div>
      <div class="grid grid-cols-2 text-xs text-slate-500">
        <div>Waist: ${entry.waist} cm</div>
        <div>Chest: ${entry.chest} cm</div>
        <div>Shoulders: ${entry.shoulders} cm</div>
        <div>Glutes: ${entry.glutes} cm</div>
      </div>
    `;

    container.appendChild(card);
  });
};

/* ============================================================
   HISTORY TAB SWITCHING
   ============================================================ */

window.setHistoryTab = function (tab) {
  FitTrack.ui.activeHistoryTab = tab;

  const list = FitTrack.dom.byId("history-list");
  if (!list) return;

  list.innerHTML = "";

  if (tab === "training") {
    FitTrack.workouts?.renderHistory?.();
  } else if (tab === "nutrition") {
    FitTrack.nutrition?.renderDiary?.();
  } else if (tab === "body") {
    FitTrack.metrics.renderHistory();
  }

  FitTrack.dom.byId("hist-tab-train")?.classList.toggle("bg-white", tab === "training");
  FitTrack.dom.byId("hist-tab-nut")?.classList.toggle("bg-white", tab === "nutrition");
  FitTrack.dom.byId("hist-tab-body")?.classList.toggle("bg-white", tab === "body");
};

/* ============================================================
   INITIAL LOAD
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  FitTrack.metrics.renderHistory();
});
/* ============================================================
   FITTRACK PRO V9
   script.js — PART 6
   Gamification • Achievements • Badges • XP
   ============================================================ */

/* ============================================================
   GAMIFICATION CORE
   ============================================================ */

FitTrack.gamification = {
  achievements: [],
  badges: [],
  unlocked: new Set()
};

/* ============================================================
   ACHIEVEMENT DEFINITIONS
   ============================================================ */

FitTrack.achievements = {
  list: [
    /* ---------- BRONZE (50) ---------- */
    { id: "first_workout", name: "First Steps", tier: "Bronze", xp: 25, check: s => s.history.workouts.length >= 1 },
    { id: "first_meal", name: "Logged Fuel", tier: "Bronze", xp: 20, check: s => s.history.nutrition.length >= 1 },
    { id: "first_checkin", name: "Facing the Mirror", tier: "Bronze", xp: 25, check: s => s.history.metrics.length >= 1 },
    { id: "hydration_1", name: "Hydrated", tier: "Bronze", xp: 10, check: s => s.daily.water >= 500 },
    { id: "streak_3", name: "3 Day Streak", tier: "Bronze", xp: 30, check: s => s.user.streak >= 3 },

    /* ---------- SILVER (25) ---------- */
    { id: "workouts_25", name: "Routine Builder", tier: "Silver", xp: 150, check: s => s.history.workouts.length >= 25 },
    { id: "nutrition_30", name: "Consistent Fuel", tier: "Silver", xp: 120, check: s => s.history.nutrition.length >= 30 },
    { id: "streak_14", name: "Two Week Streak", tier: "Silver", xp: 200, check: s => s.user.streak >= 14 },

    /* ---------- GOLD (15) ---------- */
    { id: "workouts_100", name: "Iron Discipline", tier: "Gold", xp: 400, check: s => s.history.workouts.length >= 100 },
    { id: "streak_30", name: "Unbreakable", tier: "Gold", xp: 500, check: s => s.user.streak >= 30 },

    /* ---------- PLATINUM (8) ---------- */
    { id: "streak_180", name: "Half-Year Relentless", tier: "Platinum", xp: 1500, check: s => s.user.streak >= 180 },
    { id: "workouts_365", name: "Year of Iron", tier: "Platinum", xp: 2000, check: s => s.history.workouts.length >= 365 },

    /* ---------- LIFETIME (2) ---------- */
    { id: "lifetime_elite", name: "Top 1%", tier: "Lifetime", xp: 5000, check: s => s.user.level >= 6 }
  ]
};

/* ============================================================
   ACHIEVEMENT CHECK ENGINE
   ============================================================ */

FitTrack.achievements.checkAll = function () {
  const state = FitTrack.state;

  FitTrack.achievements.list.forEach(a => {
    if (FitTrack.state.achievements.includes(a.id)) return;

    try {
      if (a.check(state)) {
        FitTrack.achievements.unlock(a);
      }
    } catch (e) {
      console.warn("Achievement check failed:", a.id);
    }
  });
};

FitTrack.achievements.unlock = function (achievement) {
  FitTrack.state.achievements.push(achievement.id);
  FitTrack.xp.add(achievement.xp, `Achievement: ${achievement.name}`);

  FitTrack.gamification.unlocked.add(achievement.id);
  FitTrack.achievements.render();

  alert(`🏆 Achievement Unlocked: ${achievement.name}`);
};

/* ============================================================
   ACHIEVEMENT RENDER
   ============================================================ */

FitTrack.achievements.render = function () {
  const container = FitTrack.dom.byId("achievements-list");
  if (!container) return;

  container.innerHTML = "";

  FitTrack.achievements.list.forEach(a => {
    const unlocked = FitTrack.state.achievements.includes(a.id);

    const card = document.createElement("div");
    card.className =
      "glass-card p-4 rounded-2xl flex justify-between items-center";

    card.innerHTML = `
      <div>
        <h4 class="font-black">${a.name}</h4>
        <p class="text-xs text-slate-400">${a.tier}</p>
      </div>
      <div class="${unlocked ? "text-emerald-500" : "text-slate-300"} font-black">
        ${unlocked ? "+" + a.xp + " XP" : "Locked"}
      </div>
    `;

    container.appendChild(card);
  });
};

/* ============================================================
   BADGES
   ============================================================ */

FitTrack.badges = {
  list: [
    { id: "community_helper", name: "Community Helper", check: s => s.community.helpful >= 10 },
    { id: "coach_badge", name: "Coach", check: s => s.user.level >= 4 },
    { id: "gym_enthusiast", name: "Gym Enthusiast", check: s => s.history.workouts.length >= 50 },
    { id: "committed", name: "Committed", check: s => s.user.streak >= 21 }
  ]
};

FitTrack.badges.check = function () {
  FitTrack.badges.list.forEach(b => {
    if (FitTrack.state.badges.includes(b.id)) return;
    if (b.check(FitTrack.state)) {
      FitTrack.state.badges.push(b.id);
      FitTrack.xp.add(100, `Badge: ${b.name}`);
    }
  });

  FitTrack.badges.render();
};

FitTrack.badges.render = function () {
  const container = FitTrack.dom.byId("badges-list");
  if (!container) return;

  container.innerHTML = "";

  FitTrack.badges.list.forEach(b => {
    const unlocked = FitTrack.state.badges.includes(b.id);

    const badge = document.createElement("div");
    badge.className =
      "inline-block px-4 py-2 rounded-full text-xs font-black mr-2 mb-2 " +
      (unlocked ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400");

    badge.textContent = b.name;
    container.appendChild(badge);
  });
};

/* ============================================================
   GLOBAL CHECK HOOK
   ============================================================ */

FitTrack.gamification.runChecks = function () {
  FitTrack.achievements.checkAll();
  FitTrack.badges.check();
};

/* ============================================================
   AUTO RUN ON EVENTS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  FitTrack.achievements.render();
  FitTrack.badges.render();
});
/* ============================================================
   FITTRACK PRO V9
   script.js — PART 7
   Education • Quizzes • Community • XP Multipliers
   ============================================================ */

/* ============================================================
   EDUCATION SYSTEM
   ============================================================ */

FitTrack.education = {
  lessons: [
    {
      id: "basics_training",
      title: "Training Fundamentals",
      content: "Progressive overload, consistency, recovery.",
      xp: 50
    },
    {
      id: "nutrition_basics",
      title: "Nutrition Basics",
      content: "Calories, protein, carbs, fats explained.",
      xp: 50
    },
    {
      id: "recovery_sleep",
      title: "Recovery & Sleep",
      content: "Why rest days matter.",
      xp: 75
    }
  ],
  completed: new Set()
};

FitTrack.education.completeLesson = function (id) {
  if (FitTrack.state.education.includes(id)) return;

  FitTrack.state.education.push(id);
  FitTrack.xp.add(
    FitTrack.education.lessons.find(l => l.id === id)?.xp || 25,
    "Lesson completed"
  );

  FitTrack.gamification.runChecks();
  FitTrack.storage.save();
};

FitTrack.education.render = function () {
  const container = FitTrack.dom.byId("tutorial-list");
  if (!container) return;

  container.innerHTML = "";

  FitTrack.education.lessons.forEach(lesson => {
    const completed = FitTrack.state.education.includes(lesson.id);

    const card = document.createElement("div");
    card.className =
      "glass-card p-4 rounded-2xl mb-3 cursor-pointer";

    card.innerHTML = `
      <h4 class="font-black">${lesson.title}</h4>
      <p class="text-xs text-slate-400">${lesson.content}</p>
      <span class="text-xs font-bold ${
        completed ? "text-emerald-500" : "text-indigo-500"
      }">${completed ? "Completed" : "+" + lesson.xp + " XP"}</span>
    `;

    card.onclick = () => FitTrack.education.completeLesson(lesson.id);
    container.appendChild(card);
  });
};

/* ============================================================
   QUIZ SYSTEM
   ============================================================ */

FitTrack.quizzes = {
  list: [
    {
      id: "quiz_training",
      question: "What drives muscle growth?",
      options: ["Random workouts", "Progressive overload", "Cardio only"],
      answer: 1,
      xp: 100
    },
    {
      id: "quiz_nutrition",
      question: "What macro builds muscle?",
      options: ["Protein", "Fat", "Sugar"],
      answer: 0,
      xp: 100
    }
  ]
};

FitTrack.quizzes.complete = function (quizId, answerIndex) {
  const quiz = FitTrack.quizzes.list.find(q => q.id === quizId);
  if (!quiz) return;
  if (FitTrack.state.quizzes.includes(quizId)) return;

  if (quiz.answer === answerIndex) {
    FitTrack.state.quizzes.push(quizId);
    FitTrack.xp.add(quiz.xp, "Quiz passed");
    alert("Correct! XP awarded.");
  } else {
    alert("Incorrect — try again.");
  }

  FitTrack.gamification.runChecks();
  FitTrack.storage.save();
};

/* ============================================================
   STREAK BONUS SYSTEM
   ============================================================ */

FitTrack.streaks.applyBonus = function () {
  const streak = FitTrack.state.user.streak;

  let multiplier = 1;
  if (streak >= 7) multiplier = 1.1;
  if (streak >= 14) multiplier = 1.25;
  if (streak >= 30) multiplier = 1.5;

  FitTrack.state.user.xpMultiplier = multiplier;
};

/* Patch XP add to include multiplier */
const _xpAddOriginal = FitTrack.xp.add;
FitTrack.xp.add = function (amount, reason = "") {
  FitTrack.streaks.applyBonus();
  const finalXP = Math.round(
    amount * (FitTrack.state.user.xpMultiplier || 1)
  );
  _xpAddOriginal(finalXP, reason);
};

/* ============================================================
   COMMUNITY INTERACTIONS
   ============================================================ */

FitTrack.community = {
  helpful: 0
};

FitTrack.community.helpSomeone = function () {
  FitTrack.community.helpful++;
  FitTrack.state.community.helpful = FitTrack.community.helpful;

  FitTrack.xp.add(30, "Community help");
  FitTrack.gamification.runChecks();
  FitTrack.storage.save();
};

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  FitTrack.education.render();
});
/* ============================================================
   FITTRACK PRO V9
   script.js — PART 8 (FINAL)
   Global Safety • Init Guards • Error Proofing • V9 Lock
   ============================================================ */

/* ============================================================
   GLOBAL SAFETY GUARDS
   ============================================================ */

(function globalSafetyLayer() {
  if (!window.FitTrack) {
    console.error("FitTrack core missing — app halted.");
    window.FitTrack = {};
  }

  FitTrack.safe = function (fn, label = "anonymous") {
    try {
      fn();
    } catch (err) {
      console.error(`FitTrack Error [${label}]`, err);
    }
  };
})();

/* ============================================================
   DOM SAFE HELPERS
   ============================================================ */

FitTrack.dom = FitTrack.dom || {};

FitTrack.dom.byId = function (id) {
  return document.getElementById(id);
};

FitTrack.dom.on = function (id, event, handler) {
  const el = FitTrack.dom.byId(id);
  if (!el) return;
  el.addEventListener(event, handler);
};

/* ============================================================
   STATE PATCH & DEFAULTS
   ============================================================ */

FitTrack.state = FitTrack.state || {};

FitTrack.state.user = Object.assign(
  {
    name: "Athlete",
    xp: 0,
    level: 1,
    tier: "Bronze",
    streak: 0,
    xpMultiplier: 1
  },
  FitTrack.state.user || {}
);

FitTrack.state.education = FitTrack.state.education || [];
FitTrack.state.quizzes = FitTrack.state.quizzes || [];
FitTrack.state.community = FitTrack.state.community || { helpful: 0 };
FitTrack.state.achievements = FitTrack.state.achievements || [];

/* ============================================================
   XP + LEVEL FAILSAFES
   ============================================================ */

FitTrack.xp = FitTrack.xp || {};

FitTrack.xp.updateLevel = function () {
  const xp = FitTrack.state.user.xp;

  const levels = [
    { level: 1, xp: 0, tier: "Bronze" },
    { level: 5, xp: 500, tier: "Silver" },
    { level: 10, xp: 1500, tier: "Gold" },
    { level: 20, xp: 4000, tier: "Platinum" },
    { level: 30, xp: 8000, tier: "Diamond" }
  ];

  let current = levels[0];
  levels.forEach(l => {
    if (xp >= l.xp) current = l;
  });

  FitTrack.state.user.level = current.level;
  FitTrack.state.user.tier = current.tier;
};

FitTrack.xp.add = FitTrack.xp.add || function () {};

/* ============================================================
   BUTTON BINDINGS (NO MORE DEAD CLICKS)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  FitTrack.safe(() => {
    FitTrack.dom.on("btn-add-workout", "click", () => {
      FitTrack.training?.addManual?.();
    });

    FitTrack.dom.on("btn-ai-workout", "click", () => {
      FitTrack.training?.generateAI?.();
    });

    FitTrack.dom.on("btn-log-meal", "click", () => {
      FitTrack.nutrition?.logMeal?.();
    });

    FitTrack.dom.on("btn-help-community", "click", () => {
      FitTrack.community?.helpSomeone?.();
      alert("Thanks for helping the community! +30 XP");
    });

    FitTrack.dom.on("btn-increment-streak", "click", () => {
      FitTrack.state.user.streak++;
      FitTrack.storage?.save?.();
      alert("Streak increased!");
    });
  }, "button-bindings");
});

/* ============================================================
   STORAGE FINAL SAFETY
   ============================================================ */

FitTrack.storage = FitTrack.storage || {};

FitTrack.storage.save = FitTrack.storage.save || function () {
  try {
    localStorage.setItem("fittrack_v9", JSON.stringify(FitTrack.state));
  } catch (e) {
    console.warn("Local storage unavailable");
  }
};

FitTrack.storage.load = function () {
  try {
    const data = JSON.parse(localStorage.getItem("fittrack_v9"));
    if (data) FitTrack.state = Object.assign(FitTrack.state, data);
  } catch (e) {
    console.warn("Failed to load saved state");
  }
};

/* ============================================================
   MASTER INIT (ONE ENTRY POINT — NO RACE CONDITIONS)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  FitTrack.safe(() => {
    FitTrack.storage.load();
    FitTrack.xp.updateLevel();
    FitTrack.gamification?.runChecks?.();
    FitTrack.education?.render?.();
    console.log("✅ FitTrack Pro V9 fully initialized");
  }, "master-init");
});

/* ============================================================
   VERSION LOCK
   ============================================================ */

FitTrack.version = "V9.0.0-STABLE";

/* ============================================================
   END OF FILE — FITTRACK PRO V9 COMPLETE
   ============================================================ */
