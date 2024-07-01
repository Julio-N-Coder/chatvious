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

type RoomMember = {
  userID: string;
  userName: string;
  RoomID: string;
  RoomUserStatus: "MEMBER" | "ADMIN" | "OWNER";
  joinedAt: string; // gsi sort key
  profileColor: string;
};

type RoomMemberDB = RoomMember & {
  PartitionKey: `ROOM#${string}`; // RoomID // gsi partition key
  SortKey: `MEMBERS#USERID#${string}`;
};

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

type JoinRequests = {
  RoomID: string;
  fromUserID: string;
  fromUserName: string;
  roomName: string;
  sentJoinRequestAt: string;
  profileColor: string;
}[];

type JoinRequestsDB = JoinRequests &
  {
    PartitionKey: `ROOM#${string}`; // RoomID
    SortKey: `JOIN_REQUESTS#DATE#${string}#USERID#${string}`;
  }[];

type FetchJoinRequestsSuccess = {
  message: string;
  joinRequests: JoinRequests;
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
  JoinRequestsDB,
  FetchJoinRequestsReturn,
  FetchNavJoinRequestsReturn,
};
