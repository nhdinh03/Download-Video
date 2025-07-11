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
} from "react-icons/fa";
import "./Home.scss";

const platforms = [
  {
    name: "Facebook",
    path: "/download/facebook",
    icon: <FaFacebook />,
    desc: "Tải video Facebook tốc độ cao, chất lượng HD.",
    active: true,
    color: "#1877f3"
  },
  {
    name: "Instagram",
    path: "/download/instagram",
    icon: <FaInstagram />,
    desc: "Tải video, reels và stories từ Instagram.",
    active: true,
    color: "#E1306C"
  },
  {
    name: "TikTok",
    path: "/download/tiktok",
    icon: <FaTiktok />,
    desc: "Tải video TikTok không watermark, nhanh chóng.",
    active: true,
    color: "#000"
  },
  {
    name: "Threads",
    path: "/download/threads",
    icon: <FaAt />,
    desc: "Đang phát triển hỗ trợ tải từ Threads.",
    active: false,
    color: "#222"
  },
  {
    name: "Twitter",
    path: "/download/twitter",
    icon: <FaTwitter />,
    desc: "Đang phát triển tải video từ Twitter/X.",
    active: false,
    color: "#1da1f2"
  },
  {
    name: "Youtube",
    path: "/download/youtube",
    icon: <FaYoutube />,
    desc: "Đang phát triển tính năng tải video YouTube.",
    active: false,
    color: "#ff0000"
  },
];

export default function Home() {
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const handleComingSoon = (name, e) => {
    e.preventDefault();
    setToast(`"${name}" đang được phát triển. Hãy quay lại sau nhé!`);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <div className="home-root">
      <header className="home-header">
        <div className="header-container">
          <span className="home-logo">
            <span className="logo-icon"><FaDownload /></span>
            <span className="logo-text">Nhđinh Video Downloader Pro</span>
          </span>
  
          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </header>

      <section className="home-hero">
        <div className="hero-content">
          <h1>
            Tải Video <span className="primary-gradient">Facebook, Instagram, TikTok</span>
          </h1>
          <p className="hero-subtitle">Miễn phí • Nhanh chóng • An toàn</p>
          <p className="hero-description">
            Chỉ cần dán link video, chọn nền tảng và tải về ngay lập tức! <br />
            Hỗ trợ đầy đủ các nền tảng phổ biến: Facebook, Instagram, TikTok, và nhiều hơn nữa sắp ra mắt.
          </p>
          <Link
            className="btn-primary"
            to="/download/facebook"
            aria-label="Bắt đầu tải video từ Facebook"
          >
            <FaDownload /> Bắt đầu tải ngay
          </Link>
        </div>
      </section>

      <section className="home-platforms">
        <div className="section-container">
          <h2>Các nền tảng hỗ trợ</h2>
          <div className="platform-grid">
            {platforms.map((p) => (
              <div 
                className={`platform-card ${p.active ? "" : "coming-soon"}`} 
                key={p.name}
                onClick={!p.active ? (e) => handleComingSoon(p.name, e) : undefined}
              >
                <div className="platform-icon" style={{ color: p.color }}>
                  {p.icon}
                </div>
                <div className="platform-info">
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                </div>
                {!p.active && (
                  <div className="platform-badge">Sắp ra mắt</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-top">
            <span>© {new Date().getFullYear()} Nhđinh Video Downloader Pro - All rights reserved.</span>
            <nav className="footer-nav">
              <Link to="/terms" aria-label="Điều khoản dịch vụ">
                Điều khoản dịch vụ
              </Link>
              <Link to="/privacy" aria-label="Chính sách bảo mật">
                Chính sách bảo mật
              </Link>
              <Link to="/contact" aria-label="Liên hệ">
                Liên hệ
              </Link>
            </nav>
          </div>
          <div className="footer-bottom">
            <span>Built with ❤️ by Nhđinh Team</span>
          </div>
        </div>
      </footer> */}

      {toast && (
        <div className="toast-coming-soon" role="alert" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}