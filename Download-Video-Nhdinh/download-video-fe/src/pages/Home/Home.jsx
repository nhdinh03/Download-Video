import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaTwitter,
  FaAt,
  FaDownload,
  FaMoon,
  FaSun,
  FaArrowRight,
  FaTimes,
} from "react-icons/fa";
import "./Home.scss";
import img from "../../assets/img";

const platforms = [
  {
    name: "Facebook",
    path: "/download/facebook",
    icon: <FaFacebook />,
    desc: "Tải video chất lượng cao, hỗ trợ reel và story một cách mượt mà.",
    active: true,
    color: "#1877f2",
  },
  {
    name: "Instagram",
    path: "/download/instagram",
    icon: <FaInstagram />,
    desc: "Tải reels, stories và posts nhanh chóng với chất lượng gốc.",
    active: true,
    color: "#E1306C",
  },
  {
    name: "TikTok",
    path: "/download/tiktok",
    icon: <FaTiktok />,
    desc: "Tải video không watermark, chất lượng HD full.",
    active: true,
    color: "#000000",
  },
  {
    name: "Threads",
    path: "/download/threads",
    icon: <FaAt />,
    desc: "Hỗ trợ tải threads sắp ra mắt với tính năng đầy đủ.",
    active: false,
    color: "#000000",
  },
  {
    name: "Twitter",
    path: "/download/twitter",
    icon: <FaTwitter />,
    desc: "Tải video từ X (Twitter) sắp có, không giới hạn.",
    active: false,
    color: "#1DA1F2",
  },
  {
    name: "Youtube",
    path: "/download/youtube",
    icon: <FaYoutube />,
    desc: "Tải video YouTube chất lượng cao sắp hỗ trợ đa định dạng.",
    active: false,
    color: "#FF0000",
  },
];

function Home() {
  const [toast, setToast] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  const handleComingSoon = (name, e) => {
    e.preventDefault();
    setToast(
      `Tính năng cho "${name}" đang được phát triển. Hãy quay lại sau nhé!`
    );
  };

  const dismissToast = () => setToast("");

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="home-root">
      <header className={`home-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="header-container">
          <Link
            to="/"
            className="home-logo"
            aria-label="Trang chủ Nhdinh Downloader Pro"
          ></Link>
        </div>
      </header>

      <section className="home-hero">
        <div className="hero-content">
          <h1>
            Tải Video Từ{" "}
            <span className="primary-gradient">Mọi Nền Tảng Xã Hội</span>
          </h1>
          <p className="hero-subtitle">
            Miễn phí hoàn toàn • Tốc độ siêu nhanh • An toàn và dễ sử dụng
          </p>
          <p className="hero-description">
            Chỉ cần dán link video, chọn nền tảng yêu thích và tải về ngay lập
            tức. Hỗ trợ đầy đủ Facebook, Instagram, TikTok cùng nhiều tính năng
            sắp ra mắt.
          </p>
          <Link
            className="btn-primary"
            to="/download/facebook"
            aria-label="Bắt đầu tải video ngay bây giờ"
          >
            <FaDownload /> Bắt đầu tải <FaArrowRight />
          </Link>
        </div>
      </section>

      <section className="home-platforms">
        <div className="section-container">
          <h2>Các nền tảng được hỗ trợ</h2>
          <div
            className="platform-container"
            role="region"
            aria-label="Danh sách nền tảng hỗ trợ"
          >
            {platforms.map((p, index) => (
              <Link
                to={p.active ? p.path : "#"}
                className={`platform-card ${p.active ? "" : "coming-soon"}`}
                key={p.name}
                onClick={
                  !p.active ? (e) => handleComingSoon(p.name, e) : undefined
                }
                aria-label={`${p.name} - ${p.desc}`}
                tabIndex={0}
                data-index={index}
              >
                <div className="platform-icon" style={{ color: p.color }}>
                  {p.icon}
                </div>
                <div className="platform-info">
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                </div>
                {!p.active && <div className="platform-badge">Sắp ra mắt</div>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="section-container">
          <h2>Tại sao chọn Nhđinh Downloader Pro?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                🚀
              </div>
              <h3>Tốc độ cao</h3>
              <p>
                Tải video nhanh chóng mà không cần chờ đợi lâu, tối ưu hóa cho
                mọi kết nối mạng.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                🔒
              </div>
              <h3>An toàn bảo mật</h3>
              <p>
                Không lưu trữ dữ liệu cá nhân, đảm bảo quyền riêng tư tuyệt đối
                cho người dùng.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                📱
              </div>
              <h3>Thân thiện đa thiết bị</h3>
              <p>
                Giao diện responsive, hoạt động mượt mà trên PC, laptop, iPad và
                mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-top">
            <span>
              © {new Date().getFullYear()} Nhđinh Downloader Pro. All rights
              reserved.
            </span>
            <nav className="footer-nav" aria-label="Điều hướng chân trang">
              <Link to="/terms" aria-label="Điều khoản dịch vụ">
                Điều khoản
              </Link>
              <Link to="/privacy" aria-label="Chính sách bảo mật">
                Bảo mật
              </Link>
              <Link to="/contact" aria-label="Liên hệ hỗ trợ">
                Liên hệ
              </Link>
            </nav>
          </div>
          <div className="footer-bottom">
            <span>Built with ❤️ by Nhđinh Team</span>
          </div>
        </div>
      </footer>

      {toast && (
        <div className="toast-coming-soon" role="alert">
          {toast}
          <button onClick={dismissToast} aria-label="Đóng thông báo">
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
