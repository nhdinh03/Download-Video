package Facebook.example.com.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.UUID;
import java.util.function.Consumer;

public class FacebookVideoUtil {

    public static String downloadVideoUsingYtDlp(String fbUrl, Consumer<String> progressCallback) throws IOException {
        String outputPath = System.getProperty("java.io.tmpdir") + File.separator + UUID.randomUUID() + ".mp4";

        ProcessBuilder pb = new ProcessBuilder(
                "yt-dlp", "--newline", "-f", "best", "-o", outputPath, fbUrl
        );
        pb.redirectErrorStream(true);

        Process process = pb.start();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("[yt-dlp] " + line);
                if (progressCallback != null && line.matches(".*?(\\d{1,3})\\.\\d+%.*")) {
                    String percent = line.replaceAll(".*?(\\d{1,3})\\.\\d+%.*", "$1");
                    progressCallback.accept("PROGRESS_" + percent);
                }
            }
        } catch (Exception e) {
            throw new IOException("Download failed: " + e.getMessage(), e);
        }

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
