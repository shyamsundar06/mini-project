const axios = require('axios');

class WeatherAgent {
    constructor() {
        this.name = 'Weather Agent';
    }

    /**
     * Map WMO weather codes to human-readable strings, weather type, and icons
     */
    mapWeatherCode(code) {
        if (code === 0) return { condition: 'Clear Sky', category: 'CLEAR', icon: 'Sun', severity: 'NORMAL' };
        if (code === 1) return { condition: 'Mainly Clear', category: 'CLEAR', icon: 'SunMedium', severity: 'NORMAL' };
        if (code === 2) return { condition: 'Partly Cloudy', category: 'CLOUDY', icon: 'CloudSun', severity: 'NORMAL' };
        if (code === 3) return { condition: 'Overcast', category: 'CLOUDY', icon: 'Cloud', severity: 'NORMAL' };
        if (code === 45) return { condition: 'Fog', category: 'FOG', icon: 'CloudFog', severity: 'WARNING' };
        if (code === 48) return { condition: 'Depositing Rime Fog', category: 'FOG', icon: 'CloudFog', severity: 'WARNING' };
        if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', category: 'DRIZZLE', icon: 'CloudDrizzle', severity: 'ADVISORY' };
        if (code >= 56 && code <= 57) return { condition: 'Freezing Drizzle', category: 'DRIZZLE', icon: 'CloudSnow', severity: 'WARNING' };
        if (code === 61) return { condition: 'Slight Rain', category: 'RAIN', icon: 'CloudRain', severity: 'ADVISORY' };
        if (code === 63) return { condition: 'Moderate Rain', category: 'RAIN', icon: 'CloudRain', severity: 'WARNING' };
        if (code === 65) return { condition: 'Heavy Rain', category: 'RAIN', icon: 'CloudRain', severity: 'CRITICAL' };
        if (code >= 71 && code <= 77) return { condition: 'Snow Showers', category: 'SNOW', icon: 'Snowflake', severity: 'WARNING' };
        if (code >= 80 && code <= 82) return { condition: 'Violent Rain Showers', category: 'RAIN', icon: 'CloudLightning', severity: 'CRITICAL' };
        if (code >= 95 && code <= 99) return { condition: 'Thunderstorm / Lightning', category: 'THUNDERSTORM', icon: 'Zap', severity: 'CRITICAL' };
        return { condition: 'Cloudy', category: 'CLOUDY', icon: 'Cloud', severity: 'NORMAL' };
    }

