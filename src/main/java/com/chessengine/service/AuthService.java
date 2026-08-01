package com.chessengine.service;

import com.chessengine.dto.*;
import com.chessengine.model.UserEntity;
import com.chessengine.model.UserSessionEntity;
import com.chessengine.repository.UserRepository;
import com.chessengine.repository.UserSessionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    @Value("${google.oauth.client-id:}")
    private String googleClientId;

    @Value("${google.oauth.client-secret:}")
    private String googleClientSecret;

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostConstruct
    public void initDefaultDemoUser() {
        try {
            if (!userRepository.existsByUsernameIgnoreCase("grandmaster")) {
                String userId = "user-demo-gm";
                UserEntity demoUser = UserEntity.builder()
                        .id(userId)
                        .username("grandmaster")
                        .email("gm@chessengine.io")
                        .name("Grandmaster Player")
                        .password(passwordEncoder.encode("demo_secret_pass"))
                        .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
                        .provider("LOCAL")
                        .eloRating(1850)
                        .skillLevelSelected(true)
                        .skillLevel("Tournament Player")
                        .gamesPlayed(42)
                        .wins(29)
                        .build();

                userRepository.save(demoUser);
                log.info("Initialized default grandmaster demo user in PostgreSQL database.");
            }
        } catch (Exception e) {
            log.warn("Could not auto-initialize demo user on startup (Database might be initializing): {}", e.getMessage());
        }
    }

    @Transactional
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

        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Username already taken. Please choose another.")
                    .build();
        }

        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Email already registered. Please login instead.")
                    .build();
        }

        String userId = "user-" + UUID.randomUUID().toString().substring(0, 8);
        String displayName = request.getName() != null && !request.getName().trim().isEmpty()
                ? request.getName().trim()
                : request.getUsername().trim();

        String avatarUrl = "https://api.dicebear.com/7.x/bottts/svg?seed=" + cleanUsername;

        UserEntity userEntity = UserEntity.builder()
                .id(userId)
                .username(cleanUsername)
                .email(cleanEmail)
                .name(displayName)
                .password(passwordEncoder.encode(request.getPassword()))
                .avatarUrl(avatarUrl)
                .provider("LOCAL")
                .eloRating(0)
                .skillLevelSelected(false)
                .skillLevel(null)
                .gamesPlayed(0)
                .wins(0)
                .build();

        userRepository.save(userEntity);

        String token = generateToken(userId);

        log.info("Registered new user in PostgreSQL: {} ({})", cleanUsername, userId);

        return AuthResponseDTO.builder()
                .success(true)
                .message("Registration successful!")
                .token(token)
                .user(toUserDTO(userEntity))
                .build();
    }

    @Transactional
    public AuthResponseDTO login(LoginRequestDTO request) {
        if (request.getUsernameOrEmail() == null || request.getPassword() == null) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Username/Email and password are required")
                    .build();
        }

        String query = request.getUsernameOrEmail().trim().toLowerCase();
        Optional<UserEntity> userOpt = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(query, query);

        if (userOpt.isEmpty()) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Invalid username or password")
                    .build();
        }

        UserEntity user = userOpt.get();

        // Support plain text match fallback for legacy demo pass, else BCrypt match
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword()) ||
                user.getPassword().equals(request.getPassword());

        if (!matches) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Invalid username or password")
                    .build();
        }

        String token = generateToken(user.getId());
        log.info("User logged in from PostgreSQL: {} ({})", user.getUsername(), user.getId());

        return AuthResponseDTO.builder()
                .success(true)
                .message("Login successful!")
                .token(token)
                .user(toUserDTO(user))
                .build();
    }

    @Transactional
    public AuthResponseDTO googleLogin(GoogleLoginRequestDTO request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Google account email is required")
                    .build();
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();
        Optional<UserEntity> existingOpt = userRepository.findByEmailIgnoreCase(cleanEmail);

        UserEntity userEntity;

        if (existingOpt.isPresent()) {
            userEntity = existingOpt.get();
            if (request.getName() != null && !request.getName().trim().isEmpty()) {
                userEntity.setName(request.getName().trim());
            }
            if (request.getAvatarUrl() != null && !request.getAvatarUrl().trim().isEmpty()) {
                userEntity.setAvatarUrl(request.getAvatarUrl().trim());
            }
            userEntity.setProvider("GOOGLE");
            userRepository.save(userEntity);
            log.info("Google user updated in PostgreSQL: {} ({})", cleanEmail, userEntity.getId());
        } else {
            String userId = "user-g-" + UUID.randomUUID().toString().substring(0, 8);
            String baseUsername = cleanEmail.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
            String username = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsernameIgnoreCase(username)) {
                username = baseUsername + counter++;
            }

            String avatar = request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()
                    ? request.getAvatarUrl()
                    : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + username;

            userEntity = UserEntity.builder()
                    .id(userId)
                    .username(username.toLowerCase())
                    .email(cleanEmail)
                    .name(request.getName() != null ? request.getName() : username)
                    .password(passwordEncoder.encode("oauth_google_protected"))
                    .avatarUrl(avatar)
                    .provider("GOOGLE")
                    .eloRating(0)
                    .skillLevelSelected(false)
                    .skillLevel(null)
                    .gamesPlayed(0)
                    .wins(0)
                    .build();

            userRepository.save(userEntity);
            log.info("Registered new Google OAuth user in PostgreSQL: {} ({})", cleanEmail, userId);
        }

        String token = generateToken(userEntity.getId());

        return AuthResponseDTO.builder()
                .success(true)
                .message("Google authentication successful!")
                .token(token)
                .user(toUserDTO(userEntity))
                .build();
    }

    @Transactional
    public AuthResponseDTO setSkillLevel(String token, int eloRating, String skillLevel) {
        UserDTO user = verifyTokenAndGetUser(token);
        if (user == null) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("Unauthorized user")
                    .build();
        }

        Optional<UserEntity> userOpt = userRepository.findById(user.getId());
        if (userOpt.isEmpty()) {
            return AuthResponseDTO.builder()
                    .success(false)
                    .message("User not found")
                    .build();
        }

        UserEntity userEntity = userOpt.get();
        userEntity.setEloRating(eloRating);
        userEntity.setSkillLevelSelected(true);
        userEntity.setSkillLevel(skillLevel);

        userRepository.save(userEntity);
        log.info("Updated skill level in PostgreSQL for user {}: {} ({} ELO)", userEntity.getUsername(), skillLevel, eloRating);

        return AuthResponseDTO.builder()
                .success(true)
                .message("Skill level saved successfully!")
                .token(token != null ? token.replace("Bearer ", "").trim() : "")
                .user(toUserDTO(userEntity))
                .build();
    }

    public UserDTO verifyTokenAndGetUser(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }

        String cleanToken = token.replace("Bearer ", "").trim();
        Optional<UserSessionEntity> sessionOpt = userSessionRepository.findByToken(cleanToken);

        if (sessionOpt.isEmpty()) {
            return null;
        }

        String userId = sessionOpt.get().getUserId();
        Optional<UserEntity> userOpt = userRepository.findById(userId);

        return userOpt.map(this::toUserDTO).orElse(null);
    }

    @Transactional
    public void logout(String token) {
        if (token != null && !token.trim().isEmpty()) {
            String cleanToken = token.replace("Bearer ", "").trim();
            userSessionRepository.deleteByToken(cleanToken);
        }
    }

    private String generateToken(String userId) {
        String token = "jwt_" + UUID.randomUUID().toString().replace("-", "") + "_" + System.currentTimeMillis();
        UserSessionEntity session = UserSessionEntity.builder()
                .token(token)
                .userId(userId)
                .createdAt(LocalDateTime.now())
                .build();
        userSessionRepository.save(session);
        return token;
    }

    private UserDTO toUserDTO(UserEntity entity) {
        return UserDTO.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .email(entity.getEmail())
                .name(entity.getName())
                .avatarUrl(entity.getAvatarUrl())
                .provider(entity.getProvider())
                .eloRating(entity.getEloRating() != null ? entity.getEloRating() : 0)
                .skillLevelSelected(Boolean.TRUE.equals(entity.getSkillLevelSelected()))
                .skillLevel(entity.getSkillLevel())
                .gamesPlayed(entity.getGamesPlayed() != null ? entity.getGamesPlayed() : 0)
                .wins(entity.getWins() != null ? entity.getWins() : 0)
                .build();
    }
}
