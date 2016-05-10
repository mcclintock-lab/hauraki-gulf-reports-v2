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
    'ProposalSize'
  ]


  render: () ->
    # The @recordSet method contains some useful means to get data out of 
    # the monsterous RecordSet json. Checkout the seasketch-reporting-template
    # documentation for more info.
    attr = @model.getAttribute('MPA_TYPE')
    TOTAL_COASTLINE_LENGTH = 2504.842794
    TOT_SIZE_SQKM = 14033.551666

    if attr == undefined
      isNeitherType = true
    else
      isType2 = (attr == 'MPA2')
      isMarineReserve = !isType2
    scid = @sketchClass.id

    is_water_quality_zone = (scid == WQ_ID)
    HECTARES = @recordSet('TargetSize', 'TargetSize').float('SIZE_IN_HA')
    total_sizes = @recordSet('ProposalSize', 'SizeTotals').toArray()
    prop_sizes = @recordSet('ProposalSize', 'Sizes').toArray()
    mpa_avg_min_dim = @getAverageMinDim(prop_sizes)
    total_percent = @getTotalAreaPercent(prop_sizes)
    prop_sizes = @cleanupData(prop_sizes)

    isCollection = @model.isCollection()
    if isCollection
      numSketches = @model.getChildren().length
    else
      numSketches = 1

    mpa_count = @getMinDimCount(prop_sizes)
    total_mpa_count = numSketches
    plural_mpa_count = mpa_count != 1

    
    if mpa_avg_min_dim < 10
      mpa_avg_size_guideline = "below"
    else
      mpa_avg_size_guideline = "above"


    if total_sizes?.length > 0
      coastline_length = total_sizes[0].COAST
      coastline_length_percent = (coastline_length/TOTAL_COASTLINE_LENGTH)*100.0
      if coastline_length_percent > 0 && coastline_length_percent < 1
        coastline_length_percent = "< 1"
      else
        coastline_length_percent = parseFloat(coastline_length_percent).toFixed(1)
        if coastline_length_percent > 100
          coastline_length_percent = 100
      size = total_sizes[0].SIZE_SQKM

      coastline_length = parseFloat(coastline_length).toFixed(1)
      area_percent = parseFloat((size/TOT_SIZE_SQKM)*100).toFixed(1)
      if area_percent > 100
        area_percent = 100.0

      if area_percent < 0.1
        area_percent = "< 1"
        
    size_sqkm = Math.round(HECTARES*0.01)
    try
      warningsRS = @recordSet('OverlapWithWarningAreas', 'OverlapWithWarningAreas')
      if warningsRS.toArray()?.length > 0
        hasWarnings = true
        warnings = warningsRS.raw('FEAT_TYPE')
      else
        hasWarnings = false
        warnings = ""
      #getting rid of warnings temporarily
      hasWarnings = false
      warnings = ""
    catch error
      hasWarnings = false
      warnings = ""
    try
      hc_existing = @recordSet('HabitatCount', 'HabitatCount').float('EXST_HAB')
      hc_proposed = @recordSet('HabitatCount', 'HabitatCount').float('SEL_HAB')
      hc_combined =@recordSet('HabitatCount', 'HabitatCount').float('CMBD_HAB')
      hc_total = @recordSet('HabitatCount', 'HabitatCount').float('TOT_HAB')
    catch error
      console.log("err: ", error)
    try
      hc_existing_t2 = @recordSet('HabitatCount', 'HabitatCountType2').float('EXST_HAB')
      hc_proposed_t2 = @recordSet('HabitatCount', 'HabitatCountType2').float('SEL_HAB')    
      hc_combined_t2 =@recordSet('HabitatCount', 'HabitatCountType2').float('CMBD_HAB')
      hc_total_t2 = @recordSet('HabitatCount', 'HabitatCountType2').float('TOT_HAB')
    catch error

    try
      HAB_PERC_MR_NEW = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('NW_RES_PRC')
      HAB_PERC_MR_EXISTING = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('EX_RES_PRC')
      HAB_PERC_MR_COMBINED = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('CB_RES_PRC')
    catch error

    try
      HAB_PERC_T2_NEW = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('NW_HPA_PRC')
      HAB_PERC_T2_EXISTING = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('EX_HPA_PRC')
      HAB_PERC_T2_COMBINED = @recordSet('HabitatCountPercent', 'HabitatCountPercent').float('CB_HPA_PRC')

    catch error
    #show tables instead of graph for IE
    if window.d3
      d3IsPresent = true
    else
      d3IsPresent = false

    console.log("num habs: ", hc_combined)
    console.log("num habs t2: ", hc_combined_t2)

    if isMarineReserve
      num_habs = hc_combined
    else
      num_habs = hc_combined_t2

    if isNeitherType
      num_habs = Math.max(hc_combined, hc_combined_t2)
      
    attributes = @model.getAttributes()
    
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      SIZE: HECTARES
      SIZE_KM: size_sqkm
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

      NUM_HABS: num_habs
      d3IsPresent: d3IsPresent
      isType2: isType2
      isMarineReserve: isMarineReserve

      warnings: warnings
      hasWarnings: hasWarnings
      is_water_quality_zone: is_water_quality_zone

      prop_sizes: prop_sizes
      isCollection: isCollection
      area_percent: area_percent
      coastline_length_percent: coastline_length_percent
    @$el.html @template.render(context, partials)
    @enableLayerTogglers()
    @drawViz(hc_existing, hc_proposed, hc_combined, hc_total, hc_existing_t2, hc_proposed_t2, hc_combined_t2, hc_total_t2, HAB_PERC_MR_EXISTING, HAB_PERC_MR_NEW, HAB_PERC_T2_EXISTING, HAB_PERC_T2_NEW, isMarineReserve, isType2)

  drawViz: (existing, proposed, combined, total, t2existing, t2proposed, t2combined, t2total, perc_mr_existing, perc_mr_new, perc_t2_existing, perc_t2_new, isMarineReserve, isType2) ->
    # Check if d3 is present. If not, we're probably dealing with IE
    max_value = 47
    twothirds_max = 33
    if window.d3
      new_mr_habs = combined-existing
      unprotected_mr_habs = max_value-combined
      unprotected_mr_habs_start = combined
      unprotected_mr_label_start = combined

      if combined > twothirds_max and combined <= max_value
        unprotected_mr_label_start = twothirds_max
      

      new_t2_habs = t2combined-t2existing      
      unprotected_t2_habs = max_value-t2combined
      unprotected_t2_habs_start = t2combined
      unprotected_t2_label_start = t2combined
      
      if t2combined > twothirds_max and t2combined <=max_value
        unprotected_t2_label_start = twothirds_max


      #don't draw the 'unprotected' type if they are all protected
      if combined == max_value
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
            name: 'Additional'
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
            name: 'Additional'
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
            end: max_value
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
            name: 'Additional'
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
            end: max_value
            class: 'unprotected'
            value: unprotected_t2_habs
            label_start: unprotected_t2_label_start
          }
        ]
      if isMarineReserve
        @drawMarineReserveBars(ranges)
      else
        @drawType2Bars(t2ranges)


      #The percentage bars
      default_mr_start = perc_mr_existing
      default_t2_start = perc_t2_existing
      perc_mr_combined = perc_mr_existing+perc_mr_new
      perc_t2_combined = perc_t2_existing+perc_t2_new
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
          name: 'Existing (0.3%) / Additional '
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
          name: 'Existing (0.3%) / Additional '
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
      if isMarineReserve
        @drawMarineReservePercentBars(perc_ranges)
      else 
        @drawType2PercentBars(perc_t2_ranges)



  drawType2Bars: (t2ranges) =>
    max_value = 47
    el = @$('.viz')[0]
    x = d3.scale.linear()
      .domain([0, max_value])
      .range([0, 400])
    chart = d3.select(el)
    chart.selectAll("div.range")
      .data(t2ranges)
    .enter().append("div")
      .style("width", (d) -> Math.round(x(d.end - d.start),0) + 'px')
      .attr("class", (d) -> "range " + d.class)
      .append("span")
        .text((d) -> "#{d.name} (#{d.value})")
        .style("left", (d) -> if d.label_start then (x(d.label_start)+'px') else '')
        .attr("class", (d) -> "label-"+d.class)

  drawMarineReserveBars: (ranges) =>
    max_value = 47
    el = @$('.viz')[0]
    x = d3.scale.linear()
      .domain([0, max_value])
      .range([0, 400])
    chart = d3.select(el)
    chart.selectAll("div.range")
      .data(ranges)
    .enter().append("div")
      .style("width", (d) -> Math.round(x(d.end - d.start),0) + 'px')
      .attr("class", (d) -> "range " + d.class)
      .append("span")
        .text((d) -> "#{d.name} (#{d.value})")
        .style("left", (d) -> if d.label_start then x(d.label_start)+'px' else '')
        .attr("class", (d) -> "label-"+d.class)

  drawType2PercentBars: (perc_t2_ranges) =>
    el = @$('.vizPerc')[0]
    x = d3.scale.linear()
      .domain([0, 30])
      .range([0, 400])
    chart = d3.select(el)
    chart.selectAll("div.range")
      .data(perc_t2_ranges)
    .enter().append("div")
      .style("width", (d) -> Math.round(x(d.end - d.start),0) + 'px')
      .attr("class", (d) -> "range " + d.class)
      .append("span")
        .text((d) -> if d.name then "#{d.name} (#{d.value})" else '')
        .attr("class", (d) -> "label-"+d.class)
        .style("left", (d) -> if d.label_start then (x(d.label_start)+'px') else '')

    
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
    
      

  drawMarineReservePercentBars: (perc_ranges) =>
    x = d3.scale.linear()
      .domain([0, 30])
      .range([0, 400])
  
    el = @$('.vizPerc')[0]
    chart = d3.select(el)
    chart.selectAll("div.range")
      .data(perc_ranges)
    .enter().append("div")
      .style("width", (d) -> Math.round(x(d.end - d.start),0) + 'px')
      .attr("class", (d) -> "range " + d.class)
      .append("span")
        .text((d) -> if d.name then "#{d.name} (#{d.value})" else '')
        .attr("class", (d) -> "label-"+d.class)
        .style("left", (d) -> if d.label_start then (x(d.label_start)+'px') else '')
  
    
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
    

  getTotalAreaPercent: (prop_sizes) =>

    for ps in prop_sizes
      if ps.NAME == "Percent of Total Area"
        return ps.SIZE_SQKM
    return 0.0

  getAverageMinDim: (prop_sizes) =>
    for ps in prop_sizes
      if ps.NAME == "Average"
        return ps.MIN_DIM

  cleanupData: (prop_sizes, isCollection) =>
    cleaned_props = []
    num_sketches = prop_sizes?.length
    for ps in prop_sizes
      if ps.NAME != "Percent of Total Area"
        ps.MIN_DIM = parseFloat(ps.MIN_DIM).toFixed(1)
        ps.SIZE_SQKM = parseFloat(ps.SIZE_SQKM).toFixed(1)
        if ps.SIZE_SQKM < 0.1
          ps.SIZE_SQKM = "< 0.1"
        ps.COAST = Number(ps.COAST).toFixed(1)
        if ps.COAST == 0 
          ps.COAST = "--"
        #don't include average for singe sketch
        if num_sketches == 3 
          if ps.NAME != "Average"
            cleaned_props.push(ps)
        else
          cleaned_props.push(ps)
      if ps.NAME == "Average"
        ps.CSS_CLASS = "is_avg"
      else
        ps.CSS_CLASS = "not_avg"

    return cleaned_props

  getMinDimCount: (prop_sizes) =>
    num_meet_criteria = 0
    total_min_size = 0

    for ps in prop_sizes
      if ps.NAME != "Average" && ps.MIN_DIM > 5 
        num_meet_criteria+=1

    return num_meet_criteria

  addCommas: (num_str) =>
    num_str += ''
    x = num_str.split('.')
    x1 = x[0]
    x2 = if x.length > 1 then '.' + x[1] else ''
    rgx = /(\d+)(\d{3})/
    while rgx.test(x1)
      x1 = x1.replace(rgx, '$1' + ',' + '$2')
    return x1 + x2
module.exports = OverviewTab