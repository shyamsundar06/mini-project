const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const coordinatorAgent = require('../agents/CoordinatorAgent');
const weatherAgent = require('../agents/WeatherAgent');
const { GoogleGenAI } = require('@google/genai');

/**
 * Execute Multi-Agent AI evaluation
 */
exports.runAIAnalysis = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris', simulationOptions = {} } = req.body;

        const tourists = await query('SELECT * FROM tourists WHERE tour_id = ?', [tour_id]);
        const items = await query(`
            SELECT ii.*, a.activity_type, a.is_weather_sensitive
            FROM itinerary_items ii
            LEFT JOIN activities a ON ii.activity_id = a.id
            WHERE ii.itinerary_id = 'itin_day1_main'
        `);

        const analysis = await coordinatorAgent.synthesize({
            tourId: tour_id,
            latitude: 11.4190,
            longitude: 76.7112,
            itineraryItems: items,
            tourists,
            simulationOptions
        });

        // Store generated recommendation in database if novel
        if (analysis.recommendation) {
            const recId = `rec_${uuidv4().substring(0, 8)}`;
            await query(`
                INSERT INTO ai_recommendations (id, tour_id, agent_source, recommendation_text, reason, confidence_score, affected_groups, affected_activities, suggested_alternative, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
            `, [
                recId,
                tour_id,
                'Coordinator Agent (Multi-Agent System)',
                analysis.recommendation.recommendation,
                analysis.recommendation.reason,
                analysis.recommendation.confidence || 0.95,
                Array.isArray(analysis.recommendation.affectedGroups) ? analysis.recommendation.affectedGroups.join(', ') : analysis.recommendation.affectedGroups,
                Array.isArray(analysis.recommendation.affectedActivities) ? analysis.recommendation.affectedActivities.join(', ') : analysis.recommendation.affectedActivities,
                analysis.recommendation.suggestedAlternative || '',
            ]);
        }

        // Broadcast to operator dashboards
        if (req.app.get('io')) {
            req.app.get('io').emit('ai:recommendation', {
                recommendation: analysis.recommendation,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ success: true, analysis });
    } catch (err) {
        console.error('[AIController] runAIAnalysis error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getRecommendations = async (req, res) => {
    try {
        const { tour_id = 'tour_ooty_nilgiris' } = req.query;
        const recommendations = await query('SELECT * FROM ai_recommendations WHERE tour_id = ? ORDER BY created_at DESC LIMIT 20', [tour_id]);
        res.json({ success: true, recommendations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.respondRecommendation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status = 'APPROVED' } = req.body;

        await query('UPDATE ai_recommendations SET status = ? WHERE id = ?', [status, id]);

        if (status === 'APPROVED') {
            // Automatically adapt itinerary
            await query(`
                UPDATE itinerary_items SET
                    title = 'Tea Museum Multimedia Cinema & Chocolate Masterclass (Indoor)',
                    description = 'Indoor interactive tea tasting, documentary screening, and homemade artisanal chocolate masterclass.',
                    location_name = 'Tea Museum & Chocolate Studio',
                    latitude = 11.4235,
                    longitude = 76.7325,
                    is_alternative = 1,
                    status = 'REPLACED',
                    weather_alert = 'Adapted by AI Coordinator due to mountain thunderstorm.'
                WHERE itinerary_id = 'itin_day1_main' AND (title LIKE '%Doddabetta%' OR title LIKE '%Peak%')
            `);
        }

        if (req.app.get('io')) {
            req.app.get('io').emit('itinerary:update', { message: `Recommendation ${status.toLowerCase()}` });
            req.app.get('io').emit('ai:recommendation', { id, status });
        }

        res.json({ success: true, message: `Recommendation ${status.toLowerCase()} successfully.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Multilingual Tourist Voice Assistant Query Resolver
 */
exports.handleVoiceQuery = async (req, res) => {
    try {
        const { tourist_id = 'trt_1', query_text, language = 'English' } = req.body;

        if (!query_text) {
            return res.status(400).json({ success: false, message: 'Query text is required' });
        }

        // Fetch tourist context
        const tourists = await query(`
            SELECT t.*, g.name as group_name, g.leader_name, g.leader_phone, tr.title as tour_title
            FROM tourists t
            LEFT JOIN groups g ON t.group_id = g.id
            LEFT JOIN tours tr ON t.tour_id = tr.id
            WHERE t.id = ?
        `, [tourist_id]);

        const tourist = tourists[0] || { name: 'Tourist', preferred_language: language };

        // Fetch next activity and weather
        const items = await query(`
            SELECT * FROM itinerary_items 
            WHERE itinerary_id = 'itin_day1_main' 
            ORDER BY order_index ASC
        `);
        const nextActivity = items.find(i => i.status === 'SCHEDULED' || i.status === 'REPLACED') || items[1];
        const weather = await weatherAgent.analyze(11.4190, 76.7112);

        const lowerQ = query_text.toLowerCase();
        let englishAnswer = "";

        if (lowerQ.includes('group') || lowerQ.includes('where is')) {
            englishAnswer = `You are in ${tourist.group_name || 'Group Alpha'}. Your group leader is ${tourist.leader_name || 'Rahul Kumar'}. Your group is currently near the Ooty Botanical Gardens Italian terrace.`;
        } else if (lowerQ.includes('next') || lowerQ.includes('activity') || lowerQ.includes('schedule')) {
            englishAnswer = `Your next activity is "${nextActivity?.title || 'Botanical Garden Heritage Walk'}" at ${nextActivity?.start_time || '09:30 AM'}. Location: ${nextActivity?.location_name || 'Ooty Botanical Gardens'}.`;
        } else if (lowerQ.includes('rain') || lowerQ.includes('weather')) {
            englishAnswer = `Current weather is ${weather.condition} at ${weather.currentTemperature}°C with ${weather.rainProbability}% rain probability. ${weather.isDisruptive ? 'Heavy rain is expected; our AI has scheduled indoor alternatives.' : 'Conditions are pleasant for sightseeing.'}`;
        } else if (lowerQ.includes('where') && lowerQ.includes('go')) {
            englishAnswer = `Head towards ${nextActivity?.location_name || 'Ooty Botanical Gardens'}. Keep with ${tourist.group_name || 'your group'} members and follow the live path on your map.`;
        } else {
            englishAnswer = `Hello ${tourist.name}! You are on the "${tourist.tour_title || 'Nilgiris Grand Tour'}". Your next stop is ${nextActivity?.title} at ${nextActivity?.start_time}. Feel free to ask about your group, next activity, or the weather!`;
        }

        // Multilingual Translation Support for 6 languages
        const translations = {
            Tamil: {
                group: `நீங்கள் ${tourist.group_name || 'குரூப் ஆல்பா'}வில் உள்ளீர்கள். உங்கள் குழுத் தலைவர் ${tourist.leader_name || 'ராகுல் குமார்'}. உங்கள் குழு தாவரவியல் பூங்கா அருகே உள்ளது.`,
                activity: `உங்கள் அடுத்த நிகழ்வு: "${nextActivity?.title}" நேரம்: ${nextActivity?.start_time}. இடம்: ${nextActivity?.location_name}.`,
                weather: `தற்போதைய வானிலை: ${weather.condition}, வெப்பநிலை ${weather.currentTemperature}°C. மழை வாய்ப்பு ${weather.rainProbability}%.`,
                default: `வணக்கம் ${tourist.name}! உங்கள் அடுத்த நிகழ்வு ${nextActivity?.title} (${nextActivity?.start_time}).`
            },
            Hindi: {
                group: `आप ${tourist.group_name || 'ग्रुप अल्फा'} में हैं। आपके ग्रुप लीडर ${tourist.leader_name || 'राहुल कुमार'} हैं।`,
                activity: `आपकी अगली गतिविधि "${nextActivity?.title}" ${nextActivity?.start_time} बजे है। स्थान: ${nextActivity?.location_name}।`,
                weather: `वर्तमान मौसम ${weather.condition} है, तापमान ${weather.currentTemperature}°C और बारिश की संभावना ${weather.rainProbability}% है।`,
                default: `नमस्ते ${tourist.name}! आपका अगला पड़ाव ${nextActivity?.title} (${nextActivity?.start_time}) है।`
            },
            Malayalam: {
                group: `നിങ്ങൾ ${tourist.group_name || 'ഗ്രൂപ്പ് ആൽഫ'}യിലാണ്. നിങ്ങളുടെ ഗ്രൂപ്പ് ലീഡർ ${tourist.leader_name || 'രാഹുൽ കുമാർ'} ആണ്.`,
                activity: `നിങ്ങളുടെ അടുത്ത പ്രവർത്തനം: "${nextActivity?.title}", സമയം: ${nextActivity?.start_time}. സ്ഥലം: ${nextActivity?.location_name}.`,
                weather: `ഇപ്പോഴത്തെ കാലാവസ്ഥ: ${weather.condition}, താപനില ${weather.currentTemperature}°C. മഴ സാധ്യത ${weather.rainProbability}%.`,
                default: `നമസ്കാരം ${tourist.name}! നിങ്ങളുടെ അടുത്ത ആക്റ്റിവിറ്റി ${nextActivity?.title} (${nextActivity?.start_time}) ആണ്.`
            },
            Telugu: {
                group: `మీరు ${tourist.group_name || 'గ్రూప్ ఆల్ఫా'}లో ఉన్నారు. మీ గ్రూప్ లీడర్ ${tourist.leader_name || 'రాహుల్ కుమార్'}.`,
                activity: `మీ తదుపరి కార్యాచరణ: "${nextActivity?.title}" సమయం: ${nextActivity?.start_time}. స్థలం: ${nextActivity?.location_name}.`,
                weather: `ప్రస్తుత వాతావరణం: ${weather.condition}, ఉష్ణోగ్రత ${weather.currentTemperature}°C. వర్షం సంభావ్యత ${weather.rainProbability}%.`,
                default: `నమస్కారం ${tourist.name}! మీ తదుపరి కార్యక్రమం ${nextActivity?.title} (${nextActivity?.start_time}).`
            },
            Kannada: {
                group: `ನೀವು ${tourist.group_name || 'ಗ್ರೂಪ್ ಆಲ್ಫಾ'}ದಲ್ಲಿದ್ದೀರಿ. ನಿಮ್ಮ ಗುಂಪಿನ ನಾಯಕರು ${tourist.leader_name || 'ರಾಹುಲ್ ಕುಮಾರ್'}.`,
                activity: `ನಿಮ್ಮ ಮುಂದಿನ ಚಟುವಟಿಕೆ: "${nextActivity?.title}" ಸಮಯ: ${nextActivity?.start_time}. ಸ್ಥಳ: ${nextActivity?.location_name}.`,
                weather: `ಪ್ರಸ್ತುತ ಹವಾಮಾನ: ${weather.condition}, ತಾಪಮಾನ ${weather.currentTemperature}°C. ಮಳೆಯ ಸಾಧ್ಯತೆ ${weather.rainProbability}%.`,
                default: `ನಮಸ್ಕಾರ ${tourist.name}! ನಿಮ್ಮ ಮುಂದಿನ ಸ್ಥಳ ${nextActivity?.title} (${nextActivity?.start_time}).`
            }
        };

        let localizedAnswer = englishAnswer;
        if (translations[language]) {
            if (lowerQ.includes('group') || lowerQ.includes('where is')) localizedAnswer = translations[language].group;
            else if (lowerQ.includes('next') || lowerQ.includes('activity')) localizedAnswer = translations[language].activity;
            else if (lowerQ.includes('rain') || lowerQ.includes('weather')) localizedAnswer = translations[language].weather;
            else localizedAnswer = translations[language].default;
        }

        res.json({
            success: true,
            language,
            query: query_text,
            response: localizedAnswer,
            context: {
                touristName: tourist.name,
                groupName: tourist.group_name,
                nextActivityTitle: nextActivity?.title,
                nextActivityTime: nextActivity?.start_time,
                weatherCondition: weather.condition,
                rainProbability: weather.rainProbability
            }
        });
    } catch (err) {
        console.error('[AIController] handleVoiceQuery error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