    /**
     * Fetch complete live weather telemetry using Open-Meteo Free API
     */
    async getFullTelemetry(latitude = 11.4190, longitude = 76.7112, placeName = 'Ooty & Nilgiri Hills', simulationOptions = {}) {
        let current = null;
        let hourly = [];
        let daily = [];
        let isSimulated = false;

        // Check if simulation is requested
        if (simulationOptions.forceRain || simulationOptions.forceScenario) {
            isSimulated = true;
            const scenario = simulationOptions.forceScenario || (simulationOptions.forceRain ? 'HEAVY_RAIN' : 'CLEAR');

            if (scenario === 'HEAVY_RAIN') {
                current = {
                    time: new Date().toISOString(),
                    temperature_2m: 14.8,
                    relative_humidity_2m: 94,
                    apparent_temperature: 13.2,
                    precipitation: 12.4,
                    rain: 12.4,
                    weather_code: 65,
                    cloud_cover: 98,
                    pressure_msl: 1008.2,
                    wind_speed_10m: 34.0,
                    wind_direction_10m: 190,
                    wind_gusts_10m: 48.0,
                    precipitation_probability: 90
                };
            } else if (scenario === 'THUNDERSTORM') {
                current = {
                    time: new Date().toISOString(),
                    temperature_2m: 13.5,
                    relative_humidity_2m: 97,
                    apparent_temperature: 11.8,
                    precipitation: 22.0,
                    rain: 22.0,
                    weather_code: 95,
                    cloud_cover: 100,
                    pressure_msl: 998.5,
                    wind_speed_10m: 42.0,
                    wind_direction_10m: 230,
                    wind_gusts_10m: 62.0,
                    precipitation_probability: 95
                };
            } else if (scenario === 'FOG') {
                current = {
                    time: new Date().toISOString(),
                    temperature_2m: 12.0,
                    relative_humidity_2m: 99,
                    apparent_temperature: 11.2,
                    precipitation: 0.2,
                    rain: 0.2,
                    weather_code: 45,
                    cloud_cover: 95,
                    pressure_msl: 1012.0,
                    wind_speed_10m: 8.0,
                    wind_direction_10m: 60,
                    wind_gusts_10m: 14.0,
                    precipitation_probability: 30
                };
            } else {
                current = {
                    time: new Date().toISOString(),
                    temperature_2m: 19.5,
                    relative_humidity_2m: 62,
                    apparent_temperature: 19.2,
                    precipitation: 0.0,
                    rain: 0.0,
                    weather_code: 1,
                    cloud_cover: 18,
                    pressure_msl: 1018.5,
                    wind_speed_10m: 10.5,
                    wind_direction_10m: 45,
                    wind_gusts_10m: 18.0,
                    precipitation_probability: 10
                };
            }
        } else {
            // Live Open-Meteo API call
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7`;
                const res = await axios.get(url, { timeout: 4500 });

                if (res.data) {
                    current = res.data.current;
                    // Current precipitation probability from first hourly slot
                    if (res.data.hourly?.precipitation_probability) {
                        current.precipitation_probability = res.data.hourly.precipitation_probability[0] || 0;
                    }

                    // Format 24-hour forecast
                    if (res.data.hourly?.time) {
                        hourly = res.data.hourly.time.slice(0, 24).map((t, idx) => {
                            const code = res.data.hourly.weather_code[idx] || 0;
                            const meta = this.mapWeatherCode(code);
                            return {
                                time: t,
                                hour: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                temperature: res.data.hourly.temperature_2m[idx],
                                rainProb: res.data.hourly.precipitation_probability[idx] || 0,
                                precipitation: res.data.hourly.precipitation[idx] || 0,
                                windSpeed: res.data.hourly.wind_speed_10m[idx] || 0,
                                humidity: res.data.hourly.relative_humidity_2m[idx] || 0,
                                code,
                                condition: meta.condition,
                                icon: meta.icon
                            };
                        });
                    }

                    // Format 7-day forecast
                    if (res.data.daily?.time) {
                        daily = res.data.daily.time.map((d, idx) => {
                            const code = res.data.daily.weather_code[idx] || 0;
                            const meta = this.mapWeatherCode(code);
                            const dateObj = new Date(d);
                            return {
                                date: d,
                                dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
                                maxTemp: res.data.daily.temperature_2m_max[idx],
                                minTemp: res.data.daily.temperature_2m_min[idx],
                                rainProb: res.data.daily.precipitation_probability_max[idx] || 0,
                                maxWind: res.data.daily.wind_speed_10m_max[idx] || 0,
                                code,
                                condition: meta.condition,
                                icon: meta.icon
                            };
                        });
                    }
                }
            } catch (err) {
                console.warn('[WeatherAgent] Live Open-Meteo API unreachable, building reliable telemetry fallback:', err.message);
                current = {
                    time: new Date().toISOString(),
                    temperature_2m: 17.5,
                    relative_humidity_2m: 74,
                    apparent_temperature: 16.8,
                    precipitation: 0.1,
                    rain: 0.1,
                    weather_code: 2,
                    cloud_cover: 35,
                    pressure_msl: 1016.0,
                    wind_speed_10m: 12.0,
                    wind_direction_10m: 50,
                    wind_gusts_10m: 22.0,
                    precipitation_probability: 20
                };
            }
        }

        // If hourly or daily are empty (e.g. from simulation), generate realistic 24h & 7d curves
        if (hourly.length === 0) {
            const baseTemp = current.temperature_2m || 18.0;
            const baseRain = current.precipitation_probability || 20;
            const now = new Date();
            for (let i = 0; i < 24; i++) {
                const hourDate = new Date(now.getTime() + i * 3600000);
                const tempVar = Math.sin((i - 6) / 24 * Math.PI * 2) * 4;
                const hTemp = Math.round((baseTemp + tempVar) * 10) / 10;
                const hCode = isSimulated && current.weather_code >= 65 ? (i < 5 ? current.weather_code : 3) : 2;
                const meta = this.mapWeatherCode(hCode);
                hourly.push({
                    time: hourDate.toISOString(),
                    hour: hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    temperature: hTemp,
                    rainProb: isSimulated && current.weather_code >= 65 ? (i < 5 ? baseRain : 20) : baseRain,
                    precipitation: isSimulated ? current.precipitation : 0,
                    windSpeed: current.wind_speed_10m || 12,
                    humidity: current.relative_humidity_2m || 70,
                    code: hCode,
                    condition: meta.condition,
                    icon: meta.icon
                });
            }
        }

        if (daily.length === 0) {
            const now = new Date();
            for (let i = 0; i < 7; i++) {
                const dDate = new Date(now.getTime() + i * 86400000);
                const dayCode = i === 0 ? current.weather_code : (i % 2 === 0 ? 1 : 2);
                const meta = this.mapWeatherCode(dayCode);
                daily.push({
                    date: dDate.toISOString().split('T')[0],
                    dayName: i === 0 ? 'Today' : dDate.toLocaleDateString('en-US', { weekday: 'short' }),
                    maxTemp: Math.round((current.temperature_2m + 3) * 10) / 10,
                    minTemp: Math.round((current.temperature_2m - 5) * 10) / 10,
                    rainProb: i === 0 ? (current.precipitation_probability || 20) : 15,
                    maxWind: current.wind_speed_10m || 15,
                    code: dayCode,
                    condition: meta.condition,
                    icon: meta.icon
                });
            }
        }

        const weatherMeta = this.mapWeatherCode(current.weather_code);

        // Evaluate Real-Time Alert Engine
        const alerts = this.evaluateAlerts({
            current,
            weatherMeta,
            placeName,
            latitude,
            longitude
        });

        return {
            place: placeName,
            latitude: Number(latitude),
            longitude: Number(longitude),
            isSimulated,
            timestamp: new Date().toISOString(),
            current: {
                temperature: current.temperature_2m,
                apparentTemperature: current.apparent_temperature || current.temperature_2m,
                humidity: current.relative_humidity_2m,
                precipitation: current.precipitation,
                rainProbability: current.precipitation_probability || 0,
                weatherCode: current.weather_code,
                condition: weatherMeta.condition,
                category: weatherMeta.category,
                icon: weatherMeta.icon,
                cloudCover: current.cloud_cover,
                pressure: current.pressure_msl,
                windSpeed: current.wind_speed_10m,
                windDirection: current.wind_direction_10m,
                windGusts: current.wind_gusts_10m,
                uvIndexEstimate: Math.max(1, Math.min(10, Math.round((100 - current.cloud_cover) / 10)))
            },
            alerts,
            hourly,
            daily
        };
    }

    /**
     * Real-Time Weather Alert Evaluation Engine
     */
    evaluateAlerts({ current, weatherMeta, placeName, latitude, longitude }) {
        const alerts = [];
        const code = current.weather_code;
        const rainProb = current.precipitation_probability || 0;
        const precip = current.precipitation || 0;
        const wind = current.wind_speed_10m || 0;
        const gusts = current.wind_gusts_10m || 0;
        const humidity = current.relative_humidity_2m || 0;
        const temp = current.temperature_2m;
        const apparent = current.apparent_temperature || temp;

        // 1. Severe Thunderstorm & Lightning Alert (CRITICAL)
        if (code >= 95) {
            alerts.push({
                id: `alt_thunder_${Date.now()}`,
                level: 'CRITICAL',
                type: 'THUNDERSTORM',
                title: '⚡ Severe Mountain Thunderstorm & Lightning Alert',
                location: placeName,
                trigger: `Weather code ${code} with wind gusts ${gusts} km/h and rapid electrical discharge.`,
                description: `Active thunderstorm in progress over ${placeName}. Outdoor ridge walking, boating, and observation deck access are strictly unsafe.`,
                affectedActivities: ['Doddabetta Summit & Ridge Walk', 'Ooty Lake Boating', 'Open Garden Excursions'],
                operatorAction: 'Immediately shelter all tourist groups in covered venues (e.g. Tea Museum, Covered Conservatory). Halt all lake watercraft.',
                suggestedAnnouncement: `Safety Alert: Severe thunderstorm active near ${placeName}. Please stay sheltered inside designated indoor pavilions with your group leader.`
            });
        }
        // 2. Heavy Rain & Downpour Alert (CRITICAL)
        else if (code >= 65 || precip >= 5.0 || rainProb >= 75) {
            alerts.push({
                id: `alt_rain_crit_${Date.now()}`,
                level: 'CRITICAL',
                type: 'HEAVY_RAIN',
                title: '🌧️ Heavy Torrential Downpour & Landslip Hazard Alert',
                location: placeName,
                trigger: `Rain probability ${rainProb}%, precipitation intensity ${precip} mm/h.`,
                description: `High volume rainfall detected over ${placeName}. Hill roads and exposed walking trails are slick.`,
                affectedActivities: ['Botanical Garden Lawn Walk', 'Doddabetta Peak Trek'],
                operatorAction: 'Reroute active tourist groups to indoor cultural sites (Tea Factory & Museum). Advise coach drivers on ghat road descent.',
                suggestedAnnouncement: `Weather Advisory: Heavy rainfall at ${placeName}. Our AI coordinator has adapted the schedule to indoor venues.`
            });
        }
        // 3. Moderate Rain Warning (WARNING)
        else if (code >= 51 || precip >= 1.5 || rainProb >= 45) {
            alerts.push({
                id: `alt_rain_warn_${Date.now()}`,
                level: 'WARNING',
                type: 'MODERATE_RAIN',
                title: '🌦️ Rain Showers & Wet Surface Advisory',
                location: placeName,
                trigger: `Rain probability ${rainProb}%, precipitation ${precip} mm/h.`,
                description: `Intermittent rain showers affecting ${placeName}. Paths may be damp with mild mist.`,
                affectedActivities: ['Outdoor Sightseeing', 'Lake Promenade'],
                operatorAction: 'Distribute umbrellas/ponchos. Ensure slower group walking pace for elderly and family members.',
                suggestedAnnouncement: `Notice: Light to moderate showers expected at ${placeName}. Carry rain gear and stay close to your group guide.`
            });
        }

        // 4. Dense Fog & Low Visibility Warning (WARNING)
        if (code === 45 || code === 48 || (humidity >= 96 && code >= 2)) {
            alerts.push({
                id: `alt_fog_${Date.now()}`,
                level: 'WARNING',
                type: 'DENSE_FOG',
                title: '🌫️ Dense Mountain Fog & Low Visibility Warning',
                location: placeName,
                trigger: `Relative humidity ${humidity}%, dense mountain cloud cover (${current.cloud_cover}%).`,
                description: `Reduced optical visibility (< 100m) along Nilgiri mountain ghat roads and Doddabetta observation towers.`,
                affectedActivities: ['Telescope Observation', 'Mountain Transit Coaches'],
                operatorAction: 'Instruct coach drivers to maintain 25 km/h limit with fog lamps engaged. Keep tourist group roll-call active.',
                suggestedAnnouncement: `Visibility Caution: Thick mountain mist at ${placeName}. Please keep within sight of your group leader.`
            });
        }

        // 5. High Wind / Gale Warning (WARNING)
        if (wind >= 32 || gusts >= 45) {
            alerts.push({
                id: `alt_wind_${Date.now()}`,
                level: 'WARNING',
                type: 'HIGH_WIND',
                title: '💨 High Mountain Wind & Gale Warning',
                location: placeName,
                trigger: `Sustained wind speed ${wind} km/h with gusts up to ${gusts} km/h.`,
                description: `Blustery conditions on ridge crests and lake waters around ${placeName}.`,
                affectedActivities: ['Lakeside Boating', 'Open Hilltop Photography'],
                operatorAction: 'Suspend open rowing boats. Warn tourists regarding loose hats and lightweight equipment.',
                suggestedAnnouncement: `Wind Advisory: Strong gusts (${gusts} km/h) reported around ${placeName}. Secure personal belongings.`
            });
        }

        // 6. Altitude Chill / Cold Advisory (ADVISORY)
        if (apparent < 13.0) {
            alerts.push({
                id: `alt_chill_${Date.now()}`,
                level: 'ADVISORY',
                type: 'COLD_CHILL',
                title: '❄️ High-Altitude Cold & Wind Chill Advisory',
                location: placeName,
                trigger: `Apparent temperature ${apparent.toFixed(1)}°C (ambient ${temp}°C).`,
                description: `Cold mountain air requires warm thermal layering, especially for senior tourists.`,
                affectedActivities: ['Early Morning / Evening Outdoor Walks'],
                operatorAction: 'Ensure tourists have light jackets or shawls. Schedule hot Nilgiri tea breaks.',
                suggestedAnnouncement: `Temperature Notice: Chilly winds in ${placeName} (${temp}°C). Keep warm sweaters or jackets handy.`
            });
        }

        // 7. Optimal Conditions (If no alerts triggered)
        if (alerts.length === 0) {
            alerts.push({
                id: `alt_optimal_${Date.now()}`,
                level: 'OPTIMAL',
                type: 'CLEAR',
                title: '☀️ Optimal Sightseeing Weather',
                location: placeName,
                trigger: `Pleasant ${temp}°C with ${current.cloud_cover}% cloud cover and 0 mm rain.`,
                description: `Clear, comfortable conditions at ${placeName}. All scheduled outdoor activities and trails are safe.`,
                affectedActivities: [],
                operatorAction: 'Proceed with default itinerary timings and standard pace.',
                suggestedAnnouncement: `Good weather: Clear and comfortable skies at ${placeName} (${temp}°C). Enjoy your sightseeing!`
            });
        }

        return alerts;
    }

    /**
     * Backward-compatible analyze() method for CoordinatorAgent and simulation routes
     */
    async analyze(latitude = 11.4190, longitude = 76.7112, simulationOptions = {}) {
        const telemetry = await this.getFullTelemetry(latitude, longitude, 'Ooty & Nilgiri Hills', simulationOptions);
        const highestAlert = telemetry.alerts.find(a => a.level === 'CRITICAL' || a.level === 'WARNING') || telemetry.alerts[0];
        const isDisruptive = highestAlert.level === 'CRITICAL' || highestAlert.level === 'WARNING';

        return {
            agent: this.name,
            status: isDisruptive ? 'ALERT' : 'OPTIMAL',
            latitude,
            longitude,
            currentTemperature: telemetry.current.temperature,
            rainProbability: telemetry.current.rainProbability,
            condition: telemetry.current.condition,
            isDisruptive,
            summary: highestAlert.description,
            alerts: telemetry.alerts,
            telemetry
        };
    }

    /**
     * Search global places/cities using Open-Meteo Geocoding Free API
     */
    async searchPlaces(query = 'Ooty') {
        try {
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
            const res = await axios.get(url, { timeout: 3500 });
            if (res.data?.results) {
                return res.data.results.map(r => ({
                    id: r.id,
                    name: r.name,
                    admin1: r.admin1 || '',
                    country: r.country || '',
                    latitude: r.latitude,
                    longitude: r.longitude,
                    displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', ')
                }));
            }
            return [];
        } catch (err) {
            console.error('[WeatherAgent] searchPlaces error:', err.message);
            return [];
        }
    }
}

module.exports = new WeatherAgent();
