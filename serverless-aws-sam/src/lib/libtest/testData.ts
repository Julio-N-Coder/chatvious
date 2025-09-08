import restAPIEvent from "../../../events/restAPIEvent.json";
import {
  UserInfoDBResponse,
  RoomInfoDBType,
  RoomMemberDB,
  JoinRequestDB,
  InitialConnectionDB,
  RoomConnectionDB,
  MessageDB,
} from "../../types/types.js";

const userID = restAPIEvent.requestContext.authorizer.sub;
const userName = restAPIEvent.requestContext.authorizer.username;

const RoomID = "a7574571-6cd1-4fbb-ba4f-43c39573729a";
const roomName = "createRoomTestRoom";

const $metadata = {
  httpStatusCode: 200,
  requestId: "c7574571-6cd1-4fbb-ba4f-43c39573729a",
  attempts: 1,
  totalRetryDelay: 0,
};

let userInfoDB: UserInfoDBResponse = {
  PartitionKey: `USER#${userID}`,
  SortKey: "PROFILE",
  userID,
  userName,
  hashedPassword: "password",
  ownedRooms: [{ RoomID, roomName }],
  joinedRooms: [],
  profileColor: "green",
};

let roomInfoDB: RoomInfoDBType = {
  PartitionKey: `ROOM#${RoomID}`,
  SortKey: "METADATA",
  RoomID,
  roomName,
  createdAt: "fakeDate",
  roomMemberCount: 1,
  messageCount: 0,
};

let roomMemberDB: RoomMemberDB = {
  PartitionKey: `ROOM#${RoomID}`,
  SortKey: `MEMBERS#USERID#${RoomID}`,
  userID,
  userName: userInfoDB.userName,
  RoomID,
  RoomUserStatus: "OWNER",
  joinedAt: "fakeDate",
  profileColor: userInfoDB.profileColor,
};

let joinRequestDB: JoinRequestDB = {
  PartitionKey: `ROOM#${RoomID}`,
  SortKey: `JOIN_REQUESTS#USERID#${userID}`,
  RoomID,
  fromUserID: "secondUserID",
  fromUserName: "secondUserName",
  roomName,
  sentJoinRequestAt: "fakeDate",
  profileColor: "yellow",
  expires: 6832415,
};

let initialConnectionDB: InitialConnectionDB = {
  PartitionKey: "CONNECTION_INFO",
  SortKey: "connectionId",
  userID,
  RoomID,
  expires: 2832415,
};

let roomConnectionDB: RoomConnectionDB = {
  PartitionKey: `ROOM#${RoomID}`,
  SortKey: "CONNECTIONID#${connectionId}",
  RoomID,
  connectionId: initialConnectionDB.SortKey,
  userID,
  userName,
  RoomUserStatus: roomMemberDB.RoomUserStatus,
  profileColor: userInfoDB.profileColor,
  expires: 9832415,
};

let messageDB: MessageDB = {
  PartitionKey: `ROOM#${RoomID}`,
  SortKey: "MESSAGES#DATE#${ISODate}#MESSAGEID#${messageId}",
  message: "fakeMessage",
  messageId: "fakeId",
  userID,
  userName,
  RoomUserStatus: roomMemberDB.RoomUserStatus,
  profileColor: userInfoDB.profileColor,
  RoomID,
  sentAt: "fakeDate",
};

export {
  $metadata,
  userInfoDB,
  roomMemberDB,
  roomInfoDB,
  joinRequestDB,
  initialConnectionDB,
  roomConnectionDB,
  messageDB,
};
