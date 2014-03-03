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
      habitatsInTypeTwos = _.sortBy habitatsInTypeTwos, (row) -> parseFloat(row.NEW_PERC)
      habitatsInTypeTwos.reverse()
    else
      habitatsInTypeTwoCount = 0

    hasReserveData = habitatsInReserves?.length > 0
    if hasReserveData
      habitatsInReservesCount = habitatsInReserves?.length
      habitatsInReserves = _.sortBy habitatsInReserves, (row) -> parseFloat(row.NEW_PERC)
      habitatsInReserves.reverse()
    else
      habitatsInReservesCount = 0

    ecosystem_productivity = @recordSet('EcosystemServices', 'EcosystemProductivity').toArray()
    nutrient_recycling = @recordSet('EcosystemServices', 'NutrientRecycling').toArray()
    biogenic_habitat = @recordSet('EcosystemServices', 'BiogenicHabitat').toArray()
    ecosystemServices = ['Ecosystem Productivity', 'Nutrient Recycling', 'Biogenic Habitat']
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

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()
    @$('.chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.chosen').change () =>
      _.defer @renderEcosystemServices

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


module.exports = EnvironmentTab