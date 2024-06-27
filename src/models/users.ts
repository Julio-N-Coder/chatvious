import {
  UserInfo,
  FetchUserInfoReturn,
  UserInfoDBResponse,
  RoomsOnUser,
} from "../types/types.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function fetchUserInfo(userID: string): FetchUserInfoReturn {
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
    userID,
    userName: userInfoDBResponse.userName,
    email: userInfoDBResponse.email,
    profileColor: userInfoDBResponse.profileColor,
    ownedRooms: userInfoDBResponse.ownedRooms,
    joinedRooms: userInfoDBResponse.joinedRooms,
  };

  return { userInfo, statusCode: 200 };
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
