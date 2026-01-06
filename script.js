/*****************************************************
 * FITTRACK PRO V9
 * PART 1 / 5 — CORE FOUNDATION
 * -----------------------------------
 * - App State
 * - Persistence
 * - Navigation
 * - User Profile
 * - XP & Level Core
 * - Dashboard Base
 *****************************************************/

/* ===================================================
   GLOBAL CONSTANTS
=================================================== */

const APP_VERSION = "9.0.0";
const STORAGE_KEY = "fittrack_pro_v9";

/* ===================================================
   LEVEL & TIER SYSTEM
=================================================== */

const LEVEL_TIERS = [
  { tier: "Beginner", minLevel: 1, unlocks: ["manual_workouts"] },
  { tier: "Intermediate", minLevel: 5, unlocks: ["ai_workouts", "meal_builder"] },
  { tier: "Advanced", minLevel: 10, unlocks: ["analytics", "core_finishers"] },
  { tier: "Elite", minLevel: 20, unlocks: ["program_templates", "coach_features"] },
  { tier: "Legend", minLevel: 35, unlocks: ["everything"] }
];

function xpForNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.25));
}

/* ===================================================
   DEFAULT APP STATE
=================================================== */

const DEFAULT_STATE = {
  meta: {
    version: APP_VERSION,
    firstLaunch: Date.now()
  },

  ui: {
    activeTab: "dashboard",
    nutritionTab: "log",
    metricsTab: "checkin",
    historyTab: "training"
  },

  user: {
    name: "Athlete",
    level: 1,
    xp: 0,
    tier: "Beginner",
    streak: 0,
    lastActiveDate: null
  },

  stats: {
    totalWorkouts: 0,
    totalMealsLogged: 0,
    totalCaloriesLogged: 0,
    totalProteinLogged: 0
  },

  goals: {
    calories: 2500,
    water: 2500
  },

  hydration: {
    daily: {}
  },

  workouts: {
    history: [],
    active: null
  },

  nutrition: {
    dailyMeals: [],
    archive: [],
    customFoodDb: []
  },

  metrics: {
    history: [],
    currentPhotos: {
      front: null,
      side: null,
      back: null
    }
  },

  gamification: {
    unlockedFeatures: [],
    achievements: {},
    badges: {}
  }
};

/* ===================================================
   APP STATE (LIVE)
=================================================== */

let state = structuredClone(DEFAULT_STATE);

/* ===================================================
   PERSISTENCE
=================================================== */

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);

    // Defensive merge
    state = {
      ...DEFAULT_STATE,
      ...parsed,
      meta: {
        ...DEFAULT_STATE.meta,
        ...parsed.meta
      }
    };

  } catch (err) {
    console.error("Failed to load state:", err);
    state = structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save state:", err);
  }
}

/* ===================================================
   DATE HELPERS
=================================================== */

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function isSameDay(a, b) {
  return a === b;
}

/* ===================================================
   XP & LEVEL ENGINE (CORE)
=================================================== */

function addXP(amount, reason = "activity") {
  if (!Number.isFinite(amount) || amount <= 0) return;

  state.user.xp += amount;

  let leveledUp = false;

  while (state.user.xp >= xpForNextLevel(state.user.level)) {
    state.user.xp -= xpForNextLevel(state.user.level);
    state.user.level++;
    leveledUp = true;
  }

  if (leveledUp) {
    updateUserTier();
  }

  saveState();
  renderDashboard();
}

function updateUserTier() {
  let currentTier = LEVEL_TIERS[0];

  for (const tier of LEVEL_TIERS) {
    if (state.user.level >= tier.minLevel) {
      currentTier = tier;
    }
  }

  state.user.tier = currentTier.tier;
  state.gamification.unlockedFeatures = currentTier.unlocks;
}

/* ===================================================
   STREAK TRACKING
=================================================== */

function updateDailyStreak() {
  const today = todayISO();

  if (!state.user.lastActiveDate) {
    state.user.streak = 1;
  } else {
    const last = state.user.lastActiveDate;

    const diff =
      (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      state.user.streak++;
      addXP(10, "daily_streak");
    } else if (diff > 1) {
      state.user.streak = 1;
    }
  }

  state.user.lastActiveDate = today;
}

/* ===================================================
   NAVIGATION
=================================================== */

