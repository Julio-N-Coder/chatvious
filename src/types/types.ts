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

type UserInfoDBResponse = {
  PartitionKey: `USER#${string}`;
  SortKey: "PROFILE";
  userID: string;
  username: string;
  email: string;
  ownedRooms: RoomsOnUser;
  joinedRooms: RoomsOnUser;
  profileColor: string;
};

type UserInfo = {
  id: string;
  username: string;
  email: string;
  ownedRooms: RoomsOnUser;
  joinedRooms: RoomsOnUser;
  profileColor: string;
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

// not implemented yet
type RoomMemberAdmins = {
  RoomID: string;
  joinedAt: string;
  userID: string;
  userName: string;
  profileColor: string;
}[];

type RoomMembersDB = {
  PartitionKey: `ROOM#${string}`;
  SortKey: `MEMBERS#${string}`;
  userName: string;
  userID: string;
  joinedAt: string;
  profileColor: string;
}[];

type RoomMembers = {
  userName: string;
  userID: string;
  joinedAt: string;
  profileColor: string;
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

type RoomOwnerDB = {
  PartitionKey: `ROOM#${string}`;
  SortKey: "OWNER";
  ownerID: string;
  ownerName: string;
};

type FetchRoomOwnerError = {
  error: string;
  statusCode: number;
};

type FetchRoomOwnerSuccess = {
  roomOwner: { ownerID: string; ownerName: string };
  statusCode: number;
};

type FetchRoomOwnerReturn = Promise<
  FetchRoomOwnerError | FetchRoomOwnerSuccess
>;

type RoomInfoDBType = {
  PartitionKey: `ROOM#${string}`;
  SortKey: `METADATA`;
  RoomID: string;
  roomName: string;
  createdAt: string;
};

type RoomInfoType = {
  RoomID: string;
  roomName: string;
  createdAt: string;
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

type SendRoomRequestError = {
  error: string;
  statusCode: number;
};

type SendRoomRequestSuccess = {
  message: string;
  statusCode: number;
};

type SendRoomRequestReturn = Promise<
  SendRoomRequestSuccess | SendRoomRequestError
>;
type JoinRequest = {
  RoomID: string;
  createdAt: string;
  ownerID: string;
  fromUserName: string;
  fromUserID: string;
  roomName: string;
};

type JoinRequets = JoinRequest[];

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
  SendRoomRequestReturn,
  JoinRequets,
};
