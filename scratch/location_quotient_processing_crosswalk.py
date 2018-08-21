# -*- coding: utf-8 -*-
# script that aggregates census lehd wac data to tract level (prior to joining to census geos)
# and calculates the location quotient change from 2002 to 2015
# TODO: calc the LQ for 2002 and the LQ difference from 2002 to 2015

import pandas as pd
import geopandas as gpd
import numpy as np
import sys, os

dirname = os.path.dirname(__file__)

wac2015 = pd.read_csv(os.path.join(dirname, "data/wac/ca_wac_S000_JT00_2015.csv"), sep=",", delimiter=None, header="infer", names=None, index_col=None, usecols=None)
wac2002 = pd.read_csv(os.path.join(dirname, "data/wac/ca_wac_S000_JT00_2002.csv"), sep=",", delimiter=None, header="infer", names=None, index_col=None, usecols=None)
cxwalk = pd.read_csv(os.path.join(dirname, "data/wac/ca_xwalk.csv"), sep=",", delimiter=None, header="infer", names=None, index_col=None, usecols=None, encoding = "ISO-8859-1") # encoding needed for this file with Python 3

# filter crosswalk table by 9 counties of SF Bay Area
cty_fips_list = [6001, 6013, 6041, 6055, 6075, 6081, 6085, 6095, 6097]
cxwalk = cxwalk[cxwalk['cty'].isin(cty_fips_list)]

# keep only the block and tract id columns
cxwalk = cxwalk[['tabblk2010', 'trct']]

# join 2015 wac files to cxwalk using fields w_geocode and tabblk2010
wac = wac2015.merge(cxwalk, how="inner", left_on="w_geocode", right_on="tabblk2010")

# create new aggregate columns for various job sectors
wac['makers'] = wac['CNS01'] + wac['CNS02'] + wac['CNS03'] + wac['CNS04'] + wac['CNS05'] + wac['CNS06'] + wac['CNS08']
wac['services'] = wac['CNS07'] + wac['CNS14']  +  wac['CNS17']  +  wac['CNS18']
wac['professions'] = wac['CNS09']  +  wac['CNS10']  +  wac['CNS11']  +  wac['CNS12']  +  wac['CNS13']
wac['support'] = wac['CNS15']  +  wac['CNS16']  +  wac['CNS19']  +  wac['CNS20']

assert sum(wac['C000'] -(wac['makers'] + wac['services'] + wac['professions'] + wac['support'])) == 0

# keep only the columns we need from the wac dataframe
wac = wac[['trct', 'makers', 'services', 'professions', 'support']]

# group and aggregate data by census tract
wac = wac.groupby('trct', as_index=False).agg(np.sum)

# we can now compute the location quotients
# store totals for each category, these will be the total jobs by category for the entire bay area
makers_total = wac['makers'].sum()
services_total = wac['services'].sum()
professions_total = wac['professions'].sum()
support_total = wac['support'].sum()
all_total = makers_total + services_total + professions_total + support_total * 1.0

# calculate percentages for each category, these will be used for determining the location quotients later
makers_pct = makers_total / all_total
services_pct = services_total / all_total
professions_pct = professions_total / all_total
support_pct = support_total / all_total

wac['total'] = wac['makers'] + wac['services'] + wac['professions'] + wac['support']

# compute tract level location quotients
wac['make_lq'] = wac['makers'] / wac['total'] / makers_pct
wac['serv_lq'] = wac['services'] / wac['total'] / services_pct
wac['prof_lq'] = wac['professions'] / wac['total'] / professions_pct
wac['supp_lq'] = wac['support'] / wac['total'] / support_pct

# columns to keep for output csv
columns = ['trct', 'make_lq', 'serv_lq', 'prof_lq', 'supp_lq']
outfile = os.path.join(dirname, 'data/tmp/wac2015_rollup_no_geo_test.csv')

# write output csv
wac.to_csv(outfile, columns=columns, index=False, encoding="utf-8")

# process 2010 tracts geographies
tracts = gpd.read_file(os.path.join(dirname, "data/census_tracts/tracts_2010_4326.shp"))
tracts["geoid"] = tracts["GEOID10"].str[1:]
tracts[["geoid"]] = tracts[["geoid"]].apply(pd.to_numeric)
tracts = tracts.merge(wac, how="inner", left_on="geoid", right_on="trct")

# NOTE: for some reason the custom "geoid" field is corrupted in the output shapefile, so using GEOID10 here instead
tracts = tracts[['GEOID10', 'make_lq', 'prof_lq', 'serv_lq', 'supp_lq', 'geometry']]
tracts.to_file(os.path.join(dirname, "data/tmp/tracts_2010_lq_2015"))

# good news is that it appears all 1580 rows successfully joined from the census tracts and wac data
# and there are no tracts that have null values or lack data!
