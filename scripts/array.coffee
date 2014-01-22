ArrayOverviewTab = require './arrayOverview.coffee'
ArrayEnvironmentTab = require './arrayEnvironment.coffee'
FisheriesTab = require './fisheries.coffee'
ActivitiesTab = require './activities.coffee'

window.app.registerReport (report) ->
  report.tabs [ArrayOverviewTab, ArrayEnvironmentTab, FisheriesTab, ActivitiesTab]
  # path must be relative to dist/
  report.stylesheets ['./protectionZone.css']
