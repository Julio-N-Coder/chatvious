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
} else {
  process.env.DYNAMODB_OPTIONS = JSON.stringify({});
}
