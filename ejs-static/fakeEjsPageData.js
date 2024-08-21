const ownedRoomInfo = {
  roomName: "fakeRoomName",
  // roomName: "HHHHHHHHHHHHHHHHHHHH",
  RoomID: "fakeRoomID1",
  createdAt: "2024-08-02T21:34:22.328Z",
};

const joinedRoomInfo = {
  roomName: "fakeJoinRoomName",
  // roomName: "HHHHHHHHHHHHHHHHHHHH",
  RoomID: "fakeRoomID2",
  createdAt: "2024-08-02T21:34:22.328Z",
};

const joinedRoomAdminInfo = {
  roomName: "fakeJoinRoomAdmin",
  RoomID: "fakeRoomID3",
  createdAt: "2024-08-02T21:34:22.328Z",
};

const randomRoomIfo = {
  roomName: "fakeRandomRoomName",
  RoomID: "fakeRandomRoomID",
  createdAt: "2024-08-02T21:34:22.328Z",
};

const staticContentUrl = "http://localhost:8040";
const domainUrl = "http://localhost:3000";

const fakeUserInfo = {
  userID: "fd24d28c-ef01-45dc-a1ee-2bf8f3e92540",
  userName: "TestUserRender",
  // userName: "HHHHHHHHHHHHHHHHHHHH",
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
    {
      roomName: joinedRoomAdminInfo.roomName,
      RoomID: joinedRoomAdminInfo.RoomID,
      isAdmin: true,
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
  staticContentUrl,
  domainUrl,
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
  isAdmin: false,
  isOwner: false,
  hasSentJoinRequest: false,
  navJoinRequest: [],
  profileColor: fakeUserInfo.profileColor,
  username: fakeUserInfo.userName,
  isProduction: false,
  staticContentUrl,
  domainUrl,
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
      userID: "FakeMemberID",
      userName: "FakeMemberID",
      RoomID: joinedRoomInfo.RoomID,
      RoomUserStatus: "MEMBER",
      profileColor: "yellow",
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
  isAdmin: false,
  isOwner: false,
  hasSentJoinRequest: false,
  navJoinRequest: [],
  profileColor: fakeUserInfo.profileColor,
  username: fakeUserInfo.userName,
  isProduction: false,
  staticContentUrl,
  domainUrl,
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
      // userName: "HHHHHHHHHHHHHHHHHHHH",
      RoomID: joinedRoomInfo.RoomID,
      RoomUserStatus: "MEMBER",
      profileColor: "orange",
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
    {
      userID: "FakeAdminID",
      userName: "FakeRoomAdmin",
      RoomID: joinedRoomInfo.RoomID,
      RoomUserStatus: "ADMIN",
      profileColor: "yellow",
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
  isAdmin: false,
  isOwner: true,
  joinRequests: [
    {
      RoomID: ownedRoomInfo.RoomID,
      fromUserID: "FakeJoinUserID",
      fromUserName: "FakeJoinUserName",
      // fromUserName: "HHHHHHHHHHHHHHHHHHHH",
      roomName: ownedRoomInfo.roomName,
      profileColor: "purple",
      sentJoinRequestAt: "2024-08-02T21:34:22.328Z",
    },
  ],
  navJoinRequest: [],
  profileColor: fakeUserInfo.profileColor,
  username: fakeUserInfo.userName,
  isProduction: false,
  staticContentUrl,
  domainUrl,
};

const fakeJoinRoomInfoPageAdmin = {
  roomInfo: joinedRoomAdminInfo,
  roomOwner: {
    userID: "FakeOwnerID",
    userName: "FakeRoomOwner",
    RoomID: joinedRoomAdminInfo.RoomID,
    RoomUserStatus: "OWNER",
    profileColor: "purple",
    joinedAt: "2024-08-02T21:34:22.328Z",
  },
  roomMembers: [
    {
      userID: "FakeMemberID",
      userName: "FakeRoomMember",
      RoomID: joinedRoomAdminInfo.RoomID,
      RoomUserStatus: "MEMBER",
      profileColor: "orange",
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
    {
      userID: "FakeOwnerID",
      userName: "FakeRoomOwner",
      RoomID: joinedRoomAdminInfo.RoomID,
      RoomUserStatus: "OWNER",
      profileColor: "yellow",
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
    {
      userID: fakeUserInfo.userID,
      userName: fakeUserInfo.userName,
      RoomID: joinedRoomAdminInfo.RoomID,
      RoomUserStatus: "ADMIN",
      profileColor: fakeUserInfo.profileColor,
      joinedAt: "2024-08-02T21:34:22.328Z",
    },
  ],
  isOwnerOrAdmin: true,
  isMember: false,
  isAdmin: true,
  isOwner: false,
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
  staticContentUrl,
  domainUrl,
};

const roomMessages = [
  {
    message: "the First/latest fake message",
    messageId: "FakeMessageID1",
    userID: fakeUserInfo.userID,
    userName: fakeUserInfo.userName,
    RoomUserStatus: "ADMIN",
    profileColor: fakeUserInfo.profileColor,
    RoomID: ownedRoomInfo.RoomID,
    sentAt: "2024-08-02T21:34:22.328Z",
  },
  {
    message: "Some fake message",
    messageId: "FakeMessageID2",
    userID: "fakeUserID2",
    userName: "FakeUsername2",
    RoomUserStatus: "MEMBER",
    profileColor: "pink",
    RoomID: ownedRoomInfo.RoomID,
    sentAt: "2024-08-02T21:34:22.329Z",
  },
  {
    message:
      "Oldest message. This message is going to be a big longer to see how it looks like. This message is going to be a big longer to see how it looks like. This message is going to be a big longer to see how it looks like.",
    messageId: "FakeMessageID3",
    userID: "fakeUserID3",
    userName: "UsernameFake3",
    RoomUserStatus: "MEMBER",
    profileColor: "orange",
    RoomID: ownedRoomInfo.RoomID,
    sentAt: "2024-08-02T21:34:22.330Z",
  },
];

const fakeChatRoomOwnerData = {
  roomMessages,
  LastEvaluatedKey: "false",
  username: fakeUserInfo.userName,
  profileColor: fakeUserInfo.profileColor,
  navJoinRequest: [],
  isProduction: false,
  staticContentUrl,
  domainUrl,
};

const fakeChatRoomMemberData = {
  roomMessages,
  LastEvaluatedKey: "false",
  username: fakeUserInfo.userName,
  profileColor: fakeUserInfo.profileColor,
  navJoinRequest: [],
  isProduction: false,
  staticContentUrl,
  domainUrl,
};

const fakeProfilePageData = {
  username: fakeUserInfo.userName,
  email: fakeUserInfo.email,
  profileColor: fakeUserInfo.profileColor,
  navJoinRequest: [],
  isProduction: false,
  staticContentUrl,
  domainUrl,
};

export {
  fakeUserInfo,
  fakeDashboardData,
  ownedRoomInfo,
  joinedRoomInfo,
  joinedRoomAdminInfo,
  fakeJoinRoomInfoPage,
  fakeJoinRoomInfoPageMember,
  fakeJoinRoomInfoPageAdmin,
  fakeJoinRoomInfoPageOwner,
  fakeChatRoomOwnerData,
  fakeChatRoomMemberData,
  roomMessages,
  fakeProfilePageData,
};
