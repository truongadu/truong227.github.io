/**
 * Module Tự động tính Calo (kcal) và Dinh dưỡng Real-time cho Món ăn
 * Dựa trên Bảng Cơ Sở Dữ Liệu Dinh Dưỡng Nguyên Liệu Việt Nam & Thuật Toán Phân Tích Tự Động
 */

export interface IngredientNutrition {
  nameKeywords: string[]
  caloriesPer100g: number // kcal per 100g or 1 standard item
  proteinPer100g: number  // g
  carbsPer100g: number    // g
  fatPer100g: number      // g
  fiberPer100g: number    // g
  isPerItem?: boolean     // if true, calories is per 1 piece (e.g. egg)
  defaultWeightGrams?: number
}

// Bảng dữ liệu dinh dưỡng nguyên liệu Việt Nam phổ biến
export const INGREDIENT_DATABASE: IngredientNutrition[] = [
  // Gia vị & Nước chấm & Nguyên liệu làm sốt
  { nameKeywords: ['nước mắm', 'mắm'], caloriesPer100g: 40, proteinPer100g: 5, carbsPer100g: 5, fatPer100g: 0, fiberPer100g: 0, defaultWeightGrams: 15 },
  { nameKeywords: ['muối', 'muối ăn', 'muối tinh', 'bột canh'], caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, fiberPer100g: 0, defaultWeightGrams: 5 },
  { nameKeywords: ['đường', 'đường kính', 'đường cát', 'đường thốt nốt', 'đường phèn'], caloriesPer100g: 387, proteinPer100g: 0, carbsPer100g: 100, fatPer100g: 0, fiberPer100g: 0, defaultWeightGrams: 10 },
  { nameKeywords: ['hạt nêm', 'bột ngọt', 'mì chính'], caloriesPer100g: 120, proteinPer100g: 10, carbsPer100g: 20, fatPer100g: 0, fiberPer100g: 0, defaultWeightGrams: 5 },
  { nameKeywords: ['tương ớt', 'tương cà', 'ketchup'], caloriesPer100g: 100, proteinPer100g: 1, carbsPer100g: 25, fatPer100g: 0, fiberPer100g: 0.5, defaultWeightGrams: 15 },
  { nameKeywords: ['xì dầu', 'nước tương', 'tương đen'], caloriesPer100g: 60, proteinPer100g: 8, carbsPer100g: 7, fatPer100g: 0, fiberPer100g: 0.8, defaultWeightGrams: 15 },
  { nameKeywords: ['dầu hào'], caloriesPer100g: 50, proteinPer100g: 1.5, carbsPer100g: 11, fatPer100g: 0.2, fiberPer100g: 0, defaultWeightGrams: 15 },
  { nameKeywords: ['tiêu', 'hạt tiêu', 'tiêu đen', 'tiêu sương'], caloriesPer100g: 250, proteinPer100g: 10, carbsPer100g: 64, fatPer100g: 3.3, fiberPer100g: 25, defaultWeightGrams: 3 },
  { nameKeywords: ['ớt bột', 'sa tế', 'ớt chưng'], caloriesPer100g: 300, proteinPer100g: 12, carbsPer100g: 50, fatPer100g: 10, fiberPer100g: 20, defaultWeightGrams: 10 },
  { nameKeywords: ['ngũ vị hương', 'bột nghệ', 'hoa hồi', 'quế', 'thảo quả', 'mắc khén', 'hạt dỗi'], caloriesPer100g: 250, proteinPer100g: 6, carbsPer100g: 50, fatPer100g: 5, fiberPer100g: 15, defaultWeightGrams: 5 },
  { nameKeywords: ['mắm tôm', 'mắm nêm', 'mắm ruốc', 'chao'], caloriesPer100g: 75, proteinPer100g: 12, carbsPer100g: 4, fatPer100g: 1.5, fiberPer100g: 0, defaultWeightGrams: 20 },
  { nameKeywords: ['dấm', 'giấm', 'nước me', 'cốt chanh', 'nước tắc'], caloriesPer100g: 18, proteinPer100g: 0.1, carbsPer100g: 1, fatPer100g: 0, fiberPer100g: 0, defaultWeightGrams: 15 },
  { nameKeywords: ['mật ong'], caloriesPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82, fatPer100g: 0, fiberPer100g: 0.2, defaultWeightGrams: 15 },
  { nameKeywords: ['mayonnaise', 'sốt mayonnaise'], caloriesPer100g: 680, proteinPer100g: 1, carbsPer100g: 1, fatPer100g: 75, fiberPer100g: 0, defaultWeightGrams: 15 },

  // Dầu mỡ, Bơ & Sữa
  { nameKeywords: ['dầu ăn', 'mỡ lợn', 'mỡ heo', 'dầu thực vật', 'dầu mè', 'dầu ô liu', 'dầu đậu nành'], caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, fiberPer100g: 0, defaultWeightGrams: 15 },
  { nameKeywords: ['bơ', 'bơ lạt', 'bơ tỏi', 'bơ thực vật'], caloriesPer100g: 717, proteinPer100g: 0.9, carbsPer100g: 0.1, fatPer100g: 81, fiberPer100g: 0, defaultWeightGrams: 15 },
  { nameKeywords: ['nước cốt dừa', 'dừa nạo', 'kem dừa'], caloriesPer100g: 230, proteinPer100g: 2.3, carbsPer100g: 6, fatPer100g: 24, fiberPer100g: 1, defaultWeightGrams: 50 },
  { nameKeywords: ['sữa tươi', 'sữa đặc', 'kem tươi', 'whipping cream', 'phô mai', 'cheese'], caloriesPer100g: 180, proteinPer100g: 6, carbsPer100g: 12, fatPer100g: 12, fiberPer100g: 0, defaultWeightGrams: 50 },

  // Thịt & Hải sản & Đồ chế biến
  { nameKeywords: ['thịt bò', 'bò tái', 'bò nạm', 'bò băm', 'dẻ sườn bò', 'thịt bê', 'thăn bò', 'bắp bò', 'gầu bò'], caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, fiberPer100g: 0, defaultWeightGrams: 150 },
  { nameKeywords: ['thịt heo', 'thịt lợn', 'ba chỉ', 'thịt nạc', 'sườn heo', 'sườn sụn', 'giò heo', 'chân giò', 'móng giò', 'nạc vai'], caloriesPer100g: 260, proteinPer100g: 20, carbsPer100g: 1, fatPer100g: 19, fiberPer100g: 0, defaultWeightGrams: 150 },
  { nameKeywords: ['thịt gà', 'ức gà', 'cánh gà', 'đùi gà', 'gà xé', 'lòng gà'], caloriesPer100g: 185, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 8, fiberPer100g: 0, defaultWeightGrams: 150 },
  { nameKeywords: ['thịt vịt', 'vịt om', 'vịt quay', 'thịt chim', 'thịt dê', 'thịt cừu', 'thịt trâu'], caloriesPer100g: 230, proteinPer100g: 19, carbsPer100g: 0, fatPer100g: 16, fiberPer100g: 0, defaultWeightGrams: 150 },
  { nameKeywords: ['xúc xích', 'lạp xưởng', 'chả lụa', 'giò lụa', 'chả bò', 'pâté', 'pate', 'thịt nguội'], caloriesPer100g: 300, proteinPer100g: 14, carbsPer100g: 3, fatPer100g: 26, fiberPer100g: 0, defaultWeightGrams: 50 },
  { nameKeywords: ['cá', 'cá lóc', 'cá hồi', 'cá trôi', 'cá lăng', 'cá thu', 'cá ngừ', 'cá rô', 'cá chép', 'cá basa', 'chả cá'], caloriesPer100g: 130, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 5, fiberPer100g: 0, defaultWeightGrams: 150 },
  { nameKeywords: ['tôm', 'tôm khô', 'tôm hùm', 'tôm tươi', 'tôm sú', 'chả tôm'], caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, fiberPer100g: 0, defaultWeightGrams: 100 },
  { nameKeywords: ['mực', 'bạch tuộc', 'mực khô'], caloriesPer100g: 92, proteinPer100g: 16, carbsPer100g: 3, fatPer100g: 1.4, fiberPer100g: 0, defaultWeightGrams: 100 },
  { nameKeywords: ['cua', 'gạch cua', 'riêu cua', 'hến', 'nghêu', 'sò', 'ốc', 'ghẹ'], caloriesPer100g: 87, proteinPer100g: 18, carbsPer100g: 1, fatPer100g: 1, fiberPer100g: 0, defaultWeightGrams: 100 },
  { nameKeywords: ['trứng', 'trứng gà', 'trứng vịt', 'trứng cút'], caloriesPer100g: 70, proteinPer100g: 6, carbsPer100g: 0.5, fatPer100g: 5, fiberPer100g: 0, isPerItem: true, defaultWeightGrams: 50 },

  // Tinh bột & Hạt
  { nameKeywords: ['cơm', 'gạo', 'gạo nếp', 'xôi', 'gạo lứt'], caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, fiberPer100g: 0.4, defaultWeightGrams: 150 },
  { nameKeywords: ['bún', 'phở', 'hủ tiếu', 'bánh canh', 'bánh cuốn', 'bánh xèo', 'mì gói', 'mì tôm', 'mì trứng'], caloriesPer100g: 120, proteinPer100g: 2.5, carbsPer100g: 26, fatPer100g: 0.5, fiberPer100g: 0.5, defaultWeightGrams: 180 },
  { nameKeywords: ['bánh mì', 'sandwich', 'bột mì', 'bột chiên giòn'], caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, fiberPer100g: 2.7, defaultWeightGrams: 80 },
  { nameKeywords: ['miến', 'bột lọc', 'bột năng', 'bột gạo'], caloriesPer100g: 330, proteinPer100g: 0.7, carbsPer100g: 82, fatPer100g: 0.2, fiberPer100g: 0.5, defaultWeightGrams: 50 },
  { nameKeywords: ['khoai tây', 'khoai lang', 'khoai môn', 'sắn', 'ngô', 'bắp'], caloriesPer100g: 90, proteinPer100g: 2, carbsPer100g: 21, fatPer100g: 0.2, fiberPer100g: 2.5, defaultWeightGrams: 100 },
  { nameKeywords: ['đậu xanh', 'đậu đen', 'đậu đỏ', 'hạt sen', 'hạt điều', 'hạt óc chó', 'hạt chia', 'lạc', 'đậu phụng'], caloriesPer100g: 450, proteinPer100g: 20, carbsPer100g: 30, fatPer100g: 30, fiberPer100g: 10, defaultWeightGrams: 50 },

  // Đậu hũ, Nấm & Đồ Chay
  { nameKeywords: ['đậu phụ', 'đậu hũ', 'tàu hũ', 'váng đậu', 'tàu hũ ky'], caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8, fiberPer100g: 0.3, defaultWeightGrams: 150 },
  { nameKeywords: ['nấm', 'nấm rơm', 'nấm hương', 'nấm kim châm', 'nấm tuyết', 'nấm mộc nhĩ', 'mộc nhĩ', 'nấm hải sản', 'nấm đùi gà', 'nấm đông cô'], caloriesPer100g: 28, proteinPer100g: 3, carbsPer100g: 4, fatPer100g: 0.3, fiberPer100g: 2.5, defaultWeightGrams: 80 },

  // Rau củ & Quả tươi
  { nameKeywords: ['rau muống', 'rau ngót', 'bắp cải', 'cải', 'cải thìa', 'cải cúc', 'cải bẹ xanh', 'xà lách', 'cần tây', 'thì là', 'hành lá', 'ngò', 'ngò rí', 'kinh giới', 'lá lốt', 'lá é', 'tía tía', 'rau thơm'], caloriesPer100g: 20, proteinPer100g: 2, carbsPer100g: 3, fatPer100g: 0.2, fiberPer100g: 2.1, defaultWeightGrams: 100 },
  { nameKeywords: ['cà chua', 'bí đao', 'bí đỏ', 'cà rốt', 'su su', 'đậu bắp', 'măng', 'măng tươi', 'măng khô', 'sấu', 'dưa chua', 'dưa leo', 'dưa chuột', 'mướp', 'mướp đắng', 'khổ qua'], caloriesPer100g: 25, proteinPer100g: 1, carbsPer100g: 5, fatPer100g: 0.2, fiberPer100g: 1.5, defaultWeightGrams: 100 },
  { nameKeywords: ['hành tây', 'tỏi', 'sả', 'ớt', 'gừng', 'riềng', 'hành khô', 'nghệ'], caloriesPer100g: 40, proteinPer100g: 1.5, carbsPer100g: 9, fatPer100g: 0.2, fiberPer100g: 1.5, defaultWeightGrams: 30 },
]

