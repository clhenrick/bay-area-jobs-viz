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

df = df[['make_c', 'serv_c', 'prof_c', 'supp_c', 'geometry', 'TRACTCE']]

df.to_file('/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/lq_change_2015_2012')
