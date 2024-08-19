import { APIGatewayAuthorizerResult } from "aws-lambda";
import { APIGatewayWebSocketAuthorizerEvent } from "../../types/types.js";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { buildPolicy } from "../../lib/handyUtils.js";

interface Tokens {
  access_token?: string;
  id_token?: string;
}

export const handler = async (
  event: APIGatewayWebSocketAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const methodArn = event.methodArn;

  if (!event.queryStringParameters) {
    return buildPolicy("Unauthorized", "Deny", methodArn);
  } else if (!event.queryStringParameters.tokens) {
    return buildPolicy("Unauthorized", "Deny", methodArn);
  }

  const tokens = decomposeTokensString(event.queryStringParameters.tokens);
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

    const access_token = tokens.access_token;
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

function decomposeTokensString(
  tokenQueryString: string
): Tokens | { error: string } {
  let parsedOjbWithTokens;
  try {
    parsedOjbWithTokens = JSON.parse(tokenQueryString);
  } catch (err) {
    return {
      error: "Invalid token format",
    };
  }

  const tokens = {
    access_token: parsedOjbWithTokens.access_token,
    id_token: parsedOjbWithTokens.id_token,
  };

  return tokens;
}
