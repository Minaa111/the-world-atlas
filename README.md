<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</div>

<br />

<div align="center">
  <h1 align="center">The World Atlas</h1>
  <p align="center">
    <strong>Global Macroeconomic Analytics & Structural AI Forecasting</strong>
    <br />
    <br />
    <a href="https://the-world-atlas.vercel.app"><strong>View Live Platform »</strong></a>
  </p>
</div>

---

## Project Overview

**The World Atlas** is an academic graduate project engineered to make complex global socio-economic data intuitive, accessible, and deeply analytical. It bridges the gap between raw macroeconomic statistics and visually stunning, context-aware user interfaces. 

By utilizing decades of historical data from the World Bank and other reputable organizations, the platform allows researchers to cross-examine nations on multiple developmental axes simultaneously, and project future trajectories using structural AI forecasting.

## Core Features

### Global Navigation & Exploration
Navigate and select countries using three distinct interface modes tailored for usability:
*   **3D Globe**: A highly interactive, spinning globe visualization for spatial context.
*   **2D Map**: A flat geospatial projection for rapid country selection.
*   **List View**: A streamlined, alphabetical directory of all sovereign states.

<!-- Placeholder for Globe/Map Screenshot -->
> *[Insert screenshot of the 3D Globe or 2D Map here]*

### Analysis Workspace
A dedicated, multi-faceted analytical sandbox to compare global economies using a variety of interactive tools:
*   **Time Series**: Track historical trajectories and utilize Structural AI Forecasting to predict 5-year future trends.
*   **Bar Chart**: Conduct direct cross-sectional comparisons between nations for a specific year.
*   **Radar & Polar Area Views**: Compare countries across multiple thematic indicators simultaneously (e.g., Economic Vitality vs. Human Capital).
*   **Correlation Scatter**: Map two distinct metrics against each other to identify underlying global correlations.
*   **Data Table**: Inspect the raw numerical data driving the active visualizations.
*   **Context-Aware Exporting**: Dynamically export PDF reports and filtered CSV data that perfectly mirrors the active UI state.

<!-- Placeholder for Analysis Workspace Screenshot -->
> *[Insert screenshot of the Analysis Workspace (e.g., Radar or Time-Series) here]*

### Global Choropleth
Visualize a single macroeconomic indicator across the entire planet simultaneously. This feature renders dynamic heatmaps on both the 3D globe and 2D map geometries, allowing for immediate identification of global disparities.

<!-- Placeholder for Choropleth Screenshot -->
> *[Insert screenshot of the Choropleth heatmap here]*

### Data Directory
A centralized hub for exploring the underlying historical datasets, including metadata, statistical distributions, and historical completeness for all tracked indicators.

### Deep-Dive Individual Country Profiles
Go beyond the global scope with isolated country profiles. This feature provides simulated localized data for specific regions (such as US States, Canadian Provinces, and Australian Territories) and allows you to run them through the exact same Analysis Workspace tools.

<!-- Placeholder for Country Profile Screenshot -->
> *[Insert screenshot of a deep-dive country profile (e.g., USA states) here]*

## Macroeconomic Indicators Tracked

The Atlas meticulously tracks 17 distinct macroeconomic and developmental indicators grouped into four core thematic pillars:

### Economic Vitality
*   **Gross National Income (GNI)**: Total domestic and foreign output claimed by residents.
*   **GNI per Capita**: GNI divided by midyear population.
*   **Inflation Rate**: Annual inflation rate (Consumer Prices %).
*   **Unemployment Rate**: Unemployment, total (% of total labor force).
*   **Poverty Headcount Ratio**: Poverty headcount ratio at $2.15 a day (% of population).

### Human Capital & Health
*   **Life Expectancy**: Average number of years a newborn is expected to live.
*   **Literacy Rate**: Percentage of people ages 15 and above who can read and write.
*   **Population**: Total national population.
*   **Fertility Rate**: Total births per woman.
*   **Infant Mortality Rate**: Infant mortality rate (per 1,000 live births).

### Equity & Safety
*   **Gini Index**: Measures the extent to which the distribution of income deviates from a perfectly equal distribution.
*   **Intentional Homicide Rate**: Intentional homicides per 100,000 people.
*   **Gender Parity Index (GPI)**: School enrollment, primary and secondary, gender parity index.

### Environment & Infrastructure
*   **PM2.5 Air Pollution**: Mean annual exposure to fine particulate matter (µg/m³).
*   **CO2 Emissions**: Metric tons per capita.
*   **Access to Electricity**: Percentage of population with access.
*   **Internet Penetration**: Individuals using the Internet (% of population).

## Technical Architecture

### Frontend Layer
*   **React + Vite**: For blazing fast HMR and optimized production bundling.
*   **TailwindCSS**: For a strictly modern, dark-mode-first glassmorphism design system.
*   **Chart.js / React-Chartjs-2**: The core engine powering the reactive data canvases.
*   **D3.js & TopoJSON**: For rendering the interactive SVG-based choropleth mapping geometries.

### Backend Layer
*   **Flask (Python)**: Serving as a lightweight API gateway and data router.
*   **SQLite3**: Providing ultra-fast read-heavy database querying for over half a century of historical data.
*   **Random Walk Algorithms**: Generating logical bounding forecasts to simulate AI trajectory predictions on historical variance.

## Academic Disclaimer

The World Atlas is strictly an **academic graduate project** and is not intended to serve as an official or institutional resource. 

While pre-2023 historical data is sourced from real-world aggregators (like the World Bank), the platform employs structural AI forecasting to simulate post-2023 future trajectories. Furthermore, localized regional data for countries like the USA, Canada, and Australia are generated via mock data arrays.

**Users are encouraged to interpret this platform strictly as a technical demonstration of full-stack analytical visualization capabilities, and not as a source of accurate future global projections.**
