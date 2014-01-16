AquacultureOverviewTab = require './aquacultureOverview.coffee'
AquacultureHabitatTab = require './aquacultureHabitat.coffee'


window.app.registerReport (report) ->
  report.tabs [AquacultureOverviewTab, AquacultureHabitatTab]
  # path must be relative to dist/
  report.stylesheets ['./aquacultureZone.css']
