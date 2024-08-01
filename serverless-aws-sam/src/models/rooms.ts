import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  GetCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { userManager } from "./users.js";
import {
  BaseModelsReturnType,
  RoomInfoDBType,
  FetchRoomReturn,
  RoomInfoType,
  RoomMemberDB,
  RoomMember,
  FetchRoomMemberReturn,
  FetchRoomMembersReturn,
  JoinRequest,
  JoinRequestDB,
  FetchJoinRequestsReturn,
} from "../types/types.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

class RoomManager {
  async makeRoom(
    ownerID: string,
    ownerName: string,
    roomName: string,
    profileColor: string
  ): FetchRoomReturn {
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
      GSISortKey: `MEMBERS#DATE#${madeDate}`,
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

    return {
      roomInfo: {
        RoomID,
        roomName,
        createdAt: madeDate,
      },
      message: "Room Created",
      statusCode: 201,
    };
  }

  async deleteRoom(RoomID: string): BaseModelsReturnType {
    // fetch all members and loop through them deleting the rooms on them
    const membersResponse = await this.fetchRoomMembers(RoomID, true);
    if ("error" in membersResponse) {
      return {
        error: membersResponse.error,
        statusCode: membersResponse.statusCode,
      };
    }
    if (membersResponse.memberCount > 0) {
      const members = membersResponse.roomMembers;
      for (const member of members) {
        const memberID = member.userID;
        const removeRoomOnUserResponse = await userManager.removeRoomOnUser(
          memberID,
          RoomID
        );
        if ("error" in removeRoomOnUserResponse) {
          return {
            error: removeRoomOnUserResponse.error,
            statusCode: removeRoomOnUserResponse.statusCode,
          };
        }
      }
    }

    const deleteRoomCommand = new DeleteCommand({
      TableName: "chatvious",
      Key: { PartitionKey: `ROOM#${RoomID}`, SortKey: "METADATA" },
    });
    const deleteRoomResponse = await docClient.send(deleteRoomCommand);
    const statusCode = deleteRoomResponse.$metadata.httpStatusCode as number;

    if (statusCode !== 200) {
      return { error: "Failed to Delete Room", statusCode };
    }

    return { message: "Room Deleted", statusCode: 200 };
  }

  async fetchRoom(RoomID: string): FetchRoomReturn {
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
    return { roomInfo, message: "Room Found", statusCode: 200 };
  }

