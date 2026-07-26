package com.chessengine.multiplayer.service.impl;

import com.chessengine.dto.*;
import com.chessengine.exception.EngineException;
import com.chessengine.multiplayer.model.GameRoom;
import com.chessengine.multiplayer.service.MultiplayerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class MultiplayerServiceImpl implements MultiplayerService {

    private final Map<String, GameRoom> activeRooms = new ConcurrentHashMap<>();
    private final Random random = new Random();

    @Override
    public RoomResponseDTO createRoom(CreateRoomRequestDTO request) {
        String roomId = generateRoomId();
        String hostId = UUID.randomUUID().toString();

        String preferredColor = request.getPreferredColor();
        String hostColor = "white";
        if ("black".equalsIgnoreCase(preferredColor)) {
            hostColor = "black";
        } else if ("random".equalsIgnoreCase(preferredColor)) {
            hostColor = random.nextBoolean() ? "white" : "black";
        }

        int timeControl = request.getTimeControlMinutes() != null ? request.getTimeControlMinutes() : 10;
        long timeControlMs = timeControl * 60 * 1000L;

        String whitePlayerId = "white".equals(hostColor) ? hostId : null;
        String blackPlayerId = "black".equals(hostColor) ? hostId : null;

        GameRoom room = GameRoom.builder()
                .roomId(roomId)
                .hostPlayerId(hostId)
                .whitePlayerId(whitePlayerId)
                .blackPlayerId(blackPlayerId)
                .currentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
                .moveHistory(new ArrayList<>())
                .timeControlMinutes(timeControl)
                .whiteTimeMs(timeControlMs)
                .blackTimeMs(timeControlMs)
                .status("WAITING")
                .build();

        activeRooms.put(roomId, room);
        log.info("Multiplayer room created: {} by host {} (Color: {})", roomId, hostId, hostColor);

        return RoomResponseDTO.builder()
                .room(room)
                .playerId(hostId)
                .playerColor(hostColor)
                .role("HOST")
                .build();
    }

    @Override
    public RoomResponseDTO joinRoom(JoinRoomRequestDTO request) {
        String roomId = request.getRoomId() != null ? request.getRoomId().toUpperCase().trim() : "";
        GameRoom room = activeRooms.get(roomId);

        if (room == null) {
            throw new EngineException("Game room not found: " + roomId);
        }

        if ("FINISHED".equals(room.getStatus())) {
            throw new EngineException("Game room has already finished.");
        }

        if (request.getPlayerId() != null && !request.getPlayerId().trim().isEmpty()) {
            String requestingPlayerId = request.getPlayerId().trim();
            if (requestingPlayerId.equalsIgnoreCase(room.getHostPlayerId()) ||
                requestingPlayerId.equalsIgnoreCase(room.getWhitePlayerId()) ||
                requestingPlayerId.equalsIgnoreCase(room.getBlackPlayerId())) {
                throw new EngineException("You cannot join your own room from the same browser or session.");
            }
        }

        String guestId = UUID.randomUUID().toString();
        String guestColor;

        if (room.getWhitePlayerId() == null) {
            room.setWhitePlayerId(guestId);
            guestColor = "white";
        } else if (room.getBlackPlayerId() == null) {
            room.setBlackPlayerId(guestId);
            guestColor = "black";
        } else {
            throw new EngineException("Game room is full.");
        }

        room.setGuestPlayerId(guestId);
        room.setStatus("IN_PROGRESS");

        log.info("Player {} joined room {} as {}", guestId, roomId, guestColor);

        return RoomResponseDTO.builder()
                .room(room)
                .playerId(guestId)
                .playerColor(guestColor)
                .role("GUEST")
                .build();
    }

    @Override
    public GameRoom processMove(MultiplayerMoveDTO move) {
        GameRoom room = activeRooms.get(move.getRoomId());
        if (room == null) {
            throw new EngineException("Room not found: " + move.getRoomId());
        }

        if (move.getFen() != null) {
            room.setCurrentFen(move.getFen());
        }
        if (move.getSan() != null) {
            room.getMoveHistory().add(move.getSan());
        }

        if (move.getWhiteTimeMs() != null) {
            room.setWhiteTimeMs(move.getWhiteTimeMs());
        }
        if (move.getBlackTimeMs() != null) {
            room.setBlackTimeMs(move.getBlackTimeMs());
        }

        if (Boolean.TRUE.equals(move.getIsCheckmate())) {
            room.setStatus("FINISHED");
            // Determine winner based on FEN side to move (if side to move is 'w', black won)
            String[] parts = move.getFen().split("\\s+");
            String turn = parts.length > 1 ? parts[1] : "w";
            room.setWinnerColor("w".equals(turn) ? "black" : "white");
            room.setFinishReason("Checkmate");
        } else if (Boolean.TRUE.equals(move.getIsDraw())) {
            room.setStatus("FINISHED");
            room.setWinnerColor("draw");
            room.setFinishReason("Draw");
        }

        return room;
    }

    @Override
    public GameRoom resignMatch(String roomId, String playerId) {
        GameRoom room = activeRooms.get(roomId);
        if (room == null) {
            throw new EngineException("Room not found: " + roomId);
        }

        room.setStatus("FINISHED");
        if (playerId.equals(room.getWhitePlayerId())) {
            room.setWinnerColor("black");
        } else {
            room.setWinnerColor("white");
        }
        room.setFinishReason("Resignation");
        return room;
    }

    @Override
    public GameRoom getRoom(String roomId) {
        return activeRooms.get(roomId != null ? roomId.toUpperCase().trim() : "");
    }

    private String generateRoomId() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder("ROOM-");
        for (int i = 0; i < 4; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
