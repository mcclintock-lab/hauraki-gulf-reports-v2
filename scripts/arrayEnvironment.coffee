ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'
for key, value of ids
  window[key] = value

class ArrayEnvironmentTab extends ReportTab
  name: 'Environment'
  className: 'arrayEnvironment'
  timeout: 120000
  template: templates.arrayHabitat
  dependencies: ['HabitatComprehensiveness', 'NearTerrestrialProtected', 'EcosystemServices', 'SensitiveAreas', 'ProtectedAndThreatenedSpecies', 'ProximityToExistingProtectedAreas',]


  render: () ->
    isCollection = @model.isCollection()
    try
      #if its all aquaculture, this will be empty
      habitats = @recordSet('HabitatComprehensiveness', 'HabitatComprehensiveness', AQUACULTURE_ID).toArray()
      habitatsInReserves = _.filter habitats, (row) -> row.MPA_TYPE is 'MPA1' 
      hasReserveData = habitatsInReserves?.length > 0
      habitatsInReservesCount = habitatsInReserves?.length

      habitatsInTypeTwos = _.filter habitats, (row) -> row.MPA_TYPE is 'MPA2' 
      habitatsInTypeTwoCount = habitatsInTypeTwos?.length

      representationData = _.filter habitats, (row) -> row.MPA_TYPE is 'ALL_TYPES' 
      hasRepresentationData = representationData?.length > 0
      representedCount = representationData?.length
      representationData = _.sortBy representationData, (row) -> parseFloat(row.CB_PERC)
      representationData.reverse()

      hasTypeTwoData = habitatsInTypeTwos.length > 0
    catch error
      hasTypeTwoData = false
      hasReserveData = false
      hasRepresentationData = false

    ecosystem_productivity = @recordSet('EcosystemServices', 'EcosystemProductivity').toArray()
    nutrient_recycling = @recordSet('EcosystemServices', 'NutrientRecycling').toArray()
    biogenic_habitat = @recordSet('EcosystemServices', 'BiogenicHabitat').toArray()
    sensitiveAreas = @recordSet('SensitiveAreas', 'SensitiveAreas').toArray()

    near_terrestrial_protected = @recordSet('NearTerrestrialProtected', 'NearTerrestrialProtected').bool('Adjacent')

    sensitiveAreas = _.sortBy sensitiveAreas, (row) -> parseFloat(row.PERC_AREA)
    hasSensitiveAreas = sensitiveAreas?.length > 0
    sensitiveAreas.reverse()

    protectedMammals = @recordSet('ProtectedAndThreatenedSpecies', 'Mammals').toArray()
    hasProtectedMammals = protectedMammals?.length > 0
    protectedMammals = _.sortBy protectedMammals, (row) -> parseInt(row.Count)
    protectedMammals.reverse()

    seabirdBreedingSites = @recordSet('ProtectedAndThreatenedSpecies', 'SeabirdBreedingSites').toArray()
    hasSeabirdBreedingSites = seabirdBreedingSites?.length > 0
    seabirdBreedingSites = _.sortBy seabirdBreedingSites, (row) -> parseInt(row.Count)
    seabirdBreedingSites.reverse()

    shorebirdSites = @recordSet('ProtectedAndThreatenedSpecies', 'ShorebirdPoints').toArray()
    shorebirdSites = _.sortBy shorebirdSites, (row) -> parseInt(row.Count)
    hasShorebirdSites = shorebirdSites?.length > 0
    shorebirdSites.reverse()

    #aquaculture only reports
    try
      proximityToProtectedAreas = @recordSet('ProximityToExistingProtectedAreas', 'ProximityToExistingProtectedAreas').toArray()
      isCloseToProtectedAreas = proximityToProtectedAreas?.length > 0
    catch error
      isCloseToProtectedAreas = false

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
      hasRepresentationData:hasRepresentationData
      representedCount:representedCount

      adjacentProtectedAreas: near_terrestrial_protected 

      nutrientRecycling: nutrient_recycling
      biogenicHabitat: biogenic_habitat
      ecosystemProductivity: ecosystem_productivity

      sensitiveAreas: sensitiveAreas 
      hasSensitiveAreas: hasSensitiveAreas


      protectedMammals:protectedMammals
      hasProtectedMammals:hasProtectedMammals

      seabirdBreedingSites:seabirdBreedingSites
      hasSeabirdBreedingSites:hasSeabirdBreedingSites

      shorebirdSites:shorebirdSites
      hasShorebirdSites:hasShorebirdSites

      proximityToProtectedAreas: proximityToProtectedAreas
      isCloseToProtectedAreas: isCloseToProtectedAreas


    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()

module.exports = ArrayEnvironmentTab