# Data Processing Notes
Census polygon data was downloaded from the US Census and IPUMS NHGIS. The data is in NAD83 CRS.

## Census 2010 Block Polygons
Note the original data CRS is USA_Contiguous_Albers_Equal_Area_Conic (http://epsg.io/102003)

Use `ogr2ogr` to select only the block groups for the 9 county bay area and reproject it to NAD83

```bash
ogr2ogr \
  -sql "select GEOID10, TRACTCE10, BLOCKCE10 from CA_block_2010 where COUNTYFP10 IN ('001', '013', '041', '055', '075', '081', '085', '095', '097')" \
  -t_srs EPSG:4269 \
  data/block_shp/census_blocks_2010_bay_area_4269.shp \
  ~/data/census/blocks_2010/CA_block_2010.shp
```

## Census 2000 Block Polygons
Note the original data CRS is USA_Contiguous_Albers_Equal_Area_Conic (http://epsg.io/102003)

Use `ogr2ogr` to select only the block groups for the 9 county bay area and reproject to NAD83 (EPSG:4269)

The column containing the FIPS column is called `STFID`, but in the 2010 shapefile it's called `GEOID10`. Let's rename it so we don't have to worry about the conflict later when running the `dotfile.py` script.

```bash
ogr2ogr \
  -sql "select STFID AS GEOID10, TRACT2000, BLOCK2000, FIPSSTCO from CA_block_2000 where FIPSSTCO IN ('06001', '06013', '06041', '06055', '06075', '06081', '06085', '06095', '06097')" \
  -t_srs EPSG:4269 \
  data/block_shp/census_blocks_2000_bay_area_4269.shp \
  ~/data/census/blocks_2000/CA_block_2000.shp
```

## Census 2016 Tract Polygons
Similar to the above processing for block polygons, extract census tracts for the bay area for land only
and reproject them to NAD83

```bash
ogr2ogr \
  -sql "select TRACTCE, GEOID from US_tract_2016 where STATEFP = '06' AND ALAND > 0 AND COUNTYFP IN ('001', '013', '041', '055', '075', '081', '085', '095', '097')" \
  -t_srs EPSG:4269 \
  data/census_tracts/census_tracts_2016_bay_area_4269.shp \
  ~/data/census_tracts/nhgis0003_shape/nhgis0003_shapefile_tl2016_us_tract_2016/US_tract_2016.shp
```

## Environment Setup
For using Python Pandas and GeoPandas for data processing.

First, install Miniconda and set up a Python virtual environment with dependencies.

```bash
# install miniconda, for more see: https://pandas.pydata.org/pandas-docs/stable/install.html
bash Miniconda2-latest-MacOSX-x86_64.sh

# make sure to add conda to your PATH
export PATH="/Users/chrishenrick/miniconda2/bin":$PATH

# create virtual env
conda create -n jobs_map_env python

# activate env
source activate jobs_map_env

# install pandas
conda install pandas

# install pip
conda install pip

# install shapely, geos, gdal
conda install shapely
conda install gdal

# install geopandas
conda install -c conda-forge geopandas

# to deactivate the virtual env
source deactivate
```

## Data Sources

- Census 2000 & 2010 block polygons, IPUMS NHGIS, University of Minnesota, https://data2.nhgis.org/

- Census Longitudinal Employer-Household Dynamics Workplace Area Characteristics https://lehd.ces.census.gov/data/

## Credits

### Research using NHGIS data should cite it as:
Steven Manson, Jonathan Schroeder, David Van Riper, and Steven Ruggles. IPUMS National Historical Geographic Information   System: Version 12.0 [Database]. Minneapolis: University of Minnesota. 2017. http://doi.org/10.18128/D050.V12.0
