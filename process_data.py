import pandas as pd
import geopandas as gpd
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


def process_shp(blocks, wac_df):
    """
    Takes input census blocks and wac dataframes, processes & merges data,
    and returns a new data frame
    """
    print "processing blocks shp data..."

    # create a new "geoid" column for the blocks shapes, dropping the preceeding zero
    blocks["geoid"] = blocks.GEOID10.str[1:]

    # left join wac data
    blocks = blocks.merge(wac_df, on="geoid", how="left")

    # dissolve blocks to census tracts
    blocks = blocks.dissolve(by="TRACT2000", aggfunc="sum")

    # reproject our data to EPSG:2227 (CA State Plane 3) to accurately calculate area
    blocks = blocks.to_crs(epsg=2227)

    # store the area in a column as square meters
    blocks["area_sqm"] = (blocks.area * 0.09290304)

    # calculate rates for each group
    blocks["makers"] = blocks.makers / blocks.area_sqm
    blocks["services"] = blocks.services / blocks.area_sqm
    blocks["professions"] = blocks.professions / blocks.area_sqm
    blocks["support"] = blocks.support / blocks.area_sqm

    # delete column(s) we don't need to save space
    # del blocks["TRACT2000"]

    # project to WGS84 for ease of use with web visualization tools
    blocks = blocks.to_crs(epsg=4326)

    return blocks


def main(wac_file, shp_file, out_file):
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
        blocks = gpd.read_file(shp_file)
    except IOError:
        print("could not read %s" % shp_file)
        sys.exit()

    wac_new = process_wac(wac_df)
    blocks_new = process_shp(blocks, wac_new)

    print "writing outfile..."

    # output data
    blocks_new.to_file(out_file)


if __name__ == "__main__":
    # TO DO:
    # - accept file paths as cli args,
    # - test that they exist before acting on them
    # - print usage instructions
    main(
        "/Users/chrishenrick/fun/aemp_jobs_viz/data/wac/ca_wac_S000_JT00_2002.csv",
        "/Users/chrishenrick/fun/aemp_jobs_viz/data/block_shp/census_blocks_2000_bay_area_4269.shp",
        "/Users/chrishenrick/fun/aemp_jobs_viz/data/tmp/tracts_jobs_2002_test")