function switchTab(tabId) {
  state.ui.activeTab = tabId;

  document.querySelectorAll(".tab-content").forEach(el => {
    el.classList.add("hidden");
    el.classList.remove("active");
  });

  const active = document.getElementById(tabId);
  if (active) {
    active.classList.remove("hidden");
    active.classList.add("active");
  }

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.tab === tabId
    );
  });

  saveState();

  // Lazy rendering hooks
  if (tabId === "dashboard") renderDashboard();
  if (tabId === "achievements") renderAchievements?.();
}

/* ===================================================
   DASHBOARD RENDERING (BASE)
=================================================== */

function renderDashboard() {
  const today = todayISO();
  const mealsToday = state.nutrition.dailyMeals.filter(m => m.date === today);

  const calories = mealsToday.reduce((a, b) => a + Number(b.calories || 0), 0);
  const protein = mealsToday.reduce((a, b) => a + Number(b.protein || 0), 0);

  setText("dash-calories", Math.round(calories));
  setText("dash-protein", protein + "g");
  setText("dash-carbs", Math.round((calories * 0.4) / 4) + "g");
  setText("dash-fat", Math.round((calories * 0.3) / 9) + "g");

  const water = state.hydration.daily[today] || 0;
  setText(
    "water-count",
    `${(water / 1000).toFixed(1)}L`
  );

  setText("user-tier", state.user.tier);
  setText("user-xp", state.user.xp);
  setText("user-streak", state.user.streak);
}

/* ===================================================
   DOM HELPERS
=================================================== */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

/* ===================================================
   WATER TRACKING (BASE)
=================================================== */

function updateWater(amount) {
  const today = todayISO();
  state.hydration.daily[today] =
    Math.max(0, (state.hydration.daily[today] || 0) + amount);

  addXP(2, "hydration");
  saveState();
  renderDashboard();
}

/* ===================================================
   BOOTSTRAP
=================================================== */

window.addEventListener("load", () => {
  loadState();
  updateDailyStreak();
  updateUserTier();
  renderDashboard();
  saveState();
});
/*****************************************************
 * FITTRACK PRO V9
 * PART 2 / 5 — WORKOUT ENGINE + AI COACH
 *****************************************************/

/* ===================================================
   EXERCISE DATABASE
=================================================== */

const EXERCISE_DB = {
  chest: [
    { id: "bench_press", name: "Bench Press", type: "compound" },
    { id: "incline_db_press", name: "Incline DB Press", type: "compound" },
    { id: "chest_fly", name: "Chest Fly", type: "isolation" }
  ],
  back: [
    { id: "deadlift", name: "Deadlift", type: "compound" },
    { id: "lat_pulldown", name: "Lat Pulldown", type: "compound" },
    { id: "seated_row", name: "Seated Row", type: "compound" }
  ],
  legs: [
    { id: "squat", name: "Squat", type: "compound" },
    { id: "leg_press", name: "Leg Press", type: "compound" },
    { id: "leg_curl", name: "Leg Curl", type: "isolation" }
  ],
  shoulders: [
    { id: "ohp", name: "Overhead Press", type: "compound" },
    { id: "lateral_raise", name: "Lateral Raise", type: "isolation" }
  ],
  arms: [
    { id: "barbell_curl", name: "Barbell Curl", type: "isolation" },
    { id: "tricep_pushdown", name: "Tricep Pushdown", type: "isolation" }
  ],
  core: [
    { id: "plank", name: "Plank", type: "core" },
    { id: "hanging_leg_raise", name: "Hanging Leg Raise", type: "core" }
  ],
  cardio: [
    { id: "treadmill", name: "Treadmill", type: "cardio" },
    { id: "bike", name: "Stationary Bike", type: "cardio" }
  ]
};

/* ===================================================
   ACTIVE WORKOUT STRUCTURE
=================================================== */

function startWorkout(mode = "manual", focus = null) {
  state.workouts.active = {
    id: crypto.randomUUID(),
    mode,
    focus,
    startTime: Date.now(),
    exercises: [],
    finishers: [],
    notes: ""
  };

  saveState();
  renderActiveWorkout();
}

/* ===================================================
   MANUAL WORKOUT BUILDER
=================================================== */

