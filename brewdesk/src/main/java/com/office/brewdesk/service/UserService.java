package com.office.brewdesk.service;

import com.office.brewdesk.dto.*;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CreateUserResponse createUser(CreateUserRequest request) {

        // 1. Check email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException(
                    "User with this email already exists"
            );
        }

        // 2. Generate temporary password
        String temporaryPassword = generateTemporaryPassword();

        // 3. Create user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(temporaryPassword))
                .role(request.getRole())
                .active(true)
                .mustChangePassword(true)
                .build();

        // 4. Save
        User savedUser = userRepository.save(user);

        // 5. Return temporary password
        return CreateUserResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .temporaryPassword(temporaryPassword)
                .build();
    }

    private String generateTemporaryPassword() {

        String characters =
                "ABCDEFGHJKLMNPQRSTUVWXYZ"
                        + "abcdefghijkmnopqrstuvwxyz"
                        + "23456789"
                        + "@#$%";

        SecureRandom random = new SecureRandom();

        StringBuilder password = new StringBuilder();

        for (int i = 0; i < 10; i++) {
            password.append(
                    characters.charAt(
                            random.nextInt(characters.length())
                    )
            );
        }

        return password.toString();
    }

    public void changePassword(ChangePasswordRequest request) {

        // 1. Check new passwords match
        if (!request.getNewPassword()
                .equals(request.getConfirmPassword())) {

            throw new RuntimeException(
                    "New password and confirm password do not match"
            );
        }

        // 2. Get logged-in user's email from JWT
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        // 3. Find user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // 4. Verify current password
        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                user.getPassword())) {

            throw new RuntimeException(
                    "Current password is incorrect"
            );
        }

        // 5. Save new password
        user.setPassword(
                passwordEncoder.encode(request.getNewPassword())
        );

        // 6. User no longer needs to change password
        user.setMustChangePassword(false);

        userRepository.save(user);
    }

    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .active(user.isActive())
                        .mustChangePassword(user.isMustChangePassword())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
    }
    public UserResponse updateUser(
            Long id,
            UpdateUserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Check if email belongs to another user
        userRepository.findByEmail(request.getEmail())
                .ifPresent(existingUser -> {

                    if (!existingUser.getId().equals(id)) {
                        throw new RuntimeException(
                                "Email already exists"
                        );
                    }
                });

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);

        return UserResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .active(savedUser.isActive())
                .mustChangePassword(savedUser.isMustChangePassword())
                .createdAt(savedUser.getCreatedAt())
                .build();
    }
    public void disableUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        user.setActive(false);

        userRepository.save(user);
    }
    public void enableUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        user.setActive(true);

        userRepository.save(user);
    }
    public CreateUserResponse resetPassword(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String temporaryPassword = generateTemporaryPassword();

        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setMustChangePassword(true);

        User savedUser = userRepository.save(user);

        return CreateUserResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .temporaryPassword(temporaryPassword)
                .build();
    }
}