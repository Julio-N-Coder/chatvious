import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { userManager } from "../../models/users.js";
import { roomManager } from "../../models/rooms.js";

const client = new CognitoIdentityProviderClient({});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userName = event.requestContext.authorizer?.claims.username as string;
  const userID = event.requestContext.authorizer?.claims.sub as string;

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
  const userInfoResponse = await userManager.fetchRoomsOnUser(
    userID,
    true,
    true
  );
  if ("error" in userInfoResponse) {
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
    const leaveRoomResponse = await roomManager.removeRoomMember(
      joinedRoom.RoomID,
      userID
    );
    if ("error" in leaveRoomResponse) {
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

  const homePage =
    process.env.SUB_DOMAIN_URL || "https://main.chatvious.coding-wielder.com";
  try {
    await client.send(command);
    return {
      statusCode: 302,
      headers: {
        Location: homePage,
      },
      body: "",
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Failed to delete user" }),
    };
  }
};
