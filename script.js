// ==============================
// FitTrack Pro V9 - Global-Safe JS
// ==============================

// Debug: Confirm script loaded
console.log("FitTrack Pro V9 JS loaded");

// ==============================
// Global variables
// ==============================
window.appState = {
  activeTab: "dashboard",
  workouts: [],
  currentWorkout: null,
  nutritionLog: [],
  customDatabase: [],
  metrics: [],
  achievements: [],
  streak: 0,
  xp: 0,
  tier: "Beginner",
  water: 0,
  timerInterval: null,
  workoutTimer: 0,
  portionMode: "grams",
};

// ==============================
// Global Helper Functions
// ==============================
window.$ = (selector) => document.querySelector(selector);
window.$$ = (selector) => document.querySelectorAll(selector);

window.addClass = (el, cls) => el?.classList.add(cls);
window.removeClass = (el, cls) => el?.classList.remove(cls);
window.toggleClass = (el, cls) => el?.classList.toggle(cls);

window.formatTime = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// ==============================
// Tab Switching
// ==============================
window.switchTab = function (tabId) {
  console.log("Switching tab to:", tabId);
  const tabs = $$(".tab-content");
  tabs.forEach((tab) => {
    addClass(tab, "hidden");
    removeClass(tab, "active");
  });

  const activeTab = $(`#${tabId}`);
  if (!activeTab) return;

  removeClass(activeTab, "hidden");
  addClass(activeTab, "active");

  appState.activeTab = tabId;
};

// ==============================
// Initialize App
// ==============================
function initApp() {
  console.log("Initializing FitTrack Pro V9 app...");

  // Default tab
  switchTab("dashboard");

  // Load previous state from localStorage
  loadState();

  // Render initial achievements
  renderAchievements();

  // Render custom DB
  renderCustomDB();

  // Render dashboard stats
  renderDashboardStats();

  // Attach any event listeners if needed
}

document.addEventListener("DOMContentLoaded", initApp);

// ==============================
// Local Storage
// ==============================
window.saveState = function () {
  localStorage.setItem("fittrack-state", JSON.stringify(appState));
  console.log("State saved.");
};

window.loadState = function () {
  const stored = localStorage.getItem("fittrack-state");
  if (stored) {
    try {
      appState = JSON.parse(stored);
      console.log("State loaded.", appState);
    } catch (e) {
      console.error("Failed to load state", e);
    }
  }
};

// ==============================
// Dashboard Functions
// ==============================
window.renderDashboardStats = function () {
  $("#dash-calories").textContent = appState.currentCalories || 0;
  $("#dash-protein").textContent = (appState.currentProtein || 0) + "g";
  $("#dash-carbs").textContent = (appState.currentCarbs || 0) + "g";
  $("#dash-fat").textContent = (appState.currentFat || 0) + "g";
  $("#water-count").textContent = (appState.water || 0) + "L";
  $("#user-tier").textContent = appState.tier;
  $("#user-xp").textContent = appState.xp;
  $("#user-streak").textContent = appState.streak;
};

// ==============================
// Workout Functions
// ==============================
window.startManualWorkout = function () {
  console.log("Starting manual workout");
  switchTab("workout-active");
  appState.currentWorkout = { exercises: [], startTime: Date.now() };
  $("#active-workout-title").textContent = "Manual Session";
  appState.workoutTimer = 0;
  startWorkoutTimer();
};

window.generateAIWorkout = function () {
  console.log("Generating AI workout");
  switchTab("workout-active");
  appState.currentWorkout = { exercises: ["Push-ups", "Squats", "Plank"], startTime: Date.now() };
  $("#active-workout-title").textContent = "AI Workout";
  renderExerciseList();
  appState.workoutTimer = 0;
  startWorkoutTimer();
};

window.startWorkoutTimer = function () {
  clearInterval(appState.timerInterval);
  appState.timerInterval = setInterval(() => {
    appState.workoutTimer++;
    $("#workout-timer").textContent = formatTime(appState.workoutTimer);
  }, 1000);
};

window.renderExerciseList = function () {
  const container = $("#exercise-list");
  container.innerHTML = "";
  if (!appState.currentWorkout?.exercises) return;
  appState.currentWorkout.exercises.forEach((ex, i) => {
    const div = document.createElement("div");
    div.textContent = `${i + 1}. ${ex}`;
    container.appendChild(div);
  });
};

