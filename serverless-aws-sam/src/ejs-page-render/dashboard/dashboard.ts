import { APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import ejs from "ejs";
import fetchNavUserInfo from "../../lib/navUserInfo.js";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Rendering Dashboard");
  // const userID = event.requestContext.authorizer?.claims.sub as string;
  // UNCOMMENT above line and remove hardcoded value below.
  // it's commented out because I don't have auth function set up yet to get tokens from.

  // userID is a testUser
  const userID = "1959b93e-8061-706d-3b73-5f86ba878e9e";
  const navUserInfoResponse = await fetchNavUserInfo(userID);
  if ("error" in navUserInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: navUserInfoResponse.statusCode,
      body: JSON.stringify({ error: navUserInfoResponse.error }),
    };
  }

  const userInfo = navUserInfoResponse.data;
  const dashboardHTML = await ejs.renderFile("../../views/dashboard.ejs", {
    ownedRooms: userInfo.ownedRooms,
    joinedRooms: userInfo.joinedRooms,
    username: userInfo.userName,
    profileColor: userInfo.profileColor,
    navJoinRequest: userInfo.navJoinRequests,
    isProduction: isProduction() ? true : false,
  });

  return {
    isBase64Encoded: false,
    headers: { "Content-Type": "text/html" },
    statusCode: 200,
    body: dashboardHTML,
  };
};
