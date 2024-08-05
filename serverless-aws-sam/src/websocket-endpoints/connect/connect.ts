import { APIGatewayWebSocketConnectEvent } from "../../types/types.js";

// store connectionId (sortKey) and userid. to be able to fetch userid later to check whether they are allowed to join
export const handler = async (
  event: APIGatewayWebSocketConnectEvent
): Promise<{ statusCode: number }> => {
  const userID = event.requestContext.authorizer?.claims.sub;

  event.headers;
  event.multiValueHeaders;
  event.requestContext;
  event.isBase64Encoded;
  return { statusCode: 200 };
};
