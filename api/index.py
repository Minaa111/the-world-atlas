from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import numpy as np
from sklearn.linear_model import LinearRegression
from flask_caching import Cache

import os

app = Flask(__name__)
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'inequality.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache', 'CACHE_DEFAULT_TIMEOUT': 86400})

db = SQLAlchemy(app)

class AnnualIndicator(db.Model):
    country = db.Column(db.String(50), primary_key=True)
    year = db.Column(db.Integer, primary_key=True)
    gini = db.Column(db.Float, nullable=True)
    life_expectancy = db.Column(db.Float, nullable=True)
    literacy_rate = db.Column(db.Float, nullable=True)
    homicide_rate = db.Column(db.Float, nullable=True)
    pm25 = db.Column(db.Float, nullable=True)
    gni = db.Column(db.Float, nullable=True)
    gni_per_capita = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            'country': self.country,
            'year': self.year,
            'gini': self.gini,
            'life_expectancy': self.life_expectancy,
            'literacy_rate': self.literacy_rate,
            'homicide_rate': self.homicide_rate,
            'pm25': self.pm25,
            'gni': self.gni,
            'gni_per_capita': self.gni_per_capita
        }

@app.route('/api/data', methods=['GET'])
@cache.cached(timeout=86400, query_string=True)
def get_data():
    country = request.args.get('country')
    if not country:
        return jsonify({"error": "Country parameter is required"}), 400
    
    query = AnnualIndicator.query.filter_by(country=country).order_by(AnnualIndicator.year).all()
    return jsonify([record.to_dict() for record in query])

def generate_forecast(records, dimension, years_ahead=5):
    valid_records = [r for r in records if r.get(dimension) is not None]
    if len(valid_records) < 3:
        return []
    
    valid_records.sort(key=lambda x: x['year'])
    
    X = np.array([r['year'] for r in valid_records]).reshape(-1, 1)
    y = np.array([r[dimension] for r in valid_records])
    
    model = LinearRegression()
    model.fit(X, y)
    
    last_year = valid_records[-1]['year']
    future_years = np.array([[last_year + i] for i in range(1, years_ahead + 1)])
    predictions = model.predict(future_years)
    
    return [{'year': int(future_years[i][0]), dimension: round(float(predictions[i]), 4), 'is_forecast': True} for i in range(years_ahead)]

@app.route('/api/data/compare', methods=['GET'])
@cache.cached(timeout=86400, query_string=True)
def compare_data():
    countries_param = request.args.get('countries')
    forecast_param = request.args.get('forecast', 'false').lower() == 'true'
    
    if not countries_param:
        return jsonify({"error": "Countries parameter is required"}), 400
    
    countries_list = [c.strip() for c in countries_param.split(',')]
    query = AnnualIndicator.query.filter(AnnualIndicator.country.in_(countries_list)).order_by(AnnualIndicator.year).all()
    
    result = {}
    for record in query:
        c = record.country
        if c not in result:
            result[c] = []
        d = record.to_dict()
        d['is_forecast'] = False
        result[c].append(d)
        
    if forecast_param:
        dimensions = ['gini', 'life_expectancy', 'literacy_rate', 'homicide_rate', 'pm25', 'gni', 'gni_per_capita']
        for c in result:
            forecasts_by_year = {}
            for dim in dimensions:
                preds = generate_forecast(result[c], dim, years_ahead=5)
                for p in preds:
                    y = p['year']
                    if y not in forecasts_by_year:
                        forecasts_by_year[y] = {
                            'year': y, 'country': c, 'is_forecast': True, 
                            'gini': None, 'life_expectancy': None, 'literacy_rate': None, 
                            'homicide_rate': None, 'pm25': None, 'gni': None, 'gni_per_capita': None
                        }
                    val = p[dim]
                    if val < 0: val = 0
                    forecasts_by_year[y][dim] = val
                    
            for y in sorted(forecasts_by_year.keys()):
                result[c].append(forecasts_by_year[y])
                
    return jsonify(result)

