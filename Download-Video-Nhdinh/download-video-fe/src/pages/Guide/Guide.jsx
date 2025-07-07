import React, { useState } from "react";
import { FaRegCopy, FaCheckCircle, FaInfoCircle } from "react-icons/fa";
import { PiNotebookLight, PiArrowRightLight } from "react-icons/pi";
import { SiFacebook, SiYoutube, SiInstagram, SiTiktok } from "react-icons/si";
import Tooltip from "@mui/material/Tooltip";
import "./Guide.css";

function Guide() {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText("https://www.facebook.com/...");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="guide-container">
      <div className="guide-card">
        <header className="guide-header">
          <div className="guide-header-icon">
            <PiNotebookLight size={24} />
          </div>
          <h2 className="guide-title">Hướng dẫn tải video</h2>
          <div className="guide-header-decoration"></div>
        </header>

        <div className="guide-steps">
          <div className="guide-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">
                Sao chép liên kết video
                <Tooltip title="Nhấn để sao chép link mẫu" arrow>
                  <button className="copy-button" onClick={handleCopyClick}>
                    {copied ? (
                      <FaCheckCircle className="copy-icon" color="#4CAF50" />
                    ) : (
                      <FaRegCopy className="copy-icon" />
                    )}
                    <span>{copied ? "Đã sao chép!" : "Sao chép mẫu"}</span>
                  </button>
                </Tooltip>
              </div>
              <p className="step-description">
                Truy cập video bạn muốn tải trên nền tảng, nhấn vào nút <strong>"Chia sẻ"</strong> và chọn <strong>"Sao chép liên kết"</strong>.
              </p>
            </div>
          </div>

          <div className="step-connector">
            <PiArrowRightLight size={20} />
          </div>

          <div className="guide-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">Dán liên kết vào công cụ</div>
              <p className="step-description">
                Chọn đúng nền tảng từ danh sách, dán link vào ô tìm kiếm và nhấn <strong>"Xem trước"</strong> để kiểm tra video.
              </p>
            </div>
          </div>

          <div className="step-connector">
            <PiArrowRightLight size={20} />
          </div>

          <div className="guide-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">Tải video về máy</div>
              <p className="step-description">
                Chọn chất lượng video (HD, Full HD) và nhấn <strong>"Tải xuống"</strong>. Video sẽ được lưu vào bộ nhớ thiết bị của bạn.
              </p>
            </div>
          </div>
        </div>

        <div className="platform-support">
          <div className="support-title">
            <FaInfoCircle className="info-icon" />
            <span>Hỗ trợ các nền tảng</span>
          </div>
          <div className="platform-icons">
            <Tooltip title="Facebook" arrow>
              <div className="platform-icon facebook">
                <SiFacebook size={20} />
              </div>
            </Tooltip>
            <Tooltip title="YouTube" arrow>
              <div className="platform-icon youtube">
                <SiYoutube size={20} />
              </div>
            </Tooltip>
            <Tooltip title="Instagram" arrow>
              <div className="platform-icon instagram">
                <SiInstagram size={20} />
              </div>
            </Tooltip>
            <Tooltip title="TikTok" arrow>
              <div className="platform-icon tiktok">
                <SiTiktok size={20} />
              </div>
            </Tooltip>
          </div>
        </div>

        <footer className="guide-footer">
          <div className="footer-note">
            <span>Lưu ý:</span> Chỉ tải video cho mục đích cá nhân, không hỗ trợ tải nội dung có bản quyền.
          </div>
          <div className="footer-brand">
            Powered by <strong>nhdinh</strong> <span className="version">v2.1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Guide;