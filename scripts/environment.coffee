ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class EnvironmentTab extends ReportTab
  name: 'Environment'
  className: 'environment'
  timeout: 120000
  template: templates.habitat
  dependencies: ['HabitatComprehensiveness', 'NearTerrestrialProtected', 'EcosystemServices', 'SensitiveAreas']
  # Will likely be extended in the future to something like this:
  # dependencies: [
  #   'Habitat'
  #   'Representation'
  #   'AdjacentProtectedAreas'
  # ]

  render: () ->
    isCollection = @model.isCollection()
    habitats = @recordSet('HabitatComprehensiveness', 'HabitatComprehensiveness').toArray()
    ecosystem_productivity = @recordSet('EcosystemServices', 'EcosystemProductivity').toArray()
    nutrient_recycling = @recordSet('EcosystemServices', 'NutrientRecycling').toArray()
    biogenic_habitat = @recordSet('EcosystemServices', 'BiogenicHabitat').toArray()
    near_terrestrial_protected = @recordSet('NearTerrestrialProtected', 'NearTerrestrialProtected').bool('Adjacent')

    sensitiveAreas = @recordSet('SensitiveAreas', 'SensitiveAreas').toArray()
    sensitiveAreas = _.sortBy sensitiveAreas, (row) -> parseFloat(row.PERC_AREA)
    sensitiveAreas.reverse()
    
    habitatsInReserves = _.filter habitats, (row) ->
      row.MPA_TYPE is 'MPA1' 
    habitatsInReserves = _.sortBy habitatsInReserves, (row) -> parseFloat(row.NEW_PERC)
    habitatsInReserves.reverse()

    habitatsInTypeTwos = _.filter habitats, (row) ->
      row.MPA_TYPE is 'MPA2' 
    habitatsInTypeTwos = _.sortBy habitatsInTypeTwos, (row) -> parseFloat(row.NEW_PERC)
    habitatsInTypeTwos.reverse()

    representationData = _.filter habitats, (row) ->
      row.MPA_TYPE is 'ALL_TYPES' 
    representationData = _.sortBy representationData, (row) -> parseFloat(row.NEW_PERC)
    representationData.reverse()

    # The preceeding is of course, the wrong way to do this. I have no idea
    # how Dan intends to represent the habitat numbers for each of these. 
    # Lets say there is an attribute for each feature in the set that is
    # MPA_TYPE (so there are two rows per habitat). This is how I would split
    # the data up in that case:
    #   
    #   habitats = @recordSet('Habitat', 'Habitats')
    #   habitatsInReserves = _.filter habitats, (row) ->
    #     row.MPA_TYPE is 'MPA1' 
    #   habitatsInTypeTwos = _.filter habitats, (row) ->
    #     row.MPA_TYPE is 'MPA2' 
    # 
    # If instead the data is instead split into multiple featuresets (with 
    # the same paramName), then it gets more complicated. You'd need to access
    # the response data via @recordSet('Habitat', 'Habitats').value and pick
    # out the appropriate featureSets for each type. Maybe something like 
    # this:
    # 
    #   recordSet = @recordSet('Habitat', 'Habitats')
    #   console.log recordSet.value # remember to use this to debug
    #   featureSet = _.find recordSet.value, (fs) ->
    #     fs.features[0].attributes['MPA_TYPE'] is 'MPA1'
    #   habitatsInReserves = _.map featureSet.features, (f) -> f.attributes
    #   ... and repeat for Type-II MPAs
    # 
    hasTypeTwoData = habitatsInTypeTwos.length > 0

    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      #fix this to get rid of hardcoded value
      habitatsCount: 62
      hasReserveData: habitatsInReserves?.length > 0
      habitatsInReserves: habitatsInReserves
      habitatsInReservesCount: habitatsInReserves?.length
      #habitatsInReservesCount: _.filter(habitatsInReserves, (row) -> 
      #  # Need to come up with some other standard that just presence?
      #  row.CB_PERC > 0
      #).length

      hasTypeTwoData: hasTypeTwoData
      habitatsInTypeTwoCount: habitatsInTypeTwos?.length
      habitatsInTypeTwos: habitatsInTypeTwos

      #habitatsInTypeTwosCount: _.filter(habitatsInTypeTwos, (row) -> 
        # Need to come up with some other standard that just presence?
      #  row.CB_PERC > 0
      #).length
      # representationData: @recordSet('Representation', 'Representation')
      #   .toArray()
      representationData:representationData
      hasRepresentationData:representationData?.length > 0
      representedCount:representationData?.length
      #representedCount:_.filter(representationData, (row) -> 
        # Need to come up with some other standard that just presence?
      #  row.CB_PERC > 0
      #).length

      # Use something like this for representedCount when you have real data:
      # _.filter(representationData, (row) ->
      #   row.Protected is 'Yes'
      # ).length
      adjacentProtectedAreas: near_terrestrial_protected # Placeholder
      # Would need to be changed in the future to something like this:
      # adjacentProtectedAreas: @recordSet('AdjacentProtectedAreas', 
      #   'adjacent').bool('ANY_ADJACENT')

      nutrientRecycling: nutrient_recycling
      biogenicHabitat: biogenic_habitat

      ecosystemProductivity: ecosystem_productivity
      sensitiveAreas: sensitiveAreas 
      hasSensitiveAreas: sensitiveAreas?.length > 0

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()

module.exports = EnvironmentTab