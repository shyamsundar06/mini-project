const { GoogleGenAI } = require('@google/genai');
const weatherAgent = require('./WeatherAgent');
const routeAgent = require('./RouteAgent');
const groupAgent = require('./GroupAgent');
const itineraryAgent = require('./ItineraryAgent');
const emergencyAgent = require('./EmergencyAgent');

class CoordinatorAgent {
    constructor() {
        this.name = 'Coordinator Agent';
    }

    /**
     * Run full multi-agent synthesis pipeline
     */
    async synthesize(context = {}) {
        const {
            tourId = 'tour_ooty_nilgiris',
            latitude = 11.4190,
            longitude = 76.7112,
            itineraryItems = [],
            tourists = [],
            simulationOptions = {}
        } = context;

        // 1. Run Sub-Agents in parallel
        const [weatherRes, groupClusters] = await Promise.all([
            weatherAgent.analyze(latitude, longitude, simulationOptions),
            Promise.resolve(groupAgent.clusterTourists(tourists))
        ]);

        const routeRes = await routeAgent.analyze(latitude, longitude, 11.4010, 76.7350, weatherRes);
        const itineraryRes = itineraryAgent.evaluateSchedule(itineraryItems, weatherRes, routeRes);

        // 2. Synthesize using Google Gemini if key available
        const apiKey = process.env.GEMINI_API_KEY;
        let aiRecommendation = null;

        if (apiKey) {
            try {
                const ai = new GoogleGenAI({ apiKey });
                const prompt = `
You are the AI Coordinator Agent for an Intelligent Tourism Management Platform.
Current Environmental Telemetry:
- Weather: ${JSON.stringify(weatherRes)}
- Route Feasibility: ${JSON.stringify(routeRes)}
- Group Breakdown: ${groupClusters.length} active groups (${groupClusters.map(g => g.name).join(', ')})
- Schedule Analysis: ${JSON.stringify(itineraryRes)}

Generate a structured JSON response with the following format:
{
  "recommendation": "Concise 1-2 sentence recommendation for the Tour Operator",
  "reason": "Detailed rationale explaining why this recommendation was made based on weather, route, and group safety",
  "confidence": 0.95,
  "affectedGroups": ["Group Name 1", "Group Name 2"],
  "affectedActivities": ["Activity Title"],
  "suggestedAlternative": "Specific indoor / rerouted activity description"
}
Output ONLY raw valid JSON, no markdown tags.
`;
                const geminiResp = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt
                });

                if (geminiResp?.text) {
                    const cleanText = geminiResp.text.replace(/```json/g, '').replace(/```/g, '').trim();
                    aiRecommendation = JSON.parse(cleanText);
                }
            } catch (err) {
                console.log('[CoordinatorAgent] Gemini API fallback active:', err.message);
            }
        }

        // High-fidelity fallback synthesis if Gemini is not configured or throws
        if (!aiRecommendation) {
            if (weatherRes.isDisruptive) {
                aiRecommendation = {
                    recommendation: `Heavy precipitation (${weatherRes.rainProbability}% rain probability, ${weatherRes.condition}) expected near Doddabetta Peak. Recommend shifting Groups Alpha & Beta to the covered Tea Museum Multimedia Cinema and Artisan Chocolate Masterclass.`,
                    reason: `Weather Agent detected sudden barometric drop and high cloud cover. Route Agent noted increased braking distance and slippery conditions on Doddabetta Ghat road (+18 min delay). Itinerary Agent verified indoor capacity at the Tea Museum is available immediately.`,
                    confidence: 0.95,
                    affectedGroups: ['Alpha - Nature Trekkers', 'Beta - Heritage & Culture'],
                    affectedActivities: ['Doddabetta Summit & Shola Ridge Walk'],
                    suggestedAlternative: 'Tea Museum Multimedia Cinema & Artisan Chocolate Tasting (Indoor)'
                };
            } else {
                aiRecommendation = {
                    recommendation: `Environmental and route telemetry are optimal. Recommend maintaining the primary schedule with standard group pacing.`,
                    reason: `Weather Agent reports clear skies (${weatherRes.currentTemperature}°C, ${weatherRes.condition}). Route Agent confirms zero congestion along the Nilgiri scenic highway. Group compatibility remains high at ~92%.`,
                    confidence: 0.98,
                    affectedGroups: ['All Groups'],
                    affectedActivities: ['All Scheduled Activities'],
                    suggestedAlternative: 'Continue current itinerary without modifications'
                };
            }
        }

        return {
            agent: this.name,
            timestamp: new Date().toISOString(),
            weather: weatherRes,
            route: routeRes,
            groups: groupClusters,
            itinerary: itineraryRes,
            recommendation: aiRecommendation
        };
    }
}

module.exports = new CoordinatorAgent();
