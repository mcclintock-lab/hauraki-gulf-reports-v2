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
  dependencies: ['FishingTool', 'SeachangeFishing']

  render: () ->
    isCollection = @model.isCollection()
    


    rec_average = @recordSet('SeachangeFishing', 'RecreationalAverage').data.value[0]
    rec_total = @recordSet('SeachangeFishing', 'RecreationalTotal').data.value[0]
    rec_percent = @recordSet('SeachangeFishing', 'RecreationalPercent').data.value[0]


    snapper_average = @recordSet('SeachangeFishing', 'SnapperAverage').data.value[0]
    snapper_total = @recordSet('SeachangeFishing', 'SnapperTotal').data.value[0]
    snapper_percent = @recordSet('SeachangeFishing', 'SnapperPercent').data.value[0]

    commercialFishing = @recordSet('FishingTool', 'CommercialFishing').toArray()

    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      commercialFishing: commercialFishing
      snapper_average: snapper_average
      snapper_total: snapper_total
      snapper_percent: snapper_percent
      rec_average: rec_average
      rec_total: rec_total
      rec_percent: rec_percent



    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

module.exports = FisheriesTab