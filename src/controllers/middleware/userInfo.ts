import { Request, Response, NextFunction } from "express";
import { UserInfo, RoomsOnUser } from "../../types/types.js";
import { fetchUserInfo } from "../../models/users.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      anyJoinRequest?: boolean;
      // first5JoinRequest?: JoinRequests;
      username?: string;
      ownedRooms?: RoomsOnUser;
      joinedRooms?: RoomsOnUser;
      profileColor?: string;
    };
  }
}

export default async function navUserInfo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let userID = "";
  if (req.user) {
    userID = req.user.id;
  } else {
    res.status(401).send("Unauthorized");
    return;
  }

  const userInfoResponse = await fetchUserInfo(req);

  if ("error" in userInfoResponse) {
    res.status(500).send({
      message:
        "We're sorry for the inconviencence, there seems to be a problem with our servers",
    });
    return;
  }
  const userInfo: UserInfo = userInfoResponse.userInfo;

  (req.user.username = userInfo.userName),
    (req.user.profileColor = userInfo.profileColor),
    (req.user.ownedRooms = userInfo.ownedRooms),
    (req.user.joinedRooms = userInfo.joinedRooms);
  next();
}
