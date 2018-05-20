# Prototypes
Map experiments for visualizing WAC location quotients.

To view examples run an HTTP server in the root of this repo. Note it assumes data files are available locally at `../data`

- [01: WAC Location Quotient for 2002](./01)

- [02: Change in LQ from 2002 – 2015](./02)

- [03: Join TopoJSON to Tabular Data](./03)

## TO DO:

- [ ] Legends for maps

- [ ] Figure out classification scheme (equal interval, standard deviation, custom?)

- [ ] Make a general data explorer that lets a user:
  - pick any given year from 2002 to 2015
  - see the difference between any two years
  - dynamically classify data & set color scale domain
  - use Leaflet and a tile layer for better zooming and panning and basemap context