function addExerciseToWorkout(category, exerciseId) {
  if (!state.workouts.active) return;

  const exercise = EXERCISE_DB[category].find(e => e.id === exerciseId);
  if (!exercise) return;

  state.workouts.active.exercises.push({
    ...exercise,
    sets: []
  });

  saveState();
  renderActiveWorkout();
}

function addSet(exerciseIndex, reps = 10, weight = 0, rpe = 7) {
  const ex = state.workouts.active?.exercises[exerciseIndex];
  if (!ex) return;

  ex.sets.push({
    reps,
    weight,
    rpe
  });

  saveState();
  renderActiveWorkout();
}

/* ===================================================
   CARDIO & CORE FINISHERS
=================================================== */

function addFinisher(type, durationMinutes) {
  if (!state.workouts.active) return;

  state.workouts.active.finishers.push({
    type,
    duration: durationMinutes
  });

  saveState();
}

/* ===================================================
   AI COACH WORKOUT GENERATION
=================================================== */

function generateAIWorkout(goal = "hypertrophy") {
  const templates = {
    hypertrophy: ["chest", "back", "legs"],
    strength: ["legs", "back", "chest"],
    fatloss: ["full"]
  };

  const focusAreas = templates[goal] || ["full"];

  startWorkout("ai", goal);

  focusAreas.forEach(area => {
    const group =
      area === "full"
        ? Object.values(EXERCISE_DB).flat()
        : EXERCISE_DB[area];

    const picks = group
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    picks.forEach(ex =>
      state.workouts.active.exercises.push({
        ...ex,
        sets: [
          { reps: 10, weight: 0, rpe: 7 },
          { reps: 10, weight: 0, rpe: 8 }
        ]
      })
    );
  });

  addFinisher("cardio", 10);
  addFinisher("core", 8);

  saveState();
  renderActiveWorkout();
}

/* ===================================================
   WORKOUT TIMER
=================================================== */

let workoutTimerInterval = null;

function startWorkoutTimer() {
  if (workoutTimerInterval) return;

  workoutTimerInterval = setInterval(() => {
    renderWorkoutTimer();
  }, 1000);
}

function stopWorkoutTimer() {
  clearInterval(workoutTimerInterval);
  workoutTimerInterval = null;
}

function renderWorkoutTimer() {
  if (!state.workouts.active) return;

  const elapsed =
    Math.floor((Date.now() - state.workouts.active.startTime) / 1000);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  setText("workout-timer", `${mins}:${secs.toString().padStart(2, "0")}`);
}

/* ===================================================
   VOLUME & INTENSITY CALCULATION
=================================================== */

function calculateWorkoutVolume(workout) {
  let volume = 0;

  workout.exercises.forEach(ex => {
    ex.sets.forEach(set => {
      volume += set.reps * set.weight;
    });
  });

  return volume;
}

function averageRPE(workout) {
  let total = 0;
  let count = 0;

  workout.exercises.forEach(ex => {
    ex.sets.forEach(set => {
      total += set.rpe;
      count++;
    });
  });

  return count ? (total / count).toFixed(1) : 0;
}

/* ===================================================
   COMPLETE WORKOUT
=================================================== */

function finishWorkout() {
  const workout = state.workouts.active;
  if (!workout) return;

  workout.endTime = Date.now();
  workout.durationMinutes = Math.round(
    (workout.endTime - workout.startTime) / 60000
  );

  workout.volume = calculateWorkoutVolume(workout);
  workout.avgRPE = averageRPE(workout);

  state.workouts.history.push(workout);
  state.workouts.active = null;

  state.stats.totalWorkouts++;

  // XP REWARD ENGINE
  let xpEarned = 50;
  xpEarned += Math.floor(workout.volume / 500);
  xpEarned += workout.durationMinutes;

  addXP(xpEarned, "workout_complete");

  stopWorkoutTimer();
  saveState();
  renderDashboard();
}

/* ===================================================
   RENDER ACTIVE WORKOUT (BASIC)
=================================================== */

function renderActiveWorkout() {
  const container = document.getElementById("active-workout");
  if (!container || !state.workouts.active) return;

  container.innerHTML = `
    <h3>${state.workouts.active.mode.toUpperCase()} WORKOUT</h3>
    <div id="workout-timer">0:00</div>
    <p>Exercises: ${state.workouts.active.exercises.length}</p>
  `;

  startWorkoutTimer();
}
/*****************************************************
 * FITTRACK PRO V9
 * PART 3 / 5 — NUTRITION SYSTEM + ANALYTICS
 *****************************************************/

