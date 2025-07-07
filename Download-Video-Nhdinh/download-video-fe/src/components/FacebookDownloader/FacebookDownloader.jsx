import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FaFacebook,
  FaDownload,
  FaRegCopy,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaArrowLeft,
} from "react-icons/fa";
import "./FacebookDownloader.scss";

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("192.168.")
    ? `http://${window.location.hostname}:8081/api`
    : "https://your-production-domain.com/api";

export default function FacebookDownloader() {
  const [url, setUrl] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const sseRef = useRef(null);

  // Kiểm tra URL Facebook hợp lệ
  const isValidFacebookUrl = useCallback((input) => {
    try {
      const cleaned = decodeURIComponent(input.trim());
      const urlObj = new URL(cleaned);
      const host = urlObj.hostname;
      return (
        host.endsWith("facebook.com") ||
        host.endsWith("fb.watch") ||
        host.endsWith("fb.com")
      );
    } catch {
      return false;
    }
  }, []);

  // Xem trước video
  const handlePreview = useCallback(
    async (inputUrl = url) => {
      if (!inputUrl) return; // Đừng chạy khi chưa nhập gì
      if (!isValidFacebookUrl(inputUrl)) {
        setError("Vui lòng nhập đúng link video Facebook!");
        return;
      }
      setLoadingPreview(true);
      setError("");
      setSuccess("");
      setPreviewUrl("");
      setCopied(false);
      setVideoTitle("");
      try {
        const res = await fetch(`${API_BASE}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: inputUrl }),
        });
        const data = await res.json();
        if (!res.ok || !data.videoUrl)
          throw new Error(data.error || "Không lấy được video");
        setPreviewUrl(data.videoUrl);
        setVideoTitle(data.title || "");
      } catch (err) {
        setError("Lỗi: " + (err?.message || "Không lấy được video"));
      } finally {
        setLoadingPreview(false);
      }
    },
    [url, isValidFacebookUrl]
  );

  // Tải video (theo dõi tiến trình)
  const handleDownload = useCallback(() => {
    if (!isValidFacebookUrl(url)) {
      setError("Vui lòng nhập đúng link video Facebook!");
      return;
    }
    setLoadingDownload(true);
    setProgress(0);
    setError("");
    setSuccess("");

    const eventSource = new EventSource(
      `${API_BASE}/download/stream?url=${encodeURIComponent(url)}`
    );
    sseRef.current = eventSource;

    eventSource.onmessage = (e) => {
      const msg = e.data;
      if (msg.startsWith("PROGRESS_")) {
        setProgress(Number(msg.replace("PROGRESS_", "")));
      } else if (msg.startsWith("DONE_")) {
        const fileName = msg.replace("DONE_", "");
        setProgress(100);
        setSuccess("Video đã sẵn sàng để tải xuống...");
        const tempLink = document.createElement("a");
        tempLink.href = `${API_BASE}/download?filename=${encodeURIComponent(
          fileName
        )}`;
        tempLink.download = fileName;
        tempLink.click();
        setSuccess("Tải video thành công!");
        setLoadingDownload(false);
        eventSource.close();
      } else if (msg.startsWith("ERROR_")) {
        setError(msg.replace("ERROR_", ""));
        setLoadingDownload(false);
        eventSource.close();
      }
    };
    eventSource.onerror = () => {
      if (progress < 100) {
        setError("Mất kết nối máy chủ, đang thử lại...");
        eventSource.close();
        setTimeout(() => handleDownload(), 2000);
      }
    };
  }, [url, isValidFacebookUrl, progress]);

  // Cleanup SSE khi component unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  // Quay lại/chọn video khác
  const handleBack = () => {
    setUrl("");
    setPreviewUrl("");
    setSuccess("");
    setError("");
    setCopied(false);
    setProgress(0);
    setVideoTitle("");
  };

  const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);

  return (
    <div className="main-center">
      <div className="fb-downloader-root">
        {/* Header + Input: chỉ hiển thị khi chưa xem trước */}
        {!previewUrl && (
          <>
            <div className="fb-header">
              <FaFacebook className="fb-logo" />
              <span className="fb-title">
                Facebook Video <br className="hide-on-pc" /> Downloader
              </span>
            </div>
            <div className="fb-input-group">
              <input
                type="url"
                className={`fb-input${
                  url && !isValidFacebookUrl(url) ? " fb-input-error" : ""
                }`}
                placeholder="Dán link video Facebook..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePreview(url);
                }}
                spellCheck={false}
                autoFocus
                autoComplete="off"
              />
              <button
                className="fb-btn fb-btn-preview"
                onClick={async () => {
                  try {
                    if (!navigator.clipboard)
                      throw new Error("Clipboard API không khả dụng.");
                    const clipboardText = await navigator.clipboard.readText();
                    const cleanedUrl = clipboardText.trim();
                    setUrl(cleanedUrl);
                    handlePreview(cleanedUrl);
                  } catch (err) {
                    setError(
                      isMobile
                        ? "Không thể tự động dán từ clipboard, hãy dán thủ công!"
                        : "Không thể đọc clipboard. Hãy thử lại hoặc tự dán link!"
                    );
                  }
                }}
                disabled={loadingPreview}
              >
                {loadingPreview ? (
                  <FaSpinner className="fb-spin" />
                ) : (
                  <FaRegCopy />
                )}
                {loadingPreview ? "Đang xử lý..." : "Dán & Xem trước"}
              </button>
            </div>
          </>
        )}

        {/* Khu vực xem trước video */}
        {previewUrl && (
          <div className="fb-preview-row">
            <div className="fb-preview-col fb-preview-video">
              {/* Tiêu đề video (nếu có) */}
              {videoTitle && (
                <div
                  className="fb-video-title"
                  style={{
                    fontWeight: 600,
                    fontSize: "1.12rem",
                    marginBottom: 10,
                    color: "#1b2535",
                  }}
                >
                  {videoTitle}
                </div>
              )}
              <video src={previewUrl} controls className="fb-video-preview" />
            </div>

            {/* Các nút hành động: Tải, Copy, Tiến trình, Quay lại */}
            <div className="fb-preview-col fb-preview-actions">
              <button
                className="fb-btn fb-btn-download"
                onClick={handleDownload}
                disabled={loadingDownload}
              >
                {loadingDownload ? (
                  <FaSpinner className="fb-spin" />
                ) : (
                  <FaDownload />
                )}
                {loadingDownload ? "Đang tải..." : "Lưu về máy"}
              </button>
              <button
                className="fb-btn fb-btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(previewUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                disabled={copied}
              >
                {copied ? <FaCheckCircle color="#43a047" /> : <FaRegCopy />}
                {copied ? "Đã copy link" : "Copy link"}
              </button>
              {loadingDownload && (
                <div className="fb-progress-wrap">
                  <div className="fb-progress-bar-bg">
                    <div
                      className="fb-progress-bar"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="fb-progress-label">{progress}%</div>
                </div>
              )}
              <button className="fb-btn fb-btn-back" onClick={handleBack}>
                <FaArrowLeft /> Video khác
              </button>
            </div>
          </div>
        )}

        {/* Thông báo lỗi/thành công */}
        {(error || success) && (
          <div
            className={`fb-alert ${
              success ? "fb-alert-success" : "fb-alert-error"
            }`}
          >
            {success ? <FaCheckCircle /> : <FaTimesCircle />}
            {success || error}
          </div>
        )}

        {/* Hướng dẫn sử dụng (chỉ hiện khi chưa có preview) */}
        {!previewUrl && (
          <div className="fb-guide">
            <b>Hướng dẫn:</b> Hãy dán link video Facebook vào ô trên{" "}
            {isMobile && "(nhấn giữ để dán trên điện thoại)"}, sau đó bấm{" "}
            <b>Dán & Xem trước</b> → khi video hiện ra, bấm <b>Lưu về máy</b> để
            tải.
          </div>
        )}

        <div className="fb-powered">
          © {new Date().getFullYear()} Facebook Video Downloader. All rights
          reserved.
        </div>
      </div>
    </div>
  );
}
