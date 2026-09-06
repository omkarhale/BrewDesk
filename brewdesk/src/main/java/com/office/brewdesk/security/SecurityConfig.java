package com.office.brewdesk.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Role hierarchy (highest → lowest privilege):
 *
 *   SUPER_ADMIN        — full system access
 *   ADMIN              — HR / office admin
 *   REPORTING_MANAGER  — team lead, own team visibility
 *   CHEF               — pantry operator (formerly MAKER) + own attendance
 *   EMPLOYEE           — own attendance + beverage ordering
 *
 * Spring Security hasAnyRole() does NOT inherit hierarchy automatically.
 * We therefore list all permitted roles explicitly on each matcher.
 */
@Configuration
public class SecurityConfig {

    private static final String[] PANTRY_STAFF =
            {"SUPER_ADMIN", "ADMIN", "CHEF"};

    private static final String[] ALL_STAFF =
            {"SUPER_ADMIN", "ADMIN", "REPORTING_MANAGER", "CHEF", "EMPLOYEE"};

    private static final String[] MANAGEMENT =
            {"SUPER_ADMIN", "ADMIN"};

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            RevokedTokenJwtAuthenticationConverter revokedTokenConverter)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // ── Public ───────────────────────────────────────────
                        .requestMatchers("/api/auth/login").permitAll()

                        // ── Auth (any authenticated user) ────────────────────
                        .requestMatchers(
                                "/api/auth/logout",
                                "/api/auth/change-password"
                        ).authenticated()

                        // ── Self-service attendance punch & own profile ───────
                        // Available to every role that has an employee profile
                        .requestMatchers(
                                "/api/attendance/punch",
                                "/api/attendance/employees/me"
                        ).hasAnyRole(ALL_STAFF)

                        // ── Beverage ordering (employees + chef) ─────────────
                        .requestMatchers("/api/orders/**")
                        .hasAnyRole("EMPLOYEE", "CHEF", "REPORTING_MANAGER",
                                    "ADMIN", "SUPER_ADMIN")

                        // ── Pantry management (chef prepares orders) ─────────
                        .requestMatchers("/api/maker/**")
                        .hasAnyRole(PANTRY_STAFF)

                        // ── Admin user management ────────────────────────────
                        .requestMatchers("/api/admin/**")
                        .hasAnyRole(MANAGEMENT)

                        // ── Attendance records & management ──────────────────
                        // Admins: full access
                        // Managers: read own team (service layer enforces scope)
                        .requestMatchers("/api/attendance/**")
                        .hasAnyRole(ALL_STAFF)

                        // ── Dev simulator — admin only in any environment ─────
                        .requestMatchers("/api/dev/**")
                        .hasAnyRole(MANAGEMENT)

                        // ── Everything else ──────────────────────────────────
                        .anyRequest().authenticated()
                )

                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt ->
                                jwt.jwtAuthenticationConverter(revokedTokenConverter)));

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtGrantedAuthoritiesConverter authoritiesConverter =
                new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("role");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return converter;
    }
}