/* ===================================================
   NUTRITION DATA STRUCTURES
=================================================== */

if (!state.nutrition) {
  state.nutrition = {
    diary: {},
    database: [],
    meals: [],
    archivedDays: []
  };
}

/* ===================================================
   FOOD DATABASE MANAGEMENT
=================================================== */

function saveToDatabase() {
  const name = document.getElementById("form-name").value.trim();
  const cals = +document.getElementById("form-cals").value;
  const protein = +document.getElementById("form-prot").value;

  if (!name || !cals) return alert("Missing values");

  state.nutrition.database.push({
    id: crypto.randomUUID(),
    name,
    calories: cals,
    protein,
    carbs: 0,
    fat: 0
  });

  saveState();
  renderFoodDatabase();
}

function renderFoodDatabase() {
  const list = document.getElementById("custom-db-list");
  if (!list) return;

  list.innerHTML = "";
  state.nutrition.database.forEach(item => {
    list.innerHTML += `
      <div class="food-db-item">
        <strong>${item.name}</strong>
        <span>${item.calories} kcal</span>
      </div>
    `;
  });
}

/* ===================================================
   FOOD SEARCH & LOGGING
=================================================== */

function handleFoodSearch(query) {
  const results = document.getElementById("food-results");
  if (!results) return;

  results.innerHTML = "";
  if (!query) return;

  const matches = state.nutrition.database.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  matches.forEach(food => {
    const div = document.createElement("div");
    div.className = "food-result";
    div.textContent = `${food.name} (${food.calories} kcal)`;
    div.onclick = () => openPortionModal(food);
    results.appendChild(div);
  });
}

/* ===================================================
   PORTION SYSTEM
=================================================== */

let portionContext = null;
let portionMode = "unit";

function openPortionModal(food) {
  portionContext = food;
  setText("portion-item-name", food.name);
  document.getElementById("portion-modal").classList.remove("hidden");
}

function closePortionModal() {
  portionContext = null;
  document.getElementById("portion-modal").classList.add("hidden");
}

function setPortionMode(mode) {
  portionMode = mode;
}

function adjustPortionQty(delta) {
  const input = document.getElementById("portion-qty-input");
  input.value = Math.max(1, +input.value + delta);
}

function confirmLogPortion() {
  if (!portionContext) return;

  const qty = +document.getElementById("portion-qty-input").value;
  const today = getTodayKey();

  if (!state.nutrition.diary[today]) {
    state.nutrition.diary[today] = [];
  }

  state.nutrition.diary[today].push({
    ...portionContext,
    qty,
    mode: portionMode,
    timestamp: Date.now()
  });

  addXP(5 * qty, "nutrition_log");

  saveState();
  closePortionModal();
  renderDailyLog();
}

/* ===================================================
   DAILY NUTRITION LOG
=================================================== */

function renderDailyLog() {
  const today = getTodayKey();
  const list = document.getElementById("daily-log-list");
  if (!list) return;

  list.innerHTML = "";

  const entries = state.nutrition.diary[today] || [];
  let totals = { calories: 0, protein: 0 };

  entries.forEach(entry => {
    totals.calories += entry.calories * entry.qty;
    totals.protein += entry.protein * entry.qty;

    list.innerHTML += `
      <div class="log-item">
        ${entry.name} × ${entry.qty}
      </div>
    `;
  });

  setText("total-day-cals", `${totals.calories} kcal`);
  setText("total-day-prot", `${totals.protein}g Protein`);

  document
    .getElementById("daily-totals-card")
    ?.classList.toggle("hidden", entries.length === 0);

  evaluateNutritionCompliance(totals);
}

/* ===================================================
   ARCHIVE DAY
=================================================== */

function archiveDailyNutrition() {
  const today = getTodayKey();
  const data = state.nutrition.diary[today];
  if (!data) return;

  state.nutrition.archivedDays.push({
    date: today,
    entries: data
  });

  delete state.nutrition.diary[today];

  addXP(50, "nutrition_archive");
  updateStreak("nutrition");

  saveState();
  renderDailyLog();
}

/* ===================================================
   MEAL BUILDER
=================================================== */

let mealBuilder = [];

