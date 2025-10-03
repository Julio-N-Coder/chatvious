import { APIGatewayAuthorizerResult } from "aws-lambda";
import {
  APIGatewayWebSocketAuthorizerEvent,
  LambdaAuthorizerClaims,
} from "../../types/types.js";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { jwtVerify, importSPKI } from "jose";
import { buildPolicy } from "../../lib/handyUtils.js";

// Cache the public key to avoid repeated SSM calls
let cachedPublicKey: CryptoKey | null = null;

const ssmClientConfig: any = {
  region: process.env.REGION || "us-west-1",
};

// Use local endpoint if specified for development
if (process.env.SSM_ENDPOINT_URL) {
  ssmClientConfig.endpoint = process.env.SSM_ENDPOINT_URL;
  ssmClientConfig.credentials = {
    accessKeyId: "dummy",
    secretAccessKey: "dummy",
  };
}

const ssmClient = new SSMClient(ssmClientConfig);

async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }

  try {
    const command = new GetParameterCommand({
      Name: "/chatvious/public_key",
    });

    const response = await ssmClient.send(command);

    if (!response.Parameter?.Value) {
      throw new Error("Public key not found in SSM");
    }

    // Import the ed25519 public key
    cachedPublicKey = await importSPKI(response.Parameter.Value, "EdDSA");
    return cachedPublicKey;
  } catch (error) {
    console.error("Error retrieving public key from SSM:", error);
    throw new Error("Failed to retrieve public key");
  }
}

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

  try {
    const publicKey = await getPublicKey();

    const { payload } = await jwtVerify(access_token, publicKey, {
      algorithms: ["EdDSA"], // ed25519
    });

    const context: LambdaAuthorizerClaims = {
      sub: payload.sub as string,
      exp: payload.exp as number,
      iat: payload.iat as number,
      token_use: "access",
      username: payload.username as string,
    };

    return buildPolicy(payload.sub as string, "Allow", methodArn, context);
  } catch (err) {
    return buildPolicy("Unauthorized", "Deny", methodArn);
  }
};
