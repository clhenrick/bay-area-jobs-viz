# -*- coding: utf-8 -*-
# process_wac_data.py
# author: Chris Henrick @clhenrick chrishenrick@gmail.com
# this script:
# - aggregates US Census LEHD WAC block level data to the tract level and
#   into four super job categories (maker, professional, support, service)
# - calculates the location quotient for and change between 2002 to 2015 for
#   each tract and super category
# - calculates the job density quintiles for each tract
# - saves processed data to an output csv file that may be joined to a 2010
#   census tracts geometry shapefile

import pandas as pd
import geopandas as gpd
import numpy as np
import sys, os

def calc_location_quotient_diff(lq_2015, lq_2002):
    """
    given dataframes for wac lq 2002 and 2015,
    calculate the difference in LQ by tract
    returns a single dataframe
    """
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

    return df


def calc_job_density_quintiles(tracts, lq):
    """
    given an input tracts geom and wac lq dataframes,
    calculate the job density for each census tract
    returns a single dataframe
    """
    # convert the tract id column to int64 so that we can perform a join
    tracts['tract_id'] = tracts['GEOID10'].astype(str).astype(int)

    # join tract geometries to aggregated blocks data
    tracts = tracts.merge(lq, how="inner", left_on="tract_id", right_on="trct")

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

    # remove extra columns
    del tracts['GEOID10']
    del tracts['TRACTCE10']
    del tracts['Shape_area']
    del tracts['geometry']
    del tracts['tract_id']
    del tracts['total']
    del tracts['density']
    del tracts['area_sqmi']

    return tracts

def calc_location_quotient(cxwalk, wac_year):
    """
    given a crosswalk dataframe and single year wac dataframe,
    calculate the location quotient at the census tract level
    these categories are ones originally defined by Robert Manduca's Job Dot Map:
    http://www.robertmanduca.com/projects/jobs.html
    returns a single dataframe
    """
    # join wac df to cxwalk df using fields w_geocode and tabblk2010
    wac = wac_year.merge(cxwalk, how="inner", left_on="w_geocode", right_on="tabblk2010")

    # create new aggregate columns for various job sectors
    wac['makers'] = wac['CNS01'] + wac['CNS02'] + wac['CNS03'] + wac['CNS04'] + wac['CNS05'] + wac['CNS06'] + wac['CNS08']
    wac['services'] = wac['CNS07'] + wac['CNS14']  +  wac['CNS17']  +  wac['CNS18']
    wac['professions'] = wac['CNS09']  +  wac['CNS10']  +  wac['CNS11']  +  wac['CNS12']  +  wac['CNS13']
    wac['support'] = wac['CNS15']  +  wac['CNS16']  +  wac['CNS19']  +  wac['CNS20']
    wac['total'] = wac['makers'] + wac['services'] + wac['professions'] + wac['support']

    assert sum(wac['C000'] -(wac['makers'] + wac['services'] + wac['professions'] + wac['support'])) == 0

    # keep only the columns we need from the wac dataframe
    wac = wac[['trct', 'makers', 'services', 'professions', 'support', 'total']]

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

    # compute tract level location quotients
    wac['make_lq'] = wac['makers'] / wac['total'] / makers_pct
    wac['serv_lq'] = wac['services'] / wac['total'] / services_pct
    wac['prof_lq'] = wac['professions'] / wac['total'] / professions_pct
    wac['supp_lq'] = wac['support'] / wac['total'] / support_pct

    # keep only necessary columns
    wac = wac[['trct', 'make_lq', 'serv_lq', 'prof_lq', 'supp_lq', 'total']]

    return wac

def filter_cx_walk(cxwalk):
    """
    filters the "raw" crosswalk dataframe to necessary columns and rows
    returns a dataframe
    """
    # filter by fips codes for 9 counties of the SF Bay Area
    cty_fips_list = [6001, 6013, 6041, 6055, 6075, 6081, 6085, 6095, 6097]
    cxwalk = cxwalk[cxwalk['cty'].isin(cty_fips_list)]

    # keep only the block and tract id columns
    cxwalk = cxwalk[['tabblk2010', 'trct']]

    return cxwalk

def write_csv(df, filepath):
    """
    given a dataframe and filepath, write a csv file
    """
    try:
        df.to_csv(filepath)
    except IOError:
        print("could not write %s" % filepath)

def read_shp(filepath):
    """
    given a filepath, loads a shapefile using gpd.read_file
    returns the corresponding dataframe
    """

    try:
        df = gpd.read_file(filepath)
    except IOError:
        print("could not read %s" % filepath)

    return df

def read_csv(filepath, file_encoding = None ):
    """
    given a filepath and optional encoding, loads a csv file using pd.read_csv
    returns the corresponding dataframe
    """

    if file_encoding is None:
        file_encoding = "utf-8"

    try:
        df = pd.read_csv(
            filepath,
            sep = ",",
            delimiter = None,
            header = "infer",
            names = None,
            index_col = None,
            usecols = None,
            compression = "gzip",
            encoding = file_encoding
        )
    except IOError:
        print("could not read %s" % filepath)
        sys.exit()

    return df

def main():
    dirname = os.path.dirname(os.path.realpath("__file__"))

    wac2015_filepath = os.path.join(dirname, "data/wac/ca_wac_S000_JT00_2015.csv.gz")
    wac2002_filepath = os.path.join(dirname, "data/wac/ca_wac_S000_JT00_2002.csv.gz")
    cxwalk_filepath = os.path.join(dirname, "data/wac/ca_xwalk.csv.gz")
    tracts_shp_filepath = os.path.join(dirname, "data/census_tracts/tracts_2010_4326.shp")

    print("loading data...")

    wac2015 = read_csv(wac2015_filepath)
    wac2002 = read_csv(wac2002_filepath)
    cxwalk = read_csv(cxwalk_filepath, "ISO-8859-1") # encoding needed for this file with Python3
    tracts_shp = read_shp(tracts_shp_filepath)

    print("data loaded successfully")
    print("processing data...")

    cxwalk = filter_cx_walk(cxwalk)

    lq2015 = calc_location_quotient(cxwalk, wac2015)
    lq2002 = calc_location_quotient(cxwalk, wac2002)

    lq_diff = calc_location_quotient_diff(lq2015, lq2002)
    lq_diff_density = calc_job_density_quintiles(tracts_shp, lq_diff)

    outfile = os.path.join(dirname, "data/processed/wac_lq_2015_2002.csv")

    print("writing outfile %s" % outfile)
    write_csv(lq_diff_density, outfile)

    print("done!")
    sys.exit()

if __name__ == "__main__":
    main()
