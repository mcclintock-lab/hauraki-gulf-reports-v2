OverviewTab = require './overview.coffee'
EnvironmentTab = require './environment.coffee'

window.app.registerReport (report) ->
  report.tabs [OverviewTab, EnvironmentTab]
  # path must be relative to dist/
  report.stylesheets ['./protectionZone.css']
