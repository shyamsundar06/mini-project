class GroupAgent {
    constructor() {
        this.name = 'Group Agent';
    }

    /**
     * Compute pair compatibility score between 0 and 100
     */
    calculatePairCompatibility(t1, t2) {
        let score = 0;

        // 1. Walking Preference (Weight: 25%)
        if (t1.walking_preference === t2.walking_preference) {
            score += 25;
        } else {
            const paces = ['Minimal', 'Slow', 'Moderate', 'Fast'];
            const diff = Math.abs(paces.indexOf(t1.walking_preference) - paces.indexOf(t2.walking_preference));
            if (diff === 1) score += 15;
            else if (diff === 2) score += 5;
        }

        // 2. Activity Preference (Weight: 25%)
        if (t1.activity_preference === t2.activity_preference) {
            score += 25;
        } else {
            const compatiblePairs = [
                ['Adventurous', 'Nature'],
                ['Cultural', 'Relaxed'],
                ['Nature', 'Cultural']
            ];
            const isMatch = compatiblePairs.some(([a, b]) =>
                (t1.activity_preference === a && t2.activity_preference === b) ||
                (t1.activity_preference === b && t2.activity_preference === a)
            );
            if (isMatch) score += 18;
            else score += 10;
        }

        // 3. Language (Weight: 20%)
        if (t1.preferred_language === t2.preferred_language) {
            score += 20;
        } else if (t1.preferred_language === 'English' || t2.preferred_language === 'English') {
            score += 15; // Universal bridge language
        } else {
            score += 8;
        }

        // 4. Age Proximity (Weight: 15%)
        const ageDiff = Math.abs((t1.age || 30) - (t2.age || 30));
        if (ageDiff <= 8) score += 15;
        else if (ageDiff <= 18) score += 10;
        else if (ageDiff <= 25) score += 5;

        // 5. Accessibility Compatibility (Weight: 15%)
        const t1Acc = t1.accessibility_requirements && t1.accessibility_requirements !== 'None';
        const t2Acc = t2.accessibility_requirements && t2.accessibility_requirements !== 'None';
        if (t1Acc === t2Acc) score += 15;
        else score += 8;

        return Math.min(100, Math.max(50, score));
    }

    /**
     * Compute overall group compatibility score
     */
    calculateGroupScore(members) {
        if (!members || members.length <= 1) return 95;
        let total = 0;
        let pairs = 0;
        for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
                total += this.calculatePairCompatibility(members[i], members[j]);
                pairs++;
            }
        }
        return Math.round(total / (pairs || 1));
    }

    /**
     * Adaptive clustering to produce 3 balanced micro-groups
     */
    clusterTourists(tourists) {
        if (!tourists || tourists.length === 0) return [];

        // Define target cluster profiles
        const groupProfiles = [
            {
                id: 'grp_alpha',
                name: 'Alpha - Nature Trekkers',
                color_hex: '#10B981',
                targetPace: 'Fast',
                targetActivity: ['Adventurous', 'Nature'],
                maxAge: 35,
                members: []
            },
            {
                id: 'grp_beta',
                name: 'Beta - Heritage & Culture',
                color_hex: '#3B82F6',
                targetPace: 'Moderate',
                targetActivity: ['Cultural', 'Sightseeing'],
                maxAge: 50,
                members: []
            },
            {
                id: 'grp_gamma',
                name: 'Gamma - Leisure & Wellness',
                color_hex: '#F59E0B',
                targetPace: 'Slow',
                targetActivity: ['Relaxed', 'Nature'],
                maxAge: 100,
                members: []
            }
        ];

        // Assign each tourist to the best matching cluster
        tourists.forEach(tourist => {
            let bestCluster = 0;
            let bestFitness = -Infinity;

            groupProfiles.forEach((cluster, idx) => {
                let fitness = 0;
                if (tourist.walking_preference === cluster.targetPace) fitness += 30;
                if (cluster.targetActivity.includes(tourist.activity_preference)) fitness += 30;
                if (tourist.accessibility_requirements && tourist.accessibility_requirements !== 'None' && cluster.targetPace === 'Slow') {
                    fitness += 40;
                }
                if (tourist.age <= cluster.maxAge) fitness += 15;

                // Penalize oversized clusters to keep groups balanced
                fitness -= cluster.members.length * 4;

                if (fitness > bestFitness) {
                    bestFitness = fitness;
                    bestCluster = idx;
                }
            });

            groupProfiles[bestCluster].members.push(tourist);
        });

        // Compute metrics for each cluster
        return groupProfiles.map(grp => {
            const avgAge = grp.members.length > 0
                ? Math.round(grp.members.reduce((sum, m) => sum + (m.age || 30), 0) / grp.members.length)
                : 30;
            const score = this.calculateGroupScore(grp.members);
            const leader = grp.members[0]?.name || 'Assigned Guide';
            const leaderPhone = grp.members[0]?.emergency_contact_phone || '+91 98451 12345';

            return {
                id: grp.id,
                name: grp.name,
                color_hex: grp.color_hex,
                walking_preference: grp.targetPace,
                avg_age: avgAge,
                common_interests: grp.targetActivity.join(', ') + ', Sightseeing',
                compatibility_score: score,
                leader_name: leader,
                leader_phone: leaderPhone,
                size: grp.members.length,
                members: grp.members.map(m => ({
                    ...m,
                    individualScore: Math.min(99, score + (Math.floor(Math.random() * 6) - 3))
                }))
            };
        });
    }
}

module.exports = new GroupAgent();
