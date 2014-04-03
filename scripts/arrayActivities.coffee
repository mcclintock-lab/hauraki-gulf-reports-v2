ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'

for key, value of ids
  window[key] = value

MIN_SIZE = 10000


class ArrayActivitiesTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Activities & Uses'
  className: 'arrayActivities'
  timeout: 120000
  template: templates.arrayActivities
  dependencies: [
    'OverlapWithExistingUses'
    'OverlapWithMooringsAndAnchorages'
    'OverlapWithRecreationalUses'
    'OverlapWithHeritageUses'
  ]

  render: () ->
    aquacultureZones = @getChildren AQUACULTURE_ID
    hasAquacultureClasses = aquacultureZones?.length > 0

    protectionZones = @getChildren PROTECTION_ID
    hasProtectionClasses = protectionZones?.length > 0

    if hasAquacultureClasses
      try
        aquacultureExistingUses = @recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses').toArray()
        hasAquacultureExistingUseConflicts = aquacultureExistingUses?.length > 0
        aquacultureRecreationalUses = @recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses').toArray()
        aquacultureAllExistingUses = aquacultureExistingUses.concat(aquacultureRecreationalUses)
        hasAquacultureAllExistingUses = aquacultureAllExistingUses?.length > 0
      catch error
        hasAquacultureExistingUseConflicts = false
      try
        hasAquacultureOverlapWithMooringsAndAnchorages =  @recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages').bool('OVERLAPS')
      catch error
        hasAquacultureOverlapWithMooringsAndAnchorages = false
      try
        
      catch error
        hasAquacultureRecreationalUseConflicts = false

      aquacultureNumShipwrecks = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_SHIPS')
      hasAquacultureShipwrecks = aquacultureNumShipwrecks > 0

      aquacultureNumHistoricPlaces = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_HIST')
      hasAquacultureHistoricPlaces = aquacultureNumHistoricPlaces > 0
      
      aquacultureNumArcheologicalSites = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_ARCHEO')
      hasAquacultureArcheologicalSites = aquacultureNumArcheologicalSites > 0

      hasAquacultureHeritageUses = hasAquacultureShipwrecks or hasAquacultureArcheologicalSites or hasAquacultureHistoricPlaces

    if hasProtectionClasses

      try
        protectionExistingUses = @recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses').toArray()
        hasProtectionExistingUseConflicts = protectionExistingUses?.length > 0
        protectionRecreationalUses = @recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses').toArray()
        
        protectionAllExistingUses = protectionExistingUses.concat(protectionRecreationalUses)
        hasProtectionAllExistingUses = protectionAllExistingUses?.length > 0
      catch error
        hasProtectionExistingUseConflicts = false
      try
        hasProtectionOverlapWithMooringsAndAnchorages = @recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages', PROTECTION_ID).bool('OVERLAPS')
      catch error
        hasProtectionOverlapWithMooringsAndAnchorages = false

      protectionNumShipwrecks = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_SHIPS')
      hasProtectionShipwrecks = protectionNumShipwrecks > 0

      protectionNumHistoricPlaces = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_HIST')
      hasProtectionHistoricPlaces = protectionNumHistoricPlaces > 0
      
      protectionNumArcheologicalSites = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').int('N_ARCHEO')
      hasProtectionArcheologicalSites = protectionNumArcheologicalSites > 0

      hasProtectionHeritageUses = hasProtectionShipwrecks or hasProtectionArcheologicalSites or hasProtectionHistoricPlaces

    context =
      isCollection: true
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user

      hasAquacultureClasses: hasAquacultureClasses
      aquacultureAllExistingUses: aquacultureAllExistingUses
      hasAquacultureAllExistingUses: hasAquacultureAllExistingUses

      hasAquacultureOverlapWithMooringsAndAnchorages: hasAquacultureOverlapWithMooringsAndAnchorages
      aquacultureRecreationalUses: aquacultureRecreationalUses
      hasAquacultureRecreationalUseConflicts: hasAquacultureRecreationalUseConflicts
      
      hasAquacultureHeritageUses: hasAquacultureHeritageUses
      aquacultureNumShipwrecks: aquacultureNumShipwrecks
      hasAquacultureShipwrecks: hasAquacultureShipwrecks

      aquacultureNumHistoricPlaces: aquacultureNumHistoricPlaces
      hasAquacultureHistoricPlaces: hasAquacultureHistoricPlaces

      aquacultureNumArcheologicalSites: aquacultureNumArcheologicalSites
      hasAquacultureArcheologicalSites: hasAquacultureArcheologicalSites

      hasProtectionClasses: hasProtectionClasses
      protectionAllExistingUses: protectionAllExistingUses
      hasProtectionAllExistingUses: hasProtectionAllExistingUses

      hasProtectionOverlapWithMooringsAndAnchorages: hasProtectionOverlapWithMooringsAndAnchorages
      
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


module.exports = ArrayActivitiesTab