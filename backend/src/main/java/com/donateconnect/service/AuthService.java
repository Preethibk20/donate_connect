package com.donateconnect.service;

import com.donateconnect.dto.AuthResponse;
import com.donateconnect.dto.LoginRequest;
import com.donateconnect.dto.RegisterRequest;
import com.donateconnect.dto.UserResponseDto;

import com.donateconnect.dto.VerifyOtpRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse verifyOtp(VerifyOtpRequest request);
    UserResponseDto getCurrentUser(String email);
}