  async fetchRoomMembers(
    RoomID: string,
    ConsistentRead?: boolean
  ): FetchRoomMembersReturn {
    const roomMembersCommand = new QueryCommand({
      TableName: "chatvious",
      KeyConditionExpression:
        "PartitionKey = :partitionKey AND begins_with(SortKey, :RoomMembersPrefix)",
      ExpressionAttributeValues: {
        ":partitionKey": `ROOM#${RoomID}`,
        ":RoomMembersPrefix": "MEMBERS#",
      },
      ConsistentRead: ConsistentRead ? true : false,
    });

    const roomMembersResponse = await docClient.send(roomMembersCommand);
    const memberCount = roomMembersResponse.Count as number;
    if (roomMembersResponse.$metadata.httpStatusCode !== 200) {
      return { error: "Failed to Get Room Members", statusCode: 500 };
    }

    const roomMembersDB = roomMembersResponse.Items as RoomMemberDB[];

    const roomMembers: RoomMember[] = roomMembersDB.map((member) => {
      const joinedAt = member.GSISortKey.split("#")[2] as string;

      return {
        userName: member.userName,
        userID: member.userID,
        RoomID,
        RoomUserStatus: member.RoomUserStatus,
        joinedAt,
        profileColor: member.profileColor,
      };
    });

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

  async fetchRoomMember(RoomID: string, userID: string): FetchRoomMemberReturn {
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
    const joinedAt = roomMemberDB.GSISortKey.split("#").pop() as string;

    const roomMember: RoomMember = {
      userName: roomMemberDB.userName,
      userID: roomMemberDB.userID,
      RoomID,
      RoomUserStatus: roomMemberDB.RoomUserStatus,
      joinedAt,
      profileColor: roomMemberDB.profileColor,
    };

    return { roomMember, statusCode: 200 };
  }

  async addRoomMember(
    RoomID: string,
    memberID: string,
    memberName: string,
    profileColor: string
  ): BaseModelsReturnType {
    const madeDate = new Date().toISOString() as string;

    const roomMemberItem: RoomMemberDB = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `MEMBERS#USERID#${memberID}`,
      userID: memberID,
      userName: memberName,
      RoomID,
      RoomUserStatus: "MEMBER",
      GSISortKey: `MEMBERS#DATE#${madeDate}`,
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

  async removeRoomMember(
    RoomID: string,
    memberID: string
  ): BaseModelsReturnType {
    const removeMemberCommand = new DeleteCommand({
      TableName: "chatvious",
      Key: {
        PartitionKey: `ROOM#${RoomID}`,
        SortKey: `MEMBERS#USERID#${memberID}`,
      },
      ReturnValues: "ALL_OLD",
    });

    const removeMemberResponse = await docClient.send(removeMemberCommand);
    const StatusCode = removeMemberResponse.$metadata.httpStatusCode as number;
    if (StatusCode !== 200) {
      return {
        error: "Failed to remove Member",
        statusCode: StatusCode,
      };
    } else if (removeMemberResponse.Attributes == undefined) {
      return { error: "Bad Request", statusCode: 400 };
    }

    return { message: "Member Removed", statusCode: 200 };
  }

  async fetchJoinRequest(RoomID: string, userID: string) {
    const joinRequestCommand = new GetCommand({
      TableName: "chatvious",
      Key: {
        PartitionKey: `ROOM#${RoomID}`,
        SortKey: `JOIN_REQUESTS#USERID#${userID}`,
      },
      ConsistentRead: true,
    });

    let joinRequestResponse: GetCommandOutput;
    try {
      joinRequestResponse = await docClient.send(joinRequestCommand);
    } catch (error) {
      return { error: "Failed to Get Join Request", statusCode: 500 };
    }
    const statusCode = joinRequestResponse.$metadata.httpStatusCode as number;

    if (statusCode !== 200) {
      return { error: "Failed to Get Join Request", statusCode: 500 };
    } else if (joinRequestResponse.Item == undefined) {
      return { error: "Bad Request", statusCode: 400 };
    }

    const joinRequestDB = joinRequestResponse.Item as JoinRequestDB;
    const sentJoinRequestAt = joinRequestDB.GSISortKey;

    const joinRequest: JoinRequest = {
      RoomID: joinRequestDB.RoomID,
      fromUserID: joinRequestDB.fromUserID,
      fromUserName: joinRequestDB.fromUserName,
      roomName: joinRequestDB.roomName,
      profileColor: joinRequestDB.profileColor,
      sentJoinRequestAt,
    };

    return { message: "Join Request Fetched", joinRequest, statusCode: 200 };
  }

  async fetchJoinRequests(RoomID: string): FetchJoinRequestsReturn {
    const joinRequestsCommand = new QueryCommand({
      TableName: "chatvious",
      IndexName: "Generic-GSISort-Index",
      KeyConditionExpression:
        "PartitionKey = :roomsID AND begins_with(GSISortKey, :sortDate)",
      ExpressionAttributeValues: {
        ":roomsID": `ROOM#${RoomID}`,
        ":sortDate": "JOIN_REQUESTS#",
      },
    });

    const joinRequestResponse = await docClient.send(joinRequestsCommand);

    if (joinRequestResponse.$metadata.httpStatusCode !== 200) {
      return { error: "Failed to Get Join Requests", statusCode: 500 };
    } else if (joinRequestResponse.Count === 0) {
      return { message: "No Join Requests", joinRequests: [], statusCode: 200 };
    }
    const joinRequestsDB = joinRequestResponse.Items as JoinRequestDB[];
    const joinRequests = joinRequestsDB?.map((request) => {
      const sentJoinRequestAt = request.GSISortKey.split("#").pop() as string;

      return {
        RoomID: request.RoomID,
        fromUserID: request.fromUserID,
        fromUserName: request.fromUserName,
        roomName: request.roomName,
        sentJoinRequestAt,
        profileColor: request.profileColor,
      };
    });

    return {
      message: `${joinRequests.length} Join Request Fetched`,
      joinRequests,
      statusCode: 200,
    };
  }

  async sendJoinRequest(
    fromUserName: string,
    fromUserID: string,
    roomName: string,
    RoomID: string,
    profileColor: string
  ): BaseModelsReturnType {
    const sentJoinRequestAt = new Date().toISOString();
    const joinRequestCommand = new PutCommand({
      TableName: "chatvious",
      Item: {
        PartitionKey: `ROOM#${RoomID}`,
        SortKey: `JOIN_REQUESTS#USERID#${fromUserID}`,
        RoomID,
        fromUserID,
        fromUserName,
        roomName,
        GSISortKey: `JOIN_REQUESTS#DATE#${sentJoinRequestAt}`,
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

  async removeJoinRequest(
    RoomID: string,
    requestUserID: string
  ): BaseModelsReturnType {
    const joinRequestCommand = new DeleteCommand({
      TableName: "chatvious",
      Key: {
        PartitionKey: `ROOM#${RoomID}`,
        SortKey: `JOIN_REQUESTS#USERID#${requestUserID}`,
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
}

const roomManager = new RoomManager();

export { roomManager };
