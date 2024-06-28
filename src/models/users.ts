import {
  UserInfo,
  FetchUserInfoReturn,
  UserInfoDBResponse,
  RoomsOnUser,
  FetchNavJoinRequestsReturn,
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

// fetching only 5 join request.
async function fetchNavJoinRequests(
  ownedRooms: RoomsOnUser,
  joinedRooms: RoomsOnUser
): FetchNavJoinRequestsReturn {
  const navJoinRequest: { RoomID: string; roomName: string }[] = [];

  if (ownedRooms.length === 0 && joinedRooms.length === 0) {
    return { message: "No join requests", navJoinRequest, statusCode: 200 };
  }

  for (let i = 0; i < ownedRooms.length && i < 5; i++) {
    const joinRequestsCommand = new QueryCommand({
      TableName: "chatvious",
      KeyConditionExpression:
        "PartitionKey = :partitionkey AND begins_with(SortKey, :joinRequest)",
      ExpressionAttributeValues: {
        ":partitionkey": `ROOM#${ownedRooms[i].RoomID}`,
        ":joinRequest": "JOIN_REQUESTS#",
      },
      Limit: 1,
      ProjectionExpression: "RoomID, roomName",
    });

    const joinRequestsResponse = await docClient.send(joinRequestsCommand);
    const statusCode = joinRequestsResponse.$metadata.httpStatusCode as number;

    if (statusCode !== 200 || !joinRequestsResponse.Items) {
      console.log("Failed to Get Join Requests");
      return { error: "Failed to Get Join Requests", statusCode };
    }
    if (joinRequestsResponse.Count === 1) {
      navJoinRequest.push(
        joinRequestsResponse.Items[0] as { RoomID: string; roomName: string }
      );
    } else break;
  }

  if (navJoinRequest.length >= 5) {
    return { message: "Fetch 5 Join Request", navJoinRequest, statusCode: 200 };
  }

  const reqeustLeft = 5 - navJoinRequest.length;
  for (let i = 0; i < joinedRooms.length && i < reqeustLeft; i++) {
    const currentJoinRoom = joinedRooms[i];
    if (!("isAdminOrOwner" in currentJoinRoom)) continue;

    const joinRequestsCommand = new QueryCommand({
      TableName: "chatvious",
      KeyConditionExpression:
        "PartitionKey = :partitionkey AND begins_with(SortKey, :joinRequest)",
      ExpressionAttributeValues: {
        ":partitionkey": `ROOM#${currentJoinRoom.RoomID}`,
        ":joinRequest": "JOIN_REQUESTS#",
      },
      Limit: 1,
      ProjectionExpression: "RoomID, roomName",
    });

    const joinRequestsResponse = await docClient.send(joinRequestsCommand);
    const statusCode = joinRequestsResponse.$metadata.httpStatusCode as number;

    if (statusCode !== 200 || !joinRequestsResponse.Items) {
      return { error: "Failed to Get Join Requests", statusCode };
    }
    if (joinRequestsResponse.Count === 1) {
      navJoinRequest.push(
        joinRequestsResponse.Items[0] as { RoomID: string; roomName: string }
      );
    } else break;
  }

  return {
    message: "Fetched Nav Join Requests",
    navJoinRequest,
    statusCode: 200,
  };
}

export { fetchUserInfo, fetchNavJoinRequests };
