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
import { JwtExpiredError } from "aws-jwt-verify/error";

declare module "express" {
  interface Request {
    user?: {
      id: string;
    };
  }
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function makeRoom(req: Request) {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: cognitoData.USER_POOL_ID,
    tokenUse: "access",
    clientId: cognitoData.CLIENT_ID,
  });

  try {
    const payload = await verifier.verify(req.cookies.access_token);
    const ownerID = payload.sub;

    const roomData = {
      RoomID: crypto.randomUUID(),
      roomName: req.body.roomName,
      ownerID,
      authedUsers: [],
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
    const makeRoomStatusCode = makeRoomResponse.$metadata.httpStatusCode;
    if (makeRoomStatusCode !== 200) {
      if (typeof makeRoomStatusCode === "number") {
        return {
          errorMessage: "Failed to make room",
          statusCode: makeRoomStatusCode,
        };
      }
      return { error: makeRoomResponse, statusCode: 500 };
    }

    const updateUsersResponse = await docClient.send(updateCommand);
    const updateStatusCode = updateUsersResponse.$metadata.httpStatusCode;
    if (updateStatusCode !== 200) {
      if (typeof updateStatusCode === "number") {
        return {
          errorMessage: "Failed to update user",
          statusCode: updateStatusCode,
        };
      }
      return { error: updateUsersResponse, statusCode: 500 };
    }

    return { statusCode: 201, error: "" };
  } catch (err) {
    if (err instanceof JwtExpiredError) {
      return { errorMessage: err.message, statusCode: 401 };
    }
    return { error: err, statusCode: 500 };
  }
}

async function fetchRooms(req: Request) {
  const userID = req.user?.id as string;

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

  const ownedRooms: { roomName: string; RoomID: string }[] | [] =
    getUserResponse.Item?.ownedRooms;
  const joinedRooms: { roomName: string; RoomID: string }[] | [] =
    getUserResponse.Item?.joinedRooms;

  return { ownedRooms, joinedRooms, statusCode: 200 };
}

export { makeRoom, fetchRooms };
