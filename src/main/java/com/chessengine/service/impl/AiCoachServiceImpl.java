package com.chessengine.service.impl;

import com.chessengine.dto.AiCoachRequestDTO;
import com.chessengine.dto.AiCoachResponseDTO;
import com.chessengine.service.AiCoachService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

@Slf4j
@Service
public class AiCoachServiceImpl implements AiCoachService {

    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${groq.model:openai/gpt-oss-120b}")
    private String groqModel;

    private final RestTemplate restTemplate;

    public AiCoachServiceImpl(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(6))
                .setReadTimeout(Duration.ofSeconds(12))
                .build();
    }

    @Override
    public AiCoachResponseDTO generateMoveCommentary(AiCoachRequestDTO request) {
        String activeKey = (request.getCustomApiKey() != null && !request.getCustomApiKey().trim().isEmpty())
                ? request.getCustomApiKey().trim()
                : (groqApiKey != null ? groqApiKey.trim() : "");

        if (activeKey.isEmpty() || activeKey.startsWith("YOUR_")) {
            return AiCoachResponseDTO.builder()
                    .success(false)
                    .commentary("Groq API Key is not configured. Please enter your API key to enable live AI analysis.")
                    .speechScript("")
                    .provider("GROQ")
                    .moveIndex(request.getMoveIndex())
                    .moveNumber(request.getMoveNumber())
                    .color(request.getColor())
                    .san(request.getSan())
                    .build();
        }

        try {
            return callGroqApi(request, activeKey);
        } catch (Exception e) {
            log.error("Groq AI call failed: {}", e.getMessage());
            return AiCoachResponseDTO.builder()
                    .success(false)
                    .commentary("AI Coach could not generate commentary: " + e.getMessage())
                    .speechScript("")
                    .provider("GROQ")
                    .moveIndex(request.getMoveIndex())
                    .moveNumber(request.getMoveNumber())
                    .color(request.getColor())
                    .san(request.getSan())
                    .build();
        }
    }

    @Override
    public List<AiCoachResponseDTO> generateBatchCommentary(List<AiCoachRequestDTO> requests) {
        if (requests == null || requests.isEmpty()) {
            return Collections.emptyList();
        }

        int poolSize = Math.min(requests.size(), 10);
        ExecutorService executor = Executors.newFixedThreadPool(poolSize);
        try {
            List<CompletableFuture<AiCoachResponseDTO>> futures = requests.stream()
                    .map(req -> CompletableFuture.supplyAsync(() -> generateMoveCommentary(req), executor))
                    .toList();

            return futures.stream()
                    .map(CompletableFuture::join)
                    .toList();
        } finally {
            executor.shutdown();
        }
    }

    private AiCoachResponseDTO callGroqApi(AiCoachRequestDTO request, String apiKey) {
        String endpoint = "https://api.groq.com/openai/v1/chat/completions";

        String persona = request.getCoachPersona() != null ? request.getCoachPersona().toLowerCase() : "grandmaster";
        String personaInstruction;
        if ("enthusiastic".equals(persona)) {
            personaInstruction = "You are an energetic, fun chess grandmaster commentator (like Hikaru or GothamChess). Use exciting, lively commentary!";
        } else if ("tactical".equals(persona)) {
            personaInstruction = "You are a sharp tactical chess trainer. Focus on calculation, concrete threats, pins, forks, and candidate defenses.";
        } else {
            personaInstruction = "You are a world-class Grandmaster chess coach. Provide insightful, witty, and educational commentary.";
        }

        String systemPrompt = personaInstruction +
                " Your task is to analyze the move played in the position and provide a 2-3 sentence live spoken explanation. " +
                "Explain why the move was classified as it was (e.g. Brilliant, Best, Blunder, Mistake), " +
                "what the move achieves or what was missed, and reference the best alternative if it was not the best move. " +
                "Do NOT use markdown headers or bullet points. Output only natural speech sentences suitable for Text-to-Speech narration.";

        String playerSide = "w".equalsIgnoreCase(request.getColor()) ? "White" : "Black";
        String userPrompt = String.format(
                "Move %d by %s: %s\n" +
                "Move Quality: %s\n" +
                "Position Evaluation: %.2f pawns (%s)\n" +
                "Win Rate Drop: %.1f%%\n" +
                "Stockfish Recommended Move: %s\n" +
                "FEN: %s",
                request.getMoveNumber(),
                playerSide,
                request.getSan(),
                request.getClassification() != null ? request.getClassification().toUpperCase() : "NORMAL",
                request.getEvalCp() / 100.0,
                request.getEvalCp() >= 0 ? "Advantage White" : "Advantage Black",
                request.getWinDrop(),
                request.getBestMoveSan() != null ? request.getBestMoveSan() : "None",
                request.getFen()
        );

        List<String> candidateModels = new ArrayList<>();
        if (groqModel != null && !groqModel.trim().isEmpty()) {
            candidateModels.add(groqModel.trim());
        }
        if (!candidateModels.contains("llama-3.3-70b-versatile")) candidateModels.add("llama-3.3-70b-versatile");
        if (!candidateModels.contains("llama-3.1-8b-instant")) candidateModels.add("llama-3.1-8b-instant");
        if (!candidateModels.contains("openai/gpt-oss-120b")) candidateModels.add("openai/gpt-oss-120b");
        if (!candidateModels.contains("openai/gpt-oss-20b")) candidateModels.add("openai/gpt-oss-20b");
        if (!candidateModels.contains("qwen/qwen3.6-27b")) candidateModels.add("qwen/qwen3.6-27b");
        if (!candidateModels.contains("groq/compound")) candidateModels.add("groq/compound");
        if (!candidateModels.contains("groq/compound-mini")) candidateModels.add("groq/compound-mini");
        if (!candidateModels.contains("allam-2-7b")) candidateModels.add("allam-2-7b");

        for (String targetModel : candidateModels) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(apiKey);

                Map<String, Object> body = new HashMap<>();
                body.put("model", targetModel);
                body.put("temperature", 0.7);
                body.put("max_tokens", 450);

                List<Map<String, String>> messages = new ArrayList<>();
                messages.add(Map.of("role", "system", "content", systemPrompt));
                messages.add(Map.of("role", "user", "content", userPrompt));
                body.put("messages", messages);

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map respBody = response.getBody();
                    List choices = (List) respBody.get("choices");
                    if (choices != null && !choices.isEmpty()) {
                        Map firstChoice = (Map) choices.get(0);
                        Map message = (Map) firstChoice.get("message");
                        String content = (String) message.get("content");

                        String cleanContent = cleanAiResponse(content);
                        if (!cleanContent.isEmpty()) {
                            return AiCoachResponseDTO.builder()
                                    .success(true)
                                    .commentary(cleanContent)
                                    .speechScript(cleanContent)
                                    .tacticalSummary("Analyzed by " + targetModel)
                                    .suggestedLine(request.getBestMoveSan())
                                    .provider("GROQ")
                                    .model(targetModel)
                                    .moveIndex(request.getMoveIndex())
                                    .moveNumber(request.getMoveNumber())
                                    .color(request.getColor())
                                    .san(request.getSan())
                                    .build();
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Groq attempt with model {} failed: {}. Trying next candidate model...", targetModel, ex.getMessage());
            }
        }

        return AiCoachResponseDTO.builder()
                .success(false)
                .commentary("Could not reach Groq AI models. Please check your API key.")
                .speechScript("")
                .provider("GROQ")
                .moveIndex(request.getMoveIndex())
                .moveNumber(request.getMoveNumber())
                .color(request.getColor())
                .san(request.getSan())
                .build();
    }

    private String cleanAiResponse(String raw) {
        if (raw == null) return "";
        // Remove closed <think>...</think> blocks
        String cleaned = raw.replaceAll("(?s)<think>.*?</think>", "");
        // Remove unclosed <think> blocks (in case generation stopped mid-thought)
        cleaned = cleaned.replaceAll("(?s)<think>.*", "");
        // Remove markdown title hashes like "### " while preserving punctuation
        cleaned = cleaned.replaceAll("(?m)^#+\\s*", "");
        return cleaned.trim();
    }
}
