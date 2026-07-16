const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const REGION = 'us-east-1';
const CLIENT_ID = '353s09vt030onfnn7k58us3a83';

const client = new CognitoIdentityProviderClient({ region: REGION });

async function test(phone) {
  try {
    const params = {
      AuthFlow: 'CUSTOM_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: phone,
      },
    };
    const command = new InitiateAuthCommand(params);
    const response = await client.send(command);
    console.log('Success:', response);
  } catch (err) {
    console.error('Error:', err);
  }
}

test('+916304497462');
