AquacultureOverviewTab = require './aquacultureOverview.coffee'
AquacultureHabitatTab = require './aquacultureHabitat.coffee'
AquacultureFisheriesTab = require './aquacultureFisheries.coffee'
AquacultureActivitiesTab = require './aquacultureActivities.coffee'

window.app.registerReport (report) ->
  report.tabs [AquacultureOverviewTab, AquacultureHabitatTab, AquacultureFisheriesTab, AquacultureActivitiesTab]
  # path must be relative to dist/
  report.stylesheets ['./aquacultureZone.css']
