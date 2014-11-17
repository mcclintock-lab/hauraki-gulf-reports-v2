GenericTab = require './genericTab.coffee'


window.app.registerReport (report) ->
  report.tabs [GenericTab]
  # path must be relative to dist/
  report.stylesheets ['./generic.css']
