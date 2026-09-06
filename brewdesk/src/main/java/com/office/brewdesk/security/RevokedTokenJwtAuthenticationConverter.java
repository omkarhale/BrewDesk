package com.office.brewdesk.security;

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

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {

        if (logoutService.isTokenRevoked(jwt.getTokenValue())) {

            throw new BadCredentialsException(
                    "JWT token has been revoked"
            );
        }

        return jwtAuthenticationConverter.convert(jwt);
    }
}