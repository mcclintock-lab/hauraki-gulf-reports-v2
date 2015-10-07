ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class AquacultureFisheriesTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Fisheries'
  className: 'aquacultureFisheries'
  timeout: 120000
  template: templates.aquacultureFisheries
  # Dependencies will likely need to be changed to something like this to
  # support more GP services:
  dependencies: ['FishingTool']

  render: () ->
    isCollection = @model.isCollection()
    try
      recreationalFishing = @recordSet('FishingTool', 'RecreationalFishing').toArray()
      customaryFishing = @recordSet('FishingTool', 'CustomaryFishing').toArray()
      commercialFishing = @recordSet('FishingTool', 'CommercialFishing').toArray()
    catch e
    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      commercialFishing: commercialFishing
      recreationalFishing: recreationalFishing
      customaryFishing: customaryFishing
      totalFood: []


    @$el.html @template.render(context, partials)

module.exports = AquacultureFisheriesTab