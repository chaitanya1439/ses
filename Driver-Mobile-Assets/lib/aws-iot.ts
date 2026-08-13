import 'react-native-url-polyfill/auto';
import { Sha256 } from '@aws-crypto/sha256-js';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import Paho from 'paho-mqtt';

const REGION = 'us-east-1';
const IOT_ENDPOINT = 'a29jvhzif3rjk9-ats.iot.us-east-1.amazonaws.com';
const IDENTITY_POOL_ID = 'us-east-1:96952e71-191b-4f7d-9011-a4b30d5df931';
const USER_POOL_ID = 'us-east-1_Q5n4FJQxd';

export class AWSIoTClient {
    private client: Paho.Client | null = null;
    private isConnected: boolean = false;
    private subscriptions: Map<string, ((payload: any) => void)[]> = new Map();

    async connect(jwtToken: string): Promise<void> {
        if (this.isConnected) return;

        try {
            // 1. Get AWS Credentials via Cognito Identity Pool
            // Connecting with mock credentials because Cognito is removed
            // App will fail gracefully and fall back to offline mode
            const credentialsProvider = async () => ({
                accessKeyId: "mock_access_key",
                secretAccessKey: "mock_secret_key",
                sessionToken: "mock_session_token"
            });

            const credentials = await credentialsProvider();

            // 2. Create SigV4 Signed WebSocket URL
            const url = await this.getSignedUrl(credentials);

            // 3. Connect via Paho MQTT
            this.client = new Paho.Client(url, 'ridego-client-' + Math.random().toString(16).substr(2, 8));
            
            this.client.onMessageArrived = this.onMessageArrived.bind(this);
            this.client.onConnectionLost = this.onConnectionLost.bind(this);

            return new Promise((resolve, reject) => {
                this.client!.connect({
                    onSuccess: () => {
                        this.isConnected = true;
                        resolve();
                    },
                    onFailure: (err: any) => {
                        console.warn('IoT Connect Failed:', err);
                        resolve(); // Don't reject - app should not crash
                    },
                    useSSL: true,
                    mqttVersion: 4,
                });
            });

        } catch (error) {
            // Gracefully handle - app continues without real-time features
            console.warn('[IoT] Failed to initialize (offline mode):', error);
            // Do NOT re-throw - this prevents app crash
        }
    }

    private async getSignedUrl(credentials: any): Promise<string> {
        const signer = new SignatureV4({
            credentials,
            region: REGION,
            service: 'iotdevicegateway',
            sha256: Sha256,
        });

        const request = new HttpRequest({
            method: 'GET',
            protocol: 'wss:',
            hostname: IOT_ENDPOINT,
            path: '/mqtt',
            query: {
                'X-Amz-Expires': '86400',
            }
        });

        const signedRequest = await signer.presign(request, { expiresIn: 86400 });
        return `wss://${signedRequest.hostname}${signedRequest.path}?${Object.keys(signedRequest.query || {}).map(k => `${k}=${encodeURIComponent(signedRequest.query![k] as string)}`).join('&')}`;
    }

    private onMessageArrived(message: Paho.Message) {
        const topic = message.destinationName;
        const payload = JSON.parse(message.payloadString);
        
        const callbacks = this.subscriptions.get(topic) || [];
        callbacks.forEach(cb => cb(payload));
    }

    private onConnectionLost(responseObject: any) {
        if (responseObject.errorCode !== 0) {
            console.warn('IoT Connection Lost:', responseObject.errorMessage);
        }
        this.isConnected = false;
    }

    subscribe(topic: string, callback: (payload: any) => void) {
        if (!this.client || !this.isConnected) return;
        
        const callbacks = this.subscriptions.get(topic) || [];
        if (callbacks.length === 0) {
            this.client.subscribe(topic);
        }
        this.subscriptions.set(topic, [...callbacks, callback]);
    }

    unsubscribe(topic: string, callback?: (payload: any) => void) {
        if (!this.client) return;

        if (callback) {
            let callbacks = this.subscriptions.get(topic) || [];
            callbacks = callbacks.filter(cb => cb !== callback);
            if (callbacks.length === 0) {
                this.client.unsubscribe(topic);
                this.subscriptions.delete(topic);
            } else {
                this.subscriptions.set(topic, callbacks);
            }
        } else {
            this.client.unsubscribe(topic);
            this.subscriptions.delete(topic);
        }
    }

    publish(topic: string, payload: any) {
        if (!this.client || !this.isConnected) return;
        
        const message = new Paho.Message(JSON.stringify(payload));
        message.destinationName = topic;
        this.client.send(message);
    }
}

export const ioTClient = new AWSIoTClient();
