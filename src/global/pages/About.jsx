import React from 'react';

export default function About() {
    return (
        <div className="w-full flex-1 flex flex-col items-center bg-[#F9F8FF]" style={{ paddingTop: '140px', paddingBottom: '60px' }}>
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-[#EBE9FC] p-8 md:p-14 mx-6">
                <h1 className="text-4xl md:text-5xl font-bold text-[#010104] mb-10 tracking-tight">About The Project</h1>

                <div className="text-[#010104] opacity-80 space-y-6 text-lg leading-relaxed font-medium">
                    <p>
                        The World Atlas is a data-driven platform for exploring and visualizing key global development indicators across countries, including income, health, education, safety, and environmental quality. While the platform is built with careful attention to data sources and presentation, it remains an academic graduate project rather than an official or institutional resource.
                    </p>

                    <h2 className="text-2xl font-bold text-[#010104] mt-12 mb-4 opacity-100">Data Sources</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-gray-50 border border-[#EBE9FC] rounded-2xl p-6 transition-all hover:bg-white hover:shadow-md">
                            <h3 className="text-xl font-bold text-[#010104] mb-3">Gross National Income GNI, Atlas method (current US$)</h3>
                            <p className="text-[15px] leading-relaxed mb-4 text-gray-600">Gross national income is the total income earned by residents of an economy in a given year, calculated as GDP plus net income from abroad. It is converted to U.S. dollars using the World Bank Atlas method, which smooths exchange rate and inflation fluctuations using a multi-year average. This indicator is expressed in current U.S. dollars without inflation adjustment.</p>
                            <div className="text-xs font-bold text-gray-500 bg-white border border-gray-200 py-1.5 px-3 rounded-lg inline-block">Source: World Bank</div>
                        </div>

                        <div className="bg-gray-50 border border-[#EBE9FC] rounded-2xl p-6 transition-all hover:bg-white hover:shadow-md">
                            <h3 className="text-xl font-bold text-[#010104] mb-3">GNI per capita, Atlas method (current US$)</h3>
                            <p className="text-[15px] leading-relaxed mb-4 text-gray-600">Gross national income per capita is GNI divided by the midyear population, representing average income per person in an economy. It is converted to U.S. dollars using the World Bank Atlas method, which smooths exchange rate and inflation fluctuations using a multi-year average. This indicator is expressed in current U.S. dollars without inflation adjustment.</p>
                            <div className="text-xs font-bold text-gray-500 bg-white border border-gray-200 py-1.5 px-3 rounded-lg inline-block">Source: World Bank</div>
                        </div>

                        <div className="bg-gray-50 border border-[#EBE9FC] rounded-2xl p-6 transition-all hover:bg-white hover:shadow-md">
                            <h3 className="text-xl font-bold text-[#010104] mb-3">Gini Index</h3>
                            <p className="text-[15px] leading-relaxed mb-4 text-gray-600">The Gini index measures income inequality within an economy by assessing how income distribution deviates from perfect equality. It is derived from the Lorenz curve, where 0 represents perfect equality and 100 represents perfect inequality.</p>
                            <div className="text-xs font-bold text-gray-500 bg-white border border-gray-200 py-1.5 px-3 rounded-lg inline-block">Source: World Bank</div>
                        </div>

                        <div className="bg-gray-50 border border-[#EBE9FC] rounded-2xl p-6 transition-all hover:bg-white hover:shadow-md">
                            <h3 className="text-xl font-bold text-[#010104] mb-3">Life expectancy at birth, total (years)</h3>
                            <p className="text-[15px] leading-relaxed mb-4 text-gray-600">Life expectancy at birth indicates the average number of years a newborn is expected to live if current mortality patterns remain unchanged throughout their lifetime.</p>
                            <div className="text-xs font-bold text-gray-500 bg-white border border-gray-200 py-1.5 px-3 rounded-lg inline-block">Source: World Health Organization (WHO)</div>
                        </div>

                        <div className="bg-gray-50 border border-[#EBE9FC] rounded-2xl p-6 transition-all hover:bg-white hover:shadow-md">
                            <h3 className="text-xl font-bold text-[#010104] mb-3">Literacy rate, adult total (% of people ages 15 and above)</h3>
                            <p className="text-[15px] leading-relaxed mb-4 text-gray-600">Adult literacy rate is the percentage of people aged 15 and above who can read and write a simple statement about their everyday life with understanding.</p>
                            <div className="text-xs font-bold text-gray-500 bg-white border border-gray-200 py-1.5 px-3 rounded-lg inline-block">Source: UNESCO Institute for Statistics</div>
                        </div>

                        <div className="bg-gray-50 border border-[#EBE9FC] rounded-2xl p-6 transition-all hover:bg-white hover:shadow-md">
                            <h3 className="text-xl font-bold text-[#010104] mb-3">Intentional Homicide Rate</h3>
                            <p className="text-[15px] leading-relaxed mb-4 text-gray-600">Intentional homicide rate is the number of unlawful, intentional killings per 100,000 people in a population.</p>
                            <div className="text-xs font-bold text-gray-500 bg-white border border-gray-200 py-1.5 px-3 rounded-lg inline-block">Source: United Nations Office on Drugs and Crime (UNODC)</div>
                        </div>

                        <div className="bg-gray-50 border border-[#EBE9FC] rounded-2xl p-6 transition-all hover:bg-white hover:shadow-md md:col-span-2">
                            <h3 className="text-xl font-bold text-[#010104] mb-3">PM2.5 air pollution, mean annual exposure (micrograms per cubic meter)</h3>
                            <p className="text-[15px] leading-relaxed mb-4 text-gray-600">PM2.5 exposure measures the average annual concentration of fine particulate matter in the air, weighted by population exposure in both urban and rural areas. These particles can penetrate deep into the lungs and pose serious health risks.</p>
                            <div className="text-xs font-bold text-gray-500 bg-white border border-gray-200 py-1.5 px-3 rounded-lg inline-block">Source: World Bank and World Health Organization (WHO)</div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-[#010104] mt-12 mb-4 opacity-100">Disclaimer</h2>

                    <p>
                        The data presented on this platform is sourced from publicly available datasets and may be subject to limitations such as inconsistencies, missing values, or variations in reporting standards between countries. As a result, the visualizations and comparisons provided may not fully reflect real-world conditions or current realities.
                    </p>

                    <p>
                        <strong>Note on Individual Country Profiles:</strong> The current data available for the United States profile and its individual states is mock-generated for demonstration purposes and does not represent real-world statistics.
                    </p>

                    <p>
                        Users are encouraged to interpret the information critically and, where appropriate, consult original data sources or official publications for accurate and up-to-date information.
                    </p>
                </div>
            </div>
        </div>
    );
}
