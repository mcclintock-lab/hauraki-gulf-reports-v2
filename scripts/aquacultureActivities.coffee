ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

MIN_SIZE = 10000

class AquacultureActivitiesTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Activities & Uses'
  className: 'aquacultureActivities'
  timeout: 120000
  template: templates.aquacultureActivities
  dependencies: [
    'OverlapWithExistingUses'
    'OverlapWithMooringsAndAnchorages'
    'OverlapWithRecreationalUses'
    'OverlapWithHeritageUses'
  ]

  render: () ->
    isCollection = @model.isCollection()

    aquacultureExistingUses = @recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses').toArray()
    hasAquacultureExistingUseConflicts = aquacultureExistingUses?.length > 0
    aquacultureRecreationalUses = @recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses').toArray()
    aquacultureAllExistingUses = aquacultureExistingUses.concat(aquacultureRecreationalUses)
    hasAquacultureAllExistingUses = aquacultureAllExistingUses?.length > 0

    hasAquacultureOverlapWithMooringsAndAnchorages =  @recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages').bool('OVERLAPS')

    aquacultureNumShipwrecks = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_SHIPS')
    hasAquacultureShipwrecks = aquacultureNumShipwrecks > 0

    aquacultureNumHistoricPlaces = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_HIST')
    hasAquacultureHistoricPlaces = aquacultureNumHistoricPlaces > 0
    
    aquacultureNumArcheologicalSites = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_ARCHEO')
    hasAquacultureArcheologicalSites = aquacultureNumArcheologicalSites > 0

    hasAquacultureHeritageUses = hasAquacultureShipwrecks or hasAquacultureArcheologicalSites or hasAquacultureHistoricPlaces

    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user

      aquacultureAllExistingUses: aquacultureAllExistingUses
      hasAquacultureAllExistingUses: hasAquacultureAllExistingUses

      hasAquacultureOverlapWithMooringsAndAnchorages: hasAquacultureOverlapWithMooringsAndAnchorages


      hasAquacultureHeritageUses: hasAquacultureHeritageUses

      aquacultureNumShipwrecks: aquacultureNumShipwrecks
      hasAquacultureShipwrecks: hasAquacultureShipwrecks

      aquacultureNumHistoricPlaces: aquacultureNumHistoricPlaces
      hasAquacultureHistoricPlaces: hasAquacultureHistoricPlaces

      aquacultureNumArcheologicalSites: aquacultureNumArcheologicalSites
      hasAquacultureArcheologicalSites: hasAquacultureArcheologicalSites

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()


module.exports = AquacultureActivitiesTab