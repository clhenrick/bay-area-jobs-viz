# where the data lives
datadir = data

# sub directories for raw lehd wac, census tract geometries, processed wac csv
wacdir = $(datadir)/wac
tractsdir = $(datadir)/census_tracts
processeddir = $(datadir)/processed

# sub directories for basemap data
osmdir = $(datadir)/osm
countydir = $(datadir)/county
basemapdir = $(datadir)/basemap

# census tracts shapefile from nhgis
# TODO: replace this monolithic us_tract_2010 file with a CA 2010 tracts file
nhgistracts = nhgis0004_shapefile_tl2010_us_tract_2010.zip

# filenames for processed lehd wac data
waclq = wac_lq_2015_2002.csv
wacyearly = wac_yearly_breakdown.csv

# filenames for processed census tract geometry data
tractsshp = tracts_2010_4326.shp
tractsjoined = tracts_2010_4326_wac.shp
tractsjoinedjson = tracts_2010_4326_wac.json

# filenames for basemap data
osmzip = san-francisco-bay_california.imposm-shapefiles.zip
osmroads = san-francisco-bay_california_osm_roads
osmplaces = san-francisco-bay_california_osm_places
censuscounties = bayarea_county
majorroads = osm_major_roads
rail = osm_railways
places = osm_cities_towns
counties = county_boundaries

# polygon for clipping basemap osm roads and rail
sfbayclip = bay_area_clip

# running `make` will do all of the following
all: wac_analysis basemap_layers.json

# run all targets for wac location quotient analysis
wac_analysis: process_wac_lq process_wac_yearly tracts_to_topojson

clean:
	rm -rf $(datadir)

