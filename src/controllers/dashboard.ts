import { Request, Response } from "express";
import { fetchRoomsOnUser } from "../models/rooms.js";

export default async function dashboard(req: Request, res: Response) {
  console.log("Rendering Dashboard");

  const rooms = await fetchRoomsOnUser(req);

  if (rooms.error) {
    res.status(rooms.statusCode).json({ error: "Internal Server Error" });
    return;
  }

  const { ownedRooms, joinedRooms } = rooms;
  res.render("dashboard", { ownedRooms, joinedRooms });
  return;
}
