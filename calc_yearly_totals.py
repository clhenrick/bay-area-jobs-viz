# -*- coding: utf-8 -*-
# script to calculate the yearly percentage of job categories from 2002 to 2015
import pandas as pd
import geopandas as gpd
import numpy as np
import sys
from math import log10, floor

def calc_year_totals(wac, blocks, year):
    """
    takes the workplace area characteristics dataframe and the 2010 census blocks dataframe
    aggregates wac categories into 4 super categories
    joins to blocks for 9 county SF bay area
    groups by tract id
    """
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

    # store totals for each category, these will be the total jobs by category for the entire bay area
    makers_total = filtered['makers'].sum()
    services_total = filtered['services'].sum()
    professions_total = filtered['professions'].sum()
    support_total = filtered['support'].sum()
    all_total = makers_total + services_total + professions_total + support_total * 1.0

    return [year, makers_total, services_total, professions_total, support_total, all_total]

def main():
    blocks = gpd.read_file("/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2010_bay_area_4269.shp")
    columns = ["year", "makers", "services", "professions", "support", "all"]
    outfilename = "/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/wac_yearly_breakdown.csv"
    df = pd.DataFrame(columns=columns)

    for n in range(2002, 2016):
        print "current year is %s" % (n)
        filename = "/Users/chrishenrick/fun/aemp_jobs_viz/data/wac/ca_wac_S000_JT00_%s.csv.gz" % (n)
        wac = pd.read_csv(filename, compression="gzip", header=0, sep=',', quotechar='"')
        df.loc[n - 2001] = calc_year_totals(wac, blocks, n)

    df[columns] = df[columns].apply(np.int64)

    print(df)
    df.to_csv(outfilename, encoding='utf-8', index=False)
    sys.exit(0)


if __name__ == "__main__":
    main()
