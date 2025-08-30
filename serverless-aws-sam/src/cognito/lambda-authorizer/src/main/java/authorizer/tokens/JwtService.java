package authorizer.tokens;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.fasterxml.jackson.jr.ob.JSON;

import java.security.Signature;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
public class JwtService {
    @Inject
    KeyService keyService;

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    private final JSON json = JSON.std;

    public String generateAccessToken(String subject, String scope, long authTime,
            String username, String clientId, long expirationMinutes) {
        try {
            long now = Instant.now().getEpochSecond();
            long exp = now + (expirationMinutes * 60);

            Map<String, Object> claims = new HashMap<>();
            claims.put("sub", subject);
            claims.put("iss", issuer);
            claims.put("aud", "chatvious-app");
            claims.put("iat", now);
            claims.put("exp", exp);
            claims.put("token_use", "access");
            claims.put("scope", scope);
            claims.put("auth_time", authTime);
            claims.put("username", username);
            claims.put("client_id", clientId);

            SimpleJwtBuilder jwtBuilder = new SimpleJwtBuilder();
            return jwtBuilder.buildJwt(claims, keyService.getPrivateKey());

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JWT", e);
        }
    }

    public String generateIdToken(String subject, long authTime, String email, Boolean emailVerified,
            String username, String givenName, String name, long expirationMinutes) {
        try {
            long now = Instant.now().getEpochSecond();
            long exp = now + (expirationMinutes * 60);

            Map<String, Object> claims = new HashMap<>();
            claims.put("sub", subject);
            claims.put("iss", issuer);
            claims.put("aud", "chatvious-app");
            claims.put("iat", now);
            claims.put("exp", exp);
            claims.put("token_use", "id");
            claims.put("auth_time", authTime);
            // null claims
            claims.put("email", email);
            claims.put("email_verified", emailVerified);
            claims.put("username", username);
            claims.put("given_name", givenName);
            claims.put("name", name);

            SimpleJwtBuilder jwtBuilder = new SimpleJwtBuilder();
            return jwtBuilder.buildJwt(claims, keyService.getPrivateKey());

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate ID token", e);
        }
    }

    public boolean verifyToken(String token) {
        try {
            // Parse token manually to verify signature
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String header = new String(Base64.getUrlDecoder().decode(parts[0]));
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            byte[] signature = Base64.getUrlDecoder().decode(parts[2]);

            // Parse JSON using jackson-jr
            Map<String, Object> headerMap = json.mapFrom(header);
            Map<String, Object> payloadMap = json.mapFrom(payload);

            // Verify algorithm is EdDSA
            if (!"EdDSA".equals(headerMap.get("alg"))) {
                return false;
            }

            // Verify signature
            String signingInput = parts[0] + "." + parts[1];
            Signature sig = Signature.getInstance("Ed25519");
            sig.initVerify(keyService.getPublicKey());
            sig.update(signingInput.getBytes());

            boolean signatureValid = sig.verify(signature);
            if (!signatureValid) {
                return false;
            }

            // Verify claims - only check expiration
            // Check expiration
            Object expObj = payloadMap.get("exp");
            long exp = expObj instanceof Number ? ((Number) expObj).longValue() : Long.parseLong(expObj.toString());
            if (Instant.now().getEpochSecond() >= exp) {
                return false;
            }

            return true;

        } catch (Exception e) {
            System.err.println("verifyToken method error: " + e);
            return false;
        }
    }

    public AccessTokenClaims parseAccessToken(String token) {
        try {
            return new AccessTokenClaims(token);
        } catch (Exception e) {
            throw new SecurityException("Failed to parse access token", e);
        }
    }

    public RefreshTokenClaims parseRefreshToken(String token) {
        try {
            return new RefreshTokenClaims(token);
        } catch (Exception e) {
            throw new SecurityException("Failed to parse refresh token", e);
        }
    }

    public String getSubjectFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            Map<String, Object> payloadMap = json.mapFrom(payload);
            return (String) payloadMap.get("sub");
        } catch (Exception e) {
            return null;
        }
    }

    public String getTokenUse(String token) {
        try {
            String[] parts = token.split("\\.");
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            Map<String, Object> payloadMap = json.mapFrom(payload);
            return (String) payloadMap.get("token_use");
        } catch (Exception e) {
            return null;
        }
    }
}
