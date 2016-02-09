ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val


MIN_SIZE = 10000

class AquacultureOverviewTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Overview'
  className: 'aquacultureOverview'
  timeout: 120000
  template: templates.aquacultureOverview
  dependencies: [
    'AquacultureSize',
    'ProximityToExistingAquaculture'
  ]
  # Dependencies will likely need to be changed to something like this to
  # support more GP services:
  # dependencies: [
  #   'TargetSize'
  #   'RepresentationOfHabitats'
  #   'PercentProtected'
  # ]

  render: () ->
    # The @recordSet method contains some useful means to get data out of 
    # the monsterous RecordSet json. Checkout the seasketch-reporting-template
    # documentation for more info.

    try
      aquacultureSizes = @recordSet('AquacultureSize', 'AquacultureSize').toArray()
    catch Error
      console.log("error with sizes ", Error)
    try
      totalSize = @recordSet('AquacultureSize', 'TotalSize').float('TOTAL_HA')
    catch e
      console.log("error with total size, ", e)  
    try
      aquacultureProximity = @recordSet('ProximityToExistingAquaculture', 'ProximityToExistingAquaculture').toArray()
    catch e
      console.log("error with prox ", e)
      

      #there is a weird issue where this is coming through for a protection zone in IE9
      
    # I use this isCollection flag to customize the display. Another option
    # would be to have totally different Tab implementations for zones vs 
    # collections. I didn't do that here since they are so similar.
    isCollection = @model.isCollection()
    
    if isCollection
      # @model is the client-side sketch representation, which has some
      # useful, if undocumented, methods like getChildren().
      children = @model.getChildren()
      # NOTE: I'm dividing by all children here. Should this be filtered to
      # exclude Aquaculture and Mooring areas??

      #subtidal_ff  = _.filter children, (child) -> 
      #  child.getAttribute('AQUA_TYPE') is 'subtidal_filter_feeder'

    attributes = @model.getAttributes()
    anyAttributes = attributes?.length > 0

    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: attributes
      anyAttributes: anyAttributes
      admin: @project.isAdmin window.user
      aquacultureSizes: aquacultureSizes
      totalSize: totalSize
      hasProximity: aquacultureProximity?.length > 0
      aquacultureProximity: aquacultureProximity



    # @template is /templates/overview.mustache
    @$el.html @template.render(context, partials)


module.exports = AquacultureOverviewTab