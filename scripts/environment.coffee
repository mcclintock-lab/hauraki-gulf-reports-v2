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

    sensitiveAreas = @recordSet('SensitiveAreas', 'SensitiveAreas').toArray()

    #commented out for now
    #near_terrestrial_protected = @recordSet('NearTerrestrialProtected', 'NearTerrestrialProtected').bool('Adjacent')
    near_terrestrial_protected = false
    sensitiveAreas = _.sortBy sensitiveAreas, (row) -> parseFloat(row.PERC_AREA)
    sensitiveAreas.reverse()
    
    habitatsInReserves = _.filter habitats, (row) ->
      row.MPA_TYPE is 'MPA1' 
    habitatsInTypeTwos = _.filter habitats, (row) ->
      row.MPA_TYPE is 'MPA2' 
    representationData = _.filter habitats, (row) ->
      row.MPA_TYPE is 'ALL_TYPES' 

    representationData = _.sortBy representationData, (row) -> row.HAB_TYPE

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

  setupReserveHabitatSorting: (habitatsInReserves) =>
    tbodyName = '.reserve_values'
    tableName = '.reserve_hab_table'
    @$('.hab_reserve_new').click (event) =>
      @renderSortHabitats('hab_reserve_new', tableName, habitatsInReserves, event, "NEW_PERC", tbodyName)
    @$('.hab_reserve_existing').click (event) =>
      @renderSortHabitats('hab_reserve_existing',tableName, habitatsInReserves, event, "EX_PERC", tbodyName)
    @$('.hab_reserve_type').click (event) =>
      @renderSortHabitats('hab_reserve_type', tableName, habitatsInReserves, event, "HAB_TYPE", tbodyName)
    @$('.hab_reserve_total').click (event) =>
      @renderSortHabitats('hab_reserve_total', tableName, habitatsInReserves, event, "CB_PERC", tbodyName)

    @renderSortHabitats('hab_reserve_type', tableName, habitatsInReserves, undefined, "HAB_TYPE", tbodyName)

  setupType2HabitatSorting: (type2Habitats) =>
    tbodyName = '.type2_values'
    tableName = '.type2_hab_table'
    @$('.hab_type2_new').click (event) =>
      @renderSortHabitats('hab_type2_new',  tableName, type2Habitats, event, "NEW_PERC", tbodyName)
    @$('.hab_type2_existing').click (event) =>
      @renderSortHabitats('hab_type2_existing',tableName, type2Habitats, event, "EX_PERC", tbodyName)
    @$('.hab_type2_type').click (event) =>
      @renderSortHabitats('hab_type2_type', tableName, type2Habitats, event, "HAB_TYPE", tbodyName)
    @$('.hab_type2_total').click (event) =>
      @renderSortHabitats('hab_type2_total', tableName, type2Habitats, event, "CB_PERC", tbodyName)

    @renderSortHabitats('hab_type2_type', tableName, type2Habitats, undefined, "HAB_TYPE", tbodyName)

  renderSortHabitats: (name, tableName, pdata, event, sortBy, tbodyName) =>

    if event
      #stops the link events from triggering
      event.preventDefault()
    targetColumn = @getSelectedColumn(event, name)
    sortUp = @getSortDir(targetColumn)

    if targetColumn.search(/hab(.*)_existing/g) != -1
      data = _.sortBy pdata, (row) ->  parseFloat(row.EX_PERC)
    else if targetColumn.search(/hab_(.*)_new/g) != -1
      data = _.sortBy pdata, (row) -> parseFloat(row.NEW_PERC)
    else if targetColumn.search(/hab_(.*)_type/g) != -1
      data = _.sortBy pdata, (row) -> row.HAB_TYPE
    else if targetColumn.search(/hab_(.*)_total/g) != -1
      data = _.sortBy pdata, (row) -> parseFloat(row.CB_PERC)

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
    .html((d) -> "<td>"+d.HAB_TYPE+"</td>"+"<td>"+d.EX_PERC+"</td>"+"<td>"+d.NEW_PERC+"</td>"+"<td>"+d.CB_PERC+"</td>")
    @setNewSortDir(targetColumn, sortUp)

    @setSortingColor(event, tableName)
    #fire the event for the active page if pagination is present
    @firePagination(tableName)
    if event
      event.stopPropagation()

  setSortingColor: (event, tableName) =>
    sortingClass = "sorting_col"
    if event
      parent = $(event.currentTarget).parent()
      newTargetName = event.currentTarget.className
      targetStr = tableName+" th.sorting_col a"   
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
    if active_page[0][0]
      active_page[0][0].click()


module.exports = EnvironmentTab