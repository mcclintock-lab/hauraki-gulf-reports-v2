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
    'OverlapWithAquaculture'
    'OverlapWithExistingUses'
    'OverlapWithMooringsAndAnchorages'
    'OverlapWithRecreationalUses'
  ]



  render: () ->
    isCollection = @model.isCollection()

    protectionAquaculture = @recordSet('OverlapWithAquaculture', 'OverlapWithAquaculture').toArray()
    hasProtectionAquaculture = protectionAquaculture?.length > 0

    protectionExistingUses = @recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses').toArray()
    hasProtectionExistingUseConflicts = protectionExistingUses?.length > 0

    protectionOverlapWithMooringsAndAnchorages = @recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages').bool('OVERLAPS')
    hasProtectionOverlapWithMooringsAndAnchorages = protectionOverlapWithMooringsAndAnchorages?.length > 0

    protectionRecreationalUses = @recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses').toArray()
    hasProtectionRecreationalUseConflicts = protectionRecreationalUses?.length > 0

    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user

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


module.exports = ActivitiesTab