function handleMealSearch(query) {
  const results = document.getElementById("meal-search-results");
  if (!results) return;

  results.innerHTML = "";
  if (!query) return;

  state.nutrition.database
    .filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    .forEach(food => {
      const div = document.createElement("div");
      div.textContent = food.name;
      div.onclick = () => addMealIngredient(food);
      results.appendChild(div);
    });
}

function addMealIngredient(food) {
  mealBuilder.push({ ...food, qty: 1 });
  renderMealBuilder();
}

function renderMealBuilder() {
  const list = document.getElementById("meal-builder-list");
  if (!list) return;

  list.innerHTML = "";
  let cals = 0;
  let protein = 0;

  mealBuilder.forEach(item => {
    cals += item.calories * item.qty;
    protein += item.protein * item.qty;

    list.innerHTML += `
      <div>${item.name} × ${item.qty}</div>
    `;
  });

  setText("meal-builder-stats", `${cals} kcal • ${protein}g Protein`);
}

function saveMealToInventory() {
  const name = document.getElementById("meal-builder-name").value.trim();
  if (!name || mealBuilder.length === 0) return;

  state.nutrition.meals.push({
    id: crypto.randomUUID(),
    name,
    items: mealBuilder
  });

  mealBuilder = [];
  addXP(100, "meal_created");
  saveState();
  closeMealModal();
}

/* ===================================================
   COMPLIANCE & ANALYTICS
=================================================== */

function evaluateNutritionCompliance(totals) {
  const proteinTarget = 120;
  const calorieTarget = 2200;

  let score = 0;
  if (totals.protein >= proteinTarget) score += 50;
  if (totals.calories <= calorieTarget + 200) score += 50;

  if (score >= 80) {
    addXP(20, "nutrition_compliance");
  }
}

/* ===================================================
   UTILITIES
=================================================== */

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

/* ===================================================
   INIT
=================================================== */

renderFoodDatabase();
renderDailyLog();
/*****************************************************
 * FITTRACK PRO V9
 * PART 4 / 5 — GAMIFICATION ENGINE
 *****************************************************/

/* ===================================================
   CORE GAMIFICATION STATE
=================================================== */

if (!state.gamification) {
  state.gamification = {
    xp: 0,
    level: 1,
    tier: "Beginner",
    achievements: {},
    badges: {},
    streaks: {
      workout: 0,
      nutrition: 0,
      app: 0
    },
    lastAction: {}
  };
}

/* ===================================================
   XP & LEVEL CURVE
=================================================== */

const LEVEL_XP_CURVE = level =>
  Math.floor(100 * Math.pow(level, 1.5));

function addXP(amount, reason = "") {
  const now = Date.now();

  // Anti-farming (same action spam)
  if (state.gamification.lastAction[reason]) {
    if (now - state.gamification.lastAction[reason] < 5000) return;
  }

  state.gamification.lastAction[reason] = now;
  state.gamification.xp += amount;

  while (state.gamification.xp >= LEVEL_XP_CURVE(state.gamification.level)) {
    state.gamification.xp -= LEVEL_XP_CURVE(state.gamification.level);
    state.gamification.level++;
    evaluateTier();
  }

  updateGamificationUI();
  saveState();
}

/* ===================================================
   TIERS & FEATURE UNLOCKS
=================================================== */

const TIERS = [
  { name: "Beginner", level: 1 },
  { name: "Intermediate", level: 10 },
  { name: "Advanced", level: 25 },
  { name: "Elite", level: 50 },
  { name: "Master", level: 100 }
];

function evaluateTier() {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (state.gamification.level >= TIERS[i].level) {
      state.gamification.tier = TIERS[i].name;
      break;
    }
  }
}

/* ===================================================
   FEATURE LOCK SYSTEM
=================================================== */

const FEATURE_UNLOCKS = {
  aiWorkouts: "Intermediate",
  analytics: "Advanced",
  coachingTools: "Elite",
  customPrograms: "Master"
};

function isFeatureUnlocked(feature) {
  const tierOrder = TIERS.map(t => t.name);
  return (
    tierOrder.indexOf(state.gamification.tier) >=
    tierOrder.indexOf(FEATURE_UNLOCKS[feature])
  );
}

/* ===================================================
   ACHIEVEMENT DEFINITIONS
=================================================== */

const ACHIEVEMENT_TIERS = {
  bronze: { xp: 25 },
  silver: { xp: 75 },
  gold: { xp: 200 },
  platinum: { xp: 500 },
  lifetime: { xp: 2000 }
};

