import { Request } from "express";
import {
  UserInfo,
  FetchUserInfoReturn,
  SendRoomRequestReturn,
  UserInfoDBResponse,
  RoomsOnUser,
} from "../types/types.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

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
    TableName: "chatvious",
    Key: { PartitionKey: `USER#${userID}`, SortKey: "PROFILE" },
    ConsistentRead: true,
  });

  const getUserResponse = await docClient.send(getUserInfo);
  const statusCode = getUserResponse.$metadata.httpStatusCode as number;

  if (statusCode !== 200) {
    return { error: "Failed to Get User Info", statusCode };
  } else if (!getUserResponse.Item) {
    return { error: "User not found", statusCode: 404 };
  }

  const userInfoDBResponse = getUserResponse.Item as UserInfoDBResponse;
  const userInfo: UserInfo = {
    id: userID,
    username: userInfoDBResponse.username,
    email: userInfoDBResponse.email,
    profileColor: userInfoDBResponse.profileColor,
    ownedRooms: userInfoDBResponse.ownedRooms,
    joinedRooms: userInfoDBResponse.joinedRooms,
  };

  return { userInfo, statusCode: 200 };
}

async function sendRoomRequest(
  ownerID: string,
  fromUserName: string,
  fromUserID: string,
  roomName: string,
  roomID: string
): SendRoomRequestReturn {
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
      roomID,
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

// not implemented yet
async function fetchFirst5JoinRequests(
  userID: string,
  ownedRooms: RoomsOnUser,
  joinedRooms: RoomsOnUser
) {
  const joinRequestsCommand = new QueryCommand({
    TableName: "chatvious",
    KeyConditionExpression: "ownerID = :userID",
    ExpressionAttributeValues: {
      ":userID": userID,
    },
    Limit: 5,
  });

  const joinRequestsResponse = await docClient.send(joinRequestsCommand);
  const statusCode = joinRequestsResponse.$metadata.httpStatusCode as number;

  if (statusCode !== 200) {
    return;
  }
}

export { fetchUserInfo };
