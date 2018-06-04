# calculate the change in location quotients between 2002 and 2015

import pandas as pd
import geopandas as gpd
import numpy as np
import sys

lq_2002 = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/process_data_tracts_lq_2002_test")
lq_2015 = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/process_data_tracts_lq_2015_test")

df = lq_2015.copy()

df['make_c'] = df['make_lq'] - lq_2002['make_lq']
df['serv_c'] = df['serv_lq'] - lq_2002['serv_lq']
df['prof_c'] = df['prof_lq'] - lq_2002['prof_lq']
df['supp_c'] = df['supp_lq'] - lq_2002['supp_lq']

df['make_15'] = df['make_lq']
df['serv_15'] = df['serv_lq']
df['prof_15'] = df['prof_lq']
df['supp_15'] = df['supp_lq']

df['make_02'] = lq_2002['make_lq']
df['serv_02'] = lq_2002['serv_lq']
df['prof_02'] = lq_2002['prof_lq']
df['supp_02'] = lq_2002['supp_lq']

# remove old column names
del df['make_lq']
del df['serv_lq']
del df['prof_lq']
del df['supp_lq']

# calculate area using CA State Plane (ft)
df = df.to_crs(epsg=2227)
df['area_sqm'] = (df.area * 0.09290304)

# df = df[['make_c', 'serv_c', 'prof_c', 'supp_c', 'geometry', 'TRACTCE']]

df.to_file('/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/lq_2015_2012')

# TODO: SF Bay Area change
