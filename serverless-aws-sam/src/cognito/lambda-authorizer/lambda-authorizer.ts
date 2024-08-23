import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { decomposeUnverifiedJwt } from "aws-jwt-verify/jwt";
import cookie from "cookie";
import { TokenRefresh, LambdaAuthorizerClaims } from "../../types/types.js";
import { buildPolicy } from "../../lib/handyUtils.js";

interface Tokens {
  refresh_token: string;
  access_token: string | undefined;
  id_token: string | undefined;
}

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const methodArn = event.methodArn;

  const tokens = decomposeTokensString(event.authorizationToken);
  if ("error" in tokens) {
    return buildPolicy("Unauthorized", "Deny", methodArn);
  }

  const cognitoData = {
    USER_POOL_ID: process.env.USER_POOL_ID as string,
    CLIENT_ID: process.env.USER_POOL_CLIENT_ID as string,
    COGNITO_DOMAIN: process.env.COGNITO_DOMAIN as string,
  };

  // just working with access token for now
  if (tokens.access_token) {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: cognitoData.USER_POOL_ID as string,
      tokenUse: "access",
      clientId: cognitoData.CLIENT_ID as string,
    });

    const access_token = tokens.access_token as string;
    try {
      const payload = await verifier.verify(access_token);

      const context: LambdaAuthorizerClaims = {
        sub: payload.sub,
        username: payload.username,
        iss: payload.iss,
        client_id: payload.client_id,
        origin_jti: payload.origin_jti,
        event_id: payload.event_id as string,
        token_use: payload.token_use,
        auth_time: payload.auth_time,
        exp: payload.exp,
        iat: payload.iat,
        jti: payload.jti,
        email: payload.email as string,
      };

      return buildPolicy(payload.sub, "Allow", methodArn, context);
    } catch (err) {
      return buildPolicy("Unauthorized", "Deny", methodArn);
    }
  } else if (tokens.refresh_token) {
    // refreshes tokens and passes them to lambdas to set as cookies
    const refresh_token = tokens.refresh_token;

    try {
      const tokenResponse = await fetch(
        `${cognitoData.COGNITO_DOMAIN}/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `grant_type=refresh_token&client_id=${cognitoData.CLIENT_ID}&refresh_token=${refresh_token}`,
        }
      );

      if (!tokenResponse.ok) {
        return buildPolicy("Unauthorized", "Deny", methodArn);
      }
      const tokenData: TokenRefresh = await tokenResponse.json();
      const access_token = tokenData.access_token;
      const id_token = tokenData.id_token;

      const { payload } = decomposeUnverifiedJwt(access_token);

      const context: LambdaAuthorizerClaims = {
        sub: payload.sub as string,
        username: payload.username as string,
        email: payload.email as string,
        iss: payload.iss as string,
        client_id: payload.client_id as string,
        origin_jti: payload.origin_jti as string,
        event_id: payload.event_id as string,
        token_use: payload.token_use as "access" | "id",
        auth_time: payload.auth_time as number,
        exp: payload.exp as number,
        iat: payload.iat as number,
        jti: payload.jti as string,
        access_token,
        id_token,
      };

      return buildPolicy(payload.sub as string, "Allow", methodArn, context);
    } catch (err) {
      return buildPolicy("Unauthorized", "Deny", methodArn);
    }
  }
  return buildPolicy("Unauthorized", "Deny", methodArn);
};

function decomposeTokensString(
  cookieString: string
): Tokens | { error: string } {
  try {
    const cookiesWithTokens = cookie.parse(cookieString);

    if (!("refresh_token" in cookiesWithTokens)) {
      return { error: "Missing refresh token" };
    }

    const tokens = {
      refresh_token: cookiesWithTokens.refresh_token,
      access_token: cookiesWithTokens.access_token || undefined,
      id_token: cookiesWithTokens.id_token || undefined,
    };

    return tokens;
  } catch (err) {
    return {
      error: "Invalid token format",
    };
  }
}
