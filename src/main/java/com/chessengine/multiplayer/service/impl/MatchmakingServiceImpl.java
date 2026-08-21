package com.chessengine.multiplayer.service.impl;

import com.chessengine.dto.MatchmakingRequestDTO;
import com.chessengine.dto.MatchmakingResponseDTO;
import com.chessengine.multiplayer.model.GameRoom;
import com.chessengine.multiplayer.service.MatchmakingService;
import com.chessengine.multiplayer.service.MultiplayerService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchmakingServiceImpl implements MatchmakingService {

    private final MultiplayerService multiplayerService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Random random = new Random();

    @Data
    @Builder
    @AllArgsConstructor
    private static class QueueTicket {
        private String playerId;
        private String playerName;
        private int elo;
        private double timeControlMinutes;
        private int incrementSeconds;
        private String category;
        private String preferredColor;
        private long joinedTimestamp;
    }

    private final Map<String, QueueTicket> waitingQueue = new ConcurrentHashMap<>();
    private final Map<String, MatchmakingResponseDTO> matchResults = new ConcurrentHashMap<>();

    @Override
    public synchronized MatchmakingResponseDTO joinMatchmaking(MatchmakingRequestDTO request) {
        String playerId = request.getPlayerId();
        if (playerId == null || playerId.trim().isEmpty()) {
            playerId = UUID.randomUUID().toString();
            request.setPlayerId(playerId);
        }

        // Clean up stale requests (> 30 seconds old)
        long now = System.currentTimeMillis();
        waitingQueue.entrySet().removeIf(entry -> now - entry.getValue().getJoinedTimestamp() > 30000);

        // Check if player already has a match waiting for pickup
        if (matchResults.containsKey(playerId)) {
            MatchmakingResponseDTO existingMatch = matchResults.get(playerId);
            if ("MATCHED".equals(existingMatch.getStatus())) {
                return existingMatch;
            }
        }

        // Search for a suitable opponent in the queue
        QueueTicket opponentTicket = findMatchingOpponent(request);

        if (opponentTicket != null) {
            // Remove opponent from queue
            waitingQueue.remove(opponentTicket.getPlayerId());

            // Determine colors
            String p1Color = "white";
            String p2Color = "black";

            String p1Pref = request.getPreferredColor() != null ? request.getPreferredColor().toLowerCase() : "random";
            String p2Pref = opponentTicket.getPreferredColor() != null ? opponentTicket.getPreferredColor().toLowerCase() : "random";

            if ("white".equals(p1Pref) && !"white".equals(p2Pref)) {
                p1Color = "white";
                p2Color = "black";
            } else if ("black".equals(p1Pref) && !"black".equals(p2Pref)) {
                p1Color = "black";
                p2Color = "white";
            } else if ("white".equals(p2Pref) && !"white".equals(p1Pref)) {
                p1Color = "black";
                p2Color = "white";
            } else if ("black".equals(p2Pref) && !"black".equals(p1Pref)) {
                p1Color = "white";
                p2Color = "black";
            } else {
                if (random.nextBoolean()) {
                    p1Color = "black";
                    p2Color = "white";
                }
            }

            String whitePlayerId = "white".equals(p1Color) ? request.getPlayerId() : opponentTicket.getPlayerId();
            String whitePlayerName = "white".equals(p1Color) ? request.getPlayerName() : opponentTicket.getPlayerName();
            String blackPlayerId = "black".equals(p1Color) ? request.getPlayerId() : opponentTicket.getPlayerId();
            String blackPlayerName = "black".equals(p1Color) ? request.getPlayerName() : opponentTicket.getPlayerName();

            double timeMinutes = request.getTimeControlMinutes() != null ? request.getTimeControlMinutes() : opponentTicket.getTimeControlMinutes();

            // Create matched room
            GameRoom room = multiplayerService.createMatchedRoom(
                    whitePlayerId,
                    whitePlayerName,
                    blackPlayerId,
                    blackPlayerName,
                    timeMinutes
            );

            // Response for current player (P1)
            MatchmakingResponseDTO p1Response = MatchmakingResponseDTO.builder()
                    .status("MATCHED")
                    .roomId(room.getRoomId())
                    .playerId(request.getPlayerId())
                    .playerColor(p1Color)
                    .opponentName(opponentTicket.getPlayerName())
                    .opponentElo(opponentTicket.getElo())
                    .timeControlMinutes(timeMinutes)
                    .incrementSeconds(request.getIncrementSeconds())
                    .room(room)
                    .build();

            // Response for queued opponent (P2)
            MatchmakingResponseDTO p2Response = MatchmakingResponseDTO.builder()
                    .status("MATCHED")
                    .roomId(room.getRoomId())
                    .playerId(opponentTicket.getPlayerId())
                    .playerColor(p2Color)
                    .opponentName(request.getPlayerName())
                    .opponentElo(request.getElo())
                    .timeControlMinutes(timeMinutes)
                    .incrementSeconds(opponentTicket.getIncrementSeconds())
                    .room(room)
                    .build();

            // Cache match results for status checks
            matchResults.put(request.getPlayerId(), p1Response);
            matchResults.put(opponentTicket.getPlayerId(), p2Response);

            // Notify opponent via WebSocket
            messagingTemplate.convertAndSend("/topic/matchmaking/" + opponentTicket.getPlayerId(), p2Response);
            messagingTemplate.convertAndSend("/topic/matchmaking/" + request.getPlayerId(), p1Response);

            log.info("Matchmaking success! Room {} created: {} (Color: {}) vs {} (Color: {})",
                    room.getRoomId(), request.getPlayerName(), p1Color, opponentTicket.getPlayerName(), p2Color);

            return p1Response;
        } else {
            // No match found yet, enqueue player
            QueueTicket ticket = QueueTicket.builder()
                    .playerId(request.getPlayerId())
                    .playerName(request.getPlayerName() != null ? request.getPlayerName() : "Player")
                    .elo(request.getElo() != null ? request.getElo() : 1500)
                    .timeControlMinutes(request.getTimeControlMinutes() != null ? request.getTimeControlMinutes() : 10.0)
                    .incrementSeconds(request.getIncrementSeconds() != null ? request.getIncrementSeconds() : 0)
                    .category(request.getCategory() != null ? request.getCategory() : "rapid")
                    .preferredColor(request.getPreferredColor() != null ? request.getPreferredColor() : "random")
                    .joinedTimestamp(System.currentTimeMillis())
                    .build();

            waitingQueue.put(request.getPlayerId(), ticket);
            log.info("Player {} ({}, rating {}) queued for matchmaking. Current queue size: {}",
                    request.getPlayerName(), request.getPlayerId(), ticket.getElo(), waitingQueue.size());

            return MatchmakingResponseDTO.builder()
                    .status("QUEUED")
                    .playerId(request.getPlayerId())
                    .timeControlMinutes(ticket.getTimeControlMinutes())
                    .incrementSeconds(ticket.getIncrementSeconds())
                    .build();
        }
    }

    @Override
    public synchronized MatchmakingResponseDTO cancelMatchmaking(String playerId) {
        if (playerId != null) {
            waitingQueue.remove(playerId);
            matchResults.remove(playerId);
            log.info("Player {} cancelled matchmaking", playerId);
        }
        return MatchmakingResponseDTO.builder()
                .status("CANCELLED")
                .playerId(playerId)
                .build();
    }

    @Override
    public MatchmakingResponseDTO getStatus(String playerId) {
        if (playerId == null) {
            return MatchmakingResponseDTO.builder().status("NOT_FOUND").build();
        }

        if (matchResults.containsKey(playerId)) {
            return matchResults.get(playerId);
        }

        if (waitingQueue.containsKey(playerId)) {
            QueueTicket ticket = waitingQueue.get(playerId);
            return MatchmakingResponseDTO.builder()
                    .status("QUEUED")
                    .playerId(playerId)
                    .timeControlMinutes(ticket.getTimeControlMinutes())
                    .incrementSeconds(ticket.getIncrementSeconds())
                    .build();
        }

        return MatchmakingResponseDTO.builder()
                .status("NOT_FOUND")
                .playerId(playerId)
                .build();
    }

    private QueueTicket findMatchingOpponent(MatchmakingRequestDTO request) {
        String playerId = request.getPlayerId();
        double targetMinutes = request.getTimeControlMinutes() != null ? request.getTimeControlMinutes() : 10.0;
        int targetElo = request.getElo() != null ? request.getElo() : 1500;

        QueueTicket bestCandidate = null;
        int smallestEloDiff = Integer.MAX_VALUE;

        for (Map.Entry<String, QueueTicket> entry : waitingQueue.entrySet()) {
            QueueTicket candidate = entry.getValue();
            if (candidate.getPlayerId().equalsIgnoreCase(playerId)) {
                continue; // Can't match against self
            }

            // Time control compatibility check (match if same time control or both within same general bucket)
            boolean timeMatches = Math.abs(candidate.getTimeControlMinutes() - targetMinutes) < 0.01;
            if (timeMatches || waitingQueue.size() > 0) { // If exact time matches or any open opponent
                int diff = Math.abs(candidate.getElo() - targetElo);
                if (diff < smallestEloDiff) {
                    smallestEloDiff = diff;
                    bestCandidate = candidate;
                }
            }
        }

        return bestCandidate;
    }
}
