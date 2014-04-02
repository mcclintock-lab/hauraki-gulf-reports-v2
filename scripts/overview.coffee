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
    'OverlapWithWarningAreas'
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

    warningsRS = @recordSet('OverlapWithWarningAreas', 'OverlapWithWarningAreas')
    if warningsRS.toArray()?.length > 0
      hasWarnings = true
      warnings = warningsRS.raw('FEAT_TYPE')
    else
      hasWarnings = false
      warnings = ""


    hc_existing = @recordSet('HabitatCount', 'HabitatCount').float('EXST_HAB')
    hc_proposed = @recordSet('HabitatCount', 'HabitatCount').float('SEL_HAB')
    hc_combined =@recordSet('HabitatCount', 'HabitatCount').float('CMBD_HAB')
    hc_total = @recordSet('HabitatCount', 'HabitatCount').float('TOT_HAB')


    hc_existing_t2 = @recordSet('HabitatCount', 'HabitatCountType2').float('EXST_HAB')
    hc_proposed_t2 = @recordSet('HabitatCount', 'HabitatCountType2').float('SEL_HAB')    
    hc_combined_t2 =@recordSet('HabitatCount', 'HabitatCountType2').float('CMBD_HAB')
    hc_total_t2 = @recordSet('HabitatCount', 'HabitatCountType2').float('TOT_HAB')


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

    attributes = @model.getAttributes()
    
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

      warnings: warnings
      hasWarnings: hasWarnings

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()
    @drawViz(hc_existing, hc_proposed, hc_combined, hc_total, hc_existing_t2, hc_proposed_t2, hc_combined_t2, hc_total_t2, HAB_PERC_MR_EXISTING, HAB_PERC_MR_NEW, HAB_PERC_T2_EXISTING, HAB_PERC_T2_NEW)




  drawViz: (existing, proposed, combined, total, t2existing, t2proposed, t2combined, t2total, perc_mr_existing, perc_mr_new, perc_t2_existing, perc_t2_new) ->
    # Check if d3 is present. If not, we're probably dealing with IE
    if window.d3
      new_mr_habs = combined-existing
      unprotected_mr_habs = 62-combined
      unprotected_mr_habs_start = combined
      unprotected_mr_label_start = combined

      if combined > 45 and combined <= 62
        unprotected_mr_label_start = 45
      

      new_t2_habs = t2combined-t2existing
      unprotected_t2_habs = 62-t2combined
      unprotected_t2_habs_start = t2combined
      unprotected_t2_label_start = t2combined
      
      if t2combined > 45 and t2combined <=62
        unprotected_t2_label_start = 45


      el = @$('.viz')[0]

      #don't draw the 'unprotected' type if they are all protected
      if combined == 62
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
            value: new_mr_habs
          }
        ]
      else
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
            value: new_mr_habs
          }
          {
            name: 'Unprotected'
            bg: '#dddddd'
            start: unprotected_mr_habs_start
            end: 62
            class: 'unprotected'
            value: unprotected_mr_habs
            label_start: unprotected_mr_label_start
          }
        ]
        t2ranges = [
          {
            name: 'Existing'
            bg: "#8e5e50"
            start: 0
            end: t2existing
            class: 'existing'
            value: t2existing
          }
          {
            name: 'New'
            bg: '#588e3f'
            start: t2existing
            end: t2combined
            class: 'proposed'
            value: new_t2_habs
          }
          {
            name: 'Unprotected'
            bg: '#dddddd'
            start: unprotected_t2_habs_start
            end: 62
            class: 'unprotected'
            value: unprotected_t2_habs
            label_start: unprotected_t2_label_start
          }
        ]

      x = d3.scale.linear()
        .domain([0, 62])
        .range([0, 400])
      
      chart = d3.select(el)
      chart.selectAll("div.range")
        .data(ranges)
      .enter().append("div")
        .style("width", (d) -> x(d.end - d.start) + 'px')
        .attr("class", (d) -> "range " + d.class)
        .append("span")
        .style("left", (d) -> x(d.label_start)+'px')
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
        .style("left", (d) -> x(d.label_start)+'px')
          .attr("class", (d) -> "label-"+d.class)
          .html((d) -> d.name+"<strong>  ("+d.value+")</strong>")

      #The percentage bars
      default_mr_start = perc_mr_existing
      default_t2_start = perc_t2_existing
      perc_mr_combined = perc_mr_existing+perc_mr_new
      perc_t2_combined = perc_t2_existing+perc_t2_new
      console.log("combined, ", perc_mr_combined)
      if perc_mr_combined >= 22 and perc_mr_combined <= 30
        perc_mr_new_start = default_mr_start
        perc_mr_new_end = perc_mr_combined
        perc_mr_unprotected_label_start = 20
      else if perc_mr_combined > 30
        perc_mr_new_start = default_mr_start
        perc_mr_new_end = 30
        perc_mr_unprotected_label_start = 21
      else
        perc_mr_new_start = default_mr_start
        perc_mr_new_end = perc_mr_combined
        perc_mr_unprotected_label_start = perc_mr_new_start

      if perc_t2_combined >= 22 and perc_t2_combined <= 30
        perc_t2_new_start = default_t2_start
        perc_t2_new_end = perc_t2_combined
        perc_t2_unprotected_label_start = 20
      else if perc_t2_combined > 30
        perc_t2_new_start = default_t2_start
        perc_t2_new_end = 30
        perc_t2_unprotected_label_start = 20
      else
        perc_t2_new_start = default_t2_start
        perc_t2_new_end = perc_t2_combined
        perc_t2_unprotected_label_start = perc_t2_new_start


      perc_mr_unprotected = 100 - perc_mr_combined
      perc_t2_unprotected = 100 - perc_t2_combined
      perc_ranges = [
        {
          name: ''
          bg: "#8e5e50"
          start: 0
          end: perc_mr_existing
          class: 'existing'
        }
        {
          name: 'Existing <strong>(0.3%)</strong> / New '
          bg: "#588e3f"
          start: perc_mr_new_start
          end: perc_mr_new_end
          label_start: 0
          class: 'proposed'
          value: perc_mr_new
        }
        {
          name: 'Unprotected'
          bg: '#dddddd'
          start: perc_mr_new_end
          label_start: perc_mr_unprotected_label_start
          end: 30
          class: 'unprotected'
          value: perc_mr_unprotected
        }
      ]

      perc_t2_ranges = [
        {
          name: ''
          bg: "#8e5e50"
          start: 0
          end: perc_t2_existing
          class: 'existing'
        }
        {
          name: 'Existing <strong>(0.3%)</strong> / New '
          bg: '#588e3f'
          start: perc_t2_new_start
          end: perc_t2_new_end
          class: 'proposed'
          value: perc_t2_new
          label_start: 0
        }
        {
          name: 'Unprotected'
          bg: '#dddddd'
          start: perc_t2_new_end
          label_start: perc_t2_unprotected_label_start
          end: 30
          class: 'unprotected'
          value: perc_t2_unprotected
        }
      ]

      x = d3.scale.linear()
        .domain([0, 30])
        .range([0, 400])

      el = @$('.viz')[2]
      chart = d3.select(el)
      chart.selectAll("div.range")
        .data(perc_ranges)
      .enter().append("div")
        .style("width", (d) -> x(d.end - d.start) + 'px')
        .attr("class", (d) -> "range " + d.class)
        .append("span")
          .attr("class", (d) -> "label-"+d.class)
          .style("left", (d) -> x(d.label_start)+'px')
          .html((d) -> (
                          if d.name 
                            return d.name+"<strong>  ("+d.value+"%)</strong>"
                          else
                            return ''
                       ))
    
      chart.selectAll("div.max_marker")
        .data([30])
      .enter().append("div")
        .attr("class", "max_marker")
        .text((d) -> "")
        .style("left", (d) -> x(d) + 'px')

      chart.selectAll("div.max_label")
        .data([29])
      .enter().append("div")
        .attr("class", "max_label")
        .text((d) -> "30%")
        .style("left", (d) -> x(d) + 'px')

      el = @$('.viz')[3]
      chart = d3.select(el)
      chart.selectAll("div.range")
        .data(perc_t2_ranges)
      .enter().append("div")
        .style("width", (d) -> x(d.end - d.start) + 'px')
        .attr("class", (d) -> "range " + d.class)
        .append("span")
          .attr("class", (d) -> "label-"+d.class)
          .style("left", (d) -> x(d.label_start)+'px')
          .html((d) -> (
                          if d.name
                            return d.name+"<strong>  ("+d.value+"%)</strong>"
                          else
                            return ''
                       ))

      chart.selectAll("div.max_marker")
        .data([30])
      .enter().append("div")
        .attr("class", "max_marker")
        .text((d) -> "")
        .style("left", (d) -> x(d) + 'px')

      chart.selectAll("div.max_label")
        .data([29])
      .enter().append("div")
        .attr("class", "max_label")
        .text((d) -> "30%")
        .style("left", (d) -> x(d) + 'px')

module.exports = OverviewTab