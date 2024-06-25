import { Request, Response, NextFunction } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { JoinRequets } from "../../types/types.js";

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

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export default async function get5JoinRequest(
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

  const joinRequestsCommand = new QueryCommand({
    TableName: "chatvious-joinRoomRequest",
    KeyConditionExpression: "ownerID = :userID",
    ExpressionAttributeValues: {
      ":userID": userID,
    },
    ConsistentRead: true,
  });

  const joinRequestsResponse = await docClient.send(joinRequestsCommand);
  const statusCode = joinRequestsResponse.$metadata.httpStatusCode as number;

  if (statusCode !== 200) {
    res.status(500).send({
      message:
        "We're sorry for the inconviencence, there seems to be a problem with our servers",
    });
    return;
  }
  if (joinRequestsResponse.Count === 0) {
    req.user.anyJoinRequest = false;
    next();
    return;
  }

  const joinRequests = joinRequestsResponse.Items as JoinRequets;
  const first5JoinRequest: JoinRequets = [];

  for (let i = 0; i < joinRequests.length; i++) {
    if (first5JoinRequest.length === 5) {
      break;
    }

    first5JoinRequest.push(joinRequests[i]);
  }

  req.user.anyJoinRequest = true;
  req.user.first5JoinRequest = first5JoinRequest;
  next();
}
