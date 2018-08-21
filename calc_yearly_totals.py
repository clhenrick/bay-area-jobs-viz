# -*- coding: utf-8 -*-
# script to calculate the yearly percentage of job categories from 2002 to 2015
import pandas as pd
import geopandas as gpd
import numpy as np
import sys, os
from math import log10, floor
from process_wac_data import filter_cx_walk, read_csv, write_csv

def calc_year_totals(wac, cxwalk, year):
    """
    takes the workplace area characteristics dataframe and the 2010 census blocks dataframe
    aggregates wac categories into 4 super categories
    joins to blocks for 9 county SF bay area
    groups by tract id
    """
    # join wac df to cxwalk df using fields w_geocode and tabblk2010
    wac = wac.merge(cxwalk, how="inner", left_on="w_geocode", right_on="tabblk2010")

    # create new aggregate columns for various job sectors
    wac['makers'] = wac['CNS01'] + wac['CNS02'] + wac['CNS03'] + wac['CNS04'] + wac['CNS05'] + wac['CNS06'] + wac['CNS08']
    wac['services'] = wac['CNS07'] + wac['CNS14']  +  wac['CNS17']  +  wac['CNS18']
    wac['professions'] = wac['CNS09']  +  wac['CNS10']  +  wac['CNS11']  +  wac['CNS12']  +  wac['CNS13']
    wac['support'] = wac['CNS15']  +  wac['CNS16']  +  wac['CNS19']  +  wac['CNS20']

    # make sure they all add up
    assert sum(wac['C000'] -(wac['makers'] + wac['services'] + wac['professions'] + wac['support'])) == 0

    # keep only the columns we need from the wac dataframe
    wac = wac[['trct', 'makers', 'services', 'professions', 'support']]

    # group and aggregate data by census tract
    wac = wac.groupby('trct', as_index=False).agg(np.sum)

    # store totals for each category, these will be the total jobs by category for the entire bay area
    makers_total = wac['makers'].sum()
    services_total = wac['services'].sum()
    professions_total = wac['professions'].sum()
    support_total = wac['support'].sum()
    all_total = makers_total + services_total + professions_total + support_total * 1.0

    return [year, makers_total, services_total, professions_total, support_total, all_total]

def main():
    dirname = os.path.dirname(os.path.realpath("__file__"))

    cxwalk = read_csv(os.path.join(dirname, "data/wac/ca_xwalk.csv.gz"), "ISO-8859-1")
    cxwalk = filter_cx_walk(cxwalk)

    # headers for output csv / dataframe
    columns = ["year", "makers", "services", "professions", "support", "all"]
    df = pd.DataFrame(columns=columns)

    # iterate over each wac data file and compute summary stats as new rows to the output df
    for n in range(2002, 2016):
        print("current year is %s" % (n))
        filename = os.path.join(dirname, "data/wac/ca_wac_S000_JT00_%s.csv.gz" % (n))
        wac = pd.read_csv(filename, compression="gzip", header=0, sep=',', quotechar='"')
        df.loc[n - 2001] = calc_year_totals(wac, cxwalk, n)

    df[columns] = df[columns].apply(np.int64)
    print(df)

    outfilename = os.path.join(dirname, "data/processed/wac_yearly_breakdown.csv")
    write_csv(df, outfilename)

    print("done!")
    sys.exit(0)


if __name__ == "__main__":
    main()
