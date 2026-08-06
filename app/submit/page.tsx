'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  ChefHat,
  Plus,
  Trash2,
  Upload,
  ImageIcon,
  Sparkles,
  Loader2,
  ArrowLeft,
  Users,
  Clock,
  DollarSign,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createRecipe,
  getCategories,
  type Category,
} from '@/lib/api'
import { calculateRecipeNutrition } from '@/lib/calorie-calculator'
import { useAuth } from '@/components/auth-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

const DIFFICULTIES = ['Dễ', 'Trung bình', 'Khó']

export default function SubmitPage() {
  const router = useRouter()
  const { isAuthenticated, ready } = useAuth()
  const { data: categories } = useSWR('categories', getCategories)

  const [recipeName, setRecipeName] = useState('')
  const [description, setDescription] = useState('')
  const [cookingTime, setCookingTime] = useState('')
  const [difficulty, setDifficulty] = useState('Dễ')
  const [categoryId, setCategoryId] = useState('')
  const [servings, setServings] = useState('2')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')

  const [ingredients, setIngredients] = useState<{ name: string; quantity: string }[]>([
    { name: '', quantity: '' },
    { name: '', quantity: '' },
  ])
  const [steps, setSteps] = useState<string[]>(['', ''])

  const [submitting, setSubmitting] = useState(false)

  // Nutrition state
  const [nutrition, setNutrition] = useState({
    calories: '0',
    protein: '0g',
    carbs: '0g',
    fat: '0g',
    fiber: '0g',
  })

  // Auto-calculate nutrition as ingredients change
  useEffect(() => {
    const hasIngredients = ingredients.some((i) => i.name.trim())
    if (hasIngredients || recipeName.trim()) {
      const calc = calculateRecipeNutrition(
        recipeName,
        ingredients,
        parseInt(servings) || 1,
      )
      setNutrition({
        calories: String(calc.perServing.calories),
        protein: calc.perServing.protein,
        carbs: calc.perServing.carbs,
        fat: calc.perServing.fat,
        fiber: calc.perServing.fiber,
      })
    }
  }, [ingredients, recipeName, servings])

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setImageUrl(result)
      setImagePreview(result)
      toast.success('Đã tải ảnh lên thành công!')
    }
    reader.readAsDataURL(file)
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }])
  }

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length <= 1) return
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleAddStep = () => {
    setSteps([...steps, ''])
  }

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return
    setSteps(steps.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipeName.trim()) {
      toast.error('Vui lòng nhập tên công thức món ăn')
      return
    }
    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục món ăn')
      return
    }

    setSubmitting(true)

    const filledSteps = steps.filter((s) => s.trim())
    const filledIngredients = ingredients.filter((i) => i.name.trim())

    const payload = {
      recipeName: recipeName.trim(),
      description: description.trim(),
      cookingTime: parseInt(cookingTime) || 30,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
      categoryId: parseInt(categoryId) || 1,
      difficulty,
      servings: parseInt(servings) || 2,
      status: 'approved', // Auto-approved for instant demo
      ingredients: filledIngredients.length > 0 ? JSON.stringify(filledIngredients) : undefined,
      steps: filledSteps.length > 0 ? JSON.stringify(filledSteps) : undefined,
      nutritionInfo: JSON.stringify(nutrition),
    }

    const res = await createRecipe(payload)
    setSubmitting(false)

    if (res.ok) {
      toast.success('Đã đăng công thức món ăn thành công!')
      router.push('/profile?tab=products')
    } else {
      toast.error(res.message || 'Không thể đăng công thức. Vui lòng thử lại!')
    }
  }

  if (ready && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ChefHat className="size-7" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-bold">Đăng công thức mới</h1>
        <p className="mt-2 text-muted-foreground">
          Vui lòng đăng nhập tài khoản để đăng và chia sẻ công thức món ăn của bạn.
        </p>
        <Link href="/login" className={buttonVariants({ className: 'mt-6 rounded-full' })}>
          Đăng nhập ngay
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/profile?tab=products"
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách công thức
        </Link>
      </div>

      <header className="mb-10 text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ChefHat className="size-3.5" />
          Sáng tạo ẩm thực
        </div>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Đăng công thức món ăn mới</h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Chia sẻ bí quyết nấu nướng tuyệt vời của bạn với cộng đồng Facecook.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Thông tin cơ bản */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-xl font-semibold flex items-center gap-2 text-primary">
            <Sparkles className="size-5" />
            1. Thông tin chung món ăn
          </h2>

          <div className="space-y-2">
            <Label htmlFor="recipeName" className="font-medium">
              Tên món ăn <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipeName"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="VD: Phở bò tái lăn Hà Nội"
              className="rounded-xl h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-medium">
              Mô tả ngắn
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chia sẻ nguồn gốc, hương vị đặc trưng hoặc mẹo hay của món ăn..."
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="font-medium">
                Danh mục món ăn <span className="text-destructive">*</span>
              </Label>
              <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Chọn danh mục..." />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((cat: Category) => (
                    <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookingTime" className="font-medium">
                Thời gian chế biến (phút)
              </Label>
              <Input
                id="cookingTime"
                type="number"
                min="1"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                placeholder="30"
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings" className="font-medium">
                Khẩu phần (người ăn)
              </Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="2"
                className="rounded-xl h-11"
              />
            </div>
          </div>

          {/* Hình ảnh (Chụp từ máy hoặc URL) */}
          <div className="space-y-3 pt-2">
            <Label className="font-medium flex items-center justify-between">
              <span>Hình ảnh món ăn</span>
              <span className="text-xs text-muted-foreground">URL online hoặc Tải từ máy</span>
            </Label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Tải ảnh từ máy */}
              <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 p-5 text-center transition-colors hover:border-primary/50">
                <Upload className="size-8 text-primary mb-2" />
                <p className="text-xs font-semibold text-foreground">Chọn ảnh từ thiết bị của bạn</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, WEBP (tối đa 5MB)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>

              {/* Nhập URL online */}
              <div className="flex flex-col justify-center space-y-2 rounded-2xl border border-border/60 bg-card p-5">
                <Label htmlFor="imageUrl" className="text-xs font-medium flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-primary" />
                  Hoặc nhập đường dẫn URL ảnh
                </Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value)
                    setImagePreview(e.target.value)
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            {/* Live Preview Image */}
            {imagePreview && (
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-primary/30 max-h-60">
                <img
                  src={imagePreview}
                  alt="Xem trước món ăn"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-semibold text-white">
                  ✓ Ảnh hợp lệ
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nguyên liệu & Dinh dưỡng */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-xl font-semibold flex items-center gap-2 text-primary">
            <ChefHat className="size-5" />
            2. Danh sách nguyên liệu ({ingredients.length})
          </h2>

          <div className="space-y-3">
            {ingredients.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Input
                  value={item.name}
                  onChange={(e) => {
                    const next = [...ingredients]
                    next[idx].name = e.target.value
                    setIngredients(next)
                  }}
                  placeholder={`Nguyên liệu ${idx + 1} (VD: Thịt thăn bò)`}
                  className="flex-1 rounded-xl h-10"
                />
                <Input
                  value={item.quantity}
                  onChange={(e) => {
                    const next = [...ingredients]
                    next[idx].quantity = e.target.value
                    setIngredients(next)
                  }}
                  placeholder="Định lượng (VD: 300g)"
                  className="w-36 rounded-xl h-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveIngredient(idx)}
                  disabled={ingredients.length <= 1}
                  className="size-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddIngredient}
              className="rounded-full text-xs gap-2 mt-2"
            >
              <Plus className="size-3.5" />
              Thêm nguyên liệu
            </Button>
          </div>

          {/* Bảng Dinh dưỡng Tự động */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span>⚡ Dinh dưỡng tự động tính (Cho 1 khẩu phần):</span>
              <span>{nutrition.calories} kcal</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-card/60 p-2 rounded-xl border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Đạm (Protein)</span>
                <span className="font-bold">{nutrition.protein}</span>
              </div>
              <div className="bg-card/60 p-2 rounded-xl border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Tinh bột (Carbs)</span>
                <span className="font-bold">{nutrition.carbs}</span>
              </div>
              <div className="bg-card/60 p-2 rounded-xl border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Chất béo (Fat)</span>
                <span className="font-bold">{nutrition.fat}</span>
              </div>
              <div className="bg-card/60 p-2 rounded-xl border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Chất xơ (Fiber)</span>
                <span className="font-bold">{nutrition.fiber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Các bước chế biến */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-xl font-semibold flex items-center gap-2 text-primary">
            <Clock className="size-5" />
            3. Các bước thực hiện ({steps.length})
          </h2>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary mt-1">
                  {idx + 1}
                </span>
                <Textarea
                  value={step}
                  onChange={(e) => {
                    const next = [...steps]
                    next[idx] = e.target.value
                    setSteps(next)
                  }}
                  placeholder={`Mô tả chi tiết bước ${idx + 1}...`}
                  rows={2}
                  className="flex-1 rounded-xl resize-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveStep(idx)}
                  disabled={steps.length <= 1}
                  className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-1"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddStep}
              className="rounded-full text-xs gap-2"
            >
              <Plus className="size-3.5" />
              Thêm bước thực hiện
            </Button>
          </div>
        </div>

        {/* Nút Hoàn tất đăng */}

        {/* Nút Hoàn tất đăng */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/profile?tab=products"
            className={buttonVariants({ variant: 'outline', className: 'rounded-full px-6' })}
          >
            Hủy bỏ
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full px-8 gap-2 font-semibold shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Hoàn tất & Đăng công thức
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}