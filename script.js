// --- DATA & STATE ---

const EXERCISE_DB = [
    { name: "Barbell Bench Press", focus: ["Full Body", "Upper Body", "Push"], equipment: "barbell", muscles: ["Chest", "Triceps", "Shoulders"] },
    { name: "Dumbbell Press", focus: ["Full Body", "Upper Body", "Push"], equipment: "dumbbell", muscles: ["Chest", "Triceps"] },
    { name: "Incline Barbell Press", focus: ["Upper Body", "Push"], equipment: "barbell", muscles: ["Chest", "Shoulders"] },
    { name: "Pull Ups", focus: ["Full Body", "Upper Body", "Pull"], equipment: "bodyweight", muscles: ["Back", "Biceps"] },
    { name: "Lat Pulldowns", focus: ["Upper Body", "Pull"], equipment: "cable", muscles: ["Back", "Biceps"] },
    { name: "Barbell Rows", focus: ["Full Body", "Upper Body", "Pull"], equipment: "barbell", muscles: ["Back", "Biceps"] },
    { name: "Barbell Squats", focus: ["Full Body", "Lower Body/Legs", "Squat"], equipment: "barbell", muscles: ["Quads", "Glutes"] },
    { name: "Leg Press", focus: ["Lower Body/Legs", "Squat"], equipment: "machine", muscles: ["Quads"] },
    { name: "Barbell Deadlift", focus: ["Full Body", "Lower Body/Legs", "Hinge"], equipment: "barbell", muscles: ["Back", "Hamstrings", "Glutes"] },
    { name: "Romanian Deadlifts", focus: ["Lower Body/Legs", "Hinge"], equipment: "barbell", muscles: ["Hamstrings", "Glutes"] },
    { name: "Overhead Press", focus: ["Upper Body", "Push"], equipment: "barbell", muscles: ["Shoulders"] },
    { name: "Lunges", focus: ["Lower Body/Legs", "Squat"], equipment: "dumbbell", muscles: ["Quads", "Glutes"] }
];

const CORE_EXERCISES = ["Plank", "Crunches", "Leg Raises", "Russian Twists", "Deadbugs", "Bicycle Crunches", "Hollow Hold", "Bird Dog"];
const MUSCLE_LIST = ["Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Glutes", "Triceps", "Biceps", "Core"];

const TUTORIALS = [
    { title: "Training Setup", content: "Select your environment (Gym/Home). Choose a focus. If you select 'Specific Muscle', you can pick multiple target areas. Check 'Cardio' or 'Core' to add those finishers to the end of your session." },
    { title: "Tracking", content: "Inside the workout, log your sets, weight, and reps. For core exercises, you can toggle between Reps/Time and bodyweight modes. We've added a weight input to core so you can track weighted planks or crunches!" },
    { title: "Meal Builder", content: "In the Nutrition tab, use the 'Make a Meal' button to combine multiple items. Adjust portions (packet/grams), name your creation, and save it to your inventory for one-tap logging." }
];

// --- GAMIFICATION DATA ---

const ACHIEVEMENTS = [
    // 50 Bronze
    ...Array.from({length:50},(_,i)=>({id:i+1,name:`Bronze Achievement ${i+1}`,xp:10,type:'bronze',desc:`Complete bronze task ${i+1}`,unlocked:false})),
    // 25 Silver
    ...Array.from({length:25},(_,i)=>({id:50+i+1,name:`Silver Achievement ${i+1}`,xp:25,type:'silver',desc:`Complete silver task ${i+1}`,unlocked:false})),
    // 15 Gold
    ...Array.from({length:15},(_,i)=>({id:75+i+1,name:`Gold Achievement ${i+1}`,xp:50,type:'gold',desc:`Complete gold task ${i+1}`,unlocked:false})),
    // 8 Platinum
    ...Array.from({length:8},(_,i)=>({id:90+i+1,name:`Platinum Achievement ${i+1}`,xp:100,type:'platinum',desc:`Complete platinum task ${i+1}`,unlocked:false})),
    // 2 Lifetime
    ...Array.from({length:2},(_,i)=>({id:98+i+1,name:`Lifetime Achievement ${i+1}`,xp:500,type:'lifetime',desc:`Complete lifetime task ${i+1}`,unlocked:false}))
];

