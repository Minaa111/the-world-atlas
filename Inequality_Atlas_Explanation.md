# The Inequality Atlas: Comprehensive Project Explanation

This document serves as a complete reference guide for "The Inequality Atlas" project. It covers the architectural layout, the technologies used, page-by-page descriptions, deep dives into core functionality (such as the interactive map and AI forecasting), and backend processes. Use this guide to prepare for any questions during your discussion day.

---

## 1. Project Overview & Architecture

The Inequality Atlas is a full-stack web application designed to visualize and compare various global socio-economic and environmental dimensions (like Gini index, Life Expectancy, PM2.5, etc.) across different countries. 

The architecture is divided into two main parts:
- **Frontend (Client-Side)**: A React.js Single Page Application (SPA) built with Vite. It is responsible for all user interactions, data rendering (charts, maps), and UI state management.
- **Backend (Server-Side)**: A Python Flask server that handles API requests, retrieves historical data from a SQLite database, and computes AI forecasts on the fly using Scikit-learn.

### Data Flow Example
1. The user selects a country (e.g., "Egypt") on the React frontend.
2. The frontend sends an HTTP GET request via Axios to the backend endpoint: `/api/data/compare?countries=EGY&forecast=true`.
3. The Flask backend queries the SQLite database (`inequality.db`) for Egypt's historical data using SQLAlchemy.
4. If the `forecast=true` parameter is passed, the backend runs a linear regression algorithm (Scikit-learn) on the historical data to predict the next 5 years.
5. The backend returns a structured JSON payload to the frontend.
6. The frontend parses the JSON and renders it beautifully using `Chart.js` components and React state updates.

---

## 2. Technologies Used

### Frontend Stack
- **React.js (v18)**: The core JavaScript library used for building the user interface through reusable components.
- **Vite**: A fast, modern build tool and development server that bundles the React application.
- **TailwindCSS**: A utility-first CSS framework used for styling the entire application quickly and responsively without writing custom CSS classes.
- **React Router DOM**: Handles navigation between different pages (Home, Analysis, About) without reloading the browser.
- **Chart.js & React-Chartjs-2**: Used to render the highly interactive visualizations in the Analysis workspace, including Time-Series (Line), Radar, and Correlation (Scatter) charts.
- **React-Simple-Maps**: A mapping library used to render the interactive SVG world map on the Home page and in the Add Country modal.
- **Axios**: A promise-based HTTP client used to fetch data from the Flask API.
- **html2canvas-pro & jsPDF**: Used together to capture a screenshot of the user's workspace and export it as a high-quality PDF report.
- **Lucide-React**: A clean, modern icon library used throughout the UI.

### Backend Stack
- **Python (v3)**: The programming language driving the backend logic.
- **Flask**: A lightweight web framework used to create the API endpoints.
- **Flask-SQLAlchemy**: An Object Relational Mapper (ORM) that bridges Python code and the SQLite database, making it easy to query records without raw SQL.
- **Flask-Caching**: Used to cache frequent API responses in memory (for 24 hours), drastically speeding up load times for popular queries.
- **Scikit-learn**: A robust machine learning library used specifically for its `LinearRegression` model to generate 5-year data forecasts.
- **SQLite**: A lightweight, file-based database (`inequality.db`) that stores all the historical indicators for every country.

---

## 3. Project Structure

Here is a breakdown of the important folders and files in the repository:

- `api/`
  - `index.py`: The heart of the backend. It initializes the Flask app, connects to SQLite, defines the `AnnualIndicator` data model, and exposes the REST API endpoints.
  - `inequality.db`: The SQLite database containing all the raw dataset information.
- `src/`
  - `main.jsx` & `App.jsx`: The entry points of the React application where routing (React Router) is configured.
  - `index.css`: The main stylesheet where TailwindCSS directives are imported.
  - `Map.jsx`: The standalone component responsible for rendering the interactive world map using `react-simple-maps`.
  - `pages/`
    - `Home.jsx`: The landing page.
    - `Analysis.jsx`: The core interactive workspace containing all charts and logic.
    - `About.jsx`: A static page explaining the data indicators and sources.
    - `Countries.jsx`: A page to browse available countries.
  - `components/`
    - `CountriesList.jsx`: A list/search view component for selecting countries to add to the analysis.
    - `Navbar.jsx` & `Footer.jsx`: Global layout components.
- `package.json` & `vite.config.js`: Frontend configuration and dependency tracking files.

---

## 4. Description of Pages

1. **Home Page**: The landing experience. It typically features a heroic introduction and provides an entry point (usually via the interactive map) for users to dive straight into the data analysis by clicking a country.
2. **Analysis Page**: The "Workspace". This is where the heavy lifting happens. Users can view multiple dimensions across multiple countries, toggle different chart types, turn on AI forecasting, and export their findings.
3. **About Page**: A reference document built into the website. It lists out the 7 core dimensions (Gini, Life Expectancy, Literacy Rate, Homicide Rate, PM2.5, GNI, GNI per capita) and details where the data originated from.
4. **Countries Page**: A directory that allows users to look at all available countries in the database in a list format, rather than having to find them on the map.

---

## 5. Core Features Explained

