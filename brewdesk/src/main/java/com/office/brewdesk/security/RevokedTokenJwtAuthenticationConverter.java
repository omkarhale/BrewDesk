package com.office.brewdesk.security;

import com.office.brewdesk.repository.UserRepository;
import com.office.brewdesk.service.LogoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RevokedTokenJwtAuthenticationConverter
        implements Converter<Jwt, AbstractAuthenticationToken> {

    private final LogoutService logoutService;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;
    private final UserRepository userRepository;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {

        if (logoutService.isTokenRevoked(jwt.getTokenValue())) {
            throw new BadCredentialsException("JWT token has been revoked");
        }

        String email = jwt.getSubject();
        if (email != null) {
            userRepository.findByEmail(email).ifPresent(user -> {
                if (!user.isActive()) {
                    throw new BadCredentialsException("User account is inactive or disabled");
                }
            });
        }

        return jwtAuthenticationConverter.convert(jwt);
    }
}