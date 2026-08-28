import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Register.css';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({
        fullname: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        setErrors(prev => ({
            ...prev,
            [name]: '',
        }));
        setSubmitError('');
    };

    const validateForm = (): boolean => {
        const newErrors = {
            fullname: '',
            phone: '',
            email: '',
            password: '',
            confirmPassword: '',
        };
        let isValid = true;

        if (!formData.fullname.trim()) {
            newErrors.fullname = 'Vui lòng nhập họ tên';
            isValid = false;
        }

        const phonePattern = /^[0-9]{10}$/;
        if (!formData.phone) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
            isValid = false;
        } else if (!phonePattern.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại phải có 10 chữ số';
            isValid = false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Vui lòng nhập email';
            isValid = false;
        } else if (!emailPattern.test(formData.email)) {
            newErrors.email = 'Email không đúng định dạng';
            isValid = false;
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
            isValid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            isValid = false;
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
            isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setSubmitError('');

        try {
            // Trang đăng ký công khai chỉ tạo tài khoản người dùng (vaiTro = 1).
            // Tài khoản tác giả/họa sĩ do admin tạo.
            await register(
                formData.email,
                formData.password,
                formData.fullname,
                formData.phone,
                undefined,
                1
            );

            navigate('/');
        } catch (error: any) {
            console.error('Register error:', error);
            setSubmitError(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="register-section">
            <div className="register-container">
                <h2>Đăng ký tài khoản</h2>
                <p>Nếu bạn đã có tài khoản</p>
                <p>Bạn có thể đăng nhập <Link to="/login">TẠI ĐÂY!</Link></p>
                <p style={{ fontSize: '13px', color: '#888' }}>
                    Tài khoản tác giả/họa sĩ do quản trị viên cung cấp.
                </p>
                <form className="register-form" onSubmit={handleSubmit}>
                    {submitError && (
                        <div style={{
                            background: '#fee', color: '#c0392b', padding: '10px 12px',
                            borderRadius: '6px', marginBottom: '15px', fontSize: '14px',
                            borderLeft: '4px solid #e74c3c', textAlign: 'left'
                        }}>
                            {submitError}
                        </div>
                    )}

                    <label htmlFor="fullname">Họ và Tên</label>
                    <input
                        type="text"
                        id="fullname"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        placeholder="Họ và tên*"
                        className={errors.fullname ? 'error' : ''}
                        required
                    />
                    {errors.fullname && <span className="error-text">{errors.fullname}</span>}

                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Số điện thoại*"
                        className={errors.phone ? 'error' : ''}
                        required
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}

                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Nhập địa chỉ email*"
                        className={errors.email ? 'error' : ''}
                        required
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}

                    <label htmlFor="password">Mật khẩu</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mật khẩu*"
                        className={errors.password ? 'error' : ''}
                        required
                    />
                    {errors.password && <span className="error-text">{errors.password}</span>}

                    <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Xác nhận mật khẩu*"
                        className={errors.confirmPassword ? 'error' : ''}
                        required
                    />
                    {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}

                    <button
                        type="submit"
                        className="register-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Tạo tài khoản'}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default Register;
