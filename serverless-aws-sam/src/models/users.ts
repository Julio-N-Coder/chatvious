import {
  BaseModelsReturnType,
  UserInfo,
  FetchUserInfoReturn,
  UserInfoDBResponse,
  RoomsOnUser,
  FetchRoomsOnUserData,
  FetchRoomsOnUserReturn,
  FetchNavJoinRequestsReturn,
  CreateUserInfoReturn,
} from "../types/types.js";
import { DynamoDBClient, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  PutCommand,
  PutCommandOutput,
  DeleteCommand,
  DeleteCommandOutput,
  GetCommandOutput,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";

const tableName = process.env.CHATVIOUSTABLE_TABLE_NAME
  ? process.env.CHATVIOUSTABLE_TABLE_NAME
  : "chatvious";
const dynamodbOptionsString = process.env.DYNAMODB_OPTIONS || "{}";
const dynamodbOptions = JSON.parse(dynamodbOptionsString);
const client = new DynamoDBClient(dynamodbOptions);
const docClient = DynamoDBDocumentClient.from(client);

class UserManager {
  async createUser(
    userID?: string,
    userName?: string,
    email?: string,
    profileColor?: string
  ): CreateUserInfoReturn {
    const colors = [
      "blue",
      "green",
      "orange",
      "yellow",
      "sky",
      "purple",
      "pink",
    ];
    const getRandomColor = () => {
      if (profileColor) return profileColor;
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const usedUserID = userID ? userID : (crypto.randomUUID() as string);
    const usedUserName = userName
      ? userName
      : `testUser${Math.floor(Math.random() * 100)}`;
    const usedEmail = email ? email : `${usedUserName}@example.com`;

    const newUser = {
      PartitionKey: `USER#${usedUserID}`,
      SortKey: "PROFILE",
      userID: usedUserID,
      userName: usedUserName,
      email: usedEmail,
      profileColor: getRandomColor(),
      ownedRooms: [],
      joinedRooms: [],
    };

    const createUserCommand = new PutCommand({
      TableName: tableName,
      Item: newUser,
    });

    let createUserResponse: PutCommandOutput;
    try {
      createUserResponse = await docClient.send(createUserCommand);
    } catch (error) {
      return { statusCode: 500, error: "Failed to create user" };
    }

    const statusCode = createUserResponse.$metadata.httpStatusCode;
    if (statusCode !== 200) {
      return { statusCode: 500, error: "Failed to create user" };
    }

    return {
      statusCode: 200,
      message: "User created successfully",
      newUser,
    };
  }

  async deleteUser(userID: string): BaseModelsReturnType {
    const deleteUserCommand = new DeleteCommand({
      TableName: tableName,
      Key: { PartitionKey: `USER#${userID}`, SortKey: "PROFILE" },
    });

    let deleteUserResponse: DeleteCommandOutput;
    try {
      deleteUserResponse = await docClient.send(deleteUserCommand);
    } catch (error) {
      return { error: "Failed to Delete User", statusCode: 500 };
    }
    const statusCode = deleteUserResponse.$metadata.httpStatusCode as number;

    if (statusCode !== 200) {
      return { error: "Failed to Delete User", statusCode };
    }

    return { message: "User Deleted", statusCode: 200 };
  }

  async fetchUserInfo(userID: string): FetchUserInfoReturn {
    const getUserInfo = new GetCommand({
      TableName: tableName,
      Key: { PartitionKey: `USER#${userID}`, SortKey: "PROFILE" },
      ConsistentRead: true,
    });

    let getUserResponse: GetCommandOutput;
    try {
      getUserResponse = await docClient.send(getUserInfo);
    } catch (error: any) {
      return { error: "Failed to Get User Info", statusCode: 500 };
    }
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

  async fetchRoomsOnUser(
    userID: string,
    fetchOwnedRooms: boolean,
    fetchJoinedRooms: boolean
  ): FetchRoomsOnUserReturn {
    const ownedRoomsString = "ownedRooms";
    const joinedRoomsString = "joinedRooms";

    let ProjectionExpression = "";
    if (fetchOwnedRooms && fetchJoinedRooms) {
      ProjectionExpression = `${ownedRoomsString}, ${joinedRoomsString}`;
    } else if (fetchOwnedRooms) {
      ProjectionExpression = ownedRoomsString;
    } else if (fetchJoinedRooms) {
      ProjectionExpression = joinedRoomsString;
    } else {
      return { error: "Did not provide all arguments", statusCode: 400 };
    }

    const fetchUserInfoCommand = new GetCommand({
      TableName: tableName,
      Key: { PartitionKey: `USER#${userID}`, SortKey: "PROFILE" },
      ProjectionExpression,
    });

    let userInfoDBResponse: GetCommandOutput;
    try {
      userInfoDBResponse = await docClient.send(fetchUserInfoCommand);
    } catch (error) {
      return { error: "Failed to Get User Info", statusCode: 500 };
    }
    const statusCode = userInfoDBResponse.$metadata.httpStatusCode as number;

    if (statusCode !== 200) {
      return { error: "Failed to Get User Info", statusCode };
    } else if (!userInfoDBResponse.Item) {
      return { error: "User not found", statusCode: 404 };
    }

    const roomsOnUser: FetchRoomsOnUserData = userInfoDBResponse.Item;

    return {
      message: "Rooms Fetched",
      data: roomsOnUser,
      statusCode: 200,
    };
  }

  async fetchSingleRoomOnUser(userID: string, RoomID: string) {
    const fetchRoomsOnUserResponse = await this.fetchRoomsOnUser(
      userID,
      true,
      true
    );
    if ("error" in fetchRoomsOnUserResponse) {
      return fetchRoomsOnUserResponse;
    }

    const ownedRooms = fetchRoomsOnUserResponse.data.ownedRooms as RoomsOnUser;
    const joinedRooms = fetchRoomsOnUserResponse.data
      .joinedRooms as RoomsOnUser;

    if (ownedRooms.length > 0) {
      const room = ownedRooms.find((room) => room.RoomID === RoomID);

      if (room) {
        return { message: "Owned Room Found", data: room, statusCode: 200 };
      }
    } else if (joinedRooms.length > 0) {
      const room = joinedRooms.find((room) => room.RoomID === RoomID);

      if (room) {
        return { message: "Joined Room Found", data: room, statusCode: 200 };
      }
    }

    return { error: "Room on user not found", statusCode: 404 };
  }

  async updateJoinedRooms(
    userID: string,
    joinedRoom: { RoomID: string; isAdmin: boolean; roomName: string }
  ): BaseModelsReturnType {
    const updateJoinedRoomsCommand = new UpdateCommand({
      TableName: tableName,
      Key: { PartitionKey: `USER#${userID}`, SortKey: "PROFILE" },
      UpdateExpression:
        "SET joinedRooms = list_append(joinedRooms, :joinedRoom)",
      ExpressionAttributeValues: {
        ":joinedRoom": [joinedRoom],
      },
    });

    let updateJoinedRoomsResponse: UpdateCommandOutput;
    try {
      updateJoinedRoomsResponse = await docClient.send(
        updateJoinedRoomsCommand
      );
    } catch (error) {
      return { error: "Failed to Update Joined Rooms", statusCode: 500 };
    }

    const statusCode = updateJoinedRoomsResponse.$metadata
      .httpStatusCode as number;

    if (statusCode !== 200) {
      return { error: "Failed to Update Joined Rooms", statusCode };
    }

    return { message: "Joined Rooms Updated", statusCode: 200 };
  }

  async removeRoomOnUser(userID: string, RoomID: string): BaseModelsReturnType {
    const fetchUserInfoCommand = new GetCommand({
      TableName: tableName,
      Key: { PartitionKey: `USER#${userID}`, SortKey: "PROFILE" },
      ProjectionExpression: "joinedRooms, ownedRooms",
    });

    let fetchUserInfoResponse: GetCommandOutput;
    try {
      fetchUserInfoResponse = await docClient.send(fetchUserInfoCommand);
    } catch (error) {
      return { error: "Failed to Get User Info", statusCode: 500 };
    }

    const userInfoStatusCode = fetchUserInfoResponse.$metadata
      .httpStatusCode as number;
    if (userInfoStatusCode !== 200) {
      return {
        error: "Failed to Get User Info",
        statusCode: userInfoStatusCode,
      };
    } else if (!fetchUserInfoResponse.Item) {
      return { error: "User not found", statusCode: 404 };
    }

    let roomType: string;
    let index: number;

    const joinedRooms = fetchUserInfoResponse.Item.joinedRooms as RoomsOnUser;
    let joinedRoomIndex = -1;
    const joinedRoom = joinedRooms.find((room) => {
      joinedRoomIndex++;
      return room.RoomID === RoomID;
    });

    if (!joinedRoom) {
      const ownedRooms = fetchUserInfoResponse.Item.ownedRooms as RoomsOnUser;
      let ownedRoomsIndex = -1;
      const ownedRoom = ownedRooms.find((room) => {
        ownedRoomsIndex++;
        return room.RoomID === RoomID;
      });

      if (!ownedRoom) {
        return { error: "User has not joined this room", statusCode: 400 };
      }
      roomType = "ownedRooms";
      index = ownedRoomsIndex;
    } else {
      roomType = "joinedRooms";
      index = joinedRoomIndex;
    }

    const removeRoomOnUserCommand = new UpdateCommand({
      TableName: tableName,
      Key: { PartitionKey: `USER#${userID}`, SortKey: "PROFILE" },
      UpdateExpression: `REMOVE ${roomType}[${index}]`,
    });

    let removeRoomOnUserResponse: UpdateCommandOutput;
    try {
      removeRoomOnUserResponse = await docClient.send(removeRoomOnUserCommand);
    } catch (error) {
      return { error: "Failed to remove Room on user", statusCode: 500 };
    }

    const statusCode = removeRoomOnUserResponse.$metadata
      .httpStatusCode as number;

    if (statusCode !== 200) {
      return { error: "Failed to remove Room on user", statusCode };
    }

    return { message: "Room on user Removed", statusCode: 200 };
  }

  // fetching only 5 join request.
  async fetchNavJoinRequests(
    ownedRooms: RoomsOnUser,
    joinedRooms: RoomsOnUser
  ): FetchNavJoinRequestsReturn {
    const navJoinRequest: { RoomID: string; roomName: string }[] = [];

    if (ownedRooms.length === 0 && joinedRooms.length === 0) {
      return { message: "No join requests", navJoinRequest, statusCode: 200 };
    }

    for (let i = 0; i < ownedRooms.length && i < 5; i++) {
      const joinRequestsCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression:
          "PartitionKey = :partitionkey AND begins_with(SortKey, :joinRequest)",
        ExpressionAttributeValues: {
          ":partitionkey": `ROOM#${ownedRooms[i].RoomID}`,
          ":joinRequest": "JOIN_REQUESTS#",
        },
        Limit: 1,
        ProjectionExpression: "RoomID, roomName",
      });

      let joinRequestsResponse: QueryCommandOutput;
      try {
        joinRequestsResponse = await docClient.send(joinRequestsCommand);
      } catch (error) {
        return { error: "Failed to Get Join Requests", statusCode: 500 };
      }

      const statusCode = joinRequestsResponse.$metadata
        .httpStatusCode as number;

      if (statusCode !== 200 || !joinRequestsResponse.Items) {
        return { error: "Failed to Get Join Requests", statusCode };
      }

      if (joinRequestsResponse.Count === 1) {
        navJoinRequest.push(
          joinRequestsResponse.Items[0] as unknown as {
            RoomID: string;
            roomName: string;
          }
        );
      } else break;
    }

    if (navJoinRequest.length >= 5) {
      return {
        message: "Fetch 5 Join Request",
        navJoinRequest,
        statusCode: 200,
      };
    }

    const reqeustLeft = 5 - navJoinRequest.length;
    for (let i = 0; i < joinedRooms.length && i < reqeustLeft; i++) {
      const currentJoinRoom = joinedRooms[i];
      if ("isAdmin" in currentJoinRoom) {
        if (!currentJoinRoom.isAdmin) continue;
      }

      const joinRequestsCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression:
          "PartitionKey = :partitionkey AND begins_with(SortKey, :joinRequest)",
        ExpressionAttributeValues: {
          ":partitionkey": `ROOM#${currentJoinRoom.RoomID}`,
          ":joinRequest": "JOIN_REQUESTS#",
        },
        Limit: 1,
        ProjectionExpression: "RoomID, roomName",
      });

      let joinRequestsResponse: QueryCommandOutput;
      try {
        joinRequestsResponse = await docClient.send(joinRequestsCommand);
      } catch (error) {
        return { error: "Failed to Get Join Requests", statusCode: 500 };
      }

      const statusCode = joinRequestsResponse.$metadata
        .httpStatusCode as number;

      if (statusCode !== 200 || !joinRequestsResponse.Items) {
        return { error: "Failed to Get Join Requests", statusCode };
      }
      if (joinRequestsResponse.Count === 1) {
        navJoinRequest.push(
          joinRequestsResponse.Items[0] as unknown as {
            RoomID: string;
            roomName: string;
          }
        );
      } else break;
    }

    return {
      message: "Fetched Nav Join Requests",
      navJoinRequest,
      statusCode: 200,
    };
  }
}

const userManager = new UserManager();

export { userManager };
