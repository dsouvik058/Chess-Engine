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

        double timeControl = request.getTimeControlMinutes() != null ? request.getTimeControlMinutes() : 10.0;
        long timeControlMs = Math.round(timeControl * 60 * 1000L);

        String whitePlayerId = "white".equals(hostColor) ? hostId : null;
        String blackPlayerId = "black".equals(hostColor) ? hostId : null;
        String name = (request.getPlayerName() != null && !request.getPlayerName().trim().isEmpty()) 
                ? request.getPlayerName().trim() 
                : "Host";

        String whitePlayerName = "white".equals(hostColor) ? name : null;
        String blackPlayerName = "black".equals(hostColor) ? name : null;

        GameRoom room = GameRoom.builder()
                .roomId(roomId)
                .hostPlayerId(hostId)
                .whitePlayerId(whitePlayerId)
                .blackPlayerId(blackPlayerId)
                .whitePlayerName(whitePlayerName)
                .blackPlayerName(blackPlayerName)
                .currentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
                .moveHistory(new ArrayList<>())
                .timeControlMinutes(timeControl)
                .whiteTimeMs(timeControlMs)
                .blackTimeMs(timeControlMs)
                .status("WAITING")
                .build();

        activeRooms.put(roomId, room);
        log.info("Multiplayer room created: {} by host {} ({}) (Color: {})", roomId, hostId, name, hostColor);

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
        String name = (request.getPlayerName() != null && !request.getPlayerName().trim().isEmpty()) 
                ? request.getPlayerName().trim() 
                : "Guest";

        if (room.getWhitePlayerId() == null) {
            room.setWhitePlayerId(guestId);
            room.setWhitePlayerName(name);
            guestColor = "white";
        } else if (room.getBlackPlayerId() == null) {
            room.setBlackPlayerId(guestId);
            room.setBlackPlayerName(name);
            guestColor = "black";
        } else {
            throw new EngineException("Game room is full.");
        }

        room.setGuestPlayerId(guestId);
        room.setStatus("IN_PROGRESS");

        log.info("Player {} ({}) joined room {} as {}", guestId, name, roomId, guestColor);

        return RoomResponseDTO.builder()
                .room(room)
                .playerId(guestId)
                .playerColor(guestColor)
                .role("GUEST")
                .build();
    }

    @Override
    public GameRoom getRoom(String roomId) {
        return activeRooms.get(roomId);
    }

    @Override
    public GameRoom processMove(MultiplayerMoveDTO move) {
        GameRoom room = activeRooms.get(move.getRoomId());
        if (room == null) {
            throw new EngineException("Room not found");
        }
        room.setCurrentFen(move.getFen());
        if (move.getSan() != null) {
            room.getMoveHistory().add(move.getSan());
        }
        return room;
    }

    @Override
    public GameRoom resignMatch(String roomId, String resigningPlayerId) {
        GameRoom room = activeRooms.get(roomId);
        if (room == null) {
            throw new EngineException("Room not found");
        }
        room.setStatus("FINISHED");
        room.setFinishReason("Resignation");
        if (resigningPlayerId.equalsIgnoreCase(room.getWhitePlayerId())) {
            room.setWinnerColor("b");
        } else {
            room.setWinnerColor("w");
        }
        return room;
    }

    @Override
    public GameRoom createMatchedRoom(String whitePlayerId, String whitePlayerName, String blackPlayerId, String blackPlayerName, double timeControlMinutes) {
        String roomId = generateRoomId();
        long timeControlMs = Math.round(timeControlMinutes * 60 * 1000L);

        GameRoom room = GameRoom.builder()
                .roomId(roomId)
                .hostPlayerId(whitePlayerId)
                .guestPlayerId(blackPlayerId)
                .whitePlayerId(whitePlayerId)
                .blackPlayerId(blackPlayerId)
                .whitePlayerName(whitePlayerName != null ? whitePlayerName : "Player 1")
                .blackPlayerName(blackPlayerName != null ? blackPlayerName : "Player 2")
                .currentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
                .moveHistory(new ArrayList<>())
                .timeControlMinutes(timeControlMinutes)
                .whiteTimeMs(timeControlMs)
                .blackTimeMs(timeControlMs)
                .status("IN_PROGRESS")
                .build();

        activeRooms.put(roomId, room);
        log.info("Direct matched room created: {} (White: {} [{}] vs Black: {} [{}])",
                roomId, whitePlayerName, whitePlayerId, blackPlayerName, blackPlayerId);
        return room;
    }

    private String generateRoomId() {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder("ROOM-");
        for (int i = 0; i < 4; i++) {
            sb.append(characters.charAt(random.nextInt(characters.length())));
        }
        return sb.toString();
    }
}
