import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cookie from "cookie";

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
    CLIENT_ID: process.env.CLIENT_ID as string,
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

      const claims = {
        sub: payload.sub,
        username: payload.username,
        iss: payload.iss,
        client_id: payload.client_id,
        origin_jti: payload.origin_jti,
        event_id: payload.event_id,
        token_use: payload.token_use,
        auth_time: payload.auth_time,
        exp: payload.exp,
        iat: payload.iat,
        jti: payload.jti,
      };

      return buildPolicy(payload.sub, "Allow", methodArn, { claims });
    } catch (err) {
      return buildPolicy("Unauthorized", "Deny", methodArn);
    }
  }
  return buildPolicy("Unauthorized", "Deny", methodArn);
};

function buildPolicy(
  principalId: string,
  effect: "Deny" | "Allow",
  methodArn: string,
  context?: {
    claims: any;
    scopes?: any;
  }
): APIGatewayAuthorizerResult {
  if (context) {
    return {
      principalId: principalId,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: effect,
            Resource: methodArn,
          },
        ],
      },
      context: context,
    };
  } else {
    return {
      principalId: principalId,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: effect,
            Resource: methodArn,
          },
        ],
      },
    };
  }
}

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
