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

    @Value("${openrouter.api-key:}")
    private String openrouterApiKey;

    @Value("${openrouter.model:qwen/qwen-2.5-7b-instruct}")
    private String openrouterModel;

    private final RestTemplate restTemplate;

    public AiCoachServiceImpl(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(6))
                .setReadTimeout(Duration.ofSeconds(15))
                .build();
    }

    @Override
    public AiCoachResponseDTO generateMoveCommentary(AiCoachRequestDTO request) {
        String custom = request.getCustomApiKey() != null ? request.getCustomApiKey().trim() : "";
        String activeKey = (!custom.isEmpty() && !custom.startsWith("gsk_") && !custom.startsWith("YOUR_"))
                ? custom
                : (openrouterApiKey != null ? openrouterApiKey.trim() : "");

        if (activeKey.isEmpty() || activeKey.startsWith("YOUR_")) {
            return AiCoachResponseDTO.builder()
                    .success(false)
                    .commentary("OpenRouter API Key is not configured. Please configure your API key to enable live AI commentary.")
                    .speechScript("")
                    .provider("OPENROUTER")
                    .moveIndex(request.getMoveIndex())
                    .moveNumber(request.getMoveNumber())
                    .color(request.getColor())
                    .san(request.getSan())
                    .build();
        }

        try {
            return callOpenRouterApi(request, activeKey);
        } catch (Exception e) {
            log.error("OpenRouter AI call failed: {}", e.getMessage());
            String fallback = generateRuleBasedCommentary(request);
            return AiCoachResponseDTO.builder()
                    .success(true)
                    .commentary(fallback)
                    .speechScript(fallback)
                    .provider("ENGINE")
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

        // Process moves sequentially (synchronously one-by-one) without parallel skipping
        List<AiCoachResponseDTO> results = new ArrayList<>(requests.size());
        for (AiCoachRequestDTO req : requests) {
            results.add(generateMoveCommentary(req));
        }
        return results;
    }

    private AiCoachResponseDTO callOpenRouterApi(AiCoachRequestDTO request, String apiKey) {
        String endpoint = "https://openrouter.ai/api/v1/chat/completions";

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
                " Your task is to analyze the move played in the position and provide a 1-2 sentence live spoken explanation. " +
                "Explain why the move was classified as it was (e.g. Brilliant, Best, Blunder, Mistake), " +
                "what the move achieves or what was missed, and reference the best alternative if it was not the best move. " +
                "Do NOT output thinking traces, markdown headers, or bullet points. Output ONLY 1-2 natural speech sentences suitable for Text-to-Speech narration.";

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

        String targetModel = (openrouterModel != null && !openrouterModel.trim().isEmpty())
                ? openrouterModel.trim()
                : "qwen/qwen-2.5-7b-instruct";

        for (int attempt = 1; attempt <= 4; attempt++) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(apiKey);
                headers.set("HTTP-Referer", "http://localhost:8080");
                headers.set("X-Title", "Chess Engine");

                Map<String, Object> body = new HashMap<>();
                body.put("model", targetModel);
                body.put("temperature", 0.5);
                body.put("max_tokens", 150);

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
                                    .tacticalSummary(request.getClassification() != null ? request.getClassification().toUpperCase() + " MOVE" : "GRANDMASTER ANALYSIS")
                                    .suggestedLine(request.getBestMoveSan())
                                    .provider("BOT")
                                    .model("")
                                    .moveIndex(request.getMoveIndex())
                                    .moveNumber(request.getMoveNumber())
                                    .color(request.getColor())
                                    .san(request.getSan())
                                    .build();
                        }
                    }
                }
            } catch (Exception ex) {
                String msg = ex.getMessage() != null ? ex.getMessage() : "";
                if (msg.contains("429") && attempt < 4) {
                    long waitMs = parseRetryDelayMs(msg);
                    log.warn("OpenRouter rate limit on attempt {}. Pausing {}ms before retry...", attempt, waitMs);
                    try {
                        Thread.sleep(waitMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    continue;
                }

                log.error("OpenRouter AI analysis error on attempt {} with model {}: {}", attempt, targetModel, ex.getMessage());
                String fallbackCommentary = generateRuleBasedCommentary(request);
                return AiCoachResponseDTO.builder()
                        .success(true)
                        .commentary(fallbackCommentary)
                        .speechScript(fallbackCommentary)
                        .tacticalSummary("Engine Commentary (" + (request.getClassification() != null ? request.getClassification().toUpperCase() : "MOVE") + ")")
                        .suggestedLine(request.getBestMoveSan())
                        .provider("ENGINE")
                        .model(targetModel)
                        .moveIndex(request.getMoveIndex())
                        .moveNumber(request.getMoveNumber())
                        .color(request.getColor())
                        .san(request.getSan())
                        .build();
            }
        }

        String fallbackCommentary = generateRuleBasedCommentary(request);
        return AiCoachResponseDTO.builder()
                .success(true)
                .commentary(fallbackCommentary)
                .speechScript(fallbackCommentary)
                .tacticalSummary("Engine Commentary (" + (request.getClassification() != null ? request.getClassification().toUpperCase() : "MOVE") + ")")
                .suggestedLine(request.getBestMoveSan())
                .provider("ENGINE")
                .model(targetModel)
                .moveIndex(request.getMoveIndex())
                .moveNumber(request.getMoveNumber())
                .color(request.getColor())
                .san(request.getSan())
                .build();
    }

    private long parseRetryDelayMs(String msg) {
        if (msg == null) return 4500L;
        try {
            java.util.regex.Matcher mSec = java.util.regex.Pattern.compile("try again in\\s+([0-9.]+)\\s*s", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(msg);
            if (mSec.find()) {
                double secs = Double.parseDouble(mSec.group(1));
                return (long) (secs * 1000) + 700L;
            }
            java.util.regex.Matcher mMs = java.util.regex.Pattern.compile("try again in\\s+([0-9.]+)\\s*ms", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(msg);
            if (mMs.find()) {
                double ms = Double.parseDouble(mMs.group(1));
                return (long) ms + 500L;
            }
        } catch (Exception ignored) {}
        return 4500L;
    }

    private String generateRuleBasedCommentary(AiCoachRequestDTO request) {
        String side = "w".equalsIgnoreCase(request.getColor()) ? "White" : "Black";
        String quality = request.getClassification() != null ? request.getClassification().toLowerCase() : "solid";
        double eval = request.getEvalCp() / 100.0;
        String evalText = (eval >= 0 ? "+" : "") + String.format(Locale.US, "%.2f", eval);

        if ("blunder".equals(quality) || "mistake".equals(quality)) {
            String bestText = (request.getBestMoveSan() != null && !request.getBestMoveSan().trim().isEmpty() && !"None".equalsIgnoreCase(request.getBestMoveSan()))
                    ? " Stockfish recommends " + request.getBestMoveSan() + " instead."
                    : "";
            return side + " played " + request.getSan() + " (" + quality + "), leaving the evaluation at " + evalText + "." + bestText;
        } else if ("brilliant".equals(quality) || "great".equals(quality)) {
            return "A " + quality + " move with " + request.getSan() + " by " + side + "! The evaluation stands at " + evalText + ".";
        } else {
            return side + " played " + request.getSan() + " (" + quality + " move), holding the position at " + evalText + ".";
        }
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
