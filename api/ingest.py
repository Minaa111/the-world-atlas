import pandas as pd
from index import app, db, AnnualIndicator
import os

datasets_dir = '../src/global/data/datasets'

def process_wb_csv(filepath, value_name):
    print(f"Processing {filepath}...")
    df = pd.read_csv(filepath, skiprows=4)
    years = [str(y) for y in range(1960, 2026)]
    years = [y for y in years if y in df.columns]
    
    df_melt = df.melt(id_vars=['Country Code'], value_vars=years, var_name='year', value_name=value_name)
    df_melt.rename(columns={'Country Code': 'iso3'}, inplace=True)
    df_melt['year'] = df_melt['year'].astype(int)
    df_melt.dropna(subset=[value_name], inplace=True)
    return df_melt

def process_homicide():
    filepath = os.path.join(datasets_dir, 'Intentional Homicide Victims by counts and rates p.xls')
    print(f"Processing {filepath}...")
    # The header is actually on row index 2
    df = pd.read_excel(filepath, skiprows=2)
    
    # Filter for rate per 100,000 population
    if 'Unit of measurement' in df.columns:
        df = df[df['Unit of measurement'] == 'Rate per 100,000 population']
    
    df = df[['Iso3_code', 'Year', 'VALUE']].rename(columns={
        'Iso3_code': 'iso3',
        'Year': 'year',
        'VALUE': 'homicide_rate'
    })
    df['year'] = pd.to_numeric(df['year'], errors='coerce')
    df['homicide_rate'] = pd.to_numeric(df['homicide_rate'], errors='coerce')
    df.dropna(subset=['year', 'homicide_rate', 'iso3'], inplace=True)
    df['year'] = df['year'].astype(int)
    
    # In case there are multiple entries (e.g. by sex) we take the mean or filter for 'Total'
    # For safety, mean
    df = df.groupby(['iso3', 'year'])['homicide_rate'].mean().reset_index()
    return df

with app.app_context():

    print("Loading CSVs...")
    df_gini = process_wb_csv(os.path.join(datasets_dir, 'gini.csv'), 'gini')
    df_life = process_wb_csv(os.path.join(datasets_dir, 'life-expectancy.csv'), 'life_expectancy')
    df_lit = process_wb_csv(os.path.join(datasets_dir, 'literacy-rate.csv'), 'literacy_rate')
    df_pm25 = process_wb_csv(os.path.join(datasets_dir, 'pm25.csv'), 'pm25')
    df_gni = process_wb_csv(os.path.join(datasets_dir, 'gni.csv'), 'gni')
    df_gni_pc = process_wb_csv(os.path.join(datasets_dir, 'gni-per-capita.csv'), 'gni_per_capita')
    
    df_inf = process_wb_csv(os.path.join(datasets_dir, 'inflation.csv'), 'inflation_rate')
    df_uem = process_wb_csv(os.path.join(datasets_dir, 'unemployment.csv'), 'unemployment_rate')
    df_pov = process_wb_csv(os.path.join(datasets_dir, 'poverty.csv'), 'poverty_ratio')
    df_pop = process_wb_csv(os.path.join(datasets_dir, 'population.csv'), 'population')
    df_fer = process_wb_csv(os.path.join(datasets_dir, 'fertility.csv'), 'fertility_rate')
    df_imr = process_wb_csv(os.path.join(datasets_dir, 'infant_mortality.csv'), 'infant_mortality')
    df_gpi = process_wb_csv(os.path.join(datasets_dir, 'gpi.csv'), 'gpi')
    df_co2 = process_wb_csv(os.path.join(datasets_dir, 'co2.csv'), 'co2_emissions')
    df_elc = process_wb_csv(os.path.join(datasets_dir, 'electricity.csv'), 'electricity_access')
    df_net = process_wb_csv(os.path.join(datasets_dir, 'internet.csv'), 'internet_usage')

    print("Loading Homicide XLS...")
    df_hom = process_homicide()

    print("Merging data...")
    from functools import reduce
    dataframes = [df_gini, df_life, df_lit, df_pm25, df_hom, df_gni, df_gni_pc, df_inf, df_uem, df_pov, df_pop, df_fer, df_imr, df_gpi, df_co2, df_elc, df_net]
    df_merged = reduce(lambda left, right: pd.merge(left, right, on=['iso3', 'year'], how='outer'), dataframes)

    df_merged.rename(columns={'iso3': 'country'}, inplace=True)
    metrics = ['gini', 'life_expectancy', 'literacy_rate', 'homicide_rate', 'pm25', 'gni', 'gni_per_capita', 'inflation_rate', 'unemployment_rate', 'poverty_ratio', 'population', 'fertility_rate', 'infant_mortality', 'gpi', 'co2_emissions', 'electricity_access', 'internet_usage']
    df_merged.dropna(how='all', subset=metrics, inplace=True)

    print("Inserting into database...")
    df_merged.to_sql('annual_indicator', db.engine, if_exists='replace', index=False)

    print("Data ingestion completed successfully!")
