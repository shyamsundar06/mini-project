class EmergencyAgent {
    constructor() {
        this.name = 'Emergency Agent';
    }

    /**
     * Triage SOS payload and compute emergency operational support plan
     */
    async triage(sosData) {
        const {
            tourist_id,
            tourist_name = 'Tourist',
            group_name = 'Group',
            latitude = 11.4190,
            longitude = 76.7112,
            emergency_type = 'MEDICAL',
            current_activity = 'Botanical Garden Heritage Walk'
        } = sosData;

        // Known local support stations in Ooty/Nilgiris
        const supportStations = [
            { name: 'Ooty District Government Hospital', lat: 11.4120, lng: 76.7025, type: 'Medical Hospital', phone: '+91 423 244 2212' },
            { name: 'Nilgiri Mountain Rescue Post (Charing Cross)', lat: 11.4105, lng: 76.7080, type: 'Rescue Outpost', phone: '+91 423 244 4444' },
            { name: 'Botanical Gardens First Aid & Ranger Station', lat: 11.4185, lng: 76.7105, type: 'Immediate Ranger', phone: '+91 98451 88800' }
        ];

        // Find closest station
        let closest = supportStations[0];
        let minDistance = Infinity;

        supportStations.forEach(station => {
            const dist = this.calculateDistance(latitude, longitude, station.lat, station.lng);
            if (dist < minDistance) {
                minDistance = dist;
                closest = station;
            }
        });

        const estimatedResponseMinutes = Math.max(4, Math.round(minDistance * 3.5 + 2));

        // Compute Emergency Expense Estimate
        const expenseEstimate = this.estimateEmergencyCost(minDistance, emergency_type);

        return {
            agent: this.name,
            priority: 'CRITICAL',
            status: 'TRIAGED',
            tourist: {
                id: tourist_id,
                name: tourist_name,
                group: group_name,
                activity: current_activity,
                location: { latitude, longitude }
            },
            nearestSupport: {
                ...closest,
                distanceKm: Number(minDistance.toFixed(2)),
                estimatedArrivalTimeMins: estimatedResponseMinutes
            },
            operationalExpense: expenseEstimate,
            protocolSteps: [
                `1. Instant alert broadcasted to Operator Dashboard and On-site Tour Guide.`,
                `2. Dispatched nearest unit: ${closest.name} (~${estimatedResponseMinutes} mins ETA).`,
                `3. Keep tourist stationary, maintain GPS beacon and Voice Assistant channel open.`,
                `4. Dedicated reserve allocated: ₹${expenseEstimate.estimatedCostRange.min} - ₹${expenseEstimate.estimatedCostRange.max}.`
            ]
        };
    }

    /**
     * Emergency cost estimator engine
     */
    estimateEmergencyCost(distanceKm = 5, emergencyType = 'MEDICAL', availableReserve = 25000) {
        let baseCost = 800; // Base dispatch & paramedical assessment
        let perKmRate = 60; // Emergency vehicle mountain rate
        let kitCost = 500;

        if (emergencyType.toUpperCase() === 'CRITICAL' || emergencyType.toUpperCase() === 'CARDIAC') {
            baseCost = 2000;
            perKmRate = 90;
            kitCost = 1200;
        }

        const calculated = baseCost + (distanceKm * perKmRate) + kitCost;
        const minCost = Math.round(calculated * 0.85);
        const maxCost = Math.round(calculated * 1.35);
        const remainingReserveMin = Math.max(0, availableReserve - maxCost);
        const remainingReserveMax = Math.max(0, availableReserve - minCost);

        return {
            distanceKm: Number(distanceKm.toFixed(1)),
            transportType: 'Emergency Rapid Response Vehicle',
            estimatedCostRange: {
                min: minCost,
                max: maxCost,
                formatted: `₹${minCost.toLocaleString()} – ₹${maxCost.toLocaleString()}`
            },
            availableReserve: availableReserve,
            remainingReserveRange: {
                min: remainingReserveMin,
                max: remainingReserveMax,
                formatted: `₹${remainingReserveMin.toLocaleString()} – ₹${remainingReserveMax.toLocaleString()}`
            },
            disclaimer: 'This is an approximate operational estimate, not an exact medical or financial prediction.'
        };
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
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

module.exports = new EmergencyAgent();
