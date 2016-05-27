ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'
for key, value of ids
  window[key] = value

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

ids = require './ids.coffee'
for key, value of ids
  window[key] = value

class ArrayEnvironmentTab extends ReportTab
  name: 'Environment'
  className: 'arrayEnvironment'
  timeout: 120000
  template: templates.arrayHabitat
  dependencies: ['ZonationToolbox', 'HabitatComprehensiveness', 'Catchment', 'EcosystemServices', 'SensitiveAreas', 'ProtectedAndThreatenedSpecies', 'ProximityToExistingProtectedAreas']
  UP: "up"
  DOWN: "down"

  render: () ->
    isCollection = @model.isCollection()
    aquacultureZones = @getChildren AQUACULTURE_ID
    hasAquacultureClasses = aquacultureZones?.length > 0

    protectionZones = @getChildren PROTECTION_ID
    hasProtectionClasses = protectionZones?.length > 0
    catchmentPercents =  @recordSet('Catchment', 'Catchment').toArray()

    try
      zb = @recordSet('ZonationToolbox', 'Biodiversity').toArray()  
      zonation_biodiversity = @parseZonation zb
      zh = @recordSet('ZonationToolbox', 'Habitats').toArray()
      zonation_habitats = @parseZonation zh
    catch e
      console.log("error parsing zonation data: ", e)
    
    try
      biogenic_habitats = @recordSet('HabitatComprehensiveness', 'BiogenicHabitats').toArray()
      biogenicHabitatsInReserves = _.filter biogenic_habitats, (row) -> row.MPA_TYPE is 'MPA1' 
      hasBiogenicReserveData = biogenicHabitatsInReserves?.length > 0
      biogenicHabitatsInReservesCount = biogenicHabitatsInReserves?.length
      if hasBiogenicReserveData
        biogenicHabitatsInReserves = _.sortBy biogenicHabitatsInReserves, (row) -> row.HAB_TYPE

      biogenicHabitatsInTypeTwos = _.filter biogenic_habitats, (row) -> row.MPA_TYPE is 'MPA2' 
      biogenicHabitatsInTypeTwoCount = biogenicHabitatsInTypeTwos?.length
      hasBiogenicTypeTwoData = biogenicHabitatsInTypeTwos.length > 0
      if hasBiogenicTypeTwoData
        biogenicHabitatsInTypeTwos = _.sortBy biogenicHabitatsInTypeTwos, (row) -> row.HAB_TYPE

    catch e
      console.log("no biogenic habitats found")
      biogenic_habitats = []
    
    if hasProtectionClasses
      try
        #if its all aquaculture, this will be empty
        habitats = @recordSet('HabitatComprehensiveness', 'HabitatComprehensiveness').toArray()
        habitatsInReserves = _.filter habitats, (row) -> row.MPA_TYPE is 'MPA1' 
        hasReserveData = habitatsInReserves?.length > 0
        habitatsInReservesCount = habitatsInReserves?.length
        if hasReserveData
          habitatsInReserves = _.sortBy habitatsInReserves, (row) -> row.HAB_TYPE


        habitatsInTypeTwos = _.filter habitats, (row) -> row.MPA_TYPE is 'MPA2' 
        habitatsInTypeTwoCount = habitatsInTypeTwos?.length
        hasTypeTwoData = habitatsInTypeTwos.length > 0
        if hasTypeTwoData
          habitatsInTypeTwos = _.sortBy habitatsInTypeTwos, (row) -> row.HAB_TYPE
        

        representationData = _.filter habitats, (row) -> row.MPA_TYPE is 'ALL_TYPES' 
        hasRepresentationData = representationData?.length > 0
        representedCount = representationData?.length
        representationData = _.sortBy representationData, (row) -> row.HAB_TYPE


      catch error
        hasTypeTwoData = false
        hasReserveData = false
        hasRepresentationData = false

      try
        protectionEcosystemProductivity = @recordSet('EcosystemServices', 'EcosystemProductivity', PROTECTION_ID).toArray()
        protectionNutrientRecycling = @recordSet('EcosystemServices', 'NutrientRecycling', PROTECTION_ID).toArray()
        protectionBiogenicHabitat = @recordSet('EcosystemServices', 'BiogenicHabitat', PROTECTION_ID).toArray()
        scid = @sketchClass.id
        is_env_zone = (scid == WQ_ID)
        new_ecosystem_services =  @recordSet('HabitatComprehensiveness', 'EcosystemServices').toArray()
        new_ecosystem_services = _.sortBy new_ecosystem_services, (row) -> row.HAB_TYPE
        

      catch error
        
      hasProtectionSensitiveAreas = false
      protectionSensitiveAreas = []

      try
        protectionProtectedMammals = @recordSet('ProtectedAndThreatenedSpecies', 'Mammals', PROTECTION_ID).toArray()
        hasProtectionProtectedMammals = protectionProtectedMammals?.length > 0
        protectionProtectedMammals = _.sortBy protectionProtectedMammals, (row) -> parseInt(row.Count)
        protectionProtectedMammals.reverse()
      catch error
        hasProtectionProtectedMammals = false

      try
        protectionSeabirdBreedingSites = @recordSet('ProtectedAndThreatenedSpecies', 'SeabirdBreedingSites',PROTECTION_ID).toArray()
        hasProtectionSeabirdBreedingSites = protectionSeabirdBreedingSites?.length > 0
        protectionSeabirdBreedingSites = _.sortBy protectionSeabirdBreedingSites, (row) -> parseInt(row.Count)
        protectionSeabirdBreedingSites.reverse()
      catch error
        hasProtectionSeabirdBreedingSites = false
      try
        protectonShorebirdSites = @recordSet('ProtectedAndThreatenedSpecies', 'ShorebirdPoints',PROTECTION_ID).toArray()
        protectionShorebirdSites = _.sortBy protectionShorebirdSites, (row) -> parseInt(row.Count)
        hasProtectionShorebirdSites = protectionShorebirdSites?.length > 0
        protectionShorebirdSites.reverse()
      catch error
        hasProtectionShorebirdSites = false

    if hasAquacultureClasses

      aquacultureSensitiveAreas = []
      #hide them for now
      hasAquacultureSensitiveAreas = false
      try
        aquacultureProtectedMammals = @recordSet('ProtectedAndThreatenedSpecies', 'Mammals',AQUACULTURE_ID).toArray()
        hasAquacultureProtectedMammals = aquacultureProtectedMammals?.length > 0
        aquacultureProtectedMammals = _.sortBy aquacultureProtectedMammals, (row) -> parseInt(row.Count)
        aquacultureProtectedMammals.reverse()
      catch error
        hasAquacultureProtectedMammals = false
      try
        aquacultureSeabirdBreedingSites = @recordSet('ProtectedAndThreatenedSpecies', 'SeabirdBreedingSites',AQUACULTURE_ID).toArray()
        hasAquacultureSeabirdBreedingSites = aquacultureSeabirdBreedingSites?.length > 0
        aquacultureSeabirdBreedingSites = _.sortBy aquacultureSeabirdBreedingSites, (row) -> parseInt(row.Count)
        aquacultureSeabirdBreedingSites.reverse()
      catch error
        hasAquacultureSeabirdBreedingSites = false
      try
        aquacultureShorebirdSites = @recordSet('ProtectedAndThreatenedSpecies', 'ShorebirdPoints',AQUACULTURE_ID).toArray()
        aquacultureShorebirdSites = _.sortBy aquacultureShorebirdSites, (row) -> parseInt(row.Count)
        hasAquacultureShorebirdSites = aquacultureShorebirdSites?.length > 0
        aquacultureShorebirdSites.reverse()
      catch error
        hasAquacultureShorebirdSites = false

      try
        aquacultureEcosystemProductivity = @recordSet('EcosystemServices', 'EcosystemProductivity', AQUACULTURE_ID).toArray()
        aquacultureNutrientRecycling = @recordSet('EcosystemServices', 'NutrientRecycling',AQUACULTURE_ID).toArray()
        aquacultureBiogenicHabitat = @recordSet('EcosystemServices', 'BiogenicHabitat',AQUACULTURE_ID).toArray()
        #only for aquaculture
        proximityToProtectedAreas = @recordSet('ProximityToExistingProtectedAreas', 'ProximityToExistingProtectedAreas').toArray()
        isCloseToProtectedAreas = proximityToProtectedAreas?.length > 0
      catch error
        isCloseToProtectedAreas = false
      try
        aquacultureHabitats = @recordSet('HabitatComprehensiveness', 'AquacultureHabitatComprehensiveness').toArray()
        aquacultureHabitats = _.sortBy aquacultureHabitats, (row) -> row.HAB_TYPE
        habitatsInAquacultureZones = aquacultureHabitats?.length
        hasAquacultureHabitats = aquacultureHabitats?.length  > 0
      catch e
        hasAquacultureHabitats = false

    ecosystemServices = ['Ecosystem Productivity', 'Nutrient Recycling', 'Biogenic Habitat Formation']

    if window.d3
      d3IsPresent = true
    else
      d3IsPresent = false
    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      hasAquacultureClasses: hasAquacultureClasses
      hasProtectionClasses: hasProtectionClasses

      #protection only      
      habitatsCount: 47
      biogenicHabitatsCount: 9

      hasReserveData: hasReserveData
      habitatsInReserves: habitatsInReserves
      habitatsInReservesCount: habitatsInReservesCount
      hasTypeTwoData: hasTypeTwoData
      habitatsInTypeTwoCount: habitatsInTypeTwoCount
      habitatsInTypeTwos: habitatsInTypeTwos
      representationData:representationData
      hasRepresentationData:hasRepresentationData
      representedCount:representedCount

      #protection and aquaculture
      protectionNutrientRecycling: protectionNutrientRecycling
      protectionBiogenicHabitat: protectionBiogenicHabitat
      protectionEcosystemProductivity: protectionEcosystemProductivity
      protectionEcosystemServices:ecosystemServices

      protectionSensitiveAreas: protectionSensitiveAreas 
      hasProtectionSensitiveAreas: hasProtectionSensitiveAreas
      protectionProtectedMammals:protectionProtectedMammals
      hasProtectionProtectedMammals:hasProtectionProtectedMammals
      protectionSeabirdBreedingSites:protectionSeabirdBreedingSites
      hasProtectionSeabirdBreedingSites:hasProtectionSeabirdBreedingSites
      protectionShorebirdSites:protectionShorebirdSites
      hasProtectionShorebirdSites:hasProtectionShorebirdSites

      aquacultureNutrientRecycling: aquacultureNutrientRecycling
      aquacultureBiogenicHabitat: aquacultureBiogenicHabitat
      aquacultureEcosystemProductivity: aquacultureEcosystemProductivity
      aquacultureEcosystemServices: ecosystemServices
      
      aquacultureSensitiveAreas: aquacultureSensitiveAreas 
      hasAquacultureSensitiveAreas: hasAquacultureSensitiveAreas
      aquacultureProtectedMammals:aquacultureProtectedMammals
      hasAquacultureProtectedMammals:hasAquacultureProtectedMammals
      aquacultureSeabirdBreedingSites:aquacultureSeabirdBreedingSites
      hasAquacultureSeabirdBreedingSites:hasAquacultureSeabirdBreedingSites
      aquacultureShorebirdSites:aquacultureShorebirdSites
      hasAquacultureShorebirdSites:hasAquacultureShorebirdSites

      aquacultureHabitats: aquacultureHabitats
      hasAquacultureHabitats: hasAquacultureHabitats
      habitatsInAquacultureZones: habitatsInAquacultureZones

      #aquaculture only
      proximityToProtectedAreas: proximityToProtectedAreas
      isCloseToProtectedAreas: isCloseToProtectedAreas

      hasBiogenicReserveData: hasBiogenicReserveData
      biogenicHabitatsInReserves: biogenicHabitatsInReserves
      biogenicHabitatsInReservesCount: biogenicHabitatsInReservesCount

      hasBiogenicTypeTwoData: hasBiogenicTypeTwoData
      biogenicHabitatsInTypeTwoCount: biogenicHabitatsInTypeTwoCount
      biogenicHabitatsInTypeTwos: biogenicHabitatsInTypeTwos

      #IE8/9 can't do d3 stuff
      d3IsPresent: d3IsPresent
      catchmentPercents: catchmentPercents
      new_ecosystem_services: new_ecosystem_services
      is_env_zone: is_env_zone

      zonation_biodiversity: zonation_biodiversity
      zonation_habitats: zonation_habitats

    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @$('.protection-chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.protection-chosen').change () =>
      _.defer @renderProtectionEcosystemServices

    @$('.aquaculture-chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.aquaculture-chosen').change () =>
      _.defer @renderAquacultureEcosystemServices

    #make sure this comes before paging, otherwise pages won't be there  
    @setupReserveHabitatSorting(habitatsInReserves)
    @setupType2HabitatSorting(habitatsInTypeTwos)
    @setupHabitatRepresentationSorting(representationData)
    #@setupSensitiveHabitatSorting(protectionSensitiveAreas, 'prot')
    #@setupSensitiveHabitatSorting(aquacultureSensitiveAreas, 'aq')
    @setupBiogenicReserveHabitatSorting(biogenicHabitatsInReserves)
    @setupBiogenicType2HabitatSorting(biogenicHabitatsInTypeTwos)
    @setupAquacultureHabitatSorting(aquacultureHabitats)
    @enableTablePaging()

  parseZonation: (data) =>
    parsed_data = [ 
                    {"label":"0 - 50% (Low)", "MPA1":"--", "MPA2":"--"},
                    {"label":"50 - 70%", "MPA1":"--", "MPA2":"--"},
                    {"label":"70 - 80%", "MPA1":"--", "MPA2":"--"},
                    {"label":"80 - 90%", "MPA1":"--", "MPA2":"--"},
                    {"label":"90 - 100% (High)", "MPA1":"--", "MPA2":"--"}
                  ]

    for d in data
      
      if d.MPA_TYPE == "MPA1"
        parsed_data[parseInt(d.Level)-1].MPA1 = parseFloat(d.Percent).toFixed(1)
      else if d.MPA_TYPE == "MPA2"
        parsed_data[parseInt(d.Level)-1].MPA2 = parseFloat(d.Percent).toFixed(1)
      else
        console.log("skipping type 3")
    return parsed_data


  setupBiogenicReserveHabitatSorting: (habitats) =>
    tbodyName = '.reserve_biogenic_values'
    tableName = '.reserve_biogenic_hab_table'
    @$('.hab_reserve_biogenic_type').click (event) =>
      @renderSort('hab_reserve_biogenic_type', tableName, habitats, event, "HAB_TYPE", tbodyName, false, @getBiogenicHabitatRowString)
    @$('.hab_reserve_biogenic_new_area').click (event) =>
      @renderSort('hab_reserve_biogenic_new_area',  tableName, habitats, event, "NEW_SIZE", tbodyName, true, @getBiogenicHabitatRowString)
    @$('.hab_reserve_biogenic_new_perc').click (event) =>
      @renderSort('hab_reserve_biogenic_new_perc',  tableName, habitats, event, "NEW_PERC", tbodyName, true, @getBiogenicHabitatRowString)

    @renderSort('hab_reserve_biogenic_type', tableName, habitats, undefined, "HAB_TYPE", tbodyName, false, @getBiogenicHabitatRowString)

  setupBiogenicType2HabitatSorting: (habitats) =>
    tbodyName = '.type2_biogenic_values'
    tableName = '.type2_ biogenic_hab_table'

    @$('.hab_type2_biogenic_type').click (event) =>
      @renderSort('hab_tyep2_biogenic_type', tableName, habitats, event, "HAB_TYPE", tbodyName, false, @getBiogenicHabitatRowString)
    @$('.hab_type2_biogenic_new_area').click (event) =>
      @renderSort('hab_type2_biogenic_new_area',  tableName, habitats, event, "NEW_SIZE", tbodyName, true, @getBiogenicHabitatRowString)
    @$('.hab_type2_biogenic_new_perc').click (event) =>
      @renderSort('hab_type2_biogenic_new_perc',  tableName, habitats, event, "NEW_PERC", tbodyName, true, @getBiogenicHabitatRowString)

    @renderSort('hab_type2_biogenic_type', tableName, habitats, undefined, "HAB_TYPE", tbodyName, false, @getBiogenicHabitatRowString)



  renderProtectionEcosystemServices: () =>
    name = @$('.protection-chosen').val()
    @$('.default-chosen-selection-protection').hide()
    if name == "Ecosystem Productivity"
      @$('.protection-ecosystem-productivity').show()
      @$('.protection-nutrient-recycling').hide()
      @$('.protection-biogenic-habitat').hide()
    else if name == "Nutrient Recycling"
      @$('.protection-ecosystem-productivity').hide()
      @$('.protection-nutrient-recycling').show()
      @$('.protection-biogenic-habitat').hide()
    else
      @$('.protection-ecosystem-productivity').hide()
      @$('.protection-nutrient-recycling').hide()
      @$('.protection-biogenic-habitat').show()

  renderAquacultureEcosystemServices: () =>
    name = @$('.aquaculture-chosen').val()
    @$('.default-chosen-selection-aquaculture').hide()
    if name == "Ecosystem Productivity"
      @$('.aquaculture-ecosystem-productivity').show()
      @$('.aquaculture-nutrient-recycling').hide()
      @$('.aquaculture-biogenic-habitat').hide()
    else if name == "Nutrient Recycling"
      @$('.aquaculture-ecosystem-productivity').hide()
      @$('.aquaculture-nutrient-recycling').show()
      @$('.aquaculture-biogenic-habitat').hide()
    else
      @$('.aquaculture-ecosystem-productivity').hide()
      @$('.aquaculture-nutrient-recycling').hide()
      @$('.aquaculture-biogenic-habitat').show()

  setupAquacultureHabitatSorting: (pdata) =>
    tbodyName = '.aquaculture_values'
    tableName = '.aquaculture_hab_table'
    habitatFunction = @getAquacultureHabitatRowString
    @$('.hab_aquaculture_type').click (event) =>
      @renderSort('hab_aquaculture_type', tableName, pdata, event, "HAB_TYPE", tbodyName, false, habitatFunction)

    @$('.hab_aquaculture_new').click (event) =>
      @renderSort('hab_aquaculture_new',tableName, pdata, event, "NEW_SIZE", tbodyName, true, habitatFunction)
    @$('.hab_aquaculture_new_perc').click (event) =>
      @renderSort('hab_aquaculture_new_perc', tableName, pdata, event, "NEW_PERC", tbodyName, true, habitatFunction)

    @renderSort('hab_type2_type', tableName, pdata, undefined, "HAB_TYPE", tbodyName, false, habitatFunction)
    
  setupSensitiveHabitatSorting: (sensitiveAreas, typeString) =>
    #example, based on typeString, the protection tables will be hab_sensitive_prot_name, aquaculture will be hab_sensitive_aq_name
    tbodyName = '.hab_sensitive_'+typeString+'_values'
    tableName = '.hab_sensitive_'+typeString+'_table'
    @$('.hab_sensitive_name').click (event) =>
      @renderSort('hab_sensitive_'+typeString+'_name', tableName, sensitiveAreas, event, "SA_NAME", tbodyName, false, @getSensitiveAreaString)
    @$('.hab_sensitive_type').click (event) =>
      @renderSort('hab_sensitive_'+typeString+'_type', tableName, sensitiveAreas, event, "SA_TYPE", tbodyName, false, @getSensitiveAreaString)
    @$('.hab_sensitive_ha').click (event) =>
      @renderSort('hab_sensitive_'+typeString+'_ha',tableName, sensitiveAreas, event, "CLPD_AREA", tbodyName, true, @getSensitiveAreaString)
    @$('.hab_sensitive_perc').click (event) =>
      @renderSort('hab_sensitive_'+typeString+'_perc', tableName, sensitiveAreas, event, "PERC_AREA", tbodyName, true, @getSensitiveAreaString)

    @renderSort('hab_sensitive_'+typeString+'_name', tableName, sensitiveAreas, undefined, "SA_NAME", tbodyName, false, @getSensitiveAreaString)

  setupHabitatRepresentationSorting: (representationData) =>
    tbodyName = '.hab_rep_values'
    tableName = '.hab_rep_table'
    @$('.hab_rep_type').click (event) =>
      @renderSort('hab_rep_type', tableName, representationData, event, "HAB_TYPE", tbodyName, false, @getHabitatRepString)
    @$('.hab_rep_perc').click (event) =>
      @renderSort('hab_rep_perc', tableName, representationData, event, "CB_PERC", tbodyName, true, @getHabitatRepString)
    @$('.hab_rep_num_reserves').click (event) =>
      @renderSort('hab_rep_num_reserves',tableName, representationData, event, "REP_COUNT", tbodyName, true, @getHabitatRepString)
    @$('.hab_rep_num_type2').click (event) =>
      @renderSort('hab_rep_num_type2', tableName, representationData, event, "NEW_SIZE", tbodyName, true, @getHabitatRepString)

    @renderSort('hab_rep_type', tableName, representationData, undefined, "HAB_TYPE", tbodyName, false, @getHabitatRepString)

  setupReserveHabitatSorting: (habitatsInReserves) =>
    tbodyName = '.reserve_values'
    tableName = '.reserve_hab_table'

    @$('.hab_reserve_new').click (event) =>
      @renderSort('hab_reserve_new', tableName, habitatsInReserves, event, "NEW_PERC", tbodyName, true, @getHabitatRowString)
    @$('.hab_reserve_existing').click (event) =>
      @renderSort('hab_reserve_existing',tableName, habitatsInReserves, event, "EX_PERC", tbodyName, true, @getHabitatRowString)
    @$('.hab_reserve_type').click (event) =>
      @renderSort('hab_reserve_type', tableName, habitatsInReserves, event, "HAB_TYPE", tbodyName, false, @getHabitatRowString)
    @$('.hab_reserve_total').click (event) =>
      @renderSort('hab_reserve_total', tableName, habitatsInReserves, event, "CB_PERC", tbodyName, true, @getHabitatRowString)

    @renderSort('hab_reserve_type', tableName, habitatsInReserves, undefined, "HAB_TYPE", tbodyName, false, @getHabitatRowString)

  setupType2HabitatSorting: (type2Habitats) =>
    tbodyName = '.type2_values'
    tableName = '.type2_hab_table'
    @$('.hab_type2_existing').click (event) =>
      @renderSort('hab_type2_existing',tableName, type2Habitats, event, "EX_PERC", tbodyName, true, @getHabitatRowString)
    @$('.hab_type2_new').click (event) =>
      @renderSort('hab_type2_new',  tableName, type2Habitats, event, "NEW_PERC", tbodyName, true, @getHabitatRowString)


    @$('.hab_type2_type').click (event) =>
      @renderSort('hab_type2_type', tableName, type2Habitats, event, "HAB_TYPE", tbodyName, false, @getHabitatRowString)
    @$('.hab_type2_total').click (event) =>
      @renderSort('hab_type2_total', tableName, type2Habitats, event, "CB_PERC", tbodyName, true, @getHabitatRowString)

    @renderSort('hab_type2_type', tableName, type2Habitats, undefined, "HAB_TYPE", tbodyName, false, @getHabitatRowString)


  #do the sorting - should be table independent
  renderSort: (name, tableName, pdata, event, sortBy, tbodyName, isFloat, getRowStringValue) =>
    if event
      event.preventDefault()

    targetColumn = @getSelectedColumn(event, name)
    sortUp = @getSortDir(targetColumn)

    if isFloat
      data = _.sortBy pdata, (row) ->  parseFloat(row[sortBy])
    else
      data = _.sortBy pdata, (row) -> row[sortBy]

    #flip sorting if needed
    if sortUp
      data.reverse()

    el = @$(tbodyName)[0]
    hab_body = d3.select(el)
    #remove old rows
    hab_body.selectAll("tr.hab_rows")
      .remove()
    #add new rows (and data)
    #.html((d) -> getRowStringValue(d))
    
    rows = hab_body.selectAll("tr")
      .data(data)
    .enter().insert("tr", ":first-child")
    .attr("class", "hab_rows")
    
    columns = getRowStringValue()
    cells = rows.selectAll("td")
        .data((row, i) ->columns.map (column) -> (column: column, value: row[column]))
      .enter()
      .append("td").text((d, i) -> 
        d.value
      )    

    @setNewSortDir(targetColumn, sortUp)

    @setSortingColor(event, tableName)
    #fire the event for the active page if pagination is present
    @firePagination(tableName)
    if event
      event.stopPropagation()
      
  #table row for habitat representation
  getAquacultureHabitatRowString: (d) =>
    return ["HAB_TYPE", "NEW_SIZE", "NEW_PERC"]

  #table row for habitat representation
  getSensitiveAreaString: (d) =>
    return ["SA_NAME", "SA_TYPE", "CLPD_AREA", "PERC_AREA"]

  getHabitatRepString: (d) =>
    return ["HAB_TYPE", "CB_PERC", "REP_COUNT", "NEW_SIZE"]

  #table row for habitat representation
  getHabitatRowString: (d) =>
    return ["HAB_TYPE", "EX_PERC", "NEW_PERC", "CB_PERC"]

  #table row for habitat representation
  getBiogenicHabitatRowString: (d) =>
    return ["HAB_TYPE", "NEW_SIZE", "NEW_PERC"]
  setSortingColor: (event, tableName) =>
    sortingClass = "sorting_col"
    if event
      parent = $(event.currentTarget).parent()
      newTargetName = event.currentTarget.className
      targetStr = tableName+" th.sorting_col a"  
      if @$(targetStr) and @$(targetStr)[0] 
        oldTargetName = @$(targetStr)[0].className
        
        if newTargetName != oldTargetName
          #remove it from old 
          headerName = tableName+" th.sorting_col"
          @$(headerName).removeClass(sortingClass)
          #and add it to new
          parent.addClass(sortingClass)
     
  getSortDir: (targetColumn) =>
     sortup = @$('.'+targetColumn).hasClass("sort_up")
     return sortup

  getSelectedColumn: (event, name) =>
    if event
      #get sort order
      targetColumn = event.currentTarget.className
      multiClasses = targetColumn.split(' ')
      #protectedMammals = _.sortBy protectedMammals, (row) -> parseInt(row.Count)
      habClassName =_.find multiClasses, (classname) -> 
        classname.lastIndexOf('hab',0) == 0
      targetColumn = habClassName
    else
      #when there is no event, first time table is filled
      targetColumn = name

    return targetColumn

  setNewSortDir: (targetColumn, sortUp) =>
    #and switch it
    if sortUp
      @$('.'+targetColumn).removeClass('sort_up')
      @$('.'+targetColumn).addClass('sort_down')
    else
      @$('.'+targetColumn).addClass('sort_up')
      @$('.'+targetColumn).removeClass('sort_down')

  firePagination: (tableName) =>
    el = @$(tableName)[0]
    hab_table = d3.select(el)
    active_page = hab_table.selectAll(".active a")
    if active_page and active_page[0] and active_page[0][0]
      if active_page[0][0]
        active_page[0][0].click()


module.exports = ArrayEnvironmentTab