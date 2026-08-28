using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace DoAn2_BackEnd.BLL;

public class AuthBusiness : IAuthBusiness
{
    private readonly ITaiKhoanRepository _taiKhoanRepo;
    private readonly INguoiDungRepository _nguoiDungRepo;
    private readonly IHoaSiRepository _hoaSiRepo;
    private readonly IGioHangRepository _gioHangRepo;
    private readonly IConfiguration _configuration;

    public AuthBusiness(
        ITaiKhoanRepository taiKhoanRepo,
        INguoiDungRepository nguoiDungRepo,
        IHoaSiRepository hoaSiRepo,
        IGioHangRepository gioHangRepo,
        IConfiguration configuration)
    {
        _taiKhoanRepo = taiKhoanRepo;
        _nguoiDungRepo = nguoiDungRepo;
        _hoaSiRepo = hoaSiRepo;
        _gioHangRepo = gioHangRepo;
        _configuration = configuration;
    }

    public async Task<DangNhapResponse> DangNhap(DangNhapRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenDangNhap) || string.IsNullOrWhiteSpace(request.MatKhau))
        {
            return new DangNhapResponse
            {
                Success = false,
                Message = "Tên đăng nhập và mật khẩu không được để trống"
            };
        }

        var tenDangNhap = request.TenDangNhap.Trim();
        var taiKhoan = await _taiKhoanRepo.GetByTenDangNhap(tenDangNhap);
        
        if (taiKhoan == null)
        {
            return new DangNhapResponse
            {
                Success = false,
                Message = "Tên đăng nhập không tồn tại"
            };
        }

        if (!taiKhoan.TrangThai)
        {
            return new DangNhapResponse
            {
                Success = false,
                Message = "Tài khoản đã bị khóa"
            };
        }

        if (!BCrypt.Net.BCrypt.Verify(request.MatKhau, taiKhoan.MatKhau))
        {
            return new DangNhapResponse
            {
                Success = false,
                Message = "Mật khẩu không đúng"
            };
        }

        var userInfo = await GetUserInfo(taiKhoan);
        var token = GenerateJwtToken(taiKhoan, userInfo);
        var refreshToken = GenerateRefreshToken();

        return new DangNhapResponse
        {
            Success = true,
            Message = "Đăng nhập thành công",
            Token = token,
            RefreshToken = refreshToken,
            User = userInfo
        };
    }

    public async Task<DangNhapResponse> DangKy(DangKyRequest request)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.TenDangNhap))
        {
            return new DangNhapResponse { Success = false, Message = "Tên đăng nhập không được để trống" };
        }
        if (string.IsNullOrWhiteSpace(request.MatKhau) || request.MatKhau.Length < 6)
        {
            return new DangNhapResponse { Success = false, Message = "Mật khẩu phải có ít nhất 6 ký tự" };
        }
        if (string.IsNullOrWhiteSpace(request.Ten))
        {
            return new DangNhapResponse { Success = false, Message = "Họ tên không được để trống" };
        }
        if (request.VaiTro != 1)
        {
            return new DangNhapResponse
            {
                Success = false,
                Message = "Chỉ tài khoản người dùng được đăng ký công khai. Tài khoản tác giả/họa sĩ do quản trị viên tạo."
            };
        }

        var tenDangNhap = request.TenDangNhap.Trim();

        // Kiểm tra tên đăng nhập đã tồn tại
        if (await _taiKhoanRepo.CheckTenDangNhapExists(tenDangNhap))
        {
            return new DangNhapResponse
            {
                Success = false,
                Message = "Tên đăng nhập đã tồn tại"
            };
        }

        // Mã hóa mật khẩu
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.MatKhau);

        // Tạo tài khoản
        var taiKhoan = new TaiKhoan
        {
            TenDangNhap = tenDangNhap,
            MatKhau = hashedPassword,
            VaiTro = request.VaiTro,
            TrangThai = true
        };

        var maTaiKhoan = await _taiKhoanRepo.Create(taiKhoan);
        taiKhoan.MaTaiKhoan = maTaiKhoan;

        // Tạo thông tin người dùng (chỉ vaiTro = 1)
        var nguoiDung = new NguoiDung
        {
            MaTaiKhoan = maTaiKhoan,
            Ten = request.Ten.Trim(),
            Email = request.Email?.Trim(),
            DienThoai = request.DienThoai?.Trim(),
            DiaChi = request.DiaChi?.Trim()
        };
        var maNguoiDung = await _nguoiDungRepo.Create(nguoiDung);

        // Tạo giỏ hàng cho người dùng mới
        await _gioHangRepo.CreateGioHang(maNguoiDung);

        var userInfo = await GetUserInfo(taiKhoan);
        var token = GenerateJwtToken(taiKhoan, userInfo);
        var refreshToken = GenerateRefreshToken();

        return new DangNhapResponse
        {
            Success = true,
            Message = "Đăng ký thành công",
            Token = token,
            RefreshToken = refreshToken,
            User = userInfo
        };
    }

    public async Task<bool> DangXuat(int maTaiKhoan)
    {
        // Có thể lưu refresh token vào database và xóa khi đăng xuất
        // Hiện tại chỉ return true
        return await Task.FromResult(true);
    }

    public async Task<DangNhapResponse> LamMoiToken(string refreshToken)
    {
        // TODO: Implement refresh token logic với database
        // Hiện tại chỉ return error
        return await Task.FromResult(new DangNhapResponse
        {
            Success = false,
            Message = "Refresh token không hợp lệ"
        });
    }

    public async Task<(bool Success, string Message)> DoiMatKhau(int maTaiKhoan, string matKhauCu, string matKhauMoi)
    {
        if (string.IsNullOrWhiteSpace(matKhauCu) || string.IsNullOrWhiteSpace(matKhauMoi))
        {
            return (false, "Mật khẩu không được để trống");
        }

        if (matKhauMoi.Length < 6)
        {
            return (false, "Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        if (matKhauCu == matKhauMoi)
        {
            return (false, "Mật khẩu mới không được trùng với mật khẩu cũ");
        }

        var taiKhoan = await _taiKhoanRepo.GetById(maTaiKhoan);
        if (taiKhoan == null)
        {
            return (false, "Tài khoản không tồn tại");
        }

        if (!BCrypt.Net.BCrypt.Verify(matKhauCu, taiKhoan.MatKhau))
        {
            return (false, "Mật khẩu hiện tại không đúng");
        }

        taiKhoan.MatKhau = BCrypt.Net.BCrypt.HashPassword(matKhauMoi);
        var ok = await _taiKhoanRepo.Update(taiKhoan);
        return ok
            ? (true, "Đổi mật khẩu thành công")
            : (false, "Đổi mật khẩu thất bại, vui lòng thử lại");
    }

    private async Task<UserInfo> GetUserInfo(TaiKhoan taiKhoan)
    {
        var userInfo = new UserInfo
        {
            MaTaiKhoan = taiKhoan.MaTaiKhoan,
            TenDangNhap = taiKhoan.TenDangNhap,
            VaiTro = taiKhoan.VaiTro,
            VaiTroText = GetVaiTroText(taiKhoan.VaiTro)
        };

        if (taiKhoan.VaiTro == 1) // NguoiDung
        {
            var nguoiDung = await _nguoiDungRepo.GetByMaTaiKhoan(taiKhoan.MaTaiKhoan);
            if (nguoiDung != null)
            {
                userInfo.MaNguoiDung = nguoiDung.MaNguoiDung;
                userInfo.Ten = nguoiDung.Ten;
                userInfo.Email = nguoiDung.Email;
            }
        }
        else if (taiKhoan.VaiTro == 2) // HoaSi
        {
            var hoaSi = await _hoaSiRepo.GetByMaTaiKhoan(taiKhoan.MaTaiKhoan);
            if (hoaSi != null)
            {
                userInfo.MaHoaSi = hoaSi.MaHoaSi;
                userInfo.Ten = hoaSi.TenHoaSi;
                userInfo.Email = hoaSi.Email;
            }
        }

        return userInfo;
    }

    private string GenerateJwtToken(TaiKhoan taiKhoan, UserInfo userInfo)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!"));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, taiKhoan.MaTaiKhoan.ToString()),
            new Claim(ClaimTypes.Name, taiKhoan.TenDangNhap),
            new Claim(ClaimTypes.Role, GetVaiTroText(taiKhoan.VaiTro)),
            new Claim("VaiTro", taiKhoan.VaiTro.ToString())
        };

        if (userInfo.MaNguoiDung.HasValue)
            claims.Add(new Claim("MaNguoiDung", userInfo.MaNguoiDung.Value.ToString()));
        
        if (userInfo.MaHoaSi.HasValue)
            claims.Add(new Claim("MaHoaSi", userInfo.MaHoaSi.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "DoAn2_BackEnd",
            audience: _configuration["Jwt:Audience"] ?? "DoAn2_FrontEnd",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        return Guid.NewGuid().ToString();
    }

    private string GetVaiTroText(byte vaiTro)
    {
        return vaiTro switch
        {
            0 => "Admin",
            1 => "NguoiDung",
            2 => "HoaSi",
            _ => "Unknown"
        };
    }
}
