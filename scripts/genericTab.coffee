ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

ids = require './ids.coffee'
for key, value of ids
  window[key] = value

class GenericTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'generic'
  className: 'genericTab'
  timeout: 120000
  template: templates.generic
  dependencies: [
    'GenericSize'
  ]

  render: () ->
    # The @recordSet method contains some useful means to get data out of 
    # the monsterous RecordSet json. Checkout the seasketch-reporting-template
    # documentation for more info.

    #show tables instead of graph for IE
    if window.d3
      d3IsPresent = true
    else
      d3IsPresent = false

    sketch_size = @recordSet('GenericSize', 'TargetSize').float('SIZE_IN_HA')
    attributes = @model.getAttributes()
    
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      SIZE: sketch_size 

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()
    

module.exports = GenericTab