import Paho from 'paho-mqtt';

const REGION = 'us-east-1';
const IOT_ENDPOINT = 'a29jvhzif3rjk9-ats.iot.us-east-1.amazonaws.com';
const IDENTITY_POOL_ID = 'us-east-1:96952e71-191b-4f7d-9011-a4b30d5df931';
const USER_POOL_ID = 'us-east-1_Q5n4FJQxd';

// ─── Pure JS SHA-256 + HMAC helpers (zero Node.js / AWS SDK deps) ────────────

function toHex(arr: Uint8Array): string {
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function utf8Encode(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}

// Minimal SHA-256 (pure JS, no dependencies)
function sha256(data: Uint8Array): Uint8Array {
    const K: number[] = [
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];

    const rr = (v: number, n: number) => (v >>> n) | (v << (32 - n));

    // Pre-processing: pad message
    const msgLen = data.length;
    const bitLen = msgLen * 8;
    const padLen = ((msgLen + 8) % 64 === 0) ? msgLen + 8 + 64 : msgLen + 8 + (64 - ((msgLen + 8) % 64));
    const padded = new Uint8Array(padLen);
    padded.set(data);
    padded[msgLen] = 0x80;
    // Write length as 64-bit big-endian (we only support up to 2^32 bits)
    const dv = new DataView(padded.buffer);
    dv.setUint32(padLen - 4, bitLen, false);

    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    for (let off = 0; off < padLen; off += 64) {
        const w = new Int32Array(64);
        for (let i = 0; i < 16; i++) w[i] = dv.getInt32(off + i * 4, false);
        for (let i = 16; i < 64; i++) {
            const s0 = rr(w[i-15]>>>0,7) ^ rr(w[i-15]>>>0,18) ^ (w[i-15]>>>3);
            const s1 = rr(w[i-2]>>>0,17) ^ rr(w[i-2]>>>0,19) ^ (w[i-2]>>>10);
            w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
        }
        let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
        for (let i = 0; i < 64; i++) {
            const S1 = rr(e>>>0,6) ^ rr(e>>>0,11) ^ rr(e>>>0,25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
            const S0 = rr(a>>>0,2) ^ rr(a>>>0,13) ^ rr(a>>>0,22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + maj) | 0;
            h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
        }
        h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0;
        h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
    }

    const result = new Uint8Array(32);
    const rv = new DataView(result.buffer);
    rv.setInt32(0,h0,false); rv.setInt32(4,h1,false); rv.setInt32(8,h2,false); rv.setInt32(12,h3,false);
    rv.setInt32(16,h4,false); rv.setInt32(20,h5,false); rv.setInt32(24,h6,false); rv.setInt32(28,h7,false);
    return result;
}

function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
    const blockSize = 64;
    let keyBlock = key;
    if (keyBlock.length > blockSize) keyBlock = sha256(keyBlock);
    const padded = new Uint8Array(blockSize);
    padded.set(keyBlock);

    const ipad = new Uint8Array(blockSize + message.length);
    for (let i = 0; i < blockSize; i++) ipad[i] = padded[i] ^ 0x36;
    ipad.set(message, blockSize);
    const inner = sha256(ipad);

    const opad = new Uint8Array(blockSize + 32);
    for (let i = 0; i < blockSize; i++) opad[i] = padded[i] ^ 0x5c;
    opad.set(inner, blockSize);
    return sha256(opad);
}

function sha256Hex(data: string): string {
    return toHex(sha256(utf8Encode(data)));
}

function hmacSha256Hex(key: Uint8Array, data: string): string {
    return toHex(hmacSha256(key, utf8Encode(data)));
}

function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Uint8Array {
    const kDate = hmacSha256(utf8Encode('AWS4' + secretKey), utf8Encode(dateStamp));
    const kRegion = hmacSha256(kDate, utf8Encode(region));
    const kService = hmacSha256(kRegion, utf8Encode(service));
    return hmacSha256(kService, utf8Encode('aws4_request'));
}

// ─── Cognito Identity (direct fetch) ──────────────────────────────────────────

async function getCognitoCredentials(jwtToken: string) {
    const endpoint = `https://cognito-identity.${REGION}.amazonaws.com`;
    const loginKey = `cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

    const getIdRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityService.GetId',
        },
        body: JSON.stringify({ IdentityPoolId: IDENTITY_POOL_ID, Logins: { [loginKey]: jwtToken } }),
    });
    if (!getIdRes.ok) throw new Error(`GetId failed: ${getIdRes.status}`);
    const { IdentityId } = await getIdRes.json();

    const getCredRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityService.GetCredentialsForIdentity',
        },
        body: JSON.stringify({ IdentityId, Logins: { [loginKey]: jwtToken } }),
    });
    if (!getCredRes.ok) throw new Error(`GetCredentialsForIdentity failed: ${getCredRes.status}`);
    const { Credentials } = await getCredRes.json();

    return {
        accessKeyId: Credentials.AccessKeyId as string,
        secretAccessKey: Credentials.SecretKey as string,
        sessionToken: Credentials.SessionToken as string,
    };
}

// ─── SigV4 Presigned URL for IoT ─────────────────────────────────────────────

function createSignedIoTUrl(creds: { accessKeyId: string; secretAccessKey: string; sessionToken: string }): string {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0,10).replace(/-/g, '');
    const amzDate = dateStamp + 'T' + now.toISOString().slice(11,19).replace(/:/g, '') + 'Z';
    const service = 'iotdevicegateway';
    const scope = `${dateStamp}/${REGION}/${service}/aws4_request`;
    const algorithm = 'AWS4-HMAC-SHA256';
    const emptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const qp: Record<string, string> = {
        'X-Amz-Algorithm': algorithm,
        'X-Amz-Credential': `${creds.accessKeyId}/${scope}`,
        'X-Amz-Date': amzDate,
        'X-Amz-Expires': '86400',
        'X-Amz-SignedHeaders': 'host',
    };
    if (creds.sessionToken) qp['X-Amz-Security-Token'] = creds.sessionToken;

    const sortedKeys = Object.keys(qp).sort();
    const canonicalQS = sortedKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(qp[k])}`).join('&');

    const canonicalRequest = ['GET', '/mqtt', canonicalQS, `host:${IOT_ENDPOINT}`, '', 'host', emptyHash].join('\n');
    const stringToSign = [algorithm, amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
    const signingKey = getSignatureKey(creds.secretAccessKey, dateStamp, REGION, service);
    const signature = hmacSha256Hex(signingKey, stringToSign);

    return `wss://${IOT_ENDPOINT}/mqtt?${canonicalQS}&X-Amz-Signature=${signature}`;
}

// ─── IoT MQTT Client ─────────────────────────────────────────────────────────

export class AWSIoTClient {
    private client: Paho.Client | null = null;
    private isConnected: boolean = false;
    private subscriptions: Map<string, ((payload: any) => void)[]> = new Map();

    async connect(jwtToken: string): Promise<void> {
        if (this.isConnected) return;
        try {
            const credentials = await getCognitoCredentials(jwtToken);
            const url = createSignedIoTUrl(credentials);

            this.client = new Paho.Client(url, 'ridego-client-' + Math.random().toString(16).substr(2, 8));
            this.client.onMessageArrived = this.onMessageArrived.bind(this);
            this.client.onConnectionLost = this.onConnectionLost.bind(this);

            return new Promise((resolve) => {
                this.client!.connect({
                    onSuccess: () => { this.isConnected = true; resolve(); },
                    onFailure: (err: any) => { console.warn('IoT Connect Failed:', err); resolve(); },
                    useSSL: true,
                    mqttVersion: 4,
                });
            });
        } catch (error) {
            console.warn('[IoT] Failed to initialize (offline mode):', error);
        }
    }

    private onMessageArrived(message: Paho.Message) {
        const topic = message.destinationName;
        const payload = JSON.parse(message.payloadString);
        const callbacks = this.subscriptions.get(topic) || [];
        callbacks.forEach(cb => cb(payload));
    }

    private onConnectionLost(responseObject: any) {
        if (responseObject.errorCode !== 0) console.warn('IoT Connection Lost:', responseObject.errorMessage);
        this.isConnected = false;
    }

    subscribe(topic: string, callback: (payload: any) => void) {
        if (!this.client || !this.isConnected) return;
        const callbacks = this.subscriptions.get(topic) || [];
        if (callbacks.length === 0) this.client.subscribe(topic);
        this.subscriptions.set(topic, [...callbacks, callback]);
    }

    unsubscribe(topic: string, callback?: (payload: any) => void) {
        if (!this.client) return;
        if (callback) {
            let cbs = this.subscriptions.get(topic) || [];
            cbs = cbs.filter(cb => cb !== callback);
            if (cbs.length === 0) { this.client.unsubscribe(topic); this.subscriptions.delete(topic); }
            else this.subscriptions.set(topic, cbs);
        } else { this.client.unsubscribe(topic); this.subscriptions.delete(topic); }
    }

    publish(topic: string, payload: any) {
        if (!this.client || !this.isConnected) return;
        const message = new Paho.Message(JSON.stringify(payload));
        message.destinationName = topic;
        this.client.send(message);
    }
}

export const ioTClient = new AWSIoTClient();
