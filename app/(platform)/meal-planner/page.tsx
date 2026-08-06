'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Calculator,
  Calendar,
  CheckCircle2,
  ChefHat,
  Clock,
  ExternalLink,
  Flame,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Share2,
  ShoppingBag,
  Sparkles,
  Target,
  Trash2,
  User,
  Utensils,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { getAllRecipes, Recipe } from '@/lib/api'
import {
  calculateMacros,
  generate7DayMealPlan,
  getSavedMealPlans,
  getNextMealPlanId,
  saveMealPlan,
  deleteSavedMealPlan,
  updateMealPlanTitle,
  scaleQuantity,
  UserHealthProfile,
  SavedMealPlan,
  DailyPlan,
  PlannedMeal,
} from '@/lib/ai-planner'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { RecipeDetailDialog } from '@/components/recipe-detail-dialog'
import { cn } from '@/lib/utils'

const ALLERGY_OPTIONS = ['Hải sản', 'Đậu nành', 'Sữa', 'Trứng', 'Gluten', 'Hạt', 'Thịt bò', 'Thịt heo']
const TASTE_OPTIONS = ['Bắc', 'Trung', 'Nam', 'Cay', 'Không cay', 'Healthy', 'Eat Clean', 'Chay', 'Keto', 'Low Carb']

