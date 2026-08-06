import { Recipe } from '@/lib/api'

export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'
export type PlanGoal = 'weight_loss' | 'muscle_gain' | 'maintain'
export type BudgetLevel = 'economy' | 'standard' | 'premium'

export type UserHealthProfile = {
  gender: Gender
  age: number
  height: number // cm
  weight: number // kg
  activityLevel: ActivityLevel
  goal: PlanGoal
  allergies: string[]
  dislikedFoods: string[]
  budget: BudgetLevel
  tastes: string[] // 'Bắc', 'Trung', 'Nam', 'Cay', 'Không cay', 'Healthy', 'Eat Clean', 'Chay', 'Keto', 'Low Carb'
  servings: number // Default 1 or 2
}

export type MacroDistribution = {
  bmr: number
  tdee: number
  targetCalories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  proteinPct: number
  carbsPct: number
  fatPct: number
}

export type PlannedMeal = {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  mealLabel: string
  recipe: Recipe
  targetCalories: number
  suggestedSideDishes?: Recipe[]
}

export type DailyPlan = {
  dayIndex: number
  dayName: string
  meals: PlannedMeal[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export type SavedMealPlan = {
  id: string
  userId?: number | string
  authorName?: string
  title: string
  createdAt: string
  profile: UserHealthProfile
  macros: MacroDistribution
  days: DailyPlan[]
  servings: number
}

// ---------------------------------------------------------------------------
// Vietnamese Tones Removal for Fuzzy / Accent-insensitive search
// ---------------------------------------------------------------------------
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

// ---------------------------------------------------------------------------
// BMR, TDEE & Target Calories Calculator
// ---------------------------------------------------------------------------
export function calculateMacros(profile: UserHealthProfile): MacroDistribution {
  const { gender, age, height, weight, activityLevel, goal } = profile

  // Mifflin-St Jeor Formula
  let bmr = 10 * weight + 6.25 * height - 5 * age
  if (gender === 'male') {
    bmr += 5
  } else {
    bmr -= 161
  }

  // Activity multipliers
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  }

  const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.2))

  // Target calories based on goal
  let targetCalories = tdee
  if (goal === 'weight_loss') {
    targetCalories = Math.max(1200, tdee - 500)
  } else if (goal === 'muscle_gain') {
    targetCalories = tdee + 300
  }

  // Macro ratios (% of total calories)
  let proteinPct = 25
  let carbsPct = 45
  let fatPct = 30 // Default for maintain (Giữ cân): 30% Fat cho cân bằng hormone

  if (goal === 'weight_loss') {
    if (profile.tastes.includes('Keto')) {
      proteinPct = 30
      carbsPct = 5
      fatPct = 65
    } else if (profile.tastes.includes('Low Carb')) {
      proteinPct = 40
      carbsPct = 25
      fatPct = 35
    } else {
      // Giảm cân chuẩn: Ít chất béo (20%), Đạm cao (40%) để thâm hụt calo mà giữ cơ
      proteinPct = 40
      carbsPct = 40
      fatPct = 20
    }
  } else if (goal === 'muscle_gain') {
    // Tăng cơ chuẩn: Đạm cao (35%), Carbs cao (45%) cho tập luyện, Fat vừa phải (20%)
    proteinPct = 35
    carbsPct = 45
    fatPct = 20
  } else if (goal === 'maintain') {
    // Giữ cân chuẩn: Cân bằng đạm (25%), Carbs (45%), Fat (30%)
    proteinPct = 25
    carbsPct = 45
    fatPct = 30
  }

  // Grams: 1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal
  const proteinGrams = Math.round((targetCalories * (proteinPct / 100)) / 4)
  const carbsGrams = Math.round((targetCalories * (carbsPct / 100)) / 4)
  const fatGrams = Math.round((targetCalories * (fatPct / 100)) / 9)

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    proteinPct,
    carbsPct,
    fatPct,
  }
}