const BADGES = [
    {id:1,name:"Community Helper",desc:"Help other users in the community",unlocked:false},
    {id:2,name:"Coach Badge",desc:"Provide guidance and tips",unlocked:false},
    {id:3,name:"Gym Enthusiast Badge",desc:"Hit training goals consistently",unlocked:false},
    {id:4,name:"Committed Badge",desc:"Maintain streaks for 30+ days",unlocked:false}
];

const TIERS = [
    {level:1,name:'Novice',xpReq:0,unlock:'basic'},
    {level:2,name:'Apprentice',xpReq:500,unlock:'intermediate'},
    {level:3,name:'Intermediate',xpReq:1500,unlock:'advanced'},
    {level:4,name:'Advanced',xpReq:3000,unlock:'expert'},
    {level:5,name:'Expert',xpReq:6000,unlock:'all'}
];

let timerInterval;
let activeWorkoutStart = null;
let currentPhotoType = null;
let html5QrCode;
let scannerMode = 'db'; // 'db' or 'meal'

let state = {
    activeTab: 'dashboard', historyTab: 'training', nutritionTab: 'log', metricsTab: 'checkin',
    workoutEnv: 'gym', viewDate: new Date().toISOString().split('T')[0],
    goals: { calories: 2500, water: 2500 },
    equipment: { 
        gym: { barbell: true, dumbbell: true, kettlebell: true, cable: true, machine: true, bodyweight: true }, 
        home: { dumbbell: false, kettlebell: false, bodyweight: true, bands: false } 
    },
    dailyMeals: [], waterLogs: {}, workoutHistory: [], metricsHistory: [], customFoodDb: [],
    currentPhotos: { front: null, side: null, back: null },
    selectedMuscles: [], nutritionalArchive: [],
    // --- GAMIFICATION STATE ---
    xp:0,
    level:1,
    unlockedFeatures:['basic'],
    achievements:ACHIEVEMENTS.map(a=>({...a})),
    badges:BADGES.map(b=>({...b})),
    streak:0,
    quizzesCompleted:0,
    appUsageDays:[]
};

let portionSelection = { item: null, mode: 'packet' };
let mealBuilderItems = [];

// --- LOAD STATE ---
window.onload = () => {
    const saved = localStorage.getItem('fittrack_combined_v9');
    if(saved) state = {...state,...JSON.parse(saved)};
    document.getElementById('status-date').innerText = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    document.getElementById('set-cal-goal').value = state.goals.calories;
    document.getElementById('workout-date-input').value = state.viewDate;
    initEquipmentSettings();
    renderDashboard();
    renderCustomDb();
    renderMuscleSelection();
    renderGamification();
    document.getElementById('photo-input').addEventListener('change', handlePhotoUpload);
    lucide.createIcons();
    trackDailyUsage();
};

// --- SAVE STATE ---
function saveState() { localStorage.setItem('fittrack_combined_v9', JSON.stringify(state)); }

// --- TAB SWITCH ---
function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(btn=>{
        const icon = btn.querySelector('.nav-bg');
        const isMatch = btn.getAttribute('data-tab')===tabId;
        btn.className=`nav-item flex flex-col items-center gap-1.5 ${isMatch?'text-indigo-600':'text-slate-300'}`;
        icon.className=`w-12 h-8 rounded-full flex items-center justify-center nav-bg ${isMatch?'bg-indigo-50':''}`;
    });
    if(tabId==='dashboard') renderDashboard();
    if(tabId==='history') renderHistory();
    if(tabId==='nutrition'){ renderDailyLog(); renderCustomDb(); }
    if(tabId==='metrics') renderMetrics();
    lucide.createIcons();
}

// --- GAMIFICATION FUNCTIONS ---

function addXP(amount) {
    state.xp += amount;
    checkLevelUp();
    saveState();
    renderGamification();
}

function checkLevelUp() {
    let newLevel = state.level;
    for(let i=TIERS.length-1;i>=0;i--){
        if(state.xp>=TIERS[i].xpReq){ newLevel = TIERS[i].level; break; }
    }
    if(newLevel!==state.level){
        state.level=newLevel;
        state.unlockedFeatures.push(TIERS.find(t=>t.level===newLevel).unlock);
        alert(`🎉 Congrats! You've reached Level ${state.level} (${TIERS.find(t=>t.level===newLevel).name})`);
    }
}

function unlockAchievement(id){
    const ach = state.achievements.find(a=>a.id===id);
    if(ach && !ach.unlocked){
        ach.unlocked=true;
        addXP(ach.xp);
        alert(`🏆 Achievement unlocked: ${ach.name} (+${ach.xp} XP)`);
        saveState();
        renderGamification();
    }
}