export default function MealPlannerPage() {
  const { isAuthenticated, userId, fullName } = useAuth()
  const { data: recipes = [] } = useSWR('all-recipes-planner', getAllRecipes, {
    revalidateOnFocus: false,
  })

  // User health profile state
  const [profile, setProfile] = useState<UserHealthProfile>({
    gender: 'male',
    age: 25,
    height: 170,
    weight: 65,
    activityLevel: 'moderate',
    goal: 'weight_loss',
    allergies: [],
    dislikedFoods: [],
    budget: 'standard',
    tastes: ['Healthy'],
    servings: 1,
  })

  const [dislikedInput, setDislikedInput] = useState('')
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [currentPlanDays, setCurrentPlanDays] = useState<DailyPlan[] | null>(null)
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>([])

  useEffect(() => {
    setSavedPlans(getSavedMealPlans())
  }, [])

  // Swap modal & Rename modal state
  const [swapTarget, setSwapTarget] = useState<{ dayIdx: number; mealIdx: number } | null>(null)
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null)
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null)
  const [newPlanTitle, setNewPlanTitle] = useState('')

  // Calculated macros
  const macros = calculateMacros(profile)

  const handleGeneratePlan = () => {
    if (recipes.length === 0) {
      toast.error('Đang tải dữ liệu món ăn...')
      return
    }
    const days = generate7DayMealPlan(recipes, profile, macros)
    if (!days || days.length === 0) {
      toast.error('Không có món ăn nào phù hợp với bộ lọc dị ứng / kiêng ăn hiện tại. Vui lòng bỏ bớt tiêu chí dị ứng quá nghiêm ngặt.')
      return
    }
    setCurrentPlanDays(days)
    setActiveDayIndex(0)
    toast.success('Đã tạo thành công kế hoạch ăn uống 7 ngày!')
  }

  const handleSavePlan = () => {
    if (!currentPlanDays) return
    const newId = getNextMealPlanId()
    const newSavedPlan: SavedMealPlan = {
      id: newId,
      userId: userId || undefined,
      authorName: fullName || undefined,
      title: `Kế hoạch #${newId} (${profile.goal === 'weight_loss' ? 'Giảm cân' : profile.goal === 'muscle_gain' ? 'Tăng cơ' : 'Giữ cân'} - ${profile.servings} người)`,
      createdAt: new Date().toISOString(),
      profile,
      macros,
      days: currentPlanDays,
      servings: profile.servings,
    }
    const updated = saveMealPlan(newSavedPlan)
    setSavedPlans(updated)
    toast.success(`Đã lưu kế hoạch vào danh sách (ID: #${newId})!`)
  }

  const handleDeletePlan = (id: string) => {
    const updated = deleteSavedMealPlan(id)
    setSavedPlans(updated)
    toast.success('Đã xóa kế hoạch khỏi danh sách')
  }

  const handleSharePlan = (plan: SavedMealPlan) => {
    const url = `${window.location.origin}/meal-planner/${plan.id}`
    navigator.clipboard.writeText(url)
    toast.success(`Đã sao chép liên kết chia sẻ thực đơn #${plan.id} (${url})!`)
  }

  const handleOpenRenameModal = (plan: SavedMealPlan) => {
    setRenameTarget({ id: plan.id, title: plan.title })
    setNewPlanTitle(plan.title)
  }

  const handleSaveRenamePlan = () => {
    if (!renameTarget || !newPlanTitle.trim()) return
    const updated = updateMealPlanTitle(renameTarget.id, newPlanTitle.trim())
    setSavedPlans(updated)
    setRenameTarget(null)
    toast.success('Đã đổi tên kế hoạch ăn uống thành công!')
  }

  const handleLoadPlan = (plan: SavedMealPlan) => {
    setProfile(plan.profile)
    setCurrentPlanDays(plan.days)
    setActiveDayIndex(0)
    toast.success(`Đã tải kế hoạch "${plan.title}"`)
  }

  const handleSwapRecipe = (newRecipe: Recipe) => {
    if (!swapTarget || !currentPlanDays) return
    const updatedDays = [...currentPlanDays]
    const day = { ...updatedDays[swapTarget.dayIdx] }
    const meals = [...day.meals]
    meals[swapTarget.mealIdx] = {
      ...meals[swapTarget.mealIdx],
      recipe: newRecipe,
    }
    day.meals = meals
    updatedDays[swapTarget.dayIdx] = day
    setCurrentPlanDays(updatedDays)
    setSwapTarget(null)
    toast.success('Đã đổi món thành công!')
  }

  const toggleAllergy = (allergy: string) => {
    setProfile((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }))
  }

  const toggleTaste = (taste: string) => {
    setProfile((prev) => ({
      ...prev,
      tastes: prev.tastes.includes(taste)
        ? prev.tastes.filter((t) => t !== taste)
        : [...prev.tastes, taste],
    }))
  }

  const addDislikedFood = () => {
    if (!dislikedInput.trim()) return
    setProfile((prev) => ({
      ...prev,
      dislikedFoods: [...prev.dislikedFoods, dislikedInput.trim()],
    }))
    setDislikedInput('')
  }

  const removeDislikedFood = (food: string) => {
    setProfile((prev) => ({
      ...prev,
      dislikedFoods: prev.dislikedFoods.filter((f) => f !== food),
    }))
  }

  const activeDay = currentPlanDays ? currentPlanDays[activeDayIndex] : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            AI Smart Meal Planner
          </span>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Lập kế hoạch ăn uống 7 ngày cùng AI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tính BMR, TDEE, phân bổ dinh dưỡng và sinh thực đơn 7 ngày cá nhân hóa theo chỉ số sức khỏe của bạn.
          </p>
        </div>

        {savedPlans.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
              {savedPlans.length} Kế hoạch đã lưu
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Health Profile & Calorie Calculator */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-serif text-lg font-bold">
                <User className="size-5 text-primary" />
                Thông tin sức khỏe & Mục tiêu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs sm:text-sm">
              {/* Gender & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Giới tính</Label>
                  <Select
                    value={profile.gender}
                    onValueChange={(v) =>
                      v && setProfile((p) => ({ ...p, gender: v as 'male' | 'female' }))
                    }
                  >
                    <SelectTrigger className="mt-1 rounded-xl h-9">
                      <SelectValue>
                        {profile.gender === 'male' ? 'Nam' : 'Nữ'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tuổi</Label>
                  <Input
                    type="number"
                    min={12}
                    max={100}
                    value={profile.age}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, age: parseInt(e.target.value) || 25 }))
                    }
                    className="mt-1 rounded-xl h-9"
                  />
                </div>
              </div>

              {/* Height & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Chiều cao (cm)</Label>
                  <Input
                    type="number"
                    min={100}
                    max={220}
                    value={profile.height}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, height: parseInt(e.target.value) || 170 }))
                    }
                    className="mt-1 rounded-xl h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cân nặng (kg)</Label>
                  <Input
                    type="number"
                    min={30}
                    max={200}
                    value={profile.weight}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, weight: parseInt(e.target.value) || 65 }))
                    }
                    className="mt-1 rounded-xl h-9"
                  />
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <Label className="text-xs">Mức độ vận động</Label>
                <Select
                  value={profile.activityLevel}
                  onValueChange={(v: any) =>
                    setProfile((p) => ({ ...p, activityLevel: v }))
                  }
                >
                  <SelectTrigger className="mt-1 rounded-xl h-9 w-full">
                    <SelectValue>
                      {profile.activityLevel === 'sedentary' && 'Ít vận động (văn phòng)'}
                      {profile.activityLevel === 'light' && 'Vận động nhẹ (1-3 ngày/tuần)'}
                      {profile.activityLevel === 'moderate' && 'Vận động vừa (3-5 ngày/tuần)'}
                      {profile.activityLevel === 'active' && 'Vận động nhiều (6-7 ngày/tuần)'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[280px]">
                    <SelectItem value="sedentary">Ít vận động (văn phòng)</SelectItem>
                    <SelectItem value="light">Vận động nhẹ (1-3 ngày/tuần)</SelectItem>
                    <SelectItem value="moderate">Vận động vừa (3-5 ngày/tuần)</SelectItem>
                    <SelectItem value="active">Vận động nhiều (6-7 ngày/tuần)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Goal */}
              <div>
                <Label className="text-xs">Mục tiêu ăn uống</Label>
                <Select
                  value={profile.goal}
                  onValueChange={(v: any) =>
                    setProfile((p) => ({ ...p, goal: v }))
                  }
                >
                  <SelectTrigger className="mt-1 rounded-xl h-9">
                    <SelectValue>
                      {profile.goal === 'weight_loss' && 'Giảm cân (Calorie Deficit)'}
                      {profile.goal === 'muscle_gain' && 'Tăng cơ (High Protein & Surplus)'}
                      {profile.goal === 'maintain' && 'Giữ cân & Khỏe mạnh'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Giảm cân (Calorie Deficit)</SelectItem>
                    <SelectItem value="muscle_gain">Tăng cơ (High Protein & Surplus)</SelectItem>
                    <SelectItem value="maintain">Giữ cân & Khỏe mạnh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Servings */}
              <div>
                <Label className="text-xs">Số khẩu phần (người)</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setProfile((p) => ({ ...p, servings: Math.max(1, p.servings - 1) }))
                    }
                    className="size-9 rounded-xl p-0"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={profile.servings}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, servings: parseInt(e.target.value) || 1 }))
                    }
                    className="h-9 rounded-xl text-center font-bold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setProfile((p) => ({ ...p, servings: p.servings + 1 }))
                    }
                    className="size-9 rounded-xl p-0"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Allergies */}
              <div>
                <Label className="text-xs">Dị ứng thực phẩm</Label>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {ALLERGY_OPTIONS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAllergy(a)}
                      className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                        profile.allergies.includes(a)
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Taste & Diet preferences */}
              <div>
                <Label className="text-xs">Khẩu vị & Chế độ ăn</Label>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {TASTE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTaste(t)}
                      className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                        profile.tastes.includes(t)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disliked foods */}
              <div>
                <Label className="text-xs">Món không thích</Label>
                <div className="mt-1 flex gap-1.5">
                  <Input
                    placeholder="vd: khổ qua, sầu riêng..."
                    value={dislikedInput}
                    onChange={(e) => setDislikedInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDislikedFood())}
                    className="h-8 rounded-xl text-xs"
                  />
                  <Button type="button" size="sm" onClick={addDislikedFood} className="h-8 rounded-xl px-3 text-xs">
                    Thêm
                  </Button>
                </div>
                {profile.dislikedFoods.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {profile.dislikedFoods.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">
                        {f}
                        <button type="button" onClick={() => removeDislikedFood(f)}>
                          <X className="size-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleGeneratePlan} className="w-full rounded-full gap-2 h-11 text-sm font-semibold">
                <Sparkles className="size-4" />
                AI Sinh thực đơn 7 ngày
              </Button>
            </CardContent>
          </Card>

          {/* Calorie & Macro Target Breakdown Card */}
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-serif text-base font-bold">
                <Calculator className="size-4.5 text-primary" />
                Chỉ số Dinh dưỡng Mục tiêu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-border/40 bg-secondary/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground">BMR</p>
                  <p className="mt-0.5 text-sm font-bold">{macros.bmr}</p>
                  <p className="text-[9px] text-muted-foreground">kcal</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-secondary/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground">TDEE</p>
                  <p className="mt-0.5 text-sm font-bold">{macros.tdee}</p>
                  <p className="text-[9px] text-muted-foreground">kcal</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5">
                  <p className="text-[10px] font-medium text-primary">MỤC TIÊU</p>
                  <p className="mt-0.5 text-base font-extrabold text-primary">{macros.targetCalories}</p>
                  <p className="text-[9px] text-primary/80">kcal/ngày</p>
                </div>
              </div>

              {/* Macro Bars */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-medium">
                  <span>Phân bổ Macros</span>
                  <span>P: {macros.proteinPct}% | C: {macros.carbsPct}% | F: {macros.fatPct}%</span>
                </div>
                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div style={{ width: `${macros.proteinPct}%` }} className="bg-red-500" title="Protein" />
                  <div style={{ width: `${macros.carbsPct}%` }} className="bg-blue-500" title="Carbs" />
                  <div style={{ width: `${macros.fatPct}%` }} className="bg-yellow-500" title="Fat" />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px]">
                  <div className="flex items-center justify-center gap-1">
                    <span className="size-2 rounded-full bg-red-500" />
                    <span>Protein: <strong>{macros.proteinGrams}g</strong></span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="size-2 rounded-full bg-blue-500" />
                    <span>Carbs: <strong>{macros.carbsGrams}g</strong></span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="size-2 rounded-full bg-yellow-500" />
                    <span>Fat: <strong>{macros.fatGrams}g</strong></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: 7-Day Interactive Schedule & Saved Plans */}
        <div className="space-y-6 lg:col-span-8">
          {currentPlanDays ? (
            <div className="space-y-6">
              {/* Day Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card p-3">
                <div className="flex flex-wrap items-center gap-1">
                  {currentPlanDays.map((day, idx) => (
                    <button
                      key={day.dayIndex}
                      onClick={() => setActiveDayIndex(idx)}
                      className={cn(
                        'rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors',
                        activeDayIndex === idx
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      {day.dayName}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSavePlan} className="rounded-full gap-1.5 text-xs">
                    <Save className="size-3.5 text-primary" />
                    Lưu kế hoạch
                  </Button>
                </div>
              </div>

              {/* Active Day Schedule */}
              {activeDay && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div>
                      <h3 className="font-serif text-xl font-bold">
                        {activeDay.dayName} — Kế hoạch bữa ăn
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Khẩu phần tính cho: <strong>{profile.servings} người</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tổng calo ngày</p>
                        <p className="text-lg font-bold text-primary">{activeDay.totalCalories} kcal</p>
                      </div>
                    </div>
                  </div>

                  {/* Meals List */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {activeDay.meals.map((meal, mealIdx) => (
                      <Card key={meal.mealType} className="overflow-hidden rounded-2xl border-border/60 transition-colors hover:border-primary/40">
                        <div className="relative aspect-[16/9] bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={meal.recipe.imageUrl || '/placeholder.svg'}
                            alt={meal.recipe.recipeName}
                            className="size-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <Badge className="absolute left-3 top-3 bg-black/60 backdrop-blur text-xs font-semibold text-white">
                            {meal.mealLabel}
                          </Badge>

                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <h4 className="font-serif text-base font-bold text-shadow">
                              {meal.recipe.recipeName}
                            </h4>
                            <div className="mt-1 flex items-center gap-3 text-xs opacity-90">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3 text-amber-400" />
                                {meal.recipe.cookingTime || 20} phút
                              </span>
                              <span className="flex items-center gap-1">
                                <Flame className="size-3 text-orange-400" />
                                ~{meal.targetCalories} kcal
                              </span>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-3">
                          {/* Recipe Quick Info & Side dishes */}
                          {meal.suggestedSideDishes && meal.suggestedSideDishes.length > 0 && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs">
                              <p className="mb-1.5 font-semibold text-primary flex items-center gap-1">
                                <Sparkles className="size-3" />
                                Món phụ gợi ý đi kèm:
                              </p>
                              <div className="space-y-1">
                                {meal.suggestedSideDishes.map((side) => (
                                  <div key={side.recipeId} className="flex items-center justify-between font-medium">
                                    <span className="truncate">• {side.recipeName}</span>
                                    <span className="text-[10px] text-muted-foreground">{side.cookingTime ? `${side.cookingTime}p` : ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRecipeForDetail(meal.recipe)}
                              className="flex-1 rounded-full text-xs"
                            >
                              <Utensils className="size-3.5" />
                              Xem chi tiết
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSwapTarget({ dayIdx: activeDayIndex, mealIdx })}
                              className="rounded-full text-xs gap-1"
                            >
                              <RefreshCw className="size-3.5 text-primary" />
                              Đổi món
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border py-24 text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ChefHat className="size-8" />
              </span>
              <div className="max-w-md">
                <h3 className="font-serif text-2xl font-bold">Chưa có kế hoạch ăn uống</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Nhập chỉ số cơ thể ở cột bên trái và bấm &quot;AI Sinh thực đơn 7 ngày&quot; để AI thiết kế kế hoạch ăn uống phù hợp dành riêng cho bạn.
                </p>
              </div>
            </div>
          )}

          {/* Saved Plans List */}
          {savedPlans.length > 0 && (
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg font-bold">Kế hoạch đã lưu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {savedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/20 p-4 transition-colors hover:bg-secondary/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/40">
                          #{plan.id}
                        </Badge>
                        <p className="font-semibold text-sm">{plan.title}</p>
                        <button
                          onClick={() => handleOpenRenameModal(plan)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md"
                          title="Đổi tên thực đơn"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tạo ngày {new Date(plan.createdAt).toLocaleDateString('vi-VN')} • Calo mục tiêu: {plan.macros.targetCalories} kcal/ngày
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSharePlan(plan)}
                        className="rounded-full text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Share2 className="size-3.5" />
                        Chia sẻ
                      </Button>
                      <Link href={`/meal-planner/${plan.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full text-xs gap-1"
                        >
                          <ExternalLink className="size-3.5" />
                          Xem chi tiết
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLoadPlan(plan)}
                        className="rounded-full text-xs gap-1"
                      >
                        <RotateCcw className="size-3.5" />
                        Tải kế hoạch
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="size-8 rounded-full p-0 text-muted-foreground hover:text-destructive"
                        title="Xóa thực đơn"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Rename Meal Plan Modal */}
      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 space-y-4">
          <DialogTitle className="font-serif text-xl font-bold flex items-center gap-2">
            <Pencil className="size-5 text-primary" />
            Đổi tên thực đơn AI
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Nhập tên mới cho thực đơn của bạn để dễ dàng quản lý và phân loại.
          </p>

          <div className="space-y-2">
            <Label htmlFor="plan-title-input" className="text-xs font-semibold">Tên thực đơn mới</Label>
            <Input
              id="plan-title-input"
              value={newPlanTitle}
              onChange={(e) => setNewPlanTitle(e.target.value)}
              placeholder="Nhập tên thực đơn..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveRenamePlan())}
              className="rounded-xl h-10 text-sm font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameTarget(null)}
              className="rounded-full text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSaveRenamePlan}
              className="rounded-full text-xs px-5 font-semibold"
            >
              Lưu tên mới
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe Swap Modal */}
      <Dialog open={Boolean(swapTarget)} onOpenChange={(open) => !open && setSwapTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogTitle className="font-serif text-xl font-bold">Chọn món thay thế</DialogTitle>
          <p className="text-xs text-muted-foreground mb-3">
            Chọn món ăn mới để thay thế cho bữa ăn hiện tại.
          </p>

          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
            {recipes.slice(0, 15).map((r) => (
              <button
                key={r.recipeId}
                onClick={() => handleSwapRecipe(r)}
                className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card p-2.5 text-left transition-colors hover:bg-muted/70"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.imageUrl || '/placeholder.svg'}
                  alt={r.recipeName}
                  className="size-12 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.recipeName}</p>
                  <p className="text-xs text-muted-foreground">{r.cookingTime ? `${r.cookingTime} phút` : 'Dễ nấu'}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog
        id={selectedRecipeForDetail ? String(selectedRecipeForDetail.recipeId) : ''}
        open={Boolean(selectedRecipeForDetail)}
        onOpenChange={(open) => !open && setSelectedRecipeForDetail(null)}
      />
    </div>
  )
}
