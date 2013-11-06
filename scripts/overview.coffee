ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

MIN_SIZE = 10000

class OverviewTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Dans Overview'
  className: 'overview'
  timeout: 120000
  template: templates.overview
  dependencies: ['TargetSize']
  # Dependencies will likely need to be changed to something like this to
  # support more GP services:
  # dependencies: [
  #   'TargetSize'
  #   'RepresentationOfHabitats'
  #   'PercentProtected'
  # ]

  render: () ->
    # The @recordSet method contains some useful means to get data out of 
    # the monsterous RecordSet json. Checkout the seasketch-reporting-template
    # documentation for more info.
    HECTARES = @recordSet('TargetSize', 'TargetSize').float('SIZE_IN_HA')
    # I use this isCollection flag to customize the display. Another option
    # would be to have totally different Tab implementations for zones vs 
    # collections. I didn't do that here since they are so similar.
    isCollection = @model.isCollection()
    if isCollection
      # @model is the client-side sketch representation, which has some
      # useful, if undocumented, methods like getChildren().
      children = @model.getChildren()
      # NOTE: I'm dividing by all children here. Should this be filtered to
      # exclude Aquaculture and Mooring areas??
      HECTARES = HECTARES / children.length
      marineReserves = _.filter children, (child) -> 
        child.getAttribute('MPA_TYPE') is 'MPA1'
      type2MPAs = _.filter children, (child) -> 
        child.getAttribute('MPA_TYPE') is 'MPA2'
    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      SIZE: HECTARES
      SIZE_OK: HECTARES > MIN_SIZE
      MIN_SIZE: MIN_SIZE
      MARINE_RESERVES: marineReserves?.length
      MARINE_RESERVES_PLURAL: marineReserves?.length != 1
      TYPE_TWO_MPAS: type2MPAs?.length
      TYPE_TWO_MPAS_PLURAL: type2MPAs?.length != 1
      NUM_PROTECTED: marineReserves?.length + type2MPAs?.length
    # @template is /templates/overview.mustache
    @$el.html @template.render(context, partials)
    # If the measure is too high, the visualization just looks stupid
    if HECTARES < MIN_SIZE * 2
      @drawViz(HECTARES)
    else
      @$('.viz').hide()

  # D3 is a bit of a mess unless you've really internalized it's way of doing
  # things. I'd suggest just displaying the "Representation" and "Percent"
  # info with simple tables unless there is plenty of time to work on the
  # visualizations in the mockups.
  drawViz: (size) ->
    # Check if d3 is present. If not, we're probably dealing with IE
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