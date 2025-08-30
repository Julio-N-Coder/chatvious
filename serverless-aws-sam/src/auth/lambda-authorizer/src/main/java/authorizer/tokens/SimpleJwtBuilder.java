package authorizer.tokens;

import com.fasterxml.jackson.jr.ob.JSON;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.Signature;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public class SimpleJwtBuilder {
    private final JSON json = JSON.std;

    public String buildJwt(Map<String, Object> claims, PrivateKey privateKey) throws Exception {
        // Create header
        Map<String, Object> header = new HashMap<>();
        header.put("alg", "EdDSA");
        header.put("typ", "JWT");

        // Encode header and payload
        String encodedHeader = base64UrlEncode(json.asBytes(header));
        String encodedPayload = base64UrlEncode(json.asBytes(claims));

        String signingInput = encodedHeader + "." + encodedPayload;

        // Sign with Ed25519
        Signature signature = Signature.getInstance("Ed25519");
        signature.initSign(privateKey);
        signature.update(signingInput.getBytes(StandardCharsets.UTF_8));
        byte[] signatureBytes = signature.sign();

        String encodedSignature = base64UrlEncode(signatureBytes);

        return signingInput + "." + encodedSignature;
    }

    private String base64UrlEncode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }
}
