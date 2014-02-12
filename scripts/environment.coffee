ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class EnvironmentTab extends ReportTab
  name: 'Environment'
  className: 'environment'
  timeout: 120000
  template: templates.habitat
  dependencies: ['HabitatComprehensiveness', 'NearTerrestrialProtected', 'EcosystemServices', 'SensitiveAreas', 'ProtectedAndThreatenedSpecies']

  render: () ->
    isCollection = @model.isCollection()
    habitats = @recordSet('HabitatComprehensiveness', 'HabitatComprehensiveness').toArray()
    ecosystem_productivity = @recordSet('EcosystemServices', 'EcosystemProductivity').toArray()
    nutrient_recycling = @recordSet('EcosystemServices', 'NutrientRecycling').toArray()
    biogenic_habitat = @recordSet('EcosystemServices', 'BiogenicHabitat').toArray()
    sensitiveAreas = @recordSet('SensitiveAreas', 'SensitiveAreas').toArray()

    near_terrestrial_protected = @recordSet('NearTerrestrialProtected', 'NearTerrestrialProtected').bool('Adjacent')
    sensitiveAreas = _.sortBy sensitiveAreas, (row) -> parseFloat(row.PERC_AREA)
    sensitiveAreas.reverse()
    
    habitatsInReserves = _.filter habitats, (row) ->
      row.MPA_TYPE is 'MPA1' 
    habitatsInTypeTwos = _.filter habitats, (row) ->
      row.MPA_TYPE is 'MPA2' 
    representationData = _.filter habitats, (row) ->
      row.MPA_TYPE is 'ALL_TYPES' 

    representationData = _.sortBy representationData, (row) -> parseFloat(row.CB_PERC)
    representationData.reverse()

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
    else
      habitatsInTypeTwoCount = 0

    hasReserveData = habitatsInReserves?.length > 0
    if hasReserveData
      habitatsInReservesCount = habitatsInReserves?.length
    else
      habitatsInReservesCount = 0
    
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



    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()

module.exports = EnvironmentTab