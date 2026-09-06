package com.office.brewdesk.controller;

import com.office.brewdesk.dto.CreateUserRequest;
import com.office.brewdesk.dto.CreateUserResponse;
import com.office.brewdesk.dto.UpdateUserRequest;
import com.office.brewdesk.dto.UserResponse;
import com.office.brewdesk.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public CreateUserResponse createUser(
            @Valid @RequestBody CreateUserRequest request) {

        return userService.createUser(request);
    }
    @GetMapping("/users")
    public List<UserResponse> getAllUsers() {

        return userService.getAllUsers();
    }

    @PutMapping("/users/{id}")
    public UserResponse updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {

        return userService.updateUser(id, request);
    }
    @PatchMapping("/{id}/disable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disableUser(@PathVariable Long id) {

        userService.disableUser(id);
    }

    @PatchMapping("/{id}/enable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void enableUser(@PathVariable Long id) {

        userService.enableUser(id);
    }
    @PostMapping("/{id}/reset-password")
    public CreateUserResponse resetPassword(@PathVariable Long id) {

        return userService.resetPassword(id);
    }
}