package com.chessengine.multiplayer.controller;

import com.chessengine.dto.ChatMessageDTO;
import com.chessengine.dto.CreateRoomRequestDTO;
import com.chessengine.dto.JoinRoomRequestDTO;
import com.chessengine.dto.MultiplayerMoveDTO;
import com.chessengine.dto.RoomResponseDTO;
import com.chessengine.multiplayer.listener.WebSocketEventListener;
import com.chessengine.multiplayer.model.GameRoom;
import com.chessengine.multiplayer.service.MultiplayerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class MultiplayerController {

    private final MultiplayerService multiplayerService;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketEventListener eventListener;

    @PostMapping({"/api/multiplayer/create", "/api/multiplayer/room/create"})
    public ResponseEntity<RoomResponseDTO> createRoom(@RequestBody CreateRoomRequestDTO request) {
        log.info("Received REST request to create room with color {}", request.getPreferredColor());
        RoomResponseDTO response = multiplayerService.createRoom(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/api/multiplayer/join", "/api/multiplayer/room/join"})
    public ResponseEntity<RoomResponseDTO> joinRoom(@RequestBody JoinRoomRequestDTO request) {
        log.info("Received REST request to join room {} by player {}", request.getRoomId(), request.getPlayerId());
        RoomResponseDTO response = multiplayerService.joinRoom(request);
        messagingTemplate.convertAndSend("/topic/room/" + request.getRoomId(), response.getRoom());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/multiplayer/room/{roomId}")
    public ResponseEntity<GameRoom> getRoom(@PathVariable String roomId) {
        GameRoom room = multiplayerService.getRoom(roomId);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(room);
    }

    @MessageMapping("/room/{roomId}/register")
    public void registerSession(@DestinationVariable String roomId, Map<String, String> payload, SimpMessageHeaderAccessor headerAccessor) {
        String playerId = payload.get("playerId");
        String sessionId = headerAccessor.getSessionId();
        log.info("Received session registration for room {} player {} sessionId {}", roomId, playerId, sessionId);
        eventListener.registerSession(sessionId, roomId, playerId);
    }

    @MessageMapping("/room/{roomId}/move")
    public void handleMove(@DestinationVariable String roomId, MultiplayerMoveDTO move) {
        log.info("Received WebSocket move for room {}: {}", roomId, move.getSan());
        GameRoom updatedRoom = multiplayerService.processMove(move);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, move);
    }

    @MessageMapping("/room/{roomId}/resign")
    public void handleResign(@DestinationVariable String roomId, String playerId) {
        log.info("Received WebSocket resign for room {} from player {}", roomId, playerId);
        GameRoom updatedRoom = multiplayerService.resignMatch(roomId, playerId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "RESIGNATION");
        payload.put("resigningPlayerId", playerId);
        payload.put("room", updatedRoom);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, payload);
    }

    @MessageMapping("/room/{roomId}/leave")
    public void handleLeaveRoom(@DestinationVariable String roomId, String playerId) {
        log.info("Received WebSocket leave for room {} from player {}", roomId, playerId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "PLAYER_LEFT");
        payload.put("leavingPlayerId", playerId);
        payload.put("finishReason", "Opponent left the website");
        messagingTemplate.convertAndSend("/topic/room/" + roomId, payload);
    }

    @PostMapping("/api/multiplayer/leave")
    public ResponseEntity<Void> leaveRoomApi(@RequestBody Map<String, String> body) {
        String roomId = body.get("roomId");
        String playerId = body.get("playerId");
        log.info("Received REST leave API request for room {} from player {}", roomId, playerId);
        if (roomId != null && playerId != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "PLAYER_LEFT");
            payload.put("leavingPlayerId", playerId);
            payload.put("finishReason", "Opponent left the website");
            messagingTemplate.convertAndSend("/topic/room/" + roomId, payload);
        }
        return ResponseEntity.ok().build();
    }

    @MessageMapping("/room/{roomId}/chat")
    public void handleChat(@DestinationVariable String roomId, ChatMessageDTO chatMessage) {
        log.info("Received WebSocket chat message for room {}: {}", roomId, chatMessage.getMessage());
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/chat", chatMessage);
    }

    @MessageMapping("/room/{roomId}/takeback-request")
    public void handleTakebackRequest(@DestinationVariable String roomId, Map<String, Object> payload) {
        log.info("Received WebSocket takeback request for room {}", roomId);
        Map<String, Object> outMap = new HashMap<>(payload);
        outMap.put("type", "TAKEBACK_REQUEST");
        messagingTemplate.convertAndSend("/topic/room/" + roomId, outMap);
    }

    @MessageMapping("/room/{roomId}/takeback-response")
    public void handleTakebackResponse(@DestinationVariable String roomId, Map<String, Object> payload) {
        log.info("Received WebSocket takeback response for room {}", roomId);
        Map<String, Object> outMap = new HashMap<>(payload);
        outMap.put("type", "TAKEBACK_RESPONSE");
        messagingTemplate.convertAndSend("/topic/room/" + roomId, outMap);
    }
}
