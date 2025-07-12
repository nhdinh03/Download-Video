package video.example.com.controller;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
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

import video.example.com.util.FacebookVideoUtil;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${app.cors.origins:http://localhost:3000,https://your-trusted-domain.com}") // Dynamic từ properties
public class FacebookVideoController {

    private static final Logger log = LoggerFactory.getLogger(FacebookVideoController.class);

    @Value("${app.yt.timeout:30}")
    private int ytTimeoutSeconds;

    // Enum cho error messages
    public enum ErrorMessage {
        INVALID_URL("URL không hợp lệ. Vui lòng kiểm tra lại định dạng URL."),
        INVALID_LINK("Không thể lấy video từ link. Vui lòng thử link khác."),
        SYSTEM_ERROR("Lỗi hệ thống. Vui lòng thử lại sau."),
        YT_DLP_UNAVAILABLE("yt-dlp không khả dụng trên hệ thống."),
        TIMEOUT("Hết thời gian xử lý video. Vui lòng thử lại.");

        private final String message;

        ErrorMessage(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }

    // Thread pool để reuse threads, tốt cho performance
    private final ExecutorService executor = Executors.newFixedThreadPool(5); // Configurable

    // Kiểm tra yt-dlp, với logging
    private boolean isYtDlpAvailable() {
        try {
            Process process = new ProcessBuilder("yt-dlp", "--version").start();
            int exitCode = process.waitFor();
            log.info("yt-dlp check: exit code {}", exitCode);
            return exitCode == 0;
        } catch (IOException | InterruptedException e) {
            log.error("yt-dlp unavailable", e);
            Thread.currentThread().interrupt();
            return false;
        }
    }

    @GetMapping(value = "/download/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamDownload(@RequestParam String url) {
        SseEmitter emitter = new SseEmitter(300_000L);

        executor.submit(() -> {
            Process ytProcess = null;
            try {
                if (!isYtDlpAvailable()) {
                    emitter.send(SseEmitter.event().data("ERROR_" + ErrorMessage.YT_DLP_UNAVAILABLE.getMessage()));
                    return;
                }

                // Giả sử FacebookVideoUtil trả về filename và handle progress callback
                String filename = FacebookVideoUtil.downloadVideoUsingYtDlp(url, progress -> {
                    try {
                        emitter.send(SseEmitter.event().data("PROGRESS_" + progress));
                    } catch (IOException e) {
                        log.warn("Client disconnected during progress", e);
                    }
                });

                emitter.send(SseEmitter.event().data("DONE_" + filename));
            } catch (Exception e) {
                log.error("Download error for url: {}", url, e);
                try {
                    emitter.send(SseEmitter.event().data("ERROR_" + e.getMessage()));
                } catch (IOException ignored) {}
            } finally {
                emitter.complete();
                // Cleanup nếu có process trong Util
            }
        });

        return emitter;
    }

    @GetMapping("/download")
    public ResponseEntity<InputStreamResource> downloadVideo(@RequestParam String filename) throws IOException {
        File file = new File(filename);
        if (!file.exists()) {
            log.warn("File not found: {}", filename);
            return ResponseEntity.notFound().build();
        }

        InputStreamResource resource = new InputStreamResource(new FileInputStream(file));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getName())
                .contentLength(file.length())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @PostMapping("/preview")
    public ResponseEntity<Map<String, String>> previewVideo(@RequestBody Map<String, String> payload) {
        String fbUrl = payload.get("url");
        if (fbUrl == null || !fbUrl.matches("https?://(www\\.)?(facebook\\.com|fb\\.watch|fb\\.com)/.*")) {
            log.warn("Invalid URL: {}", fbUrl);
            return ResponseEntity.badRequest().body(Map.of("error", ErrorMessage.INVALID_URL.getMessage()));
        }

        if (!isYtDlpAvailable()) {
            return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.YT_DLP_UNAVAILABLE.getMessage()));
        }

        Process process = null;
        try {
            ProcessBuilder pb = new ProcessBuilder("yt-dlp", "-f", "b", "-g", "--get-title", fbUrl);
            pb.redirectErrorStream(true);
            process = pb.start();

            String videoTitle = null;
            String directUrl = null;

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                videoTitle = reader.readLine();
                directUrl = reader.readLine();

                if (videoTitle != null) {
                    videoTitle = Normalizer.normalize(videoTitle, Normalizer.Form.NFC);
                }

                if (directUrl == null || directUrl.trim().isEmpty()) {
                    return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.INVALID_LINK.getMessage()));
                }
            }

            if (!process.waitFor(ytTimeoutSeconds, TimeUnit.SECONDS)) {
                log.warn("Timeout for yt-dlp preview: {}", fbUrl);
                return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.TIMEOUT.getMessage()));
            }

            int exit = process.exitValue();
            if (exit != 0 || !directUrl.contains(".mp4")) {
                log.error("yt-dlp failed with exit {} for {}", exit, fbUrl);
                return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.INVALID_LINK.getMessage()));
            }

            return ResponseEntity.ok(Map.of(
                    "videoUrl", directUrl,
                    "title", videoTitle != null ? videoTitle : ""
            ));
        } catch (IOException | InterruptedException e) {
            log.error("Preview error for {}", fbUrl, e);
            Thread.currentThread().interrupt();
            return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.SYSTEM_ERROR.getMessage()));
        } finally {
            if (process != null && process.isAlive()) {
                process.destroyForcibly(); // Cleanup mạnh hơn
            }
        }
    }
}