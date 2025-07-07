package Facebook.example.com.util;


import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.UUID;
import java.util.function.Consumer;

public class InstagramVideoUtil {

    public static String downloadVideoUsingYtDlp(String instaUrl, Consumer<String> progressCallback) throws IOException {
        // Specify the output path where the video will be saved
        String outputPath = System.getProperty("java.io.tmpdir") + File.separator + UUID.randomUUID() + ".mp4";

        // Build the yt-dlp command to download the video
        ProcessBuilder pb = new ProcessBuilder(
                "yt-dlp", "--newline", "-f", "best", "-o", outputPath, instaUrl
        );
        pb.redirectErrorStream(true);

        // Start the yt-dlp process
        Process process = pb.start();

        // Capture and parse the process output for progress tracking
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (progressCallback != null && line.matches(".*?(\\d{1,3})\\.\\d+%.*")) {
                    String percent = line.replaceAll(".*?(\\d{1,3})\\.\\d+%.*", "$1");
                    progressCallback.accept("PROGRESS_" + percent);  // Send progress updates to client
                }
            }
        } catch (Exception e) {
            throw new IOException("Download failed: " + e.getMessage(), e);
        }

        // Wait for the download process to complete
        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("yt-dlp exited with code " + exitCode);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted", e);
        }

        return outputPath;
    }
}

