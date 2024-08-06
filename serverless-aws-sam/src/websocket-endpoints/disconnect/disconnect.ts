import { wsMessagesDBManager } from "../../models/web-socket-messages.js";
import { APIGatewayWebSocketDisconnectEvent } from "../../types/types.js";

export const handler = async (
  event: APIGatewayWebSocketDisconnectEvent
): Promise<{ statusCode: number }> => {
  const connectionId = event.requestContext.connectionId;

  const initialConnectionResponse =
    await wsMessagesDBManager.deleteInitialConnection(connectionId);
  if ("error" in initialConnectionResponse) {
    if (initialConnectionResponse.error !== "No data found") {
      return {
        statusCode: initialConnectionResponse.statusCode,
      };
    } else if (initialConnectionResponse.error == "No data found") {
      // once joinRoom is up, delete that connection here
    }
  }

  return { statusCode: 200 };
};
