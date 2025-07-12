import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaYoutube,
  FaAt,
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
    active: false,
    color: "#000000"
  },
  {
    name: "Twitter",
    path: "/download/twitter",
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
    name: "Youtube",
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
  const selectRef = useRef(null);

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

  const handlePlatformSelect = (e) => {
    const index = parseInt(e.target.value, 10);
    if (isNaN(index)) return;
    const platform = platforms[index];
    if (platform.active) {
      navigate(platform.path);
    } else {
      setToast(`"${platform.name}" đang được phát triển. Quay lại sau nhé!`);
      if (selectRef.current) {
        selectRef.current.value = "";
      }
    }
  };

  return (
    <>
      <nav className="downloader-menu" >
        {platforms.map((p) =>
          p.active ? (
            <Link
              key={p.name}
              to={p.path}
              className={`downloader-menu-item${
                location.pathname === p.path ? " active" : ""
              }`}
              aria-label={`Tải video từ ${p.name}`}
              style={{ "--platform-color": p.color }}
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
              aria-label={`${p.name} đang được phát triển`}
              style={{ "--platform-color": p.color }}
            >
              {p.icon} <span>{p.name}</span> <span className="badge-soon">Đang phát triển</span>
            </a>
          )
        )}
      </nav>
      <div className="downloader-menu-mobile">
        <select
          className="platform-select"
          onChange={handlePlatformSelect}
          ref={selectRef}
          aria-label="Chọn nền tảng để tải video"
        >
          <option value="">Chọn nền tảng</option>
          {platforms.map((p, index) => (
            <option key={p.name} value={index}>
              {p.name} {p.active ? "" : "(Đang phát triển)"}
            </option>
          ))}
        </select>
      </div>
      {toast && (
        <div className="toast-coming-soon" role="alert">
          {toast}
        </div>
      )}
    </>
  );
}

export default DownloaderMenu;