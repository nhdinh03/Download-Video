import React, { useState } from "react";
import { Button, Input, Progress, message, Card, Image, Typography } from "antd";
import { FaDownload, FaRegCopy, FaSpinner } from "react-icons/fa";
const { Text, Title } = Typography;

const API_BASE = "http://localhost:8081/api/instagram";  // Backend API URL

function InstagramDownloader() {
  const [url, setUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Kiểm tra URL Instagram hợp lệ
  const isValidInstagramUrl = (input) => {
    const instagramRegex = /^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+\/?/;
    return instagramRegex.test(input.trim());
  };

  // Xem trước video
  const handlePreview = async () => {
    if (!url || !isValidInstagramUrl(url)) {
      setError("Vui lòng nhập link Instagram hợp lệ");
      return;
    }

    setLoadingPreview(true);
    setError('');
    setPreviewUrl('');
    setVideoTitle('');
    setThumbnailUrl('');

    try {
      const res = await fetch(`${API_BASE}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok || !data.videoUrl) {
        throw new Error("Không thể lấy video");
      }

      setPreviewUrl(data.videoUrl); // Set preview video URL
      setVideoTitle(data.title || 'Video');  // Set video title
      setThumbnailUrl(data.thumbnail);  // Set video thumbnail (if available)
    } catch (err) {
      setError("Lỗi: " + (err.message || "Không lấy được video"));
    } finally {
      setLoadingPreview(false);
    }
  };

  // Tải video
  const handleDownload = async () => {
    if (!previewUrl) {
      setError("Vui lòng xem trước video trước khi tải!");
      return;
    }

    setLoadingDownload(true);
    setProgress(0);
    setError('');

    const eventSource = new EventSource(`${API_BASE}/download/stream?url=${encodeURIComponent(url)}`);

    eventSource.onmessage = (e) => {
      const msg = e.data;
      if (msg.startsWith("PROGRESS_")) {
        setProgress(Number(msg.replace("PROGRESS_", "")));
      } else if (msg.startsWith("DONE_")) {
        setProgress(100);
        message.success("Tải video thành công!");
        eventSource.close();
      } else if (msg.startsWith("ERROR_")) {
        setError(msg.replace("ERROR_", ""));
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setError("Mất kết nối máy chủ, đang thử lại...");
      eventSource.close();
    };
  };

  // Function to paste the link from the clipboard
  const handlePasteLink = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const cleanedUrl = clipboardText.trim();
      setUrl(cleanedUrl);
      handlePreview();
    } catch (err) {
      setError("Không thể tự động dán từ clipboard. Hãy thử lại!");
    }
  };

  return (
    <div className="instagram-downloader-container">
      <Card title="Instagram Video Downloader" style={{ width: 600, margin: '0 auto' }}>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Dán link video Instagram"
          allowClear
          enterButton="Xem trước"
          size="large"
          onSearch={handlePreview}
          loading={loadingPreview}
        />
        {/* Dán Link Button */}
        <Button
          onClick={handlePasteLink}
          icon={<FaRegCopy />}
          style={{ marginTop: 10 }}
        >
          Dán link từ clipboard
        </Button>

        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}

        {/* Preview Section */}
        {previewUrl && (
          <div>
            <Title level={4}>{videoTitle}</Title>
            <Image
              src={thumbnailUrl || "https://via.placeholder.com/150"}
              alt="Thumbnail"
              width="100%"
              style={{ borderRadius: 8, marginBottom: 10 }}
            />
            <video src={previewUrl} controls style={{ width: '100%', borderRadius: 8 }} />
            <Button
              type="primary"
              icon={<FaDownload />}
              onClick={handleDownload}
              loading={loadingDownload}
              style={{ marginTop: 10 }}
            >
              {loadingDownload ? "Đang tải..." : "Tải video"}
            </Button>
          </div>
        )}

        {/* Progress Bar */}
        <Progress percent={progress} status="active" strokeColor="#108ee9" style={{ marginTop: 20 }} />
      </Card>
    </div>
  );
}

export default InstagramDownloader;
