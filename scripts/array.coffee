ArrayOverviewTab = require './arrayOverview.coffee'
ArrayEnvironmentTab = require './arrayEnvironment.coffee'
ArrayFisheriesTab = require './arrayFisheries.coffee'
ArrayActivitiesTab = require './arrayActivities.coffee'

window.app.registerReport (report) ->
  report.tabs [ArrayOverviewTab, ArrayEnvironmentTab, ArrayFisheriesTab, ArrayActivitiesTab]
  # path must be relative to dist/
  report.stylesheets ['./protectionZone.css']
