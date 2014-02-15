ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

ids = require './ids.coffee'
for key, value of ids
  window[key] = value

MIN_SIZE = 10000

class OverviewTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Overview'
  className: 'overview'
  timeout: 120000
  template: templates.overview
  dependencies: [
    'TargetSize'
    'HabitatCount'
    'HabitatCountPercent'
  ]

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
    attr = @model.getAttribute('MPA_TYPE')

    if attr == 'MPA2'
      hasType2MPAs = true
      hasMarineReserves = true
    else
      hasType2MPAs = false
      hasMarineReserves = true

    HECTARES = @recordSet('TargetSize', 'TargetSize').float('SIZE_IN_HA')
    
    if hasMarineReserves
      hc_proposed = @recordSet('HabitatCount', 'HabitatCount').float('SEL_HAB')
      hc_existing = @recordSet('HabitatCount', 'HabitatCount').float('EXST_HAB')
      hc_combined =@recordSet('HabitatCount', 'HabitatCount').float('CMBD_HAB')
      hc_total = @recordSet('HabitatCount', 'HabitatCount').float('TOT_HAB')
    else
      hc_proposed = 0
      hc_existing = 0
      hc_combined = 0
      hc_total = 0

    if hasType2MPAs
      hc_proposed_t2 = @recordSet('HabitatCount', 'HabitatCountType2').float('SEL_HAB')
      hc_existing_t2 = @recordSet('HabitatCount', 'HabitatCountType2').float('EXST_HAB')
      hc_combined_t2 =@recordSet('HabitatCount', 'HabitatCountType2').float('CMBD_HAB')
      hc_total_t2 = @recordSet('HabitatCount', 'HabitatCountType2').float('TOT_HAB')
    else
      hc_proposed_t2 = 0
      hc_existing_t2 = 0
      hc_combined_t2 = 0
      hc_total_t2 = 0

    HAB_PERC_MR_NEW = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('NW_RES_PRC')
    HAB_PERC_MR_EXISTING = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('EX_RES_PRC')
    HAB_PERC_MR_COMBINED = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('CB_RES_PRC')

    HAB_PERC_T2_NEW = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('NW_HPA_PRC')
    HAB_PERC_T2_EXISTING = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('EX_HPA_PRC')
    HAB_PERC_T2_COMBINED = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('CB_HPA_PRC')

    #show tables instead of graph for IE
    if window.d3
      d3IsPresent = true
    else
      d3IsPresent = false

    context =
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
      HAB_COUNT_PROPOSED: hc_proposed
      HAB_COUNT_EXISTING: hc_existing
      HAB_COUNT_COMBINED: hc_combined
      HAB_COUNT_TOTAL: hc_total
      HAB_COUNT_PROPOSED_T2: hc_proposed_t2
      HAB_COUNT_EXISTING_T2: hc_existing_t2
      HAB_COUNT_COMBINED_T2: hc_combined_t2
      HAB_COUNT_TOTAL_T2: hc_total_t2
      HAB_PERC_MR_NEW: HAB_PERC_MR_NEW
      HAB_PERC_MR_EXISTING: HAB_PERC_MR_EXISTING
      HAB_PERC_MR_COMBINED: HAB_PERC_MR_COMBINED
      HAB_PERC_T2_NEW: HAB_PERC_T2_NEW
      HAB_PERC_T2_EXISTING: HAB_PERC_T2_EXISTING
      HAB_PERC_T2_COMBINED: HAB_PERC_T2_COMBINED
      d3IsPresent: d3IsPresent

    @$el.html @template.render(context, partials)
    @drawViz(hc_existing, hc_proposed, hc_combined, hc_total, hc_existing_t2, hc_proposed_t2, hc_combined_t2, hc_total_t2)



  # D3 is a bit of a mess unless you've really internalized it's way of doing
  # things. I'd suggest just displaying the "Representation" and "Percent"
  # info with simple tables unless there is plenty of time to work on the
  # visualizations in the mockups.
  drawViz: (existing, proposed, combined, total, t2existing, t2proposed, t2combined, t2total) ->
    # Check if d3 is present. If not, we're probably dealing with IE
    if window.d3
      newHabs = combined-existing
      unprotectedHabs = 62-combined
      unprotectedHabsStart = combined

      t2NewHabs = t2combined
      t2UnprotectedHabs = 62-t2combined
      unprotectedT2HabStart = t2combined
      #need to make sure the label isn't too far to the right 
      if combined > 47
        unprotectedHabsStart = 47
      if t2combined > 47
         unprotectedT2HabStart = 47

      el = @$('.viz')[0]

      ranges = [
        {
          name: 'Existing'
          bg: "#8e5e50"
          start: 0
          end: existing
          class: 'existing'
          value: existing
        }
        {
          name: 'New'
          bg: '#588e3f'
          start: existing
          end: combined
          class: 'proposed'
          value: newHabs
        }
        {
          name: 'Unprotected'
          bg: '#dddddd'
          start: unprotectedHabsStart
          end: 62
          class: 'unprotected'
          value: unprotectedHabs
        }
      ]
      t2ranges = [
        {
          name: 'Existing <strong>(0)</strong> / New'
          bg: '#588e3f'
          start: t2existing
          end: t2combined
          class: 'proposed'
          value: t2NewHabs
        }
        {
          name: 'Unprotected'
          bg: '#dddddd'
          start: unprotectedT2HabStart
          end: 62
          class: 'unprotected'
          value: t2UnprotectedHabs
        }
      ]

      x = d3.scale.linear()
        .domain([0, 62])
        .range([0, 410])
      
      chart = d3.select(el)
      chart.selectAll("div.range")
        .data(ranges)
      .enter().append("div")
        .style("width", (d) -> x(d.end - d.start) + 'px')
        .attr("class", (d) -> "range " + d.class)
        .append("span")
          .attr("class", (d) -> "label-"+d.class)
          .html((d) -> d.name+"<strong>  ("+d.value+")</strong>")

      el = @$('.viz')[1]
      chart = d3.select(el)
      chart.selectAll("div.range")
        .data(t2ranges)
      .enter().append("div")
        .style("width", (d) -> x(d.end - d.start) + 'px')
        .attr("class", (d) -> "range " + d.class)
        .append("span")
          .attr("class", (d) -> "label-"+d.class)
          .html((d) -> d.name+"<strong>  ("+d.value+")</strong>")


module.exports = OverviewTab