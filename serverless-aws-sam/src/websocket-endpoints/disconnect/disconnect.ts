import { APIGatewayWebSocketDisconnectEvent } from "../../types/types.js";

export const handler = async (
  event: APIGatewayWebSocketDisconnectEvent
): Promise<{ statusCode: number }> => {
  event.headers;
  event.multiValueHeaders;
  event.requestContext;
  event.isBase64Encoded;
  return { statusCode: 200 };
};
