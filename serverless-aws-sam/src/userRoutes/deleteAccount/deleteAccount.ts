import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  AdminDeleteUserCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { userManager, roomsOnUserManager } from "../../models/users.js";
import { roomManager, roomUsersManager } from "../../models/rooms.js";

const client = new CognitoIdentityProviderClient({});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userName = event.requestContext.authorizer?.username as string;
  const userID = event.requestContext.authorizer?.sub as string;

  if (!userName) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Username is required" }),
    };
  }

  // delete all their resouces in dynamodb from user.
  const userInfoResponse = await roomsOnUserManager.fetchRoomsOnUser(
    userID,
    true,
    true
  );
  if ("error" in userInfoResponse) {
    console.log("Error fetching user info:", userInfoResponse);
    return {
      statusCode: userInfoResponse.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: userInfoResponse.error }),
    };
  }

  const ownedRooms = userInfoResponse.data.ownedRooms
    ? userInfoResponse.data.ownedRooms
    : [];
  const joinedRooms = userInfoResponse.data.joinedRooms
    ? userInfoResponse.data.joinedRooms
    : [];

  for (const ownedRoom of ownedRooms) {
    const deleteRoomResponse = await roomManager.deleteRoom(ownedRoom.RoomID);
    if ("error" in deleteRoomResponse) {
      console.log("Error deleting room:", deleteRoomResponse);
      return {
        statusCode: deleteRoomResponse.statusCode,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: deleteRoomResponse.error }),
      };
    }
  }

  for (const joinedRoom of joinedRooms) {
    const leaveRoomResponse = await roomUsersManager.removeRoomMember(
      joinedRoom.RoomID,
      userID
    );
    if ("error" in leaveRoomResponse) {
      console.log("Error leaving room:", leaveRoomResponse);
      return {
        statusCode: leaveRoomResponse.statusCode,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: leaveRoomResponse.error }),
      };
    }
  }

  const deleteUserResponse = await userManager.deleteUser(userID);
  if ("error" in deleteUserResponse) {
    console.log("Error deleting user:", deleteUserResponse);
    return {
      statusCode: deleteUserResponse.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: deleteUserResponse.error }),
    };
  }

  const command = new AdminDeleteUserCommand({
    Username: userName,
    UserPoolId: process.env.USER_POOL_ID,
  });

  let adminDeleteUserResponse: AdminDeleteUserCommandOutput;

  try {
    adminDeleteUserResponse = await client.send(command);
  } catch (error: any) {
    console.error("sending delete command error: ", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Failed to delete user" }),
    };
  }

  const statusCode = adminDeleteUserResponse.$metadata.httpStatusCode as number;
  if (statusCode !== 200) {
    console.log("Error deleting user:", adminDeleteUserResponse);
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Failed to delete user" }),
    };
  }

  const domain = process.env.DOMAIN || "chatvious.coding-wielder.com";
  return {
    statusCode: 200,
    multiValueHeaders: {
      "Set-Cookie": [
        `access_token=; Path=/; Domain=${domain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `id_token=; Path=/; Domain=${domain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `refresh_token=; Path=/; Domain=${domain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      ],
    },
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: "successfully Deleted Account" }),
  };
};