// Món ăn phổ biến chuẩn Calo trung bình khi không nhập rõ nguyên liệu
export const PRESET_DISH_CALORIES: { [key: string]: { calories: number; protein: number; carbs: number; fat: number; fiber: number } } = {
  'phở bò': { calories: 480, protein: 28, carbs: 55, fat: 14, fiber: 2 },
  'bún chả': { calories: 520, protein: 26, carbs: 62, fat: 18, fiber: 3 },
  'cơm tấm': { calories: 620, protein: 32, carbs: 75, fat: 22, fiber: 2 },
  'bún riêu': { calories: 410, protein: 24, carbs: 52, fat: 12, fiber: 3 },
  'hủ tiếu': { calories: 430, protein: 26, carbs: 55, fat: 11, fiber: 2 },
  'bánh mì': { calories: 420, protein: 18, carbs: 52, fat: 16, fiber: 2 },
  'thịt kho tàu': { calories: 490, protein: 26, carbs: 8, fat: 38, fiber: 0 },
  'cá kho': { calories: 310, protein: 28, carbs: 6, fat: 12, fiber: 0 },
  'gà chiên': { calories: 450, protein: 30, carbs: 12, fat: 28, fiber: 0 },
  'bò lúc lắc': { calories: 460, protein: 34, carbs: 14, fat: 28, fiber: 2 },
  'lẩu thái': { calories: 550, protein: 35, carbs: 45, fat: 20, fiber: 4 },
  'nem rán': { calories: 380, protein: 16, carbs: 32, fat: 22, fiber: 2 },
  'gỏi cuốn': { calories: 220, protein: 14, carbs: 28, fat: 5, fiber: 2 },
  'bánh xèo': { calories: 480, protein: 18, carbs: 54, fat: 22, fiber: 3 },
  'chè': { calories: 320, protein: 5, carbs: 65, fat: 6, fiber: 4 },
  'bánh flan': { calories: 210, protein: 6, carbs: 28, fat: 8, fiber: 0 },
}

