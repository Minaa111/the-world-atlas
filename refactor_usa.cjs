const fs = require('fs');

const filePath = 'src/countries/usa/pages/USAAnalysisWorkspace.jsx';
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
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensionsToRender={[activeDimension]}
                            dimensionsMap={usDimensionsMap}
                            showForecast={showForecast}
                            entityColors={stateColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "bar" && (
                        <BarView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            activeDimension={activeDimension}
                            toggleDimension={toggleDimension}
                            entityColors={stateColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "radar" && (
                        <RadarView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            entityColors={stateColors}
                            formatValue={formatValue}
                            globalMaxValues={usGlobalMaxValues}
                        />
                    )}
                    {viewTab === "polar" && (
                        <PolarView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            entityColors={stateColors}
                            formatValue={formatValue}
                            globalMaxValues={usGlobalMaxValues}
                        />
                    )}
                    {viewTab === "scatter" && (
                        <CorrelationView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            scatterX={scatterX}
                            setScatterX={setScatterX}
                            scatterY={scatterY}
                            setScatterY={setScatterY}
                            entityColors={stateColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "table" && (
                        <DataTableView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            formatValue={formatValue}
                        />
                    )}
                </div>`;

content = content.replace(renderTarget, replacement);
fs.writeFileSync(filePath, content);
console.log("Successfully refactored USAAnalysisWorkspace.jsx");
