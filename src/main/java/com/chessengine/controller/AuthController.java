package com.chessengine.controller;

import com.chessengine.dto.*;
import com.chessengine.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody RegisterRequestDTO request) {
        log.info("Registration attempt for username: {}", request.getUsername());
        AuthResponseDTO response = authService.register(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        log.info("Login attempt for username/email: {}", request.getUsernameOrEmail());
        AuthResponseDTO response = authService.login(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponseDTO> googleLogin(@RequestBody GoogleLoginRequestDTO request) {
        log.info("Google OAuth login attempt for email: {}", request.getEmail());
        AuthResponseDTO response = authService.googleLogin(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/set-skill-level")
    public ResponseEntity<AuthResponseDTO> setSkillLevel(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SetSkillLevelRequestDTO request) {
        log.info("Setting skill level: {} ({} ELO)", request.getSkillLevel(), request.getEloRating());
        AuthResponseDTO response = authService.setSkillLevel(authHeader, request.getEloRating(), request.getSkillLevel());
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/update-stats")
    public ResponseEntity<AuthResponseDTO> updateStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> payload) {
        int newElo = payload.get("newElo") instanceof Number ? ((Number) payload.get("newElo")).intValue() : 1500;
        boolean isWin = Boolean.TRUE.equals(payload.get("isWin"));
        log.info("Updating user stats: newElo={}, isWin={}", newElo, isWin);
        AuthResponseDTO response = authService.updateUserGameStats(authHeader, newElo, isWin);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Object> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        UserDTO user = authService.verifyTokenAndGetUser(authHeader);
        if (user == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Unauthorized or expired token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.logout(authHeader);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }
}