/**
 * Trích xuất con số lượng (grams hoặc số lượng) từ chuỗi định lượng (VD: "200g", "2 quả", "15 ml", "1 muỗng")
 */
export function parseQuantityGrams(quantityStr: string, isPerItem: boolean = false): number {
  if (!quantityStr) return isPerItem ? 1 : 100

  const str = quantityStr.toLowerCase().trim()
  const matchNum = str.match(/(\d+[\.,]?\d*)/)
  if (!matchNum) return isPerItem ? 1 : 100

  const num = parseFloat(matchNum[1].replace(',', '.'))

  if (isPerItem) {
    return num // 2 quả -> 2
  }

  if (str.includes('kg')) return num * 1000
  if (str.includes('g') || str.includes('gram') || str.includes('ml')) return num
  if (str.includes('lít') || str.includes('l')) return num * 1000
  if (str.includes('thìa') || str.includes('muỗng')) return num * 15 // 1 muỗng ~ 15g
  if (str.includes('bát') || str.includes('chén')) return num * 150 // 1 chén ~ 150g

  // Khi nhập số (VD: 10, 50, 100, 200), mặc định tính theo gram (g)
  return num
}

/**
 * Tính toán dinh dưỡng tự động từ danh sách nguyên liệu & Tên món ăn
 */
