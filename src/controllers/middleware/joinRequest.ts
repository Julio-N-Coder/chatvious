import { Request, Response, NextFunction } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
// import { fetchFirst5JoinRequests } from "../../models/users.js";
import { RoomsOnUser } from "../../types/types.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      anyJoinRequest?: boolean;
      // first5JoinRequest?: JoinRequets;
      username?: string;
      ownedRooms?: RoomsOnUser;
      joinedRooms?: RoomsOnUser;
      profileColor?: string;
    };
  }
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// not implemented yet
async function get5JoinRequest(
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

  // const joinRequests = await fetchFirst5JoinRequests(userID);

  // if (joinRequestsResponse.Count === 0) {
  //   req.user.anyJoinRequest = false;
  //   next();
  //   return;
  // }

  // const first5JoinRequest = joinRequestsResponse.Items as JoinRequets;

  // req.user.anyJoinRequest = true;
  // req.user.first5JoinRequest = first5JoinRequest;
  next();
}

// export default get5JoinRequest;
