'use client'

import { use, useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  Calculator,
  Calendar,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Lock,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Share2,
  Copy,
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
  getMealPlanById,
  getNextMealPlanId,
  saveMealPlan,
  deleteSavedMealPlan,
  updateMealPlanTitle,
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

export default function SingleMealPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const planId = resolvedParams.id
  const router = useRouter()
  const { isAuthenticated, userId, fullName } = useAuth()

  const { data: recipes = [] } = useSWR('all-recipes-planner', getAllRecipes, {
    revalidateOnFocus: false,
  })

  const [plan, setPlan] = useState<SavedMealPlan | null>(null)
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null)
  const [swapTarget, setSwapTarget] = useState<{ dayIdx: number; mealIdx: number } | null>(null)
  const [renameTarget, setRenameTarget] = useState<boolean>(false)
  const [newPlanTitle, setNewPlanTitle] = useState('')

  useEffect(() => {
    if (planId) {
      const found = getMealPlanById(planId)
      if (found) {
        setPlan(found)
        setNewPlanTitle(found.title)
      }
    }
  }, [planId])

  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ChefHat className="size-8" />
        </span>
        <h2 className="font-serif text-2xl font-bold">Không tìm thấy thực đơn #{planId}</h2>
        <p className="text-sm text-muted-foreground">
          Thực đơn này không tồn tại hoặc đã bị xóa.
        </p>
        <Link href="/meal-planner">
          <Button className="mt-2 rounded-full gap-2">
            <ArrowLeft className="size-4" />
            Về trang Lập kế hoạch 7 ngày
          </Button>
        </Link>
      </div>
    )
  }

  const isOwner = isAuthenticated && plan.userId && String(plan.userId) === String(userId)

  const handleSaveAsYours = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu thực đơn này vào tài khoản của bạn!')
      return
    }

    const newId = getNextMealPlanId()
    const newCopy: SavedMealPlan = {
      ...plan,
      id: newId,
      userId: userId || undefined,
      authorName: fullName || undefined,
      title: `${plan.title} (Bản sao của tôi)`,
      createdAt: new Date().toISOString(),
    }

    saveMealPlan(newCopy)
    toast.success(`Đã lưu thành công vào danh sách của bạn với ID mới: #${newId}!`)
    router.push(`/meal-planner/${newId}`)
  }

  const handleShareCurrentPlan = () => {
    if (!plan) return
    const url = `${window.location.origin}/meal-planner/${plan.id}`
    navigator.clipboard.writeText(url)
    toast.success(`Đã sao chép liên kết chia sẻ thực đơn #${plan.id} (${url})!`)
  }

  const handleSwapRecipe = (newRecipe: Recipe) => {
    if (!isOwner || !swapTarget || !plan) return
    const updatedDays = [...plan.days]
    const day = { ...updatedDays[swapTarget.dayIdx] }
    const meals = [...day.meals]
    meals[swapTarget.mealIdx] = {
      ...meals[swapTarget.mealIdx],
      recipe: newRecipe,
    }
    day.meals = meals
    updatedDays[swapTarget.dayIdx] = day

    const updatedPlan = { ...plan, days: updatedDays }
    setPlan(updatedPlan)
    saveMealPlan(updatedPlan)
    setSwapTarget(null)
    toast.success('Đã đổi món thành công!')
  }

  const handleSaveRenamePlan = () => {
    if (!isOwner || !newPlanTitle.trim()) return
    const updatedPlan = { ...plan, title: newPlanTitle.trim() }
    setPlan(updatedPlan)
    updateMealPlanTitle(plan.id, newPlanTitle.trim())
    setRenameTarget(false)
    toast.success('Đã đổi tên thực đơn thành công!')
  }

  const activeDay = plan.days[activeDayIndex] || plan.days[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/meal-planner"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Tất cả thực đơn 7 ngày
        </Link>
        <Badge variant="outline" className="text-xs font-medium px-3 py-1">
          Thực đơn ID: #{plan.id}
        </Badge>
      </div>

      {/* Shared Read-Only Banner if NOT Owner */}
      {!isOwner && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Lock className="size-5" />
            </span>
            <div>
              <h3 className="font-serif text-sm font-bold text-amber-700 dark:text-amber-300">
                Chế độ Xem thực đơn chia sẻ
              </h3>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Đây là thực đơn của <strong>{plan.authorName || 'thành viên khác'}</strong>. Bạn có thể xem chi tiết nhưng không thể chỉnh sửa bản gốc.
              </p>
            </div>
          </div>
          <Button
            onClick={handleSaveAsYours}
            className="rounded-full gap-2 text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 shrink-0"
          >
            <Copy className="size-4" />
            Lưu thành thực đơn của bạn
          </Button>
        </div>
      )}

      {/* Main Plan Title Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Kế hoạch #{plan.id}
            </span>
            {isOwner && (
              <button
                onClick={() => setRenameTarget(true)}
                className="text-muted-foreground hover:text-primary transition-colors p-1"
                title="Đổi tên"
              >
                <Pencil className="size-4" />
              </button>
            )}
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            {plan.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Tạo ngày {new Date(plan.createdAt).toLocaleDateString('vi-VN')} • Calo mục tiêu: <strong>{plan.macros.targetCalories} kcal/ngày</strong> • Cho <strong>{plan.servings} người</strong>
          </p>
        </div>

        {isOwner ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShareCurrentPlan} className="rounded-full gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10">
              <Share2 className="size-3.5" />
              Chia sẻ liên kết
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRenameTarget(true)} className="rounded-full gap-1.5 text-xs">
              <Pencil className="size-3.5" />
              Đổi tên
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShareCurrentPlan} className="rounded-full gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10">
              <Share2 className="size-3.5" />
              Chia sẻ
            </Button>
            <Button onClick={handleSaveAsYours} className="rounded-full gap-2 text-xs font-semibold">
              <Copy className="size-4" />
              Tạo bản sao chỉnh sửa (ID mới)
            </Button>
          </div>
        )}
      </div>

      {/* 7-Day Interactive Schedule */}
      <div className="space-y-6">
        {/* Day Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card p-3">
          <div className="flex flex-wrap items-center gap-1">
            {plan.days.map((day, idx) => (
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
          <div className="text-xs text-muted-foreground px-2 font-medium">
            Tổng: {activeDay.totalCalories} kcal
          </div>
        </div>

        {/* Active Day Schedule */}
        {activeDay && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div>
                <h3 className="font-serif text-xl font-bold">
                  {activeDay.dayName} — Thực đơn bữa ăn
                </h3>
                <p className="text-xs text-muted-foreground">
                  Phần ăn tính cho: <strong>{plan.servings} người</strong>
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tổng calo ngày</p>
                <p className="text-lg font-bold text-primary">{activeDay.totalCalories} kcal</p>
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
                      {isOwner && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSwapTarget({ dayIdx: activeDayIndex, mealIdx })}
                          className="rounded-full text-xs gap-1"
                        >
                          <RefreshCw className="size-3.5 text-primary" />
                          Đổi món
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recipe Detail Dialog */}
      {selectedRecipeForDetail && (
        <RecipeDetailDialog
          recipe={selectedRecipeForDetail}
          open={Boolean(selectedRecipeForDetail)}
          onOpenChange={(op) => !op && setSelectedRecipeForDetail(null)}
        />
      )}

      {/* Rename Modal */}
      <Dialog open={renameTarget} onOpenChange={setRenameTarget}>
        <DialogContent className="max-w-md rounded-2xl p-6 space-y-4">
          <DialogTitle className="font-serif text-xl font-bold flex items-center gap-2">
            <Pencil className="size-5 text-primary" />
            Đổi tên thực đơn
          </DialogTitle>
          <div className="space-y-2">
            <Label htmlFor="plan-rename-input" className="text-xs font-semibold">Tên thực đơn mới</Label>
            <Input
              id="plan-rename-input"
              value={newPlanTitle}
              onChange={(e) => setNewPlanTitle(e.target.value)}
              placeholder="Nhập tên thực đơn mới..."
              className="rounded-xl h-10 text-sm font-medium"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRenameTarget(false)} className="rounded-full text-xs">
              Hủy
            </Button>
            <Button onClick={handleSaveRenamePlan} className="rounded-full text-xs px-5 font-semibold">
              Lưu tên
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
                  <p className="truncate text-xs font-bold">{r.recipeName}</p>
                  <p className="text-[11px] text-muted-foreground">{r.cookingTime || 20} phút • {r.difficulty || 'Dễ'}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
