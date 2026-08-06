using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Services;
using CookingApp.API.Middleware;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddScoped<JwtService>();

builder.Services.AddDbContext<CookingAppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Tu dong tao database file .db va seed du lieu admin mac dinh
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<CookingAppDbContext>();
    ctx.Database.EnsureCreated();

    // Ensure feed recipes 9001 and 9002 exist in database
    if (!ctx.Recipes.Any(r => r.RecipeId == 9001))
    {
        ctx.Recipes.Add(new CookingApp.API.Models.Recipe
        {
            RecipeId = 9001,
            RecipeName = "Phở Bò Truyền Thống Hà Nội",
            Description = "Món Phở bò Hà Nội chuẩn vị truyền thống với nước dùng thanh ngọt từ xương ống ninh 8 tiếng, quế, hồi, thảo quả ngào ngạt.",
            CategoryId = 1,
            CookingTime = 120,
            Difficulty = "Khó",
            Servings = 4,
            ImageUrl = "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80",
            Steps = "[\"Rửa sạch xương ống bò, chần qua nước sôi 5 phút rồi rửa lại.\",\"Ninh xương ống với 3 lít nước trong 6-8 tiếng cùng củ hành nướng và gừng nướng.\",\"Rang thơm quế, hồi, thảo quả rồi cho vào túi lọc thả vào nồi nước dùng.\",\"Trần bánh phở qua nước sôi rồi xếp vào tô, thêm thịt bò nạm, bò tái và hành lá.\",\"Chan nước dùng nóng hổi vào tô và thưởng thức cùng chanh, ớt, giấm tỏi.\"]",
            NutritionInfo = "{\"calories\":450,\"protein\":\"30g\",\"carbs\":\"55g\",\"fat\":\"12g\",\"fiber\":\"2g\"}",
            Status = "approved",
            UserId = 1
        });
    }

    if (!ctx.Recipes.Any(r => r.RecipeId == 9002))
    {
        ctx.Recipes.Add(new CookingApp.API.Models.Recipe
        {
            RecipeId = 9002,
            RecipeName = "Bún Chả Hà Nội Nướng Than Hoa",
            Description = "Bún chả Hà Nội đậm đà vị thịt nướng thơm lừng than hoa, ăn kèm bún tươi, nước mắm đu đủ chua ngọt và rau sống băm nhỏ.",
            CategoryId = 1,
            CookingTime = 45,
            Difficulty = "Trung bình",
            Servings = 3,
            ImageUrl = "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80",
            Steps = "[\"Ướp thịt ba chỉ thái mỏng và thịt viên với nước mắm, đường, sả, hành tím băm 30 phút.\",\"Nướng thịt trên bếp than hoa cho đến khi thơm lừng và cháy xém cạnh.\",\"Pha nước mắm chua ngọt với đường, dấm, tỏi ớt và đu đủ xanh ngâm giấm.\",\"Bày bún tươi và rau sống ra đĩa, thả chả nướng nóng hổi vào bát nước mắm và thưởng thức.\"]",
            NutritionInfo = "{\"calories\":520,\"protein\":\"28g\",\"carbs\":\"60g\",\"fat\":\"18g\",\"fiber\":\"3g\"}",
            Status = "approved",
            UserId = 2
        });
    }
    ctx.SaveChanges();
}

app.Run();