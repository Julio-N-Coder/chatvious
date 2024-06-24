import { Request } from "express";
import {
  UserInfo,
  FetchUserInfoReturn,
  sendRoomRequestReturn,
} from "../types/types.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

declare module "express" {
  interface Request {
    user?: {
      id: string;
    };
  }
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function fetchUserInfo(req: Request): FetchUserInfoReturn {
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

  const userInfo = getUserResponse.Item as UserInfo;

  return { userInfo, statusCode: 200 };
}

async function sendRoomRequest(
  ownerID: string,
  fromUserName: string,
  fromUserID: string,
  roomName: string
): sendRoomRequestReturn {
  const allJoinRequestCommand = new QueryCommand({
    TableName: "chatvious-joinRoomRequest",
    KeyConditionExpression: "ownerID = :ownerID",
    ExpressionAttributeValues: {
      ":ownerID": ownerID,
    },
    ConsistentRead: true,
  });

  const allJoinRequest = await docClient.send(allJoinRequestCommand);

  if (allJoinRequest.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to fetch Join Requests", statusCode: 400 };
  } else if (
    allJoinRequest.Items &&
    allJoinRequest.Items.find(
      (item) => item.fromUserID === fromUserID && item.roomName === roomName
    )
  ) {
    return {
      error: "You have already sent a join request to this room",
      statusCode: 400,
    };
  }

  const notificationCommand = new PutCommand({
    TableName: "chatvious-joinRoomRequest",
    Item: {
      ownerID,
      createdAt: new Date().toISOString(),
      fromUserName,
      fromUserID,
      roomName,
    },
  });

  const notificationResponse = await docClient.send(notificationCommand);
  const statusCode = notificationResponse.$metadata.httpStatusCode as number;

  if (statusCode !== 200) {
    return { error: "Failed to send Join Request", statusCode };
  }

  return {
    message: "Successfully sent Join Request to the Owner",
    statusCode: 200,
  };
}

export { fetchUserInfo, sendRoomRequest };
