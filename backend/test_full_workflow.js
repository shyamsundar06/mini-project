const axios = require('axios');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING FULL INTEGRATION TEST ON NEW PORTS');
  console.log('   Operator: http://localhost:4000');
  console.log('   Tourist:  http://localhost:9000');
  console.log('   Backend:  http://localhost:5000');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Port 5000 Backend Health
  try {
    const res = await axios.get('http://localhost:5000/api/health');
    console.log('✅ TEST 1: Backend Health Check on Port 5000 passed.');
    console.log('   Response:', res.data.message);
    passed++;
  } catch (e) {
    console.error('❌ TEST 1 FAILED:', e.message);
    failed++;
  }

  // 2. Port 4000 Operator UI
  try {
    const res = await axios.get('http://localhost:4000/');
    if (res.status === 200 && res.data.includes('<html')) {
      console.log('✅ TEST 2: Tour Operator Dashboard on Port 4000 responded (HTTP 200).');
      passed++;
    } else {
      throw new Error('Unexpected status: ' + res.status);
    }
  } catch (e) {
    console.error('❌ TEST 2 FAILED:', e.message);
    failed++;
  }

  // 3. Port 9000 Tourist UI
  try {
    const res = await axios.get('http://localhost:9000/');
    if (res.status === 200 && res.data.includes('<html')) {
      console.log('✅ TEST 3: Tourist Mobile Portal on Port 9000 responded (HTTP 200).');
      passed++;
    } else {
      throw new Error('Unexpected status: ' + res.status);
    }
  } catch (e) {
    console.error('❌ TEST 3 FAILED:', e.message);
    failed++;
  }

  // 4. Test Tourist Booking for Sonika
  let bookedTouristId = null;
  try {
    const bookingPayload = {
      user_id: 'usr_sonika',
      tourist_name: 'Sonika',
      tour_id: 'tour_ooty_nilgiris',
      package_title: 'Nilgiris Grand Mountain Heritage',
      duration: '4 Days / 3 Nights',
      language: 'English',
      preferences: {
        walking_preference: 'Moderate',
        activity_preference: 'Cultural',
        interests: 'Tea estates, Botanical Gardens',
        dietary_pref: 'Vegetarian',
        emergency_contact_name: 'Emergency Contact',
        emergency_contact_phone: '+91 98451 11111'
      }
    };
    const bookRes = await axios.post('http://localhost:5000/api/tourists/book', bookingPayload);
    bookedTouristId = bookRes.data.touristId;
    console.log('✅ TEST 4: Tour Booking for Sonika succeeded!');
    console.log('   Assigned Group:', bookRes.data.assignedGroup);
    console.log('   Tourist ID:', bookedTouristId);
    passed++;
  } catch (e) {
    console.error('❌ TEST 4 FAILED:', e.response?.data || e.message);
    failed++;
  }

  // 5. Verify Sonika reflects in Tourist list
  try {
    const listRes = await axios.get('http://localhost:5000/api/tourists');
    const tourists = listRes.data.tourists || [];
    const sonika = tourists.find(t => t.name.toLowerCase() === 'sonika');
    if (sonika) {
      console.log('✅ TEST 5: Sonika successfully verified in active tourists list.');
      console.log('   Name:', sonika.name, '| Group:', sonika.group_name, '| Status:', sonika.status);
      passed++;
    } else {
      throw new Error('Sonika not found in tourists list');
    }
  } catch (e) {
    console.error('❌ TEST 5 FAILED:', e.message);
    failed++;
  }

  // 6. Test Emergency SOS for Sonika
  let emergencyId = null;
  try {
    const sosPayload = {
      tourist_id: bookedTouristId || 'trt_sonika',
      tourist_name: 'Sonika',
      group_name: 'Group Beta',
      tour_id: 'tour_ooty_nilgiris',
      latitude: 11.4192,
      longitude: 76.7115,
      emergency_type: 'MEDICAL',
      message: 'Acute asthma attack near Doddabetta Peak. Immediate oxygen required.'
    };
    const sosRes = await axios.post('http://localhost:5000/api/emergencies/sos', sosPayload);
    emergencyId = sosRes.data.emergency?.id;
    const alertName = sosRes.data.emergency?.tourist_name;
    if (alertName === 'Sonika') {
      console.log('✅ TEST 6: Emergency SOS triggered with correct name: "Sonika"!');
      console.log('   Emergency ID:', emergencyId);
      console.log('   Assigned Responder:', sosRes.data.emergency?.triage?.nearestSupport?.name);
      passed++;
    } else {
      throw new Error(`Expected tourist_name "Sonika" but got "${alertName}"`);
    }
  } catch (e) {
    console.error('❌ TEST 6 FAILED:', e.response?.data || e.message);
    failed++;
  }

  // 7. Verify Emergency displays in Emergencies Panel
  try {
    const emgListRes = await axios.get('http://localhost:5000/api/emergencies');
    const emergencies = emgListRes.data.emergencies || [];
    const sonikaEmergency = emergencies.find(e => e.tourist_name === 'Sonika' && e.status === 'ACTIVE');
    if (sonikaEmergency) {
      console.log('✅ TEST 7: Emergency successfully listed in Emergencies Panel query!');
      console.log('   Tourist:', sonikaEmergency.tourist_name);
      console.log('   Type:', sonikaEmergency.emergency_type);
      console.log('   Priority:', sonikaEmergency.priority);
      passed++;
    } else {
      throw new Error('Sonika emergency not found in emergencies list');
    }
  } catch (e) {
    console.error('❌ TEST 7 FAILED:', e.message);
    failed++;
  }

  // 8. Test Tourist Deletion by Operator
  try {
    // Authenticate operator
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'operator@tourism.com',
      password: 'Password123!'
    });
    const token = loginRes.data.token;

    // Delete Sonika
    const targetId = bookedTouristId || 'trt_sonika';
    const delRes = await axios.delete(`http://localhost:5000/api/tourists/${targetId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ TEST 8: Tourist deletion API succeeded for ID:', targetId);

    // Verify Sonika is no longer in active tourists
    const checkRes = await axios.get('http://localhost:5000/api/tourists');
    const stillThere = (checkRes.data.tourists || []).some(t => t.id === targetId || t.name.toLowerCase() === 'sonika');
    if (!stillThere) {
      console.log('✅ TEST 9: Verified Sonika is successfully removed from active tourists list.');
      passed += 2;
    } else {
      throw new Error('Tourist was not removed from database');
    }
  } catch (e) {
    console.error('❌ TEST 8/9 FAILED:', e.response?.data || e.message);
    failed++;
  }

  // 10. Test Repeat Booking Cycle (Book again -> Verify -> Delete again -> Add manually -> Delete again)
  try {
    console.log('\n--- TESTING REPEAT BOOKING & REMOVAL CYCLES ---');
    const bookingPayload = {
      user_id: 'usr_sonika',
      tourist_name: 'Sonika',
      tour_id: 'tour_ooty_nilgiris',
      package_title: 'Nilgiris Grand Mountain Heritage',
      duration: '4 Days / 3 Nights',
      language: 'English',
      preferences: {
        walking_preference: 'Moderate',
        activity_preference: 'Cultural',
        interests: 'Tea estates, Botanical Gardens',
        dietary_pref: 'Vegetarian'
      }
    };

    // Cycle 2: Re-book
    const reBookRes = await axios.post('http://localhost:5000/api/tourists/book', bookingPayload);
    if (!reBookRes.data.success) throw new Error('Re-booking failed');
    console.log('✅ TEST 10: Repeat booking #2 for Sonika succeeded without error!');

    // Verify in tourists list
    let listRes = await axios.get('http://localhost:5000/api/tourists');
    let hasSonika = (listRes.data.tourists || []).some(t => t.name.toLowerCase() === 'sonika');
    if (!hasSonika) throw new Error('Re-booked Sonika missing from tourist list');
    console.log('✅ TEST 11: Re-booked Sonika verified in tourists list.');

    // Authenticate operator
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'operator@tourism.com',
      password: 'Password123!'
    });
    const token = loginRes.data.token;

    // Delete again
    await axios.delete(`http://localhost:5000/api/tourists/${reBookRes.data.touristId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ TEST 12: Repeat removal #2 for Sonika succeeded without error!');

    // Cycle 3: Re-book third time
    const reBookRes3 = await axios.post('http://localhost:5000/api/tourists/book', bookingPayload);
    if (!reBookRes3.data.success) throw new Error('Third booking failed');
    console.log('✅ TEST 13: Repeat booking #3 for Sonika succeeded without error!');

    // Clean up
    await axios.delete(`http://localhost:5000/api/tourists/${reBookRes3.data.touristId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ TEST 14: Repeat removal #3 succeeded cleanly!');

    passed += 5;
  } catch (e) {
    console.error('❌ REPEAT CYCLE TEST FAILED:', e.response?.data || e.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
}

runTests();

