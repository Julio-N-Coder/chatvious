import { Request, Response } from "express";
import { fetchUserInfo } from "../models/rooms.js";

export default async function dashboard(req: Request, res: Response) {
  console.log("Rendering Dashboard");

  const userInfoResponse = await fetchUserInfo(req);

  if ("error" in userInfoResponse) {
    res
      .status(userInfoResponse.statusCode)
      .json({ error: userInfoResponse.error });
    return;
  }

  const { ownedRooms, joinedRooms, username } = userInfoResponse.userInfo;
  res.render("dashboard", { ownedRooms, joinedRooms, username });
  return;
}
