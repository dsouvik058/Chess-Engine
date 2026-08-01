package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private String id;
    private String username;
    private String email;
    private String name;
    private String avatarUrl;
    private String provider; // "LOCAL" or "GOOGLE"
    private int eloRating;
    private boolean skillLevelSelected;
    private String skillLevel;
    private int gamesPlayed;
    private int wins;
}
