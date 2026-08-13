const WebSocket = require('ws');

const DRIVER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZmUxMjg2Mi04M2Q4LTQ2OGItOGM1Ni0xNDgxY2YxOGI4MTgiLCJpYXQiOjE3NjEyMTg3MjUsImV4cCI6MTc2MTgyMzUyNX0.Ny5Gt3TFZvX-mLpBdQJ8nWR0rqIbQGpXPGrcEWWNlVs';
const RIDER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDg0ODlhZC1jMGQ4LTQ5NzgtOWEwYi0xMzZkMGIyN2Q4ZjYiLCJpYXQiOjE3NjE5MTI4NDQsImV4cCI6MTc2MjUxNzY0NH0.US8Apz5qHuRkybCwdDT8XHTPBycLo66JHUIPEV6is1Y';

const driverWs = new WebSocket(`wss://real.shelteric.com?token=${DRIVER_TOKEN}`);
const riderWs = new WebSocket(`wss://real.shelteric.com?token=${RIDER_TOKEN}`);

let driverReceivedRequest = false;

driverWs.on('open', () => {
  console.log('[Driver] Connected');
  driverWs.send(JSON.stringify({ type: 'auth', role: 'driver', id: 'ffe12862-83d8-468b-8c56-1481cf18b818', vehicleType: 'Bike' }));
  driverWs.send(JSON.stringify({ type: 'driver_status', status: 'available' }));

  // Set driver location approx 25km away from the rider's pickup
  // Pickup is: 17.385, 78.4867
  driverWs.send(JSON.stringify({
    type: 'location_update',
    location: { lat: 17.610, lng: 78.4867 }
  }));
  console.log('[Driver] Sent location_update 25km away');
});

driverWs.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('[Driver] Received message:', msg.type);
  if (msg.type === 'new_ride_request') {
    driverReceivedRequest = true;
    console.log('[Driver] Successfully received new_ride_request!', JSON.stringify(msg, null, 2));
    
    setTimeout(() => {
      driverWs.close();
      riderWs.close();
      process.exit(0);
    }, 1000);
  }
});

riderWs.on('open', () => {
  console.log('[Rider] Connected');
  riderWs.send(JSON.stringify({ type: 'auth', role: 'rider', id: '048489ad-c0d8-4978-9a0b-136d0b27d8f6' }));
  
  setTimeout(() => {
    console.log('[Rider] Sending ride_request...');
    riderWs.send(JSON.stringify({
      type: 'ride_request',
      payload: {
        pickupLocation: { lat: 17.385, lng: 78.4867, address: 'Hyderabad' },
        destinationLocation: { lat: 17.426, lng: 78.4601, address: 'Secunderabad' },
        distance: '8.5',
        fare: 150,
        vehicleType: 'Bike',
        paymentMethod: 'Cash',
        otp: '1234'
      }
    }));
  }, 2000);
});

riderWs.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('[Rider] Received message:', msg.type);
});

setTimeout(() => {
  if (!driverReceivedRequest) {
    console.error('Test Failed: Driver did not receive the ride request. This might mean the distance check (30km) is not deployed, or the driver was filtered out.');
    process.exit(1);
  }
}, 10000);
