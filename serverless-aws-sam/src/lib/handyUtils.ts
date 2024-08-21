import {
  APIGatewayAuthorizerResult,
  APIGatewayEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cookie from "cookie";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";

async function addSetCookieHeaders(
  event: APIGatewayEvent,
  returnSuccessObject: APIGatewayProxyResult
): Promise<APIGatewayProxyResult> {
  let access_token = event.requestContext.authorizer?.access_token as
    | string
    | undefined;
  let id_token = event.requestContext.authorizer?.id_token as
    | string
    | undefined;
  const domain = process.env.DOMAIN as string;

  if (!access_token || !id_token) {
    return returnSuccessObject;
  }

  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.USER_POOL_ID as string,
    tokenUse: "access",
    clientId: process.env.USER_POOL_CLIENT_ID as string,
  });

  let payload: CognitoAccessTokenPayload;
  try {
    payload = await verifier.verify(access_token);
  } catch (err) {
    return returnSuccessObject;
  }

  const secure = process.env.IS_DEV_SERVER === "false";
  const expires_in = new Date(payload.exp * 1000);
  // Add check to make tokens secure true in production
  const access_token_cookie = cookie.serialize("access_token", access_token, {
    httpOnly: false,
    secure,
    path: "/",
    domain,
    expires: expires_in,
  });
  const id_token_cookie = cookie.serialize("id_token", id_token, {
    httpOnly: false,
    secure,
    path: "/",
    domain,
    expires: expires_in,
  });

  returnSuccessObject.multiValueHeaders =
    returnSuccessObject.multiValueHeaders || {};

  returnSuccessObject.multiValueHeaders["Set-Cookie"] = [
    access_token_cookie,
    id_token_cookie,
  ];

  return returnSuccessObject;
}

function buildPolicy(
  principalId: string,
  effect: "Deny" | "Allow",
  methodArn: string,
  context?: {
    claims: any;
    scopes?: any;
    access_token?: string;
    id_token?: string;
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

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export { isProduction, addSetCookieHeaders, buildPolicy };
