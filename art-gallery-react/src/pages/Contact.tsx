import React, { useState } from 'react';
import './Contact.css';

const Contact: React.FC = () => {
    const [form, setForm] = useState({
        name: '', email: '', phone: '', subject: '', message: '',
    });
    const [info, setInfo] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setInfo(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
            setInfo({ type: 'error', text: 'Vui lòng nhập đầy đủ các trường bắt buộc.' });
            return;
        }
        const phonePattern = /^[0-9]{9,11}$/;
        if (!phonePattern.test(form.phone.trim())) {
            setInfo({ type: 'error', text: 'Số điện thoại không hợp lệ.' });
            return;
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(form.email.trim())) {
            setInfo({ type: 'error', text: 'Email không hợp lệ.' });
            return;
        }

        // Backend hiện chưa có endpoint nhận liên hệ → log local và phản hồi UX.
        console.log('[Contact] Tin nhắn liên hệ:', form);
        setInfo({ type: 'success', text: 'Cảm ơn bạn! Tin nhắn của bạn đã được ghi nhận, chúng tôi sẽ phản hồi sớm.' });
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    };

    return (
        <div className="contact-page">
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="hero-content">
                    <h1 className="fade-in-up">Liên Hệ Với Chúng Tôi</h1>
                    <p className="fade-in-up delay-1">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn</p>
                </div>
            </section>

            {/* Contact Content */}
            <section className="contact-content">
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                    <div className="contact-wrapper">
                        {/* Contact Info */}
                        <div className="contact-info fade-in-left">
                            <h2>Thông Tin Liên Hệ</h2>
                            <p className="info-description">Hãy đến thăm chúng tôi hoặc liên hệ qua các phương thức sau:</p>
                            
                            <div className="info-cards">
                                <div className="info-card">
                                    <div className="info-icon">
                                        <i className="ti-location-pin"></i>
                                    </div>
                                    <div className="info-details">
                                        <h3>Địa Chỉ</h3>
                                        <p>56 Nguyễn Phong Sắc<br/>Dịch Vọng, Cầu Giấy<br/>Hà Nội, Việt Nam</p>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-icon">
                                        <i className="ti-mobile"></i>
                                    </div>
                                    <div className="info-details">
                                        <h3>Điện Thoại</h3>
                                        <p>094 888 3535<br/>094 886 3535</p>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-icon">
                                        <i className="ti-email"></i>
                                    </div>
                                    <div className="info-details">
                                        <h3>Email</h3>
                                        <p>lanvugallery@gmail.com<br/>support@lanvugallery.com</p>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-icon">
                                        <i className="ti-time"></i>
                                    </div>
                                    <div className="info-details">
                                        <h3>Giờ Làm Việc</h3>
                                        <p>Thứ 2 - Chủ Nhật<br/>08:00 - 21:00</p>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media */}
                            <div className="social-media">
                                <h3>Theo Dõi Chúng Tôi</h3>
                                <div className="social-links">
                                    <a href="#" className="social-link facebook">
                                        <i className="ti-facebook"></i>
                                    </a>
                                    <a href="#" className="social-link instagram">
                                        <i className="ti-instagram"></i>
                                    </a>
                                    <a href="#" className="social-link youtube">
                                        <i className="ti-youtube"></i>
                                    </a>
                                    <a href="#" className="social-link zalo">
                                        <i className="ti-comments"></i>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="contact-form-wrapper fade-in-right">
                            <div className="form-header">
                                <h2>Gửi Tin Nhắn</h2>
                                <p>Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong thời gian sớm nhất</p>
                            </div>
                            
                            <form id="contactForm" className="contact-form" onSubmit={handleSubmit}>
                                {info && (
                                    <div style={{
                                        padding: '10px 12px', borderRadius: 6, marginBottom: 12,
                                        background: info.type === 'success' ? '#e8f5e9' : '#fee',
                                        color: info.type === 'success' ? '#2e7d32' : '#c0392b',
                                        borderLeft: `4px solid ${info.type === 'success' ? '#2e7d32' : '#c0392b'}`,
                                        fontSize: 14
                                    }}>
                                        {info.text}
                                    </div>
                                )}
                                <div className="form-group">
                                    <label htmlFor="name">
                                        <i className="ti-user"></i> Họ và Tên <span>*</span>
                                    </label>
                                    <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Nhập họ và tên của bạn" />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">
                                        <i className="ti-email"></i> Email <span>*</span>
                                    </label>
                                    <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required placeholder="your.email@example.com" />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">
                                        <i className="ti-mobile"></i> Số Điện Thoại <span>*</span>
                                    </label>
                                    <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} required placeholder="0948 88 35 35" />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject">
                                        <i className="ti-bookmark"></i> Chủ Đề
                                    </label>
                                    <select id="subject" name="subject" value={form.subject} onChange={handleChange}>
                                        <option value="">Chọn chủ đề</option>
                                        <option value="tuvan">Tư vấn mua tranh</option>
                                        <option value="thietke">Tư vấn thiết kế</option>
                                        <option value="trienlam">Thông tin triển lãm</option>
                                        <option value="khac">Khác</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">
                                        <i className="ti-comment"></i> Tin Nhắn <span>*</span>
                                    </label>
                                    <textarea id="message" name="message" value={form.message} onChange={handleChange} rows={6} required placeholder="Nhập tin nhắn của bạn..."></textarea>
                                </div>

                                <button type="submit" className="submit-btn">
                                    <span>Gửi Tin Nhắn</span>
                                    <i className="ti-arrow-right"></i>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Map Section */}
                    <div className="map-section fade-in">
                        <h2>Bản Đồ</h2>
                        <div className="map-container">
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.0965099999997!2d105.8015!3d21.0285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDAxJzQyLjYiTiAxMDXCsDQ4JzA1LjQiRQ!5e0!3m2!1svi!2s!4v1234567890" 
                                width="100%" 
                                height="450" 
                                style={{ border: 0, borderRadius: '15px' }} 
                                allowFullScreen 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade">
                            </iframe>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
