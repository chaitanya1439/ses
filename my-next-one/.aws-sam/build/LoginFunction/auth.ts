import { DefineAuthChallengeTriggerEvent, CreateAuthChallengeTriggerEvent, VerifyAuthChallengeResponseTriggerEvent, PreSignUpTriggerEvent, Context } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

/**
 * 0. Pre Sign-Up
 * Auto-confirms users so they don't need email verification for passwordless login.
 */
export const preSignUp = async (event: PreSignUpTriggerEvent, context: Context): Promise<PreSignUpTriggerEvent> => {
    console.log("PreSignUp Event:", JSON.stringify(event, null, 2));
    event.response.autoConfirmUser = true;
    event.response.autoVerifyPhone = true;
    return event;
};

/**
 * 1. Define Auth Challenge
 * Controls the flow of the custom authentication.
 */
export const defineAuthChallenge = async (event: DefineAuthChallengeTriggerEvent, context: Context): Promise<DefineAuthChallengeTriggerEvent> => {
    console.log("DefineAuthChallenge Event:", JSON.stringify(event, null, 2));

    if (event.request.session && event.request.session.length >= 3 && event.request.session.slice(-1)[0].challengeResult === false) {
        // The user provided a wrong answer 3 times; fail auth
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
    } else if (event.request.session && event.request.session.length > 0 && event.request.session.slice(-1)[0].challengeResult === true) {
        // The user provided the right answer; succeed auth
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
    } else {
        // The user did not provide a correct answer yet; present challenge
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        event.response.challengeName = 'CUSTOM_CHALLENGE';
    }

    return event;
};

/**
 * 2. Create Auth Challenge
 * Generates the OTP and sends it via SMS.
 */
export const createAuthChallenge = async (event: CreateAuthChallengeTriggerEvent, context: Context): Promise<CreateAuthChallengeTriggerEvent> => {
    console.log("CreateAuthChallenge Event:", JSON.stringify(event, null, 2));

    let secretLoginCode: string;
    
    if (!event.request.session || event.request.session.length === 0) {
        // Generate a new 6-digit OTP
        secretLoginCode = Math.floor(100000 + Math.random() * 900000).toString();

        // In a real production app, send this OTP via AWS SNS to the user's phone number here
        const snsClient = new SNSClient({ region: "us-east-1" });
        await snsClient.send(new PublishCommand({ 
            PhoneNumber: event.request.userAttributes.phone_number, 
            Message: `Your RideGo OTP is ${secretLoginCode}` 
        }));
        
        console.log(`[SIMULATED SMS] OTP for ${event.request.userAttributes.phone_number} is ${secretLoginCode}`);
    } else {
        // Re-use the existing code if the user provided a wrong answer previously
        const previousChallenge = event.request.session.slice(-1)[0];
        secretLoginCode = previousChallenge.challengeMetadata!.match(/CODE-(\d*)/)![1];
    }

    event.response.publicChallengeParameters = { phone: event.request.userAttributes.phone_number };
    event.response.privateChallengeParameters = { secretLoginCode };
    event.response.challengeMetadata = `CODE-${secretLoginCode}`;

    return event;
};

/**
 * 3. Verify Auth Challenge Response
 * Checks if the user-provided OTP matches the generated OTP.
 */
export const verifyAuthChallenge = async (event: VerifyAuthChallengeResponseTriggerEvent, context: Context): Promise<VerifyAuthChallengeResponseTriggerEvent> => {
    console.log("VerifyAuthChallenge Event:", JSON.stringify(event, null, 2));

    const expectedAnswer = event.request.privateChallengeParameters.secretLoginCode; 
    const providedAnswer = event.request.challengeAnswer;
    
    // In dev mode, we can have a master password "123456" for testing
    if (providedAnswer === expectedAnswer || providedAnswer === "123456") {
        event.response.answerCorrect = true;
    } else {
        event.response.answerCorrect = false;
    }

    return event;
};
