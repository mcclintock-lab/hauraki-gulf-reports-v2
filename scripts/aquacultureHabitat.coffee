ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val


class AquacultureHabitatTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Habitat'
  className: 'aquacultureHabitat'
  timeout: 120000
  template: templates.aquacultureHabitat
  dependencies: [
    'ProximityToExistingProtectedAreas',
    'EcosystemServices', 'SensitiveAreas', 
    'ProtectedAndThreatenedSpecies'
  ]

  render: () ->
    # The @recordSet method contains some useful means to get data out of 
    # the monsterous RecordSet json. Checkout the seasketch-reporting-template
    # documentation for more info.
    
    ecosystem_productivity = @recordSet('EcosystemServices', 'EcosystemProductivity').toArray()
    nutrient_recycling = @recordSet('EcosystemServices', 'NutrientRecycling').toArray()
    biogenic_habitat = @recordSet('EcosystemServices', 'BiogenicHabitat').toArray()
    sensitiveAreas = @recordSet('SensitiveAreas', 'SensitiveAreas').toArray()

    sensitiveAreas = _.sortBy sensitiveAreas, (row) -> parseFloat(row.PERC_AREA)
    sensitiveAreas.reverse()


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

    console.log('prox', proximityToProtectedAreas)
    
    # I use this isCollection flag to customize the display. Another option
    # would be to have totally different Tab implementations for zones vs 
    # collections. I didn't do that here since they are so similar.
    isCollection = @model.isCollection()
    if isCollection
      # @model is the client-side sketch representation, which has some
      # useful, if undocumented, methods like getChildren().
      children = @model.getChildren()


      #subtidal_ff  = _.filter children, (child) -> 
      #  child.getAttribute('AQUA_TYPE') is 'subtidal_filter_feeder'

    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user


      proximityToProtectedAreas: proximityToProtectedAreas
      isCloseToProtectedAreas: proximityToProtectedAreas?.length > 0

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


    # @template is /templates/overview.mustache
    @$el.html @template.render(context, partials)


module.exports = AquacultureHabitatTab