const achievements = [];

/* -------- Bronze (50) -------- */
for (let i = 1; i <= 50; i++) {
  achievements.push({
    id: `bronze_${i}`,
    name: `Getting Started ${i}`,
    tier: "bronze",
    condition: s => s.stats?.workouts >= i
  });
}

/* -------- Silver (25) -------- */
for (let i = 1; i <= 25; i++) {
  achievements.push({
    id: `silver_${i}`,
    name: `Consistency ${i * 5} Days`,
    tier: "silver",
    condition: s => s.gamification.streaks.workout >= i * 5
  });
}

/* -------- Gold (15) -------- */
for (let i = 1; i <= 15; i++) {
  achievements.push({
    id: `gold_${i}`,
    name: `Elite Performer ${i}`,
    tier: "gold",
    condition: s => s.stats?.totalVolume >= i * 10000
  });
}

/* -------- Platinum (8) -------- */
for (let i = 1; i <= 8; i++) {
  achievements.push({
    id: `platinum_${i}`,
    name: `Year of Discipline ${i}`,
    tier: "platinum",
    condition: s => s.stats?.daysTracked >= i * 90
  });
}

/* -------- Lifetime (2) -------- */
achievements.push(
  {
    id: "lifetime_1",
    name: "FitTrack Legend",
    tier: "lifetime",
    condition: s => s.gamification.level >= 150
  },
  {
    id: "lifetime_2",
    name: "Top 1%",
    tier: "lifetime",
    condition: s => s.stats?.workouts >= 1000
  }
);

/* ===================================================
   ACHIEVEMENT EVALUATION
=================================================== */

function evaluateAchievements() {
  achievements.forEach(a => {
    if (state.gamification.achievements[a.id]) return;
    if (a.condition(state)) {
      unlockAchievement(a);
    }
  });
}

function unlockAchievement(achievement) {
  state.gamification.achievements[achievement.id] = true;
  addXP(ACHIEVEMENT_TIERS[achievement.tier].xp, "achievement");
  renderAchievements();
}

/* ===================================================
   BADGES SYSTEM
=================================================== */

const BADGES = {
  community: {
    name: "Community Helper",
    condition: s => s.stats?.communityPosts >= 10
  },
  coach: {
    name: "Coach Badge",
    condition: s => s.stats?.clientsCoached >= 1
  },
  gym: {
    name: "Gym Enthusiast",
    condition: s => s.stats?.gymWorkouts >= 50
  },
  committed: {
    name: "Committed",
    condition: s => s.gamification.streaks.app >= 30
  }
};

function evaluateBadges() {
  Object.entries(BADGES).forEach(([id, badge]) => {
    if (state.gamification.badges[id]) return;
    if (badge.condition(state)) {
      state.gamification.badges[id] = true;
      addXP(100, "badge");
    }
  });
}

/* ===================================================
   STREAK TRACKING
=================================================== */

function updateStreak(type) {
  state.gamification.streaks[type]++;
  addXP(10, "streak");
}

/* ===================================================
   UI RENDERING
=================================================== */

function updateGamificationUI() {
  setText("user-xp", state.gamification.xp);
  setText("user-tier", state.gamification.tier);
}

function renderAchievements() {
  const list = document.getElementById("achievements-list");
  if (!list) return;

  list.innerHTML = "";
  achievements.forEach(a => {
    const unlocked = state.gamification.achievements[a.id];
    list.innerHTML += `
      <div class="achievement ${a.tier} ${unlocked ? "unlocked" : "locked"}">
        ${a.name}
      </div>
    `;
  });
}

function renderBadges() {
  const list = document.getElementById("badges-list");
  if (!list) return;

  list.innerHTML = "";
  Object.entries(BADGES).forEach(([id, badge]) => {
    if (state.gamification.badges[id]) {
      list.innerHTML += `<div class="badge">${badge.name}</div>`;
    }
  });
}

/* ===================================================
   PERIODIC EVALUATION HOOK
=================================================== */

setInterval(() => {
  evaluateAchievements();
  evaluateBadges();
}, 5000);

/* ===================================================
   INIT
=================================================== */

