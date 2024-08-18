import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  GetCommandOutput,
  PutCommandOutput,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { userManager } from "./users.js";
import { messagesManagerDB } from "./messagesDB.js";
import {
  BaseModelsReturnType,
  RoomInfoKeys,
  RoomInfoDBType,
  FetchRoomReturn,
  RoomInfoType,
  RoomMemberKeys,
  RoomMemberDB,
  RoomMember,
  FetchRoomMemberReturn,
  FetchRoomMembersReturn,
  JoinRequest,
  JoinRequestKeys,
  JoinRequestDB,
  FetchJoinRequestReturn,
  FetchJoinRequestsReturn,
  MessageKeys,
} from "../types/types.js";

const tableName = process.env.CHATVIOUSTABLE_TABLE_NAME
  ? process.env.CHATVIOUSTABLE_TABLE_NAME
  : "chatvious";
const dynamodbOptionsString = process.env.DYNAMODB_OPTIONS || "{}";
const dynamodbOptions = JSON.parse(dynamodbOptionsString);
const client = new DynamoDBClient(dynamodbOptions);
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
      roomMemberCount: 1,
    };

    const newRoomCommand = new PutCommand({
      TableName: tableName,
      Item: roomData,
    });

    // newRoom value needs to be wrapped in an array
    const updateUserRoomCommand = new UpdateCommand({
      TableName: tableName,
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
      TableName: tableName,
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
        roomMemberCount: 1,
      },
      message: "Room Created",
      statusCode: 201,
    };
  }

  // update to handle LastEvaluatedKey on messages
  async deleteRoom(RoomID: string): BaseModelsReturnType {
    // delete all join request the room has
    const fetchJoinRequestsResponse = await this.fetchJoinRequests(RoomID);
    if ("error" in fetchJoinRequestsResponse) {
      return {
        error: fetchJoinRequestsResponse.error,
        statusCode: fetchJoinRequestsResponse.statusCode,
      };
    }
    const joinRequests = fetchJoinRequestsResponse.joinRequests;
    if (joinRequests.length > 0) {
      for (const joinRequest of joinRequests) {
        const deleteJoinRequestResponse = await this.removeJoinRequest(
          RoomID,
          joinRequest.fromUserID
        );
        if ("error" in deleteJoinRequestResponse) {
          return {
            error: deleteJoinRequestResponse.error,
            statusCode: deleteJoinRequestResponse.statusCode,
          };
        }
      }
    }

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

        // delete room member data as well
        const removeRoomMemberResponse = await this.removeRoomMember(
          RoomID,
          memberID
        );
        if ("error" in removeRoomMemberResponse) {
          return {
            error: removeRoomMemberResponse.error,
            statusCode: removeRoomMemberResponse.statusCode,
          };
        }
      }
    }

    // delete all Messages in the room
    while (true) {
      let LastEvaluatedKey: MessageKeys | undefined;

      const fetchMessagesResponse =
        await messagesManagerDB.fetchAllRoomMessages(
          RoomID,
          false,
          LastEvaluatedKey
        );
      if ("error" in fetchMessagesResponse) {
        return {
          error: fetchMessagesResponse.error,
          statusCode: fetchMessagesResponse.statusCode,
        };
      }

      LastEvaluatedKey = fetchMessagesResponse.LastEvaluatedKey;

      if (fetchMessagesResponse.message === "Messages fetched successfully") {
        const messages = fetchMessagesResponse.data;
        for (const message of messages) {
          const deleteMessageResponse = await messagesManagerDB.deleteMessage(
            RoomID,
            message.sentAt,
            message.messageId
          );
          if ("error" in deleteMessageResponse) {
            return {
              error: deleteMessageResponse.error,
              statusCode: deleteMessageResponse.statusCode,
            };
          }
        }
      } else {
        break;
      }
    }

    const deleteRoomCommand = new DeleteCommand({
      TableName: tableName,
      Key: { PartitionKey: `ROOM#${RoomID}`, SortKey: "METADATA" },
      ReturnValues: "ALL_OLD",
    });
    const deleteRoomResponse = await docClient.send(deleteRoomCommand);
    const statusCode = deleteRoomResponse.$metadata.httpStatusCode as number;

    if (statusCode !== 200) {
      return { error: "Failed to Delete Room", statusCode };
    } else if (deleteRoomResponse.Attributes == undefined) {
      return { error: "Bad Request", statusCode: 400 };
    }

    return { message: "Room Deleted", statusCode: 200 };
  }

  async fetchRoom(RoomID: string): FetchRoomReturn {
    const roomInfoCommand = new GetCommand({
      TableName: tableName,
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
      roomMemberCount: roomInfoDB.roomMemberCount,
    };
    return { roomInfo, message: "Room Found", statusCode: 200 };
  }

  async fetchRoomMembers(
    RoomID: string,
    ConsistentRead?: boolean,
    ExclusiveStartKey?: MessageKeys
  ): FetchRoomMembersReturn {
    const roomMembersCommand = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression:
        "PartitionKey = :partitionKey AND begins_with(SortKey, :RoomMembersPrefix)",
      ExpressionAttributeValues: {
        ":partitionKey": `ROOM#${RoomID}`,
        ":RoomMembersPrefix": "MEMBERS#",
      },
      ConsistentRead: ConsistentRead ? true : false,
    });
    if (ExclusiveStartKey) {
      roomMembersCommand.input.ExclusiveStartKey = ExclusiveStartKey;
    }

    const roomMembersResponse = await docClient.send(roomMembersCommand);
    const memberCount = roomMembersResponse.Count as number;
    if (roomMembersResponse.$metadata.httpStatusCode !== 200) {
      return { error: "Failed to Get Room Members", statusCode: 500 };
    }

    const roomMembersDB = roomMembersResponse.Items as RoomMemberDB[];
    const LastEvaluatedKey = roomMembersResponse.LastEvaluatedKey as
      | RoomMemberKeys
      | undefined;

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
      return {
        roomMembers,
        message: "No Users",
        memberCount,
        statusCode: 200,
        LastEvaluatedKey,
      };
    }

    return {
      roomMembers,
      message: `${memberCount} Users Found`,
      memberCount,
      statusCode: 200,
      LastEvaluatedKey,
    };
  }

  async fetchRoomMember(RoomID: string, userID: string): FetchRoomMemberReturn {
    const roomMemberCommand = new GetCommand({
      TableName: tableName,
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
      TableName: tableName,
      Item: roomMemberItem,
    });

    let makeRoomResponse: PutCommandOutput;
    try {
      makeRoomResponse = await docClient.send(roomMemberCommand);
    } catch (error) {
      console.log("add member error", error);
      return { error: "Failed to add Member", statusCode: 500 };
    }

    const makeRoomStatusCode = makeRoomResponse.$metadata
      .httpStatusCode as number;
    if (makeRoomStatusCode !== 200) {
      return {
        error: "Failed to add Member",
        statusCode: makeRoomStatusCode,
      };
    }

    const addMemberCountResponse = await this.addSubMemberCount(RoomID, 1);
    if ("error" in addMemberCountResponse) {
      return {
        error: addMemberCountResponse.error,
        statusCode: addMemberCountResponse.statusCode,
      };
    }

    return { message: "Member Added", statusCode: 201 };
  }

  async removeRoomMember(
    RoomID: string,
    memberID: string
  ): BaseModelsReturnType {
    const removeMemberCommand = new DeleteCommand({
      TableName: tableName,
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

    const subMemberCountResponse = await this.addSubMemberCount(RoomID, -1);
    if ("error" in subMemberCountResponse) {
      return {
        error: subMemberCountResponse.error,
        statusCode: subMemberCountResponse.statusCode,
      };
    }

    return { message: "Member Removed", statusCode: 200 };
  }

  async addSubMemberCount(
    RoomID: string,
    amount: number
  ): BaseModelsReturnType {
    const inputKeys: RoomInfoKeys = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: "METADATA",
    };

    const ddSubMemberCountCommand = new UpdateCommand({
      TableName: tableName,
      Key: inputKeys,
      UpdateExpression: "ADD roomMemberCount :amount",
      ExpressionAttributeValues: { ":amount": amount },
      ReturnValues: "UPDATED_NEW",
    });

    let ddSubMemberCountResponse: UpdateCommandOutput;
    try {
      ddSubMemberCountResponse = await docClient.send(ddSubMemberCountCommand);
    } catch (error) {
      return { error: "Failed to add Member Count", statusCode: 500 };
    }

    const statusCode = ddSubMemberCountResponse.$metadata
      .httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Failed to add Member Count", statusCode: 500 };
    } else if (ddSubMemberCountResponse.Attributes == undefined) {
      return { error: "Bad Request", statusCode: 400 };
    }

    return {
      message: "Member Count added",
      statusCode: 200,
    };
  }

  async fetchJoinRequest(
    RoomID: string,
    userID: string
  ): FetchJoinRequestReturn {
    const joinRequestCommand = new GetCommand({
      TableName: tableName,
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

  async fetchJoinRequests(
    RoomID: string,
    ExclusiveStartKey?: MessageKeys
  ): FetchJoinRequestsReturn {
    const joinRequestsCommand = new QueryCommand({
      TableName: tableName,
      IndexName: "Generic-GSISort-Index",
      KeyConditionExpression:
        "PartitionKey = :roomsID AND begins_with(GSISortKey, :sortDate)",
      ExpressionAttributeValues: {
        ":roomsID": `ROOM#${RoomID}`,
        ":sortDate": "JOIN_REQUESTS#",
      },
    });
    if (ExclusiveStartKey) {
      joinRequestsCommand.input.ExclusiveStartKey = ExclusiveStartKey;
    }

    const joinRequestResponse = await docClient.send(joinRequestsCommand);

    if (joinRequestResponse.$metadata.httpStatusCode !== 200) {
      return { error: "Failed to Get Join Requests", statusCode: 500 };
    } else if (joinRequestResponse.Count === 0) {
      return {
        message: "No Join Requests",
        joinRequests: [],
        LastEvaluatedKey: undefined,
        statusCode: 200,
      };
    }

    const LastEvaluatedKey = joinRequestResponse.LastEvaluatedKey as
      | JoinRequestKeys
      | undefined;
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
      LastEvaluatedKey,
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
      TableName: tableName,
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
      TableName: tableName,
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

  async updateRoomUserStatus(
    RoomID: string,
    memberID: string,
    newRoomUserStatus: "MEMBER" | "ADMIN" | "OWNER"
  ): BaseModelsReturnType {
    const updateMemberCommand = new UpdateCommand({
      TableName: tableName,
      Key: {
        PartitionKey: `ROOM#${RoomID}`,
        SortKey: `MEMBERS#USERID#${memberID}`,
      },
      UpdateExpression: "SET RoomUserStatus = :newStatus",
      ExpressionAttributeValues: { ":newStatus": newRoomUserStatus },
      ReturnValues: "ALL_NEW",
    });

    let updateMemberResponse: UpdateCommandOutput;
    try {
      updateMemberResponse = await docClient.send(updateMemberCommand);
    } catch (error) {
      return { error: "Failed to update Member", statusCode: 500 };
    }

    const statusCode = updateMemberResponse.$metadata.httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Failed to update Member", statusCode };
    } else if (updateMemberResponse.Attributes == undefined) {
      return { error: "Bad Request", statusCode: 400 };
    }

    return { message: "RoomUserStatus on Member Updated", statusCode: 200 };
  }
}

const roomManager = new RoomManager();

export { roomManager };
