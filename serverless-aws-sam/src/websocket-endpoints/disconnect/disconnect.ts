import { wsMessagesDBManager } from "../../models/web-socket-messages.js";
import { APIGatewayWebSocketDisconnectEvent } from "../../types/types.js";

export const handler = async (
  event: APIGatewayWebSocketDisconnectEvent
): Promise<{ statusCode: number }> => {
  const connectionId = event.requestContext.connectionId;
  let RoomID: string | false;

  const initialConnectionResponse =
    await wsMessagesDBManager.deleteInitialConnection(connectionId);
  if ("error" in initialConnectionResponse) {
    return {
      statusCode: initialConnectionResponse.statusCode,
    };
  }
  RoomID = initialConnectionResponse.data.RoomID;

  if (RoomID) {
    const deleteRoomConnectionResponse =
      await wsMessagesDBManager.deleteRoomConnection(RoomID, connectionId);
    if ("error" in deleteRoomConnectionResponse) {
      return {
        statusCode: deleteRoomConnectionResponse.statusCode,
      };
    }
  }

  return { statusCode: 200 };
};