window.saveWorkout = function () {
  if (!appState.currentWorkout) return;
  appState.currentWorkout.endTime = Date.now();
  appState.workouts.push(appState.currentWorkout);
  appState.currentWorkout = null;
  clearInterval(appState.timerInterval);
  console.log("Workout saved", appState.workouts);
  saveState();
  switchTab("dashboard");
};

window.cancelWorkout = function () {
  appState.currentWorkout = null;
  clearInterval(appState.timerInterval);
  console.log("Workout cancelled");
  switchTab("dashboard");
};

// ==============================
// Modals: Meal Builder / Tutorials
// ==============================
window.openMealModal = function () {
  removeClass($("#meal-modal"), "hidden");
};

window.closeMealModal = function () {
  addClass($("#meal-modal"), "hidden");
};

window.openTutorial = function () {
  removeClass($("#tutorial-modal"), "hidden");
};

window.closeTutorial = function () {
  addClass($("#tutorial-modal"), "hidden");
};

// ==============================
// Nutrition Functions
// ==============================

// Switch between nutrition tabs (log / database)
window.setNutritionTab = function (tab) {
  if (!tab) return;
  if (tab === "log") {
    removeClass($("#nut-view-log"), "hidden");
    addClass($("#nut-view-db"), "hidden");
  } else {
    removeClass($("#nut-view-db"), "hidden");
    addClass($("#nut-view-log"), "hidden");
  }
};

// Handle searching food in log
window.handleFoodSearch = function (query) {
  const resultsContainer = $("#food-results");
  resultsContainer.innerHTML = "";
  if (!query) return;
  const results = appState.customDatabase.filter((food) =>
    food.name.toLowerCase().includes(query.toLowerCase())
  );
  results.forEach((food) => {
    const div = document.createElement("div");
    div.textContent = `${food.name} • ${food.calories} Kcal • ${food.protein}g Protein`;
    div.onclick = () => openPortionModal(food);
    resultsContainer.appendChild(div);
  });
};

// Save portion from portion modal
window.confirmLogPortion = function () {
  const qty = Number($("#portion-qty-input").value) || 1;
  const item = appState.currentPortionItem;
  if (!item) return;
  const multiplier = appState.portionMode === "grams" ? qty / 100 : qty;
  appState.nutritionLog.push({
    name: item.name,
    calories: item.calories * multiplier,
    protein: item.protein * multiplier,
  });
  closePortionModal();
  renderDailyLog();
  saveState();
};

// Open portion modal for food item
window.openPortionModal = function (food) {
  appState.currentPortionItem = food;
  $("#portion-item-name").textContent = food.name;
  $("#portion-qty-input").value = 1;
  removeClass($("#portion-modal"), "hidden");
};

// Close portion modal
window.closePortionModal = function () {
  appState.currentPortionItem = null;
  addClass($("#portion-modal"), "hidden");
};

// Adjust portion qty
window.adjustPortionQty = function (delta) {
  const input = $("#portion-qty-input");
  input.value = Math.max(1, Number(input.value) + delta);
};

// Set portion mode grams/unit
window.setPortionMode = function (mode) {
  appState.portionMode = mode;
};

// Render daily nutrition log
window.renderDailyLog = function () {
  const container = $("#daily-log-list");
  container.innerHTML = "";
  let totalCals = 0;
  let totalProt = 0;
  appState.nutritionLog.forEach((item, i) => {
    const div = document.createElement("div");
    div.textContent = `${i + 1}. ${item.name} • ${item.calories.toFixed(1)} Kcal • ${item.protein.toFixed(1)}g Protein`;
    container.appendChild(div);
    totalCals += item.calories;
    totalProt += item.protein;
  });
  $("#total-day-cals").textContent = `${totalCals.toFixed(1)} Kcal`;
  $("#total-day-prot").textContent = `${totalProt.toFixed(1)}g Protein`;
  if (appState.nutritionLog.length) removeClass($("#daily-totals-card"), "hidden");
};

// Save custom food to database
window.saveToDatabase = function () {
  const name = $("#form-name").value.trim();
  const cals = Number($("#form-cals").value);
  const prot = Number($("#form-prot").value);
  if (!name || isNaN(cals) || isNaN(prot)) return;
  appState.customDatabase.push({ name, calories: cals, protein: prot });
  renderCustomDB();
  saveState();
};

