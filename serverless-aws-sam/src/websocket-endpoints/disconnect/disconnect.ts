import { wsMessagesDBManager } from "../../models/web-socket-messages.js";
import { APIGatewayWebSocketDisconnectEvent } from "../../types/types.js";

export const handler = async (
  event: APIGatewayWebSocketDisconnectEvent
): Promise<{ statusCode: number }> => {
  const connectionId = event.requestContext.connectionId;

  const initialConnectionResponse =
    await wsMessagesDBManager.deleteInitialConnection(connectionId);
  if ("error" in initialConnectionResponse) {
    return {
      statusCode: initialConnectionResponse.statusCode,
    };
  }

  return { statusCode: 200 };
};
