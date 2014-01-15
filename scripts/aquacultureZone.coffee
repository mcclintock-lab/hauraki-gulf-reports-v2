OverviewTab = require './aquacultureOverview.coffee'


window.app.registerReport (report) ->
  report.tabs [OverviewTab]
  # path must be relative to dist/
  report.stylesheets ['./aquacultureZone.css']