// Render custom database
window.renderCustomDB = function () {
  const container = $("#custom-db-list");
  container.innerHTML = "";
  appState.customDatabase.forEach((item) => {
    const div = document.createElement("div");
    div.textContent = `${item.name} • ${item.calories} Kcal • ${item.protein}g Protein`;
    div.onclick = () => openPortionModal(item);
    container.appendChild(div);
  });
};

// Archive day nutrition
window.archiveDailyNutrition = function () {
  if (!confirm("Archive today's nutrition?")) return;
  appState.nutritionLog = [];
  renderDailyLog();
  saveState();
};

// ==============================
// Metrics Functions
// ==============================
window.setMetricsTab = function (tab) {
  if (!tab) return;
  if (tab === "checkin") {
    removeClass($("#metrics-view-checkin"), "hidden");
    addClass($("#metrics-view-logs"), "hidden");
  } else {
    removeClass($("#metrics-view-logs"), "hidden");
    addClass($("#metrics-view-checkin"), "hidden");
    renderMetricsHistory();
  }
};

// Save metrics check-in
window.saveMetrics = function () {
  const weight = Number($("#body-weight").value);
  const waist = Number($("#m-waist").value);
  const front = $("#img-front").src || null;
  const side = $("#img-side").src || null;
  const back = $("#img-back").src || null;
  if (isNaN(weight) || isNaN(waist)) return;
  appState.metrics.push({ date: new Date().toISOString(), weight, waist, front, side, back });
  saveState();
  alert("Metrics saved!");
};

// Render metrics history
window.renderMetricsHistory = function () {
  const container = $("#metrics-history-list");
  container.innerHTML = "";
  appState.metrics.forEach((m, i) => {
    const div = document.createElement("div");
    div.textContent = `${i + 1}. ${new Date(m.date).toLocaleDateString()} • ${m.weight} kg • Waist ${m.waist} cm`;
    container.appendChild(div);
  });
};

// Trigger photo upload
window.triggerPhoto = function (pos) {
  const input = $("#photo-input");
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      $(`#img-${pos}`).src = reader.result;
      removeClass($(`#img-${pos}`), "hidden");
    };
    reader.readAsDataURL(file);
  };
  input.click();
};

// ==============================
// Achievements & Badges
// ==============================
window.renderAchievements = function () {
  const achContainer = $("#achievements-list");
  const badgeContainer = $("#badges-list");
  achContainer.innerHTML = "";
  badgeContainer.innerHTML = "";

  appState.achievements.forEach((a, i) => {
    const div = document.createElement("div");
    div.textContent = `${i + 1}. ${a.name} - ${a.description}`;
    achContainer.appendChild(div);
  });

  // Example badges
  const badges = ["Beginner", "Intermediate", "Pro"];
  badges.forEach((b) => {
    const div = document.createElement("div");
    div.textContent = b;
    badgeContainer.appendChild(div);
  });
};

// ==============================
// Scanner Functions (Barcode / QR)
// ==============================
window.startScanner = function (target) {
  console.log("Scanner started for", target);
  removeClass($("#scanner-container"), "hidden");
};

window.stopScanner = function () {
  addClass($("#scanner-container"), "hidden");
};
// ==============================
// WORKOUT SETUP LOGIC
// ==============================

// Toggle muscle grid for "Specific Muscle"
window.toggleSpecificMuscleGrid = function () {
  const focus = $("#workout-focus").value;
  if (focus === "Specific Muscle") {
    removeClass($("#muscle-selection-container"), "hidden");
    renderMuscleGrid();
  } else {
    addClass($("#muscle-selection-container"), "hidden");
  }
};

// Render selectable muscle grid
window.renderMuscleGrid = function () {
  const muscles = [
    "Chest", "Back", "Shoulders", "Biceps", "Triceps",
    "Quads", "Hamstrings", "Glutes", "Calves",
    "Abs", "Obliques", "Lower Back"
  ];

  const grid = $("#muscle-selection-grid");
  grid.innerHTML = "";

  muscles.forEach(m => {
    const chip = document.createElement("div");
    chip.className = "muscle-chip";
    chip.textContent = m;
    chip.onclick = () => {
      chip.classList.toggle("selected");
    };
    grid.appendChild(chip);
  });
};

