package com.chessengine.service;

import com.chessengine.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class AuthService {

    @Value("${google.oauth.client-id:}")
    private String googleClientId;

    @Value("${google.oauth.client-secret:}")
    private String googleClientSecret;

    private final Map<String, UserRecord> usersById = new ConcurrentHashMap<>();
    private final Map<String, String> usernameToId = new ConcurrentHashMap<>();
    private final Map<String, String> emailToId = new ConcurrentHashMap<>();
    private final Map<String, String> tokenToUserId = new ConcurrentHashMap<>();

    public AuthService() {
        // Initialize default grandmaster demo account
        createDefaultDemoUser();
    }

    private void createDefaultDemoUser() {
        String userId = "user-demo-gm";
        UserRecord record = new UserRecord(
                userId,
                "grandmaster",
                "gm@chessengine.io",
                "Grandmaster Player",
                "demo_secret_pass",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                "LOCAL",
                1850,
                true,
                "Tournament Player",
                42,
                29
        );
        usersById.put(userId, record);
        usernameToId.put("grandmaster", userId);
        emailToId.put("gm@chessengine.io", userId);
    }

    public AuthResponseDTO register(RegisterRequestDTO request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Username is required")
                    .build();
        }
        if (request.getPassword() == null || request.getPassword().length() < 4) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Password must be at least 4 characters long")
                    .build();
        }
        String cleanUsername = request.getUsername().trim().toLowerCase();
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : cleanUsername + "@chess.io";

        if (usernameToId.containsKey(cleanUsername)) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Username already taken. Please choose another.")
                    .build();
        }

        String userId = "user-" + UUID.randomUUID().toString().substring(0, 8);
        String displayName = request.getName() != null && !request.getName().trim().isEmpty()
                ? request.getName().trim()
                : request.getUsername().trim();

        String avatarUrl = "https://api.dicebear.com/7.x/bottts/svg?seed=" + cleanUsername;

        UserRecord record = new UserRecord(
                userId,
                cleanUsername,
                cleanEmail,
                displayName,
                request.getPassword(),
                avatarUrl,
                "LOCAL",
                0,
                false,
                null,
                0,
                0
        );

        usersById.put(userId, record);
        usernameToId.put(cleanUsername, userId);
        emailToId.put(cleanEmail, userId);

        String token = generateToken(userId);

        log.info("Registered new user: {} ({})", cleanUsername, userId);

        return AuthResponseDTO.builder()
                .success(true)
                .message("Registration successful!")
                .token(token)
                .user(toUserDTO(record))
                .build();
    }

    public AuthResponseDTO login(LoginRequestDTO request) {
        if (request.getUsernameOrEmail() == null || request.getPassword() == null) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Username/Email and password are required")
                    .build();
        }

        String query = request.getUsernameOrEmail().trim().toLowerCase();
        String userId = usernameToId.get(query);
        if (userId == null) {
            userId = emailToId.get(query);
        }

        if (userId == null) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Invalid username or password")
                    .build();
        }

        UserRecord record = usersById.get(userId);
        if (record == null || !record.password().equals(request.getPassword())) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Invalid username or password")
                    .build();
        }

        String token = generateToken(userId);
        log.info("User logged in: {} ({})", record.username(), userId);

        return AuthResponseDTO.builder()
                .success(true)
                .message("Login successful!")
                .token(token)
                .user(toUserDTO(record))
                .build();
    }

    public AuthResponseDTO googleLogin(GoogleLoginRequestDTO request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Google account email is required")
                    .build();
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();
        String userId = emailToId.get(cleanEmail);

        UserRecord record;

        if (userId != null && usersById.containsKey(userId)) {
            // Existing user - update details if google picture or name changed
            UserRecord existing = usersById.get(userId);
            record = new UserRecord(
                    existing.id(),
                    existing.username(),
                    cleanEmail,
                    request.getName() != null ? request.getName() : existing.name(),
                    existing.password(),
                    request.getAvatarUrl() != null ? request.getAvatarUrl() : existing.avatarUrl(),
                    "GOOGLE",
                    existing.eloRating(),
                    existing.skillLevelSelected(),
                    existing.skillLevel(),
                    existing.gamesPlayed(),
                    existing.wins()
            );
            usersById.put(userId, record);
            log.info("Google user logged in: {} ({})", cleanEmail, userId);
        } else {
            // Create new Google user - skill level not selected yet!
            userId = "user-g-" + UUID.randomUUID().toString().substring(0, 8);
            String baseUsername = cleanEmail.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
            String username = baseUsername;
            int counter = 1;
            while (usernameToId.containsKey(username.toLowerCase())) {
                username = baseUsername + counter++;
            }

            String avatar = request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()
                    ? request.getAvatarUrl()
                    : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + username;

            record = new UserRecord(
                    userId,
                    username.toLowerCase(),
                    cleanEmail,
                    request.getName() != null ? request.getName() : username,
                    "oauth_google_protected",
                    avatar,
                    "GOOGLE",
                    0,
                    false,
                    null,
                    0,
                    0
            );

            usersById.put(userId, record);
            usernameToId.put(username.toLowerCase(), userId);
            emailToId.put(cleanEmail, userId);
            log.info("Registered new Google OAuth user: {} ({})", cleanEmail, userId);
        }

        String token = generateToken(userId);

        return AuthResponseDTO.builder()
                .success(true)
                .message("Google authentication successful!")
                .token(token)
                .user(toUserDTO(record))
                .build();
    }

    public AuthResponseDTO setSkillLevel(String token, int eloRating, String skillLevel) {
        UserDTO user = verifyTokenAndGetUser(token);
        if (user == null) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Unauthorized user")
                    .build();
        }

        UserRecord existing = usersById.get(user.getId());
        if (existing == null) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("User not found")
                    .build();
        }

        UserRecord updated = new UserRecord(
                existing.id(),
                existing.username(),
                existing.email(),
                existing.name(),
                existing.password(),
                existing.avatarUrl(),
                existing.provider(),
                eloRating,
                true,
                skillLevel,
                existing.gamesPlayed(),
                existing.wins()
        );

        usersById.put(existing.id(), updated);
        log.info("Updated skill level for user {}: {} ({} ELO)", existing.username(), skillLevel, eloRating);

        return AuthResponseDTO.builder()
                .success(true)
                .message("Skill level saved successfully!")
                .token(token.replace("Bearer ", "").trim())
                .user(toUserDTO(updated))
                .build();
    }

    public UserDTO verifyTokenAndGetUser(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }

        String cleanToken = token.replace("Bearer ", "").trim();
        String userId = tokenToUserId.get(cleanToken);
        if (userId == null) {
            return null;
        }

        UserRecord record = usersById.get(userId);
        return record != null ? toUserDTO(record) : null;
    }

    public void logout(String token) {
        if (token != null) {
            String cleanToken = token.replace("Bearer ", "").trim();
            tokenToUserId.remove(cleanToken);
        }
    }

    private String generateToken(String userId) {
        String token = "jwt_" + UUID.randomUUID().toString().replace("-", "") + "_" + System.currentTimeMillis();
        tokenToUserId.put(token, userId);
        return token;
    }

    private UserDTO toUserDTO(UserRecord record) {
        return UserDTO.builder()
                .id(record.id())
                .username(record.username())
                .email(record.email())
                .name(record.name())
                .avatarUrl(record.avatarUrl())
                .provider(record.provider())
                .eloRating(record.eloRating())
                .skillLevelSelected(record.skillLevelSelected())
                .skillLevel(record.skillLevel())
                .gamesPlayed(record.gamesPlayed())
                .wins(record.wins())
                .build();
    }

    private record UserRecord(
            String id,
            String username,
            String email,
            String name,
            String password,
            String avatarUrl,
            String provider,
            int eloRating,
            boolean skillLevelSelected,
            String skillLevel,
            int gamesPlayed,
            int wins
    ) {}
}
