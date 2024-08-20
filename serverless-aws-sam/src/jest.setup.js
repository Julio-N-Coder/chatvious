let dynamodbType = process.argv[3] || "local"; // local or remote;
if (dynamodbType !== "local" && dynamodbType !== "remote") {
  dynamodbType = process.argv[4] || "local";
}
if (dynamodbType !== "local" && dynamodbType !== "remote") {
  throw new Error(
    "Invalid dynamodbType. argument Must be 'local' or 'remote'."
  );
}

if (dynamodbType === "local") {
  console.log("Using local DynamoDB");
  const dynamodbOptions = {
    endpoint: "http://localhost:8000",
    credentials: {
      accessKeyId: "fakeMyKeyId",
      secretAccessKey: "fakeSecretAccessKey",
    },
  };

  process.env.DYNAMODB_OPTIONS = JSON.stringify(dynamodbOptions);
  process.env.CHATVIOUSTABLE_TABLE_NAME = "chatvious-test";
  process.env.USER_POOL_ID = "XXXXXXXXXXXXXXXXXXX";
  process.env.USER_POOL_CLIENT_ID = "XXXXXXXXXXXXXXXXXXX";
  process.env.COGNITO_DOMAIN = "XXXXXXXXXXXXXXXXXXX";
  process.env.CALLBACK_URL = "http://localhost:3000/callback";
  process.env.DOMAIN = "localhost";
  process.env.DOMAIN_URL = "https://chatvious.coding-wielder.com/main";
  process.env.SUB_DOMAIN = "main.chatvious.coding-wielder.com";
  process.env.SUB_DOMAIN_URL = "https://main.chatvious.coding-wielder.com";
} else {
  console.log("Using remote DynamoDB");
  process.env.DYNAMODB_OPTIONS = JSON.stringify({});
  process.env.CHATVIOUSTABLE_TABLE_NAME = "chatvious";
}
