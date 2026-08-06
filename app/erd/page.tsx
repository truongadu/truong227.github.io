import { Key, Link } from "lucide-react"

interface Column {
  name: string
  type: string
  pk?: boolean
  fk?: string
  nullable?: boolean
}

interface TableDef {
  name: string
  viName: string
  color: string
  columns: Column[]
}

const tables: TableDef[] = [
  {
    name: "Users",
    viName: "Người dùng",
    color: "border-amber-500",
    columns: [
      { name: "UserId", type: "INT", pk: true },
      { name: "FullName", type: "NVARCHAR(200)" },
      { name: "Email", type: "NVARCHAR(256)" },
      { name: "PasswordHash", type: "NVARCHAR(MAX)" },
      { name: "AvatarUrl", type: "NVARCHAR(MAX)", nullable: true },
      { name: "Role", type: "NVARCHAR(50)" },
      { name: "CreatedAt", type: "DATETIME", nullable: true },
    ],
  },
  {
    name: "Categories",
    viName: "Danh mục",
    color: "border-emerald-500",
    columns: [
      { name: "CategoryId", type: "INT", pk: true },
      { name: "CategoryName", type: "NVARCHAR(100)" },
    ],
  },
  {
    name: "Ingredients",
    viName: "Nguyên liệu",
    color: "border-emerald-500",
    columns: [
      { name: "IngredientId", type: "INT", pk: true },
      { name: "IngredientName", type: "NVARCHAR(200)" },
      { name: "Price", type: "DECIMAL(18,2)" },
    ],
  },
  {
    name: "Recipes",
    viName: "Công thức",
    color: "border-orange-500",
    columns: [
      { name: "RecipeId", type: "INT", pk: true },
      { name: "UserId", type: "INT", fk: "Users.UserId", nullable: true },
      { name: "CategoryId", type: "INT", fk: "Categories.CategoryId" },
      { name: "RecipeName", type: "NVARCHAR(200)" },
      { name: "Description", type: "NVARCHAR(MAX)", nullable: true },
      { name: "ImageUrl", type: "NVARCHAR(MAX)", nullable: true },
      { name: "CookingTime", type: "INT" },
      { name: "Difficulty", type: "NVARCHAR(50)", nullable: true },
      { name: "Servings", type: "INT", nullable: true },
      { name: "Steps", type: "NVARCHAR(MAX)", nullable: true },
      { name: "NutritionInfo", type: "NVARCHAR(MAX)", nullable: true },
      { name: "Status", type: "NVARCHAR(50)" },
      { name: "EatingOutPrice", type: "DECIMAL(18,2)" },
      { name: "TotalIngredientCost", type: "DECIMAL(18,2)" },
    ],
  },
  {
    name: "RecipeIngredients",
    viName: "Nguyên liệu CT",
    color: "border-sky-500",
    columns: [
      { name: "RecipeIngredientId", type: "INT", pk: true },
      { name: "RecipeId", type: "INT", fk: "Recipes.RecipeId" },
      { name: "IngredientId", type: "INT", fk: "Ingredients.IngredientId" },
      { name: "Quantity", type: "NVARCHAR(MAX)" },
    ],
  },
  {
    name: "RecipeSteps",
    viName: "Các bước nấu",
    color: "border-sky-500",
    columns: [
      { name: "StepId", type: "INT", pk: true },
      { name: "RecipeId", type: "INT", fk: "Recipes.RecipeId" },
      { name: "StepNumber", type: "INT" },
      { name: "Instruction", type: "NVARCHAR(MAX)" },
    ],
  },
  {
    name: "Products",
    viName: "Sản phẩm",
    color: "border-orange-500",
    columns: [
      { name: "ProductId", type: "INT", pk: true },
      { name: "RecipeId", type: "INT", fk: "Recipes.RecipeId" },
      { name: "UserId", type: "INT", fk: "Users.UserId" },
      { name: "Price", type: "DECIMAL(18,2)" },
      { name: "Unit", type: "NVARCHAR(50)" },
      { name: "Description", type: "NVARCHAR(MAX)", nullable: true },
      { name: "IsAvailable", type: "BIT" },
      { name: "TotalSold", type: "INT" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
    ],
  },
  {
    name: "Orders",
    viName: "Đơn hàng",
    color: "border-orange-500",
    columns: [
      { name: "OrderId", type: "INT", pk: true },
      { name: "ProductId", type: "INT", fk: "Products.ProductId" },
      { name: "BuyerUserId", type: "INT", fk: "Users.UserId" },
      { name: "SellerUserId", type: "INT", fk: "Users.UserId" },
      { name: "Quantity", type: "INT" },
      { name: "TotalPrice", type: "DECIMAL(18,2)" },
      { name: "Status", type: "NVARCHAR(50)" },
      { name: "Note", type: "NVARCHAR(MAX)", nullable: true },
      { name: "PaymentMethod", type: "NVARCHAR(50)" },
      { name: "PaymentStatus", type: "NVARCHAR(50)" },
      { name: "PaymentProofUrl", type: "NVARCHAR(MAX)", nullable: true },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
    ],
  },
  {
    name: "BankAccounts",
    viName: "Tài khoản NH",
    color: "border-orange-500",
    columns: [
      { name: "BankAccountId", type: "INT", pk: true },
      { name: "UserId", type: "INT", fk: "Users.UserId" },
      { name: "BankName", type: "NVARCHAR(MAX)" },
      { name: "AccountNumber", type: "NVARCHAR(MAX)" },
      { name: "AccountHolder", type: "NVARCHAR(MAX)" },
      { name: "Branch", type: "NVARCHAR(MAX)", nullable: true },
      { name: "IsDefault", type: "BIT" },
      { name: "QrCodeUrl", type: "NVARCHAR(MAX)", nullable: true },
    ],
  },
  {
    name: "BadWords",
    viName: "Từ cấm",
    color: "border-red-500",
    columns: [
      { name: "BadWordId", type: "INT", pk: true },
      { name: "Word", type: "NVARCHAR(MAX)" },
      { name: "CreatedAt", type: "DATETIME" },
    ],
  },
  {
    name: "Comments",
    viName: "Bình luận",
    color: "border-violet-500",
    columns: [
      { name: "CommentId", type: "INT", pk: true },
      { name: "UserId", type: "INT", fk: "Users.UserId" },
      { name: "RecipeId", type: "INT", fk: "Recipes.RecipeId" },
      { name: "Content", type: "NVARCHAR(MAX)" },
      { name: "FullName", type: "NVARCHAR(200)", nullable: true },
      { name: "CreatedAt", type: "DATETIME", nullable: true },
    ],
  },
  {
    name: "Ratings",
    viName: "Đánh giá",
    color: "border-violet-500",
    columns: [
      { name: "RatingId", type: "INT", pk: true },
      { name: "UserId", type: "INT", fk: "Users.UserId" },
      { name: "RecipeId", type: "INT", fk: "Recipes.RecipeId" },
      { name: "Score", type: "INT" },
      { name: "CreatedAt", type: "DATETIME", nullable: true },
    ],
  },
  {
    name: "Favorites",
    viName: "Yêu thích",
    color: "border-violet-500",
    columns: [
      { name: "FavoriteId", type: "INT", pk: true },
      { name: "UserId", type: "INT", fk: "Users.UserId" },
      { name: "RecipeId", type: "INT", fk: "Recipes.RecipeId" },
      { name: "CreatedAt", type: "DATETIME", nullable: true },
    ],
  },
  {
    name: "ShoppingLists",
    viName: "DS mua sắm",
    color: "border-rose-500",
    columns: [
      { name: "ShoppingListId", type: "INT", pk: true },
      { name: "UserId", type: "INT", fk: "Users.UserId" },
      { name: "ListName", type: "NVARCHAR(200)" },
      { name: "CreatedAt", type: "DATETIME", nullable: true },
    ],
  },
  {
    name: "ShoppingListItems",
    viName: "Mục mua sắm",
    color: "border-rose-500",
    columns: [
      { name: "ItemId", type: "INT", pk: true },
      { name: "ShoppingListId", type: "INT", fk: "ShoppingLists.ShoppingListId" },
      { name: "IngredientId", type: "INT", fk: "Ingredients.IngredientId", nullable: true },
      { name: "Quantity", type: "FLOAT" },
      { name: "IsPurchased", type: "BIT" },
      { name: "CustomName", type: "NVARCHAR(MAX)", nullable: true },
    ],
  },
  {
    name: "Friends",
    viName: "Bạn bè",
    color: "border-cyan-500",
    columns: [
      { name: "FriendId", type: "INT", pk: true },
      { name: "UserId", type: "INT", fk: "Users.UserId" },
      { name: "FriendUserId", type: "INT", fk: "Users.UserId" },
      { name: "Status", type: "NVARCHAR(50)" },
      { name: "CreatedAt", type: "DATETIME", nullable: true },
    ],
  },
  {
    name: "SharedRecipes",
    viName: "Chia sẻ CT",
    color: "border-cyan-500",
    columns: [
      { name: "ShareId", type: "INT", pk: true },
      { name: "FromUserId", type: "INT", fk: "Users.UserId" },
      { name: "ToUserId", type: "INT", fk: "Users.UserId" },
      { name: "RecipeId", type: "INT", fk: "Recipes.RecipeId" },
      { name: "Message", type: "NVARCHAR(MAX)", nullable: true },
      { name: "IsRead", type: "BIT" },
      { name: "CreatedAt", type: "DATETIME", nullable: true },
    ],
  },
]

const relationships = [
  { from: "Recipes.UserId", to: "Users.UserId", label: "N:1" },
  { from: "Recipes.CategoryId", to: "Categories.CategoryId", label: "N:1" },
  { from: "RecipeIngredients.RecipeId", to: "Recipes.RecipeId", label: "N:1" },
  { from: "RecipeIngredients.IngredientId", to: "Ingredients.IngredientId", label: "N:1" },
  { from: "RecipeSteps.RecipeId", to: "Recipes.RecipeId", label: "N:1" },
  { from: "Comments.UserId", to: "Users.UserId", label: "N:1" },
  { from: "Comments.RecipeId", to: "Recipes.RecipeId", label: "N:1" },
  { from: "Ratings.UserId", to: "Users.UserId", label: "N:1" },
  { from: "Ratings.RecipeId", to: "Recipes.RecipeId", label: "N:1" },
  { from: "Favorites.UserId", to: "Users.UserId", label: "N:1" },
  { from: "Favorites.RecipeId", to: "Recipes.RecipeId", label: "N:1" },
  { from: "ShoppingLists.UserId", to: "Users.UserId", label: "N:1" },
  { from: "ShoppingListItems.ShoppingListId", to: "ShoppingLists.ShoppingListId", label: "N:1" },
  { from: "ShoppingListItems.IngredientId", to: "Ingredients.IngredientId", label: "N:1" },
  { from: "Friends.UserId", to: "Users.UserId", label: "N:1" },
  { from: "Friends.FriendUserId", to: "Users.UserId", label: "N:1" },
  { from: "SharedRecipes.FromUserId", to: "Users.UserId", label: "N:1" },
  { from: "SharedRecipes.ToUserId", to: "Users.UserId", label: "N:1" },
  { from: "SharedRecipes.RecipeId", to: "Recipes.RecipeId", label: "N:1" },
  { from: "Products.RecipeId", to: "Recipes.RecipeId", label: "N:1" },
  { from: "Products.UserId", to: "Users.UserId", label: "N:1" },
  { from: "Orders.ProductId", to: "Products.ProductId", label: "N:1" },
  { from: "Orders.BuyerUserId", to: "Users.UserId", label: "N:1" },
  { from: "Orders.SellerUserId", to: "Users.UserId", label: "N:1" },
  { from: "BankAccounts.UserId", to: "Users.UserId", label: "N:1" },
]

function TableCard({ table }: { table: TableDef }) {
  return (
    <div className={`bg-card rounded-lg border-t-4 ${table.color} border border-border overflow-hidden`}>
      <div className="px-4 py-3 bg-muted/40 border-b border-border">
        <p className="font-semibold text-foreground text-sm font-mono">{table.name}</p>
        <p className="text-xs text-muted-foreground">{table.viName}</p>
      </div>
      <div className="divide-y divide-border/50">
        {table.columns.map((col) => (
          <div key={col.name} className="flex items-center gap-2 px-4 py-2 hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-1 w-5 shrink-0">
              {col.pk && (
                <Key className="w-3 h-3 text-amber-400" />
              )}
              {col.fk && !col.pk && (
                <Link className="w-3 h-3 text-sky-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-mono ${col.pk ? "text-amber-400 font-semibold" : col.fk ? "text-sky-400" : "text-foreground"}`}>
                {col.name}
              </span>
              {col.nullable && <span className="text-muted-foreground text-xs ml-1">?</span>}
            </div>
            <span className="text-xs text-muted-foreground font-mono shrink-0">{col.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ERDPage() {
  const pkCount = tables.reduce((acc, t) => acc + t.columns.filter((c) => c.pk).length, 0)
  const fkCount = tables.reduce((acc, t) => acc + t.columns.filter((c) => c.fk).length, 0)
  const colCount = tables.reduce((acc, t) => acc + t.columns.length, 0)

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-serif text-foreground mb-1">
            Entity Relationship Diagram
          </h1>
          <p className="text-muted-foreground text-sm">CookingAppDB — SQL Server</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Bảng", value: tables.length },
            { label: "Cột", value: colCount },
            { label: "Khóa chính (PK)", value: pkCount },
            { label: "Khóa ngoại (FK)", value: fkCount },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg px-5 py-4">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-8 text-xs">
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-mono">PK</span>
            <span className="text-muted-foreground">Primary Key</span>
          </div>
          <div className="flex items-center gap-2">
            <Link className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-400 font-mono">FK</span>
            <span className="text-muted-foreground">Foreign Key</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono">?</span>
            <span className="text-muted-foreground">Nullable</span>
          </div>
        </div>

        {/* Color groups */}
        <div className="flex flex-wrap gap-3 mb-8 text-xs">
          {[
            { color: "bg-amber-500", label: "Users" },
            { color: "bg-emerald-500", label: "Categories / Ingredients" },
            { color: "bg-orange-500", label: "Recipes / Products / Orders / Bank" },
            { color: "bg-sky-500", label: "Recipe Details" },
            { color: "bg-violet-500", label: "User Activity" },
            { color: "bg-rose-500", label: "Shopping" },
            { color: "bg-cyan-500", label: "Social" },
          { color: "bg-red-500", label: "BadWords" },
          ].map((g) => (
            <div key={g.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${g.color}`} />
              <span className="text-muted-foreground">{g.label}</span>
            </div>
          ))}
        </div>

        {/* Tables grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {tables.map((table) => (
            <TableCard key={table.name} table={table} />
          ))}
        </div>

        {/* Relationships table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Quan hệ giữa các bảng</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{relationships.length} foreign key relationships</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">#</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Bảng con (FK)</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Quan hệ</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Bảng cha (PK)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {relationships.map((rel, i) => {
                  const [fromTable, fromCol] = rel.from.split(".")
                  const [toTable, toCol] = rel.to.split(".")
                  return (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs text-orange-400">{fromTable}</span>
                        <span className="text-muted-foreground text-xs">.</span>
                        <span className="font-mono text-xs text-sky-400">{fromCol}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">{rel.label}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs text-orange-400">{toTable}</span>
                        <span className="text-muted-foreground text-xs">.</span>
                        <span className="font-mono text-xs text-amber-400">{toCol}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
