using DoAn2_BackEnd.BLL;
using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Trả về camelCase để match với TypeScript frontend
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "DoAn2_BackEnd";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "DoAn2_FrontEnd";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

// Register DAL (Repository Layer)
builder.Services.AddScoped<ITaiKhoanRepository, TaiKhoanRepository>();
builder.Services.AddScoped<INguoiDungRepository, NguoiDungRepository>();
builder.Services.AddScoped<IHoaSiRepository, HoaSiRepository>();
builder.Services.AddScoped<IDanhMucRepository, DanhMucRepository>();
builder.Services.AddScoped<ITacPhamRepository, TacPhamRepository>();
builder.Services.AddScoped<IGioHangRepository, GioHangRepository>();
builder.Services.AddScoped<IDonHangRepository, DonHangRepository>();
builder.Services.AddScoped<IThanhToanRepository, ThanhToanRepository>();
builder.Services.AddScoped<IBaiVietRepository, BaiVietRepository>();
builder.Services.AddScoped<INoiDungRepository, NoiDungRepository>();
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<IChiTietTacPhamRepository, ChiTietTacPhamRepository>();
builder.Services.AddScoped<ITacPhamChinhSuaRepository, TacPhamChinhSuaRepository>();
builder.Services.AddScoped<IYeuThichRepository, YeuThichRepository>();

// Register BLL (Business Layer)
builder.Services.AddScoped<IAuthBusiness, AuthBusiness>();
builder.Services.AddScoped<IKhachHangBusiness, KhachHangBusiness>();
builder.Services.AddScoped<IHoaSiBusiness, HoaSiBusiness>();
builder.Services.AddScoped<IAdminBusiness, AdminBusiness>();
builder.Services.AddScoped<IContentBusiness, ContentBusiness>();
builder.Services.AddScoped<IChiTietTacPhamBusiness, ChiTietTacPhamBusiness>();

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Hệ Thống Bán Tranh API", Version = "v1" });
    
    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Fix lỗi 500 Swagger khi có class trùng tên
    c.CustomSchemaIds(x => x.FullName);
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// app.UseHttpsRedirection(); // Disabled to avoid CORS preflight redirect issues in dev

app.UseExceptionHandlingMiddleware();



app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
