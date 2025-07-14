import { FaDownload, FaMoon, FaSun } from "react-icons/fa";
import DownloaderMenu from "../components/DownloaderMenu/DownloaderMenu";
import "./MainLayout.scss";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function MainLayout({ children }) {
  const location = useLocation();
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode === "true" || (!savedMode && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

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

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-container">
          <div className="header-content">
            <Link to="/" className="home-logo" aria-label="Trang chủ Nhdinh Video Downloader">
              <span className="logo-icon">
                <FaDownload />
              </span>
              <div className="logo-text">
                <span className="logo-title">Nhdinh Video</span>
                <span className="logo-subtitle">Downloader</span>
              </div>
            </Link>
          
            <div className="header-actions">
              
              <button
                className="dark-mode-toggle"
                onClick={toggleDarkMode}
                aria-label={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
            </div>
          </div>
            <nav className="main-nav desktop-nav">
              <DownloaderMenu />
            </nav>
          <nav className="main-nav mobile-nav">
            <DownloaderMenu />
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="content-container">{children}</div>
      </main>

      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="/privacy" className="footer-link" aria-label="Chính sách bảo mật">
              Privacy Policy
            </a>
            <a href="/terms" className="footer-link" aria-label="Điều khoản dịch vụ">
              Terms of Service
            </a>
            <a href="/contact" className="footer-link" aria-label="Liên hệ">
              Contact
            </a>
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} Nhdinh Video Downloader Pro. All rights reserved.
          </div>
        </div>
      </footer>
      
      {toast && (
        <div className="toast-coming-soon" role="alert" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}