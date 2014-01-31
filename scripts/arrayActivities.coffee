ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'

for key, value of ids
  window[key] = value

MIN_SIZE = 10000


class ArrayActivitiesTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Activities'
  className: 'arrayActivities'
  timeout: 120000
  template: templates.arrayActivities
  dependencies: [
    'OverlapWithAquaculture'
    'OverlapWithExistingUses'
    'OverlapWithMooringsAndAnchorages'
    'OverlapWithRecreationalUses'
  ]



  render: () ->
    aquacultureZones = @getChildren AQUACULTURE_ID
    hasAquacultureClasses = aquacultureZones?.length > 0

    protectionZones = @getChildren PROTECTION_ID
    hasProtectionClasses = protectionZones?.length > 0

    if hasAquacultureClasses
      try
        aquacultureExistingUses = @recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses', AQUACULTURE_ID).toArray()
        hasAquacultureExistingUseConflicts = aquacultureExistingUses?.length > 0
      catch error
        hasAquacultureExistingUseConflicts = false
      try
        aquacultureOverlapWithMooringsAndAnchorages = @recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages', AQUACULTURE_ID).bool('OVERLAPS')
        hasAquacultureOverlapWithMooringsAndAnchroages = aquacultureOverlapWithMooringsAndAnchorages?.length > 0
      catch error
        hasAquacultureOverlapWithMooringsAndAnchroages = false
      try
        aquacultureRecreationalUses = @recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses', AQUACULTURE_ID).toArray()
        hasAquacultureRecreationalUseConflicts = aquacultureRecreationalUses?.length > 0
      catch error
        hasAquacultureRecreationalUseConflicts = false

    if hasProtectionClasses
      try
        protectionAquaculture = @recordSet('OverlapWithAquaculture', 'OverlapWithAquaculture', PROTECTION_ID).toArray()
        hasProtectionAquaculture = protectionAquaculture?.length > 0
      catch error
        hasProtectionAquaculture = false
      try
        protectionExistingUses = @recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses', PROTECTION_ID).toArray()
        hasProtectionExistingUseConflicts = protectionExistingUses?.length > 0
      catch error
        hasProtectionExistingUseConflicts = false
      try
        protectionOverlapWithMooringsAndAnchorages = @recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages', PROTECTION_ID).bool('OVERLAPS')
        hasProtectionOverlapWithMooringsAndAnchorages = protectionOverlapWithMooringsAndAnchorages?.length > 0
      catch error
        hasProtectionOverlapWithMooringsAndAnchorages = false
      try
        protectionRecreationalUses = @recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses', PROTECTION_ID).toArray()
        hasProtectionRecreationalUseConflicts = protectionRecreationalUses?.length > 0
      catch error
        hasProtectionRecreationalUseConflicts = false
      
      

    context =
      isCollection: true
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user

      hasAquacultureClasses: hasAquacultureClasses
      aquacultureExistingUses: aquacultureExistingUses
      hasAquacultureExistingUseConflicts: hasAquacultureExistingUseConflicts
      aquacultureOverlapWithMooringsAndAnchorages: aquacultureOverlapWithMooringsAndAnchorages
      hasAquacultureOverlapWithMooringsAndAnchroages: hasAquacultureOverlapWithMooringsAndAnchroages
      aquacultureRecreationalUses: aquacultureRecreationalUses
      hasAquacultureRecreationalUseConflicts: hasAquacultureRecreationalUseConflicts

      hasProtectionClasses: hasProtectionClasses
      protectionAquaculture: protectionAquaculture
      protectionAquacultureCount: protectionAquaculture?.length
      hasProtectionAquaculture: hasProtectionAquaculture
      protectionExistingUses: protectionExistingUses
      hasProtectionExistingUseConflicts: hasProtectionExistingUseConflicts
      protectionOverlapWithMooringsAndAnchorages: protectionOverlapWithMooringsAndAnchorages
      hasProtectionOverlapWithMooringsAndAnchorages: hasProtectionOverlapWithMooringsAndAnchorages
      protectionRecreationalUses: protectionRecreationalUses
      hasProtectionRecreationalUseConflicts: hasProtectionRecreationalUseConflicts

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()


module.exports = ArrayActivitiesTab