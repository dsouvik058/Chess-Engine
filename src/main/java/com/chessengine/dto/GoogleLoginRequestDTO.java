package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginRequestDTO {
    private String googleToken;
    private String googleId;
    private String email;
    private String name;
    private String avatarUrl;
}