evaluateTier();
renderAchievements();
renderBadges();
updateGamificationUI();
/*****************************************************
 * FITTRACK PRO V9
 * PART 5 / 5 — AI COACH + ANALYTICS + OFFLINE
 *****************************************************/

/* ===================================================
   VERSIONING
=================================================== */

const APP_VERSION = "9.0.0";
if (!state.app) state.app = {};
state.app.version = APP_VERSION;

/* ===================================================
   AI COACH — WORKOUT GENERATION
=================================================== */

function generateAIWorkout() {
  if (!isFeatureUnlocked("aiWorkouts")) {
    alert("Unlock AI Workouts at Intermediate Tier");
    return;
  }

  const focus = document.getElementById("workout-focus")?.value || "Full Body";
  const env = state.workout?.environment || "gym";

  const exercises = getExercisesByFocus(focus, env);
  const programmed = exercises.map(ex => ({
    name: ex,
    sets: calculateSets(),
    reps: calculateReps(),
    load: calculateLoad(ex)
  }));

  startWorkoutSession("AI Generated Workout", programmed);
  addXP(75, "ai_workout");
}

/* ===================================================
   EXERCISE LOGIC
=================================================== */

function getExercisesByFocus(focus, env) {
  const base = {
    "Full Body": ["Squat", "Bench Press", "Row"],
    "Upper Body": ["Bench Press", "Pull Up", "Shoulder Press"],
    "Lower Body/Legs": ["Squat", "RDL", "Lunge"],
    "Specific Muscle": ["Isolation Movement"]
  };

  return base[focus] || base["Full Body"];
}

function calculateSets() {
  return state.gamification.level < 10 ? 3 : 4;
}

function calculateReps() {
  return state.gamification.level < 25 ? "8–10" : "6–8";
}

function calculateLoad(exercise) {
  const history = state.stats?.exerciseHistory?.[exercise];
  if (!history) return "Moderate";
  return history.lastLoad * 1.025;
}

/* ===================================================
   PROGRESSION & DELOAD
=================================================== */

function evaluateProgression() {
  const fatigue = state.stats?.fatigueScore || 0;

  if (fatigue > 80) {
    applyDeload();
  }
}

function applyDeload() {
  state.stats.deloadActive = true;
  addXP(30, "smart_recovery");
}

function clearDeload() {
  state.stats.deloadActive = false;
}

/* ===================================================
   RECOVERY & READINESS
=================================================== */

function calculateReadiness() {
  const sleep = state.stats?.sleep || 7;
  const soreness = state.stats?.soreness || 3;

  return Math.max(0, Math.min(100, sleep * 10 - soreness * 5));
}

/* ===================================================
   GOAL-BASED NUTRITION AI
=================================================== */

function suggestNutritionGoal() {
  const goal = state.user?.goal || "maintenance";

  switch (goal) {
    case "fat_loss":
      return { calories: 2000, protein: 140 };
    case "muscle_gain":
      return { calories: 2600, protein: 180 };
    default:
      return { calories: 2200, protein: 150 };
  }
}

/* ===================================================
   ANALYTICS DATA (CHART READY)
=================================================== */

function buildWorkoutVolumeSeries() {
  return state.history?.workouts?.map(w => ({
    date: w.date,
    volume: w.totalVolume
  })) || [];
}

function buildWeightTrend() {
  return state.metrics?.logs?.map(m => ({
    date: m.date,
    weight: m.weight
  })) || [];
}

function buildNutritionComplianceSeries() {
  return state.nutrition.archivedDays.map(d => ({
    date: d.date,
    compliance: d.complianceScore || 0
  }));
}

/* ===================================================
   OFFLINE-FIRST & PWA HOOKS
=================================================== */

window.addEventListener("offline", () => {
  console.warn("Offline mode enabled");
});

window.addEventListener("online", () => {
  console.info("Back online — syncing ready");
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .catch(() => console.warn("SW registration failed"));
}

/* ===================================================
   SAFE GUARDS & DEFENSIVE CHECKS
=================================================== */

function safeGet(path, fallback = null) {
  try {
    return path();
  } catch {
    return fallback;
  }
}

/* ===================================================
   FINAL INIT PIPELINE
=================================================== */

function initV9() {
  evaluateTier();
  evaluateAchievements();
  evaluateBadges();
  evaluateProgression();
  updateGamificationUI();
  renderDailyLog();
}

document.addEventListener("DOMContentLoaded", initV9);
