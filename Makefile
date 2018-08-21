all: \
	data/processed/wac_lq_2015_2002.csv \
	data/processed/wac_yearly_breakdown.csv \
	data/census_tracts/tracts_2010_4326_wac.json

clean:
	rm -rf data/

clean_processed:
	rm -r data/processed/*

.PHONY: all clean

data:
	mkdir -p data/wac data/processed data/census_tracts

data/wac: data
	wget -i wac_list.txt -P data/wac

data/census_tracts/tracts_2010_4326.shp: data
	cp data_archived/census_tracts/nhgis0004_shapefile_tl2010_us_tract_2010.zip .; \
	ogr2ogr -sql "select substr(GEOID10, 2) as GEOID, TRACTCE10 from US_tract_2010 where STATEFP10 = '06' AND ALAND10 > 0 AND COUNTYFP10 IN ('001', '013', '041', '055', '075', '081', '085', '095', '097')" \
		-t_srs EPSG:4326 \
		$@ \
		/vsizip/nhgis0004_shapefile_tl2010_us_tract_2010.zip/US_tract_2010.shp; \
	rm nhgis0004_shapefile_tl2010_us_tract_2010.zip

data/processed/wac_lq_2015_2002.csv: data/wac data/census_tracts/tracts_2010_4326.shp
	. ./activate_venv.sh; \
	python process_wac_data.py

data/processed/wac_yearly_breakdown.csv: data/wac data/census_tracts/tracts_2010_4326.shp
	. ./activate_venv.sh; \
	python calc_yearly_totals.py

data/census_tracts/tracts_2010_4326_wac.shp: data/census_tracts/tracts_2010_4326.shp data/processed/wac_lq_2015_2002.csv
	mapshaper $< -join data/processed/wac_lq_2015_2002.csv keys=GEOID,trct -o $@

data/census_tracts/tracts_2010_4326_wac.json: data/census_tracts/tracts_2010_4326_wac.shp
	mapshaper -i $< -simplify 10% -o $@ force format=topojson
