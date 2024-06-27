import { Request, Response } from "express";
import { fetchUserInfo } from "../models/users.js";
import { JoinRequets, RoomsOnUser } from "../types/types.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      anyJoinRequest?: boolean;
      first5JoinRequest?: JoinRequets;
      username?: string;
      ownedRooms?: RoomsOnUser;
      joinedRooms?: RoomsOnUser;
      profileColor?: string;
    };
  }
}

export default async function dashboard(req: Request, res: Response) {
  console.log("Rendering Dashboard");

  const ownedRooms = req.user?.ownedRooms;
  const joinedRooms = req.user?.joinedRooms;
  const username = req.user?.username;
  const profileColor = req.user?.profileColor;
  // const anyJoinRequest = req.user?.anyJoinRequest;
  // const first5JoinRequest = req.user?.first5JoinRequest;

  res.render("dashboard", {
    ownedRooms,
    joinedRooms,
    username,
    profileColor,
    anyJoinRequest: false,
    first5JoinRequest: [],
  });
  return;
}