// ==============================
// CARDIO OPTIONS
// ==============================
window.toggleCardioOptions = function () {
  const checked = $("#add-cardio-check").checked;
  if (checked) {
    removeClass($("#cardio-options"), "hidden");
  } else {
    addClass($("#cardio-options"), "hidden");
  }
};

// ==============================
// WORKOUT ENVIRONMENT
// ==============================
window.setWorkoutEnv = function (env) {
  appState.workoutEnv = env;
  $("#env-tab-gym").classList.remove("active");
  $("#env-tab-home").classList.remove("active");

  if (env === "gym") {
    $("#env-tab-gym").classList.add("active");
  } else {
    $("#env-tab-home").classList.add("active");
  }
};

// ==============================
// AI WORKOUT HELPERS
// ==============================
window.buildAIWorkoutPlan = function () {
  const env = appState.workoutEnv || "gym";
  const focus = $("#workout-focus").value;

  let exercises = [];

  if (focus === "Upper Body") {
    exercises = env === "gym"
      ? ["Bench Press", "Lat Pulldown", "Shoulder Press", "Bicep Curl", "Tricep Pushdown"]
      : ["Push-ups", "Resistance Rows", "Pike Push-ups", "Band Curls"];
  }

  if (focus === "Lower Body/Legs") {
    exercises = env === "gym"
      ? ["Squat", "Leg Press", "RDL", "Leg Curl", "Calf Raise"]
      : ["Bodyweight Squats", "Lunges", "Glute Bridges", "Calf Raises"];
  }

  if (focus === "Full Body") {
    exercises = ["Squat", "Push-up", "Row", "Plank", "Farmer Carry"];
  }

  if (focus === "Specific Muscle") {
    const selected = [...$$(".muscle-chip.selected")].map(m => m.textContent);
    exercises = selected.map(m => `${m} Exercise`);
  }

  return exercises;
};

// Override AI workout generator to use smarter logic
window.generateAIWorkout = function () {
  console.log("AI Workout Generated");
  const exercises = buildAIWorkoutPlan();
  switchTab("workout-active");

  appState.currentWorkout = {
    exercises,
    startTime: Date.now(),
    ai: true
  };

  $("#active-workout-title").textContent = "AI Coach Session";
  renderExerciseList();
  appState.workoutTimer = 0;
  startWorkoutTimer();
};

// ==============================
// STREAKS & XP SYSTEM
// ==============================
window.addXP = function (amount) {
  appState.xp += amount;
  checkTierUpgrade();
  renderDashboardStats();
  saveState();
};

window.incrementStreak = function () {
  appState.streak += 1;
  addXP(25);
};

// Tier progression
window.checkTierUpgrade = function () {
  if (appState.xp >= 5000) appState.tier = "Elite";
  else if (appState.xp >= 2500) appState.tier = "Advanced";
  else if (appState.xp >= 1000) appState.tier = "Intermediate";
  else appState.tier = "Beginner";
};

// Award XP on workout save
const originalSaveWorkout = window.saveWorkout;
window.saveWorkout = function () {
  originalSaveWorkout();
  addXP(100);
  incrementStreak();
};

// ==============================
// GAMIFICATION: ACHIEVEMENTS CORE
// ==============================
window.initAchievements = function () {
  if (appState.achievements.length) return;

  const achievementTemplates = [
    { name: "First Workout", desc: "Complete your first workout", xp: 100 },
    { name: "7 Day Streak", desc: "Train 7 days in a row", xp: 250 },
    { name: "Nutrition Tracker", desc: "Log nutrition for 7 days", xp: 200 },
    { name: "AI Trainee", desc: "Complete 10 AI workouts", xp: 300 },
    { name: "Consistency King", desc: "30 day streak", xp: 1000 }
  ];

  achievementTemplates.forEach(a => {
    appState.achievements.push({
      name: a.name,
      description: a.desc,
      xp: a.xp,
      unlocked: false
    });
  });

  saveState();
};

// Unlock achievement
window.unlockAchievement = function (name) {
  const ach = appState.achievements.find(a => a.name === name);
  if (!ach || ach.unlocked) return;

  ach.unlocked = true;
  addXP(ach.xp);
  alert(`🏆 Achievement Unlocked: ${ach.name}`);
  renderAchievements();
  saveState();
};

