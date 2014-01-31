ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

MIN_SIZE = 10000

class AquacultureActivitiesTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Activities'
  className: 'aquacultureActivities'
  timeout: 120000
  template: templates.aquacultureActivities
  dependencies: [
    'OverlapWithExistingUses'
    'OverlapWithMooringsAndAnchorages'
    'OverlapWithRecreationalUses'
  ]



  render: () ->
    isCollection = @model.isCollection()

    aquacultureExistingUses = @recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses').toArray()
    hasAquacultureExistingUseConflicts = aquacultureExistingUses?.length > 0
  
    aquacultureOverlapWithMooringsAndAnchorages = @recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages').bool('OVERLAPS')
    hasAquacultureOverlapWithMooringsAndAnchroages = aquacultureOverlapWithMooringsAndAnchorages?.length > 0
    aquacultureRecreationalUses = @recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses').toArray()
    hasAquacultureRecreationalUseConflicts = aquacultureRecreationalUses?.length > 0

    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user

      aquacultureExistingUses: aquacultureExistingUses
      hasAquacultureExistingUseConflicts: hasAquacultureExistingUseConflicts
      aquacultureOverlapWithMooringsAndAnchorages: aquacultureOverlapWithMooringsAndAnchorages
      hasAquacultureOverlapWithMooringsAndAnchroages: hasAquacultureOverlapWithMooringsAndAnchroages
      aquacultureRecreationalUses: aquacultureRecreationalUses
      hasAquacultureRecreationalUseConflicts: hasAquacultureRecreationalUseConflicts

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()


module.exports = AquacultureActivitiesTab