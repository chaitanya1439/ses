import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const REGION = "us-east-1"; 
const CLIENT_ID = "353s09vt030onfnn7k58us3a83";

const client = new CognitoIdentityProviderClient({
  region: REGION,
});

const DUMMY_PASSWORD = "Password@1234!";

export const signUpUser = async (phoneNumber: string) => {
  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: phoneNumber,
    Password: DUMMY_PASSWORD,
    UserAttributes: [
      {
        Name: "phone_number",
        Value: phoneNumber,
      },
    ],
  });

  return await client.send(command);
};

export const initiateLogin = async (phoneNumber: string) => {
  const command = new InitiateAuthCommand({
    AuthFlow: "CUSTOM_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: phoneNumber,
    },
  });

  return await client.send(command);
};

export const verifyOTP = async (phoneNumber: string, otp: string, session: string) => {
  const command = new RespondToAuthChallengeCommand({
    ChallengeName: "CUSTOM_CHALLENGE",
    ClientId: CLIENT_ID,
    ChallengeResponses: {
      USERNAME: phoneNumber,
      ANSWER: otp,
    },
    Session: session,
  });

  return await client.send(command);
};
