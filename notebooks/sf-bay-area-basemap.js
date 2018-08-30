// URL: https://beta.observablehq.com/@clhenrick/sf-bay-area-basemap
// Title: SF Bay Area Basemap
// Author: Chris Henrick (@clhenrick)
// Version: 107
// Runtime version: 1

const m0 = {
  id: "59dace6a640d7f17@107",
  variables: [
    {
      inputs: ["md"],
      value: (function(md){return(
md`# SF Bay Area Basemap

A rough draft of a grayscale basemap of the nine county San Francisco Bay Area suitable for use with data overlays, made with D3 and TopoJSON. Data sources are from OpenStreetMap and the U.S. Census Bureau. The map uses the "California State Plane III feet" projection (EPSG: 2227).

My goal is to be able to \`import\` this map into other notebooks as a starting point for geospatial data visualizations of the SF Bay Area.

You may zoom and pan the map using your mouse / track pad.

### possible improvements
- add highway shields for major roads and freeways
- label collision detection
- add missing data in northern Sonoma County
`
)})
    },
    {
      name: "map",
      inputs: ["d3","DOM","width","height","zoom","greys","landArea","path","countyBoundaries","roads","rail","places","countyCentroids","textShadow","textOffset"],
      value: (function(d3,DOM,width,height,zoom,greys,landArea,path,countyBoundaries,roads,rail,places,countyCentroids,textShadow,textOffset)
{
  const svg = d3.select(DOM.svg(width, height))
    .style("width", "100%")
    .style("height", "auto")
    .call(zoom)

  // background
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", greys[1])

  // NOTE: the excessive use of id attributes is for making the output svg more friendly for use in vector editing software such as Adobe Illustrator

  // group for all map layers
  const g = svg.append("g").attr("id", "map-layers")
  
  // "land" from merged counties
  const land = g.append("g")
    .attr("id", "land")
    .append("path")
    .datum(landArea)
    .attr("fill", "#fff")
    .attr("stroke-width", 0.25)
    .attr("stroke", greys[3])
    .attr("stroke-line-join", "round")
    .attr("d", path)

  // county boundaries
  const countiesGroup = g.append("g").attr("id", "county-boundaries")

  // county boundaries – bottom
  countiesGroup.append("path")
    .attr("id", "county-boundaries-bottom")
    .datum(countyBoundaries)
      .attr("fill", "none")
      .attr("stroke-width", 1.25)
      .attr("stroke", greys[0])
      .attr("stroke-linejoin", "bevel")
      .attr("d", path)

  // county boundaries – top
  countiesGroup.append("path")
    .attr("id", "county-boundaries-top")
    .datum(countyBoundaries)
      .attr("fill", "none")
      .attr("stroke-width", 0.75)
      .attr("stroke", greys[5])
      .attr("stroke-linejoin", "bevel")
      .attr("stroke-dasharray", "6 2 2 2")
      .attr("d", path)

  // osm major roads
  g.append("g")
    .attr("id", "major-roads")
    .selectAll(".road")
    .data(roads.features)
    .enter().append("path")
      .classed("road", true)
      .attr("fill", "none")
      .attr("stroke-width", d => d.properties.type === "motorway" ? 0.5 : 0.3)
      .attr("stroke", greys[3])
      .attr("stroke-linejoin", "round")
      .attr("d", path)

  // osm railways
  g.append("g")
    .attr("id", "railways")
    .selectAll(".rail")
    .data(rail.features)
    .enter().append("path")
      .classed("rail", true)
      .attr("fill", "none")
      .attr("stroke-width", 0.3)
      .attr("stroke", greys[3])
      .attr("stroke-linejoin", "round")
      .attr("stroke-dasharray", "1 1")
      .attr("d", path)

  // osm places
  g.append("g")
    .attr("id", "places")
    .selectAll(".place")
    .data(places.features)
    .enter().append("circle")
    .classed("place", true)
    .attr("cx", d => path.centroid(d)[0])
    .attr("cy", d => path.centroid(d)[1])
    .attr("r", 1.5)
    .attr("fill", "white")
    .attr("stroke", greys[5])
    .attr("stroke-width", 0.5)

  // labels
  const labelsGroup = g.append("g").attr("id", "labels")

  // county labels
  labelsGroup.append("g").attr("id", "county-labels")
    .selectAll(".county-label")
    .data(countyCentroids.features)
    .enter().append("text")
    .classed("county-label", true)
    .attr("x", d => path.centroid(d)[0])
    .attr("y", d => path.centroid(d)[1])
    .attr("text-anchor", "middle")
    .attr("fill", greys[7])
    .style("font", "9px sans-serif")
    .style("text-transform", "uppercase")
    .style("text-shadow", textShadow)
    .text(d => d.properties.name)

  // places labels
  labelsGroup.append("g").attr("id", "place-labels")
    .selectAll(".place-label")
    .data(places.features)
    .enter().append("text")
    .classed("place-label", true)
    .attr("x", d => path.centroid(d)[0])
    .attr("y", d => path.centroid(d)[1] - textOffset.y)
    .attr("text-anchor", "end")
    .attr("fill", greys[7])
    .style("font", "7px sans-serif")
    .style("text-shadow", textShadow)
    .text(d => d.properties.name)
  
  return svg.node()
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### data

The \`basemapTopoJSON\` layer contains objects for counties, places, roads, and railways. Land areas are derived from the counties using \`topojson.merge()\`, county boundaries are derived using \`topojson.mesh()\`, and county centroids used for labeling are derived using \`d3.geoCentroid\`.
`
)})
    },
    {
      name: "basemapTopoJSON",
      inputs: ["d3"],
      value: (async function(d3){return(
await d3.json("https://gist.githubusercontent.com/clhenrick/4ebb009378a9ede30d3db672caeb9ff5/raw/bda4918592ff5e089ee4deb6650c4e5d70adb994/basemap_layers.json")
)})
    },
    {
      name: "landArea",
      inputs: ["topojson","basemapTopoJSON"],
      value: (function(topojson,basemapTopoJSON){return(
topojson.merge(basemapTopoJSON, basemapTopoJSON.objects["county_boundaries"].geometries)
)})
    },
    {
      name: "countyBoundaries",
      inputs: ["topojson","basemapTopoJSON","boundaryFilter"],
      value: (function(topojson,basemapTopoJSON,boundaryFilter){return(
topojson.mesh(basemapTopoJSON, basemapTopoJSON.objects["county_boundaries"], boundaryFilter)
)})
    },
    {
      name: "places",
      inputs: ["topojson","basemapTopoJSON"],
      value: (function(topojson,basemapTopoJSON){return(
topojson.feature(basemapTopoJSON, basemapTopoJSON.objects.osm_cities_towns)
)})
    },
    {
      name: "roads",
      inputs: ["topojson","basemapTopoJSON"],
      value: (function(topojson,basemapTopoJSON){return(
topojson.feature(basemapTopoJSON, basemapTopoJSON.objects.osm_major_roads)
)})
    },
    {
      name: "rail",
      inputs: ["topojson","basemapTopoJSON"],
      value: (function(topojson,basemapTopoJSON){return(
topojson.feature(basemapTopoJSON, basemapTopoJSON.objects.osm_railways)
)})
    },
    {
      name: "countyCentroids",
      inputs: ["topojson","basemapTopoJSON","d3"],
      value: (function(topojson,basemapTopoJSON,d3)
{
  const counties = topojson.feature(basemapTopoJSON, basemapTopoJSON.objects.county_boundaries)
  counties.features.forEach(d => {    
    d.geometry = {
      type: "Point",
      coordinates: d3.geoCentroid(d)
    }
  })
  return counties
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### misc`
)})
    },
    {
      name: "projection",
      inputs: ["d3","width","height","landArea"],
      value: (function(d3,width,height,landArea){return(
d3.geoConicConformal()
  .parallels([37 + 4 / 60, 38 + 26 / 60])
  .rotate([120 + 30 / 60], 0)
  .fitSize([width, height], landArea)
)})
    },
    {
      name: "path",
      inputs: ["d3","projection"],
      value: (function(d3,projection){return(
d3.geoPath(projection)
)})
    },
    {
      name: "zoom",
      inputs: ["d3","width","height"],
      value: (function(d3,width,height){return(
function zoom (s) {
  s.call(d3.zoom()
    .on("zoom", () => s.select("#map-layers").attr("transform", d3.event.transform))
    .scaleExtent([1, 18])
    .translateExtent([[0, 0], [width, height]]))
}
)})
    },
    {
      name: "height",
      inputs: ["width"],
      value: (function(width){return(
width * 1.2941176471
)})
    },
    {
      name: "greys",
      inputs: ["d3"],
      value: (function(d3){return(
d3.schemeGreys[9]
)})
    },
    {
      name: "textShadow",
      value: (function(){return(
"-1.5px -1.5px white, -1.5px 1.5px white, 1.5px 1.5px white, 1.5px -1.5px white, -1.5px 0 white, 0 1.5px white, 1.5px 0 white, 0 -1.5px white"
)})
    },
    {
      name: "textOffset",
      value: (function(){return(
{ x: 0, y: 3 }
)})
    },
    {
      name: "boundaryFilter",
      value: (function(){return(
(a, b) => a !== b
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### dependencies`
)})
    },
    {
      name: "d3",
      inputs: ["require"],
      value: (function(require){return(
require("d3")
)})
    },
    {
      name: "topojson",
      inputs: ["require"],
      value: (function(require){return(
require("topojson")
)})
    }
  ]
};

const notebook = {
  id: "59dace6a640d7f17@107",
  modules: [m0]
};

export default notebook;
