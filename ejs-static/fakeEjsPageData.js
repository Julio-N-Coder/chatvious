const ownedRoomInfo = {
  roomName: "fakeRoomName",
  RoomID: "fakeRoomID1",
  createdAt: "2024-08-02T21:34:22.328Z",
};

const joinedRoomInfo = {
  roomName: "fakeJoinRoomName",
  RoomID: "fakeRoomID2",
  createdAt: "2024-08-02T21:34:22.328Z",
};

const randomRoomIfo = {
  roomName: "fakeRandomRoomName",
  RoomID: "fakeRandomRoomID",
  createdAt: "2024-08-02T21:34:22.328Z",
};

const fakeUserInfo = {
  userID: "fd24d28c-ef01-45dc-a1ee-2bf8f3e92540",
  userName: "TestUserRender",
  email: "TestUserRender@test.com",
  ownedRooms: [
    {
      roomName: ownedRoomInfo.roomName,
      RoomID: ownedRoomInfo.RoomID,
    },
  ],
  joinedRooms: [
    {
      roomName: joinedRoomInfo.roomName,
      RoomID: joinedRoomInfo.RoomID,
      isAdmin: false,
    },
  ],
  profileColor: "green",
};

const fakeDashboardData = {
  ownedRooms: fakeUserInfo.ownedRooms,
  joinedRooms: fakeUserInfo.joinedRooms,
  username: fakeUserInfo.userName,
  profileColor: fakeUserInfo.profileColor,
  navJoinRequest: [],
  isProduction: false,
};

const fakeJoinRoomInfoPage = {
  roomInfo: randomRoomIfo,
  roomOwner: {
    userID: "FakeOwnerID",
    userName: "FakeRoomOwner",
    RoomID: randomRoomIfo.RoomID,
    RoomUserStatus: "OWNER",
    profileColor: "yellow",
    joinedAt: "2024-08-02T21:34:22.328Z",
  },
  roomMembers: [
    {
      userID: "FakeOwnerID",
      userName: "FakeRoomOwner",
      RoomID: randomRoomIfo.RoomID,
      RoomUserStatus: "OWNER",
      profileColor: "yellow",
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
    {
      userID: "FakeMemberID",
      userName: "FakeMemberName",
      RoomID: randomRoomIfo.RoomID,
      RoomUserStatus: "MEMBER",
      profileColor: "green",
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
  ],
  isMember: false,
  isOwnerOrAdmin: false,
  isOwner: false,
  navJoinRequest: [],
  profileColor: fakeUserInfo.profileColor,
  username: fakeUserInfo.userName,
  isProduction: false,
};

const fakeJoinRoomInfoPageMember = {
  roomInfo: joinedRoomInfo,
  roomOwner: {
    userID: "FakeOwnerID",
    userName: "FakeRoomOwner",
    RoomID: joinedRoomInfo.RoomID,
    RoomUserStatus: "OWNER",
    profileColor: "orange",
    joinedAt: "2024-08-02T21:34:22.328Z",
  },
  roomMembers: [
    {
      userID: "FakeOwnerID",
      userName: "FakeRoomOwner",
      RoomID: joinedRoomInfo.RoomID,
      RoomUserStatus: "OWNER",
      profileColor: "orange",
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
    {
      userID: fakeUserInfo.userID,
      userName: fakeUserInfo.userName,
      RoomID: joinedRoomInfo.RoomID,
      RoomUserStatus: "MEMBER",
      profileColor: fakeUserInfo.profileColor,
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
  ],
  isMember: true,
  isOwnerOrAdmin: false,
  isOwner: false,
  navJoinRequest: [],
  profileColor: fakeUserInfo.profileColor,
  username: fakeUserInfo.userName,
  isProduction: false,
};

const fakeJoinRoomInfoPageOwner = {
  roomInfo: ownedRoomInfo,
  roomOwner: {
    userID: fakeUserInfo.userID,
    userName: fakeUserInfo.userName,
    RoomID: joinedRoomInfo.RoomID,
    RoomUserStatus: "OWNER",
    profileColor: fakeUserInfo.profileColor,
    joinedAt: "2024-08-02T21:34:22.328Z",
  },
  roomMembers: [
    {
      userID: "FakeMemberID",
      userName: "FakeRoomMember",
      RoomID: joinedRoomInfo.RoomID,
      RoomUserStatus: "MEMBER",
      profileColor: "orange",
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
    {
      userID: fakeUserInfo.userID,
      userName: fakeUserInfo.userName,
      RoomID: joinedRoomInfo.RoomID,
      RoomUserStatus: "OWNER",
      profileColor: fakeUserInfo.profileColor,
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
  ],
  isOwnerOrAdmin: true,
  isOwner: true,
  joinRequests: [
    {
      RoomID: ownedRoomInfo.RoomID,
      fromUserID: "FakeJoinUserID",
      fromUserName: "FakeJoinUserName",
      roomName: ownedRoomInfo.roomName,
      profileColor: "purple",
      sentJoinRequestAt: "2024-08-02T21:34:22.328Z",
    },
  ],
  navJoinRequest: [],
  profileColor: fakeUserInfo.profileColor,
  username: fakeUserInfo.userName,
  isProduction: false,
};

export {
  fakeDashboardData,
  ownedRoomInfo,
  joinedRoomInfo,
  fakeJoinRoomInfoPage,
  fakeJoinRoomInfoPageMember,
  fakeJoinRoomInfoPageOwner,
};
