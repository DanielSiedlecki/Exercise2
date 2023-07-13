const {
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const dbClient = require("./dbClient");
const crypto = require("crypto");

exports.handler = async function (event) {
  console.log("request", JSON.stringify(event, undefined, 2));

  switch (event.httpMethod) {
    case "GET":
      if (event.pathParameters != null) {
        return await getUser(event.pathParameters.id);
      } else {
        return await getAllUsers();
      }
    case "POST":
      return await createUser(event);
    case "DELETE":
      return await deleteUser(event.pathParameters.id);

    case "PUT":
      return await updateUser();
  }

  return {
    statusCode: 400,
    headers: { "Content-Type": "text/plain" },
    body: "Invalid HTTP method",
  };
};

const getUser = async (userId) => {
  try {
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: marshall({ id: userId }),
    };

    const { Item } = await dbClient.send(new GetItemCommand(params));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Item ? unmarshall(Item) : {}),
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const params = {
      TableName: process.env.TABLE_NAME,
    };

    const { Items } = await dbClient.send(new ScanCommand(params));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Items ? Items.map((item) => unmarshall(item)) : []),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

const createUser = async (event) => {
  try {
    const requestBody = JSON.parse(event.body);
    const userId = crypto.randomBytes(16).toString("hex");
    requestBody.id = userId;

    const params = {
      TableName: process.env.TABLE_NAME,
      Item: marshall(requestBody || {}),
    };

    await dbClient.send(new PutItemCommand(params));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Element został pomyślnie utworzony",
        item: requestBody,
      }),
    };
  } catch (error) {
    console.log(error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

const deleteUser = async (userId) => {
  try {
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: marshall({ id: userId }),
    };

    const deleteResult = await dbClient.send(new DeleteItemCommand(params));
    return deleteResult;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const updateUser = async (event) => {
  try {
    const requestBody = JSON.parse(event.body);
    const userId = event.pathParameters.id;

    const params = {
      TableName: process.env.TABLE_NAME,
      Item: marshall({ id: userId, ...requestBody }),
    };

    await dbClient.send(new PutItemCommand(params));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Użytkownik został pomyślnie zaktualizowany",
      }),
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
