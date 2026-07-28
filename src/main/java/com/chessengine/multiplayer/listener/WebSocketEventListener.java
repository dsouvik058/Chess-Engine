package com.chessengine.multiplayer.listener;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class WebSocketEventListener {

    @Data
    @AllArgsConstructor
    public static class SessionInfo {
        private String roomId;
        private String playerId;
    }

    private final Map<String, SessionInfo> sessionMap = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void registerSession(String sessionId, String roomId, String playerId) {
        if (sessionId != null && roomId != null && playerId != null) {
            sessionMap.put(sessionId, new SessionInfo(roomId, playerId));
            log.info("Registered STOMP session {} for room {} player {}", sessionId, roomId, playerId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        if (sessionId != null) {
            SessionInfo info = sessionMap.remove(sessionId);
            if (info != null) {
                log.info("STOMP Session disconnected: {} (Room: {}, Player: {})", sessionId, info.getRoomId(), info.getPlayerId());

                Map<String, Object> payload = new HashMap<>();
                payload.put("type", "PLAYER_LEFT");
                payload.put("leavingPlayerId", info.getPlayerId());
                payload.put("finishReason", "Opponent left the website");

                messagingTemplate.convertAndSend("/topic/room/" + info.getRoomId(), payload);
            }
        }
    }
}
