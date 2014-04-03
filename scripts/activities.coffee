ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

MIN_SIZE = 10000

class ActivitiesTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Activities & Uses'
  className: 'activities'
  timeout: 120000
  template: templates.activities
  dependencies: [
    'OverlapWithExistingUses'
    'OverlapWithMooringsAndAnchorages'
    'OverlapWithRecreationalUses'
    'OverlapWithHeritageUses'
  ]



  render: () ->
    isCollection = @model.isCollection()


    protectionExistingUses = @recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses').toArray()
    hasProtectionExistingUseConflicts = protectionExistingUses?.length > 0

    hasProtectionOverlapWithMooringsAndAnchorages = @recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages').bool('OVERLAPS')

    protectionRecreationalUses = @recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses').toArray()
    hasProtectionRecreationalUseConflicts = protectionRecreationalUses?.length > 0

    protectionNumShipwrecks = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_SHIPS')
    hasProtectionShipwrecks = protectionNumShipwrecks > 0

    protectionNumHistoricPlaces = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_HIST')
    hasProtectionHistoricPlaces = protectionNumHistoricPlaces > 0
    
    protectionNumArcheologicalSites = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_ARCHEO')
    hasProtectionArcheologicalSites = protectionNumArcheologicalSites > 0

    hasProtectionHeritageUses = hasProtectionShipwrecks or hasProtectionArcheologicalSites or hasProtectionHistoricPlaces
    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user

      protectionExistingUses: protectionExistingUses
      hasProtectionExistingUseConflicts: hasProtectionExistingUseConflicts
      hasProtectionOverlapWithMooringsAndAnchorages: hasProtectionOverlapWithMooringsAndAnchorages
      protectionRecreationalUses: protectionRecreationalUses
      hasProtectionRecreationalUseConflicts: hasProtectionRecreationalUseConflicts

      hasProtectionHeritageUses: hasProtectionHeritageUses
      protectionNumShipwrecks: protectionNumShipwrecks
      hasProtectionShipwrecks: hasProtectionShipwrecks

      protectionNumHistoricPlaces: protectionNumHistoricPlaces
      hasProtectionHistoricPlaces: hasProtectionHistoricPlaces

      protectionNumArcheologicalSites: protectionNumArcheologicalSites
      hasProtectionArcheologicalSites: hasProtectionArcheologicalSites

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()


module.exports = ActivitiesTab