// Mock data for Canada Provinces

export const canDimensionsMap = {
    "Median Income": { key: "median_income", label: "Median Income (CAD)", color: "#10b981", max: 120000 },
    "Poverty Rate": { key: "poverty_rate", label: "Poverty Rate (%)", color: "#ef4444", max: 20, invert: true },
    "High School Grad Rate": { key: "hs_grad_rate", label: "High School Grad Rate (%)", color: "#3b82f6", max: 100 },
    "Violent Crime Rate": { key: "violent_crime", label: "Violent Crime (per 100k)", color: "#f59e0b", max: 1000, invert: true },
    "Unemployment Rate": { key: "unemployment", label: "Unemployment Rate (%)", color: "#8b5cf6", max: 15, invert: true },
    "Homeownership Rate": { key: "homeownership", label: "Homeownership Rate (%)", color: "#ec4899", max: 100 }
};

export const canDimensions = Object.keys(canDimensionsMap);

// Simple mock generator
const generateMockProvinceData = (provinceName, showForecast) => {
    const data = [];
    let baseIncome = 50000 + Math.random() * 40000;
    let basePoverty = 5 + Math.random() * 10;
    let baseGrad = 80 + Math.random() * 15;
    let baseCrime = 150 + Math.random() * 400;
    let baseUnemp = 4 + Math.random() * 5;
    let baseHome = 60 + Math.random() * 20;

    for (let year = 2010; year <= 2023; year++) {
        data.push({
            year,
            state: provinceName,
            is_forecast: false,
            median_income: baseIncome + (year - 2010) * 1200 + Math.random() * 1500,
            poverty_rate: Math.max(0, basePoverty - (year - 2010) * 0.15 + Math.random() * 1.5),
            hs_grad_rate: Math.min(100, baseGrad + (year - 2010) * 0.4 + Math.random() * 1.5),
            violent_crime: Math.max(0, baseCrime - (year - 2010) * 4 + Math.random() * 20),
            unemployment: Math.max(0, baseUnemp - (year - 2010) * 0.1 + Math.random() * 1.5),
            homeownership: Math.min(100, baseHome + (year - 2010) * 0.2 + Math.random() * 1.5)
        });
    }

    // Add forecast data
    if (showForecast) {
        for (let year = 2024; year <= 2028; year++) {
            data.push({
                year,
                state: provinceName,
                is_forecast: true,
                median_income: baseIncome + (year - 2010) * 1200 + Math.random() * 1500,
                poverty_rate: Math.max(0, basePoverty - (year - 2010) * 0.15 + Math.random() * 1.5),
                hs_grad_rate: Math.min(100, baseGrad + (year - 2010) * 0.4 + Math.random() * 1.5),
                violent_crime: Math.max(0, baseCrime - (year - 2010) * 4 + Math.random() * 20),
                unemployment: Math.max(0, baseUnemp - (year - 2010) * 0.1 + Math.random() * 1.5),
                homeownership: Math.min(100, baseHome + (year - 2010) * 0.2 + Math.random() * 1.5)
            });
        }
    }
    return data;
};

// Expose a function to get mock data for a list of province names
export const getMockCanData = (provinceNames, showForecast = false) => {
    const result = {};
    provinceNames.forEach(name => {
        result[name] = generateMockProvinceData(name, showForecast);
    });
    return result;
};
