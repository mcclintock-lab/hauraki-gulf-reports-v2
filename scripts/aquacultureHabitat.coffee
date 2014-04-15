ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class AquacultureHabitatTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Environment'
  className: 'aquacultureHabitat'
  timeout: 120000
  template: templates.aquacultureHabitat
  dependencies: [
    'ProximityToExistingProtectedAreas',
    'EcosystemServices', 
    'ProtectedAndThreatenedSpecies',
    'HabitatComprehensiveness'

  ]

  render: () ->
    # The @recordSet method contains some useful means to get data out of 
    # the monsterous RecordSet json. Checkout the seasketch-reporting-template
    # documentation for more info.
    
    ecosystem_productivity = @recordSet('EcosystemServices', 'EcosystemProductivity').toArray()
    nutrient_recycling = @recordSet('EcosystemServices', 'NutrientRecycling').toArray()
    biogenic_habitat = @recordSet('EcosystemServices', 'BiogenicHabitat').toArray()
    ecosystemServices = ['Ecosystem Productivity', 'Nutrient Recycling', 'Biogenic Habitat Formation']


    protectedMammals = @recordSet('ProtectedAndThreatenedSpecies', 'Mammals').toArray()
    protectedMammals = _.sortBy protectedMammals, (row) -> parseInt(row.Count)
    protectedMammals.reverse()

    seabirdBreedingSites = @recordSet('ProtectedAndThreatenedSpecies', 'SeabirdBreedingSites').toArray()
    seabirdBreedingSites = _.sortBy seabirdBreedingSites, (row) -> parseInt(row.Count)
    seabirdBreedingSites.reverse()

    shorebirdSites = @recordSet('ProtectedAndThreatenedSpecies', 'ShorebirdPoints').toArray()
    shorebirdSites = _.sortBy shorebirdSites, (row) -> parseInt(row.Count)
    shorebirdSites.reverse()
    proximityToProtectedAreas = @recordSet('ProximityToExistingProtectedAreas', 'ProximityToExistingProtectedAreas').toArray()

    try
      aquacultureHabitats = @recordSet('HabitatComprehensiveness', 'AquacultureHabitatComprehensiveness').toArray()
      aquacultureHabitats = _.sortBy aquacultureHabitats, (row) -> row.HAB_TYPE
      habitatsInAquacultureZones = aquacultureHabitats?.length
      hasAquacultureHabitats = aquacultureHabitats?.length  > 0
    catch e
      hasAquacultureHabitats = false

    isCollection = @model.isCollection()
    if isCollection
      children = @model.getChildren()

    if window.d3
      d3IsPresent = true
    else
      d3IsPresent = false
    #for now, hide these
    hasSensitiveAreas = false


    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user

      hasSensitiveAreas: hasSensitiveAreas
      proximityToProtectedAreas: proximityToProtectedAreas
      isCloseToProtectedAreas: proximityToProtectedAreas?.length > 0

      aquacultureNutrientRecycling: nutrient_recycling
      aquacultureBiogenicHabitat: biogenic_habitat
      aquacultureEcosystemProductivity: ecosystem_productivity

      protectedMammals:protectedMammals
      hasProtectedMammals:protectedMammals?.length > 0

      seabirdBreedingSites:seabirdBreedingSites
      hasSeabirdBreedingSites:seabirdBreedingSites?.length > 0

      shorebirdSites:shorebirdSites
      hasShorebirdSites:shorebirdSites?.length > 0
      aquacultureEcosystemServices: ecosystemServices
      aquacultureHabitats: aquacultureHabitats
      hasAquacultureHabitats: hasAquacultureHabitats
      habitatsInAquacultureZones: habitatsInAquacultureZones
      habitatsCount: 62
      d3IsPresent: d3IsPresent

    # @template is /templates/overview.mustache
    @$el.html @template.render(context, partials)

    @enableLayerTogglers()
    @$('.aquaculture-chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.aquaculture-chosen').change () =>
      _.defer @renderAquacultureEcosystemServices
    @setupAquacultureHabitatSorting(aquacultureHabitats)
    @enableTablePaging()

  renderAquacultureEcosystemServices: () =>
    name = @$('.aquaculture-chosen').val()
    @$('.default-chosen-selection').hide()
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

    """
    @$('.hab_aquaculture_existing').click (event) =>
      @renderSort('hab_aquaculture_existing',  tableName, pdata, event, "EX_SIZE", tbodyName, true, habitatFunction)
    @$('.hab_aquaculture_existing_perc').click (event) =>
      @renderSort('hab_aquaculture_existing_perc',  tableName, pdata, event, "EX_PERC", tbodyName, true, habitatFunction)      
    """
    @$('.hab_aquaculture_new').click (event) =>
      @renderSort('hab_aquaculture_new',tableName, pdata, event, "NEW_SIZE", tbodyName, true, habitatFunction)
    @$('.hab_aquaculture_new_perc').click (event) =>
      @renderSort('hab_aquaculture_new_perc', tableName, pdata, event, "NEW_PERC", tbodyName, true, habitatFunction)

    @renderSort('hab_type2_type', tableName, pdata, undefined, "HAB_TYPE", tbodyName, false, habitatFunction)

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
  getAquacultureHabitatRowString: (d) =>
    return "<td>"+d.HAB_TYPE+"</td>"+"<td>"+d.NEW_SIZE+"</td>"+"<td>"+d.NEW_PERC+"</td>"

  setSortingColor: (event, tableName) =>
    sortingClass = "sorting_col"
    if event
      parent = $(event.currentTarget).parent()
      newTargetName = event.currentTarget.className
      targetStr = tableName+" th.sorting_col a"   
      console.log("!!!!!!!!!!!!!!target str: ", targetStr)
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
    console.log("target column is ", targetColumn)
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

module.exports = AquacultureHabitatTab