const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '60651d89b02641afeea358be4762f0b047ebae446572e906180e6bd1d4ba6ff05bd4341226a414f5f0db15ea6efd54eb98b7e719c5dc8e0f6370d326cbe79b39';

// Create tokens for test driver and rider
const driverToken = jwt.sign({ id: 'test-driver-001', role: 'driver' }, JWT_SECRET, { expiresIn: '1h' });
const riderToken = jwt.sign({ id: 'test-rider-001', role: 'rider' }, JWT_SECRET, { expiresIn: '1h' });

console.log('🔌 Connecting as DRIVER...');
const driverWs = new WebSocket(`wss://real.shelteric.com?token=${driverToken}`);

let riderWs;

driverWs.on('open', () => {
  console.log('✅ Driver WebSocket CONNECTED');
  
  // Auth as driver
  driverWs.send(JSON.stringify({ type: 'auth', userId: 'test-driver-001', role: 'driver', vehicleType: 'bike' }));
  console.log('📤 Driver sent: auth');

  // Set driver available
  setTimeout(() => {
    driverWs.send(JSON.stringify({ type: 'driver_status', status: 'available' }));
    console.log('📤 Driver sent: driver_status = available');
  }, 500);

  // Now connect rider
  setTimeout(() => {
    console.log('\n🔌 Connecting as RIDER...');
    riderWs = new WebSocket(`wss://real.shelteric.com?token=${riderToken}`);
    
    riderWs.on('open', () => {
      console.log('✅ Rider WebSocket CONNECTED');
      riderWs.send(JSON.stringify({ type: 'auth', userId: 'test-rider-001', role: 'rider' }));
      console.log('📤 Rider sent: auth');
    });

    riderWs.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      console.log(`📥 Rider received: ${msg.type}`, msg.type === 'driver_location' ? `lat=${msg.location?.lat}, lng=${msg.location?.lng}` : '');
      
      if (msg.type === 'driver_location') {
        console.log('\n✅✅✅ LIVE TRACKING IS WORKING! Driver location received by rider! ✅✅✅\n');
        // Cleanup
        driverWs.close();
        riderWs.close();
        process.exit(0);
      }
    });

    riderWs.on('error', (e) => console.error('❌ Rider WS error:', e.message));
  }, 1000);

  // Simulate: driver sends ride_accept then location_update
  setTimeout(() => {
    // Driver accepts a ride for this rider
    driverWs.send(JSON.stringify({ 
      type: 'ride_accept', 
      riderId: 'test-rider-001' 
    }));
    console.log('📤 Driver sent: ride_accept for test-rider-001');
  }, 2000);

  // Send location update after accept
  setTimeout(() => {
    driverWs.send(JSON.stringify({ 
      type: 'location_update', 
      riderId: 'test-rider-001',
      location: { lat: 17.385, lng: 78.4867, heading: 45, speed: 30 }
    }));
    console.log('📤 Driver sent: location_update (lat=17.385, lng=78.4867)');
  }, 3000);
});

driverWs.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log(`📥 Driver received: ${msg.type}`);
});

driverWs.on('error', (e) => console.error('❌ Driver WS error:', e.message));

// Timeout after 10 seconds
setTimeout(() => {
  console.log('\n⚠️ Test timed out after 10s. Live tracking may not be forwarding driver_location to rider.');
  console.log('This could mean the rider needs an active ride_request first before the server pairs them.');
  if (driverWs.readyState === WebSocket.OPEN) driverWs.close();
  if (riderWs && riderWs.readyState === WebSocket.OPEN) riderWs.close();
  process.exit(1);
}, 10000);
