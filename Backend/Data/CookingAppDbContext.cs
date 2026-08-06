using Microsoft.EntityFrameworkCore;
using CookingApp.API.Models;

namespace CookingApp.API.Data;

public class CookingAppDbContext : DbContext
{
    public CookingAppDbContext(DbContextOptions<CookingAppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<RecipeStep> RecipeSteps => Set<RecipeStep>();
    public DbSet<ShoppingList> ShoppingLists => Set<ShoppingList>();
    public DbSet<ShoppingListItem> ShoppingListItems => Set<ShoppingListItem>();
    public DbSet<Friend> Friends => Set<Friend>();
    public DbSet<SharedRecipe> SharedRecipes => Set<SharedRecipe>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<BadWord> BadWords => Set<BadWord>();
}