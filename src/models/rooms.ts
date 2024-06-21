import { Request } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cognitoData from "../cognitoData.js";
import { JwtBaseError } from "aws-jwt-verify/error";
import {
  RoomsOnUser,
  MakeRoomReturnType,
  RoomInfoType,
  FetchRoomsOnUserReturn,
  FetchRoomReturn,
} from "../types/types.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
    };
  }
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function makeRoom(req: Request): MakeRoomReturnType {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: cognitoData.USER_POOL_ID,
    tokenUse: "access",
    clientId: cognitoData.CLIENT_ID,
  });

  try {
    const payload = await verifier.verify(req.cookies.access_token);
    const ownerID = payload.sub;
    const ownerName = payload.username;

    const roomData = {
      RoomID: crypto.randomUUID(),
      roomName: req.body.roomName,
      owner: { ownerID, ownerName },
      authedUsers: [],
      createdAt: new Date().toISOString(),
    };

    const putCommand = new PutCommand({
      TableName: "chatvious-rooms",
      Item: roomData,
    });

    // newRoom value needs to be wrapped in an array
    const updateCommand = new UpdateCommand({
      TableName: "chatvious-users",
      Key: { "id-sub": ownerID },
      UpdateExpression: "SET ownedRooms = list_append(ownedRooms, :newRoom)",
      ExpressionAttributeValues: {
        ":newRoom": [{ roomName: roomData.roomName, RoomID: roomData.RoomID }],
      },
    });

    const makeRoomResponse = await docClient.send(putCommand);
    const makeRoomStatusCode = makeRoomResponse.$metadata
      .httpStatusCode as number;
    if (makeRoomStatusCode !== 200) {
      return {
        error: "Failed to make room",
        statusCode: makeRoomStatusCode,
      };
    }

    const updateUsersResponse = await docClient.send(updateCommand);
    const updateStatusCode = updateUsersResponse.$metadata
      .httpStatusCode as number;
    if (updateStatusCode !== 200) {
      return {
        error: "Failed to update user",
        statusCode: updateStatusCode,
      };
    }

    return { message: "Room Created", statusCode: 201 };
  } catch (err) {
    if (err instanceof JwtBaseError) {
      return { error: "Not Authorized", statusCode: 401 };
    }
    return { error: "Internal Server Error", statusCode: 500 };
  }
}

async function fetchRoomsOnUser(req: Request): FetchRoomsOnUserReturn {
  let userID = "";
  if (req.user) {
    userID = req.user.id;
  } else {
    return { error: "Not Authorized", statusCode: 401 };
  }

  const getUserInfo = new GetCommand({
    TableName: "chatvious-users",
    Key: { "id-sub": userID },
    ConsistentRead: true,
  });

  const getUserResponse = await docClient.send(getUserInfo);
  const statusCode = getUserResponse.$metadata.httpStatusCode as number;

  if (statusCode !== 200) {
    return { error: "Failed to Get User Info", statusCode };
  }

  const ownedRooms: RoomsOnUser = getUserResponse.Item?.ownedRooms;
  const joinedRooms: RoomsOnUser = getUserResponse.Item?.joinedRooms;

  return { ownedRooms, joinedRooms, statusCode: 200 };
}

async function fetchRoom(RoomID: string): FetchRoomReturn {
  const roomInfoCommand = new GetCommand({
    TableName: "chatvious-rooms",
    Key: { RoomID },
    ConsistentRead: true,
  });

  const roomInfoResponse = await docClient.send(roomInfoCommand);

  if (roomInfoResponse.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to Get Room Info", statusCode: 500 };
  }

  const roomInfo = roomInfoResponse.Item as RoomInfoType | undefined;
  if (roomInfo == undefined) {
    return { error: "Bad Request", statusCode: 400 };
  }

  return { roomInfo, statusCode: 200 };
}

export { makeRoom, fetchRoomsOnUser, fetchRoom };
