import { expect } from "@jest/globals";
import { userManager, roomsOnUserManager } from "../../models/users.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
  BatchWriteCommand,
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
} from "@aws-sdk/lib-dynamodb";

const dynamodbOptionsString = process.env.DYNAMODB_OPTIONS || "{}";
const dynamodbOptions = JSON.parse(dynamodbOptionsString);
const client = new DynamoDBClient(dynamodbOptions);
const docClient = DynamoDBDocumentClient.from(client);

// check if there is a user, delete them to have the same info if they exist
async function newTestUser(userID: string, userName: string) {
  const fetchUserInfoResponse = await userManager.fetchUserInfo(userID);
  let userExists = true;
  if ("error" in fetchUserInfoResponse) {
    if (fetchUserInfoResponse.error === "Failed to Get User Info") {
      throw new Error("Failed to fetch user info");
    }
    userExists = false;
  } else {
    userExists = true;
  }
  if (userExists) {
    const deleteUserResponse = await userManager.deleteUser(userID);
    if ("error" in deleteUserResponse) {
      throw new Error(
        `Failed to clean up before test. Error: ${deleteUserResponse.error}`
      );
    }
  }

  const createUserResponse = await userManager.createUser(userID, userName);
  if ("error" in createUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createUserResponse.error}`
    );
  }

  return createUserResponse.newUser;
}

async function checkRoomsOnUser(
  userID: string,
  RoomID: string,
  roomName: string,
  ownedJoinedOrRemoved: "Owned" | "Joined" | "Removed" = "Joined"
) {
  const roomOnUserResponse = await roomsOnUserManager.fetchSingleRoomOnUser(
    userID,
    RoomID
  );
  if (ownedJoinedOrRemoved !== "Removed") {
    if ("error" in roomOnUserResponse) {
      throw new Error(
        `Failed to fetch rooms on user. Error: ${roomOnUserResponse.error}`
      );
    }

    expect(roomOnUserResponse).toHaveProperty("statusCode", 200);
    expect(roomOnUserResponse).toHaveProperty(
      "message",
      `${ownedJoinedOrRemoved} Room Found`
    );
    expect(roomOnUserResponse).toHaveProperty("data");
    expect(roomOnUserResponse.data).toHaveProperty("roomName", roomName);
    expect(roomOnUserResponse.data).toHaveProperty("RoomID", RoomID);
    return roomOnUserResponse;
  } else {
    const roomOnUserResponse = await roomsOnUserManager.fetchSingleRoomOnUser(
      userID,
      RoomID
    );
    if (
      "error" in roomOnUserResponse &&
      roomOnUserResponse.error !== "Room on user not found"
    ) {
      throw new Error(
        `Failed to fetch rooms on user. Error: ${roomOnUserResponse.error}`
      );
    }

    expect(roomOnUserResponse).toHaveProperty("statusCode", 404);
    expect(roomOnUserResponse).toHaveProperty(
      "error",
      "Room on user not found"
    );
    return roomOnUserResponse;
  }
}

async function clearDynamoDB() {
  const scanParams: ScanCommandInput = {
    TableName: process.env.CHATVIOUSTABLE_TABLE_NAME,
  };

  let scanResponse: ScanCommandOutput;
  try {
    scanResponse = await docClient.send(new ScanCommand(scanParams));
  } catch (error) {
    throw new Error(`During Cleanup. Failed to scan DynamoDB: ${error}`);
  }

  const dbItems = scanResponse.Items as {
    PartitionKey: string;
    SortKey: string;
    [index: string]: string;
  }[];

  const deleteRequests = dbItems.map((item) => ({
    DeleteRequest: {
      Key: {
        PartitionKey: item.PartitionKey,
        SortKey: item.SortKey,
      },
    },
  }));

  const batchWriteParams: BatchWriteCommandInput = {
    RequestItems: {
      [process.env.CHATVIOUSTABLE_TABLE_NAME as string]: deleteRequests,
    },
  };

  let batchWriteResponse: BatchWriteCommandOutput;
  try {
    batchWriteResponse = await docClient.send(
      new BatchWriteCommand(batchWriteParams)
    );
  } catch (error) {
    throw new Error(
      `During Cleanup. Failed to delete items from DynamoDB: ${error}`
    );
  }

  return batchWriteResponse;
}

export { newTestUser, checkRoomsOnUser, clearDynamoDB };
