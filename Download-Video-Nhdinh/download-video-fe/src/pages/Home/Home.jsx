import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
    icon: <FaFacebook color="#1877f3" />,
    desc: "Tải video Facebook tốc độ cao.",
    active: true,
  },
  {
    name: "Instagram",
    path: "/download/instagram",
    icon: <FaInstagram color="#E1306C" />,
    desc: "Tải video Instagram tốc độ cao.",
    active: true,
  },
  {
    name: "Youtube",
    path: "/download/youtube",
    icon: <FaYoutube color="#ff0000" />,
    desc: "Đang phát triển...",
    active: false,
  },
  {
    name: "Threads",
    path: "/download/threads",
    icon: <FaAt color="#222" />,
    desc: "Đang phát triển...",
    active: false,
  },
  {
    name: "Tiktok",
    path: "/download/tiktok",
    icon: <FaTiktok color="#222" />,
    desc: "Tải video TikTok tốc độ cao.",
    active: true,
  },
  {
    name: "Twitter",
    path: "/download/twitter",
    icon: <FaTwitter color="#1da1f2" />,
    desc: "Đang phát triển...",
    active: false,
  },
];

export default function Home() {
  const location = useLocation();
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleComingSoon = (name, e) => {
    e.preventDefault();
    setToast(`"${name}" đang được phát triển. Quay lại sau nhé!`);
  };

  return (
    <div className="home-root">
      <header className="home-header">
        <span className="home-logo">
          <FaFacebook /> Nhdinh Downloader Pro
        </span>
        <nav>
          <Link to="/" className={location.pathname === "/" ? "active" : ""} aria-label="Trang chủ">
            Home
          </Link>
          <Link to="/guide" className={location.pathname === "/guide" ? "active" : ""} aria-label="Hướng dẫn sử dụng">
            Hướng dẫn
          </Link>
          <Link
            to="/download/history"
            className={location.pathname === "/download/history" ? "active" : ""}
            aria-label="Lịch sử tải về"
          >
            Lịch sử tải về
          </Link>
        </nav>
      </header>

      <section className="home-hero">
        <h1>
          Tải Video{" "}
          <span className="primary-gradient">Facebook, Youtube, Threads</span>{" "}
          <br />
          <span className="home-hero-sub">Miễn phí • Nhanh • Chuyên nghiệp</span>
        </h1>
        <p className="home-hero-desc">
          Dán link video bạn cần tải, chọn nền tảng, <b>tải về ngay!</b> <br />
          Hỗ trợ Facebook, Youtube, Threads, Instagram, TikTok, Twitter...
        </p>
        <Link className="btn-primary" to="/download/facebook" aria-label="Bắt đầu tải video từ Facebook">
          Bắt đầu với Facebook
        </Link>
      </section>

      <section className="home-platforms">
        <h2>Các nền tảng hỗ trợ</h2>
        <div className="home-platform-list">
          {platforms.map((p) =>
            p.active ? (
              <Link
                to={p.path}
                className="home-platform-card"
                key={p.name}
                aria-label={`Tải video từ ${p.name}`}
              >
                <div className="icon-wrap">{p.icon}</div>
                <div>
                  <b>{p.name}</b>
                  <div className="platform-desc">{p.desc}</div>
                </div>
              </Link>
            ) : (
              <a
                href={p.path}
                className="home-platform-card coming-soon"
                key={p.name}
                onClick={(e) => handleComingSoon(p.name, e)}
                tabIndex={0}
                aria-label={`${p.name} đang được phát triển`}
              >
                <div className="icon-wrap">{p.icon}</div>
                <div>
                  <b>{p.name}</b>
                  <div className="platform-desc">{p.desc}</div>
                  <span className="badge-soon">Đang phát triển</span>
                </div>
              </a>
            )
          )}
        </div>
      </section>

      <footer className="home-footer">
        © {new Date().getFullYear()} Nhdinh Downloader Pro - All rights reserved. | Built with ❤️
      </footer>

      {toast && (
        <div className="toast-coming-soon" role="alert">
          {toast}
        </div>
      )}
    </div>
  );
}