// ---------------------------------------------------------------------------
// Unit Scaler & Smart Converter
// ---------------------------------------------------------------------------
export function scaleQuantity(
  quantityStr: string,
  targetServings: number,
  baseServings = 1,
): string {
  if (!quantityStr) return ''
  const factor = targetServings / (baseServings || 1)
  if (factor === 1) return quantityStr

  // Match numbers in quantity string (e.g. "200g", "2.5 muỗng", "1/2 quả")
  return quantityStr.replace(/(\d+(?:\.\d+)?|\d+\/\d+)/g, (match) => {
    let num = 0
    if (match.includes('/')) {
      const [n, d] = match.split('/')
      num = parseFloat(n) / parseFloat(d)
    } else {
      num = parseFloat(match)
    }
    if (isNaN(num)) return match
    const scaled = Math.round(num * factor * 10) / 10

    // Smart unit conversion: e.g. >= 1000g -> kg
    return String(scaled)
  })
}

// ---------------------------------------------------------------------------
// Recipe Calorie Parser — always extracts ACTUAL kcal from nutritionInfo
// ---------------------------------------------------------------------------
export function getRecipeCalories(recipe: Recipe): number {
  if (!recipe.nutritionInfo) return 0
  try {
    const info = JSON.parse(recipe.nutritionInfo)
    const cal = parseInt(String(info.calories), 10)
    return isNaN(cal) ? 0 : cal
  } catch {
    return 0
  }
}

function getRecipeMacro(recipe: Recipe, key: 'protein' | 'carbs' | 'fat'): number {
  if (!recipe.nutritionInfo) return 0
  try {
    const info = JSON.parse(recipe.nutritionInfo)
    return parseFloat(String(info[key])) || 0
  } catch {
    return 0
  }
}

// ---------------------------------------------------------------------------
// Category-based Meal Classification
// ---------------------------------------------------------------------------
// Categories from mock-data:
//   1 = Món chính,  2 = Món tiết kiệm,  3 = Món ăn sáng,
//   4 = Món súp & Lẩu,  5 = Món nướng & Ăn vặt,
//   6 = Món chay,  7 = Món tráng miệng

/** Breakfast-suitable categories and keywords */
function isBreakfastSuitable(r: Recipe): boolean {
  if (r.categoryId === 3) return true // Món ăn sáng
  const name = (r.recipeName + ' ' + (r.description || '')).toLowerCase()
  return (
    name.includes('bánh mì') ||
    name.includes('xôi') ||
    name.includes('cháo') ||
    name.includes('miến') ||
    name.includes('hủ tiếu') ||
    name.includes('bún riêu') ||
    name.includes('phở') ||
    name.includes('bánh cuốn') ||
    name.includes('bánh canh') ||
    name.includes('sandwich')
  )
}

/** Main meal (lunch/dinner) suitable — hearty, filling dishes */
function isMainMealSuitable(r: Recipe): boolean {
  // Main courses, budget meals with protein, soups/hot pots, vegetarian mains
  if ([1, 2, 4, 6].includes(r.categoryId ?? 0)) return true
  const cal = getRecipeCalories(r)
  return cal >= 250 // any dish with decent calories can be a main
}

/** Snack / light dessert suitable */
function isSnackSuitable(r: Recipe): boolean {
  if (r.categoryId === 7) return true // Tráng miệng
  if (r.categoryId === 5) return true // Nướng & Ăn vặt
  const name = (r.recipeName + ' ' + (r.description || '')).toLowerCase()
  return (
    name.includes('chè') ||
    name.includes('kem') ||
    name.includes('bánh') ||
    name.includes('sữa chua') ||
    name.includes('pudding') ||
    name.includes('flan') ||
    name.includes('rau câu') ||
    name.includes('tráng miệng') ||
    name.includes('ăn vặt')
  )
}

