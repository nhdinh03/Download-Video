import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaFacebook, FaInstagram, FaTiktok, FaTwitter, FaYoutube, FaAt
} from "react-icons/fa";
import "./DownloaderMenu.css";

const platforms = [
  { name: "Facebook", path: "/download/facebook", icon: <FaFacebook color="#1877f3" />, active: true },
  { name: "Instagram", path: "/download/instagram", icon: <FaInstagram color="#E1306C" />, active: false },
  { name: "TikTok", path: "/download/tiktok", icon: <FaTiktok color="#000" />, active: false },
  { name: "Twitter", path: "/download/twitter", icon: <FaTwitter color="#1da1f2" />, active: false },
  { name: "Threads", path: "/download/threads", icon: <FaAt color="#000" />, active: false },
  { name: "Youtube", path: "/download/youtube", icon: <FaYoutube color="#f00" />, active: false },
];

function DownloaderMenu() {
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
    <>
      <nav className="downloader-menu">
        {platforms.map(p =>
          p.active ? (
            <Link
              key={p.name}
              to={p.path}
              className={`downloader-menu-item${location.pathname === p.path ? " active" : ""}`}
            >
              {p.icon} <span>{p.name}</span>
            </Link>
          ) : (
            <a
              key={p.name}
              href={p.path}
              className="downloader-menu-item coming-soon"
              onClick={(e) => handleComingSoon(p.name, e)}
              tabIndex={0}
            >
              {p.icon} <span>{p.name}</span>
              {/* <span className="badge-soon">Đang phát triển</span> */}
            </a>
          )
        )}
      </nav>
      {toast && (
        <div className="toast-coming-soon">
          {toast}
        </div>
      )}
    </>
  );
}

export default DownloaderMenu;