@app.route('/api/data/global', methods=['GET'])
@cache.cached(timeout=86400, query_string=True)
def global_data():
    year = request.args.get('year', type=int)
    if not year:
        return jsonify({"error": "Year parameter is required"}), 400
    
    query = AnnualIndicator.query.filter_by(year=year).all()
    
    result = {}
    for record in query:
        result[record.country] = record.to_dict()
        
    return jsonify(result)

@app.route('/api/data/latest', methods=['GET'])
@cache.cached(timeout=86400)
def latest_data():
    all_data = AnnualIndicator.query.order_by(AnnualIndicator.year.desc()).all()
    
    latest_by_country = {}
    for record in all_data:
        c = record.country
        if c not in latest_by_country:
            latest_by_country[c] = record.to_dict()
            
    return jsonify(list(latest_by_country.values()))

@app.route('/api/data/aggregates', methods=['GET'])
@cache.cached(timeout=86400)
def aggregates_data():
    all_data = AnnualIndicator.query.order_by(AnnualIndicator.year.desc()).all()
    
    import pycountry
    
    # Calculate accurate latest values per dimension
    latest_by_country = {}
    dimensions = ['life_expectancy', 'pm25', 'literacy_rate', 'gni', 'gini', 'homicide_rate']
    
    for record in all_data:
        c = record.country
        if c not in latest_by_country:
            latest_by_country[c] = {
                'country': c,
                'year': record.year,
                'life_expectancy': None,
                'pm25': None,
                'literacy_rate': None,
                'gni': None,
                'gini': None,
                'homicide_rate': None
            }
        
        # Take the most recent non-null value for each dimension
        for dim in dimensions:
            if latest_by_country[c][dim] is None and getattr(record, dim) is not None:
                latest_by_country[c][dim] = getattr(record, dim)
                latest_by_country[c][f"{dim}_year"] = record.year
            
    latest_records = list(latest_by_country.values())
    
    def get_avg(dimension):
        valid = [r for r in latest_records if r[dimension] is not None and pycountry.countries.get(alpha_3=r['country']) is not None]
        vals = [r[dimension] for r in valid]
        return sum(vals) / len(vals) if vals else None
        
    def get_max(dimension):
        valid = [r for r in latest_records if r[dimension] is not None and pycountry.countries.get(alpha_3=r['country']) is not None]
        if not valid: return None
        max_record = max(valid, key=lambda x: x[dimension])
        return {"country": max_record['country'], "value": max_record[dimension], "year": max_record.get(f"{dimension}_year")}
        
    def get_min(dimension):
        valid = [r for r in latest_records if r[dimension] is not None and pycountry.countries.get(alpha_3=r['country']) is not None]
        if not valid: return None
        min_record = min(valid, key=lambda x: x[dimension])
        return {"country": min_record['country'], "value": min_record[dimension], "year": min_record.get(f"{dimension}_year")}

    # Calculate global trends over the last 15 years
    all_years = sorted(list(set([r.year for r in all_data])))
    recent_years = all_years[-15:]
    
    trends = {dim: [] for dim in dimensions}
    
    for y in recent_years:
        # Get all country records for this year
        y_data = [r for r in all_data if r.year == y and pycountry.countries.get(alpha_3=r.country) is not None]
        for dim in dimensions:
            vals = [getattr(r, dim) for r in y_data if getattr(r, dim) is not None]
            if vals:
                trends[dim].append({'year': y, 'value': sum(vals) / len(vals)})
            else:
                trends[dim].append({'year': y, 'value': None})

    return jsonify({
        "total_countries": len([c for c in latest_records if pycountry.countries.get(alpha_3=c['country'])]),
        "avg_life_expectancy": get_avg("life_expectancy"),
        "avg_pm25": get_avg("pm25"),
        "avg_literacy_rate": get_avg("literacy_rate"),
        "avg_homicide_rate": get_avg("homicide_rate"),
        "max_gni": get_max("gni"),
        "min_gini": get_min("gini"),
        "trends": trends
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
