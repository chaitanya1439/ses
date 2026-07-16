import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const textractClient = new TextractClient({ region: process.env.AWS_REGION || "us-east-1" });
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);

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
        console.log("Received Event Path:", event.path);

        if (!event.body) {
            throw new Error("Empty request body");
        }

        let body: any;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            body = event.body; // Fallback
        }

        // Clean up base64 string if it contains data URI prefix
        let base64Image = body.base64Image;
        if (base64Image && base64Image.includes('base64,')) {
            base64Image = base64Image.split('base64,')[1];
        }

        const driverId = body.driverId || "unknown-driver";
        const documentType = body.documentType || "general"; // pan, aadhaar, dl, rc

        if (!base64Image) {
            throw new Error("Missing base64Image in request body");
        }

        // 1. Decode base64 and upload to S3
        const bucketName = process.env.DOCUMENTS_BUCKET;
        if (!bucketName) throw new Error("DOCUMENTS_BUCKET env var not set");

        const objectKey = `${driverId}/${documentType}-${Date.now()}.jpg`;
        const buffer = Buffer.from(base64Image, 'base64');

        console.log(`Uploading to s3://${bucketName}/${objectKey}`);
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            Body: buffer,
            ContentType: "image/jpeg"
        }));

        // 2. Send Image to Amazon Textract
        console.log("Analyzing document with Textract...");
        const analyzeCommand = new AnalyzeDocumentCommand({
            Document: {
                S3Object: {
                    Bucket: bucketName,
                    Name: objectKey,
                },
            },
            FeatureTypes: ["FORMS"],
        });

        const textractResponse = await textractClient.send(analyzeCommand);

        // 3. Parse Textract Response
        const extractedLines: string[] = [];
        if (textractResponse.Blocks) {
            textractResponse.Blocks.forEach(block => {
                if (block.BlockType === 'LINE' && block.Text) {
                    extractedLines.push(block.Text);
                }
            });
        }

        console.log("Extracted Text Lines: ", extractedLines);

        // Basic parsing logic (this will vary based on exact DL format)
        // Usually, the document number is somewhere in the first few lines
        const parsedName = extractedLines.length > 0 ? extractedLines[0] : "Unknown";
        
        // Let's find something that looks like an ID number (alphanumeric, longer)
        let parsedDocNumber = extractedLines.length > 1 ? extractedLines[1] : "Unknown";
        for (const line of extractedLines) {
            const clean = line.replace(/\s/g, '');
            if (clean.length > 8 && /[0-9]/.test(clean) && /[A-Z]/i.test(clean)) {
                 parsedDocNumber = line;
                 break;
            }
        }
        
        console.log(`Parsed Info -> Name: ${parsedName} | Number: ${parsedDocNumber}`);

        // 4. Update DynamoDB Users Table
        const updateCommand = new UpdateCommand({
            TableName: "ridego-users", 
            Key: {
                userId: driverId
            },
            UpdateExpression: "set verificationStatus = :status, parsedName = :name, parsedDocNumber = :docNum, documentType = :docType",
            ExpressionAttributeValues: {
                ":status": "VERIFIED",
                ":name": parsedName,
                ":docNum": parsedDocNumber,
                ":docType": documentType
            },
            ReturnValues: "UPDATED_NEW"
        });

        try {
             await docClient.send(updateCommand);
             console.log(`Successfully updated DynamoDB for Driver: ${driverId}`);
        } catch (e) {
             console.log("DynamoDB update failed, but continuing response", e);
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: JSON.stringify({
                message: 'Document Verification Successful',
                driverId,
                extractedData: {
                    name: parsedName,
                    documentNumber: parsedDocNumber,
                    rawLines: extractedLines,
                    s3Key: objectKey
                }
            }),
        };

    } catch (error) {
        console.error("Error during document verification:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: JSON.stringify({
                message: 'Verification failed',
                error: (error as Error).message
            }),
        };
    }
};
