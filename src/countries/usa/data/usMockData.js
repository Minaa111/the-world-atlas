// Mock data for US States

export const usDimensionsMap = {
    "Median Income": { key: "median_income", label: "Median Income ($)", color: "#10b981", max: 100000 },
    "Poverty Rate": { key: "poverty_rate", label: "Poverty Rate (%)", color: "#ef4444", max: 25, invert: true },
    "High School Grad Rate": { key: "hs_grad_rate", label: "High School Grad Rate (%)", color: "#3b82f6", max: 100 },
    "Violent Crime Rate": { key: "violent_crime", label: "Violent Crime (per 100k)", color: "#f59e0b", max: 1000, invert: true },
    "Unemployment Rate": { key: "unemployment", label: "Unemployment Rate (%)", color: "#8b5cf6", max: 15, invert: true },
    "Homeownership Rate": { key: "homeownership", label: "Homeownership Rate (%)", color: "#ec4899", max: 100 }
};

export const usDimensions = Object.keys(usDimensionsMap);

// Simple mock generator
const generateMockStateData = (stateName, showForecast) => {
    const data = [];
    let baseIncome = 40000 + Math.random() * 40000;
    let basePoverty = 5 + Math.random() * 15;
    let baseGrad = 75 + Math.random() * 20;
    let baseCrime = 200 + Math.random() * 600;
    let baseUnemp = 3 + Math.random() * 6;
    let baseHome = 50 + Math.random() * 30;

    for (let year = 2010; year <= 2023; year++) {
        data.push({
            year,
            state: stateName,
            is_forecast: false,
            median_income: baseIncome + (year - 2010) * 1500 + Math.random() * 2000,
            poverty_rate: Math.max(0, basePoverty - (year - 2010) * 0.2 + Math.random() * 2),
            hs_grad_rate: Math.min(100, baseGrad + (year - 2010) * 0.5 + Math.random() * 2),
            violent_crime: Math.max(0, baseCrime - (year - 2010) * 5 + Math.random() * 30),
            unemployment: Math.max(0, baseUnemp - (year - 2010) * 0.1 + Math.random() * 2),
            homeownership: Math.min(100, baseHome + (year - 2010) * 0.3 + Math.random() * 2)
        });
    }

    // Add forecast data
    if (showForecast) {
        for (let year = 2024; year <= 2028; year++) {
            data.push({
                year,
                state: stateName,
                is_forecast: true,
                median_income: baseIncome + (year - 2010) * 1500 + Math.random() * 2000,
                poverty_rate: Math.max(0, basePoverty - (year - 2010) * 0.2 + Math.random() * 2),
                hs_grad_rate: Math.min(100, baseGrad + (year - 2010) * 0.5 + Math.random() * 2),
                violent_crime: Math.max(0, baseCrime - (year - 2010) * 5 + Math.random() * 30),
                unemployment: Math.max(0, baseUnemp - (year - 2010) * 0.1 + Math.random() * 2),
                homeownership: Math.min(100, baseHome + (year - 2010) * 0.3 + Math.random() * 2)
            });
        }
    }
    return data;
};

// Expose a function to get mock data for a list of state names
export const getMockUSData = (stateNames, showForecast = false) => {
    const result = {};
    stateNames.forEach(name => {
        result[name] = generateMockStateData(name, showForecast);
    });
    return result;
};
