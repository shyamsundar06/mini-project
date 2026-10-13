const { query } = require('./config/db');

async function seedFresh15() {
  console.log('--- 1. Wiping old tourist data ---');
  await query('DELETE FROM group_members');
  await query('DELETE FROM tourist_preferences');
  await query('DELETE FROM tourist_locations');
  await query('DELETE FROM emergencies');
  await query('DELETE FROM emergency_expenses');
  await query('DELETE FROM broadcast_acks');
  try { await query('DELETE FROM tourist_feedback'); } catch (e) {}
  await query('DELETE FROM tourists');
  console.log('Old tourists wiped.');

  console.log('--- 2. Inserting 15 Fresh Tourists ---');
  const tourists = [
    // Group Alpha (5 Fast/Trekkers)
    { id: 'trt_1', user_id: 'usr_tourist_1', group_id: 'grp_alpha', name: 'Aarav Nambiar', age: 27, gender: 'Male', lang: 'Tamil', pace: 'Fast', act: 'Adventurous', interests: 'Photography, Trekking, Wildlife', acc: 'None', lat: 11.4192, lng: 76.7115, score: 96 },
    { id: 'trt_2', user_id: 'usr_tourist_2', group_id: 'grp_alpha', name: 'Diya Sengupta', age: 25, gender: 'Female', lang: 'Bengali', pace: 'Fast', act: 'Adventurous', interests: 'Trail Running, Mountain biking, Flora', acc: 'None', lat: 11.4194, lng: 76.7118, score: 95 },
    { id: 'trt_3', user_id: 'usr_tourist_3', group_id: 'grp_alpha', name: 'Siddharth Roy', age: 29, gender: 'Male', lang: 'Hindi', pace: 'Fast', act: 'Nature', interests: 'Bird watching, Botany, Peak climbing', acc: 'None', lat: 11.4188, lng: 76.7110, score: 94 },
    { id: 'trt_4', user_id: 'usr_tourist_4', group_id: 'grp_alpha', name: 'Ananya Patel', age: 26, gender: 'Female', lang: 'Gujarati', pace: 'Fast', act: 'Adventurous', interests: 'Trekking, Rock climbing, Vlogging', acc: 'None', lat: 11.4190, lng: 76.7120, score: 97 },
    { id: 'trt_5', user_id: 'usr_tourist_5', group_id: 'grp_alpha', name: 'Karthik Raja', age: 28, gender: 'Male', lang: 'Tamil', pace: 'Fast', act: 'Nature', interests: 'Off-road exploration, Astronomy, Filming', acc: 'None', lat: 11.4195, lng: 76.7116, score: 93 },

    // Group Beta (5 Moderate/Heritage)
    { id: 'trt_6', user_id: 'usr_tourist_6', group_id: 'grp_beta', name: 'Rajeshwar Iyer', age: 39, gender: 'Male', lang: 'Tamil', pace: 'Moderate', act: 'Cultural', interests: 'Colonial History, Temple Architecture, Tea Tasting', acc: 'None', lat: 11.4180, lng: 76.7100, score: 92 },
    { id: 'trt_7', user_id: 'usr_tourist_7', group_id: 'grp_beta', name: 'Shalini Verma', age: 41, gender: 'Female', lang: 'Hindi', pace: 'Moderate', act: 'Cultural', interests: 'Antiques, Colonial Heritage, Botanical Painting', acc: 'None', lat: 11.4184, lng: 76.7105, score: 91 },
    { id: 'trt_8', user_id: 'usr_tourist_8', group_id: 'grp_beta', name: 'Kavitha Reddy', age: 37, gender: 'Female', lang: 'Telugu', pace: 'Moderate', act: 'Cultural', interests: 'Handicrafts, Nilgiri Tribes, Heritage Walk', acc: 'None', lat: 11.4182, lng: 76.7103, score: 90 },
    { id: 'trt_9', user_id: 'usr_tourist_9', group_id: 'grp_beta', name: 'Arjun Deshmukh', age: 34, gender: 'Male', lang: 'Marathi', pace: 'Moderate', act: 'Cultural', interests: 'Tea Degustation, Libraries, Photography', acc: 'None', lat: 11.4181, lng: 76.7108, score: 94 },
    { id: 'trt_10', user_id: 'usr_tourist_10', group_id: 'grp_beta', name: 'Sneha Menon', age: 33, gender: 'Female', lang: 'Malayalam', pace: 'Moderate', act: 'Nature', interests: 'Spice gardens, Eco-farms, Nature Trails', acc: 'None', lat: 11.4186, lng: 76.7102, score: 93 },

    // Group Gamma (5 Slow/Leisure)
    { id: 'trt_11', user_id: 'usr_tourist_11', group_id: 'grp_gamma', name: 'Dr. Suresh Hegde', age: 64, gender: 'Male', lang: 'Kannada', pace: 'Slow', act: 'Relaxed', interests: 'Botanical walks, Meditation, Tea salons', acc: 'Walking Cane', lat: 11.4175, lng: 76.7092, score: 88 },
    { id: 'trt_12', user_id: 'usr_tourist_12', group_id: 'grp_gamma', name: 'Meera Subramanian', age: 61, gender: 'Female', lang: 'Tamil', pace: 'Slow', act: 'Relaxed', interests: 'Spiritual sites, Flower shows, Classical music', acc: 'Needs ramp access', lat: 11.4173, lng: 76.7090, score: 90 },
    { id: 'trt_13', user_id: 'usr_tourist_13', group_id: 'grp_gamma', name: 'Girish Kulkarni', age: 65, gender: 'Male', lang: 'Kannada', pace: 'Slow', act: 'Relaxed', interests: 'Lake promenades, Bird listening, History books', acc: 'Mild arthritis', lat: 11.4174, lng: 76.7088, score: 87 },
    { id: 'trt_14', user_id: 'usr_tourist_14', group_id: 'grp_gamma', name: 'Laxmi Rao', age: 62, gender: 'Female', lang: 'Telugu', pace: 'Slow', act: 'Relaxed', interests: 'Herbal gardens, Souvenirs, Calm viewpoints', acc: 'Mild asthma', lat: 11.4172, lng: 76.7094, score: 86 },
    { id: 'trt_15', user_id: 'usr_tourist_15', group_id: 'grp_gamma', name: 'Amitabh Sen', age: 60, gender: 'Male', lang: 'English', pace: 'Slow', act: 'Relaxed', interests: 'Historical archives, Tea factory, Scenic drives', acc: 'None', lat: 11.4176, lng: 76.7091, score: 89 }
  ];

  for (const t of tourists) {
    await query(`
      INSERT INTO tourists (
        id, user_id, tour_id, group_id, name, age, gender,
        preferred_language, walking_preference, activity_preference,
        interests, accessibility_requirements, emergency_contact_name,
        emergency_contact_phone, current_latitude, current_longitude, status
      ) VALUES (?, ?, 'tour_ooty_nilgiris', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Family Contact', '+91 98451 00000', ?, ?, 'ACTIVE')
    `, [t.id, t.user_id, t.group_id, t.name, t.age, t.gender, t.lang, t.pace, t.act, t.interests, t.acc, t.lat, t.lng]);

    await query(`
      INSERT INTO tourist_preferences (id, tourist_id, pace_level, dietary_pref, physical_ability, budget_tier, special_notes)
      VALUES (?, ?, ?, 'Vegetarian', 'Good', 'Standard', 'Enthusiastic explorer')
    `, ['pref_' + t.id, t.id, t.pace === 'Fast' ? 4 : t.pace === 'Slow' ? 2 : 3]);

    await query(`
      INSERT INTO group_members (id, group_id, tourist_id, compatibility_score)
      VALUES (?, ?, ?, ?)
    `, ['gm_' + t.id, t.group_id, t.id, t.score]);
  }

  const count = await query('SELECT count(*) as c FROM tourists');
  console.log('Seeded fresh 15 tourists. Total count:', count[0].c);

  const groupCounts = await query('SELECT group_id, count(*) as cnt FROM tourists GROUP BY group_id');
  console.log('Group distribution:', groupCounts);
}

seedFresh15().then(() => {
  console.log('Database successfully re-seeded with 15 fresh tourists!');
  process.exit(0);
}).catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
