package authorizer;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.ParseException;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.fasterxml.jackson.jr.ob.JSON;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;

class BaseTokens {
    public String access_token;
    public String id_token;
}

class Tokens extends BaseTokens {
    String refresh_token;
}

class RefreshedTokens extends BaseTokens {
    public String token_type;
    public String expires_in;
}

class CognitoData {
    String USER_POOL_ID = System.getenv("USER_POOL_ID");
    String CLIENT_ID = System.getenv("USER_POOL_CLIENT_ID");
    String COGNITO_DOMAIN = System.getenv("COGNITO_DOMAIN");
}

    public class Authorizer implements RequestHandler<APIGatewayTokenAuthorizerEvent, Policy> {
      public Policy handleRequest(final APIGatewayTokenAuthorizerEvent input, final Context context) {
    String methodArn = input.getMethodArn();
    Tokens tokens = decomposeTokensString(input.getAuthorizationToken());
    CognitoData cognitoData = new CognitoData();
    String jwks_url = "https://cognito-idp." + System.getenv("REGION") + ".amazonaws.com/" + cognitoData.USER_POOL_ID + "/.well-known/jwks.json";

    try {
        if (tokens.access_token != null) {
            JWKSet jwkSet = JWKSet.load(URI.create(jwks_url).toURL());
            JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(jwkSet);

            ConfigurableJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();
            jwtProcessor.setJWSKeySelector(new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, jwkSource));

            // token validation
            JWTClaimsSet claimsSet = jwtProcessor.process(tokens.access_token, null);

            Policy.Context resContext = buildContext(claimsSet, null, null);

            return new Policy(claimsSet.getSubject(), "Allow", methodArn, resContext);
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
            SignedJWT signedJWT = SignedJWT.parse(tokenResponse.access_token);
            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();

            System.out.println("Tokens Refreshed");

            Policy.Context resContext = buildContext(claimsSet, tokenResponse.access_token, tokenResponse.id_token);

            return new Policy(claimsSet.getSubject(), "Allow", methodArn, resContext);
        }
    } catch (Exception e) {
        return new Policy("Unauthorized", "Deny", methodArn, null);
    }
    return new Policy("Unauthorized", "Deny", methodArn, null);
  }

  private Policy.Context buildContext(JWTClaimsSet claimsSet, String access_token, String id_token) throws ParseException {
    Policy.Context resContext = new Policy.Context();

    resContext.sub = claimsSet.getSubject();
    resContext.username = claimsSet.getClaimAsString("username");
    resContext.iss = claimsSet.getIssuer();
    resContext.client_id = claimsSet.getClaimAsString("client_id");
    resContext.origin_jti = claimsSet.getJWTID();
    resContext.event_id = claimsSet.getClaimAsString("event_id");
    resContext.token_use = claimsSet.getClaimAsString("token_use");
    resContext.auth_time = ((Number) claimsSet.getClaim("auth_time")).intValue();
    resContext.exp = claimsSet.getExpirationTime().getTime() / 1000;
    resContext.iat = claimsSet.getIssueTime().getTime() / 1000;
    resContext.jti = claimsSet.getJWTID();
    resContext.email = claimsSet.getClaimAsString("email");
    
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
