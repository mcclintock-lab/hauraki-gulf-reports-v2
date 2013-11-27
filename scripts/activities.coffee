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
    aquaculture = @recordSet('OverlapWithAquaculture', 'OverlapWithAquaculture').toArray()
    existingUses = @recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses').toArray()
    overlapWithMooringsAndAnchorages = @recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages').bool('OVERLAPS')
    recreationalUses = @recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses').toArray()
    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      aquaculture: aquaculture
      aquacultureCount: aquaculture?.length
      existingUses: existingUses
      hasExistingUseConflicts: existingUses?.length > 0
      overlapWithMooringsAndAnchorages: overlapWithMooringsAndAnchorages
      recreationalUses: recreationalUses
      hasRecreationalUseConflicts: recreationalUses?.length > 0

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()


module.exports = ActivitiesTab