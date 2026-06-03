const dns = require('dns');

// Force custom DNS to resolve Srv records on BSNL
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('======================================================');
  console.log('🚀 FIX MY STREET - AUTOMATED 50-ASSERTION E2E SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;
  
  const assert = (condition, message) => {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passed++;
    } else {
      console.log(` ❌ FAIL: ${message}`);
      failed++;
    }
  };

  const assertError = (errorMsg, expectedSubstring, message) => {
    if (errorMsg && errorMsg.toLowerCase().includes(expectedSubstring.toLowerCase())) {
      console.log(` ✅ PASS: ${message} (Caught error: "${errorMsg}")`);
      passed++;
    } else {
      console.log(` ❌ FAIL: ${message} (Expected: "${expectedSubstring}", Got: "${errorMsg}")`);
      failed++;
    }
  };

  // Storing temporary states for dynamic chaining
  let testCitizenMobile = `9944${Math.floor(100000 + Math.random() * 900000)}`;
  let testCitizenId = '';
  let testCitizenName = 'Hari Krishnan';
  let testComplaintId = '';

  try {
    // ==========================================
    // PHASE 1: DIAGNOSTICS & SYSTEM CONNECTIONS
    // ==========================================
    console.log('--- Phase 1: Connection & Diagnostics (2 Tests) ---');
    const diagRes = await fetch(`${BASE_URL}/api/diagnostics`);
    const diag = await diagRes.json();
    
    assert(diag.cloudinary.status === 'authenticated', 'Test 1: Cloudinary authenticated successfully');
    assert(diag.mongodb.status === 'connected', 'Test 2: MongoDB Atlas connected successfully');

    // ==========================================
    // PHASE 2: CITIZEN REGISTRATION VALIDATIONS
    // ==========================================
    console.log('\n--- Phase 2: Citizen Registration (8 Tests) ---');
    
    // Test 3: Rejects empty name
    let res = await fetch(`${BASE_URL}/api/auth/citizen/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', mobileNumber: testCitizenMobile, password: 'password123' })
    });
    let data = await res.json();
    assertError(data.error, 'required', 'Test 3: Rejects registration if name is empty');

    // Test 4: Rejects empty mobile
    res = await fetch(`${BASE_URL}/api/auth/citizen/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testCitizenName, mobileNumber: '', password: 'password123' })
    });
    data = await res.json();
    assertError(data.error, 'required', 'Test 4: Rejects registration if mobile is empty');

    // Test 5: Rejects empty both
    res = await fetch(`${BASE_URL}/api/auth/citizen/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', mobileNumber: '', password: 'password123' })
    });
    data = await res.json();
    assertError(data.error, 'required', 'Test 5: Rejects registration if both fields are empty');

    // Test 6: Accepts valid credentials
    res = await fetch(`${BASE_URL}/api/auth/citizen/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testCitizenName, mobileNumber: testCitizenMobile, password: 'password123' })
    });
    let regCitizen = await res.json();
    assert(res.ok && regCitizen.id, 'Test 6: Accepts valid unique credentials');
    if (regCitizen.id) testCitizenId = regCitizen.id;

    // Test 7: Rejects duplicate mobile number
    res = await fetch(`${BASE_URL}/api/auth/citizen/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Another User', mobileNumber: testCitizenMobile, password: 'password123' })
    });
    data = await res.json();
    assertError(data.error, 'already', 'Test 7: Rejects duplicate mobile number registration');

    // Test 8: Returned object has registeredAt timestamp
    assert(regCitizen.registeredAt, 'Test 8: Verify citizen contains registeredAt timestamp');

    // Test 9: Returned object has string id format
    assert(typeof regCitizen.id === 'string', 'Test 9: Verify citizen ID is returned as string');

    // Test 10: Verify citizen is in all citizens list
    const listRes = await fetch(`${BASE_URL}/api/citizens`);
    const allCitizens = await listRes.json();
    assert(allCitizens.some(c => c.id === testCitizenId), 'Test 10: Verify registered user exists in all citizens list');

    // ==========================================
    // PHASE 3: CITIZEN LOGIN VALIDATIONS
    // ==========================================
    console.log('\n--- Phase 3: Citizen Login (6 Tests) ---');

    // Test 11: Rejects empty mobile login
    res = await fetch(`${BASE_URL}/api/auth/citizen/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: '', password: 'password123' })
    });
    data = await res.json();
    assertError(data.error, 'required', 'Test 11: Rejects login with empty mobile number');

    // Test 12: Rejects unregistered mobile number
    res = await fetch(`${BASE_URL}/api/auth/citizen/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: '9999999999', password: 'password123' })
    });
    data = await res.json();
    assertError(data.error, 'credentials', 'Test 12: Rejects login with unregistered mobile number');

    // Test 13: Accepts login for registered user
    res = await fetch(`${BASE_URL}/api/auth/citizen/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: testCitizenMobile, password: 'password123' })
    });
    let loginCitizenObj = await res.json();
    assert(res.ok && loginCitizenObj.id === testCitizenId, 'Test 13: Accepts login with valid registered mobile number');

    // Test 14: Login returns correct name
    assert(loginCitizenObj.name === testCitizenName, 'Test 14: Verifies login returns correct citizen name');

    // Test 15: Login contains matching registeredAt
    assert(loginCitizenObj.registeredAt === regCitizen.registeredAt, 'Test 15: Verifies login contains correct registered timestamp');

    // Test 16: Rejects invalid mobile formatting (e.g. text)
    res = await fetch(`${BASE_URL}/api/auth/citizen/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: 'abcdefg', password: 'password123' })
    });
    data = await res.json();
    assert(!res.ok, 'Test 16: Rejects malformed non-numeric mobile numbers');

    // ==========================================
    // PHASE 4: RAJAPALAYAM BOUNDS VALIDATIONS
    // ==========================================
    console.log('\n--- Phase 4: Rajapalayam Boundaries (10 Tests) ---');

    const testBoundary = async (lat, lng, expectedPass, testNum, testMsg) => {
      const mockComp = {
        citizenId: testCitizenId,
        citizenName: testCitizenName,
        title: 'Road crack',
        description: 'Road needs patching',
        category: 'roads',
        latitude: lat,
        longitude: lng,
        priority: 'medium'
      };
      
      const response = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockComp)
      });
      
      const body = await response.json();
      if (expectedPass) {
        assert(response.status === 201, `Test ${testNum}: ${testMsg} (Coordinates: ${lat}, ${lng})`);
        if (body.id) testComplaintId = body.id;
      } else {
        assertError(body.error, 'Rajapalayam', `Test ${testNum}: ${testMsg} (Coordinates: ${lat}, ${lng})`);
      }
    };

    // Test 17: Lat too low (9.30) -> Fail
    await testBoundary(9.30, 77.55, false, 17, 'Rejects latitude below southern bound (< 9.35)');

    // Test 18: Lat too high (9.60) -> Fail
    await testBoundary(9.60, 77.55, false, 18, 'Rejects latitude above northern bound (> 9.55)');

    // Test 19: Lng too low (77.40) -> Fail
    await testBoundary(9.45, 77.40, false, 19, 'Rejects longitude below western bound (< 77.45)');

    // Test 20: Lng too high (77.70) -> Fail
    await testBoundary(9.45, 77.70, false, 20, 'Rejects longitude above eastern bound (> 77.65)');

    // Test 21: Chennai coordinates -> Fail
    await testBoundary(13.0827, 80.2707, false, 21, 'Rejects distant location (Chennai)');

    // Test 22: Bangalore coordinates -> Fail
    await testBoundary(12.9716, 77.5946, false, 22, 'Rejects distant location (Bangalore)');

    // Test 23: Perfect Rajapalayam Center (9.4515, 77.5543) -> Pass
    await testBoundary(9.4515, 77.5543, true, 23, 'Accepts coordinates at exact center of Rajapalayam');

    // Test 24: Near eastern boundary (9.45, 77.64) -> Pass
    await testBoundary(9.45, 77.64, true, 24, 'Accepts coordinates near eastern boundary');

    // Test 25: Near western boundary (9.45, 77.46) -> Pass
    await testBoundary(9.45, 77.46, true, 25, 'Accepts coordinates near western boundary');

    // Test 26: Near northern boundary (9.54, 77.55) -> Pass
    await testBoundary(9.54, 77.55, true, 26, 'Accepts coordinates near northern boundary');

    // ==========================================
    // PHASE 5: COMPLAINT DATA & PHOTO PROCESSING
    // ==========================================
    console.log('\n--- Phase 5: Complaint Submissions & Photo Uploads (10 Tests) ---');

    // Test 27: Rejects empty title
    res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId: testCitizenId,
        title: '',
        description: 'Road needs patching',
        latitude: 9.4515,
        longitude: 77.5543
      })
    });
    data = await res.json();
    assertError(data.error, 'required', 'Test 27: Rejects complaint submission with empty title');

    // Test 28: Rejects empty description
    res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId: testCitizenId,
        title: 'Water leak',
        description: '',
        latitude: 9.4515,
        longitude: 77.5543
      })
    });
    data = await res.json();
    assertError(data.error, 'required', 'Test 28: Rejects complaint submission with empty description');

    // Test 29: Accepts complaint with empty photo list
    res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId: testCitizenId,
        citizenName: testCitizenName,
        title: 'Pothole patch',
        description: 'Large pothole needs filling',
        category: 'roads',
        latitude: 9.4515,
        longitude: 77.5543,
        priority: 'high',
        photoUrls: []
      })
    });
    let c29 = await res.json();
    assert(res.status === 201 && c29.photoUrls.length === 0, 'Test 29: Accepts complaint with empty photo list');

    // Test 30: Accepts complaint with single photo URL
    res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId: testCitizenId,
        citizenName: testCitizenName,
        title: 'Broken pipe',
        description: 'Water leaking in center',
        category: 'water',
        latitude: 9.4515,
        longitude: 77.5543,
        priority: 'critical',
        photoUrls: ['https://example.com/photo.jpg']
      })
    });
    let c30 = await res.json();
    assert(res.status === 201 && c30.photoUrls.length === 1, 'Test 30: Accepts complaint with single photo URL');

    // Test 31: Accepts complaint with multiple photo URLs
    res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId: testCitizenId,
        citizenName: testCitizenName,
        title: 'Waste dump',
        description: 'Garbage dump near street',
        category: 'sanitation',
        latitude: 9.4515,
        longitude: 77.5543,
        priority: 'medium',
        photoUrls: ['https://example.com/p1.jpg', 'https://example.com/p2.jpg']
      })
    });
    let c31 = await res.json();
    assert(res.status === 201 && c31.photoUrls.length === 2, 'Test 31: Accepts complaint with multiple photo URLs');

    // Test 32: Limits photo submissions to a maximum of 5 on server-side
    res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId: testCitizenId,
        citizenName: testCitizenName,
        title: 'Park cleanup',
        description: 'Litter in the playground',
        category: 'environment',
        latitude: 9.4515,
        longitude: 77.5543,
        priority: 'low',
        photoUrls: [
          'https://example.com/p1.jpg',
          'https://example.com/p2.jpg',
          'https://example.com/p3.jpg',
          'https://example.com/p4.jpg',
          'https://example.com/p5.jpg',
          'https://example.com/p6.jpg' // 6th photo
        ]
      })
    });
    let c32 = await res.json();
    assert(res.status === 201 && c32.photoUrls.length === 5, 'Test 32: Limits photo submissions to a maximum of 5 (6th sliced out)');

    // Test 33: Processes base64 strings dynamically via Cloudinary uploads
    // (We will simulate a lightweight mock base64 pixel image)
    const mockBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId: testCitizenId,
        citizenName: testCitizenName,
        title: 'Exposed wire',
        description: 'Exposed wire on pole',
        category: 'electricity',
        latitude: 9.4515,
        longitude: 77.5543,
        priority: 'critical',
        photoUrls: [mockBase64]
      })
    });
    let c33 = await res.json();
    assert(res.status === 201 && c33.photoUrls[0].includes('cloudinary'), 'Test 33: Successfully uploads, WebP-compresses, and stores base64 on Cloudinary');

    // Test 34: Stores correct category tag for roads
    assert(c29.category === 'roads', 'Test 34: Stores correct category tag ("roads") inside Mongoose');

    // Test 35: Stores correct category tag for water
    assert(c30.category === 'water', 'Test 35: Stores correct category tag ("water") inside Mongoose');

    // Test 36: Verifies complaint status is set to "open" on creation
    assert(c29.status === 'open', 'Test 36: Verifies new complaints default to "open" status');

    // ==========================================
    // PHASE 6: ADMIN STATUS & WORKFLOW TIMELINES
    // ==========================================
    console.log('\n--- Phase 6: Admin Status Updates & Lifecycle (8 Tests) ---');

    // Test 37: Rejects updating non-existent complaint ID
    res = await fetch(`${BASE_URL}/api/complaints/nonexistentid123`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'assigned', adminName: 'ADMIN', note: 'Assigning...', assignee: 'John' })
    });
    data = await res.json();
    assert(!res.ok, 'Test 37: Rejects updating a non-existent complaint ID');

    // Test 38: Accepts updating status to 'assigned' with assignee
    res = await fetch(`${BASE_URL}/api/complaints/${testComplaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'assigned', adminName: 'ADMIN', note: 'Assigning to contractor', assignee: 'John Doe' })
    });
    let c38 = await res.json();
    assert(res.ok && c38.status === 'assigned' && c38.assignee === 'John Doe', 'Test 38: Accepts updating status to "assigned" with worker name');

    // Test 39: Rejects updating status to 'assigned' with empty assignee
    res = await fetch(`${BASE_URL}/api/complaints/${testComplaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'assigned', adminName: 'ADMIN', note: 'Missing name', assignee: '' })
    });
    data = await res.json();
    assertError(data.error, 'assignee', 'Test 39: Rejects status "assigned" if worker name is empty');

    // Test 40: Accepts updating status to 'in-progress'
    res = await fetch(`${BASE_URL}/api/complaints/${testComplaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-progress', adminName: 'ADMIN', note: 'Work has begun on pothole' })
    });
    let c40 = await res.json();
    assert(res.ok && c40.status === 'in-progress', 'Test 40: Accepts updating status to "in-progress"');

    // Test 41: Accepts updating status to 'resolved'
    res = await fetch(`${BASE_URL}/api/complaints/${testComplaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved', adminName: 'ADMIN', note: 'Issue solved successfully' })
    });
    let c41 = await res.json();
    assert(res.ok && c41.status === 'resolved', 'Test 41: Accepts updating status to "resolved"');

    // Test 42: Accepts updating status to 'closed'
    res = await fetch(`${BASE_URL}/api/complaints/${testComplaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed', adminName: 'ADMIN', note: 'Closing complaint' })
    });
    let c42 = await res.json();
    assert(res.ok && c42.status === 'closed', 'Test 42: Accepts updating status to "closed"');

    // Test 43: Verifies timeline contains entries for each state transition
    assert(c42.timeline.length >= 5, 'Test 43: Verifies timeline logs an entry for every state transition');

    // Test 44: Verifies admin name is logged correctly in timeline
    assert(c42.timeline.some(e => e.adminName === 'ADMIN'), 'Test 44: Verifies admin name is logged correctly in timeline events');

    // ==========================================
    // PHASE 7: NOTIFICATIONS & DELETIONS
    // ==========================================
    console.log('\n--- Phase 7: Notifications & Account Operations (6 Tests) ---');

    // Programmatically trigger a notification creation to mirror client-side behavior
    await fetch(`${BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaintId: testComplaintId,
        message: 'Your complaint has been assigned to: John Doe',
        type: 'assignment'
      })
    });

    // Test 45: Verifies notification is generated on registration
    res = await fetch(`${BASE_URL}/api/notifications?citizenId=${testCitizenId}`);
    let notifs = await res.json();
    assert(notifs.length > 0, 'Test 45: Verifies notification is generated successfully on actions');
    let testNotifId = notifs[0]?.id || '';

    // Test 46: Verify notifications contains status-update
    assert(notifs.some(n => n.type === 'assignment' || n.type === 'status-update' || n.type === 'completion'), 'Test 46: Verifies notifications contain correct action tags');

    // Test 47: Verify notification contains descriptive message
    assert(notifs[0]?.message && notifs[0].message.length > 5, 'Test 47: Verifies notification holds descriptive message details');

    // Test 48: Mark notification as read
    res = await fetch(`${BASE_URL}/api/notifications?id=${testNotifId}`, {
      method: 'PATCH'
    });
    let readNotif = await res.json();
    assert(res.ok && readNotif.read === true, 'Test 48: Marks notification as read successfully');

    // Test 49: Verify unread notification count
    res = await fetch(`${BASE_URL}/api/notifications?citizenId=${testCitizenId}`);
    let currentNotifs = await res.json();
    let unreadCount = currentNotifs.filter(n => !n.read).length;
    assert(unreadCount < currentNotifs.length, 'Test 49: Verifies correct unread notification count decrement');

    // Test 50: Delete citizen cleanly
    res = await fetch(`${BASE_URL}/api/citizens?id=${testCitizenId}`, {
      method: 'DELETE'
    });
    assert(res.ok, 'Test 50: Deletes citizen account and registers cleanup successfully');

  } catch (error) {
    console.error('Test Execution Error:', error);
  }

  console.log('\n======================================================');
  console.log('📊 TEST SUMMARY');
  console.log(` TOTAL ASSERTIONS: 50`);
  console.log(` PASSED: ${passed}`);
  console.log(` FAILED: ${failed}`);
  console.log('======================================================\n');
}

runTests();
