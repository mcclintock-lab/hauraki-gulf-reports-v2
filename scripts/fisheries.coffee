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
  dependencies: ['SeachangeFishing']

  render: () ->
    isCollection = @model.isCollection()

    rec_average = @recordSet('SeachangeFishing', 'RecreationalAverage').data.value[0]
    rec_total = @recordSet('SeachangeFishing', 'RecreationalTotal').data.value[0]
    rec_percent = @recordSet('SeachangeFishing', 'RecreationalPercent').data.value[0]


    snapper_average = @recordSet('SeachangeFishing', 'SnapperAverage').data.value[0]
    snapper_total = @recordSet('SeachangeFishing', 'SnapperTotal').data.value[0]
    snapper_percent = @recordSet('SeachangeFishing', 'SnapperPercent').data.value[0]


    line_fishing = @recordSet('SeachangeFishing', 'CommercialLineFishing').toArray()
    color_line_fishing = @addColorToIntensity line_fishing
    trawl_fishing = @recordSet('SeachangeFishing', 'CommercialTrawlFishing').toArray()
    color_trawl_fishing = @addColorToIntensity trawl_fishing
    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      snapper_average: snapper_average
      snapper_total: snapper_total
      snapper_percent: snapper_percent
      rec_average: rec_average
      rec_total: rec_total
      rec_percent: rec_percent

      line_fishing: color_line_fishing
      trawl_fishing: color_trawl_fishing

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

  addColorToIntensity: (rec_set) =>
    intensity_color = {"0":"NONE","0 to 1":"#D3FE7B", "1 to 2":"#A2D85E","2 to 3": "#78B443","3 to 5": "#4E9029", "5 to 30":"#287110"}
  
    for val in rec_set
      if val['CAT'] == "0"
        val['COLOR'] = ""
      else
        val['COLOR'] = "background-color:"+intensity_color[val['CAT']]+";"
        val['CAT'] = "> "+val['CAT']
    return rec_set


module.exports = FisheriesTab