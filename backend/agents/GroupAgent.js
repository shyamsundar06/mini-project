class GroupAgent {
    constructor() {
        this.name = 'Group Agent';
        this.rotationCounter = 0;
        this.strategies = [
            {
                id: 'PACE_MOBILITY',
                name: 'Pace & Mobility Balance',
                badge: '🚶 Pace & Endurance',
                description: 'Clusters tourists by walking pace, endurance, and physical stamina for trail agility.',
                groups: [
                    {
                        id: 'grp_alpha',
                        name: 'Alpha - High-Tempo Trail Trekkers',
                        color_hex: '#10B981',
                        targetPace: 'Fast',
                        targetActivity: ['Adventurous', 'Nature'],
                        maxAge: 35
                    },
                    {
                        id: 'grp_beta',
                        name: 'Beta - Heritage & Cultural Walkers',
                        color_hex: '#3B82F6',
                        targetPace: 'Moderate',
                        targetActivity: ['Cultural', 'Sightseeing'],
                        maxAge: 50
                    },
                    {
                        id: 'grp_gamma',
                        name: 'Gamma - Gentle Scenic & Leisure',
                        color_hex: '#F59E0B',
                        targetPace: 'Slow',
                        targetActivity: ['Relaxed', 'Nature'],
                        maxAge: 100
                    }
                ]
            },
            {
                id: 'LANGUAGE_CULTURE',
                name: 'Language & Conversational Affinity',
                badge: '🗣️ Language Synergy',
                description: 'Maximizes communication comfort and peer camaraderie by grouping regional and bilingual mother tongues.',
                groups: [
                    {
                        id: 'grp_alpha',
                        name: 'Alpha - Southern Regional Cohort',
                        color_hex: '#0D9488',
                        targetLanguages: ['Tamil', 'Malayalam'],
                        targetPace: 'Fast',
                        defaultInterests: 'Local Culture, Nature, Trekking'
                    },
                    {
                        id: 'grp_beta',
                        name: 'Beta - Bilingual Bridge Cohort',
                        color_hex: '#6366F1',
                        targetLanguages: ['Hindi', 'English'],
                        targetPace: 'Moderate',
                        defaultInterests: 'Sightseeing, Heritage, Photography'
                    },
                    {
                        id: 'grp_gamma',
                        name: 'Gamma - Regional Cultural Guild',
                        color_hex: '#8B5CF6',
                        targetLanguages: ['Kannada', 'Telugu'],
                        targetPace: 'Slow',
                        defaultInterests: 'Botanical Gardens, Architecture, Cuisine'
                    }
                ]
            },
            {
                id: 'INTEREST_THEMATIC',
                name: 'Interest & Thematic Passion',
                badge: '🎯 Interest Aligned',
                description: 'Aligns travelers around identical trip motivations: Wildlife/Botany, Adrenaline, or Arts & Leisure.',
                groups: [
                    {
                        id: 'grp_alpha',
                        name: 'Alpha - Eco-Wilderness & Wildlife',
                        color_hex: '#059669',
                        targetActivity: ['Nature'],
                        keywords: ['wildlife', 'botany', 'bird', 'trekking', 'flora', 'herbs'],
                        targetPace: 'Fast'
                    },
                    {
                        id: 'grp_beta',
                        name: 'Beta - Adrenaline & Mountain Explorers',
                        color_hex: '#EA580C',
                        targetActivity: ['Adventurous'],
                        keywords: ['photo', 'biking', 'climbing', 'vlog', 'drone', 'trail running'],
                        targetPace: 'Fast'
                    },
                    {
                        id: 'grp_gamma',
                        name: 'Gamma - Cultural Heritage & Arts',
                        color_hex: '#2563EB',
                        targetActivity: ['Cultural', 'Relaxed'],
                        keywords: ['heritage', 'temple', 'colonial', 'tea', 'market', 'lake'],
                        targetPace: 'Moderate'
                    }
                ]
            },
            {
                id: 'AGE_COHORTS',
                name: 'Demographic Peer Cohorts',
                badge: '👥 Age & Social Cohort',
                description: 'Groups travelers into generational peer brackets for smooth social bonding and shared energy levels.',
                groups: [
                    {
                        id: 'grp_alpha',
                        name: 'Alpha - Young Trailblazers (Under 32)',
                        color_hex: '#0891B2',
                        targetAgeRange: [18, 32],
                        targetPace: 'Fast'
                    },
                    {
                        id: 'grp_beta',
                        name: 'Beta - Active Mid-Career Explorers (33–48)',
                        color_hex: '#D97706',
                        targetAgeRange: [33, 48],
                        targetPace: 'Moderate'
                    },
                    {
                        id: 'grp_gamma',
                        name: 'Gamma - Golden Serenity Circle (49+)',
                        color_hex: '#7C3AED',
                        targetAgeRange: [49, 100],
                        targetPace: 'Slow'
                    }
                ]
            },
            {
                id: 'BALANCED_HYBRID',
                name: 'Multi-Factor Global Synergy',
                badge: '⚖️ Global Harmony',
                description: 'Algorithmic multi-objective balancing that distributes group sizes evenly while maximizing mutual pair compatibility.',
                groups: [
                    {
                        id: 'grp_alpha',
                        name: 'Alpha - Dynamic Synergy Cluster',
                        color_hex: '#10B981',
                        targetPace: 'Fast'
                    },
                    {
                        id: 'grp_beta',
                        name: 'Beta - Harmonic Explorers',
                        color_hex: '#3B82F6',
                        targetPace: 'Moderate'
                    },
                    {
                        id: 'grp_gamma',
                        name: 'Gamma - Balanced Travelers',
                        color_hex: '#F59E0B',
                        targetPace: 'Slow'
                    }
                ]
            }
        ];
    }

    getStrategies() {
        return this.strategies.map(s => ({
            id: s.id,
            name: s.name,
            badge: s.badge,
            description: s.description
        }));
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
     * Compute individual fit score of a member within a group
     */
    calculateMemberFit(tourist, groupMembers) {
        const peers = (groupMembers || []).filter(m => m.id !== tourist.id);
        if (peers.length === 0) return 95;
        let total = 0;
        for (const peer of peers) {
            total += this.calculatePairCompatibility(tourist, peer);
        }
        return Math.min(99, Math.max(65, Math.round(total / peers.length)));
    }

    /**
     * Adaptive clustering supporting multiple optimization strategies
     * @param {Array} tourists - Array of tourist objects
     * @param {String} strategyId - Optional strategy id ('PACE_MOBILITY', 'LANGUAGE_CULTURE', 'INTEREST_THEMATIC', 'AGE_COHORTS', 'BALANCED_HYBRID', 'AUTO')
     * @param {Number} iteration - Optional iteration count
     */
    clusterTourists(tourists, strategyId = null, iteration = null) {
        if (!tourists || tourists.length === 0) return { groups: [], strategyId: 'PACE_MOBILITY', strategyName: 'Pace & Mobility Balance' };

        // Select strategy
        let selectedStrategy;
        if (strategyId && strategyId !== 'AUTO' && strategyId !== 'NEXT') {
            selectedStrategy = this.strategies.find(s => s.id === strategyId) || this.strategies[0];
        } else {
            const idx = (typeof iteration === 'number')
                ? Math.abs(iteration) % this.strategies.length
                : (this.rotationCounter++) % this.strategies.length;
            selectedStrategy = this.strategies[idx];
        }

        const maxGroupCapacity = Math.ceil(tourists.length / 3) + 1; // e.g. 6 tourists max for 16

        // Initialize groups for this strategy
        const groupProfiles = selectedStrategy.groups.map(g => ({
            id: g.id,
            name: g.name,
            color_hex: g.color_hex,
            members: [],
            config: g
        }));

        // Dynamic slight jitter seed based on iteration or time
        const seedShift = (iteration || this.rotationCounter) % 5;

        // Perform assignment based on strategy
        tourists.forEach((tourist, tIndex) => {
            const scores = groupProfiles.map((grp, idx) => {
                // If group is full, strongly penalize to maintain balance
                if (grp.members.length >= maxGroupCapacity) return -9999;

                let score = 0;
                const config = grp.config;
                const interests = (tourist.interests || '').toLowerCase();

                switch (selectedStrategy.id) {
                    case 'PACE_MOBILITY': {
                        if (tourist.walking_preference === config.targetPace) score += 35;
                        if (config.targetActivity.includes(tourist.activity_preference)) score += 20;
                        if (tourist.age <= config.maxAge) score += 15;
                        if (tourist.accessibility_requirements && tourist.accessibility_requirements !== 'None' && config.targetPace === 'Slow') {
                            score += 35;
                        }
                        break;
                    }

                    case 'LANGUAGE_CULTURE': {
                        if (config.targetLanguages.includes(tourist.preferred_language)) {
                            score += 45;
                        } else if (tourist.preferred_language === 'English') {
                            score += 25; // universal bridge
                        } else if (config.id === 'grp_gamma' && ['Kannada', 'Telugu'].includes(tourist.preferred_language)) {
                            score += 40;
                        }
                        // Secondary pace consideration
                        if (tourist.walking_preference === config.targetPace) score += 10;
                        break;
                    }

                    case 'INTEREST_THEMATIC': {
                        if (config.targetActivity.includes(tourist.activity_preference)) {
                            score += 35;
                        }
                        // Keyword matches in interest list
                        if (config.keywords) {
                            const matchCount = config.keywords.filter(kw => interests.includes(kw)).length;
                            score += matchCount * 15;
                        }
                        if (tourist.walking_preference === config.targetPace) score += 10;
                        break;
                    }

                    case 'AGE_COHORTS': {
                        const [minAge, maxAge] = config.targetAgeRange;
                        if (tourist.age >= minAge && tourist.age <= maxAge) {
                            score += 45;
                        } else {
                            const diff = Math.min(Math.abs(tourist.age - minAge), Math.abs(tourist.age - maxAge));
                            score += Math.max(0, 30 - diff * 2);
                        }
                        if (tourist.walking_preference === config.targetPace) score += 10;
                        break;
                    }

                    case 'BALANCED_HYBRID':
                    default: {
                        // Multi-objective pair synergy score against current cluster members
                        if (grp.members.length > 0) {
                            const avgPair = grp.members.reduce((sum, m) => sum + this.calculatePairCompatibility(tourist, m), 0) / grp.members.length;
                            score += avgPair * 0.5;
                        } else {
                            score += 30;
                        }
                        // Minor rotation offset so borderline members get alternative optimal groups
                        if ((tIndex + seedShift + idx) % 3 === 0) score += 12;
                        break;
                    }
                }

                // Balance penalty to ensure even group distribution
                score -= grp.members.length * 10;

                return score;
            });

            // Find best cluster index
            const bestClusterIdx = scores.indexOf(Math.max(...scores));
            groupProfiles[bestClusterIdx].members.push(tourist);
        });

        // Compute group attributes and member individual fit scores
        const enrichedGroups = groupProfiles.map(grp => {
            const members = grp.members;
            const avgAge = members.length > 0
                ? Math.round(members.reduce((sum, m) => sum + (m.age || 30), 0) / members.length)
                : 30;

            // Dominant walking preference
            const paceCounts = {};
            members.forEach(m => {
                paceCounts[m.walking_preference] = (paceCounts[m.walking_preference] || 0) + 1;
            });
            const dominantPace = Object.entries(paceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Moderate';

            // Dominant interests / keywords
            const allInterests = members.flatMap(m => (m.interests || '').split(',').map(s => s.trim()).filter(Boolean));
            const interestCounts = {};
            allInterests.forEach(i => { interestCounts[i] = (interestCounts[i] || 0) + 1; });
            const topInterests = Object.entries(interestCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(e => e[0])
                .join(', ') || 'Sightseeing, Heritage, Nature';

            const groupScore = this.calculateGroupScore(members);
            const leader = members[0]?.name || 'Assigned Guide';
            const leaderPhone = members[0]?.emergency_contact_phone || '+91 98451 12345';

            return {
                id: grp.id,
                name: grp.name,
                color_hex: grp.color_hex,
                walking_preference: dominantPace,
                avg_age: avgAge,
                common_interests: topInterests,
                compatibility_score: groupScore,
                leader_name: leader,
                leader_phone: leaderPhone,
                size: members.length,
                members: members.map(m => ({
                    ...m,
                    group_id: grp.id,
                    individualScore: this.calculateMemberFit(m, members)
                }))
            };
        });

        return {
            groups: enrichedGroups,
            strategyId: selectedStrategy.id,
            strategyName: selectedStrategy.name,
            strategyBadge: selectedStrategy.badge,
            strategyDescription: selectedStrategy.description
        };
    }
}

module.exports = new GroupAgent();
