import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaTwitter,
  FaAt,
} from "react-icons/fa";
import "./Home.scss";

const platforms = [
  {
    name: "Facebook",
    path: "/download/facebook",
    icon: <FaFacebook color="#1877f3" size={44} />,
    desc: "Tải video Facebook tốc độ cao.",
    active: true,
  },
  {
    name: "Instagram",
    path: "/download/instagram",
    icon: <FaInstagram color="#E1306C" size={44} />,
    desc: "Tải video instagram tốc độ cao.",
    active: true,
  },
  {
    name: "Youtube",
    path: "/download/youtube",
    icon: <FaYoutube color="#ff0000" size={44} />,
    desc: "Đang phát triển...",
    active: false,
  },
  {
    name: "Threads",
    path: "/download/threads",
    icon: <FaAt color="#222" size={44} />,
    desc: "Đang phát triển...",
    active: false,
  },

  {
    name: "Tiktok",
    path: "/download/tiktok",
    icon: <FaTiktok color="#222" size={44} />,
    desc: "Đang phát triển...",
    active: false,
  },
  {
    name: "Twitter",
    path: "/download/twitter",
    icon: <FaTwitter color="#1da1f2" size={44} />,
    desc: "Đang phát triển...",
    active: false,
  },
];

export default function Home() {
  const [toast, setToast] = useState("");

  // Ẩn toast sau 2.2s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleComingSoon = (name) => {
    setToast(`"${name}" đang được phát triển. Quay lại sau nhé!`);
  };

  return (
    <div className="home-root">
      <header className="home-header">
        <span className="home-logo">
          <FaFacebook size={30} /> Nhdinh Downloader Pro
        </span>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/guide">Hướng dẫn</Link>

          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github
          </a>
        </nav>
      </header>

      <section className="home-hero">
        <h1>
          Tải Video{" "}
          <span className="primary-gradient">Facebook, Youtube, Threads</span>{" "}
          <br />
          <span className="home-hero-sub">
            Miễn phí • Nhanh • Chuyên nghiệp
          </span>
        </h1>
        <p className="home-hero-desc">
          Dán link video bạn cần tải, chọn nền tảng, <b>tải về ngay!</b> <br />
          Hỗ trợ Facebook, Youtube, Threads, Instagram, TikTok, Twitter...
        </p>
        <Link className="btn-primary" to="/download/facebook">
          Bắt đầu với Facebook
        </Link>
      </section>

      <section className="home-platforms">
        <h2>Các nền tảng hỗ trợ</h2>
        <div className="home-platform-list">
          {platforms.map((p) =>
            p.active ? (
              <Link to={p.path} className="home-platform-card" key={p.name}>
                <div className="icon-wrap">{p.icon}</div>
                <div>
                  <b>{p.name}</b>
                  <div className="platform-desc">{p.desc}</div>
                </div>
              </Link>
            ) : (
              <button
                type="button"
                className="home-platform-card coming-soon"
                key={p.name}
                onClick={() => handleComingSoon(p.name)}
              >
                <div className="icon-wrap">{p.icon}</div>
                <div>
                  <b>{p.name}</b>
                  <div className="platform-desc">{p.desc}</div>
                  <span className="badge-soon">Đang phát triển</span>
                </div>
              </button>
            )
          )}
        </div>
      </section>

      <footer className="home-footer">
        © {new Date().getFullYear()} Nhdinh Downloader Pro - All rights
        reserved. | Built with ❤️
      </footer>

      {/* Toast Notification */}
      {toast && <div className="toast-coming-soon">{toast}</div>}
    </div>
  );
}
