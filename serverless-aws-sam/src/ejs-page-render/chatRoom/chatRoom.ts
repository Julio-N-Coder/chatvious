import { APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import ejs from "ejs";
import fetchNavUserInfo from "../../lib/navUserInfo.js";

export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const chatRoomHTML = await ejs.renderFile("../../views/chatRoom.ejs");

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: chatRoomHTML,
  };
}
