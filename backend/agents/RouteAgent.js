const axios = require('axios');

class RouteAgent {
    constructor() {
        this.name = 'Route Agent';
    }

    /**
     * Calculate route feasibility, distance, travel time, and alternatives
     */
    async analyze(originLat, originLng, destLat, destLng, weatherStatus = {}) {
        const apiKey = process.env.GEOAPIFY_API_KEY;
        let distanceKm = this.calculateHaversineDistance(originLat, originLng, destLat, destLng);
        let durationMins = Math.round(distanceKm * 2.8 + 5); // Base mountain drive multiplier
        let roadCondition = 'Normal / Clear';
        let isDelayed = false;
        let alternativeRoute = null;

        if (weatherStatus.isDisruptive) {
            roadCondition = 'Wet / Slippery Ghat Road';
            durationMins = Math.round(durationMins * 1.5);
            isDelayed = true;
            alternativeRoute = 'Covered Valley Bypass via Commercial Rd (Lower Gradient)';
        }

        // Try Geoapify if key is provided
        if (apiKey && originLat && destLat) {
            try {
                const geoUrl = `https://api.geoapify.com/v1/routing?waypoints=${originLat},${originLng}|${destLat},${destLng}&mode=drive&apiKey=${apiKey}`;
                const res = await axios.get(geoUrl, { timeout: 3500 });
                if (res.data?.features?.[0]?.properties) {
                    const props = res.data.features[0].properties;
                    distanceKm = Number((props.distance / 1000).toFixed(2));
                    durationMins = Math.round(props.time / 60);
                }
            } catch (err) {
                // Fallback used
            }
        }

        return {
            agent: this.name,
            status: isDelayed ? 'DELAYED' : 'CLEAR',
            distanceKm: Number(distanceKm.toFixed(2)),
            estimatedDurationMins: durationMins,
            roadCondition,
            isDelayed,
            alternativeRoute,
            summary: isDelayed
                ? `Route exhibits a +${Math.round(durationMins * 0.3)} min delay due to ${roadCondition}. Recommending alternative: ${alternativeRoute}.`
                : `Route is fully clear (${distanceKm.toFixed(1)} km, ~${durationMins} mins travel time).`
        };
    }

    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 5.2;
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

module.exports = new RouteAgent();
