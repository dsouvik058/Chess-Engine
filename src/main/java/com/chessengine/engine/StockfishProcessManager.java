package com.chessengine.engine;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import com.chessengine.dto.GameStatusDTO;

@Slf4j
@Component
public class StockfishProcessManager {

    @Value("${stockfish.download-url}")
    private String downloadUrl;

    @Value("${stockfish.binary-dir}")
    private String binaryDir;

    @Value("${stockfish.binary-path}")
    private String binaryPath;

    @Value("${stockfish.default-elo}")
    private int defaultElo;

    @Value("${stockfish.default-depth}")
    private int defaultDepth;

    @Value("${stockfish.default-movetime}")
    private int defaultMovetime;

    private Process process;
    private BufferedWriter writer;
    private BufferedReader reader;

    @PostConstruct
    public synchronized void init() {
        try {
            ensureBinaryExists();
            startEngine();
        } catch (Exception e) {
            log.error("Failed to initialize Stockfish engine process", e);
        }
    }

    private void ensureBinaryExists() throws Exception {
        Path exePath = Paths.get(binaryPath);
        if (Files.exists(exePath)) {
            log.info("Stockfish executable already exists at: {}", exePath.toAbsolutePath());
            return;
        }

        log.info("Stockfish executable not found. Downloading from: {}", downloadUrl);
        Path dirPath = Paths.get(binaryDir);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        Path tempZip = dirPath.resolve("stockfish_temp.zip");
        
        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(downloadUrl))
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
    }

    private synchronized void startEngine() throws IOException {
        log.info("Starting Stockfish process: {}", binaryPath);
        ProcessBuilder pb = new ProcessBuilder(binaryPath);
        pb.redirectErrorStream(true);
        process = pb.start();

        writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
        reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

        // Initialize UCI
        sendCommand("uci");
        String line;
        while ((line = reader.readLine()) != null) {
            log.debug("UCI Init: {}", line);
            if (line.equals("uciok")) {
                break;
            }
        }
        log.info("Stockfish UCI engine initialized successfully.");
    }

    private synchronized void sendCommand(String command) throws IOException {
        log.debug("Sending command: {}", command);
        writer.write(command + "\n");
        writer.flush();
    }

    /**
     * Executes a search on Stockfish using the UCI protocol.
     * Synchronized to ensure thread-safety across API requests.
     */
    public synchronized GameStatusDTO calculateBestMove(String fen, List<String> moves, Integer movetime, Integer depth, Integer elo) {
        try {
            if (process == null || !process.isAlive()) {
                log.warn("Stockfish process not running. Attempting restart...");
                startEngine();
            }

            // Determine side to move to normalize evaluation scores (so positive always means white is better)
            String sideToMove = "w";
            if (fen != null && !fen.trim().isEmpty()) {
                String[] fenParts = fen.split("\\s+");
                if (fenParts.length > 1) {
                    sideToMove = fenParts[1].toLowerCase();
                }
            } else if (moves != null && !moves.isEmpty()) {
                sideToMove = (moves.size() % 2 == 0) ? "w" : "b";
            }
            final String finalSideToMove = sideToMove;

            // Configure engine strength options
            int targetElo = elo != null ? elo : defaultElo;
            if (targetElo >= 3200) {
                // Maximum strength: turn off limiting
                sendCommand("setoption name UCI_LimitStrength value false");
                sendCommand("setoption name Skill Level value 20");
            } else if (targetElo < 1350) {
                // Map low ELO directly to Stockfish Skill Level [0-20] to go below standard 1350 ELO clamp
                sendCommand("setoption name UCI_LimitStrength value false");
                int skillLevel = (targetElo - 400) / 50; // maps 400->0, 1350->19
                skillLevel = Math.max(0, Math.min(20, skillLevel));
                sendCommand("setoption name Skill Level value " + skillLevel);
            } else {
                sendCommand("setoption name UCI_LimitStrength value true");
                sendCommand("setoption name UCI_Elo value " + targetElo);
                sendCommand("setoption name Skill Level value 20");
            }

            // Set Position
            if (fen != null && !fen.trim().isEmpty()) {
                if (moves != null && !moves.isEmpty()) {
                    sendCommand("position fen " + fen + " moves " + String.join(" ", moves));
                } else {
                    sendCommand("position fen " + fen);
                }
            } else {
                if (moves != null && !moves.isEmpty()) {
                    sendCommand("position startpos moves " + String.join(" ", moves));
                } else {
                    sendCommand("position startpos");
                }
            }

            // Ready Check
            sendCommand("isready");
            String readyLine;
            while ((readyLine = reader.readLine()) != null) {
                if (readyLine.equals("readyok")) {
                    break;
                }
            }

            // Trigger Search
            int searchDepth = (depth != null) ? depth : -1;
            int searchMovetime = (movetime != null) ? movetime : defaultMovetime;

            if (targetElo < 800) {
                // At low ELO levels, enforce a strict depth limit to introduce human-like tactical blunders
                searchDepth = (targetElo <= 600) ? 1 : 2;
                sendCommand("go depth " + searchDepth);
            } else if (searchDepth > 0) {
                sendCommand("go depth " + searchDepth);
            } else {
                sendCommand("go movetime " + searchMovetime);
            }

            // Parse response
            String bestMove = null;
            String ponderMove = null;
            String evaluation = "0.00";
            String scoreType = "cp";
            int scoreValue = 0;
            int depthSearched = 0;
            long nodes = 0;
            long nps = 0;
            long timeMs = 0;

            String line;
            while ((line = reader.readLine()) != null) {
                log.debug("Engine output: {}", line);
                if (line.startsWith("info ")) {
                    String[] parts = line.split("\\s+");
                    for (int i = 0; i < parts.length; i++) {
                        if (parts[i].equals("depth") && i + 1 < parts.length) {
                            try {
                                depthSearched = Integer.parseInt(parts[i + 1]);
                            } catch (NumberFormatException ignored) {}
                        } else if (parts[i].equals("score") && i + 2 < parts.length) {
                            scoreType = parts[i + 1];
                            String valStr = parts[i + 2];
                            try {
                                scoreValue = Integer.parseInt(valStr);
                                if ("b".equals(finalSideToMove)) {
                                    scoreValue = -scoreValue;
                                }
                                if ("cp".equals(scoreType)) {
                                    double cpVal = scoreValue / 100.0;
                                    evaluation = String.format("%s%.2f", cpVal >= 0 ? "+" : "", cpVal);
                                } else if ("mate".equals(scoreType)) {
                                    evaluation = String.format("#%s%d", scoreValue >= 0 ? "M" : "-M", Math.abs(scoreValue));
                                }
                            } catch (NumberFormatException ignored) {}
                        } else if (parts[i].equals("nodes") && i + 1 < parts.length) {
                            try {
                                nodes = Long.parseLong(parts[i + 1]);
                            } catch (NumberFormatException ignored) {}
                        } else if (parts[i].equals("nps") && i + 1 < parts.length) {
                            try {
                                nps = Long.parseLong(parts[i + 1]);
                            } catch (NumberFormatException ignored) {}
                        } else if (parts[i].equals("time") && i + 1 < parts.length) {
                            try {
                                timeMs = Long.parseLong(parts[i + 1]);
                            } catch (NumberFormatException ignored) {}
                        }
                    }
                } else if (line.startsWith("bestmove ")) {
                    String[] parts = line.split("\\s+");
                    bestMove = parts[1];
                    if (parts.length > 3 && "ponder".equals(parts[2])) {
                        ponderMove = parts[3];
                    }
                    break;
                }
            }

            return GameStatusDTO.builder()
                    .bestMove(bestMove)
                    .ponderMove(ponderMove)
                    .evaluation(evaluation)
                    .scoreType(scoreType)
                    .scoreValue(scoreValue)
                    .depth(depthSearched)
                    .nodes(nodes)
                    .nps(nps)
                    .timeMs(timeMs)
                    .build();

        } catch (IOException e) {
            log.error("IOException while communicating with Stockfish process", e);
            throw new RuntimeException("Engine error: " + e.getMessage(), e);
        }
    }

    public synchronized void updateConfig(int elo, int threads, int hashSizeMb) {
        try {
            if (process == null || !process.isAlive()) {
                startEngine();
            }
            if (elo >= 3200) {
                sendCommand("setoption name UCI_LimitStrength value false");
                sendCommand("setoption name Skill Level value 20");
            } else if (elo < 1350) {
                sendCommand("setoption name UCI_LimitStrength value false");
                int skillLevel = (elo - 400) / 50;
                skillLevel = Math.max(0, Math.min(20, skillLevel));
                sendCommand("setoption name Skill Level value " + skillLevel);
            } else {
                sendCommand("setoption name UCI_LimitStrength value true");
                sendCommand("setoption name UCI_Elo value " + elo);
                sendCommand("setoption name Skill Level value 20");
            }
            sendCommand("setoption name Threads value " + threads);
            sendCommand("setoption name Hash value " + hashSizeMb);
            sendCommand("isready");
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.equals("readyok")) {
                    break;
                }
            }
            log.info("Engine configured successfully: Elo={}, Threads={}, Hash={}MB", elo, threads, hashSizeMb);
        } catch (IOException e) {
            log.error("Failed to update Stockfish configuration", e);
        }
    }

    public boolean isAlive() {
        return process != null && process.isAlive();
    }

    @PreDestroy
    public synchronized void destroy() {
        log.info("Shutting down Stockfish engine process...");
        if (process != null && process.isAlive()) {
            try {
                sendCommand("quit");
            } catch (IOException ignored) {}
            process.destroy();
        }
    }
}
