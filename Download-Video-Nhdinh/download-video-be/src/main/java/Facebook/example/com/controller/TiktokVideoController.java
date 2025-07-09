package Facebook.example.com.controller;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import Facebook.example.com.util.TiktokVideoUtil;
import jakarta.annotation.PreDestroy;

@RestController
@RequestMapping("/api/tiktok")
@CrossOrigin(origins = "${tiktok.allowed.origins:*}")
public class TiktokVideoController {

    private static final Logger logger = LoggerFactory.getLogger(TiktokVideoController.class);
    private static final Set<String> ALLOWED_THUMBNAIL_DOMAINS = new HashSet<>(Arrays.asList(
            "tiktokcdn.com", "muscdn.com"
    ));

    @Value("${tiktok.thread.pool.size:10}")
    private int threadPoolSize;

    @Value("${tiktok.yt.dlp.path:yt-dlp}")
    private String ytDlpPath;

    @Value("${tiktok.proxy:}")
    private String proxy;

    @Value("${tiktok.cookies.path:}")
    private String cookiesPath;

    private final ExecutorService executorService;

    public TiktokVideoController() {
        if (threadPoolSize <= 0) {
            logger.warn("Invalid threadPoolSize ({}), defaulting to 10", threadPoolSize);
            threadPoolSize = 10;
        }
        this.executorService = new ThreadPoolExecutor(
                threadPoolSize, threadPoolSize, 0L, TimeUnit.MILLISECONDS,
                new java.util.concurrent.LinkedBlockingQueue<>(100),
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    private boolean isValidProxy(String proxy) {
        if (proxy == null || proxy.isEmpty()) {
            return false;
        }
        try {
            new java.net.URI(proxy);
            return true;
        } catch (java.net.URISyntaxException e) {
            logger.warn("Invalid proxy URL: {}, error: {}", proxy, e.getMessage());
            return false;
        }
    }

    private boolean isValidThumbnailUrl(String url) {
        if (url == null || !url.startsWith("https://")) {
            return false;
        }
        try {
            java.net.URI uri = new java.net.URI(url);
            String host = uri.getHost();
            return host != null && ALLOWED_THUMBNAIL_DOMAINS.stream().anyMatch(host::endsWith);
        } catch (java.net.URISyntaxException e) {
            logger.warn("Invalid thumbnail URL: {}, error: {}", url, e.getMessage());
            return false;
        }
    }

    @GetMapping(value = "/download/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamDownload(@RequestParam String url) {
        if (url == null || url.length() > 2048 || !url.matches("https?://(www\\.)?(tiktok\\.com|vm\\.tiktok\\.com)/.*")) {
            logger.warn("Invalid URL: {}", url);
            return new SseEmitter(0L);
        }

        SseEmitter emitter = new SseEmitter(300_000L);
        emitter.onCompletion(() -> logger.info("SSE completed for URL: {}", url));
        emitter.onTimeout(() -> {
            emitter.complete();
            logger.warn("SSE timeout for URL: {}", url);
        });

        executorService.submit(() -> {
            int retries = 3;
            String effectiveProxy = isValidProxy(proxy) ? proxy : "";
            while (retries > 0) {
                try {
                    String filename = TiktokVideoUtil.downloadVideoUsingYtDlp(url, ytDlpPath, effectiveProxy, progress -> {
                        try {
                            emitter.send(SseEmitter.event().data(progress));
                        } catch (IOException e) {
                            logger.error("Client disconnected: {}", e.getMessage());
                        }
                    });
                    emitter.send(SseEmitter.event().data("DONE_" + filename));
                    return;
                } catch (Exception e) {
                    retries--;
                    logger.warn("Download attempt failed ({} retries left): {}", retries, e.getMessage());
                    if (retries == 0) {
                        try {
                            emitter.send(SseEmitter.event().data("FALLBACK_" + url));
                        } catch (IOException ignored) {
                            logger.error("Failed to send fallback: {}", ignored.getMessage());
                        }
                    }
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } finally {
                    if (retries == 0) {
                        emitter.complete();
                    }
                }
            }
        });

        return emitter;
    }

    @GetMapping("/download")
    public ResponseEntity<InputStreamResource> downloadVideo(@RequestParam String filename) throws IOException {
        if (filename == null || filename.length() > 255 || !filename.matches("[a-zA-Z0-9\\-\\.]+")) {
            logger.warn("Invalid filename: {}", filename);
            return ResponseEntity.badRequest().build();
        }
        File file = new File(filename);
        if (!file.exists() || !file.isFile()) {
            logger.warn("File not found: {}", filename);
            return ResponseEntity.notFound().build();
        }

        InputStreamResource resource = new InputStreamResource(new FileInputStream(file));
        ResponseEntity<InputStreamResource> response = ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getName())
                .contentLength(file.length())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
        file.delete();
        return response;
    }

    @PostMapping("/preview")
    public ResponseEntity<Map<String, String>> previewVideo(@RequestBody Map<String, String> payload) {
        String tiktokUrl = payload.get("url");
        logger.info("Received preview request for URL: {}", tiktokUrl);

        if (tiktokUrl == null || tiktokUrl.length() > 2048 || !tiktokUrl.matches("https?://(www\\.)?(tiktok\\.com|vm\\.tiktok\\.com)/.*")) {
            logger.warn("Invalid TikTok URL: {}", tiktokUrl);
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid TikTok URL."));
        }

        int retries = 3;
        String videoTitle = null;
        String thumbnail = null;
        StringBuilder output = new StringBuilder();
        String effectiveProxy = isValidProxy(proxy) ? proxy : "";

        while (retries > 0) {
            ProcessBuilder pb = new ProcessBuilder(
                    ytDlpPath,
                    "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "--add-header", "Referer:https://www.tiktok.com/",
                    "--add-header", "Origin:https://www.tiktok.com",
                    "--no-check-certificate", // Avoid SSL issues
                    "--extractor-retries", "3", // Increase extractor retries
                    !effectiveProxy.isEmpty() && !cookiesPath.isEmpty() ? "--cookies" : "--no-cache-dir",
                    !effectiveProxy.isEmpty() && !cookiesPath.isEmpty() ? cookiesPath : effectiveProxy.isEmpty() ? "" : effectiveProxy,
                    "--print", "title", "--print", "thumbnail", tiktokUrl
            );
            pb.redirectErrorStream(true);
            Process process = null;
            try {
                logger.debug("Executing yt-dlp with command: {}", pb.command());
                process = pb.start();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        output.append(line).append("\n");
                        logger.debug("yt-dlp output: {}", line);
                        if (line.startsWith("https://") && isValidThumbnailUrl(line)) {
                            thumbnail = line;
                            logger.info("Found valid thumbnail: {}", thumbnail);
                        } else if (!line.startsWith("[") && !line.isEmpty() && !line.contains("ERROR") && videoTitle == null) {
                            videoTitle = line;
                            logger.info("Found video title: {}", videoTitle);
                        }
                    }
                }
                int exitCode = process.waitFor();
                logger.info("yt-dlp process completed with exit code: {}", exitCode);
                if (exitCode == 0 && thumbnail != null && isValidThumbnailUrl(thumbnail)) {
                    return ResponseEntity.ok(Map.of(
                            "title", videoTitle != null ? videoTitle : "Untitled",
                            "thumbnail", thumbnail
                    ));
                }
                logger.warn("yt-dlp attempt failed ({} retries left), exit code: {}, output: {}", retries - 1, exitCode, output.toString());
                retries--;
                if (retries == 2 && !effectiveProxy.isEmpty()) {
                    logger.info("Retrying without proxy due to proxy failure");
                    effectiveProxy = "";
                } else if (retries > 0) {
                    Thread.sleep(1000);
                }
            } catch (IOException e) {
                logger.error("IO error executing yt-dlp: {}, output: {}", e.getMessage(), output.toString(), e);
                retries--;
                if (retries == 2 && !effectiveProxy.isEmpty()) {
                    logger.info("Retrying without proxy due to proxy failure");
                    effectiveProxy = "";
                } else if (retries > 0) {
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                logger.error("Process interrupted: {}, output: {}", e.getMessage(), output.toString(), e);
                retries = 0;
            } catch (Exception e) {
                logger.error("Unexpected error executing yt-dlp: {}, output: {}", e.getMessage(), output.toString(), e);
                retries--;
                if (retries > 0) {
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
            } finally {
                if (process != null) {
                    process.destroy();
                }
            }
        }

        logger.error("All retries failed for URL: {}, output: {}", tiktokUrl, output.toString());
        return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to fetch video information. Video may be private, region-restricted, or blocked by TikTok. Try downloading directly.",
                "thumbnail", thumbnail != null && isValidThumbnailUrl(thumbnail) ? thumbnail : "https://via.placeholder.com/300x150?text=Thumbnail",
                "title", videoTitle != null ? videoTitle : "Untitled"
        ));
    }

    @PreDestroy
    public void shutdown() {
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
        }
        File tempDir = new File(System.getProperty("java.io.tmpdir"));
        File[] tempFiles = tempDir.listFiles((dir, name) -> name.endsWith(".mp4"));
        if (tempFiles != null) {
            for (File file : tempFiles) {
                if (file.lastModified() < System.currentTimeMillis() - 24 * 60 * 60 * 1000) {
                    file.delete();
                }
            }
        }
    }
}
