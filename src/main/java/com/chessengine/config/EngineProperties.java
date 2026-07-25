package com.chessengine.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "stockfish")
public class EngineProperties {
    private String downloadUrl = "https://github.com/official-stockfish/Stockfish/releases/latest/download/stockfish-windows-x86-64-sse41-popcnt.zip";
    private String binaryDir = "./bin";
    private String binaryPath = "./bin/stockfish.exe";
    private int defaultElo = 3200;
    private int defaultDepth = 15;
    private int defaultMovetime = 1000;
}