// ---------------------------------------------------------------------------
// Side Dish Recommendation Algorithm — smarter pairing
// ---------------------------------------------------------------------------
export function suggestSideDishes(
  mainRecipe: Recipe,
  allRecipes: Recipe[],
  usedIds: Set<number>,
  limit = 2,
): Recipe[] {
  if (!allRecipes || allRecipes.length === 0) return []

  const mainName = (mainRecipe.recipeName + ' ' + (mainRecipe.description || '')).toLowerCase()
  const mainIsSoup = mainName.includes('canh') || mainName.includes('súp') || mainName.includes('lẩu')
  const mainIsRice = mainName.includes('cơm')

  // Score each candidate for how well it complements the main
  const scored = allRecipes
    .filter((r) => r.recipeId !== mainRecipe.recipeId && !usedIds.has(r.recipeId))
    .map((r) => {
      const rName = (r.recipeName + ' ' + (r.description || '')).toLowerCase()
      let score = 0

      const isSoup = rName.includes('canh') || rName.includes('súp')
      const isVeg = rName.includes('rau') || rName.includes('luộc') || rName.includes('xào') || r.categoryId === 2
      const isSalad = rName.includes('gỏi') || rName.includes('nộm') || rName.includes('salad')

      // Heavy main → prefer light soup/veg
      if (!mainIsSoup && isSoup) score += 5
      if (isVeg) score += 3
      if (isSalad) score += 2

      // Avoid same category to add variety
      if (r.categoryId !== mainRecipe.categoryId) score += 1

      // Prefer low-calorie sides
      const cal = getRecipeCalories(r)
      if (cal > 0 && cal < 300) score += 2

      return { recipe: r, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.recipe)
}

// ---------------------------------------------------------------------------
// Shuffled picker — picks from a pool without repeats, reshuffles when exhausted
// ---------------------------------------------------------------------------
function createShuffledPicker<T>(items: T[]): () => T {
  let pool = [...items]
  let idx = 0

  // Fisher-Yates shuffle
  const shuffle = () => {
    pool = [...items]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    idx = 0
  }

  shuffle()

  return () => {
    if (idx >= pool.length) shuffle()
    return pool[idx++]
  }
}

// ---------------------------------------------------------------------------
// AI 7-Day Meal Plan Generator — category-aware & calorie-synced
// ---------------------------------------------------------------------------
const DAY_NAMES = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']

// ---------------------------------------------------------------------------
// Advanced Allergy & Dietary Restriction Engine
// ---------------------------------------------------------------------------
function getRecipeSearchText(r: Recipe): string {
  let ingText = ''
  if (r.ingredients) {
    try {
      const parsed = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients
      if (Array.isArray(parsed)) {
        ingText = parsed.map((item: any) => `${item.name || item.ingredientName || ''} ${item.quantity || ''}`).join(' ')
      } else {
        ingText = String(r.ingredients)
      }
    } catch {
      ingText = String(r.ingredients)
    }
  }

  let stepsText = ''
  if (r.steps) {
    try {
      const parsed = typeof r.steps === 'string' ? JSON.parse(r.steps) : r.steps
      if (Array.isArray(parsed)) {
        stepsText = parsed.join(' ')
      } else {
        stepsText = String(r.steps)
      }
    } catch {
      stepsText = String(r.steps)
    }
  }

  const rawFull = `${r.recipeName} ${r.description || ''} ${ingText} ${stepsText}`
  return removeVietnameseTones(rawFull)
}

const ALLERGY_KEYWORD_MAP: Record<string, string[]> = {
  'hai san': [
    'hai san', 'tom', 'ca', 'muc', 'hau', 'ngheu', 'so', 'oc', 'tep', 'ghe',
    'bach tuoc', 'cha ca', 'lau thai', 'lau mam', 'ruot hen', 'hen', 'nuoc mam',
    'mam tom', 'mam nem', 'mam', 'sup cua', 'gach cua', 'cua', 'tom hum',
    'ca loc', 'ca hu', 'ca troi', 'ca lang', 'mam ca', 'haisan'
  ],
  'thit bo': [
    'bo', 'bap bo', 'nam bo', 'than bo', 'xuong ong bo', 'pho bo', 'bo luc lac',
    'bo sot vang', 'bo kho', 'bo cuon', 'bo my'
  ],
  'bo': [
    'bo', 'bap bo', 'nam bo', 'than bo', 'xuong ong bo', 'pho bo', 'bo luc lac',
    'bo sot vang', 'bo kho', 'bo cuon', 'bo my'
  ],
  'kieng bo': [
    'bo', 'bap bo', 'nam bo', 'than bo', 'xuong ong bo', 'pho bo', 'bo luc lac',
    'bo sot vang', 'bo kho', 'bo cuon', 'bo my'
  ],
  'thit heo': [
    'heo', 'lon', 'ba chi', 'suon', 'nac dam', 'cha lua', 'cha que', 'pate',
    'lap xuong', 'xuc xich', 'gio', 'bi', 'mo lon', 'thit bam'
  ],
  'heo': [
    'heo', 'lon', 'ba chi', 'suon', 'nac dam', 'cha lua', 'cha que', 'pate',
    'lap xuong', 'xuc xich', 'gio', 'bi', 'mo lon', 'thit bam'
  ],
  'dau nanh': [
    'dau nanh', 'dau hu', 'dau phu', 'nuoc tuong', 'tuong', 'xi dau', 'tau hu', 'boa-ro', 'boaro'
  ],
  'sua': [
    'sua', 'kem', 'bo', 'whipping cream', 'pho mai', 'cheese', 'custard', 'caramel',
    'nuoc cot dua', 'flan', 'pudding', 'sua chua', 'che', 'sua dac', 'kem dua'
  ],
  'trung': [
    'trung', 'trung ga', 'trung vit', 'trung cut', 'trung muoi', 'trung bach thao',
    'op la', 'cha trung', 'custard', 'flan', 'mayonnaise'
  ],
  'hat': [
    'hat', 'dau phung', 'lac', 'hat dieu', 'hat chia', 'hat bi', 'hat sen', 'me', 'vung'
  ],
  'gluten': [
    'mi', 'banh mi', 'sandwich', 'mien', 'bot mi', 'banh bao'
  ]
}

function recipeContainsAllergen(recipeSearchText: string, allergyName: string): boolean {
  const normAllergy = removeVietnameseTones(allergyName).trim()
  if (!normAllergy) return false

  // 1. Direct match
  if (recipeSearchText.includes(normAllergy)) return true

  // 2. Keyword dictionary match
  const keywords = ALLERGY_KEYWORD_MAP[normAllergy]
  if (keywords) {
    for (const kw of keywords) {
      if (recipeSearchText.includes(kw)) return true
    }
  }

  // 3. Word-by-word match
  const words = normAllergy.split(/\s+/).filter((w) => w.length > 2)
  for (const w of words) {
    if (ALLERGY_KEYWORD_MAP[w]) {
      for (const kw of ALLERGY_KEYWORD_MAP[w]) {
        if (recipeSearchText.includes(kw)) return true
      }
    } else if (recipeSearchText.includes(w)) {
      return true
    }
  }

  return false
}

export function generate7DayMealPlan(
  allRecipes: Recipe[],
  profile: UserHealthProfile,
  macros: MacroDistribution,
): DailyPlan[] {
  if (!allRecipes || allRecipes.length === 0) return []

  // Auto generation ONLY uses system / admin created recipes (excludes user submitted recipes)
  const systemOrAdminRecipes = allRecipes.filter(
    (r) => !r.userId || Number(r.userId) === 0 || Number(r.userId) === 999,
  )
  const baseRecipes = systemOrAdminRecipes.length > 0 ? systemOrAdminRecipes : allRecipes

  const isVegetarian = profile.tastes.includes('Chay')
  const isNoSpicy = profile.tastes.includes('Không cay')
  const isKeto = profile.tastes.includes('Keto')
  const isLowCarb = profile.tastes.includes('Low Carb')
  const isHealthyOrClean = profile.tastes.includes('Healthy') || profile.tastes.includes('Eat Clean')
  const prefersSpicy = profile.tastes.includes('Cay')

  const SPICY_KEYWORDS = ['cay', 'ot', 'sa te', 'kim chi', 'rang muoi ot', 'xao sa ot', 'lau thai', 'ot sa te', 'ot xiem']
  const HIGH_CARB_KEYWORDS = ['com', 'xoi', 'bun', 'pho', 'mi', 'mien', 'banh mi', 'che', 'khoai', 'san', 'duong', 'pudding', 'flan']
  const HEAVY_UNHEALTHY_KEYWORDS = ['chien xu', 'ngap dau', 'pha lau', 'mo lon', 'mo heo', 'da ga chien']

  const REGION_KEYWORDS: Record<string, string[]> = {
    'Bắc': ['bac', 'ha noi', 'bun cha', 'pho', 'bun thang', 'cha ca lang', 'canh sau', 'bun rieu', 'banh cuon', 'cha que', 'thit dong', 'bun oc', 'hoa thien ly', 'gia cay'],
    'Trung': ['trung', 'hue', 'da nang', 'quang nam', 'bun bo hue', 'mi quang', 'banh xeo mien trung', 'bun mam nem', 'cao lau', 'com hen', 'bun hen', 'banh dap', 'banh beo', 'banh bot loc', 'sa te'],
    'Nam': ['nam', 'mien tay', 'sai gon', 'hu tieu', 'com tam', 'lau mam', 'canh chua', 'ca kho to', 'lau thai', 'banh xeo mien tay', 'banh khot', 'che thai', 'banh canh cua', 'bun mam']
  }

  // Comprehensive non-vegetarian keywords (meat, poultry, seafood, fish sauce, animal dishes)
  const nonVegKeywords = [
    'thit', 'ga', 'bo', 'heo', 'lon', 'tom', 'ca', 'cha', 'muc', 'suon',
    'hai san', 'vit', 'trau', 'de', 'cuu', 'cho', 'chim', 'cut', 'ech', 'luon',
    'oc', 'hau', 'cua', 'ghe', 'ngheu', 'so', 'tep', 'bach tuoc', 'pate',
    'lap xuong', 'xuc xich', 'bi', 'gio', 'ruoc', 'xa xiu', 'ba chi', 'nam',
    'bap bo', 'gau', 'sup cua', 'cha lua', 'cha que', 'cha ca', 'bun cha',
    'pho bo', 'pho ga', 'com tam', 'bun rieu', 'bo kho', 'vit om', 'tom hum',
    'ca loc', 'ca hu', 'ca troi', 'ca lang', 'lau thai', 'lau mam', 'lau ga',
    'nuoc mam', 'mam tom', 'mam nem', 'mam'
  ]

  // Filter recipes based on allergies, disliked foods, vegetarian, and strict taste exclusions
  const filteredRecipes = baseRecipes.filter((r) => {
    const searchText = getRecipeSearchText(r)

    // Check allergies
    for (const allergy of profile.allergies) {
      if (allergy && recipeContainsAllergen(searchText, allergy)) return false
    }

    // Check disliked foods
    for (const disliked of profile.dislikedFoods) {
      if (disliked && recipeContainsAllergen(searchText, disliked)) return false
    }

    // Check vegetarian
    if (isVegetarian) {
      if (nonVegKeywords.some((kw) => searchText.includes(kw))) return false
    }

    // Check strict taste exclusions
    if (isNoSpicy && SPICY_KEYWORDS.some((kw) => searchText.includes(kw))) {
      return false
    }

    if (isKeto && HIGH_CARB_KEYWORDS.some((kw) => searchText.includes(kw))) {
      return false
    }

    if (isHealthyOrClean && HEAVY_UNHEALTHY_KEYWORDS.some((kw) => searchText.includes(kw))) {
      return false
    }

    return true
  })

  // If any restriction is specified (allergies, disliked, vegetarian, no-spicy, keto, etc.), MUST ONLY use filteredRecipes
  const hasRestrictions =
    profile.allergies.length > 0 ||
    profile.dislikedFoods.length > 0 ||
    isVegetarian ||
    isNoSpicy ||
    isKeto ||
    isHealthyOrClean

  const available = (filteredRecipes.length > 0 || hasRestrictions) ? filteredRecipes : baseRecipes

  if (available.length === 0) return []

  // Score available recipes to prioritize user's region and taste preferences
  function scoreRecipeByTastes(r: Recipe): number {
    const searchText = getRecipeSearchText(r)
    let score = 0

    // Region preference scoring (+15)
    for (const region of ['Bắc', 'Trung', 'Nam']) {
      if (profile.tastes.includes(region)) {
        const keywords = REGION_KEYWORDS[region]
        if (keywords && keywords.some((kw) => searchText.includes(kw))) {
          score += 15
        }
      }
    }

    // Spicy preference (+10)
    if (prefersSpicy && SPICY_KEYWORDS.some((kw) => searchText.includes(kw))) {
      score += 10
    }

    // Healthy / Eat Clean preference (+10)
    if (isHealthyOrClean) {
      if (['luoc', 'hap', 'nam', 'goi', 'nom', 'salad', 'uc ga', 'chay', 'canh', 'sup', 'eat clean', 'healthy'].some((kw) => searchText.includes(kw))) {
        score += 10
      }
    }

    // Low carb / Keto preference (+10)
    if (isLowCarb || isKeto) {
      if (!HIGH_CARB_KEYWORDS.some((kw) => searchText.includes(kw))) {
        score += 10
      }
    }

    return score
  }

  const sortedAvailable = [...available].sort((a, b) => scoreRecipeByTastes(b) - scoreRecipeByTastes(a))

  // ---- Classify recipes by meal suitability ----
  const breakfastPool = sortedAvailable.filter(isBreakfastSuitable)
  const mainPool = sortedAvailable.filter(isMainMealSuitable)
  const snackPool = sortedAvailable.filter(isSnackSuitable)

  // Use sub-pools if available; otherwise fall back to sortedAvailable
  const bPool = breakfastPool.length > 0 ? breakfastPool : sortedAvailable
  const mPool = mainPool.length > 0 ? mainPool : sortedAvailable
  const sPool = snackPool.length > 0 ? snackPool : sortedAvailable

  // Create shuffled pickers for variety
  const pickBreakfast = createShuffledPicker(bPool)
  const pickLunch = createShuffledPicker(mPool)
  const pickDinner = createShuffledPicker(mPool)
  const pickSnack = createShuffledPicker(sPool)

  // Track used recipe IDs across the week to maximize variety
  const usedBreakfastIds = new Set<number>()
  const usedLunchIds = new Set<number>()
  const usedDinnerIds = new Set<number>()
  const usedSnackIds = new Set<number>()

  function pickUnique(picker: () => Recipe, usedIds: Set<number>, pool: Recipe[]): Recipe {
    // Try up to pool.length times to find an unused recipe
    for (let attempt = 0; attempt < pool.length; attempt++) {
      const r = picker()
      if (!usedIds.has(r.recipeId)) {
        usedIds.add(r.recipeId)
        return r
      }
    }
    // If all used (pool too small for 7 days), just pick any
    const r = picker()
    usedIds.add(r.recipeId)
    return r
  }

  const dailyPlans: DailyPlan[] = []

  for (let d = 0; d < 7; d++) {
    const breakfastRecipe = pickUnique(pickBreakfast, usedBreakfastIds, bPool)
    const lunchRecipe = pickUnique(pickLunch, usedLunchIds, mPool)
    const dinnerRecipe = pickUnique(pickDinner, usedDinnerIds, mPool)
    const snackRecipe = pickUnique(pickSnack, usedSnackIds, sPool)

    // Track all used IDs for side dish exclusion
    const allUsedToday = new Set([
      breakfastRecipe.recipeId,
      lunchRecipe.recipeId,
      dinnerRecipe.recipeId,
      snackRecipe.recipeId,
    ])

    // Get ACTUAL recipe calories
    const bCal = getRecipeCalories(breakfastRecipe)
    const lCal = getRecipeCalories(lunchRecipe)
    const dCal = getRecipeCalories(dinnerRecipe)
    const sCal = getRecipeCalories(snackRecipe)

    const meals: PlannedMeal[] = [
      {
        mealType: 'breakfast',
        mealLabel: 'Bữa Sáng',
        recipe: breakfastRecipe,
        targetCalories: bCal || Math.round(macros.targetCalories * 0.25),
        suggestedSideDishes: suggestSideDishes(breakfastRecipe, available, allUsedToday, 1),
      },
      {
        mealType: 'lunch',
        mealLabel: 'Bữa Trưa',
        recipe: lunchRecipe,
        targetCalories: lCal || Math.round(macros.targetCalories * 0.35),
        suggestedSideDishes: suggestSideDishes(lunchRecipe, available, allUsedToday, 2),
      },
      {
        mealType: 'dinner',
        mealLabel: 'Bữa Tối',
        recipe: dinnerRecipe,
        targetCalories: dCal || Math.round(macros.targetCalories * 0.3),
        suggestedSideDishes: suggestSideDishes(dinnerRecipe, available, allUsedToday, 2),
      },
      {
        mealType: 'snack',
        mealLabel: 'Bữa Phụ',
        recipe: snackRecipe,
        targetCalories: sCal || Math.round(macros.targetCalories * 0.1),
      },
    ]

    // Calculate daily totals from ACTUAL recipe nutrition
    let totalCal = 0
    let totalP = 0
    let totalC = 0
    let totalF = 0

    meals.forEach((m) => {
      totalCal += m.targetCalories
      totalP += getRecipeMacro(m.recipe, 'protein')
      totalC += getRecipeMacro(m.recipe, 'carbs')
      totalF += getRecipeMacro(m.recipe, 'fat')
    })

    // If macros weren't parsed, approximate from calories
    if (totalP === 0 && totalCal > 0) {
      totalP = Math.round((totalCal * (macros.proteinPct / 100)) / 4)
      totalC = Math.round((totalCal * (macros.carbsPct / 100)) / 4)
      totalF = Math.round((totalCal * (macros.fatPct / 100)) / 9)
    }

    dailyPlans.push({
      dayIndex: d + 1,
      dayName: DAY_NAMES[d],
      meals,
      totalCalories: totalCal,
      totalProtein: totalP,
      totalCarbs: totalC,
      totalFat: totalF,
    })
  }

  return dailyPlans
}

// ---------------------------------------------------------------------------
// LocalStorage Meal Plan Manager
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'facecook_saved_meal_plans'
const SHARED_STORAGE_KEY = 'facecook_shared_meal_plans'

export function getSavedMealPlans(): SavedMealPlan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: SavedMealPlan[] = JSON.parse(raw)
    
    // Auto-normalize long timestamp IDs to simple sequential IDs (1, 2, 3,...)
    let modified = false
    const normalized = parsed.map((plan, index) => {
      if (!plan.id || plan.id.length > 4 || isNaN(Number(plan.id))) {
        modified = true
        return { ...plan, id: String(index + 1) }
      }
      return plan
    })

    if (modified) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    }
    return normalized
  } catch {
    return []
  }
}

