# is this correct way to reference the base docker image?
FROM continuumio/miniconda3

# does this need to be an absolute path? is this the correct place
RUN mkdir -p /var/data/wac

# ditto absolute path?
RUN wget -i wac_list.txt -P data/wac

# is a volume necessary?
Volume data

# create a new python env and install deps, then run scripts
RUN conda create -n jobs_map_env python \
    source activate jobs_map_env \
    conda install pandas shapely gdal \
    conda install -c conda-forge geopandas \
    python location_quotient.py \
    python calc_yearly_totals.py

# TODO: figure out where to write output csv files from python scripts
