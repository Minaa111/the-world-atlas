export const THEMATIC_PILLARS = [
    {
        id: 'economic',
        label: 'Economic Vitality',
        icon: 'DollarSign',
        color: 'text-pink-500',
        bg: 'bg-pink-50',
        indicators: [
            { key: "gni", label: "Gross National Income (GNI)", shortLabel: "GNI", color: "#ec4899", desc: "Total domestic and foreign output claimed by residents.", unit: "B", invert: false },
            { key: "gni_per_capita", label: "GNI per capita", shortLabel: "GNI / Capita", color: "#f43f5e", desc: "GNI divided by midyear population.", unit: "$", invert: false },
            { key: "inflation_rate", label: "Inflation Rate", shortLabel: "Inflation", color: "#ef4444", desc: "Annual inflation rate (Consumer Prices %).", unit: "%", invert: true },
            { key: "unemployment_rate", label: "Unemployment Rate", shortLabel: "Unemployment", color: "#d946ef", desc: "Unemployment, total (% of total labor force).", unit: "%", invert: true },
            { key: "poverty_ratio", label: "Poverty Headcount Ratio", shortLabel: "Poverty", color: "#c026d3", desc: "Poverty headcount ratio at $2.15 a day (% of population).", unit: "%", invert: true }
        ]
    },
    {
        id: 'human',
        label: 'Human Capital & Health',
        icon: 'Heart',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        indicators: [
            { key: "life_expectancy", label: "Life Expectancy", shortLabel: "Life Exp.", color: "#3b82f6", desc: "Average number of years a newborn is expected to live.", unit: "Years", invert: false },
            { key: "literacy_rate", label: "Literacy Rate", shortLabel: "Literacy", color: "#2563eb", desc: "Percentage of people ages 15 and above who can read and write.", unit: "%", invert: false },
            { key: "population", label: "Population, total", shortLabel: "Population", color: "#0ea5e9", desc: "Total population.", unit: "M", invert: false },
            { key: "fertility_rate", label: "Fertility Rate", shortLabel: "Fertility", color: "#0284c7", desc: "Total births per woman.", unit: "Births", invert: false },
            { key: "infant_mortality", label: "Infant Mortality Rate", shortLabel: "Infant Mortality", color: "#38bdf8", desc: "Infant mortality rate (per 1,000 live births).", unit: "/1k", invert: true }
        ]
    },
    {
        id: 'equity',
        label: 'Equity & Safety',
        icon: 'Shield',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
        indicators: [
            { key: "gini", label: "Gini Index", shortLabel: "Gini", color: "#10b981", desc: "Measures the extent to which the distribution of income deviates from a perfectly equal distribution.", unit: "", invert: true },
            { key: "homicide_rate", label: "Intentional Homicide Rate", shortLabel: "Homicides", color: "#059669", desc: "Intentional homicides per 100,000 people.", unit: "/100k", invert: true },
            { key: "gpi", label: "Gender Parity Index (GPI)", shortLabel: "Gender Parity", color: "#34d399", desc: "School enrollment, primary and secondary, gender parity index.", unit: "", invert: false }
        ]
    },
    {
        id: 'environment',
        label: 'Environment & Infrastructure',
        icon: 'Leaf',
        color: 'text-violet-500',
        bg: 'bg-violet-50',
        indicators: [
            { key: "pm25", label: "PM2.5 Air Pollution", shortLabel: "PM2.5 Air", color: "#8b5cf6", desc: "Mean annual exposure to fine particulate matter.", unit: "µg/m³", invert: true },
            { key: "co2_emissions", label: "CO2 Emissions", shortLabel: "CO2", color: "#7c3aed", desc: "CO2 emissions (metric tons per capita).", unit: "Tons/Capita", invert: true },
            { key: "electricity_access", label: "Access to Electricity", shortLabel: "Electricity", color: "#6d28d9", desc: "Access to electricity (% of population).", unit: "%", invert: false },
            { key: "internet_usage", label: "Internet Penetration", shortLabel: "Internet", color: "#5b21b6", desc: "Individuals using the Internet (% of population).", unit: "%", invert: false }
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
                pillar: pillar.label,
                shortLabel: ind.shortLabel
            };
        });
    });
    return map;
};
