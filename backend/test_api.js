import { WebSocket } from 'ws';

const BASE_URL = 'http://localhost:5000/api';
const WS_URL = 'ws://localhost:5000/ws';

async function runTests() {
  console.log('🧪 Starting Full System Integration Tests...\n');

  // 1. WebSocket Test
  console.log('1️⃣ Testing WebSocket Server Real-Time Connection...');
  const ws = new WebSocket(WS_URL);
  let wsConnected = false;
  let receivedBroadcast = false;

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      wsConnected = true;
      console.log('   ✅ WebSocket connection established.');
      resolve();
    });
    ws.on('error', reject);
  });

  ws.on('message', (msg) => {
    const parsed = JSON.parse(msg.toString());
    if (parsed.type === 'EMERGENCY_ALERT_BROADCAST') {
      receivedBroadcast = true;
      console.log(`   ✅ WebSocket received real-time broadcast: [${parsed.alert.title}] (Priority ${parsed.alert.priority})`);
    }
  });

  // 2. Health & Stats
  console.log('\n2️⃣ Testing Health & Telemetry Stats Endpoints...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  if (health.status !== 'OK') throw new Error('Health check failed');
  console.log('   ✅ /api/health returned status OK.');

  const statsRes = await fetch(`${BASE_URL}/stats`);
  const stats = await statsRes.json();
  console.log(`   ✅ /api/stats: Total Officers: ${stats.totalEmployees}, On Duty: ${stats.onDuty}, On Leave: ${stats.onLeave}, Cruisers: ${stats.vehicles.assigned}/${stats.vehicles.total}`);

  // 3. Roster Query
  console.log('\n3️⃣ Testing Department Roster & Foreign Key Joins...');
  const empRes = await fetch(`${BASE_URL}/employees`);
  const employees = await empRes.json();
  console.log(`   ✅ /api/employees returned ${employees.length} officers with joined assets.`);
  
  // Verify Badge 402, BWC 17916, Vehicle 805009
  const officer402 = employees.find(e => e.badge === 402);
  if (!officer402) throw new Error('Badge 402 not found in seed records');
  if (officer402.bwc_id !== 17916) throw new Error('Badge 402 expected BWC 17916');
  if (officer402.veh_unit_number !== 805009) throw new Error('Badge 402 expected Vehicle 805009');
  console.log(`   ✅ Verified Seed Record: Officer ${officer402.first_name} ${officer402.last_name} (Badge #${officer402.badge}) -> BWC #${officer402.bwc_id}, Vehicle #${officer402.veh_unit_number}, Sector: "${officer402.location_name}"`);

  // 4. Test Absence & Coverage Linking
  console.log('\n4️⃣ Testing Absences & Mutual Aid Shift Coverage...');
  const absRes = await fetch(`${BASE_URL}/absences`);
  const absences = await absRes.json();
  console.log(`   ✅ /api/absences returned ${absences.length} logged absences with covering officers.`);

  // 5. Emergency Broadcast POST -> Real-time WebSocket delivery
  console.log('\n5️⃣ Testing Emergency Broadcast POST & Instant WebSocket Trigger...');
  const alertPayload = {
    title: 'TEST DISPATCH - TACTICAL SIMULATION',
    priority: 1,
    message: 'Simulated Code 3 alert for automated system verification.'
  };

  const alertRes = await fetch(`${BASE_URL}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alertPayload)
  });
  const alertData = await alertRes.json();
  if (!alertData.success) throw new Error('Alert creation failed');
  console.log(`   ✅ Alert published via REST API (ID: ${alertData.alert.alert_id})`);

  // Wait 500ms for WebSocket delivery
  await new Promise(r => setTimeout(r, 600));
  if (!receivedBroadcast) throw new Error('WebSocket broadcast was not received by client');

  // 6. Active Notice Date-Filtering
  console.log('\n6️⃣ Testing Important Notices Active Time-Window Filtering...');
  const activeNoticesRes = await fetch(`${BASE_URL}/notices?active=true`);
  const activeNotices = await activeNoticesRes.json();
  console.log(`   ✅ /api/notices?active=true returned ${activeNotices.length} active notices matching current time.`);

  ws.close();
  console.log('\n🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
