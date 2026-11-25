package com.samedesk.backend.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/**
 * JWT signing (HS256). The {@link JwtDecoder} bean is shared: REST endpoints use it
 * through the resource-server filter, and the STOMP CONNECT check (realtime) can inject
 * the same bean to validate the token from the Authorization header.
 */
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {

    /** The local default in application.yml. Anyone can read it in the repo, so a server must not use it. */
    static final String DEV_SECRET = "dev-only-secret-change-me-0123456789abcdef";

    @Bean
    SecretKey jwtSecretKey(JwtProperties props, Environment env) {
        return secretKey(props.secret(), env.matchesProfiles("prod"));
    }

    static SecretKey secretKey(String secret, boolean prod) {
        byte[] bytes = secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET is missing or shorter than 32 bytes (it must be at least 32 bytes long)");
        }
        if (prod && DEV_SECRET.equals(secret)) {
            throw new IllegalStateException("JWT_SECRET is the public development value; set a new one, e.g. openssl rand -hex 32");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtSecretKey, JwtProperties props) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        // Default checks (exp, nbf) plus the issuer check.
        OAuth2TokenValidator<Jwt> validator = JwtValidators.createDefaultWithIssuer(props.issuer());
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(validator));
        return decoder;
    }
}
