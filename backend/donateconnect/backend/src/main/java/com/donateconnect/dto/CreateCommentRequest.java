package com.donateconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCommentRequest {
    @NotBlank(message = "Comment message is required")
    @Size(max = 1000, message = "Comment cannot exceed 1000 characters")
    private String message;
}