export function calculateRecipeNutrition(
  recipeName: string,
  ingredients: { name: string; quantity: string }[],
  servings: number = 1
) {
  let totalCalories = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0
  let totalFiber = 0
  let matchedIngredientsCount = 0

  // 1. Phân tích từng dòng nguyên liệu
  for (const item of ingredients) {
    if (!item.name || !item.name.trim()) continue

    const nameLower = item.name.toLowerCase().trim()

    // Tìm trong database nguyên liệu
    const dbItem = INGREDIENT_DATABASE.find((db) =>
      db.nameKeywords.some((kw) => nameLower.includes(kw))
    )

    if (dbItem) {
      matchedIngredientsCount++
      const amount = parseQuantityGrams(item.quantity, dbItem.isPerItem)

      if (dbItem.isPerItem) {
        totalCalories += dbItem.caloriesPer100g * amount
        totalProtein += dbItem.proteinPer100g * amount
        totalCarbs += dbItem.carbsPer100g * amount
        totalFat += dbItem.fatPer100g * amount
        totalFiber += dbItem.fiberPer100g * amount
      } else {
        const factor = amount / 100
        totalCalories += dbItem.caloriesPer100g * factor
        totalProtein += dbItem.proteinPer100g * factor
        totalCarbs += dbItem.carbsPer100g * factor
        totalFat += dbItem.fatPer100g * factor
        totalFiber += dbItem.fiberPer100g * factor
      }
    } else {
      // Mặc định ước lượng nguyên liệu chưa rõ ~ 50 kcal
      totalCalories += 50
      totalProtein += 2
      totalCarbs += 5
      totalFat += 2
    }
  }

  // 2. Nếu chưa khớp nguyên liệu nào, kiểm tra từ khóa tên món ăn (Preset Fallback)
  if (matchedIngredientsCount === 0 && recipeName) {
    const nameLower = recipeName.toLowerCase().trim()
    for (const [key, val] of Object.entries(PRESET_DISH_CALORIES)) {
      if (nameLower.includes(key)) {
        totalCalories = val.calories
        totalProtein = val.protein
        totalCarbs = val.carbs
        totalFat = val.fat
        totalFiber = val.fiber
        break
      }
    }

    // Nếu vẫn là 0, ước tính cơ bản dựa trên tên món (~ 350 kcal)
    if (totalCalories === 0) {
      totalCalories = 380
      totalProtein = 18
      totalCarbs = 42
      totalFat = 12
      totalFiber = 2
    }
  }

  // Khẩu phần (chia cho số người)
  const numServings = Math.max(1, servings)
  const perServingCalories = Math.round(totalCalories / numServings)
  const perServingProtein = Math.round(totalProtein / numServings)
  const perServingCarbs = Math.round(totalCarbs / numServings)
  const perServingFat = Math.round(totalFat / numServings)
  const perServingFiber = Math.round(totalFiber / numServings)

  return {
    total: {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber),
    },
    perServing: {
      calories: perServingCalories,
      protein: `${perServingProtein}g`,
      carbs: `${perServingCarbs}g`,
      fat: `${perServingFat}g`,
      fiber: `${perServingFiber}g`,
    },
    matchedCount: matchedIngredientsCount,
  }
}
