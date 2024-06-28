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

type RoomsOnUser =
  | { roomName: string; RoomID: string }[]
  | {
      roomName: string;
      RoomID: string;
      isAdminOrOwner: boolean;
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

type FetchUserInfoError = {
  error: string;
  statusCode: number;
};

type FetchUserInfoSuccess = {
  userInfo: UserInfo;
  statusCode: number;
};

type FetchUserInfoReturn = Promise<FetchUserInfoError | FetchUserInfoSuccess>;

type RoomMember = {
  userID: string;
  userName: string;
  RoomID: string;
  RoomUserStatus: // gsi sort
  | `MEMBER#USERID#${string}`
    | `ADMIN#USERID#${string}`
    | `OWNER#USERID#${string}`;
  joinedAt: string;
  profileColor: string;
};

type RoomMemberDB = RoomMember & {
  PartitionKey: `ROOM#${string}`; // gsi pk
  SortKey: `MEMBERS#DATE#${string}#USERID#${string}`;
};

type FetchRoomMembersError = {
  error: string;
  statusCode: number;
};

type FetchRoomMembersSuccess = {
  roomMembers: RoomMember[];
  message: string;
  memberCount: number;
  statusCode: number;
};

type FetchRoomMembersReturn = Promise<
  FetchRoomMembersError | FetchRoomMembersSuccess
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
  profileColor: string;
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

type FetchNavJoinRequestsError = {
  error: string;
  statusCode: number;
};

type FetchNavJoinRequestsSuccess = {
  message: string;
  navJoinRequest: { RoomID: string; roomName: string }[] | [];
  statusCode: number;
};

type FetchNavJoinRequestsReturn = Promise<
  FetchNavJoinRequestsError | FetchNavJoinRequestsSuccess
>;

export {
  AuthCodeTokenResponse,
  TokenRefresh,
  RoomsOnUser,
  MakeRoomReturnType,
  RoomInfoDBType,
  RoomInfoType,
  RoomMemberDB,
  RoomMember,
  FetchRoomMembersReturn,
  UserInfoDBResponse,
  UserInfo,
  FetchUserInfoReturn,
  FetchRoomReturn,
  SendJoinRequestReturn,
  JoinRequestsDB,
  FetchJoinRequestsReturn,
  FetchNavJoinRequestsReturn,
};
