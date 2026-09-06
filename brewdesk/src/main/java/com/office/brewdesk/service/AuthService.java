
package com.office.brewdesk.service;

import com.office.brewdesk.dto.LoginRequest;
import com.office.brewdesk.dto.LoginResponse;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.repository.UserRepository;
import com.office.brewdesk.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return LoginResponse.builder()
                .token(jwtService.generateToken(
                        user.getEmail(),
                        user.getRole().name()
                ))
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .mustChangePassword(user.isMustChangePassword())
                .build();
    }
}

