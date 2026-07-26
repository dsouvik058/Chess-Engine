package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalMessageDTO {
    private String roomId;
    private String senderId;
    private String type; // "offer", "answer", "candidate", "mic-status"
    private Object sdp; // SDP object or string
    private Object candidate; // ICE Candidate object
    private Boolean isMuted; // optional microphone mute status
}
