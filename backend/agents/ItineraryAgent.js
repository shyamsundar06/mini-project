class ItineraryAgent {
    constructor() {
        this.name = 'Itinerary Agent';
    }

    /**
     * Adapt itinerary based on weather, route, and group constraints
     */
    evaluateSchedule(itineraryItems, weatherAnalysis, routeAnalysis, availableFallbackActivities = []) {
        let isAdapted = false;
        let adaptationReason = null;
        let affectedActivities = [];
        let replacements = [];

        const updatedItems = itineraryItems.map(item => {
            const copy = { ...item };

            // Check if item is outdoor and weather is disruptive
            if (weatherAnalysis.isDisruptive && (copy.title.toLowerCase().includes('peak') || copy.title.toLowerCase().includes('lake') || copy.title.toLowerCase().includes('walk') || copy.title.toLowerCase().includes('outdoor'))) {
                isAdapted = true;
                affectedActivities.push(copy.title);

                // Find indoor fallback
                const fallback = availableFallbackActivities.find(fb => fb.id === 'act_fb_2' || fb.title.includes('Museum') || fb.title.includes('Indoor')) || {
                    id: 'act_fb_2',
                    title: 'Tea Museum Multimedia Cinema & Indoor Blending',
                    description: 'Indoor documentary screening on Nilgiri tea history and custom tea blending session.',
                    location_name: 'Tea Museum Complex',
                    latitude: 11.4235,
                    longitude: 76.7325
                };

                copy.is_alternative = true;
                copy.original_title = copy.title;
                copy.title = `${fallback.title} [AI Weather Reroute]`;
                copy.description = fallback.description;
                copy.location_name = fallback.location_name || 'Tea Museum Hall';
                copy.weather_alert = `Adapted due to heavy precipitation forecast (${weatherAnalysis.rainProbability}% rain probability)`;
                copy.status = 'REPLACED';

                replacements.push({
                    original: item.title,
                    replacement: copy.title,
                    time: `${item.start_time} - ${item.end_time}`
                });
            }

            return copy;
        });

        if (isAdapted) {
            adaptationReason = `Severe weather warning in mountain zones (${weatherAnalysis.condition}, ${weatherAnalysis.rainProbability}% rain). Outdoor peak activity substituted with covered cultural exhibition.`;
        }

        return {
            agent: this.name,
            isAdapted,
            adaptationReason,
            affectedActivities,
            replacements,
            adaptedItems: updatedItems,
            summary: isAdapted
                ? `Dynamic itinerary successfully adapted for ${affectedActivities.length} weather-sensitive items.`
                : 'Current itinerary schedule is optimal and aligned with environmental conditions.'
        };
    }
}

module.exports = new ItineraryAgent();