export function getSharedMealPlans(): SavedMealPlan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SHARED_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getNextMealPlanId(): string {
  const allPlans = [...getSavedMealPlans(), ...getSharedMealPlans()]
  let maxId = 0
  allPlans.forEach((p) => {
    const num = parseInt(String(p.id), 10)
    if (!isNaN(num) && num > maxId) {
      maxId = num
    }
  })
  return String(maxId + 1)
}

export function getMealPlanById(id: string): SavedMealPlan | null {
  if (!id) return null
  const saved = getSavedMealPlans()
  const foundSaved = saved.find((p) => String(p.id) === String(id))
  if (foundSaved) return foundSaved

  const shared = getSharedMealPlans()
  const foundShared = shared.find((p) => String(p.id) === String(id))
  if (foundShared) return foundShared

  return null
}

export function saveMealPlan(plan: SavedMealPlan): SavedMealPlan[] {
  const current = getSavedMealPlans()
  if (!plan.id || plan.id.length > 5 || isNaN(Number(plan.id))) {
    plan.id = getNextMealPlanId()
  }
  const updated = [plan, ...current.filter((p) => String(p.id) !== String(plan.id))]
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // Synchronize to shared plans storage so other users can view via /meal-planner/[id]
    const shared = getSharedMealPlans()
    const updatedShared = [plan, ...shared.filter((p) => String(p.id) !== String(plan.id))]
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(updatedShared))
  }
  return updated
}

export function registerSharedMealPlan(plan: SavedMealPlan) {
  if (typeof window === 'undefined' || !plan) return
  const shared = getSharedMealPlans()
  if (!shared.some((p) => String(p.id) === String(plan.id))) {
    const updatedShared = [plan, ...shared]
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(updatedShared))
  }
}

export function deleteSavedMealPlan(id: string): SavedMealPlan[] {
  const current = getSavedMealPlans()
  const updated = current.filter((p) => String(p.id) !== String(id))
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }
  return updated
}

export function updateMealPlanTitle(id: string, newTitle: string): SavedMealPlan[] {
  const current = getSavedMealPlans()
  const updated = current.map((p) => (String(p.id) === String(id) ? { ...p, title: newTitle } : p))
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    const shared = getSharedMealPlans()
    const updatedShared = shared.map((p) => (String(p.id) === String(id) ? { ...p, title: newTitle } : p))
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(updatedShared))
  }
  return updated
}
