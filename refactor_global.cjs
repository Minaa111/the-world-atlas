const fs = require('fs');

const filePath = 'src/global/pages/AnalysisWorkspace.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of renderTimeCharts and the start of renderWorkspace
const startIdx = content.indexOf('    const renderTimeCharts = () => {');
const endIdx = content.indexOf('    const renderWorkspace = () => {');

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find boundaries");
    process.exit(1);
}

// Remove all the render* functions
content = content.slice(0, startIdx) + content.slice(endIdx);

// Now replace the calls in the render
const renderTarget = `                {/* Render Selected View */}
                <div id="analysis-workspace-content" className="w-full bg-[#F9F8FF] rounded-3xl pb-4">
                    {viewTab === "time" && renderTimeCharts()}
                    {viewTab === "bar" && renderBarCharts()}
                    {viewTab === "radar" && renderRadarCharts()}
                    {viewTab === "polar" && renderPolarAreaCharts()}
                    {viewTab === "scatter" && renderScatterChart()}
                    {viewTab === "table" && renderDataTable()}
                </div>`;

const replacement = `                {/* Render Selected View */}
                <div id="analysis-workspace-content" className="w-full bg-[#F9F8FF] rounded-3xl pb-4">
                    {viewTab === "time" && (
                        <TimeSeriesView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensionsToRender={[activeDimension]}
                            dimensionsMap={dimensionsMap}
                            showForecast={showForecast}
                            entityColors={countryColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "bar" && (
                        <BarView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            activeDimension={activeDimension}
                            toggleDimension={toggleDimension}
                            entityColors={countryColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "radar" && (
                        <RadarView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            entityColors={countryColors}
                            formatValue={formatValue}
                            globalMaxValues={globalMaxValues}
                        />
                    )}
                    {viewTab === "polar" && (
                        <PolarView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            entityColors={countryColors}
                            formatValue={formatValue}
                            globalMaxValues={globalMaxValues}
                        />
                    )}
                    {viewTab === "scatter" && (
                        <CorrelationView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            scatterX={scatterX}
                            setScatterX={setScatterX}
                            scatterY={scatterY}
                            setScatterY={setScatterY}
                            entityColors={countryColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "table" && (
                        <DataTableView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            formatValue={formatValue}
                        />
                    )}
                </div>`;

content = content.replace(renderTarget, replacement);
fs.writeFileSync(filePath, content);
console.log("Successfully refactored AnalysisWorkspace.jsx");