function unlockBadge(id){
    const badge = state.badges.find(b=>b.id===id);
    if(badge && !badge.unlocked){
        badge.unlocked=true;
        addXP(50);
        alert(`🎖 Badge unlocked: ${badge.name} (+50 XP)`);
        saveState();
        renderGamification();
    }
}

function renderGamification(){
    const container = document.getElementById('gamification-container');
    if(!container) return;
    const tierName = TIERS.find(t=>t.level===state.level).name;
    container.innerHTML = `
        <div class="text-sm font-bold mb-2">Level ${state.level} - ${tierName} | XP: ${state.xp}</div>
        <div class="grid grid-cols-3 gap-2 mb-4">
            ${state.achievements.filter(a=>a.unlocked).map(a=>`<span class="px-2 py-1 text-[8px] rounded bg-green-100">${a.name}</span>`).join('')}
        </div>
        <div class="grid grid-cols-2 gap-2">
            ${state.badges.filter(b=>b.unlocked).map(b=>`<span class="px-2 py-1 text-[8px] rounded bg-indigo-100">${b.name}</span>`).join('')}
        </div>
    `;
}

// Tracks daily app usage streaks
function trackDailyUsage(){
    const today = new Date().toISOString().split('T')[0];
    if(!state.appUsageDays.includes(today)) state.appUsageDays.push(today);
    state.streak = calculateStreak(state.appUsageDays);
    // Unlock simple streak achievements
    if(state.streak>=5) unlockAchievement(1);
    if(state.streak>=10) unlockAchievement(2);
    saveState();
}

function calculateStreak(days){
    if(days.length===0) return 0;
    const sorted = days.sort();
    let streak=1;
    for(let i=days.length-1;i>0;i--){
        const prev = new Date(sorted[i-1]);
        const curr = new Date(sorted[i]);
        const diff = (curr-prev)/(1000*60*60*24);
        if(diff===1) streak++;
        else break;
    }
    return streak;
}

