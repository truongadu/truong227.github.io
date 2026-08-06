'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Search, X, Clock, Flame, Star, ChefHat } from 'lucide-react'
import { getAllRecipes, Recipe } from '@/lib/api'
import { removeVietnameseTones } from '@/lib/ai-planner'
import { Input } from '@/components/ui/input'
import { RecipeDetailDialog } from '@/components/recipe-detail-dialog'

export function LiveSearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch recipes
  const { data: recipes = [] } = useSWR('live-search-recipes', getAllRecipes, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter recipes (Vietnamese accent-insensitive & fuzzy match)
  const filteredRecipes = debouncedQuery
    ? recipes.filter((r) => {
        const cleanQuery = removeVietnameseTones(debouncedQuery)
        const cleanName = removeVietnameseTones(r.recipeName || '')
        const cleanDesc = removeVietnameseTones(r.description || '')
        return cleanName.includes(cleanQuery) || cleanDesc.includes(cleanQuery)
      }).slice(0, 6)
    : []

  const handleSelectRecipe = (recipe: Recipe) => {
    setIsOpen(false)
    setQuery('')
    setSelectedRecipe(recipe)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm sm:max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true)
          }}
          placeholder="Tìm món ăn (vd: gà, bún, bò)..."
          className="h-9 rounded-full bg-secondary/60 pl-9 pr-8 text-xs transition-colors focus:bg-background sm:text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute right-2.5 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Popup */}
      {isOpen && debouncedQuery && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-border/80 bg-popover p-2 shadow-xl backdrop-blur">
          {filteredRecipes.length > 0 ? (
            <div className="space-y-1">
              <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Kết quả tìm kiếm ({filteredRecipes.length})
              </p>
              {filteredRecipes.map((recipe) => {
                let calories = null
                if (recipe.nutritionInfo) {
                  try {
                    const parsed = JSON.parse(recipe.nutritionInfo)
                    if (parsed.calories) calories = parsed.calories
                  } catch {}
                }

                return (
                  <button
                    key={recipe.recipeId}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/70"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {recipe.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.recipeName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-primary/10 text-primary">
                          <ChefHat className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {recipe.recipeName}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        {recipe.cookingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-primary" />
                            {recipe.cookingTime} phút
                          </span>
                        )}
                        {calories && (
                          <span className="flex items-center gap-1">
                            <Flame className="size-3 text-amber-500" />
                            {calories} kcal
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          4.8
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Không tìm thấy món ăn phù hợp với &quot;{debouncedQuery}&quot;
            </div>
          )}
        </div>
      )}

      {/* Recipe detail dialog when clicked */}
      <RecipeDetailDialog
        recipe={selectedRecipe}
        open={Boolean(selectedRecipe)}
        onOpenChange={(open) => {
          if (!open) setSelectedRecipe(null)
        }}
      />
    </div>
  )
}
