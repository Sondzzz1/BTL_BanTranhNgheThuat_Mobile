import React from 'react';
import './About.css';

const About: React.FC = () => {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <h1>Nhà sáng lập</h1>
                    <h2>Họa sĩ, Kiến trúc sư Lân Vũ</h2>
                    <p className="hero-subtitle">Người sáng lập và kiến tạo nên Son Gallery</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="about-container">
                <div className="image-box">
                    <img src="/assets/TrangNgoai/%E1%BA%A2nh%20ch%E1%BB%A5p%20m%C3%A0n%20h%C3%ACnh%202025-04-07%20220932.png" alt="Họa sĩ, Kiến trúc sư Lân Vũ" />
                </div>
                <div className="info-box">
                    <h2>Về Nhà Sáng Lập</h2>
                    <p><strong>Họa sĩ, Kiến trúc sư Lân Vũ</strong> tên đầy đủ là Vũ Thành Lân, sinh năm 1994, được biết đến là nhà sáng lập Son Gallery. Anh tốt nghiệp khoa Quy hoạch, Đại học Kiến trúc Hà Nội.</p>
                    <p>Sinh ra và lớn lên trong gia đình có nền tảng học vấn nghệ thuật tại vùng quê thuộc tỉnh Ninh Bình, cha anh là một nhiếp ảnh gia – nghệ nhân cây cảnh, họa sĩ. Lân Vũ đến với hội họa hoàn toàn do yêu thích, say mê đồng thời được truyền cảm hứng từ chính những bức ảnh của cha mình. Anh bắt đầu thể hiện năng khiếu vẽ rất nhiều bằng bút chì, vẽ màu nước, bút sáp từ thời trung học.</p>
                    <p><strong>Năm 2012</strong>, khi bước chân vào cổng trường đại học Lân Vũ đã tiếp tục nuôi dưỡng đam mê vẽ của mình một cách nghiêm túc hơn. Ngoài thời gian học trên lớp, hầu hết thời gian còn lại anh dành để vẽ.</p>  
                    <p>Đi học xa nhà, xa quê hương nên nỗi nhớ về nét đẹp bình dị nơi thôn quê đã là nguồn cảm hứng sáng tác bất tận trong tranh của họa sĩ Lân Vũ. Những tác phẩm đầu tiên của anh chủ yếu về đề tài quê hương, anh vẽ mọi thứ từ thiên nhiên, đồ vật thường ngày được người thân và bạn bè hết mực khen ngợi, đó là nguồn động lực để Lân Vũ theo đuổi đam mê trong tương lai.</p>
                </div>
            </div>

            {/* Career Section */}
            <div className="career-box">
                <h2>Hành trình sự nghiệp</h2>
                <p><strong>Năm 2017</strong>, sau khi tốt nghiệp trường Đại học Kiến trúc Hà Nội, họa sĩ Lân Vũ đã làm việc tại Viện Quy hoạch thành phố. Tuy nhiên, với niềm đam mê mãnh liệt với nghệ thuật hội họa đặc biệt là tranh sơn dầu, cùng mong ước thể hiện mình, anh đã không ngần ngại từ bỏ công việc, quyết định theo đuổi sự nghiệp hội họa, quyết tâm xây dựng thương hiệu tranh sơn dầu cao cấp của riêng mình.</p>     
                <p><strong>Năm 2020</strong>, họa sĩ Lân Vũ đã tham dự Triển lãm do Viet Art Exchange tổ chức và đấu giá thành công tác phẩm mang tên "Xuân hồng" nhằm ủng hộ cho Quỹ phòng chống dịch Covid-19 theo lời kêu gọi của Ủy ban Trung ương Mặt trận Tổ quốc Việt Nam (UBTW MTTQVN).</p>
                <p>Với tư cách là một kiến trúc sư, Lân Vũ đã kết hợp kiến thức về không gian, ánh sáng và bố cục từ ngành kiến trúc vào các tác phẩm hội họa của mình, tạo nên những bức tranh độc đáo, có chiều sâu và tính thẩm mỹ cao. Điều này cũng giúp anh có cái nhìn toàn diện hơn trong việc tư vấn thiết kế nội thất và lựa chọn tranh phù hợp cho không gian sống.</p>
                <blockquote>
                    "Sau những khoảng lặng ẩn mình đi tìm cái tôi của bản thân, tạo ra các tác phẩm riêng biệt mang đậm dấu ấn cá nhân tôi nhận ra rằng: Một tác phẩm thực sự có giá trị lớn nhất khi người họa sĩ hiểu được chính bản thân mình, hiểu sứ mệnh của mình, đó là sự cống hiến của tâm hồn nghệ sĩ thành thật và đa cảm."
                    <br/><cite>— Họa sĩ, Kiến trúc sư Lân Vũ</cite>
                </blockquote>
            </div>

            {/* Activities Section */}
            <div className="activities-box">
                <h2>Hoạt động nghệ thuật tiêu biểu</h2>
                <ul>
                    <li><strong>2015:</strong> Triển lãm nghệ thuật sinh viên tại Hà Nội.</li>
                    <li><strong>2016:</strong> Triển lãm mỹ thuật sinh viên tại Hà Nội.</li>
                    <li><strong>2017:</strong> Triển lãm nhóm họa sĩ trẻ tại Hà Nội.</li>
                    <li><strong>2018:</strong> Triển lãm mỹ thuật cá nhân "Giai điệu ngày mới" tại Hà Nội.</li>
                    <li><strong>2019:</strong> Triển lãm nhóm Viet Art Exchange, đấu giá các tác phẩm nhằm ủng hộ cho quỹ phòng chống dịch Covid-19.</li>
                    <li><strong>2020:</strong> Đấu giá thành công tác phẩm "Xuân hồng" ủng hộ Quỹ phòng chống dịch Covid-19.</li>
                    <li><strong>2021:</strong> Triển lãm mỹ thuật cá nhân "Cảm xúc trở về" tại Hà Nội.</li>
                </ul>
            </div>

            {/* Philosophy Section */}
            <div className="quote-box">
                <h2>Quan điểm nghệ thuật</h2>
                <blockquote>
                    "Hành trình nghệ thuật của tôi là chặng đường dài và quanh co, một quá trình tự thân tìm tòi, vượt qua nhiều trắc trở và bộn bề của cuộc sống. Như câu châm ngôn: 'mỗi người mỗi vẻ', những tác phẩm của tôi phản ánh kinh nghiệm sống của riêng tôi. Khi trải trên toan những giấc mơ, mỗi nét cọ phác họa cái tôi cá nhân, những kỷ niệm, nỗi nhớ đều làm tôi cảm thấy tâm hồn thật thảnh thơi để chìm đắm trong những sắc màu rực rỡ. Điều đó thật hạnh phúc!"
                    <br/><cite>— Họa sĩ, Kiến trúc sư Lân Vũ</cite>
                </blockquote>
            </div>

            {/* Vision Section */}
            <div className="vision-box" style={{ marginBottom: '80px' }}>
                <h2>Tầm nhìn và sứ mệnh</h2>
                <div className="vision-content">
                    <p>Với tư cách là nhà sáng lập Son Gallery, họa sĩ Lân Vũ mong muốn tạo ra một không gian nghệ thuật nơi mọi người có thể tìm thấy những tác phẩm tranh sơn dầu cao cấp, độc bản, mang đậm giá trị nghệ thuật và văn hóa Việt Nam.</p>
                    <p>Son Gallery không chỉ là nơi trưng bày và bán tranh, mà còn là nơi kết nối giữa nghệ thuật và cuộc sống, giúp mọi người tìm thấy những tác phẩm phù hợp với không gian sống của mình, tạo nên một môi trường sống đẹp và ý nghĩa hơn.</p>
                </div>
            </div>
        </div>
    );
};

export default About;
