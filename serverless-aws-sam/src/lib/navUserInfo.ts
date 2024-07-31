import { UserInfo } from "../types/types.js";
import { userManager } from "../models/users.js";
import { FetchNavUserInfoReturn } from "../types/types.js";

export default async function fetchNavUserInfo(
  userID: string
): FetchNavUserInfoReturn {
  const userInfoResponse = await userManager.fetchUserInfo(userID);

  if ("error" in userInfoResponse) {
    return {
      statusCode: userInfoResponse.statusCode,
      error:
        "We're sorry for the inconviencence, there seems to be a problem with our servers",
    };
  }

  const userInfo: UserInfo = userInfoResponse.userInfo;
  const fetchNavJoinRequestsResponse = await userManager.fetchNavJoinRequests(
    userInfo.ownedRooms,
    userInfo.joinedRooms
  );
  if ("error" in fetchNavJoinRequestsResponse) {
    return {
      statusCode: fetchNavJoinRequestsResponse.statusCode,
      error:
        "We're sorry for the inconviencence, there seems to be a problem with our servers",
    };
  }

  return {
    statusCode: 200,
    message: "Successfully Fetched navUserInfo",
    data: {
      userName: userInfo.userName,
      profileColor: userInfo.profileColor,
      ownedRooms: userInfo.ownedRooms,
      joinedRooms: userInfo.joinedRooms,
      navJoinRequests: fetchNavJoinRequestsResponse.navJoinRequest,
    },
  };
}
