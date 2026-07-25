package com.chessengine.engine.installer;

import com.chessengine.config.EngineProperties;
import com.chessengine.exception.EngineException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Slf4j
@Component
public class StockfishInstaller {

    private final EngineProperties properties;

    public StockfishInstaller(EngineProperties properties) {
        this.properties = properties;
    }

    public void ensureBinaryExists() {
        try {
            Path exePath = Paths.get(properties.getBinaryPath());
            if (Files.exists(exePath)) {
                log.info("Stockfish executable already exists at: {}", exePath.toAbsolutePath());
                return;
            }

            log.info("Stockfish executable not found. Downloading from: {}", properties.getDownloadUrl());
            Path dirPath = Paths.get(properties.getBinaryDir());
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            Path tempZip = dirPath.resolve("stockfish_temp.zip");

            HttpClient client = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.ALWAYS)
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(properties.getDownloadUrl()))
                    .build();

            log.info("Downloading Stockfish ZIP archive...");
            HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() != 200) {
                throw new IOException("Failed to download Stockfish. HTTP status: " + response.statusCode());
            }

            try (InputStream is = response.body()) {
                Files.copy(is, tempZip, StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("Download completed. Unzipping and extracting executable...");

            boolean extracted = false;
            try (ZipInputStream zipIn = new ZipInputStream(new FileInputStream(tempZip.toFile()))) {
                ZipEntry entry;
                while ((entry = zipIn.getNextEntry()) != null) {
                    String entryName = entry.getName().toLowerCase();
                    if (entryName.endsWith(".exe") && !entry.isDirectory()) {
                        log.info("Found executable inside zip: {}", entry.getName());
                        Files.copy(zipIn, exePath, StandardCopyOption.REPLACE_EXISTING);
                        extracted = true;
                        zipIn.closeEntry();
                        break;
                    }
                    zipIn.closeEntry();
                }
            } finally {
                Files.deleteIfExists(tempZip);
            }

            if (!extracted) {
                throw new FileNotFoundException("No .exe file found in Stockfish ZIP file.");
            }

            File exeFile = exePath.toFile();
            exeFile.setExecutable(true);
            log.info("Stockfish successfully downloaded and saved to: {}", exeFile.getAbsolutePath());
        } catch (Exception e) {
            throw new EngineException("Failed to ensure Stockfish binary existence: " + e.getMessage(), e);
        }
    }
}