// Example of rewarding gamification for workouts
function saveWorkout(){
    clearInterval(timerInterval);
    const exercisesLogged=[];
    document.querySelectorAll('#exercise-list > div').forEach(card=>{
        const selectElement = card.querySelector('select');
        if(!selectElement) return;
        const name = selectElement.value;
        const sets=[];
        card.querySelectorAll('.set-row').forEach(row=>{
            const inputs=row.querySelectorAll('input');
            sets.push({kg:inputs[0].value,reps:inputs[1].value});
        });
        exercisesLogged.push({name,sets});
    });
    
    state.workoutHistory.unshift({
        id:Date.now(),
        date:state.viewDate,
        focus:document.getElementById('active-workout-title').innerText,
        duration:document.getElementById('workout-timer').innerText,
        exercises:exercisesLogged
    });
    // Gamification: award XP for completing workout
    addXP(50);
    if(state.workoutHistory.length>=10) unlockAchievement(3); // example: unlock bronze
    saveState();
    document.getElementById('workout-setup').classList.remove('hidden'); 
    document.getElementById('workout-active').classList.add('hidden');
    switchTab('history');
    renderGamification();
    // --- GAMIFICATION UI INTERACTIONS ---

function renderAchievementsList() {
    const container = document.getElementById('achievements-list');
    if (!container) return;
    container.innerHTML = state.achievements.map(a => `
        <div class="flex justify-between items-center p-2 border rounded mb-1 ${a.unlocked?'bg-green-50':'bg-slate-50'}">
            <div>
                <div class="font-bold text-sm">${a.name}</div>
                <div class="text-xs">${a.desc}</div>
            </div>
            <div class="text-xs">${a.unlocked?'Unlocked':'Locked'}</div>
        </div>
    `).join('');
}

function renderBadgesList() {
    const container = document.getElementById('badges-list');
    if (!container) return;
    container.innerHTML = state.badges.map(b => `
        <div class="flex justify-between items-center p-2 border rounded mb-1 ${b.unlocked?'bg-indigo-50':'bg-slate-50'}">
            <div>
                <div class="font-bold text-sm">${b.name}</div>
                <div class="text-xs">${b.desc}</div>
            </div>
            <div class="text-xs">${b.unlocked?'Unlocked':'Locked'}</div>
        </div>
    `).join('');
}

// --- GAMIFICATION EVENT TRIGGERS ---

// Unlock achievements based on usage
function checkUsageAchievements() {
    if(state.streak >= 5) unlockAchievement(1);
    if(state.streak >= 10) unlockAchievement(2);
    if(state.appUsageDays.length >= 30) unlockAchievement(4); // bronze/milestone
}

// Unlock achievements for workouts
function checkWorkoutAchievements() {
    if(state.workoutHistory.length >= 10) unlockAchievement(3);
    if(state.workoutHistory.length >= 25) unlockAchievement(5);
    if(state.workoutHistory.length >= 50) unlockAchievement(7);
}

// Unlock achievements for nutrition
function checkNutritionAchievements() {
    if(state.dailyMeals.length >= 20) unlockAchievement(6);
    if(state.nutritionalArchive.length >= 50) unlockAchievement(8);
}

// Unlock badges for consistent engagement
function checkBadgeAchievements() {
    if(state.streak >= 7) unlockBadge(1);
    if(state.streak >= 14) unlockBadge(2);
    if(state.xp >= 2000) unlockBadge(3);
    if(state.xp >= 5000) unlockBadge(4);
}

// Call periodically or after key actions
function updateGamification() {
    checkUsageAchievements();
    checkWorkoutAchievements();
    checkNutritionAchievements();
    checkBadgeAchievements();
    renderGamification();
    renderAchievementsList();
    renderBadgesList();
    saveState();
}

// --- LEVEL PROGRESSION DISPLAY ---

function renderLevelProgress() {
    const container = document.getElementById('level-progress');
    if(!container) return;
    const nextTier = TIERS.find(t => t.xpReq > state.xp) || { xpReq: state.xp };
    const currentTier = TIERS.find(t => t.level === state.level);
    const progress = Math.min(100, ((state.xp - currentTier.xpReq)/(nextTier.xpReq - currentTier.xpReq))*100);
    container.innerHTML = `
        <div class="flex justify-between text-xs mb-1">
            <span>Level ${state.level}</span>
            <span>${state.xp}/${nextTier.xpReq} XP</span>
        </div>
        <div class="w-full bg-slate-200 rounded h-2">
            <div class="bg-indigo-500 h-2 rounded" style="width:${progress}%"></div>
        </div>
    `;
}

// --- DAILY CHECK-IN & QUIZ GAMIFICATION ---

function completeDailyQuiz(score=100){
    state.quizzesCompleted += 1;
    addXP(score);
    alert(`📝 Daily Quiz completed! +${score} XP`);
    updateGamification();
}

// --- GAMIFICATION INTEGRATION WITH WORKOUTS & NUTRITION ---

function logMeal(meal) {
    state.dailyMeals.push(meal);
    addXP(15);
    if(state.dailyMeals.length % 10 === 0) unlockAchievement(6);
    saveState();
    updateGamification();
}

function logWater(ml){
    const date = state.viewDate;
    state.waterLogs[date] = (state.waterLogs[date] || 0) + ml;
    addXP(5);
    saveState();
    updateGamification();
}

function completeWorkoutSession(durationMinutes){
    addXP(durationMinutes*2); // 2 XP per minute
    unlockAchievement(state.workoutHistory.length); // unlock achievement matching number of sessions
    updateGamification();
}

// --- STREAK & LOGIN TRACKING ---

function trackDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    if(!state.appUsageDays.includes(today)) state.appUsageDays.push(today);
    state.streak = calculateStreak(state.appUsageDays);
    updateGamification();
}

// --- INTEGRATION WITH DASHBOARD ---

function renderDashboard(){
    document.getElementById('dashboard-xp').innerText = state.xp;
    document.getElementById('dashboard-level').innerText = state.level;
    renderLevelProgress();
    renderGamification();
    renderAchievementsList();
    renderBadgesList();
}

// --- INITIALIZATION ---

window.addEventListener('focus', () => {
    trackDailyStreak();
});

// Example: automatically update gamification after key actions
document.addEventListener('workoutSaved', updateGamification);
document.addEventListener('mealLogged', updateGamification);
document.addEventListener('quizCompleted', updateGamification);

// --- UTILITY FUNCTIONS ---

function awardXPForCustomAction(actionType){
    switch(actionType){
        case 'workout_complete': addXP(50); break;
        case 'meal_logged': addXP(15); break;
        case 'quiz_complete': addXP(100); break;
        default: addXP(10);
    }
    updateGamification();
                                                  }
                                      }
