# Creating Location Quotient analysis U.S. Census LEHD WAC data processing (2nd try)
# using Pandas and Geopandas
import pandas as pd
import geopandas as gpd
import numpy as np
import sys
from math import log10, floor

# load 2002 census wac data from csv
wac = pd.read_csv("/Users/chrishenrick/fun/aemp_jobs_viz/data/wac/ca_wac_S000_JT00_2002.csv", sep=",", delimiter=None, header="infer", names=None, index_col=None, usecols=None)

# load the crosswalk file so that we can grab the census tract ids
cxwalk = pd.read_csv("/Users/chrishenrick/data/census/lehd/ca_xwalk.csv")

# rename geo id column
wac["geoid"] = wac["w_geocode"]
del wac["w_geocode"]

# create new aggregate columns for various job sectors
wac['makers'] = wac['CNS01'] + wac['CNS02'] + wac['CNS03'] + wac['CNS04'] + wac['CNS05'] + wac['CNS06'] + wac['CNS08']
wac['services'] = wac['CNS07'] + wac['CNS14']  +  wac['CNS17']  +  wac['CNS18']
wac['professions'] = wac['CNS09']  +  wac['CNS10']  +  wac['CNS11']  +  wac['CNS12']  +  wac['CNS13']
wac['support'] = wac['CNS15']  +  wac['CNS16']  +  wac['CNS19']  +  wac['CNS20']

# make sure they all add up
assert sum(wac['C000'] -(wac['makers'] + wac['services'] + wac['professions'] + wac['support'])) == 0

# make a new data frame with only the columns we need from the wac dataframe
df = wac[['geoid', 'makers', 'services', 'professions', 'support']]

# import our census 2010 block shapefile
blocks = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2010_bay_area_4269.shp")

# create a new "geoid" column for the blocks shapes, dropping the preceeding zero
blocks["geoid"] = blocks.GEOID10.str[1:]

# cast the blocks geoid data type to numeric so it can be joined with the df
blocks[['geoid']] = blocks[['geoid']].apply(pd.to_numeric)

# merge (join) our blocks to the processed wac data
# `left_on` is the column for the blocks shapefile, `right_on` is the column for the tabular data
# `on` is when both columns share the same name
# `how` is the type of join, similar to SQL joins
blocks = blocks.merge(df, how="inner", on="geoid")

# only grab columns we need
filtered = blocks[['TRACTCE10', 'makers', 'services', 'professions', 'support']]

# group by tract id
# NOTE: something odd happens here, the tract id column (TRACTCE10) is no longer available as a field
# an extra argument is needed to prevent the column from being lost (actually it becomes an index)
grouped = filtered.groupby('TRACTCE10', as_index=False)

# view groups
# for name, group in grouped:
#     print name
#     print group

# aggregate data by computing the sum for each category for each group
aggregated = grouped.agg(np.sum)

# we can now compute the location quotients
# store totals for each category, these will be the total jobs by category for the entire bay area
makers_total = filtered['makers'].sum()
services_total = filtered['services'].sum()
professions_total = filtered['professions'].sum()
support_total = filtered['support'].sum()
all_total = makers_total + services_total + professions_total + support_total * 1.0

# calculate percentages for each category, these will be used for determining the location quotients later
makers_pct = makers_total / all_total
services_pct = services_total / all_total
professions_pct = professions_total / all_total
support_pct = support_total / all_total

# do the same for each tract
aggregated['total'] = aggregated['makers'] + aggregated['services'] + aggregated['professions'] + aggregated['support']

# percentages
aggregated['makers_pct'] = aggregated['makers'] / aggregated['total']
aggregated['services_pct'] = aggregated['services'] / aggregated['total']
aggregated['professions_pct'] = aggregated['professions'] / aggregated['total']
aggregated['support_pct'] = aggregated['support'] / aggregated['total']

# compute tract level location quotients
# using shorthand for column names because of shapefile dbf field charcter count limit
aggregated['make_lq'] = aggregated['makers_pct'] / makers_pct
aggregated['serv_lq'] = aggregated['services_pct'] / services_pct
aggregated['prof_lq'] = aggregated['professions_pct'] / professions_pct
aggregated['supp_lq'] = aggregated['support_pct'] / support_pct

# import 2016 census tract polygons
tracts = gpd.read_file('/Users/chrishenrick/fun/aemp_jobs_viz/data/census_tracts/census_tracts_2016_bay_area_4269.shp')

# reproject to wgs84
tracts = tracts.to_crs(epsg=4326)

# join aggregated data to tracts
tracts = tracts.merge(aggregated, how='inner', left_on='TRACTCE', right_on='TRACTCE10')

# filter out the temporary columns at this point to only grab the columns with the location quotients (*_lq)
tracts = tracts[['TRACTCE', 'geometry', 'make_lq', 'serv_lq', 'prof_lq', 'supp_lq']]

# save file
tracts.to_file('/Users/chrishenrick/fun/aemp_jobs_viz/data/census_tracts/tracts_2016_lq_4326')
