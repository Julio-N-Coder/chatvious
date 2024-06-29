import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  MakeRoomReturnType,
  RoomInfoDBType,
  FetchRoomReturn,
  RoomInfoType,
  RoomMemberDB,
  RoomMember,
  FetchRoomMemberReturn,
  FetchRoomMembersReturn,
  JoinRequestsDB,
  FetchJoinRequestsReturn,
  SendJoinRequestReturn,
  RemoveJoinRequestReturn,
  AddRoomMemberReturn,
} from "../types/types.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function makeRoom(
  ownerID: string,
  ownerName: string,
  roomName: string,
  profileColor: string
): MakeRoomReturnType {
  const RoomID = crypto.randomUUID() as string;

  const madeDate = new Date().toISOString() as string;
  const roomData: RoomInfoDBType = {
    PartitionKey: `ROOM#${RoomID}`,
    SortKey: "METADATA",
    RoomID,
    roomName,
    createdAt: madeDate,
  };

  const newRoomCommand = new PutCommand({
    TableName: "chatvious",
    Item: roomData,
  });

  // newRoom value needs to be wrapped in an array
  const updateUserRoomCommand = new UpdateCommand({
    TableName: "chatvious",
    Key: { PartitionKey: `USER#${ownerID}`, SortKey: "PROFILE" },
    UpdateExpression: "SET ownedRooms = list_append(ownedRooms, :newRoom)",
    ExpressionAttributeValues: {
      ":newRoom": [
        {
          roomName: roomData.roomName,
          RoomID: roomData.RoomID,
        },
      ],
    },
  });

  // make RoomMember Entry for owner.
  const roomMemberItem: RoomMemberDB = {
    PartitionKey: `ROOM#${RoomID}`,
    SortKey: `MEMBERS#USERID#${ownerID}`,
    userID: ownerID,
    userName: ownerName,
    RoomID,
    RoomUserStatus: "OWNER",
    joinedAt: madeDate,
    profileColor,
  };

  const roomMemberCommand = new PutCommand({
    TableName: "chatvious",
    Item: roomMemberItem,
  });

  const makeRoomResponse = await docClient.send(newRoomCommand);
  const makeRoomStatusCode = makeRoomResponse.$metadata
    .httpStatusCode as number;
  if (makeRoomStatusCode !== 200) {
    return {
      error: "Failed to make room",
      statusCode: makeRoomStatusCode,
    };
  }

  const roomMemberResponse = await docClient.send(roomMemberCommand);
  const roomMemberStatusCode = roomMemberResponse.$metadata
    .httpStatusCode as number;
  if (roomMemberStatusCode !== 200) {
    return {
      error: "Failed to make room member",
      statusCode: roomMemberStatusCode,
    };
  }

  const updateUsersResponse = await docClient.send(updateUserRoomCommand);
  const updateStatusCode = updateUsersResponse.$metadata
    .httpStatusCode as number;
  if (updateStatusCode !== 200) {
    return {
      error: "Failed to update user",
      statusCode: updateStatusCode,
    };
  }

  return { message: "Room Created", statusCode: 201 };
}

async function fetchRoom(RoomID: string): FetchRoomReturn {
  const roomInfoCommand = new GetCommand({
    TableName: "chatvious",
    Key: { PartitionKey: `ROOM#${RoomID}`, SortKey: "METADATA" },
  });

  const roomInfoResponse = await docClient.send(roomInfoCommand);

  if (roomInfoResponse.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to Get Room Info", statusCode: 500 };
  }

  const roomInfoDB = roomInfoResponse.Item as RoomInfoDBType | undefined;
  if (roomInfoDB == undefined) {
    return { error: "Bad Request", statusCode: 400 };
  }

  const roomInfo: RoomInfoType = {
    RoomID: roomInfoDB.RoomID,
    roomName: roomInfoDB.roomName,
    createdAt: roomInfoDB.createdAt,
  };
  return { roomInfo, statusCode: 200 };
}

async function fetchRoomMembers(RoomID: string): FetchRoomMembersReturn {
  const roomMembersCommand = new QueryCommand({
    TableName: "chatvious",
    KeyConditionExpression:
      "PartitionKey = :partitionKey AND begins_with(SortKey, :RoomMembersPrefix)",
    ExpressionAttributeValues: {
      ":partitionKey": `ROOM#${RoomID}`,
      ":RoomMembersPrefix": "MEMBERS#",
    },
  });

  const roomMembersResponse = await docClient.send(roomMembersCommand);
  const memberCount = roomMembersResponse.Count as number;
  if (roomMembersResponse.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to Get Room Members", statusCode: 500 };
  }

  const roomMembersDB = roomMembersResponse.Items as RoomMemberDB[];
  const roomMembers: RoomMember[] = roomMembersDB.map((member) => ({
    userName: member.userName,
    userID: member.userID,
    RoomID,
    RoomUserStatus: member.RoomUserStatus,
    joinedAt: member.joinedAt,
    profileColor: member.profileColor,
  }));

  if (roomMembersResponse.Count === 0) {
    return { roomMembers, message: "No Users", memberCount, statusCode: 200 };
  }

  return {
    roomMembers,
    message: `${memberCount} Users Found`,
    memberCount,
    statusCode: 200,
  };
}

