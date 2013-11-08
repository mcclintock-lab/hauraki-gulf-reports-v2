OverviewTab = require './overview.coffee'
EnvironmentTab = require './environment.coffee'
FisheriesTab = require './fisheries.coffee'
ActivitiesTab = require './activities.coffee'

window.app.registerReport (report) ->
  report.tabs [OverviewTab, EnvironmentTab, FisheriesTab, ActivitiesTab]
  # path must be relative to dist/
  report.stylesheets ['./protectionZone.css']
