# Creating Location Quotient analysis U.S. Census LEHD WAC data processing
# using Pandas and Geopandas
import pandas as pd
import geopandas as gpd
import sys
from math import log10, floor

# load 2002 census wac data from csv
wac = pd.read_csv("/Users/chrishenrick/fun/aemp_jobs_viz/data/wac/ca_wac_S000_JT00_2002.csv", sep=",", delimiter=None, header="infer", names=None, index_col=None, usecols=None)

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

# import our census 2000 block shapefile
blocks = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2000_bay_area_4269.shp")

# create a new "geoid" column for the blocks shapes, dropping the preceeding zero
blocks["geoid"] = blocks.GEOID10.str[1:]

# cast the blocks geoid data type to numeric so it can be joined with the df
blocks[['geoid']] = blocks[['geoid']].apply(pd.to_numeric)

# merge (join) our blocks to the processed wac data
# `left_on` is the column for the blocks shapefile, `right_on` is the column for the tabular data
# `on` is when both columns share the same name
blocks = blocks.merge(df, on="geoid")

# One way to get around different census tract geographies from 2000 and 2010
# is to convert the block shapes to centroids, then aggregate the centroids
# to 2010 census tracts

# copy blocks to a new dataframe
centroids = blocks.copy()
# update the geometry to be point centroid of the polygon
centroids.geometry = centroids["geometry"].centroid
# set the crs to the blocks poly crs
centroids.crs = blocks.crs

# output the centroids dataframe to a shapefile
centroids.to_file('/Users/chrishenrick/fun/aemp_jobs_viz/data/block_centroids/block_centroids_2002')

# import 2016 census tract shapefiles
tracts = gpd.read_file('/Users/chrishenrick/fun/aemp_jobs_viz/data/census_tracts/census_tracts_2016_bay_area_4269.shp')

# this didn't end up being useful but was worth trying anyway...
# perform a spatial join on points and tracts, this will assign the TRACTCE to each centroid
centroids_with_tractid = gpd.sjoin(centroids, tracts, how='inner', op='within')

# inspect output data
centroids_with_tractid.to_file('/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/tracts_centriods_join_test.shp')

# An alternative idea I tried is to import all CA 2010 block polygons
# and join to the wac data, which produced better results in terms of lost data from the join
blocks_ca_2010 = gpd.read_file('/Users/chrishenrick/data/census/blocks_2010/CA_block_2010.shp')
blocks_ca_2010["geoid"] = blocks_ca_2010.GEOID10.str[1:]
blocks_ca_2010[['geoid']] = blocks_ca_2010[['geoid']].apply(pd.to_numeric)
blocks_ca_2010 = blocks_ca_2010.merge(df, how="inner", on="geoid")

# compare the number of unique geoid's between the joined data and original wac data:
blocks_ca_2010.geoid.nunique()
# 215354
df.geoid.nunique()
# 215363

# only grab data for the 9 counties in the SF Bay Area
filtered = blocks_ca_2010.loc[blocks_ca_2010['COUNTYFP10'].isin(['001', '013', '041', '055', '075', '081', '085', '095', '097'])]
# only grab columns we need
filtered2 = filtered[['geoid', 'TRACTCE10', 'geometry', 'makers', 'services', 'professions', 'support']]
# dissolve by tracts
dissolved = filtered2.dissolve(by='TRACTCE10', aggfunc='sum')
# remove corrupted geoid field
del dissolved['geoid']

# save output shapefile
dissolved.to_file('/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/tracts_2010_dissolved_wac_2002')
# NOTE: dissolved tracts look a little odd as they are missing blocks that have no data
# could try doing an outer join to avoid this?

# Calculate the location quotient!
# store totals for each category, these will be the total jobs by category for the entire bay area
makers_total = dissolved['makers'].sum()
services_total = dissolved['services'].sum()
professions_total = dissolved['professions'].sum()
support_total = dissolved['support'].sum()
all_total = makers_total + services_total + professions_total + support_total * 1.0

# calculate percentages for each category, these will be used for determining the location quotients later
makers_pct = makers_total / all_total
services_pct = services_total / all_total
professions_pct = professions_total / all_total
support_pct = support_total / all_total

# TO DO...
# location quotient is calculated as follows:
# 1. for each category at the regional level divide by the total number of jobs
# 2. do the same for each census tract
# 3. for each category in each tract, divide the regional percentage by the tract percentage
# the output is a number, where a value of "1" means the tract has the same proportion as the region
# a value less than 1 means less than the region, a value more than 1 means higher
# e.g. 50 info jobs / 100 total = 0.5 (region) and 10 info / 100 = 0.1 (tract) -> .5 / .1 = 5
