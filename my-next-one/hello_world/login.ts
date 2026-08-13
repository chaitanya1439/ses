import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import * as jwt from 'jsonwebtoken';

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Handle CORS Preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: ''
        };
    }

    try {
        if (!event.body) {
            throw new Error("Empty request body");
        }

        let body: any;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            body = event.body;
        }

        const phone = body.phone;
        if (!phone) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: "Phone number is required" })
            };
        }

        // Clean phone number (e.g. ensure it starts with +91)
        const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;

        // Update or insert user in DynamoDB
        const updateCommand = new UpdateCommand({
            TableName: "ridego-users",
            Key: { userId: fullPhone },
            UpdateExpression: "SET phone = :phone, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
                ":phone": fullPhone,
                ":updatedAt": new Date().toISOString()
            },
            ReturnValues: "ALL_NEW"
        });

        const result = await docClient.send(updateCommand);
        const user = result.Attributes;

        // Generate JWT Token
        const token = jwt.sign(
            { userId: fullPhone, phone: fullPhone },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: JSON.stringify({
                message: 'Login Successful',
                token,
                user
            }),
        };

    } catch (error) {
        console.error("Error during login:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
                message: 'Login failed',
                error: (error as Error).message
            }),
        };
    }
};
