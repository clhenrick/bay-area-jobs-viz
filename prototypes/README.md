# Prototypes
Map experiments for visualizing WAC location quotients.

To view examples run an HTTP server in the root of this repo. Note it assumes data files are available locally at `../data`

- [01: WAC Location Quotient for 2002](./01)

- [02: Change in LQ from 2002 – 2015](./02)

- [03: Join TopoJSON to Tabular Data](./03)

- [04: Number Line for Change in LQ 2002 - 2015](./04)

- [05: Beeswarm Plot for Change in LQ 2002 - 2015](./05)

- [06: Non-Contiguous Cartogram (Change in LQ and 2015 LQ)](./06)

- [07: Like 6 but using d3.scaleCluster for color values](./07)

- [08: Change in LQ 2002 – 2015 de-emphasizing areas with low job counts](./08)

## TO DO:

- [ ] Legends for maps

- [ ] Figure out classification scheme (equal interval, standard deviation, custom?)

- [ ] Make a general data explorer that lets a user:
  - pick any given year from 2002 to 2015
  - see the difference between any two years
  - dynamically classify data & set color scale domain
  - use Leaflet and a tile layer for better zooming and panning and basemap context
