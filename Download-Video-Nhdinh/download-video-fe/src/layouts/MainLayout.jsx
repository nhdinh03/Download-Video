import React, { useState, useEffect } from "react";
import DownloaderMenu from "../components/DownloaderMenu/DownloaderMenu";
import "./MainLayout.scss";
import { Link, useLocation } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";

export default function MainLayout({ children }) {
  const location = useLocation();

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-container">
          <div className="header-content">
            <Link to="/" className="main-logo">
              <span className="logo-primary">Nhdinh</span>
              <span className="logo-secondary">Video Downloader</span>
              <span className="logo-accent">Pro</span>
            </Link>

            <nav className="main-nav">
              <NavLink to="/" currentPath={location.pathname}>
                Home
              </NavLink>
              <NavLink to="/guide" currentPath={location.pathname}>
                Hướng dẫn
              </NavLink>
              <NavLink to="/download/history" currentPath={location.pathname}>
                Lịch sử
              </NavLink>
            </nav>
          </div>

          <DownloaderMenu />
        </div>
      </header>

      <main className="main-content">
        <div className="content-container">{children}</div>
      </main>

      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="/privacy" className="footer-link">
              Privacy Policy
            </a>
            <a href="/terms" className="footer-link">
              Terms of Service
            </a>
            <a href="/contact" className="footer-link">
              Contact
            </a>
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} Nhdinh Video Downloader Pro. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, currentPath, children }) {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      className={`nav-link ${isActive ? "active" : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
      {isActive && <span className="active-indicator" aria-hidden="true" />}
    </Link>
  );
}
