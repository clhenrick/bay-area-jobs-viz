// URL: https://beta.observablehq.com/d/3b297925cd0d3aae
// Title: SF Bay Area Jobs Viz SVG Exporter
// Author: Chris Henrick (@clhenrick)
// Version: 502
// Runtime version: 1

const m0 = {
  id: "3b297925cd0d3aae@502",
  variables: [
    {
      inputs: ["md"],
      value: (function(md){return(
md`# SF Bay Area Jobs Viz SVG Exporter

_**Note:** see [this notebook for job density](https://beta.observablehq.com/d/42685ed1a5e38b0b)_`
)})
    },
    {
      inputs: ["md","categories","category","toggleValue"],
      value: (function(md,categories,category,toggleValue){return(
md`The job categories are: _${categories.map(d => d.label).join(", ")}_. 

The current selected category is: **${categories.find(d => d.value === category).label} Jobs**

Currently toggled to show: **${toggleValue ? 'Change in LQ from 2002 – 2015' : '2015 Location Quotient'}**`
)})
    },
    {
      name: "viewof category",
      inputs: ["select","categories","defaultCategory"],
      value: (function(select,categories,defaultCategory){return(
select({
  title: "Jobs Category",
  description: "Select a job category from the dropdown",
  options: categories,
  value: defaultCategory
})
)})
    },
    {
      name: "category",
      inputs: ["Generators","viewof category"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof toggle",
      inputs: ["button"],
      value: (function(button){return(
button({
  value: "Toggle",
  description: "View either the Change in LQ from 2002 – 2015 or the 2015 LQ"
})
)})
    },
    {
      name: "toggle",
      inputs: ["Generators","viewof toggle"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof mapframe",
      inputs: ["button"],
      value: (function(button){return(
button({
  value: "Map Frame",
  description: "Hide or show the map frame / neatline."
})
)})
    },
    {
      name: "mapframe",
      inputs: ["Generators","viewof mapframe"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof jobDensityQuintile",
      inputs: ["slider"],
      value: (function(slider){return(
slider({
  min: 0, 
  max: 4, 
  step: 1, 
  value: 1, 
  title: "Job Density Quintile", 
  description: "Selects the quintile group (0 – 4), and all others above it. Quintiles taken of job density (total job count / geographic area)"
})
)})
    },
    {
      name: "jobDensityQuintile",
      inputs: ["Generators","viewof jobDensityQuintile"],
      value: (G, _) => G.input(_)
    },
    {
      name: "choropleth",
      inputs: ["DOM","map","d3","tracts","path","toggleValue","greys","threshold","cluster","jobDensityQuintile","topojson","tractsTopoJSON","topojsonObj","boundaryFilter","tractsOutline","showMapframe"],
      value: (function(DOM,map,d3,tracts,path,toggleValue,greys,threshold,cluster,jobDensityQuintile,topojson,tractsTopoJSON,topojsonObj,boundaryFilter,tractsOutline,showMapframe)
{
  var div = this || DOM.element('div');
  div.appendChild(map)
  
  // select the main svg group from the imported map object
  const g = d3.select(div).select("svg").select("g")
  
  // insert an svg group for the census tracts, just before the county boundaries
  const tractsGroup = g.select("#tracts").node() 
    ? g.select("#tracts") 
    : g.insert("g", "#county-boundaries").attr("id", "tracts")
  
  // draw census tracts polygons
  const tractsPolys = tractsGroup.selectAll(".tract-poly")
    .data(tracts.features)
  
  const tractsUpdate = tractsPolys
    .enter().append("path")
    .classed("tract-poly", true)
    .merge(tractsPolys)
  
  tractsUpdate
    .attr("d", path)
    .attr("fill", d => {
      const value = toggleValue ? d.properties.change : d.properties.lq2015
      if (value === null || value === undefined) return greys[1]
      return toggleValue ? threshold(value) : cluster(value)
    })
    .attr("opacity", d => d.properties.quintile >= jobDensityQuintile ? 1 : 0.2)
    .each(function(d) {
      const el = d3.select(this)
      const title = el.select("title").node() ? el.select("title") : el.append("title")
      title.text(d => `${toggleValue ? d.properties.change : d.properties.lq2015}`)
    })

  // draw census tract boundaries
  const tractsBorders = tractsGroup.select("#tract-boundaries").node()
    ? tractsGroup.select("#tract-boundaries")
    : tractsGroup.append("path").attr("id", "tract-boundaries")
  
  tractsBorders
    .datum(topojson.mesh(tractsTopoJSON, tractsTopoJSON.objects[topojsonObj], boundaryFilter))
      .attr("fill", "none")
      .attr("stroke-width", 0.3)
      .attr("stroke", greys[0])
      .attr("stroke-linejoin", "round")
      .attr("d", path);
  
  // looks better then the land polygons derived from county polygons which don't quite line up with tracts
  const tractsOuterBorder = tractsGroup.select("#tract-outline").node()
    ? tractsGroup.select("#tract-outline")
    : tractsGroup.append("path").attr("id", "tract-outline")
  
  tractsOuterBorder
    .datum(tractsOutline)
    .attr("fill", "none")
    .attr("stroke-width", 0.3)
    .attr("stroke", greys[4])
    .attr("stroke-linejoin", "round")
    .attr("d", path)
  
  // this is what the map will be cropped to in adobe illustrator
  const mapFrame = g.select("#map-frame").node() 
    ? g.select("#map-frame") 
    : g.append("rect").attr("id", "map-frame")

  if (showMapframe) {
    mapFrame
      .attr("x", 403)
      .attr("y", 561)
      .attr("width", 334)
      .attr("height", 432)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
  } else {
    mapFrame.remove()
  }
  
  return div;
}
)
    },
    {
      inputs: ["DOM","serialize","svg","category","toggleValue"],
      value: (function(DOM,serialize,svg,category,toggleValue){return(
DOM.download(serialize(svg), `map-${category}-${toggleValue ? "change" : "lq2015"}`, "Download as SVG")
)})
    },
    {
      name: "svg",
      inputs: ["d3","choropleth"],
      value: (function(d3,choropleth){return(
d3.select(choropleth).select("svg").node()
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### legend`
)})
    },
    {
      name: "legend",
      inputs: ["legendSpec","d3","DOM","xScale","toggleValue","threshold","cluster","xAxis"],
      value: (function(legendSpec,d3,DOM,xScale,toggleValue,threshold,cluster,xAxis)
{
  const { margin, domain, title, width: w, height: h } = legendSpec
  
  const svg = d3.select(DOM.svg(w, h))
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
  
  g.append("g")
    .attr("id", "legend-boxes")
    .selectAll("rect")
    .data(domain.map((d, i, arr) => [d, arr[i + 1]]))
    .enter().append("rect")
    .attr("x", d => xScale(d[0]))
    .attr("y", 0)
    .attr("width", d => xScale(d[1]) - xScale(d[0]))
    .attr("height", h - margin.top - margin.bottom)
    .attr("fill", d => toggleValue ? threshold(d[0]) : cluster(d[0]))
  
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
    .text(title)

  return svg.node()
}
)
    },
    {
      inputs: ["DOM","serialize","legend","category","toggleValue"],
      value: (function(DOM,serialize,legend,category,toggleValue){return(
DOM.download(serialize(legend), `legend-${category}-${toggleValue ? "change" : "lq2015"}`, "Download as SVG")
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### legend helpers`
)})
    },
    {
      name: "legendSpec",
      inputs: ["toggleValue","selectedCategoryLabel","thresholdExtent","thresholds","clusterExtent","clusters"],
      value: (function(toggleValue,selectedCategoryLabel,thresholdExtent,thresholds,clusterExtent,clusters){return(
{
  margin: { top: 20, left: 10, bottom: 20, right: 30 },
  width: 300,
  height: 50,
  title: toggleValue 
    ? `Change in Location Quotient for ${selectedCategoryLabel} jobs` 
    : `2015 Location Quotient for ${selectedCategoryLabel} jobs`,
  domain: toggleValue 
    ? [thresholdExtent[0], ...thresholds, thresholdExtent[1]]
    : [clusterExtent[0], ...clusters, clusterExtent[1]]
}
)})
    },
    {
      name: "xAxis",
      inputs: ["d3","xScale","format"],
      value: (function(d3,xScale,format){return(
d3.axisBottom(xScale)
  .tickValues(xScale.domain())
  .tickFormat(format)
)})
    },
    {
      name: "xScale",
      inputs: ["legendSpec","d3"],
      value: (function(legendSpec,d3)
{
  const m = legendSpec.margin
  const w = legendSpec.width - m.right - m.left
  const domain = legendSpec.domain

  return d3.scaleLinear()
    .range(d3.range(0, w + 1, w / 5))
    .domain(domain)
}
)
    },
    {
      name: "format",
      inputs: ["d3"],
      value: (function(d3){return(
d3.format(".2f")
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### data`
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`Location quotient data joined to 2010 census tract geometries for the 9 county SF Bay Area.`
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
      inputs: ["topojson","tractsTopoJSON","topojsonObj","category"],
      value: (function(topojson,tractsTopoJSON,topojsonObj,category)
{
  const tracts = topojson.feature(tractsTopoJSON, tractsTopoJSON.objects[topojsonObj])

  tracts.features = tracts.features.map(d => ({
    ...d,
    properties: {
      change: Number(d.properties[`${category}_c`]),
      lq2015: Number(d.properties[`${category}_15`]),
      quintile: d.properties.quintile
    }
  }))
  
  return tracts
}
)
    },
    {
      name: "tractsBoundaries",
      inputs: ["topojson","tractsTopoJSON","topojsonObj","boundaryFilter"],
      value: (function(topojson,tractsTopoJSON,topojsonObj,boundaryFilter){return(
topojson.mesh(tractsTopoJSON, tractsTopoJSON.objects[topojsonObj], boundaryFilter)
)})
    },
    {
      name: "tractsOutline",
      inputs: ["topojson","tractsTopoJSON","topojsonObj"],
      value: (function(topojson,tractsTopoJSON,topojsonObj){return(
topojson.merge(tractsTopoJSON, tractsTopoJSON.objects[topojsonObj].geometries)
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### palette`
)})
    },
    {
      inputs: ["md","numberClasses"],
      value: (function(md,numberClasses){return(
md`I chose to limit the palette to ${numberClasses} classes so that the color ramps are optimized for print.`
)})
    },
    {
      name: "numberClasses",
      value: (function(){return(
5
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`Diverging schemes for use with showing LQ Change for each of the 4 categories:`
)})
    },
    {
      name: "rdYlBu",
      inputs: ["d3","numberClasses"],
      value: (function(d3,numberClasses){return(
d3.schemeRdYlBu[numberClasses]
)})
    },
    {
      name: "brBG",
      inputs: ["d3","numberClasses"],
      value: (function(d3,numberClasses){return(
d3.schemeBrBG[numberClasses]
)})
    },
    {
      name: "pRGn",
      inputs: ["d3","numberClasses"],
      value: (function(d3,numberClasses){return(
d3.schemePRGn[numberClasses]
)})
    },
    {
      name: "rdBu",
      inputs: ["d3","numberClasses"],
      value: (function(d3,numberClasses){return(
d3.schemeRdBu[numberClasses]
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`Sequential schemes for use with showing the 2015 LQ for each of the 4 categories`
)})
    },
    {
      name: "ylGnBu",
      inputs: ["d3","numberClasses"],
      value: (function(d3,numberClasses){return(
d3.schemeYlGnBu[numberClasses]
)})
    },
    {
      name: "puRd",
      inputs: ["d3","numberClasses"],
      value: (function(d3,numberClasses){return(
d3.schemePuRd[numberClasses]
)})
    },
    {
      name: "rdPu",
      inputs: ["d3","numberClasses"],
      value: (function(d3,numberClasses){return(
d3.schemeRdPu[numberClasses]
)})
    },
    {
      name: "ylGn",
      inputs: ["d3","numberClasses"],
      value: (function(d3,numberClasses){return(
d3.schemeYlGn[numberClasses]
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`Greyscale for drawing things like borders / boundaries`
)})
    },
    {
      name: "greyScale",
      inputs: ["greys"],
      value: (function(greys){return(
greys
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`ES6 Map of categories to diverging color schemes`
)})
    },
    {
      name: "changeColorMap",
      inputs: ["rdBu","pRGn","brBG","rdYlBu"],
      value: (function(rdBu,pRGn,brBG,rdYlBu)
{
  const list = [
    ["make", rdBu],
    ["serv", pRGn],
    ["prof", brBG],
    ["supp", rdYlBu]
  ]
  const map = new Map(list)
  return map
}
)
    },
    {
      name: "curRamp",
      inputs: ["changeColorMap","category"],
      value: (function(changeColorMap,category){return(
changeColorMap.get(category)
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`ES6 Map of categories to sequential color schemes`
)})
    },
    {
      name: "lq2015ColorMap",
      inputs: ["ylGnBu","puRd","ylGn","rdPu"],
      value: (function(ylGnBu,puRd,ylGn,rdPu)
{
  const list = [
    ["make", ylGnBu],
    ["serv", puRd],
    ["prof", ylGn],
    ["supp", rdPu]
  ]
  const map = new Map(list)
  return map
}
)
    },
    {
      name: "curLqRamp",
      inputs: ["lq2015ColorMap","category"],
      value: (function(lq2015ColorMap,category){return(
lq2015ColorMap.get(category)
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### scales`
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`A threshold scale is used for showing change in LQ and a cluster scale is used for showing 2015 LQ.`
)})
    },
    {
      name: "thresholdExtent",
      inputs: ["d3","tracts"],
      value: (function(d3,tracts){return(
d3.extent(tracts.features.map(d => d.properties.change))
)})
    },
    {
      name: "thresholds",
      value: (function(){return(
[-1.5, -0.1, 0.1, 1.5]
)})
    },
    {
      name: "threshold",
      inputs: ["d3","curRamp"],
      value: (function(d3,curRamp){return(
d3.scaleThreshold()
  .domain([-1.5, -0.1, 0.1, 1.5])
  .range(curRamp)
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`I'm using a cluster scale as an alternative classification method to quantiles. Uses ckmeans algorithm which is similar to Jenks natural breaks.`
)})
    },
    {
      name: "clusterExtent",
      inputs: ["d3","tracts"],
      value: (function(d3,tracts){return(
d3.extent(tracts.features.map(d => d.properties.lq2015))
)})
    },
    {
      name: "cluster",
      inputs: ["scaleCluster","tracts","curLqRamp"],
      value: (function(scaleCluster,tracts,curLqRamp){return(
scaleCluster()
  .domain(tracts.features.map(d => d.properties.lq2015))
  .range(curLqRamp)
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`clusters from cluster scale:`
)})
    },
    {
      name: "clusters",
      inputs: ["cluster"],
      value: (function(cluster){return(
cluster.clusters()
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### misc`
)})
    },
    {
      name: "defaultCategory",
      value: (function(){return(
'prof'
)})
    },
    {
      name: "selectedCategoryLabel",
      inputs: ["categories","category"],
      value: (function(categories,category){return(
categories.find(d => d.value === category).label
)})
    },
    {
      name: "categories",
      value: (function(){return(
[
    {
      label: "Makers",
      value: "make"
    },
    {
      label: "Service",
      value: "serv"
    },
    {
      label: "Professional",
      value: "prof"
    },
    {
      label: "Support",
      value: "supp"
    }
  ]
)})
    },
    {
      name: "toggleValue",
      inputs: ["toggle"],
      value: (function(toggle)
{
  toggle
  return !this;
}
)
    },
    {
      name: "showMapframe",
      inputs: ["mapframe"],
      value: (function(mapframe)
{
  mapframe
  return !this;
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### dependencies`
)})
    },
    {
      from: "3b297925cd0d3aae@502/62",
      name: "map",
      remote: "map"
    },
    {
      from: "3b297925cd0d3aae@502/62",
      name: "projection",
      remote: "projection"
    },
    {
      from: "3b297925cd0d3aae@502/62",
      name: "path",
      remote: "path"
    },
    {
      from: "3b297925cd0d3aae@502/62",
      name: "greys",
      remote: "greys"
    },
    {
      from: "3b297925cd0d3aae@502/62",
      name: "boundaryFilter",
      remote: "boundaryFilter"
    },
    {
      from: "@mbostock/saving-svg",
      name: "serialize",
      remote: "serialize"
    },
    {
      from: "@jashkenas/inputs",
      name: "button",
      remote: "button"
    },
    {
      from: "@jashkenas/inputs",
      name: "slider",
      remote: "slider"
    },
    {
      from: "@jashkenas/inputs",
      name: "select",
      remote: "select"
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
      name: "scaleCluster",
      inputs: ["require"],
      value: (function(require){return(
require("d3-scale-cluster/dist/d3-scale-cluster.min.js")
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`### scratch`
)})
    },
    {
      value: (function()
{
// viewof colorScale = select({
//   title: "Color Scale",
//   description: "Select a color scale from the dropdown",
//   options: [
//     {
//       label: "diverging",
//       value: "diverging"
//     },
//     {
//       label: "threshold",
//       value: "threshold"
//     },
//     {
//       label: "quantize",
//       value: "quantize"
//     }
//   ],
//   value: "diverging"
// })
}
)
    }
  ]
};

const m1 = {
  id: "3b297925cd0d3aae@502/62",
  variables: [
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
      name: "greys",
      inputs: ["d3"],
      value: (function(d3){return(
d3.schemeGreys[9]
)})
    },
    {
      name: "boundaryFilter",
      value: (function(){return(
(a, b) => a !== b
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
      from: "3b297925cd0d3aae@502",
      name: "width",
      remote: "width"
    },
    {
      name: "height",
      inputs: ["width"],
      value: (function(width){return(
width * 1.2941176471
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
      name: "places",
      inputs: ["topojson","basemapTopoJSON"],
      value: (function(topojson,basemapTopoJSON){return(
topojson.feature(basemapTopoJSON, basemapTopoJSON.objects.osm_cities_towns)
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
      name: "topojson",
      inputs: ["require"],
      value: (function(require){return(
require("topojson")
)})
    },
    {
      name: "basemapTopoJSON",
      inputs: ["d3"],
      value: (async function(d3){return(
await d3.json("https://gist.githubusercontent.com/clhenrick/4ebb009378a9ede30d3db672caeb9ff5/raw/bda4918592ff5e089ee4deb6650c4e5d70adb994/basemap_layers.json")
)})
    }
  ]
};

const m2 = {
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

const m3 = {
  id: "@jashkenas/inputs",
  variables: [
    {
      name: "button",
      inputs: ["input"],
      value: (function(input){return(
function button(config = {}) {
  let {value, title, description, disabled} = config;
  if (typeof config == "string") value = config;
  if (!value) value = "Ok";
  const form = input({
    type: "button", title, description,
    attributes: {disabled, value}
  });
  form.output.remove();
  return form;
}
)})
    },
    {
      name: "slider",
      inputs: ["input"],
      value: (function(input){return(
function slider(config = {}) {
  let {value, min = 0, max = 1, step = "any", precision = 2, title, description, format, submit} = config;
  if (typeof config == "number") value = config;
  if (value == null) value = (max + min) / 2;
  precision = Math.pow(10, precision);
  return input({
    type: "range", title, description, submit, format,
    attributes: {min, max, step, value},
    getValue: input => Math.round(input.valueAsNumber * precision) / precision
  });
}
)})
    },
    {
      name: "select",
      inputs: ["input","html"],
      value: (function(input,html){return(
function select(config = {}) {
  let {
    value: formValue,
    title,
    description,
    submit,
    multiple,
    size,
    options
  } = config;
  if (Array.isArray(config)) options = config;
  options = options.map(
    o => (typeof o === "object" ? o : { value: o, label: o })
  );
  const form = input({
    type: "select",
    title,
    description,
    submit,
    getValue: input => {
      const selected = Array.prototype.filter
        .call(input.options, i => i.selected)
        .map(i => i.value);
      return multiple ? selected : selected[0];
    },
    form: html`
      <form>
        <select name="input" ${
          multiple ? `multiple size="${size || options.length}"` : ""
        }>
          ${options.map(
            ({ value, label }) => `
            <option value="${value}" ${
              value === formValue ? "selected" : ""
            }>${label}</option>
          `
          )}
        </select>
      </form>
    `
  });
  form.output.remove();
  return form;
}
)})
    },
    {
      name: "input",
      inputs: ["html","d3format"],
      value: (function(html,d3format){return(
function input(config) {
  let {form, type = "text", attributes = {}, action, getValue, title, description, format, submit, options} = config;
  if (!form) form = html`<form>
	<input name=input type=${type} />
  </form>`;
  const input = form.input;
  Object.keys(attributes).forEach(key => {
    const val = attributes[key];
    if (val != null) input.setAttribute(key, val);
  });
  if (submit) form.append(html`<input name=submit type=submit style="margin: 0 0.75em" value="${typeof submit == 'string' ? submit : 'Submit'}" />`);
  form.append(html`<output name=output style="font: 14px Menlo, Consolas, monospace; margin-left: 0.5em;"></output>`);
  if (title) form.prepend(html`<div style="font: 700 0.9rem sans-serif;">${title}</div>`);
  if (description) form.append(html`<div style="font-size: 0.85rem; font-style: italic;">${description}</div>`);
  if (format) format = d3format.format(format);
  if (action) {
    action(form);
  } else {
    const verb = submit ? "onsubmit" : type == "button" ? "onclick" : type == "checkbox" || type == "radio" ? "onchange" : "oninput";
    form[verb] = (e) => {
      e && e.preventDefault();
      const value = getValue ? getValue(input) : input.value;
      if (form.output) form.output.value = format ? format(value) : value;
      form.value = value;
      if (verb !== "oninput") form.dispatchEvent(new CustomEvent("input"));
    };
    if (verb !== "oninput") input.oninput = e => e && e.stopPropagation() && e.preventDefault();
    if (verb !== "onsubmit") form.onsubmit = (e) => e && e.preventDefault();
    form[verb]();
  }
  return form;
}
)})
    },
    {
      name: "d3format",
      inputs: ["require"],
      value: (function(require){return(
require("d3-format")
)})
    }
  ]
};

const notebook = {
  id: "3b297925cd0d3aae@502",
  modules: [m0,m1,m2,m3]
};

export default notebook;
