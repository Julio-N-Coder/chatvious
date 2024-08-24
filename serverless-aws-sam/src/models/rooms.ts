import { DynamoDBClient, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  QueryCommand,
  GetCommandOutput,
  PutCommandOutput,
  UpdateCommandOutput,
  DeleteCommandOutput,
  BatchWriteCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { BaseModels } from "./baseModels.js";
import { roomsOnUserManager } from "./users.js";
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

class RoomManager extends BaseModels {
  async makeRoom(
    ownerID: string,
    ownerName: string,
    roomName: string,
    profileColor: string
  ): FetchRoomReturn {
    const RoomID = crypto.randomUUID() as string;
    const madeDate = new Date().toISOString();

    const makeRoomResponse = await this.makeRoomItem(
      roomName,
      RoomID,
      madeDate
    );
    if ("error" in makeRoomResponse) {
      return makeRoomResponse;
    }

    const roomMemberResponse = await roomUsersManager.addRoomMember(
      RoomID,
      ownerID,
      roomName,
      ownerName,
      profileColor,
      madeDate,
      "OWNER"
    );
    if ("error" in roomMemberResponse) {
      return {
        error: "Failed to make room member",
        statusCode: roomMemberResponse.statusCode,
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

  async makeRoomItem(
    roomName: string,
    RoomID?: string,
    madeDate?: string
  ): BaseModelsReturnType {
    RoomID = RoomID ? RoomID : (crypto.randomUUID() as string);
    madeDate = madeDate ? madeDate : (new Date().toISOString() as string);

    const roomData: RoomInfoDBType = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: "METADATA",
      RoomID,
      roomName,
      createdAt: madeDate,
      roomMemberCount: 1,
    };

    let makeRoomResponse: PutCommandOutput;
    try {
      makeRoomResponse = await this.putItem(roomData);
    } catch (error) {
      return {
        error: "Failed to make room",
        statusCode: 500,
      };
    }
    const makeRoomStatusCode = makeRoomResponse.$metadata
      .httpStatusCode as number;

    if (makeRoomStatusCode !== 200) {
      return {
        error: "Failed to make room",
        statusCode: makeRoomStatusCode,
      };
    }

    return { message: "Room Created", statusCode: 201 };
  }

  async deleteRoom(RoomID: string): BaseModelsReturnType {
    // delete all join request the room has
    const fetchJoinRequestsResponse =
      await joinRequestManager.fetchJoinRequests(RoomID, false, true);
    if (
      "error" in fetchJoinRequestsResponse ||
      "joinRequests" in fetchJoinRequestsResponse
    ) {
      if ("error" in fetchJoinRequestsResponse) {
        return fetchJoinRequestsResponse;
      }
      return {
        error: "Failed, fetched Join Request items",
        statusCode: 500,
      };
    }
    const joinRequestsKeys = fetchJoinRequestsResponse.joinRequestsKeys;
    if (joinRequestsKeys.length > 0) {
      // use a batch command
      let deleteAllJoinRequestResponse: BatchWriteCommandOutput;
      try {
        deleteAllJoinRequestResponse = await this.batchWrite(joinRequestsKeys);
      } catch (error) {
        return {
          error: "Failed to delete join requests",
          statusCode: 500,
        };
      }
      const deleteAllJoinRequestStatusCode = deleteAllJoinRequestResponse
        .$metadata.httpStatusCode as number;

      if (deleteAllJoinRequestStatusCode !== 200) {
        return {
          error: "Failed to delete join requests",
          statusCode: deleteAllJoinRequestStatusCode,
        };
      }
    }

    const membersResponse = await roomUsersManager.fetchRoomMembers(
      RoomID,
      true,
      false,
      false
    );
    if ("error" in membersResponse || "roomMembersKeys" in membersResponse) {
      if ("error" in membersResponse) {
        return membersResponse;
      }
      return {
        error: "Failed to fetch Just Member Keys.",
        statusCode: 500,
      };
    }

    if (membersResponse.memberCount > 0) {
      const members = membersResponse.roomMembers;
      for (const member of members) {
        const memberID = member.userID;
        const removeRoomOnUserResponse =
          await roomsOnUserManager.removeRoomOnUser(memberID, RoomID);
        if ("error" in removeRoomOnUserResponse) {
          return {
            error: removeRoomOnUserResponse.error,
            statusCode: removeRoomOnUserResponse.statusCode,
          };
        }

        // delete room member data as well
        const removeRoomMemberResponse =
          await roomUsersManager.removeRoomMember(RoomID, memberID);
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

    // delete the room itself
    const deleteRoomResponse = await this.deleteRoomItem(RoomID);
    if ("error" in deleteRoomResponse) {
      return deleteRoomResponse;
    }

    return { message: "Room Deleted", statusCode: 200 };
  }

  async deleteRoomItem(RoomID: string): BaseModelsReturnType {
    const roomKeys = { PartitionKey: `ROOM#${RoomID}`, SortKey: "METADATA" };
    const returnValues = true;

    let deleteRoomResponse: DeleteCommandOutput;
    try {
      deleteRoomResponse = await this.deleteItem(roomKeys, returnValues);
    } catch (error) {
      return { error: "Failed to Delete Room", statusCode: 500 };
    }
    const statusCode = deleteRoomResponse.$metadata.httpStatusCode as number;

    if (statusCode !== 200) {
      return { error: "Failed to Delete Room", statusCode };
    } else if (deleteRoomResponse.Attributes == undefined) {
      return { error: "Bad Request", statusCode: 400 };
    }

    return { message: "Room Deleted", statusCode: 200 };
  }

  async fetchRoom(RoomID: string): FetchRoomReturn {
    const roomKeys = { PartitionKey: `ROOM#${RoomID}`, SortKey: "METADATA" };

    let roomInfoResponse: GetCommandOutput;
    try {
      roomInfoResponse = await this.getItem(roomKeys);
    } catch (error) {
      return { error: "Failed to Get Room Info", statusCode: 500 };
    }

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
}

class RoomUsersManager extends BaseModels {
  constructor(tableName: string, pk: string, sk: string) {
    super(tableName, pk, sk);
  }

  async fetchRoomMembers(
    RoomID: string,
    ConsistentRead?: boolean,
    ExclusiveStartKey?: MessageKeys | false,
    returnJustKeys?: boolean
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
      ProjectionExpression: returnJustKeys
        ? `${this.pk}, ${this.sk}`
        : "userID, userName, RoomID, RoomUserStatus, profileColor, GSISortKey",
    });
    if (ExclusiveStartKey) {
      roomMembersCommand.input.ExclusiveStartKey = ExclusiveStartKey;
    }

    const roomMembersResponse = await docClient.send(roomMembersCommand);
    const memberCount = roomMembersResponse.Count as number;
    if (roomMembersResponse.$metadata.httpStatusCode !== 200) {
      return { error: "Failed to Get Room Members", statusCode: 500 };
    }

    const LastEvaluatedKey = roomMembersResponse.LastEvaluatedKey as
      | RoomMemberKeys
      | undefined;

    if (returnJustKeys) {
      const roomMembersKeys = roomMembersResponse.Items as RoomMemberKeys[];
      return {
        message: "Fetched Room Member Keys",
        roomMembersKeys,
        memberCount,
        LastEvaluatedKey,
        statusCode: 200,
      };
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
    const roomKeys = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `MEMBERS#USERID#${userID}`,
    };

    let roomMemberResponse: GetCommandOutput;
    try {
      roomMemberResponse = await this.getItem(roomKeys);
    } catch (error) {
      return { error: "Failed to Get Room Member", statusCode: 500 };
    }

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
    roomName: string,
    memberName: string,
    profileColor: string,
    madeDate?: string,
    RoomUserStatus?: "MEMBER" | "ADMIN" | "OWNER"
  ): BaseModelsReturnType {
    madeDate = madeDate ? madeDate : (new Date().toISOString() as string);
    RoomUserStatus = RoomUserStatus ? RoomUserStatus : "MEMBER";
    const roomType = RoomUserStatus === "OWNER" ? "ownedRooms" : "joinedRooms";

    const addRoomMemberItemResponse = await this.addRoomMemberItem(
      RoomID,
      memberID,
      memberName,
      profileColor,
      madeDate,
      RoomUserStatus
    );
    if ("error" in addRoomMemberItemResponse) {
      return addRoomMemberItemResponse;
    }

    // update rooms on user
    const updateUserRoomCommand = new UpdateCommand({
      TableName: tableName,
      Key: { PartitionKey: `USER#${memberID}`, SortKey: "PROFILE" },
      UpdateExpression: `SET ${roomType} = list_append(${roomType}, :newRoom)`,
      ExpressionAttributeValues: {
        ":newRoom": [
          {
            roomName: roomName,
            RoomID: RoomID,
          },
        ],
      },
    });

    let updateUsersResponse: UpdateCommandOutput;
    try {
      updateUsersResponse = await docClient.send(updateUserRoomCommand);
    } catch (error) {
      return {
        error: "Failed to update user",
        statusCode: 500,
      };
    }

    const updateStatusCode = updateUsersResponse.$metadata
      .httpStatusCode as number;
    if (updateStatusCode !== 200) {
      return {
        error: "Failed to update user",
        statusCode: updateStatusCode,
      };
    }

    if (RoomUserStatus !== "OWNER") {
      const addMemberCountResponse = await this.addSubMemberCount(RoomID, 1);
      if ("error" in addMemberCountResponse) {
        return addMemberCountResponse;
      }
    }

    return { message: "Member Added", statusCode: 201 };
  }

  async addRoomMemberItem(
    RoomID: string,
    memberID: string,
    memberName: string,
    profileColor: string,
    madeDate?: string,
    RoomUserStatus?: "MEMBER" | "ADMIN" | "OWNER"
  ): BaseModelsReturnType {
    madeDate = madeDate ? madeDate : (new Date().toISOString() as string);
    RoomUserStatus = RoomUserStatus ? RoomUserStatus : "MEMBER";

    const roomMemberItem: RoomMemberDB = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `MEMBERS#USERID#${memberID}`,
      userID: memberID,
      userName: memberName,
      RoomID,
      RoomUserStatus,
      GSISortKey: `MEMBERS#DATE#${madeDate}`,
      profileColor,
    };

    let makeRoomResponse: PutCommandOutput;
    try {
      makeRoomResponse = await this.putItem(roomMemberItem);
    } catch (error) {
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

    return { message: "Member Added", statusCode: 201 };
  }

  async removeRoomMember(
    RoomID: string,
    memberID: string
  ): BaseModelsReturnType {
    const removeMemberResponse = await this.removeRoomMemberItem(
      RoomID,
      memberID
    );
    if ("error" in removeMemberResponse) {
      return removeMemberResponse;
    }

    const subMemberCountResponse = await this.addSubMemberCount(RoomID, -1);
    if ("error" in subMemberCountResponse) {
      return subMemberCountResponse;
    }

    return { message: "Member Removed", statusCode: 200 };
  }

  async removeRoomMemberItem(
    RoomID: string,
    memberID: string
  ): BaseModelsReturnType {
    const roomKeys = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `MEMBERS#USERID#${memberID}`,
    };
    const returnValues = true;

    let removeMemberResponse: DeleteCommandOutput;
    try {
      removeMemberResponse = await this.deleteItem(roomKeys, returnValues);
    } catch (error) {
      return { error: "Failed to remove Member", statusCode: 500 };
    }
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

class JoinRequestManager extends BaseModels {
  constructor(tableName: string, pk: string, sk: string) {
    super(tableName, pk, sk);
  }

  async fetchJoinRequest(
    RoomID: string,
    userID: string
  ): FetchJoinRequestReturn {
    const roomJoinRequestKeys = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `JOIN_REQUESTS#USERID#${userID}`,
    };
    const ConsistentRead = true;

    let joinRequestResponse: GetCommandOutput;
    try {
      joinRequestResponse = await this.getItem(
        roomJoinRequestKeys,
        ConsistentRead
      );
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
    ExclusiveStartKey?: MessageKeys | false,
    returnJustKeys?: boolean
  ): FetchJoinRequestsReturn {
    const joinRequestsCommand = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression:
        "PartitionKey = :roomsID AND begins_with(SortKey, :sortDate)",
      ExpressionAttributeValues: {
        ":roomsID": `ROOM#${RoomID}`,
        ":sortDate": "JOIN_REQUESTS#",
      },
      ProjectionExpression: returnJustKeys
        ? `${this.pk}, ${this.sk}`
        : "RoomID, fromUserID, fromUserName, roomName, GSISortKey, profileColor",
    });
    if (ExclusiveStartKey) {
      joinRequestsCommand.input.ExclusiveStartKey = ExclusiveStartKey;
    }

    let joinRequestResponse: QueryCommandOutput;
    try {
      joinRequestResponse = await docClient.send(joinRequestsCommand);
    } catch (error) {
      return { error: "Failed to Get Join Requests", statusCode: 500 };
    }

    if (joinRequestResponse.$metadata.httpStatusCode !== 200) {
      return { error: "Failed to Get Join Requests", statusCode: 500 };
    } else if (joinRequestResponse.Count === 0) {
      if (returnJustKeys) {
        return {
          message: "No Join Requests",
          joinRequestsKeys: [],
          LastEvaluatedKey: undefined,
          statusCode: 200,
        };
      }
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

    if (returnJustKeys) {
      const joinRequestsKeys =
        joinRequestResponse.Items as unknown as JoinRequestKeys[];
      return {
        message: `${joinRequestsKeys.length} Join Requests Fetched`,
        joinRequestsKeys,
        statusCode: 200,
        LastEvaluatedKey,
      };
    }

    const joinRequestsDB =
      joinRequestResponse.Items as unknown as JoinRequestDB[];
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

    const joinRequestItem = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `JOIN_REQUESTS#USERID#${fromUserID}`,
      RoomID,
      fromUserID,
      fromUserName,
      roomName,
      GSISortKey: `JOIN_REQUESTS#DATE#${sentJoinRequestAt}`,
      profileColor,
    };

    let joinRequestResponse: PutCommandOutput;
    try {
      joinRequestResponse = await this.putItem(joinRequestItem);
    } catch (error) {
      return { error: "Failed to send Join Request", statusCode: 500 };
    }
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
    const joinRequestKeys = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `JOIN_REQUESTS#USERID#${requestUserID}`,
    };
    const returnValues = true;

    const joinRequestResponse = await this.deleteItem(
      joinRequestKeys,
      returnValues
    );
    const statusCode = joinRequestResponse.$metadata.httpStatusCode as number;

    if (statusCode !== 200) {
      return { error: "Failed to remove Join Request", statusCode };
    }
    if (joinRequestResponse.Attributes == undefined) {
      return { error: "Bad Request", statusCode: 400 };
    }

    return {
      message: "Successfully removed Join Request",
      statusCode: 200,
    };
  }
}

const roomManager = new RoomManager(tableName, "PartitionKey", "SortKey");
const roomUsersManager = new RoomUsersManager(
  tableName,
  "PartitionKey",
  "SortKey"
);
const joinRequestManager = new JoinRequestManager(
  tableName,
  "PartitionKey",
  "SortKey"
);

export { roomManager, roomUsersManager, joinRequestManager };
