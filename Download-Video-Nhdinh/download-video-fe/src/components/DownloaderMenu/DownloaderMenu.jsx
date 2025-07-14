import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaAt,
  FaYoutube,
} from "react-icons/fa";
import "./DownloaderMenu.scss";

const platforms = [
  {
    name: "Facebook",
    path: "/download/facebook",
    icon: <FaFacebook />,
    active: true,
    color: "#1877f3"
  },
  {
    name: "Instagram",
    path: "/download/instagram",
    icon: <FaInstagram />,
    active: true,
    color: "#E1306C"
  },
  {
    name: "TikTok",
    path: "/download/tiktok",
    icon: <FaTiktok />,
    active: true,
    color: "#000000"
  },
  {
    name: "X (Twitter)",
    path: "/download/x(twitter)",
    icon: <FaTwitter />,
    active: false,
    color: "#1da1f2"
  },
  {
    name: "Threads",
    path: "/download/threads",
    icon: <FaAt />,
    active: false,
    color: "#000000"
  },
  {
    name: "YouTube",
    path: "/download/youtube",
    icon: <FaYoutube />,
    active: false,
    color: "#ff0000"
  },
];

function DownloaderMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleComingSoon = (name) => {
    setToast(`"${name}" đang được phát triển. Quay lại sau nhé!`);
  };

  const handlePlatformSelect = (platform) => {
    if (platform.active) {
      navigate(platform.path);
    } else {
      handleComingSoon(platform.name);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="downloader-menu desktop-menu">
        {platforms.map((p) =>
          p.active ? (
            <Link
              key={p.name}
              to={p.path}
              className={`downloader-menu-item${location.pathname === p.path ? " active" : ""}`}
              aria-label={`Tải video từ ${p.name}`}
              style={{ "--platform-color": p.color }}
            >
              {p.icon} <span>{p.name}</span>
            </Link>
          ) : (
            <button
              key={p.name}
              className="downloader-menu-item coming-soon"
              onClick={() => handleComingSoon(p.name)}
              aria-label={`${p.name} đang được phát triển`}
              style={{ "--platform-color": p.color }}
            >
              {p.icon} <span>{p.name}</span> <span className="badge-soon">Đang phát triển</span>
            </button>
          )
        )}
      </nav>
      <div className="downloader-menu-mobile">
        <button
          className="menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Mở menu chọn nền tảng"
          aria-expanded={isMobileMenuOpen}
        >
          ≡
        </button>
        {isMobileMenuOpen && (
          <div className="mobile-menu-dropdown" role="menu">
            {platforms.map((p) => (
              <button
                key={p.name}
                className={`mobile-menu-item${!p.active ? " disabled" : ""}${location.pathname === p.path ? " active" : ""}`}
                onClick={() => handlePlatformSelect(p)}
                aria-label={`Chọn ${p.name}${!p.active ? " (Đang phát triển)" : ""}`}
                role="menuitem"
              >
                {p.icon} <span>{p.name}</span> {!p.active && <span className="badge-soon-mobile">(Đang phát triển)</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {toast && (
        <div className="toast-coming-soon" role="alert" aria-live="polite">
          {toast}
        </div>
      )}
    </>
  );
}

export default DownloaderMenu;