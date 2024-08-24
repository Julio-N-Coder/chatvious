import {
  initialConectDBWSManager,
  roomConnectionsWSManager,
} from "../../models/web-socket-messages.js";
import { APIGatewayWebSocketDisconnectEvent } from "../../types/types.js";

export const handler = async (
  event: APIGatewayWebSocketDisconnectEvent
): Promise<{ statusCode: number }> => {
  const connectionId = event.requestContext.connectionId;
  let RoomID: string | false;

  const initialConnectionResponse =
    await initialConectDBWSManager.deleteInitialConnection(connectionId);
  if ("error" in initialConnectionResponse) {
    return {
      statusCode: initialConnectionResponse.statusCode,
    };
  }
  RoomID = initialConnectionResponse.data.RoomID;

  if (RoomID) {
    const deleteRoomConnectionResponse =
      await roomConnectionsWSManager.deleteRoomConnection(RoomID, connectionId);
    if ("error" in deleteRoomConnectionResponse) {
      return {
        statusCode: deleteRoomConnectionResponse.statusCode,
      };
    }
  }

  // notify users of a diconnection to update sidebar

  return { statusCode: 200 };
};
