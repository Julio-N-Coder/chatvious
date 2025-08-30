package authorizer;

import java.util.NoSuchElementException;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

import authorizer.tokens.AccessTokenClaims;
import authorizer.tokens.JwtService;
import authorizer.tokens.RefreshTokenClaims;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.inject.Inject;
import jakarta.inject.Named;

@RegisterForReflection
class BaseTokens {
    public String access_token;
    public String id_token;
}

class Tokens extends BaseTokens {
    String refresh_token;
}

@RegisterForReflection
class RefreshedTokens extends BaseTokens {
    public String token_type;
    public String expires_in;
}

@Named("Authorizer")
public class Authorizer implements RequestHandler<APIGatewayTokenAuthorizerEvent, Policy> {

    @Inject
    JwtService jwtService;

    public Policy handleRequest(final APIGatewayTokenAuthorizerEvent input, final Context context) {
        String methodArn = input.getMethodArn();
        Tokens tokens = decomposeTokensString(input.getAuthorizationToken());

        try {
            if (tokens.access_token != null) {
                if (!jwtService.verifyToken(tokens.access_token)) {
                    return new Policy("Unauthorized", "Deny", methodArn, null);
                }

                // parsing token automatically valdates token
                AccessTokenClaims access_jwt = jwtService.parseAccessToken(tokens.access_token);

                // verify token is access token
                if (!access_jwt.getTokenUse().equals("access")) {
                    return new Policy("Unauthorized", "Deny", methodArn, null);
                }

                Policy.Context resContext = buildContext(access_jwt, null, null);

                return new Policy(access_jwt.getSub(), "Allow", methodArn, resContext);
            } else if (tokens.refresh_token != null) {
                if (!jwtService.verifyToken(tokens.refresh_token)) {
                    return new Policy("Unauthorized", "Deny", methodArn, null);
                }

                RefreshTokenClaims refresh_jwt = jwtService.parseRefreshToken(tokens.refresh_token);

                // verify token is "refresh" token
                if (!refresh_jwt.getTokenUse().equals("refresh")) {
                    return new Policy("Unauthorized", "Deny", methodArn, null);
                }

                // generate tokens
                long authTime = System.currentTimeMillis() / 1000;
                String subject = jwtService.getSubjectFromToken(tokens.refresh_token);
                String username = refresh_jwt.getUserName();

                String newAccessToken = jwtService.generateAccessToken(
                        subject,
                        "openid profile email", // scope
                        authTime,
                        username,
                        refresh_jwt.getClientId(),
                        60 // 60 minutes
                );
                String newIdToken = jwtService.generateIdToken(
                        subject,
                        authTime,
                        null, // email
                        null, // email verified
                        username,
                        null, // given name
                        null, // full name
                        60 // 60 minutes
                );

                Policy.Context resContext = buildContext(jwtService.parseAccessToken(newAccessToken),
                        newAccessToken, newIdToken);

                return new Policy(refresh_jwt.getSub(), "Allow", methodArn, resContext);
            }
        } catch (Exception e) {
            System.out.println("Exception Error. Message: " + e.getMessage());
            return new Policy("Unauthorized", "Deny", methodArn, null);
        }
        return new Policy("Unauthorized", "Deny", methodArn, null);
    }

    private Policy.Context buildContext(AccessTokenClaims jwt, String access_token, String id_token)
            throws NoSuchElementException {
        Policy.Context resContext = new Policy.Context();

        resContext.sub = jwt.getSub();
        resContext.username = jwt.getUsername();
        resContext.iss = jwt.getIss();
        resContext.aud = jwt.getAud();
        resContext.client_id = jwt.getClientId();
        resContext.token_use = jwt.getTokenUse();
        resContext.auth_time = jwt.getAuthTime();
        resContext.exp = jwt.getExp();
        resContext.iat = jwt.getIat();
        resContext.scope = jwt.getScope();

        if (access_token != null && id_token != null) {
            resContext.access_token = access_token;
            resContext.id_token = id_token;
        }

        return resContext;
    }

    private Tokens decomposeTokensString(String cookieString) {
        Tokens tokens = new Tokens();
        if (cookieString.length() < 1) {
            return tokens;
        }
        int found = 0;
        String[] tokenNames = { "refresh_token", "access_token", "id_token" };
        String[] cookies = cookieString.split(";");

        for (String cookie : cookies) {
            int startI = 0;
            if (cookie.charAt(0) == ' ') {
                startI = 1;
            }

            if (cookie.startsWith(tokenNames[0], startI)) {
                tokens.refresh_token = cookie.substring(tokenNames[0].length() + 1 + startI, cookie.length());
                found += 1;
            } else if (cookie.startsWith(tokenNames[1], startI)) {
                tokens.access_token = cookie.substring(tokenNames[1].length() + 1 + startI, cookie.length());
                found += 1;
            } else if (cookie.startsWith(tokenNames[2], startI)) {
                tokens.id_token = cookie.substring(tokenNames[2].length() + 1 + startI, cookie.length());
                found += 1;
            }
            if (found == tokenNames.length) {
                break;
            }
        }
        return tokens;
    }
}
