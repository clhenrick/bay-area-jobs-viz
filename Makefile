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
majorroads = osm_major_roads

# running `make` will do all of the following
all: \
	process_wac_lq \
	process_wac_yearly \
	tracts_to_topojson

clean:
	rm -rf $(datadir)

clean_processed:
	rm -r $(processeddir)/*

data:
	mkdir -p $(wacdir) $(processeddir) $(tractsdir) $(osmdir) $(countydir) $(basemapdir)

# tells make that these targets are not files and are always out of date
.PHONY: all clean clean_processed data

fetch_wac_files: data
	wget -i wac_list.txt -P $(wacdir)

fetch_osm_sf_bay_area: data
	wget https://s3.amazonaws.com/metro-extracts.nextzen.org/$(osmzip) -P $(osmdir)

fetch_sf_bay_counties: data
	wget http://spatial.lib.berkeley.edu/public/ark28722-s7hs4j/data.zip -P $(countydir)

# creates a shapefile in wgs84 of census tracts for the 9 county SF Bay Area
process_tracts: data
	# TODO: replace the monolithic us_tract_2010 file with a CA 2010 tracts file that is curl'd from the interweb
	. ./activate_venv.sh; \
	cp data_archived/census_tracts/nhgis0004_shapefile_tl2010_us_tract_2010.zip .; \
	ogr2ogr \
		-overwrite \
		-skipfailures \
		-sql "select substr(GEOID10, 2) as GEOID, TRACTCE10 from US_tract_2010 where STATEFP10 = '06' AND ALAND10 > 0 AND COUNTYFP10 IN ('001', '013', '041', '055', '075', '081', '085', '095', '097')" \
		-t_srs EPSG:4326 \
		$(tractsdir)/$(tractsshp) \
		/vsizip/nhgis0004_shapefile_tl2010_us_tract_2010.zip/US_tract_2010.shp; \
	rm nhgis0004_shapefile_tl2010_us_tract_2010.zip

# TODO: python script should consume filenames from here rather then be hardcoded in the python script
process_wac_lq: fetch_wac_files process_tracts
	. ./activate_venv.sh; \
	python process_wac_data.py

# TODO: python script should consume filenames from here rather then be hardcoded in the python script
process_wac_yearly: fetch_wac_files
	. ./activate_venv.sh; \
	python calc_yearly_totals.py

# joins the processed wac lq csv to the tracts shp
join_tracts: process_wac_lq
	mapshaper $(tractsdir)/$(tractsshp) -join $(processeddir)/$(waclq) keys=GEOID,trct -o $(tractsdir)/$(tractsjoined)

# converts the joined tracts wac lq data to topojson format for the web
tracts_to_topojson: join_tracts
	mapshaper -i $(tractsdir)/$(tractsshp) -simplify 10% -o $(tractsdir)/$(tractsjoinedjson) format=topojson

#########################
# basemap data processing
#########################
process_osm_roads: fetch_osm_sf_bay_area
	pushd $(osmdir); \
	ogr2ogr \
		-overwrite \
		-skipfailures \
		-sql "select type, ref from \"$(osmroads)\" where type IN ('motorway') OR ref IN ('CA 1', 'CA 4',  'CA 12', 'CA 12;CA 29','CA 17', 'CA 20', 'CA 29', 'CA 29;CA 121','CA 29;CA 128', 'CA 37', 'CA 84', 'CA 109', 'CA 121',  'CA 160', 'CA 175', 'CA 121', 'CA 128', 'CA 221', 'CA 237', 'I 280;CA 1','I 280;CA 35','I 5','I 580','I 680','I 80','I 80 Business','I 80 Business;US 50;CA 99','I 80;CA 113','I 80;CA 12','I 80;I 580','I 880','I 880;CA 84''I 980','US 101','US 101;CA 1','US 101;CA 116', 'CA 128','US 101;CA 128','US 101;CA 152','US 101;CA 156','US 101;CA 84') OR (type = 'trunk' AND name = 'Vasco Road')" \
		$(majorroads).shp \
		/vsizip/$(osmzip)/$(osmroads).shp; \
	mapshaper $(majorroads).shp -simplify 60% -dissolve ref,type -o $(majorroads).shp force; \
	mv $(majorroads).* ../basemap; \
	popd
