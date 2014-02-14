ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

MIN_SIZE = 10000

class ActivitiesTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Activities'
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

    protectionHeritageUses = @recordSet('OverlapWithHeritageUses', 'OverlapWithHeritageUses').toArray()
    hasProtectionHeritageUses = protectionHeritageUses?.length > 0

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
      protectionHeritageUses: protectionHeritageUses
      hasProtectionHeritageUses: hasProtectionHeritageUses

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()


module.exports = ActivitiesTab