ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

MIN_SIZE = 10000

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies: []
  timeout: 120000

  render: () ->
    HECTARES = 21000

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      SIZE: HECTARES
      SIZE_OK: HECTARES > MIN_SIZE
      MIN_SIZE: MIN_SIZE
    
    @$el.html @template.render(context, partials)
    if HECTARES < MIN_SIZE * 2
      @drawViz(HECTARES)
    else
      @$('.viz').hide()

  drawViz: (size) ->
    console.log 'drawviz', size
    if window.d3
      console.log 'd3'
      el = @$('.viz')[0]
      maxScale = MIN_SIZE * 2
      ranges = [
        {
          name: 'Below recommended (0 - 10,000 ha)'
          start: 0
          end: MIN_SIZE
          bg: "#8e5e50"
          class: 'below'
        }
        {
          name: 'Recommended (> 10,000 ha)'
          start: MIN_SIZE
          end: MIN_SIZE * 2
          bg: '#588e3f'
          class: 'recommended'
        }
      ]

      x = d3.scale.linear()
        .domain([0, maxScale])
        .range([0, 400])
      
      chart = d3.select(el)
      chart.selectAll("div.range")
        .data(ranges)
      .enter().append("div")
        .style("width", (d) -> x(d.end - d.start) + 'px')
        .attr("class", (d) -> "range " + d.class)
        .append("span")
          .text((d) -> d.name)

      chart.selectAll("div.measure")
        .data([size])
      .enter().append("div")
        .attr("class", "measure")
        .style("left", (d) -> x(d) + 'px')
        .text((d) -> "")


module.exports = OverviewTab