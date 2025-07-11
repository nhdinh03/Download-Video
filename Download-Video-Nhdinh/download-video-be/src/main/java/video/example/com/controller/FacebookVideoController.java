package video.example.com.controller;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Map;
import java.util.concurrent.TimeUnit;

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
@CrossOrigin(origins = {"https://your-trusted-domain.com"}) // Thay bằng domain cụ thể
public class FacebookVideoController {

    // Enum để quản lý thông báo lỗi tiếng Việt
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

    // Kiểm tra tính khả dụng của yt-dlp
    private boolean isYtDlpAvailable() {
        try {
            Process process = new ProcessBuilder("yt-dlp", "--version").start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    @GetMapping(value = "/download/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamDownload(@RequestParam String url) {
        SseEmitter emitter = new SseEmitter(300_000L);

        new Thread(() -> {
            try {
                if (!isYtDlpAvailable()) {
                    emitter.send(SseEmitter.event().data("ERROR_" + ErrorMessage.YT_DLP_UNAVAILABLE.getMessage()));
                    emitter.complete();
                    return;
                }

                String filename = FacebookVideoUtil.downloadVideoUsingYtDlp(url, progress -> {
                    try {
                        emitter.send(SseEmitter.event().data(progress));
                    } catch (IOException e) {
                        System.err.println("Client disconnected: " + e.getMessage());
                    }
                });

                emitter.send(SseEmitter.event().data("DONE_" + filename));
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().data("ERROR_" + e.getMessage()));
                } catch (IOException ignored) {
                    // Bỏ qua nếu client đã ngắt kết nối
                }
            } finally {
                emitter.complete();
            }
        }).start();

        return emitter;
    }

    @GetMapping("/download")
    public ResponseEntity<InputStreamResource> downloadVideo(@RequestParam String filename) throws IOException {
        File file = new File(filename);
        if (!file.exists()) {
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
    public ResponseEntity<Map<String, String>> previewVideo(@RequestBody Map<String, String> payload) throws IOException {
        String fbUrl = payload.get("url");
        if (fbUrl == null || !fbUrl.matches("https?://(www\\.)?(facebook\\.com|fb\\.watch|fb\\.com)/.*")) {
            return ResponseEntity.badRequest().body(Map.of("error", ErrorMessage.INVALID_URL.getMessage()));
        }

        if (!isYtDlpAvailable()) {
            return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.YT_DLP_UNAVAILABLE.getMessage()));
        }

        ProcessBuilder pb = new ProcessBuilder("yt-dlp", "-f", "b", "-g", "--get-title", fbUrl);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        String videoTitle = null;
        String directUrl = null;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            videoTitle = reader.readLine(); // Dòng đầu là title
            directUrl = reader.readLine();  // Dòng hai là link mp4

            // Chuẩn hóa tiêu đề video để hiển thị tiếng Việt đúng
            if (videoTitle != null) {
                videoTitle = Normalizer.normalize(videoTitle, Normalizer.Form.NFC);
            }

            // Kiểm tra directUrl hợp lệ
            if (directUrl == null || directUrl.trim().isEmpty()) {
                return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.INVALID_LINK.getMessage()));
            }
        }

        try {
            // Timeout sau 30 giây
            if (!process.waitFor(30, TimeUnit.SECONDS)) {
                process.destroy();
                return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.TIMEOUT.getMessage()));
            }

            int exit = process.exitValue();
            if (exit != 0 || !directUrl.contains(".mp4")) {
                return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.INVALID_LINK.getMessage()));
            }

            return ResponseEntity.ok(Map.of(
                    "videoUrl", directUrl,
                    "title", videoTitle != null ? videoTitle : ""
            ));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(500).body(Map.of("error", ErrorMessage.SYSTEM_ERROR.getMessage()));
        } finally {
            process.destroy(); // Đảm bảo process được giải phóng
        }
    }
}
