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

type MakeRoomReturnError = {
  error: string;
  statusCode: number;
};

type MakeRoomReturnSuccess = {
  message: string;
  statusCode: number;
};

type MakeRoomReturnType = Promise<MakeRoomReturnError | MakeRoomReturnSuccess>;

type RoomsOnUser = { roomName: string; RoomID: string }[] | [];

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

type FetchUserInfoError = {
  error: string;
  statusCode: number;
};

type FetchUserInfoSuccess = {
  userInfo: UserInfo;
  statusCode: number;
};

type FetchUserInfoReturn = Promise<FetchUserInfoError | FetchUserInfoSuccess>;

type RoomMembers = {
  userName: string;
  userID: string;
  RoomID: string;
  isAdmin?: boolean;
  joinedAt: string;
  profileColor: string;
}[];

type RoomMembersDB = RoomMembers &
  {
    PartitionKey: `ROOM#${string}`;
    SortKey: `MEMBERS#${string}`;
  }[];

type FetchRoomMembersError = {
  error: string;
  statusCode: number;
};

type FetchRoomMembersSuccess = {
  roomMembers: RoomMembers;
  message: string;
  memberCount: number;
  statusCode: number;
};

type FetchRoomMembersReturn = Promise<
  FetchRoomMembersError | FetchRoomMembersSuccess
>;

type RoomOwner = {
  ownerID: string;
  ownerName: string;
  RoomID: string;
};

type RoomOwnerDB = RoomOwner & {
  PartitionKey: `ROOM#${string}`;
  SortKey: "OWNER";
};

type FetchRoomOwnerError = {
  error: string;
  statusCode: number;
};

type FetchRoomOwnerSuccess = {
  roomOwner: RoomOwner;
  statusCode: number;
};

type FetchRoomOwnerReturn = Promise<
  FetchRoomOwnerError | FetchRoomOwnerSuccess
>;

type RoomInfoType = {
  RoomID: string;
  roomName: string;
  createdAt: string;
};

type RoomInfoDBType = RoomInfoType & {
  PartitionKey: `ROOM#${string}`;
  SortKey: `METADATA`;
};

type FetchRoomErrorReturn = {
  error: string;
  statusCode: number;
};

type FetchRoomSuccessReturn = {
  roomInfo: RoomInfoType;
  statusCode: number;
};

type FetchRoomReturn = Promise<FetchRoomErrorReturn | FetchRoomSuccessReturn>;

type SendJoinRequestError = {
  error: string;
  statusCode: number;
};

type SendJoinRequestSuccess = {
  message: string;
  statusCode: number;
};

type SendJoinRequestReturn = Promise<
  SendJoinRequestSuccess | SendJoinRequestError
>;

type JoinRequests = {
  RoomID: string;
  fromUserID: string;
  fromUserName: string;
  roomName: string;
  sentJoinRequestAt: string;
}[];

type JoinRequestsDB = JoinRequests &
  {
    PartitionKey: `ROOM#${string}`;
    SortKey: `JOIN_REQUESTS#${string}#${string}`;
  }[];

type FetchJoinRequestsError = {
  error: string;
  statusCode: number;
};

type FetchJoinRequestsSuccess = {
  message: string;
  joinRequests: JoinRequests;
  statusCode: number;
};

type FetchJoinRequestsReturn = Promise<
  FetchJoinRequestsError | FetchJoinRequestsSuccess
>;

export {
  AuthCodeTokenResponse,
  TokenRefresh,
  RoomsOnUser,
  MakeRoomReturnType,
  RoomInfoDBType,
  RoomInfoType,
  RoomMembersDB,
  RoomMembers,
  FetchRoomMembersReturn,
  UserInfoDBResponse,
  UserInfo,
  FetchUserInfoReturn,
  FetchRoomReturn,
  RoomOwnerDB,
  FetchRoomOwnerReturn,
  SendJoinRequestReturn,
  JoinRequestsDB,
  FetchJoinRequestsReturn,
};
