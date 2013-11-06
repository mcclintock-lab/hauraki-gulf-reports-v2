ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class FisheriesTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Fisheries'
  className: 'fisheries'
  timeout: 120000
  template: templates.fisheries
  # Dependencies will likely need to be changed to something like this to
  # support more GP services:
  # dependencies: [
  #   'CommercialFishing'
  #   'RecreationalFishing'
  #   'CustomaryFishing'
  #   'TotalFood'
  # ]

  render: () ->
    isCollection = @model.isCollection()
    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      commercialFishing: []
      recreationalFishing: []
      customaryFishing: []
      totalFood: []
      # commercialFishing: @recordSet('CommercialFishing', 'fishing').toArray()
      # recreationalFishing: @recordSet('RecreationalFishing', 'fishing')
      #   .toArray()
      # customaryFishing: @recordSet('CustomaryFishing', 'fishing').toArray()
      # totalFood: @recordSet('TotalFood', 'TotalFood').toArray()
    @$el.html @template.render(context, partials)

module.exports = FisheriesTab