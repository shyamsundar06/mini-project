const axios = require('axios');

async function testAll() {
  const baseURL = 'http://127.0.0.1:5000/api';
  console.log('--- Starting Intelligent Tourism Platform Backend Tests ---');

  try {
    // 1. Health check
    const health = await axios.get(`${baseURL}/health`);
    console.log('✅ 1. Health Check:', health.data);

    // 2. Auth Login
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'operator@tourism.com',
      password: 'Password123!'
    });
    console.log('✅ 2. Auth Login:', loginRes.data.success, 'User:', loginRes.data.user.name);
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Tours
    const toursRes = await axios.get(`${baseURL}/tours`);
    console.log('✅ 3. Tours Count:', toursRes.data.tours?.length);

    // 4. Tourists
    const touristsRes = await axios.get(`${baseURL}/tourists`);
    console.log('✅ 4. Tourists Count:', touristsRes.data.tourists?.length);

    // 5. Adaptive Groups & AI Clustering
    const groupsRes = await axios.get(`${baseURL}/groups?tour_id=tour_ooty_nilgiris`);
    console.log('✅ 5. Groups Count:', groupsRes.data.groups?.length);

    const aiGenRes = await axios.post(`${baseURL}/groups/generate-ai`, { tour_id: 'tour_ooty_nilgiris' }, authHeaders);
    console.log('✅ 6. AI Grouping Engine clusters generated:', aiGenRes.data.recommendedGroups?.length);

    // 6. Itinerary & Dynamic AI adaptation
    const itinRes = await axios.get(`${baseURL}/itineraries?tour_id=tour_ooty_nilgiris&day=1`);
    console.log('✅ 7. Itinerary Day 1 items count:', itinRes.data.itinerary?.items?.length);

    // 7. Multi-Agent AI Analysis
    const aiAnalysisRes = await axios.post(`${baseURL}/ai/analyze`, { tour_id: 'tour_ooty_nilgiris' }, authHeaders);
    console.log('✅ 8. Multi-Agent Coordinator Consensus:', aiAnalysisRes.data.analysis?.agent, 'Status:', aiAnalysisRes.data.analysis?.weather?.status);

    // 8. Multilingual Voice Assistant
    const voiceRes = await axios.post(`${baseURL}/ai/voice-query`, {
      tourist_id: 'trt_1',
      query_text: 'What is my next activity?',
      language: 'Tamil'
    });
    console.log('✅ 9. Voice Assistant Query (Tamil response):', voiceRes.data.response);

    // 9. Cost Estimators
    const tourCostRes = await axios.post(`${baseURL}/expenses/tour-cost`, {
      tourist_count: 16,
      transportation_cost: 42000,
      accommodation_cost: 68000,
      food_cost: 36000,
      activity_cost: 18400,
      guide_cost: 12000,
      misc_cost: 4600,
      contingency_percent: 5
    });
    console.log('✅ 10. Tour Cost Estimator Total:', tourCostRes.data.breakdown.totalTourCost, 'Per Person:', tourCostRes.data.breakdown.perPersonCost);

    const emgEstimateRes = await axios.post(`${baseURL}/expenses/emergency-estimate`, {
      distance_km: 18,
      available_reserve: 25000
    });
    console.log('✅ 11. Emergency Reserve Range:', emgEstimateRes.data.estimate.estimatedCostRange.formatted);

    // 10. Simulation GPS Step
    const simGpsRes = await axios.post(`${baseURL}/simulation/gps-step`);
    console.log('✅ 12. Simulation GPS Step:', simGpsRes.data.message);

    console.log('\n🎉 ALL 12 BACKEND TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}

testAll();