clean_processed:
	rm -r $(processeddir)/*

clean_basemap:
	rm -r $(basemapdir)/*

data:
	mkdir -p $(wacdir) $(processeddir) $(tractsdir) $(osmdir) $(countydir) $(basemapdir)

# tells make that these targets are not files and are always out of date
.PHONY: all clean clean_processed clean_basemap data

fetch_wac_files: data
	wget -i wac_list.txt -P $(wacdir)

fetch_nhgis_us_tract_2010: data
	wget -O $(tractsdir)/$(nhgistracts) https://www.dropbox.com/s/cjk8bnh2xd9o8p7/nhgis0004_shapefile_tl2010_us_tract_2010.zip?dl=1

fetch_osm_sf_bay_area: data
	wget https://s3.amazonaws.com/metro-extracts.nextzen.org/$(osmzip) -P $(osmdir)

fetch_sf_bay_counties: data
	wget http://spatial.lib.berkeley.edu/public/ark28722-s7hs4j/data.zip -P $(countydir)

fetch_sf_bay_clip: data
	cd $(basemapdir); \
	wget -O $(sfbayclip).zip https://www.dropbox.com/s/jathq6xnw1mhth4/bay_area_clip.zip?dl=1; \
	unzip $(sfbayclip).zip

# creates a shapefile in wgs84 of census tracts for the 9 county SF Bay Area
process_tracts: data fetch_nhgis_us_tract_2010
	. ./activate_venv.sh; \
	cd $(tractsdir); \
	ogr2ogr \
		-overwrite \
		-skipfailures \
		-sql "select substr(GEOID10, 2) as GEOID, TRACTCE10 from US_tract_2010 where STATEFP10 = '06' AND ALAND10 > 0 AND COUNTYFP10 IN ('001', '013', '041', '055', '075', '081', '085', '095', '097')" \
		-t_srs EPSG:4326 \
		$(tractsshp) \
		/vsizip/$(nhgistracts)/US_tract_2010.shp; \

# runs script for wac lq analysis
# TODO: python script should accept filenames from here as args rather then be hardcoded in the script
process_wac_lq: fetch_wac_files process_tracts
	. ./activate_venv.sh; \
	python process_wac_data.py

# runs script to calc yearly breakdown of job types across sf bay region
# TODO: python script should accept filenames from here as args rather then be hardcoded in the script
process_wac_yearly: fetch_wac_files
	. ./activate_venv.sh; \
	python calc_yearly_totals.py

# joins the processed wac lq csv to the tracts shp
join_tracts: process_wac_lq
	mapshaper $(tractsdir)/$(tractsshp) -join $(processeddir)/$(waclq) keys=GEOID,trct -o $(tractsdir)/$(tractsjoined)

# converts the joined tracts wac lq data to topojson format for the web
tracts_to_topojson: join_tracts
	mapshaper -i $(tractsdir)/$(tractsshp) -simplify 10% -o $(tractsdir)/$(tractsjoinedjson) format=topojson

# remaining targets are for basemap data processing
process_counties: fetch_sf_bay_counties
	cd $(countydir); \
	ogr2ogr \
		-sql "select COUNTY as name from $(censuscounties)" \
		-overwrite \
		-skipfailures \
		-t_srs EPSG:4326 \
		$(counties).shp \
		/vsizip/data.zip/$(censuscounties).shp; \
	mapshaper $(counties).shp -simplify 75% -o $(counties).shp force; \
	mv $(counties).* ../basemap

process_osm_places: fetch_osm_sf_bay_area process_counties
	cd $(osmdir); \
	ogr2ogr \
		-overwrite \
		-skipfailures \
		-sql "select name, type from \"$(osmplaces)\" where type IN ('city', 'town') and population >= 25000" \
		$(places).shp \
		/vsizip/$(osmzip)/$(osmplaces).shp; \
	mapshaper $(places).shp -clip ../basemap/$(counties).shp -o $(places).shp force; \
	mv $(places).* ../basemap

process_osm_roads: fetch_osm_sf_bay_area fetch_sf_bay_clip
	cd $(osmdir); \
	ogr2ogr \
		-overwrite \
		-skipfailures \
		-sql "select type, ref from \"$(osmroads)\" where type IN ('motorway') OR ref IN ('CA 1', 'CA 4', 'CA 12', 'CA 12;CA 29','CA 17', 'CA 20', 'CA 29', 'CA 29;CA 121','CA 29;CA 128', 'CA 37', 'CA 84', 'CA 109', 'CA 121',  'CA 160', 'CA 175', 'CA 121', 'CA 128', 'CA 221', 'CA 237', 'I 280;CA 1','I 280;CA 35','I 5','I 580','I 680','I 80','I 80 Business','I 80 Business;US 50;CA 99','I 80;CA 113','I 80;CA 12','I 80;I 580','I 880','I 880;CA 84''I 980','US 101','US 101;CA 1','US 101;CA 116', 'CA 128','US 101;CA 128','US 101;CA 152','US 101;CA 156','US 101;CA 84') OR (type = 'trunk' AND name = 'Vasco Road')" \
		$(majorroads).shp \
		/vsizip/$(osmzip)/$(osmroads).shp; \
	mapshaper \
		$(majorroads).shp \
		-simplify 60% \
		-dissolve ref,type \
		-clip ../basemap/$(sfbayclip).shp \
		-o $(majorroads).shp force; \
	mv $(majorroads).* ../basemap

process_osm_rail: fetch_osm_sf_bay_area fetch_sf_bay_clip
	cd $(osmdir); \
	ogr2ogr \
		-overwrite \
		-skipfailures \
		-sql "select type, name from \"$(osmroads)\" where type = 'subway' OR (name IN ('Peninsula', 'Coast Subdivision') AND type = 'rail')" \
		$(rail).shp \
		/vsizip/$(osmzip)/$(osmroads).shp; \
	mapshaper \
		$(rail).shp \
		-simplify 60% \
		-dissolve type,name \
		-clip ../basemap/$(sfbayclip).shp \
		-o $(rail).shp force; \
	mv $(rail).* ../basemap

basemap_layers.json: process_osm_places process_osm_roads process_osm_rail
	cd $(basemapdir); \
	mapshaper \
		-i $(majorroads).shp $(rail).shp $(places).shp $(counties).shp \
		combine-files \
		-o $@ \
		format=topojson
