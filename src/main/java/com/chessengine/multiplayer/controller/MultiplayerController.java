package com.chessengine.multiplayer.controller;

import com.chessengine.dto.*;
import com.chessengine.multiplayer.model.GameRoom;
import com.chessengine.multiplayer.service.MultiplayerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@CrossOrigin(origins = "*")
public class MultiplayerController {

    private final MultiplayerService multiplayerService;
    private final SimpMessagingTemplate messagingTemplate;

    public MultiplayerController(MultiplayerService multiplayerService, SimpMessagingTemplate messagingTemplate) {
        this.multiplayerService = multiplayerService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/api/multiplayer/create")
    public ResponseEntity<RoomResponseDTO> createRoom(@RequestBody CreateRoomRequestDTO request) {
        RoomResponseDTO response = multiplayerService.createRoom(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/multiplayer/join")
    public ResponseEntity<RoomResponseDTO> joinRoom(@RequestBody JoinRoomRequestDTO request) {
        RoomResponseDTO response = multiplayerService.joinRoom(request);
        
        // Notify host via WebSocket that opponent joined
        messagingTemplate.convertAndSend("/topic/room/" + response.getRoom().getRoomId(), response.getRoom());
        
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
        messagingTemplate.convertAndSend("/topic/room/" + roomId, updatedRoom);
    }

    @MessageMapping("/room/{roomId}/chat")
    public void handleChat(@DestinationVariable String roomId, ChatMessageDTO chatMessage) {
        log.info("Received WebSocket chat message for room {}: {}", roomId, chatMessage.getMessage());
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/chat", chatMessage);
    }

    @MessageMapping("/room/{roomId}/signal")
    public void handleSignal(@DestinationVariable String roomId, SignalMessageDTO signal) {
        log.info("Received WebRTC signal for room {}: {}", roomId, signal.getType());
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/signal", signal);
    }
}
