type AuthCodeTokenResponse = {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

type TokenRefresh = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
};

type BaseModelsError = {
  error: string;
  statusCode: number;
};

type BaseModelsSuccess = {
  message: string;
  statusCode: number;
};

type BaseModelsReturnType = Promise<BaseModelsError | BaseModelsSuccess>;

type RoomsOnUser =
  | { roomName: string; RoomID: string }[]
  | {
      roomName: string;
      RoomID: string;
      isAdmin: boolean;
    }[]
  | [];

type UserInfo = {
  userID: string;
  userName: string;
  email: string;
  ownedRooms: RoomsOnUser;
  joinedRooms: RoomsOnUser;
  profileColor: string;
};

type UserInfoDBResponse = UserInfo & {
  PartitionKey: `USER#${string}`;
  SortKey: "PROFILE";
};

type FetchUserInfoSuccess = {
  userInfo: UserInfo;
  statusCode: number;
};

type FetchUserInfoReturn = Promise<BaseModelsError | FetchUserInfoSuccess>;

interface BaseRoomMember {
  userID: string;
  userName: string;
  RoomID: string;
  RoomUserStatus: "MEMBER" | "ADMIN" | "OWNER";
  profileColor: string;
}

interface RoomMember extends BaseRoomMember {
  joinedAt: string; // ISODate
}

interface RoomMemberDB extends BaseRoomMember {
  PartitionKey: `ROOM#${string}`; // RoomID // gsi partition key
  SortKey: `MEMBERS#USERID#${string}`;
  GSISortKey: `DATE#${string}`; // ISODate // gsi sort
}

type FetchRoomMemberSuccess = {
  roomMember: RoomMember;
  statusCode: number;
};

type FetchRoomMemberReturn = Promise<BaseModelsError | FetchRoomMemberSuccess>;

type FetchRoomMembersSuccess = {
  roomMembers: RoomMember[];
  message: string;
  memberCount: number;
  statusCode: number;
};

type FetchRoomMembersReturn = Promise<
  BaseModelsError | FetchRoomMembersSuccess
>;

type RoomInfoType = {
  RoomID: string;
  roomName: string;
  createdAt: string;
};

type RoomInfoDBType = RoomInfoType & {
  PartitionKey: `ROOM#${string}`; // Room ID
  SortKey: `METADATA`;
};

type FetchRoomSuccessReturn = {
  roomInfo: RoomInfoType;
  statusCode: number;
};

type FetchRoomReturn = Promise<BaseModelsError | FetchRoomSuccessReturn>;

interface BaseJoinRequest {
  RoomID: string;
  fromUserID: string;
  fromUserName: string;
  roomName: string;
  profileColor: string;
}

interface JoinRequest extends BaseJoinRequest {
  sentJoinRequestAt: string;
}

interface JoinRequestDB extends BaseJoinRequest {
  PartitionKey: `ROOM#${string}`; // RoomID
  SortKey: `JOIN_REQUESTS#USERID#${string}`;
  GSISortKey: `DATE#${string}`;
}
[];

type FetchJoinRequestsSuccess = {
  message: string;
  joinRequests: JoinRequest[] | [];
  statusCode: number;
};

type FetchJoinRequestsReturn = Promise<
  BaseModelsError | FetchJoinRequestsSuccess
>;

type FetchNavJoinRequestsSuccess = {
  message: string;
  navJoinRequest: { RoomID: string; roomName: string }[] | [];
  statusCode: number;
};

type FetchNavJoinRequestsReturn = Promise<
  BaseModelsError | FetchNavJoinRequestsSuccess
>;

export {
  AuthCodeTokenResponse,
  TokenRefresh,
  BaseModelsReturnType,
  RoomsOnUser,
  RoomInfoDBType,
  RoomInfoType,
  RoomMemberDB,
  RoomMember,
  FetchRoomMemberReturn,
  FetchRoomMembersReturn,
  UserInfoDBResponse,
  UserInfo,
  FetchUserInfoReturn,
  FetchRoomReturn,
  JoinRequest,
  JoinRequestDB,
  FetchJoinRequestsReturn,
  FetchNavJoinRequestsReturn,
};
