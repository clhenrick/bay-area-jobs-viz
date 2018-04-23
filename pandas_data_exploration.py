# exploring data processing using pandas and geopandas
# FYI this is a helpful resource: https://www.tutorialspoint.com/python_pandas/
# make sure to activate virtual environment prior to running this code, e.g.
# `source activate jobs_map_env`

# import the pandas library
import pandas as pd

# load census wac data from csv
wac = pd.read_csv("/Users/chrishenrick/fun/aemp_jobs_viz/data/wac/ca_wac_S000_JT00_2002.csv", sep=",", delimiter=None, header="infer", names=None, index_col=None, usecols=None)

# look at the table structure
wac.head()
wac.tail()

# number of cells in the data
wac.size

# what are the column data types?
wac.dtypes

# what is the shape of the data? (rows x columns)
wac.shape

# generate summary stats for all columns
wac.describe()

# take a look at the geo id column
wac["w_geocode"]

# it would probably make sense to rename this to "geoid"
wac["geoid"] = wac["w_geocode"]
del wac["w_geocode"]

# create new aggregate columns for various job sectors
wac['makers'] = wac['CNS01'] + wac['CNS02'] + wac['CNS03'] + wac['CNS04'] + wac['CNS05'] + wac['CNS06'] + wac['CNS08']
wac['services'] = wac['CNS07'] + wac['CNS14']  +  wac['CNS17']  +  wac['CNS18']
wac['professions'] = wac['CNS09']  +  wac['CNS10']  +  wac['CNS11']  +  wac['CNS12']  +  wac['CNS13']
wac['support'] = wac['CNS15']  +  wac['CNS16']  +  wac['CNS19']  +  wac['CNS20']

# make sure they all add up
assert sum(wac['C000'] -(wac['makers'] + wac['services'] + wac['professions'] + wac['support'])) == 0

# write a csv file with only data for geoid, makers, services, professions, support
outpath = "/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/jobs_2002.csv"
# index=False is to prevent the index value of each row from being written to the output data
wac.to_csv(outpath, columns=["geoid","makers","services","professions","support"], index=False, encoding="utf-8")

# let's try using geopandas
import geopandas as gpd

# import our census 2000 block shapefile
blocks = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2000_bay_area_4269.shp")

# look at what crs the blocks shapefile is in
blocks.crs

# create a new "geoid" column for the blocks shapes, dropping the preceeding zero
blocks["geoid"] = blocks.GEOID10.str[1:]

# load processed census wac data
jobs = pd.read_csv("/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/jobs_2002.csv", dtype={"geoid": str})

# merge (join) our blocks to our census data
# left_on is the column for the blocks shapefile, right_on is the column for the csv data
# on is when both columns share the same name
blocks = blocks.merge(jobs, on="geoid")

# reproject our data to EPSG:2227 (CA State Plane 3)
blocks = blocks.to_crs(epsg=2227)

# delete columns we don't need to save space
del blocks["GEOID10"]
del blocks["TRACT2000"]
del blocks["BLOCK2000"]
del blocks["FIPSSTCO"]

# write a new shapefile
blocks.to_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/blocks_jobs_2002")

################################################
##### dissolve blocks to census tracks for a choropleth map
# when doing the merge, do an left outer join to not lose shapes
blocks = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2000_bay_area_4269.shp")
jobs = pd.read_csv("/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/jobs_2002.csv", dtype={"geoid": str})
blocks["geoid"] = blocks.GEOID10.str[1:]
blocks = blocks.merge(jobs, on="geoid", how="left")
blocks = blocks.dissolve(by="TRACT2000", aggfunc="sum")

# convert to state plane for calculating area correctly
blocks = blocks.to_crs(epsg=2227)

# store the area in a column as square meters
blocks["area_sqm"] = (blocks.area * 0.09290304)

# calculate rates for each group (choropleth maps should really show rate (count / area))
blocks["makers"] = blocks.makers / blocks.area_sqm
blocks["services"] = blocks.services / blocks.area_sqm
blocks["professions"] = blocks.professions / blocks.area_sqm
blocks["support"] = blocks.support / blocks.area_sqm

# filter out census tracks that have all 0 values
# though maybe it's better to leave all areas so the choropleth map doesn't look broken up?
# blocks = blocks.loc[(blocks["makers"] > 0) & (blocks["services"] > 0) & (blocks["professions"] > 0) & (blocks["support"] > 0)]

# project to WGS84 for ease of use with web visualization tools
blocks = blocks.to_crs(epsg=4326)

blocks.to_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/tracts_jobs_2002")

###############################################
# One way to get around different census tract geographies from 2000 and 2010
# is to convert the block shapes to centroids, then aggregate the centroids
# to 2010 census tracts
blocks2000 = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2000_bay_area_4269.shp")
blocks2010 = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2010_bay_area_4269.shp")
jobs = pd.read_csv("/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/jobs_2002.csv", dtype={"geoid": str})

# create a new geoid column that leaves off the first char so we can join to jobs
blocks2000["geoid"] = blocks.GEOID10.str[1:]

# copy blocks polygons to a new dataframe for creating census tracks
tracts = blocks2010.copy()
# dissovle to census tracts
tracts = tracts.dissolve(by="TRACTCE10")
# note: this didn't keep the TRACTCE10 column...

# copy blocks polygons to a new dataframe
centroids = blocks2000.copy()
# update the geometry to be point centroid of the polygon
centroids.geometry = centroids["geometry"].centroid
# set the crs to the blocks poly crs
centroids.crs = blocks.crs

# join the data
centroids = centroids.merge(jobs, on="geoid", how="left")
# TODO: remove centroids that only have NaN values

# TODO: iterate over centroids and tract polygons to sum each category in polygons
# could take a subset of tracts by removing those with no points in them
# prior to aggregation of points
