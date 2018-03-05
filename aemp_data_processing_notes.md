# Data Processing Notes
Census polygon data was downloaded from the US Census and IPUMS NHGIS. The data is in NAD83 CRS.

## Census 2010 Block Polygons
Note this data CRS is NAD83 unprojected coordinate system

Use `ogr2ogr` to select only the block groups for the 9 county bay area

```bash
ogr2ogr \
  -sql "select * from tl_2010_06_tabblock10 where COUNTYFP10 IN ('001', '013', '041', '055', '075', '081', '085', '095', '097')" \
  data/block_shp/census_blocks_2010_bay_area_4269.shp \
  ~/data/census/blocks_2010/tl_2010_06_tabblock10.shp
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

## Dot File Generation
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

# to deactivate the virtual env
source deactivate
```

## Data Sources

- Census 2010 block polygons, U.S. Census http://www2.census.gov/geo/tiger/TIGER2010/TABBLOCK/2010/tl_2010_06_tabblock10.zip
- Census 2000 block polygons, IPUMS NHGIS, University of Minnesota, https://data2.nhgis.org/
