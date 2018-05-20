import pandas as pd
import geopandas as gpd
import numpy as np
import sys


def process_wac(wac):
    """
    Takes an input wac dataframe, processes data, returns a new dataframe
    """
    print "processing wac data..."

    # rename geo id column
    wac["geoid"] = wac["w_geocode"]

    # create new aggregate columns for various job sectors
    wac['makers'] = wac['CNS01'] + wac['CNS02'] + wac['CNS03'] + wac['CNS04'] + wac['CNS05'] + wac['CNS06'] + wac['CNS08']
    wac['services'] = wac['CNS07'] + wac['CNS14']  +  wac['CNS17']  +  wac['CNS18']
    wac['professions'] = wac['CNS09']  +  wac['CNS10']  +  wac['CNS11']  +  wac['CNS12']  +  wac['CNS13']
    wac['support'] = wac['CNS15']  +  wac['CNS16']  +  wac['CNS19']  +  wac['CNS20']

    # make sure they all add up
    assert sum(wac['C000'] -(wac['makers'] + wac['services'] + wac['professions'] + wac['support'])) == 0

    # new dataframe from aggregated columns
    wac_new = wac[['makers', 'services', 'professions', 'support', 'geoid']].copy()
    return wac_new


def join_wac_to_blocks(blocks, wac_df):
    """
    Takes input census blocks and wac dataframes, processes & merges data,
    and returns a new data frame
    """
    print "processing blocks shp data..."

    # create a new "geoid" column for the blocks shapes, dropping the preceeding zero
    blocks["geoid"] = blocks.GEOID10.str[1:]

    # cast the blocks geoid data type to numeric so it can be joined with the df
    blocks[['geoid']] = blocks[['geoid']].apply(pd.to_numeric)

    # left join wac data
    blocks = blocks.merge(wac_df, on="geoid", how="inner")

    # only grab columns we need
    filtered = blocks[['TRACTCE10', 'makers', 'services', 'professions', 'support']]

    # group by tract id
    # NOTE: something odd happens here, the tract id column (TRACTCE10) is no longer available as a field
    # an extra argument is needed to prevent the column from being lost (actually it becomes an index)
    grouped = filtered.groupby('TRACTCE10', as_index=False)

    # aggregate data by computing the sum for each category for each group
    aggregated = grouped.agg(np.sum)

    return aggregated

def calc_location_quotient(df):
    """
    calculates the location quotient for each geography
    """
    print "calculating location quotients..."

    # store totals for each category, these will be the total jobs by category for the entire bay area
    makers_total = df['makers'].sum()
    services_total = df['services'].sum()
    professions_total = df['professions'].sum()
    support_total = df['support'].sum()
    all_total = makers_total + services_total + professions_total + support_total * 1.0

    # calculate percentages for each category, these will be used for determining the location quotients later
    makers_pct = makers_total / all_total
    services_pct = services_total / all_total
    professions_pct = professions_total / all_total
    support_pct = support_total / all_total

    # do the same for each tract
    df['total'] = df['makers'] + df['services'] + df['professions'] + df['support']

    # percentages
    df['makers_pct'] = df['makers'] / df['total']
    df['services_pct'] = df['services'] / df['total']
    df['professions_pct'] = df['professions'] / df['total']
    df['support_pct'] = df['support'] / df['total']

    # compute tract level location quotients
    # using shorthand for column names because of shapefile dbf field charcter count limit
    df['make_lq'] = df['makers_pct'] / makers_pct
    df['serv_lq'] = df['services_pct'] / services_pct
    df['prof_lq'] = df['professions_pct'] / professions_pct
    df['supp_lq'] = df['support_pct'] / support_pct

    return df

def process_tracts(lq_df, tracts_df):
    """
    joins the location quotient dataframe to the census tracts geo dataframe
    """
    print "joining location quotient df to tracts df..."

    # reproject tracts to wgs84
    tracts_df = tracts_df.to_crs(epsg=4326)

    # join aggregated data to tracts
    tracts_df = tracts_df.merge(lq_df, how='inner', left_on='TRACTCE', right_on='TRACTCE10')

    # filter out the temporary columns
    tracts_df = tracts_df[['TRACTCE', 'geometry', 'make_lq', 'serv_lq', 'prof_lq', 'supp_lq']]

    return tracts_df


def main(wac_file, blocks_shp, tracts_shp, out_file):
    """
    Parses input wac csv file and joins parsed data to census blocks shapefile.
    Saves the output as a new shapefile with data aggregated at the tract level.
    """

    # load wac csv data
    try:
        wac_df = pd.read_csv(wac_file, sep=",", delimiter=None, header="infer", names=None, index_col=None, usecols=None)
    except IOError:
        print("could not read %s" % wac_file)
        sys.exit()

    # load blocks shapefile data
    try:
        blocks = gpd.read_file(blocks_shp)
    except IOError:
        print("could not read %s" % blocks_shp)
        sys.exit()

    # load tracts shapefile data
    try:
        tracts = gpd.read_file(tracts_shp)
    except IOError:
        print("could not read %s" % tracts_shp)
        sys.exit()

    # group wac categories into
    wac_new = process_wac(wac_df)

    # join the wac data to census blocks geography & aggregate to tract level
    blocks_new = join_wac_to_blocks(blocks, wac_new)

    # calculate the location quotient for each tract
    lq = calc_location_quotient(blocks_new)

    # join the location quotient to the tracts shapefiles
    tracts_lq = process_tracts(lq, tracts)

    print "writing outfile..."

    # output data
    tracts_lq.to_file(out_file)


if __name__ == "__main__":
    # TO DO:
    # - accept file paths as cli args,
    # - test that they exist before acting on them
    # - print usage instructions
    main(
        "/Users/chrishenrick/fun/aemp_jobs_viz/data/wac/ca_wac_S000_JT00_2002.csv",
        "/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2010_bay_area_4269.shp",
        "/Users/chrishenrick/fun/aemp_jobs_viz/data/census_tracts/census_tracts_2016_bay_area_4269.shp",
        "/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/process_data_tracts_lq_2002_test"
    )
