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
    aquacultureZones = @getChildren AQUACULTURE_ID
    hasAquacultureClasses = aquacultureZones?.length > 0

    protectionZones = @getChildren PROTECTION_ID
    hasProtectionClasses = protectionZones?.length > 0
    if hasProtectionClasses
      try
        #if its all aquaculture, this will be empty
        habitats = @recordSet('HabitatComprehensiveness', 'HabitatComprehensiveness').toArray()
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

      try
        protectionEcosystemProductivity = @recordSet('EcosystemServices', 'EcosystemProductivity', PROTECTION_ID).toArray()
        protectionNutrientRecycling = @recordSet('EcosystemServices', 'NutrientRecycling', PROTECTION_ID).toArray()
        protectionBiogenicHabitat = @recordSet('EcosystemServices', 'BiogenicHabitat', PROTECTION_ID).toArray()
        protectionSensitiveAreas = @recordSet('SensitiveAreas', 'SensitiveAreas', PROTECTION_ID).toArray()
        protectionSensitiveAreas = _.sortBy protectionSensitiveAreas, (row) -> parseFloat(row.PERC_AREA)
        hasProtectionSensitiveAreas = hasProtectionSensitiveAreas?.length > 0
        protectionSensitiveAreas.reverse()
      catch error
        hasProtectionSensitiveAreas = false
      

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
      try
        aquacultureSensitiveAreas = @recordSet('SensitiveAreas', 'SensitiveAreas',AQUACULTURE_ID).toArray()
        aquacultureSensitiveAreas = _.sortBy aquacultureSensitiveAreas, (row) -> parseFloat(row.PERC_AREA)
        hasAquacultureSensitiveAreas = aquacultureSensitiveAreas?.length > 0
        aquacultureSensitiveAreas.reverse()
      catch e
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
    ecosystemServices = ['Ecosystem Productivity', 'Nutrient Recycling', 'Biogenic Habitat']
    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      hasAquacultureClasses: hasAquacultureClasses
      hasProtectionClasses: hasProtectionClasses

      #protection only      
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

      #aquaculture only
      proximityToProtectedAreas: proximityToProtectedAreas
      isCloseToProtectedAreas: isCloseToProtectedAreas


    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()
    @$('.protection-chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.protection-chosen').change () =>
      _.defer @renderProtectionEcosystemServices

    @$('.aquaculture-chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.aquaculture-chosen').change () =>
      _.defer @renderAquacultureEcosystemServices

  renderProtectionEcosystemServices: () =>
    name = @$('.protection-chosen').val()
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

module.exports = ArrayEnvironmentTab