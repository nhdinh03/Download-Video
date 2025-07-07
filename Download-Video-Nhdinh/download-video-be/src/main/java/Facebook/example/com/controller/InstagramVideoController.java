package Facebook.example.com.controller;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import Facebook.example.com.util.InstagramVideoUtil;

@RestController
@RequestMapping("/api/instagram")
@CrossOrigin(origins = "*")
public class InstagramVideoController {

    // Create logger instance
    private static final Logger logger = LoggerFactory.getLogger(InstagramVideoController.class);

    // Endpoint to fetch video preview (getting video URL)
    @PostMapping("/preview")
    public ResponseEntity<Object> previewVideo(@RequestBody String url) {
        logger.info("Received preview request for URL: {}", url);

        String videoUrl = fetchVideoUrl(url);  // Implement video URL fetching logic

        if (videoUrl == null) {
            logger.error("Invalid Instagram URL or unable to fetch video for URL: {}", url);
            return ResponseEntity.badRequest().body("{\"error\": \"Invalid Instagram URL or unable to fetch video.\"}");
        }

        logger.info("Successfully fetched video URL: {}", videoUrl);
        return ResponseEntity.ok("{\"videoUrl\": \"" + videoUrl + "\", \"title\": \"Video Title\"}");
    }

    // Method to fetch video URL (using an external service or scraping)
    private String fetchVideoUrl(String instagramUrl) {
        // Implement actual scraping logic or use a third-party service
        logger.debug("Fetching video URL for Instagram URL: {}", instagramUrl);
        return "https://instagram.com/path/to/video.mp4";  // This is a mock URL
    }

    // Endpoint to handle real-time download progress for Instagram videos
    @GetMapping(value = "/download/stream", produces = "text/event-stream")
    public SseEmitter streamDownload(@RequestParam String url) {
        logger.info("Received download request for URL: {}", url);
        
        SseEmitter emitter = new SseEmitter(300_000L);  // Timeout of 5 minutes

        new Thread(() -> {
            try {
                logger.info("Starting download process for URL: {}", url);
                
                // Call the method that downloads the video with progress tracking
                String filename = InstagramVideoUtil.downloadVideoUsingYtDlp(url, progress -> {
                    try {
                        emitter.send(SseEmitter.event().data(progress)); // Send download progress
                    } catch (IOException e) {
                        logger.error("Error sending progress update for download: {}", e.getMessage());
                    }
                });

                emitter.send(SseEmitter.event().data("DONE_" + filename));  // Send completion message
                logger.info("Download completed for file: {}", filename);
            } catch (Exception e) {
                logger.error("Error during download: {}", e.getMessage());
                try {
                    emitter.send(SseEmitter.event().data("ERROR_" + e.getMessage())); // Send error message
                } catch (IOException ignored) {
                    logger.error("Error sending error message to client: {}", ignored.getMessage());
                }
            } finally {
                emitter.complete();  // End the SSE stream
            }
        }).start();

        return emitter;
    }

    // Endpoint to handle video download initiation
    @GetMapping("/download")
    public ResponseEntity<Object> downloadVideo(@RequestParam String videoUrl) {
        logger.info("Received request to download video: {}", videoUrl);
        
        boolean downloadStarted = startDownload(videoUrl);  // Start the download process

        if (!downloadStarted) {
            logger.error("Failed to start the download for URL: {}", videoUrl);
            return ResponseEntity.status(500).body("Failed to start the download.");
        }

        logger.info("Download process started for URL: {}", videoUrl);
        return ResponseEntity.ok("Video download started.");
    }

    // Mock method for initiating the download
    private boolean startDownload(String videoUrl) {
        // Implement your actual download logic here
        logger.debug("Starting download logic for URL: {}", videoUrl);
        return true;
    }
}
