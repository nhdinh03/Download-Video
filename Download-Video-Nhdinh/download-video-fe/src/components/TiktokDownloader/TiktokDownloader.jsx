import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  FaTiktok,
  FaDownload,
  FaRegCopy,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaArrowLeft,
} from "react-icons/fa";
import "./TiktokDownloader.scss";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8081/api/tiktok";

const TiktokDownloader = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState({ preview: false, download: false });
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const sseRef = useRef(null);
  const location = useLocation();
  const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);

  const isValidTiktokUrl = useCallback((input) => {
    try {
      const cleaned = decodeURIComponent(input.trim());
      const urlObj = new URL(cleaned);
      return (
        urlObj.hostname.includes("tiktok.com") ||
        urlObj.hostname.includes("vm.tiktok.com")
      );
    } catch {
      return false;
    }
  }, []);

  const handlePreview = useCallback(
    async (inputUrl = url) => {
      if (!inputUrl || !isValidTiktokUrl(inputUrl)) {
        setError("Please enter a valid TikTok video URL!");
        return;
      }
      setLoading((prev) => ({ ...prev, preview: true }));
      setError("");
      setSuccess("");
      setPreviewUrl("");
      setVideoTitle("");
      setThumbnail("");
      try {
        const res = await fetch(`${API_BASE}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: inputUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Could not fetch video. Please try another URL or check your connection.");
        }
        setPreviewUrl(data.videoUrl);
        setVideoTitle(data.title || "Untitled");
        setThumbnail(
          data.thumbnail || "https://via.placeholder.com/300x150?text=Thumbnail"
        );
      } catch (err) {
        setError("Error: " + (err.message || "Could not fetch video. Please try again later."));
      } finally {
        setLoading((prev) => ({ ...prev, preview: false }));
      }
    },
    [url, isValidTiktokUrl]
  );

  const handleDownload = useCallback(() => {
    if (!isValidTiktokUrl(url)) {
      setError("Please enter a valid TikTok video URL!");
      return;
    }
    setLoading((prev) => ({ ...prev, download: true }));
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
        setSuccess("Video is ready to download...");
        const tempLink = document.createElement("a");
        tempLink.href = `${API_BASE}/download?filename=${encodeURIComponent(
          fileName
        )}`;
        tempLink.download = fileName;
        tempLink.click();
        setSuccess("Video downloaded successfully!");
        setLoading((prev) => ({ ...prev, download: false }));

        try {
          const history = JSON.parse(
            localStorage.getItem("downloadHistory") || "[]"
          );
          history.unshift({
            id: Date.now(),
            url,
            title: videoTitle || "Untitled",
            previewUrl,
            thumbnail,
            timestamp: new Date().toISOString(),
            platform: "tiktok",
          });
          localStorage.setItem(
            "downloadHistory",
            JSON.stringify(history.slice(0, 50))
          );
        } catch {
          setError("Failed to save download history");
        }
        eventSource.close();
      } else if (msg.startsWith("ERROR_")) {
        setError(msg.replace("ERROR_", ""));
        setLoading((prev) => ({ ...prev, download: false }));
        eventSource.close();
      } else if (msg.startsWith("FALLBACK_")) {
        const fallbackUrl = msg.replace("FALLBACK_", "");
        window.open(fallbackUrl, "_blank");
        setSuccess(
          "Server failed to download; opened TikTok URL for manual download."
        );
        setLoading((prev) => ({ ...prev, download: false }));
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      if (progress < 100) {
        setError("Lost server connection. Retrying...");
        eventSource.close();
        setTimeout(handleDownload, 2000);
      }
    };
  }, [url, isValidTiktokUrl, videoTitle, previewUrl, thumbnail, progress]);

  const handleCopy = useCallback(() => {
    if (navigator.clipboard && previewUrl) {
      navigator.clipboard.writeText(previewUrl);
      setSuccess("Link copied successfully!");
      setTimeout(() => setSuccess(""), 1500);
    } else {
      setError("Unable to copy link!");
    }
  }, [previewUrl]);

  const handleBack = () => {
    setUrl("");
    setPreviewUrl("");
    setVideoTitle("");
    setThumbnail("");
    setError("");
    setSuccess("");
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlFromQuery = params.get("url");
    if (urlFromQuery) {
      const decodedUrl = decodeURIComponent(urlFromQuery);
      setUrl(decodedUrl);
      handlePreview(decodedUrl);
    }
  }, [location, handlePreview]);

  return (
    <div className="main-center">
      <div className="tiktok-downloader-root">
        {!previewUrl && (
          <>
            <div className="tiktok-header">
              <FaTiktok className="tiktok-logo" />
              <span className="tiktok-title">TikTok Video Downloader</span>
            </div>
            <div className="tiktok-input-group">
              <input
                type="url"
                className={`tiktok-input ${
                  url && !isValidTiktokUrl(url) ? "tiktok-input-error" : ""
                }`}
                placeholder="Paste TikTok video URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePreview()}
                spellCheck={false}
                autoFocus
                autoComplete="off"
                aria-label="Enter TikTok video URL"
              />
              <button
                className="tiktok-btn tiktok-btn-preview"
                onClick={async () => {
                  try {
                    const clipboardText = await navigator.clipboard.readText();
                    const cleanedUrl = clipboardText.trim();
                    setUrl(cleanedUrl);
                    handlePreview(cleanedUrl);
                  } catch {
                    setError(
                      isMobile
                        ? "Please paste manually!"
                        : "Unable to read clipboard!"
                    );
                  }
                }}
                disabled={loading.preview}
                aria-label={
                  loading.preview
                    ? "Processing preview"
                    : "Paste and preview video"
                }
              >
                {loading.preview ? (
                  <FaSpinner className="tiktok-spin" />
                ) : (
                  <FaRegCopy />
                )}
                {loading.preview ? "Processing..." : "Paste & Preview"}
              </button>
            </div>
          </>
        )}

        {previewUrl && !loading.preview && (
          <div className="tiktok-preview-row">
            <div className="tiktok-preview-col tiktok-preview-video">
              {videoTitle && (
                <div
                  className="tiktok-video-title"
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
              <video
                src={previewUrl}
                controls
                className="tiktok-video-preview"
                style={{ maxWidth: "100%" }}
                poster={thumbnail}
                onError={() =>
                  setError("Failed to load video preview. Try downloading instead.")
                }
              />
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View video on TikTok"
              >
                View Video on TikTok
              </a>
            </div>
            <div className="tiktok-preview-col tiktok-preview-actions">
              <button
                className="tiktok-btn tiktok-btn-download"
                onClick={handleDownload}
                disabled={loading.download}
                aria-label="Download video"
              >
                {loading.download ? (
                  <FaSpinner className="tiktok-spin" />
                ) : (
                  <FaDownload />
                )}
                {loading.download ? "Downloading..." : "Download Video"}
              </button>
              <button
                className="tiktok-btn tiktok-btn-copy"
                onClick={handleCopy}
                disabled={!previewUrl}
                aria-label="Copy video link"
              >
                <FaRegCopy />
                Copy Link
              </button>
              <button
                className="tiktok-btn tiktok-btn-back"
                onClick={handleBack}
                aria-label="Go back"
              >
                <FaArrowLeft /> Another Video
              </button>
            </div>
          </div>
        )}
        {loading.download && (
          <div className="tiktok-progress-wrap">
            <div className="tiktok-progress-bar-bg">
              <div
                className="tiktok-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="tiktok-progress-label">{progress}%</div>
          </div>
        )}
        {(error || success) && (
          <div
            className={`tiktok-alert ${
              success ? "tiktok-alert-success" : "tiktok-alert-error"
            }`}
          >
            {success ? <FaCheckCircle /> : <FaTimesCircle />}
            {success || error}
          </div>
        )}
        <br />
        {!previewUrl && (
          <div className="tiktok-guide">
            <b>Guide:</b> Paste a TikTok video URL in the box above{" "}
            {isMobile && "(long press to paste)"}, then click{" "}
            <b>Paste & Preview</b> → when the video preview appears, click{" "}
            <b>Download Video</b>. If preview fails, try downloading directly.
          </div>
        )}
        <div className="tiktok-powered">
          <br />© {new Date().getFullYear()} Nhdinh TikTok Video Downloader. All
          rights reserved.
        </div>
      </div>
    </div>
  );
};

export default TiktokDownloader;