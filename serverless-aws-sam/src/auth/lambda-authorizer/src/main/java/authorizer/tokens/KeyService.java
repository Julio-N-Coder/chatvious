package authorizer.tokens;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@ApplicationScoped
public class KeyService {
    @ConfigProperty(name = "ssm.private.key.parameter")
    String privateKeyParameter;

    @ConfigProperty(name = "ssm.public.key.parameter")
    String publicKeyParameter;

    @Inject
    MinimalSsmClient ssmClient;

    private final ConcurrentMap<String, Object> keyCache = new ConcurrentHashMap<>();

    public PrivateKey getPrivateKey() {
        return (PrivateKey) keyCache.computeIfAbsent("private", k -> loadPrivateKey());
    }

    public PublicKey getPublicKey() {
        return (PublicKey) keyCache.computeIfAbsent("public", k -> loadPublicKey());
    }

    private PrivateKey loadPrivateKey() {
        try {
            String privateKeyPem = ssmClient.getParameter(privateKeyParameter, false);

            // Remove PEM headers/footers and decode
            String privateKeyContent = privateKeyPem
                    .replaceAll("-----BEGIN PRIVATE KEY-----", "")
                    .replaceAll("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] privateKeyBytes = Base64.getDecoder().decode(privateKeyContent);
            KeyFactory keyFactory = KeyFactory.getInstance("Ed25519");
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privateKeyBytes);

            return keyFactory.generatePrivate(keySpec);
        } catch (Exception e) {
            String error = "Failed to load public key from SSM. Error: " + e;
            System.out.println(error);
            throw new RuntimeException(error);
        }
    }

    private PublicKey loadPublicKey() {
        try {
            String publicKeyPem = ssmClient.getParameter(publicKeyParameter, false);

            // Remove PEM headers/footers and decode
            String publicKeyContent = publicKeyPem
                    .replaceAll("-----BEGIN PUBLIC KEY-----", "")
                    .replaceAll("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyContent);
            KeyFactory keyFactory = KeyFactory.getInstance("Ed25519");
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(publicKeyBytes);

            return keyFactory.generatePublic(keySpec);
        } catch (Exception e) {
            String error = "Failed to load public key from SSM. Error: " + e;
            System.out.println(error);
            throw new RuntimeException(error);
        }
    }

    public void clearCache() {
        keyCache.clear();
    }
}
