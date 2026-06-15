export const THEMATIC_PILLARS = [
    {
        id: 'economic',
        label: 'Economic Vitality',
        icon: 'DollarSign',
        color: 'text-pink-500',
        bg: 'bg-pink-50',
        indicators: [
            { key: "gni", label: "Gross National Income (GNI)", color: "#ec4899", desc: "Total domestic and foreign output claimed by residents." },
            { key: "gni_per_capita", label: "GNI per capita", color: "#14b8a6", desc: "GNI divided by midyear population." }
        ]
    },
    {
        id: 'human',
        label: 'Human Capital & Health',
        icon: 'Heart',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        indicators: [
            { key: "life_expectancy", label: "Life Expectancy", color: "#3b82f6", desc: "Average number of years a newborn is expected to live." },
            { key: "literacy_rate", label: "Literacy Rate", color: "#f59e0b", desc: "Percentage of people ages 15 and above who can read and write." }
        ]
    },
    {
        id: 'equity',
        label: 'Equity & Safety',
        icon: 'Shield',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
        indicators: [
            { key: "gini", label: "Gini Index", color: "#10b981", desc: "Measures the extent to which the distribution of income deviates from a perfectly equal distribution." },
            { key: "homicide_rate", label: "Intentional Homicide Rate", color: "#ef4444", desc: "Intentional homicides per 100,000 people." }
        ]
    },
    {
        id: 'environment',
        label: 'Environment & Infrastructure',
        icon: 'Leaf',
        color: 'text-violet-500',
        bg: 'bg-violet-50',
        indicators: [
            { key: "pm25", label: "PM2.5 Air Pollution", color: "#8b5cf6", desc: "Mean annual exposure to fine particulate matter." }
        ]
    }
];

// Helper to generate the flat list of dimension names used throughout the app
export const getDimensionsList = () => {
    return THEMATIC_PILLARS.flatMap(pillar => 
        pillar.indicators.map(ind => ind.label)
    );
};

// Helper to generate the dimensionsMap object used for charting metadata
export const getDimensionsMap = () => {
    const map = {};
    THEMATIC_PILLARS.forEach(pillar => {
        pillar.indicators.forEach(ind => {
            map[ind.label] = {
                key: ind.key,
                label: ind.label,
                color: ind.color,
                desc: ind.desc,
                pillar: pillar.label
            };
        });
    });
    return map;
};
