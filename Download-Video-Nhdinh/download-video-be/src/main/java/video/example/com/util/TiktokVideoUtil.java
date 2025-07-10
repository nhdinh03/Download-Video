package video.example.com.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.UUID;
import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TiktokVideoUtil {

    private static final Logger logger = LoggerFactory.getLogger(TiktokVideoUtil.class);
    private static final String TEMP_DIR = System.getProperty("java.io.tmpdir");

    public static String downloadVideoUsingYtDlp(String tiktokUrl, String ytDlpPath, String proxy, Consumer<String> progressCallback) throws IOException {
        if (!new File(ytDlpPath).canExecute()) {
            throw new IOException("yt-dlp executable not found at " + ytDlpPath);
        }

        String outputPath = TEMP_DIR + File.separator + UUID.randomUUID() + ".mp4";
        StringBuilder output = new StringBuilder();

        ProcessBuilder pb = new ProcessBuilder(
                ytDlpPath,
                "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "--add-header", "Referer:https://www.tiktok.com/",
                "--add-header", "Origin:https://www.tiktok.com",
                "--no-check-certificate",
                "--ignore-config",
                proxy.isEmpty() ? "--no-cache-dir" : "--proxy", proxy.isEmpty() ? "--newline" : proxy,
                "--newline", "-f", "b", "-o", outputPath, tiktokUrl
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                if (progressCallback != null && line.matches(".*?(\\d{1,3})\\.\\d+%.*")) {
                    String percent = line.replaceAll(".*?(\\d{1,3})\\.\\d+%.*", "$1");
                    try {
                        int progress = Integer.parseInt(percent);
                        if (progress >= 0 && progress <= 100) {
                            progressCallback.accept("PROGRESS_" + progress);
                        }
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid progress format: {}", line);
                    }
                }
            }
            logger.debug("yt-dlp output: {}", output.toString());
        } catch (IOException e) {
            throw new IOException("Failed to read yt-dlp output: " + e.getMessage() + ", output: " + output.toString(), e);
        }

        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("yt-dlp exited with code " + exitCode + ", output: " + output.toString());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted during download: " + e.getMessage() + ", output: " + output.toString(), e);
        }

        return outputPath;
    }
}