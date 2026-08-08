package com.chessengine.engine.uci;

import com.chessengine.dto.GameStatusDTO;
import com.chessengine.exception.EngineException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class UciProtocolHandler {

    public String determineSideToMove(String fen, List<String> moves) {
        if (fen != null && !fen.trim().isEmpty()) {
            String[] fenParts = fen.trim().split("\\s+");
            if (fenParts.length > 1) {
                return fenParts[1].toLowerCase();
            }
        } else if (moves != null && !moves.isEmpty()) {
            return (moves.size() % 2 == 0) ? "w" : "b";
        }
        return "w";
    }

    public List<String> buildStrengthCommands(int targetElo) {
        List<String> commands = new ArrayList<>();
        if (targetElo >= 3200) {
            commands.add("setoption name UCI_LimitStrength value false");
            commands.add("setoption name Skill Level value 20");
        } else if (targetElo < 1350) {
            commands.add("setoption name UCI_LimitStrength value false");
            int skillLevel = (targetElo - 400) / 50;
            skillLevel = Math.max(0, Math.min(20, skillLevel));
            commands.add("setoption name Skill Level value " + skillLevel);
        } else {
            commands.add("setoption name UCI_LimitStrength value true");
            commands.add("setoption name UCI_Elo value " + targetElo);
            commands.add("setoption name Skill Level value 20");
        }
        return commands;
    }

    public String buildPositionCommand(String fen, List<String> moves) {
        if (fen != null && !fen.trim().isEmpty()) {
            if (moves != null && !moves.isEmpty()) {
                return "position fen " + fen + " moves " + String.join(" ", moves);
            } else {
                return "position fen " + fen;
            }
        } else {
            if (moves != null && !moves.isEmpty()) {
                return "position startpos moves " + String.join(" ", moves);
            } else {
                return "position startpos";
            }
        }
    }

    public String buildGoCommand(int targetElo, Integer depth, Integer movetime, int defaultMovetime) {
        int searchDepth = (depth != null) ? depth : -1;
        int searchMovetime = (movetime != null) ? movetime : defaultMovetime;

        if (targetElo < 800) {
            searchDepth = (targetElo <= 600) ? 1 : 2;
            return "go depth " + searchDepth;
        } else if (searchDepth > 0) {
            return "go depth " + searchDepth;
        } else {
            return "go movetime " + searchMovetime;
        }
    }

    public GameStatusDTO parseSearchResult(BufferedReader reader, String sideToMove) {
        String bestMove = null;
        String ponderMove = null;
        String pvString = null;
        String secondBestMove = null;
        String secondScoreType = null;
        Integer secondScoreValue = null;

        String evaluation = "0.00";
        String scoreType = "cp";
        int scoreValue = 0;
        int depthSearched = 0;
        long nodes = 0;
        long nps = 0;
        long timeMs = 0;

        try {
            String line;
            while ((line = reader.readLine()) != null) {
                log.debug("Engine output: {}", line);
                if (line.startsWith("info ")) {
                    int multipvNum = 1;
                    if (line.contains(" multipv ")) {
                        String[] mParts = line.split("\\s+");
                        for (int i = 0; i < mParts.length - 1; i++) {
                            if (mParts[i].equals("multipv")) {
                                try {
                                    multipvNum = Integer.parseInt(mParts[i + 1]);
                                } catch (NumberFormatException ignored) {}
                                break;
                            }
                        }
                    }

                    // Parse PV string
                    if (line.contains(" pv ")) {
                        int pvIdx = line.indexOf(" pv ");
                        String pvLine = line.substring(pvIdx + 4).trim();
                        if (multipvNum == 1) {
                            pvString = pvLine;
                        } else if (multipvNum == 2 && (secondBestMove == null || secondBestMove.isEmpty())) {
                            String[] pvMoves = pvLine.split("\\s+");
                            if (pvMoves.length > 0) {
                                secondBestMove = pvMoves[0];
                            }
                        }
                    }

                    String[] parts = line.split("\\s+");
                    String curScoreType = "cp";
                    int curScoreVal = 0;

                    for (int i = 0; i < parts.length; i++) {
                        if (parts[i].equals("depth") && i + 1 < parts.length && multipvNum == 1) {
                            try {
                                depthSearched = Integer.parseInt(parts[i + 1]);
                            } catch (NumberFormatException ignored) {}
                        } else if (parts[i].equals("score") && i + 2 < parts.length) {
                            curScoreType = parts[i + 1];
                            String valStr = parts[i + 2];
                            try {
                                curScoreVal = Integer.parseInt(valStr);
                                if ("b".equals(sideToMove)) {
                                    curScoreVal = -curScoreVal;
                                }
                            } catch (NumberFormatException ignored) {}

                            if (multipvNum == 1) {
                                scoreType = curScoreType;
                                scoreValue = curScoreVal;
                                if ("cp".equals(scoreType)) {
                                    double cpVal = scoreValue / 100.0;
                                    evaluation = String.format("%s%.2f", cpVal >= 0 ? "+" : "", cpVal);
                                } else if ("mate".equals(scoreType)) {
                                    evaluation = String.format("#%s%d", scoreValue >= 0 ? "M" : "-M", Math.abs(scoreValue));
                                }
                            } else if (multipvNum == 2) {
                                secondScoreType = curScoreType;
                                secondScoreValue = curScoreVal;
                            }
                        } else if (parts[i].equals("nodes") && i + 1 < parts.length && multipvNum == 1) {
                            try {
                                nodes = Long.parseLong(parts[i + 1]);
                            } catch (NumberFormatException ignored) {}
                        } else if (parts[i].equals("nps") && i + 1 < parts.length && multipvNum == 1) {
                            try {
                                nps = Long.parseLong(parts[i + 1]);
                            } catch (NumberFormatException ignored) {}
                        } else if (parts[i].equals("time") && i + 1 < parts.length && multipvNum == 1) {
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
        } catch (IOException e) {
            throw new EngineException("Error reading search results from engine output stream", e);
        }

        return GameStatusDTO.builder()
                .bestMove(bestMove)
                .ponderMove(ponderMove)
                .pv(pvString)
                .secondBestMove(secondBestMove)
                .secondScoreType(secondScoreType)
                .secondScoreValue(secondScoreValue)
                .evaluation(evaluation)
                .scoreType(scoreType)
                .scoreValue(scoreValue)
                .depth(depthSearched)
                .nodes(nodes)
                .nps(nps)
                .timeMs(timeMs)
                .build();
    }
}
