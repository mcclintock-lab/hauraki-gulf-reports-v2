ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val


class EnvironmentTab extends ReportTab
  name: 'Environment'
  className: 'environment'
  timeout: 120000
  template: templates.habitat
  dependencies: ['HabitatComprehensiveness', 'EcosystemServices', 'SensitiveAreas', 'ProtectedAndThreatenedSpecies']
  UP: "up"
  DOWN: "down"

  render: () ->
    isCollection = @model.isCollection()
    habitats = @recordSet('HabitatComprehensiveness', 'HabitatComprehensiveness').toArray()

    #sensitiveAreas = @recordSet('SensitiveAreas', 'SensitiveAreas').toArray()

    #commented out for now
    #near_terrestrial_protected = @recordSet('NearTerrestrialProtected', 'NearTerrestrialProtected').bool('Adjacent')
    near_terrestrial_protected = false
    #sensitiveAreas = _.sortBy sensitiveAreas, (row) -> parseFloat(row.PERC_AREA)
    #sensitiveAreas.reverse()
    sensitiveAreas = []
    habitatsInReserves = _.filter habitats, (row) ->
      row.MPA_TYPE is 'MPA1' 
    habitatsInTypeTwos = _.filter habitats, (row) ->
      row.MPA_TYPE is 'MPA2' 
    representationData = _.filter habitats, (row) ->
      row.MPA_TYPE is 'ALL_TYPES' 

    #representationData = _.sortBy representationData, (row) -> row.HAB_TYPE
    representationData = []
    protectedMammals = @recordSet('ProtectedAndThreatenedSpecies', 'Mammals').toArray()
    protectedMammals = _.sortBy protectedMammals, (row) -> parseInt(row.Count)
    protectedMammals.reverse()

    seabirdBreedingSites = @recordSet('ProtectedAndThreatenedSpecies', 'SeabirdBreedingSites').toArray()
    seabirdBreedingSites = _.sortBy seabirdBreedingSites, (row) -> parseInt(row.Count)
    seabirdBreedingSites.reverse()

    shorebirdSites = @recordSet('ProtectedAndThreatenedSpecies', 'ShorebirdPoints').toArray()
    shorebirdSites = _.sortBy shorebirdSites, (row) -> parseInt(row.Count)
    shorebirdSites.reverse()

    hasTypeTwoData = habitatsInTypeTwos?.length > 0
    if hasTypeTwoData
      habitatsInTypeTwoCount = habitatsInTypeTwos?.length
      habitatsInTypeTwos = _.sortBy habitatsInTypeTwos, (row) -> row.HAB_TYPE
    else
      habitatsInTypeTwoCount = 0

    hasReserveData = habitatsInReserves?.length > 0
    if hasReserveData
      habitatsInReservesCount = habitatsInReserves?.length
      habitatsInReserves = _.sortBy habitatsInReserves, (row) -> row.HAB_TYPE
    else
      habitatsInReservesCount = 0


    
    ecosystem_productivity = @recordSet('EcosystemServices', 'EcosystemProductivity').toArray()
    nutrient_recycling = @recordSet('EcosystemServices', 'NutrientRecycling').toArray()
    biogenic_habitat = @recordSet('EcosystemServices', 'BiogenicHabitat').toArray()
    ecosystemServices = ['Ecosystem Productivity', 'Nutrient Recycling', 'Biogenic Habitat']
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
      #fix this to get rid of hardcoded value
      habitatsCount: 62
      hasReserveData: hasReserveData
      habitatsInReserves: habitatsInReserves
      habitatsInReservesCount: habitatsInReservesCount

      hasTypeTwoData: hasTypeTwoData
      habitatsInTypeTwoCount: habitatsInTypeTwoCount
      habitatsInTypeTwos: habitatsInTypeTwos

      representationData:representationData
      hasRepresentationData:representationData?.length > 0
      representedCount:representationData?.length

      adjacentProtectedAreas: near_terrestrial_protected 

      nutrientRecycling: nutrient_recycling
      biogenicHabitat: biogenic_habitat

      ecosystemProductivity: ecosystem_productivity
      sensitiveAreas: sensitiveAreas 
      hasSensitiveAreas: sensitiveAreas?.length > 0


      protectedMammals:protectedMammals
      hasProtectedMammals:protectedMammals?.length > 0

      seabirdBreedingSites:seabirdBreedingSites
      hasSeabirdBreedingSites:seabirdBreedingSites?.length > 0

      shorebirdSites:shorebirdSites
      hasShorebirdSites:shorebirdSites?.length > 0

      ecosystemServices: ecosystemServices
      ecosystem_productivity: ecosystem_productivity
      nutrient_recycling: nutrient_recycling
      biogenic_habitat: biogenic_habitat
      d3IsPresent: d3IsPresent

    @$el.html @template.render(context, templates)
    @enableLayerTogglers()

    @$('.chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.chosen').change () =>
      _.defer @renderEcosystemServices
    #make sure this comes before paging, otherwise pages won't be there  
    @setupReserveHabitatSorting(habitatsInReserves)
    @setupType2HabitatSorting(habitatsInTypeTwos)
    #@setupHabitatRepresentationSorting(representationData)
    #@setupSensitiveHabitatSorting(sensitiveAreas)
    @enableTablePaging()
   

  renderEcosystemServices: () =>
    name = @$('.chosen').val()
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

  setupSensitiveHabitatSorting: (sensitiveAreas) =>
    tbodyName = '.hab_sensitive_values'
    tableName = '.hab_sensitive_table'
    @$('.hab_sensitive_name').click (event) =>
      @renderSort('hab_sensitive_name', tableName, sensitiveAreas, event, "SA_NAME", tbodyName, false, @getSensitiveAreaString)
    @$('.hab_sensitive_type').click (event) =>
      @renderSort('hab_sensitive_type', tableName, sensitiveAreas, event, "SA_TYPE", tbodyName, false, @getSensitiveAreaString)
    @$('.hab_sensitive_ha').click (event) =>
      @renderSort('hab_sensitive_ha',tableName, sensitiveAreas, event, "CLPD_AREA", tbodyName, true, @getSensitiveAreaString)
    @$('.hab_sensitive_perc').click (event) =>
      @renderSort('hab_sensitive_perc', tableName, sensitiveAreas, event, "PERC_AREA", tbodyName, true, @getSensitiveAreaString)

    @renderSort('hab_sensitive_name', tableName, sensitiveAreas, undefined, "SA_NAME", tbodyName, false, @getSensitiveAreaString)

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
    @$('.hab_type2_new').click (event) =>
      @renderSort('hab_type2_new',  tableName, type2Habitats, event, "NEW_PERC", tbodyName, true, @getHabitatRowString)
    @$('.hab_type2_existing').click (event) =>
      @renderSort('hab_type2_existing',tableName, type2Habitats, event, "EX_PERC", tbodyName, true, @getHabitatRowString)
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
    hab_body.selectAll("tbody"+tbodyName)
      .data(data)
    .enter().insert("tr", ":first-child")
    .attr("class", "hab_rows")
    .html((d) -> getRowStringValue(d))
    @setNewSortDir(targetColumn, sortUp)

    @setSortingColor(event, tableName)
    #fire the event for the active page if pagination is present
    @firePagination(tableName)
    if event
      event.stopPropagation()

  #table row for habitat representation
  getSensitiveAreaString: (d) =>
    return "<td>"+d.SA_NAME+"</td>"+"<td>"+d.SA_TYPE+"</td>"+"<td>"+d.CLPD_AREA+"</td>"+"<td>"+d.PERC_AREA+"</td>"
  #table row for habitat representation
  getHabitatRepString: (d) =>
    return "<td>"+d.HAB_TYPE+"</td>"+"<td>"+d.CB_PERC+"</td>"+"<td>"+d.REP_COUNT+"</td>"+"<td>"+d.NEW_SIZE+"</td>"

  #table row for habitat representation
  getHabitatRowString: (d) =>
    return "<td>"+d.HAB_TYPE+"</td>"+"<td>"+d.EX_PERC+"</td>"+"<td>"+d.NEW_PERC+"</td>"+"<td>"+d.CB_PERC+"</td>"

  setSortingColor: (event, tableName) =>
    sortingClass = "sorting_col"
    if event
      parent = $(event.currentTarget).parent()
      newTargetName = event.currentTarget.className
      targetStr = tableName+" th.sorting_col a"   
      if @$(targetStr)
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
      active_page[0][0].click()


module.exports = EnvironmentTab