import React from "react";
import DownloaderMenu from "../components/DownloaderMenu/DownloaderMenu";
import "./MainLayout.scss";
import { Link } from "react-router-dom";

export default function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="main-header-inner">
          <Link to="/" className="main-logo" style={{ textDecoration: "none" }}>
            <span style={{ color: "#1877f3" }}>Nhdinh Video Downloader</span>
            <span style={{ color: "#1da1f2" }}>&nbsp;Pro</span>
          </Link>
        </div>
        <DownloaderMenu />
      </header>
      <main className="main-content">{children}</main>
      <footer className="main-footer">
        <small>
          © {new Date().getFullYear()} Video Downloader Pro. All rights
          reserved.
        </small>
      </footer>
    </div>
  );
}