async function fetchRoomMember(
  RoomID: string,
  userID: string
): FetchRoomMemberReturn {
  const roomMemberCommand = new GetCommand({
    TableName: "chatvious",
    Key: {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `MEMBERS#USERID#${userID}`,
    },
  });

  const roomMemberResponse = await docClient.send(roomMemberCommand);

  if (roomMemberResponse.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to Get Room Member", statusCode: 500 };
  }

  const roomMemberDB = roomMemberResponse.Item as RoomMemberDB | undefined;
  if (roomMemberDB == undefined) {
    return { error: "Bad Request", statusCode: 400 };
  }

  const roomMember: RoomMember = {
    userName: roomMemberDB.userName,
    userID: roomMemberDB.userID,
    RoomID,
    RoomUserStatus: roomMemberDB.RoomUserStatus,
    joinedAt: roomMemberDB.joinedAt,
    profileColor: roomMemberDB.profileColor,
  };

  return { roomMember, statusCode: 200 };
}

async function addRoomMember(
  RoomID: string,
  memberID: string,
  memberName: string,
  profileColor: string
): AddRoomMemberReturn {
  const madeDate = new Date().toISOString() as string;

  const roomMemberItem: RoomMemberDB = {
    PartitionKey: `ROOM#${RoomID}`,
    SortKey: `MEMBERS#USERID#${memberID}`,
    userID: memberID,
    userName: memberName,
    RoomID,
    RoomUserStatus: "MEMBER",
    joinedAt: madeDate,
    profileColor,
  };

  const roomMemberCommand = new PutCommand({
    TableName: "chatvious",
    Item: roomMemberItem,
  });

  const makeRoomResponse = await docClient.send(roomMemberCommand);
  const makeRoomStatusCode = makeRoomResponse.$metadata
    .httpStatusCode as number;
  if (makeRoomStatusCode !== 200) {
    return {
      error: "Failed to add Member",
      statusCode: makeRoomStatusCode,
    };
  }

  return { message: "Member Added", statusCode: 201 };
}

async function fetchJoinRequests(RoomID: string): FetchJoinRequestsReturn {
  const joinRequestsCommand = new QueryCommand({
    TableName: "chatvious",
    KeyConditionExpression:
      "PartitionKey = :roomsID AND begins_with(SortKey, :joinRequest)",
    ExpressionAttributeValues: {
      ":roomsID": `ROOM#${RoomID}`,
      ":joinRequest": "JOIN_REQUESTS#",
    },
    ConsistentRead: true,
  });

  const joinRequestResponse = await docClient.send(joinRequestsCommand);

  if (joinRequestResponse.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to Get Join Requests", statusCode: 500 };
  }
  const joinRequestsDB = joinRequestResponse.Items as JoinRequestsDB;
  const joinRequests = joinRequestsDB?.map((request) => ({
    RoomID: request.RoomID,
    fromUserID: request.fromUserID,
    fromUserName: request.fromUserName,
    roomName: request.roomName,
    sentJoinRequestAt: request.sentJoinRequestAt,
    profileColor: request.profileColor,
  }));

  if (joinRequestResponse.Count === 0) {
    return { message: "No Join Requests", joinRequests, statusCode: 200 };
  }

  return {
    message: `${joinRequests.length} Join Request Fetched`,
    joinRequests,
    statusCode: 200,
  };
}

async function sendJoinRequest(
  fromUserName: string,
  fromUserID: string,
  roomName: string,
  RoomID: string,
  profileColor: string
): SendJoinRequestReturn {
  const sentJoinRequestAt = new Date().toISOString();
  const joinRequestCommand = new PutCommand({
    TableName: "chatvious",
    Item: {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `JOIN_REQUESTS#DATE#${sentJoinRequestAt}#USERID#${fromUserID}`,
      RoomID,
      fromUserID,
      fromUserName,
      roomName,
      sentJoinRequestAt,
      profileColor,
    },
  });

  const joinRequestResponse = await docClient.send(joinRequestCommand);
  const statusCode = joinRequestResponse.$metadata.httpStatusCode as number;

  if (statusCode !== 200) {
    return { error: "Failed to send Join Request", statusCode };
  }

  return {
    message: "Successfully sent Join Request to the Room",
    statusCode: 200,
  };
}

async function removeJoinRequest(
  RoomID: string,
  sentJoinRequestAt: string,
  requestUserID: string
): RemoveJoinRequestReturn {
  const joinRequestCommand = new DeleteCommand({
    TableName: "chatvious",
    Key: {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `JOIN_REQUESTS#DATE#${sentJoinRequestAt}#USERID#${requestUserID}`,
    },
    ReturnValues: "ALL_OLD",
  });

  const joinRequestResponse = await docClient.send(joinRequestCommand);
  const statusCode = joinRequestResponse.$metadata.httpStatusCode as number;

  if (statusCode !== 200) {
    return { error: "Failed to remove Join Request", statusCode };
  }
  // checks if anything was deleted.
  if (joinRequestResponse.Attributes == undefined) {
    return { error: "Bad Request", statusCode: 400 };
  }

  return {
    message: "Successfully removed Join Request",
    statusCode: 200,
  };
}

export {
  makeRoom,
  fetchRoom,
  fetchRoomMembers,
  fetchRoomMember,
  fetchJoinRequests,
  sendJoinRequest,
  removeJoinRequest,
  addRoomMember,
};
