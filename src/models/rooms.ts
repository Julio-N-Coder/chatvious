import { Request } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cognitoData from "../cognitoData.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// try to make room
// if there is a problem, send status problem, else send status 201

// make a unique id for room id
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
      ownerID: "12345678-abcd-1234-efgh-123456789012",
      // ownerID,
      authedUsers: [],
    };

    const putCommand = new PutCommand({
      TableName: "chatvious-rooms",
      Item: roomData,
    });

    // newRoom value need to be wrapped in an array
    const updateCommand = new UpdateCommand({
      TableName: "chatvious-users",
      Key: { "id-sub": "12345678-abcd-1234-efgh-123456789012" },
      // Key: { "id-sub": ownerID },
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
    console.log(err);
    return { error: err, statusCode: 500 };
  }
}

function fetchRooms() {}

export { makeRoom, fetchRooms };
