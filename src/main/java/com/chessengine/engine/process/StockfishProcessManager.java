package com.chessengine.engine.process;

import com.chessengine.config.EngineProperties;
import com.chessengine.dto.GameStatusDTO;
import com.chessengine.engine.installer.StockfishInstaller;
import com.chessengine.engine.uci.UciProtocolHandler;
import com.chessengine.exception.EngineException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.List;

@Slf4j
@Component
public class StockfishProcessManager {

    private final EngineProperties properties;
    private final StockfishInstaller installer;
    private final UciProtocolHandler uciHandler;

    private Process process;
    private BufferedWriter writer;
    private BufferedReader reader;

    public StockfishProcessManager(EngineProperties properties,
                                  StockfishInstaller installer,
                                  UciProtocolHandler uciHandler) {
        this.properties = properties;
        this.installer = installer;
        this.uciHandler = uciHandler;
    }

    @PostConstruct
    public synchronized void init() {
        try {
            installer.ensureBinaryExists();
            startEngine();
        } catch (Exception e) {
            log.error("Failed to initialize Stockfish engine process", e);
        }
    }

    private synchronized void startEngine() throws IOException {
        log.info("Starting Stockfish process: {}", properties.getBinaryPath());
        ProcessBuilder pb = new ProcessBuilder(properties.getBinaryPath());
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

            String sideToMove = uciHandler.determineSideToMove(fen, moves);

            int targetElo = elo != null ? elo : properties.getDefaultElo();
            List<String> strengthCommands = uciHandler.buildStrengthCommands(targetElo);
            for (String cmd : strengthCommands) {
                sendCommand(cmd);
            }

            String posCmd = uciHandler.buildPositionCommand(fen, moves);
            sendCommand(posCmd);

            sendCommand("isready");
            String readyLine;
            while ((readyLine = reader.readLine()) != null) {
                if (readyLine.equals("readyok")) {
                    break;
                }
            }

            String goCmd = uciHandler.buildGoCommand(targetElo, depth, movetime, properties.getDefaultMovetime());
            sendCommand(goCmd);

            return uciHandler.parseSearchResult(reader, sideToMove);

        } catch (IOException e) {
            log.error("IOException while communicating with Stockfish process", e);
            throw new EngineException("Engine error: " + e.getMessage(), e);
        }
    }

    public synchronized void updateConfig(int elo, int threads, int hashSizeMb) {
        try {
            if (process == null || !process.isAlive()) {
                startEngine();
            }
            List<String> strengthCommands = uciHandler.buildStrengthCommands(elo);
            for (String cmd : strengthCommands) {
                sendCommand(cmd);
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
            throw new EngineException("Failed to update engine configuration", e);
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
