# LQ Processing Part 3: attempting to dissolve on top quintile of jobs/sq mile
# to limit analysis to job dense areas, this didn't work too well.

import pandas as pd
import geopandas as gpd
import numpy as np

# load 2002 census wac data from csv
# wac2002 = pd.read_csv("/Users/chrishenrick/fun/aemp_jobs_viz/data/wac/ca_wac_S000_JT00_2002.csv", sep=",", delimiter=None, header="infer", names=None, index_col=None, usecols=None)

# load 2015 census wac data
wac = pd.read_csv("/Users/chrishenrick/fun/aemp_jobs_viz/data/wac/ca_wac_S000_JT00_2002.csv", sep=",", delimiter=None, header="infer", names=None, index_col=None, usecols=None)

# rename geo id column
wac["geoid"] = wac["w_geocode"]
del wac["w_geocode"]

# create new aggregate columns for various job sectors
wac['makers'] = wac['CNS01'] + wac['CNS02'] + wac['CNS03'] + wac['CNS04'] + wac['CNS05'] + wac['CNS06'] + wac['CNS08']
wac['services'] = wac['CNS07'] + wac['CNS14']  +  wac['CNS17']  +  wac['CNS18']
wac['professions'] = wac['CNS09']  +  wac['CNS10']  +  wac['CNS11']  +  wac['CNS12']  +  wac['CNS13']
wac['support'] = wac['CNS15']  +  wac['CNS16']  +  wac['CNS19']  +  wac['CNS20']

# create a column for total number of jobs for each geo
wac['total'] = wac['support'] + wac['professions'] + wac['services'] + wac['makers']

# make sure they all add up
assert sum(wac['C000'] -(wac['makers'] + wac['services'] + wac['professions'] + wac['support'])) == 0

# make a new data frame with only the columns we need from the wac dataframe
df = wac[['geoid', 'makers', 'services', 'professions', 'support', 'total']]


# import our census 2000 block shapefile
blocks = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2010_bay_area_4269.shp")

# create a new "geoid" column for the blocks shapes, dropping the preceeding zero
blocks["geoid"] = blocks.GEOID10.str[1:]

# cast the blocks geoid data type to numeric so it can be joined with the df
blocks[['geoid']] = blocks[['geoid']].apply(pd.to_numeric)

# merge (join) our blocks to the processed wac data
# `left_on` is the column for the blocks shapefile, `right_on` is the column for the tabular data
# `on` is when both columns share the same name
blocks = blocks.merge(df, how="inner", on="geoid")

# only grab columns we need
filtered = blocks[['TRACTCE10', 'makers', 'services', 'professions', 'support', 'total']]

# group by census tract id
grouped = filtered.groupby('TRACTCE10', as_index=False)

# aggregate data by computing the sum for each category for each group
aggregated = grouped.agg(np.sum)


# load census tract shp
tracts = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/census_tracts/census_tracts_2016_bay_area_4269.shp")

# join tract geometries to aggregated blocks data
tracts = tracts.merge(aggregated, how="inner", left_on="TRACTCE", right_on="TRACTCE10")

# convert to state plane for calculating area correctly
tracts = tracts.to_crs(epsg=2227)

# calc square mile area for each tract
tracts["area_sqmi"] = (tracts.area * 3.58701e-8)

# calc the total number of jobs per sq mile
tracts["density"] = tracts["total"] / tracts["area_sqmi"]

# project to WGS84 for ease of use with web visualization tools
tracts = tracts.to_crs(epsg=4326)

# compute the quintiles for job density
tracts['quintile'] = pd.qcut(tracts["density"], 5, labels=False)


### this didn't work so well...
# filter out tracts that are in the top quintile
#top_quintile = tracts.loc[tracts['quintile'] == 4]

# dissolve the filtered tracts by the quintile into their own "regions"
# dissolved = top_quintile.dissolve(by='quintile', aggfunc='sum')
#######


# store totals for each category, these will be the total jobs by category for the entire bay area
makers_total = tracts['makers'].sum()
services_total = tracts['services'].sum()
professions_total = tracts['professions'].sum()
support_total = tracts['support'].sum()
all_total = makers_total + services_total + professions_total + support_total * 1.0

# calculate percentages for each category, these will be used for determining the location quotients later
makers_pct = makers_total / all_total
services_pct = services_total / all_total
professions_pct = professions_total / all_total
support_pct = support_total / all_total

# repeat for the tract level
# percentages
tracts['makers_pct'] = tracts['makers'] / tracts['total']
tracts['services_pct'] = tracts['services'] / tracts['total']
tracts['professions_pct'] = tracts['professions'] / tracts['total']
tracts['support_pct'] = tracts['support'] / tracts['total']

# compute tract level location quotients
# using shorthand for column names because of shapefile dbf field charcter count limit
tracts['make_lq'] = tracts['makers_pct'] / makers_pct
tracts['serv_lq'] = tracts['services_pct'] / services_pct
tracts['prof_lq'] = tracts['professions_pct'] / professions_pct
tracts['supp_lq'] = tracts['support_pct'] / support_pct

# create the final dataframe with only the values we need
final = tracts[['make_lq', 'serv_lq', 'prof_lq', 'supp_lq', 'quintile', 'geometry']]

# save output shapefile
final.to_file('/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/density_quintile_dissolve_lq2_2002')
