package authorizer;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.NoSuchElementException;

import org.eclipse.microprofile.jwt.JsonWebToken;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.fasterxml.jackson.jr.ob.JSON;

import io.quarkus.runtime.annotations.RegisterForReflection;
import io.smallrye.jwt.auth.principal.JWTParser;
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

class CognitoData {
    String USER_POOL_ID = System.getenv("USER_POOL_ID");
    String CLIENT_ID = System.getenv("USER_POOL_CLIENT_ID");
    String COGNITO_DOMAIN = System.getenv("COGNITO_DOMAIN");
}

@Named("Authorizer")
public class Authorizer implements RequestHandler<APIGatewayTokenAuthorizerEvent, Policy> {

    @Inject
    JWTParser parser;

    public Policy handleRequest(final APIGatewayTokenAuthorizerEvent input, final Context context) {
        String methodArn = input.getMethodArn();
        Tokens tokens = decomposeTokensString(input.getAuthorizationToken());
        CognitoData cognitoData = new CognitoData();

        try {
            if (tokens.access_token != null) {
                JsonWebToken jwt = parser.parse(tokens.access_token);

                Policy.Context resContext = buildContext(jwt, null, null);

                return new Policy(jwt.getSubject(), "Allow", methodArn, resContext);
            } else if (tokens.refresh_token != null) {
                System.out.println("Running in RefreshedToken");
                // attempt to refresh tokens
                String requestBody = String.format("grant_type=refresh_token&client_id=%s&refresh_token=%s", cognitoData.CLIENT_ID, tokens.refresh_token);

                HttpClient client = HttpClient.newHttpClient();

                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(cognitoData.COGNITO_DOMAIN + "/oauth2/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() != 200) {
                    return new Policy("Unauthorized", "Deny", methodArn, null);
                }

                JSON json = JSON.builder().build();
                RefreshedTokens tokenResponse = json.beanFrom(RefreshedTokens.class, response.body());
                
                // parse access token and set claims with token
                JsonWebToken jwt = parser.parseOnly(tokenResponse.access_token);

                Policy.Context resContext = buildContext(jwt, tokenResponse.access_token, tokenResponse.id_token);

                return new Policy(jwt.getSubject(), "Allow", methodArn, resContext);
            }
        } catch (Exception e) {
            System.out.println("Exception Error. Message: " + e.getMessage());
            return new Policy("Unauthorized", "Deny", methodArn, null);
        }
        return new Policy("Unauthorized", "Deny", methodArn, null);
  }

  private Policy.Context buildContext(JsonWebToken jwt, String access_token, String id_token) throws NoSuchElementException {
    Policy.Context resContext = new Policy.Context();

    resContext.sub = jwt.getSubject();
    resContext.username = jwt.<String>claim("username").get();
    resContext.iss = jwt.getIssuer();
    resContext.client_id = jwt.<String>claim("client_id").get();
    resContext.origin_jti = jwt.<String>claim("origin_jti").get();
    resContext.event_id = jwt.<String>claim("event_id").get();
    resContext.token_use = jwt.<String>claim("token_use").get();
    resContext.auth_time = ((Number) jwt.claim("auth_time").get()).intValue();
    resContext.exp = jwt.getExpirationTime() / 1000;
    resContext.iat = jwt.getIssuedAtTime() / 1000;
    resContext.jti = jwt.getTokenID();
    
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
    String[] tokenNames = {"refresh_token", "access_token", "id_token"};
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
        if (found == tokenNames.length) {break;}
    }
    return tokens;
  }
}
