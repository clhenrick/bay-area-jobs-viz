# SF Bay Area Jobs Viz
Visualizing the change in job types within the San Francisco Bay Area from 2002 – 2015 through a Location Quotient analysis of U.S. Census' [Longitudinal Employer-Household Dynamics – Origin-Destination Employment Statistics – Workplace Area Characteristics data](https://lehd.ces.census.gov/data/).

![map of maker job change lq 2015 – 2002](img/maker-change.jpg)
_A sample map showing change in manufacturing and logistics jobs, see `viz/pdf` for all maps and charts_

## Contents
See the `viz` directory for Adobe Illustrator and PDF files for all maps and charts.

For documentation on the data processing see the Jupyter notebooks in the `notebooks` directory.

The `protoypes` directory contains experiments and prototypes for the final output visualization. It has its own readme file.

The two python scripts are used to process the LEHD WAC data. See the [Data Processing](#data-processing) section for more.

## Analysis
The U.S. Census LEHD classifies job types using 2-digit NAICS codes to represent the primary industry of the employing company. Rather then analyze each category individually I aggregated them into four "super categories" listed below, similar to Robert Manduca's analysis for his [Job Dot Map](http://www.robertmanduca.com/projects/jobs.html).

- **Manufacturing and Logistics**: 11 (Agriculture and Forestry), 21 (Mining), 22 (Utilities), 23 (Construction), 31-33 (Manufacturing), 42 (Wholesale Trade), 48-49 (Transportation and Warehousing)

- **Professional Services**: 51 (Information), 52 (Finance and Insurance), 53 (Real Estate), 54 (Professional, Scientific, and Technical Services), 55 (Management of Companies and Enterprises)

- **Healthcare, Education, and Government**: 61 (Educational Services), 62 (Health Care), 81 (Other Services - largely Religious, Grantmaking, Civic, Professional, and Similar Organizations)

- **Retail, Hospitality, and Other Services**: 44-45 (Retail Trade), 56 (Administrative and Support Services), 71 (Arts, Entertainment, and Recreation), 72 (Accommodation and Food Services)

For each of the above super categories, I calculated the location quotient for the years 2002 and 2015 (the extent of the LEHD WAC data available at the time of performing this analysis) at the census tract level. The difference between the 2015 and 2002 location quotients provides an indicator for how much a job sector grew or declined for a given geographic area.

A _Location Quotient_ is a type of economic geography analysis that measures the relative concentration of a given industry in a given place. For this jobs analysis it means comparing the percentage of each super category at the census tract to the percentage of that same category at the nine county SF Bay Area regional level. For example, if a census tract contains 30% Manufacturing and Logistics jobs out of all job types, and the entire SF Bay Area contains 15%, then the location quotient would be determined by dividing the census tract percentage by the regional percentage. In this case the location quotient value would be 2, indicating a higher concentration of jobs in the Manufacturing and Logistics category then the SF Bay Area region as a whole. If that value were closer to 1, it would mean the census tract had about the same percentage of jobs as the region, if it were less then 1 then it would mean the census tract has fewer jobs then the region. Typically with a Location Quotient analysis, if a job sector has a value >= 1.5 it is considered part of the "export economy" rather than the local economy.

One problem with a location quotient analysis is that it does not take into account the density of the variable being analyzed. When visualizing the location quotient at the census tract level, one would not be able to distinguish tracts with relatively few jobs in them from tracts with a high concentration of jobs. To correct for this problem, I calculated the job density for each census tract (number of total jobs divided by number of square miles) and then binned tracts into quintiles based on the density values. In the output maps, the tracts in the lowest quintile have their opacity reduced to 20% so that they are de-emphasized.

Following the analysis I used [Observable](https://beta.observablehq.com/) notebooks and [D3JS](https://d3js.org/) to create choropleth maps for each category, as well as a separate map showing job density, at the census tract level. Each map was exported as an SVG file from the browser and touched up using the vector editing software Adobe Illustrator in order to prepare them for print. This primarily meant resizing / cropping the map area, repositioning of labels, conversion of the maps from SVG to PDF, and conversion from the RGB to CMYK color space. Nine maps in total were created; one map showing job density of all jobs, and two maps for each super category; one showing the difference in location quotient from 2015 – 2002, and one showing the 2015 location quotient.

Maps showing the change in Location Quotient were arbitrarily classified using a diverging classification scheme. The breaks are as follows: the first value is the minimum of the location quotient difference, followed by `-1.5`, `-0.1`, `0.1`, `1.5`, and the maximum value of the location quotient difference.

For example, in the "Manufacturing and Logistics" category, the breaks are:

```
-3.70, -1.50, -0.10, 0.10, 1.50, 3.89
```

and the corresponding legend is rendered as follows:

![maker-lq-diff-legend](img/maker-lq-diff-legend.png)

Maps showing the 2015 location quotient used the breaks of `0.8`, `1.2`, and `1.5`. The 2015 location quotient for the "Manufacturing and Logistics" category produces the following breaks where `0` is the min and `4.3` is the max:

```
0, 0.8, 1.2, 1.5, 4.3
```

and legend:

![maker-lq-2015-legend](img/maker-lq-2015-legend.png)

For the change in Location Quotient I chose the `-0.1` to `0.1` range as little to no change, and for the 2015 Location Quotient I chose `0.8` to `1.2` as within the normal range for the SF Bay Area. These choices were made somewhat arbitrarily, but were influenced by literature I read on performing LQ analysis.

[Color Brewer](http://colorbrewer2.org/) and [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic) were used for determining the color values for each map's color ramp. As the output maps for this project are initially intended for print, I took Color Brewer's advice to limit each classification scheme to five classes. In the case of the 2015 LQ, there are only 4 classes as I dropped the bottom class / darkest color.

In addition to the nine choropleth maps I created nine bar charts that are intended to provide context into how these categories have changed at the county and region levels. A stacked bar chart shows the overall trend for the entire SF Bay Area in the four super categories for each year from 2002 to 2015. The notable changes are that jobs in the "Manufacturing and Logistics" category _decreased_ by 5.44%, "Retail, Hospitality, and Other Services" increased by 17.88%, "Professional Services" increased by 23.38%, and "Healthcare, Education, and Government" increased by 32.7%. The large increase in the last category, "Healthcare, Education, and Government", may be influenced by the fact that the U.S. Census LEHD LODES did not include government jobs in their data until the year 2010.

For each of the four super categories listed above I created two bar charts, one showing the number of jobs by county for 2015, and a second showing the change in number of jobs from 2002 to 2015. The categories "Retail, Hospitality, and Other Services" and "Healthcare, Education, and Government" had job increases in every county, most notably in Alameda, Santa Clara, and San Francisco counties. The number of jobs in the "Manufacturing and Logistics" category decreased in every county except for San Francisco and Napa. The number of jobs in the "Professional Services" category decreased in all counties except for San Francisco, San Mateo, and Santa Clara.

There are likely more compelling ways to look at this data, as well as ways to augment it with other data such as demographic data. The analysis I've done here is somewhat partial, and is open to interpretation and further exploration. Please feel free to reach out to me if you have thoughts or suggestions! It is my intention to make a web interactive version of this analysis, but likely not before some time in 2019.

## Data Processing
Running `make` will download data from the U.S. Census and other sources for basemap data processing, then perform the location quotient analysis and basemap data processing. Prior to running `make` you will need to have `miniconda3` installed and a virtual environment created as outlined below in Environment Setup.

You will also need to have the `mapshaper` CLI tool installed and available globally (this also requires NodeJS). The easiest way to do this is: `npm install -g mapshaper`

### Basemap Clipping Polygon
To create a geometry suitable for cropping (in GIS this is known as "clipping") basemap data for the nine county SF Bay Area I did the following.

Using `mapshaper`, dissolve county polygons, convert from multi-polygons to multi-linestrings, and convert from multi-linestring to plain old linestring geometries:

```bash
mapshaper county_boundaries.shp -dissolve -lines -explode -o bay_area_clip.shp
```

Then hand edit the `bay_area_clip.shp` file in QGIS using the "Node Tool", "Split Features", and the "Join Multiple Lines" plugin. This hand editing was necessary to keep bridges and the Transbay Tube intact when clipping osm roads and railways to the 9 county bay area. Essentially the San Francisco Bay is removed and the Golden Gate is closed off to create a single geometry linestring that encompasses the SF Bay Area.

Finally, convert the linestring geometry back into a polygon for use with clipping osm roads and railways using QGIS (Vector > Geometry Tools > Lines to Polygons).

## Notebooks
I used both Jupyter and Observable notebooks for this project, the former for data exploration and analysis and the latter for visualization. See the `notebooks/` directory for the related files.

Data analysis was done using `python3`, `pandas`, `geopandas`, and `jupyter`. See the `.ipynb` files for data analysis and transformation procedures. These notebooks may be viewed by running `jupyter notebook` in the root directory of this repository and then navigating to the `notebooks/` directory in the Jupyter dashboard.

The maps were created using Observable Notebooks, a web browser based Javascript notebook format, and may be viewed on [beta.observablehq.com/@clhenrick](https://beta.observablehq.com/@clhenrick). I've archived them in the `notebooks` directory, but need to add a script to run these notebooks locally.

## Environment Setup
For using Python Pandas and GeoPandas for data processing.

First, install [Miniconda3](https://conda.io/miniconda.html) and set up a Python virtual environment with dependencies.

```bash
# install miniconda, for more see: https://pandas.pydata.org/pandas-docs/stable/install.html
bash Miniconda3-latest-MacOSX-x86_64.sh

# make sure to add conda to your PATH
export PATH="/Users/chrishenrick/miniconda3/bin":$PATH

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

# install jupyter
python -m pip install --upgrade pip
python -m pip install jupyter

# to deactivate the virtual env
source deactivate
```

## Data Sources

- Census Tract 2010 polygons, IPUMS NHGIS, University of Minnesota, https://data2.nhgis.org/

- Census Longitudinal Employer-Household Dynamics Workplace Area Characteristics https://lehd.ces.census.gov/data/

- UC Berkeley Library geodata: https://geodata.lib.berkeley.edu/catalog/ark28722-s7hs4j

- NextZen OSM Metro Extracts: https://www.nextzen.org/metro-extracts/index.html#san-francisco-bay_california

## Credits

- [John Stehlin](https://geography.berkeley.edu/john-stehlin) provided support and direction for the location quotient and job density analysis. Thank you John!

- Another extremely huge thank you to [Robert Manduca](http://www.robertmanduca.com/) for sharing the analysis used in his [Job Dot Map](http://www.robertmanduca.com/projects/jobs.html).

- This work was performed pro bono for the [Anti Eviction Mapping Project](https://www.antievictionmap.com/)'s forthcoming print Atlas. Their work has inspired me to use geographic mapping and data visualization for social justice.

- NHGIS, for providing census tract geometry data: Steven Manson, Jonathan Schroeder, David Van Riper, and Steven Ruggles. IPUMS National Historical Geographic Information System: Version 12.0 [Database]. Minneapolis: University of Minnesota. 2017. http://doi.org/10.18128/D050.V12.0

- [OpenStreetMap](https://www.openstreetmap.org/) Contributors for basemap data used in the printed maps.

## License

The content of this project itself is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International license](http://creativecommons.org/licenses/by-nc/4.0/), and the underlying source code used to format and display that content is licensed under the [MIT license](LICENSE.md).