// ==============================
// INITIALIZE GAMIFICATION
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  initAchievements();
});
// ==============================
// LEVELS & FEATURE UNLOCKS
// ==============================

window.levels = [
  { level: 1, name: "Beginner", xp: 0, unlocks: ["Manual Workouts"] },
  { level: 5, name: "Learner", xp: 500, unlocks: ["Nutrition Log"] },
  { level: 10, name: "Intermediate", xp: 1500, unlocks: ["AI Workouts"] },
  { level: 20, name: "Advanced", xp: 3000, unlocks: ["Progress Analytics"] },
  { level: 35, name: "Elite", xp: 6000, unlocks: ["Coach Mode"] },
  { level: 50, name: "Master", xp: 12000, unlocks: ["Admin Tools"] }
];

window.getUserLevel = function () {
  let lvl = levels[0];
  levels.forEach(l => {
    if (appState.xp >= l.xp) lvl = l;
  });
  return lvl;
};

window.renderUserLevel = function () {
  const level = getUserLevel();
  $("#user-tier").textContent = `${level.name} (Lvl ${level.level})`;
};

// Update dashboard whenever XP changes
const originalAddXP = window.addXP;
window.addXP = function (amount) {
  originalAddXP(amount);
  renderUserLevel();
};

// ==============================
// ACHIEVEMENTS SYSTEM (100+ READY)
// ==============================

window.achievementPools = {
  bronze: [],
  silver: [],
  gold: [],
  platinum: [],
  lifetime: []
};

// Utility to generate achievements
window.generateAchievements = function () {
  if (appState.achievements.length > 10) return;

  // 50 Bronze
  for (let i = 1; i <= 50; i++) {
    achievementPools.bronze.push({
      name: `Bronze #${i}`,
      tier: "Bronze",
      xp: 25,
      unlocked: false,
      condition: () => appState.workouts.length >= i
    });
  }

  // 25 Silver
  for (let i = 1; i <= 25; i++) {
    achievementPools.silver.push({
      name: `Silver #${i}`,
      tier: "Silver",
      xp: 100,
      unlocked: false,
      condition: () => appState.streak >= i * 2
    });
  }

  // 15 Gold
  for (let i = 1; i <= 15; i++) {
    achievementPools.gold.push({
      name: `Gold #${i}`,
      tier: "Gold",
      xp: 300,
      unlocked: false,
      condition: () => appState.xp >= i * 1000
    });
  }

  // 8 Platinum (long-term)
  for (let i = 1; i <= 8; i++) {
    achievementPools.platinum.push({
      name: `Platinum #${i}`,
      tier: "Platinum",
      xp: 1000,
      unlocked: false,
      condition: () => appState.streak >= 365 * i
    });
  }

  // 2 Lifetime
  achievementPools.lifetime.push(
    {
      name: "Lifetime Legend",
      tier: "Lifetime",
      xp: 5000,
      unlocked: false,
      condition: () => appState.xp >= 50000
    },
    {
      name: "Top 1%",
      tier: "Lifetime",
      xp: 10000,
      unlocked: false,
      condition: () => appState.streak >= 1000
    }
  );

  Object.values(achievementPools).flat().forEach(a => {
    appState.achievements.push(a);
  });

  saveState();
};

// Check achievements on every action
window.checkAchievements = function () {
  appState.achievements.forEach(a => {
    if (!a.unlocked && a.condition()) {
      a.unlocked = true;
      addXP(a.xp);
      notifyAchievement(a);
    }
  });
};

window.notifyAchievement = function (ach) {
  console.log(`Achievement unlocked: ${ach.name}`);
  alert(`🏆 ${ach.tier} Achievement Unlocked!\n${ach.name}`);
};

// Hook checks into core actions
const baseSaveWorkout = window.saveWorkout;
window.saveWorkout = function () {
  baseSaveWorkout();
  checkAchievements();
};

// ==============================
// BADGES SYSTEM
// ==============================

window.badges = {
  community: { name: "Community Helper", earned: false },
  coach: { name: "Coach Badge", earned: false },
  gym: { name: "Gym Enthusiast", earned: false },
  committed: { name: "Committed", earned: false }
};

