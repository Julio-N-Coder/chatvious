import { APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
// import navUserInfo from "../../lib/navUserInfo.js";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Rendering Dashboard");

  return {
    isBase64Encoded: false,
    headers: { "Content-Type": "text/html" },
    statusCode: 200,
    body: "<h1>test<h1>",
  };
};
