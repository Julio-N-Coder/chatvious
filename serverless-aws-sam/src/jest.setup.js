const dynamodbType = process.argv[3] || "local";

if (dynamodbType === "local") {
  const dynamodbOptions = {
    endpoint: "http://localhost:8000",
    credentials: {
      accessKeyId: "fakeMyKeyId",
      secretAccessKey: "fakeSecretAccessKey",
    },
  };

  process.env.DYNAMODB_OPTIONS = JSON.stringify(dynamodbOptions);
  process.env.CHATVIOUSTABLE_TABLE_NAME = "chatvious-test";
} else {
  process.env.DYNAMODB_OPTIONS = JSON.stringify({});
  process.env.CHATVIOUSTABLE_TABLE_NAME = "chatvious";
}
