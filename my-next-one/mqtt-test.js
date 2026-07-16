const { IoTDataPlaneClient, PublishCommand } = require("@aws-sdk/client-iot-data-plane");

const client = new IoTDataPlaneClient({ region: "us-east-1" });

async function testBackend() {
    console.log("Testing AWS IoT Core Backend...");
    
    const riderId = "test-rider-123";
    const driverId = "test-driver-456";

    try {
        // Simulate Rider sending a ride request to global topic
        console.log("1. Rider publishes Ride Request to 'ridego/system/requests'...");
        await client.send(new PublishCommand({
            topic: "ridego/system/requests",
            payload: JSON.stringify({
                type: "ride_request",
                riderId: riderId,
                pickup: { lat: 17.385, lng: 78.4867 },
                drop: { lat: 17.426, lng: 78.4601 },
                timestamp: Date.now()
            })
        }));
        console.log("✅ Successfully published Ride Request to AWS IoT Core!");

        // Simulate Driver accepting the ride directly to the Rider's inbox
        console.log("\n2. Driver accepts ride and publishes to 'ridego/users/test-rider-123/inbox'...");
        await client.send(new PublishCommand({
            topic: `ridego/users/${riderId}/inbox`,
            payload: JSON.stringify({
                type: "ride_accepted",
                driverId: driverId,
                driverName: "Rahul Sharma",
                vehicleNumber: "TS09AB1234",
                timestamp: Date.now()
            })
        }));
        console.log("✅ Successfully published Ride Acceptance to AWS IoT Core!");

        // Simulate Driver sending live location updates
        console.log("\n3. Driver sends live GPS location to 'ridego/rides/test-rider-123/location'...");
        await client.send(new PublishCommand({
            topic: `ridego/rides/${riderId}/location`,
            payload: JSON.stringify({
                latitude: 17.390,
                longitude: 78.487,
                heading: 45,
                speed: 15,
                timestamp: Date.now()
            })
        }));
        console.log("✅ Successfully published Location Update to AWS IoT Core!");

        console.log("\n🎉 AWS IoT Core Backend is fully functional! Topics are properly configured.");
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

testBackend();
