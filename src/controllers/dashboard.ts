import { Request, Response } from "express";
import { RoomsOnUser } from "../types/types.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      navJoinRequests?: { RoomID: string; roomName: string }[] | [];
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
  const navJoinRequest = req.user?.navJoinRequests;

  res.render("dashboard", {
    ownedRooms,
    joinedRooms,
    username,
    profileColor,
    navJoinRequest,
  });
  return;
}
