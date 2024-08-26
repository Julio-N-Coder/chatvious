import { APIGatewayAuthorizerResult } from "aws-lambda";
import {
  APIGatewayWebSocketAuthorizerEvent,
  LambdaAuthorizerClaims,
} from "../../types/types.js";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { buildPolicy } from "../../lib/handyUtils.js";

export const handler = async (
  event: APIGatewayWebSocketAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const methodArn = event.methodArn;

  if (!event.queryStringParameters) {
    return buildPolicy("Unauthorized", "Deny", methodArn);
  } else if (!event.queryStringParameters.access_token) {
    return buildPolicy("Unauthorized", "Deny", methodArn);
  }

  const access_token = event.queryStringParameters.access_token;

  const cognitoData = {
    USER_POOL_ID: process.env.USER_POOL_ID as string,
    CLIENT_ID: process.env.USER_POOL_CLIENT_ID as string,
    COGNITO_DOMAIN: process.env.COGNITO_DOMAIN as string,
  };

  const verifier = CognitoJwtVerifier.create({
    userPoolId: cognitoData.USER_POOL_ID as string,
    tokenUse: "access",
    clientId: cognitoData.CLIENT_ID as string,
  });

  try {
    const payload = await verifier.verify(access_token);

    const context: LambdaAuthorizerClaims = {
      sub: payload.sub,
      username: payload.username,
      email: payload.email as string,
      iss: payload.iss,
      client_id: payload.client_id,
      origin_jti: payload.origin_jti,
      event_id: payload.event_id as string,
      token_use: payload.token_use,
      auth_time: payload.auth_time,
      exp: payload.exp,
      iat: payload.iat,
      jti: payload.jti,
    };

    return buildPolicy(payload.sub, "Allow", methodArn, context);
  } catch (err) {
    return buildPolicy("Unauthorized", "Deny", methodArn);
  }
};
