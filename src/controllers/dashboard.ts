import { Request, Response } from "express";
import { fetchUserInfo } from "../models/users.js";
import { JoinRequets } from "../types/types.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      anyJoinRequest?: boolean;
      first5JoinRequest?: JoinRequets;
      username?: string;
      profileColor?: string;
    };
  }
}

export default async function dashboard(req: Request, res: Response) {
  console.log("Rendering Dashboard");

  const userInfoResponse = await fetchUserInfo(req);

  if ("error" in userInfoResponse) {
    res
      .status(userInfoResponse.statusCode)
      .json({ error: userInfoResponse.error });
    return;
  }

  const { ownedRooms, joinedRooms, username, profileColor } =
    userInfoResponse.userInfo;
  const anyJoinRequest = req.user?.anyJoinRequest;
  const first5JoinRequest = req.user?.first5JoinRequest;

  res.render("dashboard", {
    ownedRooms,
    joinedRooms,
    username,
    profileColor,
    anyJoinRequest,
    first5JoinRequest,
  });
  return;
}
