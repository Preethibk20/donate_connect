package com.donateconnect.service;

import com.donateconnect.dto.AuthResponse;
import com.donateconnect.dto.LoginRequest;
import com.donateconnect.dto.RegisterRequest;
import com.donateconnect.dto.UserResponseDto;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserResponseDto getCurrentUser(String email);
}