window.checkBadges = function () {
  if (!badges.gym.earned && appState.workouts.length >= 50) {
    badges.gym.earned = true;
    addXP(500);
  }
  if (!badges.committed.earned && appState.streak >= 30) {
    badges.committed.earned = true;
    addXP(300);
  }
};

window.renderBadges = function () {
  const container = $("#badges-list");
  container.innerHTML = "";
  Object.values(badges).forEach(b => {
    if (b.earned) {
      const div = document.createElement("div");
      div.textContent = `🏅 ${b.name}`;
      container.appendChild(div);
    }
  });
};

// ==============================
// EDUCATION, QUIZZES, FEEDBACK
// ==============================

window.educationProgress = {
  lessonsCompleted: 0,
  quizzesPassed: 0,
  feedbackGiven: 0
};

window.completeLesson = function () {
  educationProgress.lessonsCompleted++;
  addXP(50);
};

window.passQuiz = function () {
  educationProgress.quizzesPassed++;
  addXP(100);
};

window.submitFeedback = function () {
  educationProgress.feedbackGiven++;
  addXP(25);
};

// ==============================
// COMMUNITY CONTRIBUTIONS
// ==============================

window.helpCommunity = function () {
  addXP(75);
  badges.community.earned = true;
};

// ==============================
// FINAL INIT HOOK
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  generateAchievements();
  renderUserLevel();
  renderBadges();
});
// ==============================
// DEFENSIVE UI SAFETY
// ==============================

// Safe DOM getter
window.safe = function (id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`Missing element: #${id}`);
    return null;
  }
  return el;
};

// ==============================
// FEATURE LOCKING BY LEVEL
// ==============================

window.featureRequirements = {
  "ai-workout-btn": 10,
  "nutrition": 5,
  "metrics": 5,
  "achievements": 1
};

window.applyFeatureLocks = function () {
  const level = getUserLevel().level;

  Object.entries(featureRequirements).forEach(([id, req]) => {
    const el = safe(id);
    if (!el) return;

    if (level < req) {
      el.disabled = true;
      el.classList.add("locked");
      el.title = `Unlocks at level ${req}`;
    } else {
      el.disabled = false;
      el.classList.remove("locked");
      el.title = "";
    }
  });
};

// Apply locks after XP changes
const baseRenderStats = window.renderDashboardStats;
window.renderDashboardStats = function () {
  baseRenderStats();
  applyFeatureLocks();
};

// ==============================
// BUTTON FAILSAFE (CRITICAL FIX)
// ==============================

window.attachFailsafeButtons = function () {
  document.querySelectorAll("[onclick]").forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("Button clicked:", btn.textContent);
    });
  });
};

// ==============================
// PERFORMANCE CLEANUP
// ==============================

// Prevent duplicate timers
window.startWorkoutTimer = function () {
  if (appState.timerInterval) {
    clearInterval(appState.timerInterval);
  }
  appState.timerInterval = setInterval(() => {
    appState.workoutTimer++;
    const t = safe("workout-timer");
    if (t) t.textContent = formatTime(appState.workoutTimer);
  }, 1000);
};

// Garbage clean unused objects
window.cleanupState = function () {
  if (!Array.isArray(appState.workouts)) appState.workouts = [];
  if (!Array.isArray(appState.metrics)) appState.metrics = [];
  if (!Array.isArray(appState.achievements)) appState.achievements = [];
};

// ==============================
// UI FEEDBACK HELPERS
// ==============================

window.toast = function (msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

// Override achievement notification
window.notifyAchievement = function (ach) {
  toast(`🏆 ${ach.tier} Achievement: ${ach.name}`);
};

// ==============================
// VERSIONING & BUILD INFO
// ==============================

window.APP_VERSION = "FitTrack Pro V9.0.0";
window.APP_BUILD_DATE = new Date().toISOString();

window.renderVersionBadge = function () {
  const badge = document.createElement("div");
  badge.id = "version-badge";
  badge.textContent = `${APP_VERSION}`;
  document.body.appendChild(badge);
};

// ==============================
// FINAL INIT PASS (MASTER BOOT)
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  console.log("FitTrack Pro V9 booting…");

  cleanupState();
  renderDashboardStats();
  renderUserLevel();
  renderAchievements();
  renderBadges();
  attachFailsafeButtons();
  renderVersionBadge();

  console.log("FitTrack Pro V9 ready.");
});
