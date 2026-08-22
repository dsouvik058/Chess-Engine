package com.chessengine.controller;

import com.chessengine.dto.AiCoachRequestDTO;
import com.chessengine.dto.AiCoachResponseDTO;
import com.chessengine.service.AiCoachService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ai/coach")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiCoachController {

    private final AiCoachService aiCoachService;

    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    @PostMapping("/commentary")
    public ResponseEntity<AiCoachResponseDTO> getMoveCommentary(@RequestBody AiCoachRequestDTO request) {
        log.info("Generating AI coach commentary for move {} ({}) with persona {}",
                request.getMoveNumber(), request.getSan(), request.getCoachPersona());
        AiCoachResponseDTO response = aiCoachService.generateMoveCommentary(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/batch-commentary")
    public ResponseEntity<java.util.List<AiCoachResponseDTO>> getBatchCommentary(@RequestBody java.util.List<AiCoachRequestDTO> requests) {
        log.info("Generating batch AI coach commentary for {} moves", requests != null ? requests.size() : 0);
        java.util.List<AiCoachResponseDTO> responses = aiCoachService.generateBatchCommentary(requests);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        boolean isConfigured = groqApiKey != null && !groqApiKey.trim().isEmpty() && !groqApiKey.startsWith("YOUR_");
        status.put("isGroqConfigured", isConfigured);
        status.put("model", groqModel);
        status.put("availablePersonas", new String[]{"grandmaster", "enthusiastic", "tactical"});
        return ResponseEntity.ok(status);
    }
}