### 5.1 The Interactive Map (`src/Map.jsx`)
The map is rendered using `react-simple-maps`, which consumes a TopoJSON file (`world-atlas`). 
- **How it works**: The map iterates over geographical coordinates (called Geographies) and renders them as SVG paths. 
- **Interactivity**: When a user hovers over a country, the `onMouseEnter` event triggers a tooltip showing the country name and its flag (fetched via `flagcdn.com` using the `country-code-lookup` package).
- **Selection**: When a user clicks a country, the `onCountrySelect` callback fires, passing the country's name and ISO3 code back up to the parent component, usually routing them directly to the Analysis workspace with that country pre-selected.

### 5.2 The Analysis Workspace (`src/pages/Analysis.jsx`)
This is the most complex page in the app. It maintains several states:
- `selectedCountries`: An array of country objects the user wants to compare.
- `activeDimensions`: Which indicators (e.g., GNI, Literacy) the user is currently viewing.
- `viewTab`: The current chart mode (`time`, `radar`, or `scatter`).
- `showForecast`: A boolean that tells the frontend whether to request AI predictions from the backend.

### 5.3 Time-Series View (Line Charts)
Built with `Chart.js`, this view maps data against time (years on the X-axis, metric value on the Y-axis).
- **Functionality**: For every active dimension, it creates a separate line chart. It dynamically calculates the minimum and maximum years based on the available data to ensure the X-axis is properly scaled.
- **Handling Missing Data**: `spanGaps: true` is used in the chart config to visually connect lines even if a specific year's data is missing.

### 5.4 AI Forecast in Time-Series View
If the user enables the "AI Forecast", the frontend sends `forecast=true` in its API request. 
- **Visuals**: The forecasted data points are appended to the historical data. The forecast lines are styled differently (usually dashed lines without dots) so users can easily distinguish between historical truth and AI prediction. The legend allows users to toggle visibility.

### 5.5 Radar View
The Radar chart compares the *latest available data* for the selected countries across all 7 dimensions simultaneously.
- **Normalization**: Because dimensions have vastly different scales (Gini goes to 100, while GNI goes into the trillions), the values are normalized against global theoretical maximums (e.g., GNI max set to 30 Trillion). This converts all values to a percentage (0-100), ensuring the radar shape is proportional and easy to read.
- **Custom Plugin**: A custom Chart.js plugin is implemented to ensure the labels at the points of the hexagon are perfectly centered for better UI aesthetics.

### 5.6 Correlation View (Scatter Plot)
This tool allows users to find correlations between two different socio-economic indicators.
- **Functionality**: The user selects a dimension for the X-axis (e.g., GNI per capita) and a dimension for the Y-axis (e.g., Life Expectancy). 
- **Rendering**: Every historical data point where a country has data for *both* dimensions in the same year is plotted as a single dot. This allows users to visually identify trends (e.g., "As GNI per capita rises, Life Expectancy generally increases").

### 5.7 Data Export Features
- **Download CSV**: The app iterates through the currently selected countries and dimensions, formats them into a comma-separated string, creates a hidden anchor (`<a>`) tag with a data URI, and triggers a download.
- **Export as PDF**: The app uses `html2canvas` to take a literal "screenshot" of the `#analysis-workspace-content` DOM element. Because Chart.js canvases can sometimes render completely black in PDFs, the code temporarily replaces the `canvas` elements with standard `<img>` tags populated via `.toDataURL()`. It then captures the DOM, uses `jsPDF` to build the document based on the screenshot dimensions, and downloads it.

---

## 6. Backend API & Functions (`api/index.py`)

The Flask backend is built for speed and simplicity. It uses caching to ensure complex data aggregations don't stall the server.

### 6.1 Database Setup
The `AnnualIndicator` class defines the SQLAlchemy model. It maps exactly to the columns in the SQLite database, representing a specific country's metrics in a specific year.

### 6.2 The `get_data()` Endpoint (`/api/data`)
- **Purpose**: Fetches historical data for a single country.
- **Flow**: Retrieves the `country` parameter from the URL, queries the database, and returns a JSON list of dictionaries.

### 6.3 The `compare_data()` Endpoint (`/api/data/compare`)
- **Purpose**: The most crucial endpoint. It handles multiple countries and the AI forecasting request.
- **Flow**: It takes a comma-separated list of ISO3 country codes. It groups the resulting database rows by country.
- **Forecasting Implementation**: If `forecast=true`, it calls the `generate_forecast()` helper function for each dimension of each country. It then merges the newly generated forecast years into the JSON payload alongside the historical data, marking them explicitly with a flag: `'is_forecast': True`.

### 6.4 The `generate_forecast()` Function
This is where the Scikit-learn Machine Learning magic happens.
1. **Validation**: It ensures the country has at least 3 valid historical data points for the given dimension (you can't draw a reliable trend line with less).
2. **Setup**: It extracts the 'years' as the independent variable (X) and the dimension values as the dependent variable (y).
3. **Training**: It initializes `LinearRegression()` and calls `.fit(X, y)` to train the model on the historical trend.
4. **Prediction**: It creates an array of the next 5 future years, and uses `.predict(future_years)` to calculate what the values should be based on the established linear trend.
5. **Return**: It formats these predictions into dictionaries and ensures that negative predictions are capped at 0 (since things like negative Life Expectancy or Literacy Rate are impossible).

### 6.5 The `latest_data()` Endpoint (`/api/data/latest`)
- **Purpose**: Quickly fetch the most recent data point for every country in the database.
- **Usage**: This is heavily utilized by global views (like the map or large list views) to show a summary without downloading the entire historical dataset. It sorts all data descending by year and stores the first encounter of each country.
