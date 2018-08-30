// URL: https://beta.observablehq.com/d/42685ed1a5e38b0b
// Title: SF Bay Area Job Density
// Author: Chris Henrick (@clhenrick)
// Version: 1170
// Runtime version: 1

const m0 = {
  id: "42685ed1a5e38b0b@1170",
  variables: [
    {
      inputs: ["md"],
      value: (function(md){return(
md`# SF Bay Area Job Density

Visualizing job density by census tract for the year 2015 in the 9 county SF Bay Area using data from the [U.S. Census Longitudinal Employer-Household Dynamics Workplace Area Characteristics](https://lehd.ces.census.gov/data/). Separate GIS data layers are used for depicting cartographic details such as county boundaries and names, major roads, railways, and place names. As this map is intended to be published for print, my goal here is to have the map in a "good enough" state for final touches in a vector editing software such as Adobe Illustrator. To make the post-Observable editing easier, all map layers are grouped and given id attributes.

You may use your mouse wheel / trackpad to zoom and pan on the map.` 
)})
    },
    {
      name: "map",
      inputs: ["d3","DOM","width","height","zoom","tracts","path","color","greys","topojson","tractsTopoJSON","topojsonObj","boundaryFilter","counties","roads","rail","places","countyCentroids","textShadow","textOffset"],
      value: (function(d3,DOM,width,height,zoom,tracts,path,color,greys,topojson,tractsTopoJSON,topojsonObj,boundaryFilter,counties,roads,rail,places,countyCentroids,textShadow,textOffset)
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
    .attr("fill", "white")

  // NOTE: the excessive use of id attributes 
  // this is for making the output svg more friendly for editing in Adobe Illustrator

  // group for all map layers
  const g = svg.append("g").attr("id", "map-layers")

  // census tracts
  const tractsGroup = g.append("g").attr("id", "tracts")

  // tracts polygons
  tractsGroup.selectAll("path")
    .data(tracts.features)
    .enter().append("path")
    .attr("id", "tracts")
    .attr("d", path)
    .attr("fill", d => d.properties.quintile !== null ? color[d.properties.quintile] : greys[1])
    .append("title")
    .text(d => `${d.properties.quintile}`)

  // census tract boundaries
  tractsGroup.append("path")
    .attr("id", "tract-boundaries")
    .datum(topojson.mesh(tractsTopoJSON, tractsTopoJSON.objects[topojsonObj], boundaryFilter))
      .attr("fill", "none")
      .attr("stroke-width", 0.05)
      .attr("stroke", greys[0])
      .attr("stroke-linejoin", "round")
      .attr("d", path);

  // county boundaries
  const countiesGroup = g.append("g").attr("id", "county-boundaries")

  // county boundaries – bottom
  countiesGroup.append("path")
    .attr("id", "county-boundaries-bottom")
    .datum(counties)
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .attr("stroke", greys[0])
      .attr("stroke-linejoin", "bevel")
      .attr("d", path)

  // county boundaries – top
  countiesGroup.append("path")
    .attr("id", "county-boundaries-top")
    .datum(counties)
      .attr("fill", "none")
      .attr("stroke-width", 0.75)
      .attr("stroke", greys[5])
      .attr("stroke-linejoin", "bevel")
      .attr("stroke-dasharray", "3 1 1 1")
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
    .attr("stroke-width", 0.2)

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
      

  g.append("rect")
    .attr("id", "map-frame")
    .attr("x", 403)
    .attr("y", 561)
    .attr("width", 334)
    .attr("height", 432)
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    
    return svg.node()
}
)
    },
    {
      inputs: ["DOM","serialize","map"],
      value: (function(DOM,serialize,map){return(
DOM.download(serialize(map), "job-density-map", "Download as SVG")
)})
    },
    {
      name: "legend",
      inputs: ["legendSpec","d3","DOM","quintiles","xScale","threshold","xAxis"],
      value: (function(legendSpec,d3,DOM,quintiles,xScale,threshold,xAxis)
{
  const w = legendSpec.width, h = legendSpec.height;
  const margin = legendSpec.margin
  
  const svg = d3.select(DOM.svg(w, h))
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
  
  g.append("g")
    .attr("id", "legend-boxes")
    .selectAll("rect")
    .data(quintiles)
    .enter().append("rect")
    .attr("x", d => xScale(d[0]))
    .attr("y", 0)
    .attr("width", d => xScale(d[1]) - xScale(d[0]))
    .attr("height", h - margin.top - margin.bottom)
    .attr("fill", d => threshold(d[0]))
  
  g.append("g")
    .attr("id", "legend-ticks-lables")
    .attr("transform", `translate(0, ${h - margin.bottom - margin.top})`)
    .call(xAxis)
  
  g.select(".domain").remove()
  
  g.append("text")
    .attr("y", -10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .style("font", "11px sans-serif")
    .text("Number of jobs per square mile")

  return svg.node()
}
)
    },
    {
      inputs: ["DOM","serialize","legend"],
      value: (function(DOM,serialize,legend){return(
DOM.download(serialize(legend), "job-density-legend", "Download as SVG")
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### legend helpers`
)})
    },
    {
      name: "threshold",
      inputs: ["d3","color","quintiles"],
      value: (function(d3,color,quintiles){return(
d3.scaleThreshold()
    .range(color)
    .domain(quintiles.reduce((acc, cur, i) => {
      if (i > 0) acc.push(cur[0])
      return acc
    }, []))
)})
    },
    {
      name: "xScale",
      inputs: ["legendSpec","d3","quintiles"],
      value: (function(legendSpec,d3,quintiles)
{
  const m = legendSpec.margin
  const w = legendSpec.width - m.right - m.left
  return d3.scaleLinear()
  .range(d3.range(0, w + 1, w / 5))
  .domain(quintiles.reduce((acc, cur, i) => {
    acc.push(cur[0])
    if (i === quintiles.length - 1) acc.push(cur[1])
    return acc
  }, []))
}
)
    },
    {
      name: "xAxis",
      inputs: ["d3","xScale"],
      value: (function(d3,xScale){return(
d3.axisBottom(xScale)
  .tickValues(xScale.domain())
)})
    },
    {
      name: "legendSpec",
      value: (function(){return(
{
  margin: { top: 20, left: 10, bottom: 20, right: 30 },
  width: 300,
  height: 50
}
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### census tracts layer`
)})
    },
    {
      name: "topojsonObj",
      inputs: ["tractsTopoJSON"],
      value: (function(tractsTopoJSON){return(
Object.keys(tractsTopoJSON.objects)[0]
)})
    },
    {
      name: "tractsTopoJSON",
      inputs: ["d3"],
      value: (function(d3){return(
d3.json("https://gist.githubusercontent.com/clhenrick/d8724eeee3350ce80cd9f94095ed7735/raw/987a4c874fac7e64af6817da26fa3ff3f1fbba0b/tracts_2010_4326_wac.json")
)})
    },
    {
      name: "tracts",
      inputs: ["topojson","tractsTopoJSON","topojsonObj"],
      value: (function(topojson,tractsTopoJSON,topojsonObj)
{
  let geojson = topojson.feature(tractsTopoJSON, tractsTopoJSON.objects[topojsonObj])

  // remove un-needed properties
  geojson.features = geojson.features.map(d => ({
    ...d,
    properties: {
      geoid: d.properties.GEOID,
      quintile: d.properties.quintile
    }
  }))
  
  return geojson
}
)
    },
    {
      name: "quintiles",
      value: (function(){return(
[[0.692, 388.232], [388.232, 969.515], [969.515, 1831.309], [1831.309, 4198.004], [4198.004, 468772.256]]
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### basemap layers`
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
      name: "basemapObjects",
      inputs: ["basemapTopoJSON"],
      value: (function(basemapTopoJSON){return(
Object.keys(basemapTopoJSON.objects)
)})
    },
    {
      name: "counties",
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
      inputs: ["md"],
      value: (function(md){return(
md`### misc...`
)})
    },
    {
      name: "projection",
      inputs: ["d3","width","height","tracts"],
      value: (function(d3,width,height,tracts){return(
d3.geoConicConformal()
  .parallels([37 + 4 / 60, 38 + 26 / 60])
  .rotate([120 + 30 / 60], 0)
  .fitSize([width, height], tracts)
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
      name: "boundaryFilter",
      value: (function(){return(
(a, b) => a !== b
)})
    },
    {
      name: "color",
      inputs: ["d3"],
      value: (function(d3){return(
d3.schemeGnBu[5]
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
      name: "height",
      inputs: ["width"],
      value: (function(width){return(
width * 1.2941176471
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
    },
    {
      from: "@mbostock/saving-svg",
      name: "serialize",
      remote: "serialize"
    }
  ]
};

const m1 = {
  id: "@mbostock/saving-svg",
  variables: [
    {
      name: "serialize",
      value: (function()
{
  const xmlns = "http://www.w3.org/2000/xmlns/";
  const xlinkns = "http://www.w3.org/1999/xlink";
  const svgns = "http://www.w3.org/2000/svg";
  return function serialize(svg) {
    svg = svg.cloneNode(true);
    svg.setAttributeNS(xmlns, "xmlns", svgns);
    svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
    const serializer = new window.XMLSerializer;
    const string = serializer.serializeToString(svg);
    return new Blob([string], {type: "image/svg+xml"});
  };
}
)
    }
  ]
};

const notebook = {
  id: "42685ed1a5e38b0b@1170",
  modules: [m0,m1]
};

export default notebook;
