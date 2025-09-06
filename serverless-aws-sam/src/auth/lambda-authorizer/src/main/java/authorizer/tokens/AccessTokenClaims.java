package authorizer.tokens;

import com.fasterxml.jackson.jr.ob.JSON;
import java.util.Base64;
import java.util.Map;

public class AccessTokenClaims {
    private final String sub; // Subject (user ID)
    private final long exp; // Expiration time
    private final long iat; // Issued at
    private final String tokenUse; // "access"
    private final String username;
    private final String rawToken;

    public AccessTokenClaims(String token) {
        this.rawToken = token;
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid JWT format");
            }

            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            Map<String, Object> claims = JSON.std.mapFrom(payload);

            this.sub = getStringClaim(claims, "sub");
            this.exp = getLongClaim(claims, "exp");
            this.iat = getLongClaim(claims, "iat");
            this.tokenUse = getStringClaim(claims, "token_use");
            this.username = getStringClaim(claims, "username");

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse access token", e);
        }
    }

    // Getters
    public String getSub() {
        return sub;
    }

    public long getExp() {
        return exp;
    }

    public long getIat() {
        return iat;
    }

    public String getTokenUse() {
        return tokenUse;
    }

    public String getUsername() {
        return username;
    }

    public String getRawToken() {
        return rawToken;
    }

    // Helper methods
    private String getStringClaim(Map<String, Object> claims, String claimName) {
        Object value = claims.get(claimName);
        return value != null ? value.toString() : null;
    }

    private long getLongClaim(Map<String, Object> claims, String claimName) {
        Object value = claims.get(claimName);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        } else if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return 0L;
            }
        }
        return 0L;
    }

    @Override
    public String toString() {
        return "AccessTokenClaims{" +
                "sub='" + sub + '\'' +
                ", exp=" + exp +
                ", iat=" + iat +
                ", tokenUse='" + tokenUse + '\'' +
                ", username='" + username + '\'' +
                '}';
    }
}
