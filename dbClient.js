const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const REGION = "eu-north-1";

const dbClient = new DynamoDBClient({ region: REGION });

module.exports = dbClient;
