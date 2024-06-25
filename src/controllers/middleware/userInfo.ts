import { Request, Response, NextFunction } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { UserInfo, JoinRequets } from "../../types/types.js";

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

  const userInfoCommand = new GetCommand({
    TableName: "chatvious-users",
    Key: {
      "id-sub": userID,
    },
    ProjectionExpression: "username, profileColor",
    ConsistentRead: true,
  });

  const userInfoResponse = await docClient.send(userInfoCommand);
  const statusCode = userInfoResponse.$metadata.httpStatusCode as number;

  if (statusCode !== 200) {
    res.status(500).send({
      message:
        "We're sorry for the inconviencence, there seems to be a problem with our servers",
    });
    return;
  }
  const userInfo = userInfoResponse.Item as UserInfo;

  (req.user.username = userInfo.username),
    (req.user.profileColor = userInfo.profileColor),
    next();
}
