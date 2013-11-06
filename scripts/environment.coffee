ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class EnvironmentTab extends ReportTab
  name: 'Environment'
  className: 'environment'
  timeout: 120000
  template: templates.habitat
  dependencies: ['Habitat']
  # Will likely be extended in the future to something like this:
  # dependencies: [
  #   'Habitat'
  #   'Representation'
  #   'AdjacentProtectedAreas'
  # ]

  render: () ->
    isCollection = @model.isCollection()
    habitats = @recordSet('Habitat', 'Habitats').toArray()
    habitatsInReserves = habitats
    habitatsInTypeTwos = habitats
    # The preceeding is of course, the wrong way to do this. I have no idea
    # how Dan intends to represent the habitat numbers for each of these. 
    # Lets say there is an attribute for each feature in the set that is
    # MPA_TYPE (so there are two rows per habitat). This is how I would split
    # the data up in that case:
    #   
    #   habitats = @recordSet('Habitat', 'Habitats')
    #   habitatsInReserves = _.filter habitats, (row) ->
    #     row.MPA_TYPE is 'MPA1' 
    #   habitatsInTypeTwos = _.filter habitats, (row) ->
    #     row.MPA_TYPE is 'MPA2' 
    # 
    # If instead the data is instead split into multiple featuresets (with 
    # the same paramName), then it gets more complicated. You'd need to access
    # the response data via @recordSet('Habitat', 'Habitats').value and pick
    # out the appropriate featureSets for each type. Maybe something like 
    # this:
    # 
    #   recordSet = @recordSet('Habitat', 'Habitats')
    #   console.log recordSet.value # remember to use this to debug
    #   featureSet = _.find recordSet.value, (fs) ->
    #     fs.features[0].attributes['MPA_TYPE'] is 'MPA1'
    #   habitatsInReserves = _.map featureSet.features, (f) -> f.attributes
    #   ... and repeat for Type-II MPAs
    # 
    context =
      isCollection: isCollection
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      habitatsCount: @recordSet('Habitat', 'Habitats').toArray().length
      reserveData: habitatsInReserves?.length > 0
      habitatsInReserves: habitatsInReserves
      habitatsInReservesCount: _.filter(habitatsInReserves, (row) -> 
        # Need to come up with some other standard that just presence?
        row.Total > 0
      ).length
      typeTwoData: habitatsInTypeTwos?.length > 0
      habitatsInTypeTwos: habitatsInTypeTwos
      habitatsInTypeTwosCount: _.filter(habitatsInTypeTwos, (row) -> 
        # Need to come up with some other standard that just presence?
        row.Total > 0
      ).length
      # representationData: @recordSet('Representation', 'Representation')
      #   .toArray()
      representationData: [{ # Placeholder, see above
        HabType: 'Moderate Rocky Shore'
        Total: "12% / 25 ha"
        NumSites: 3
        Protected: 'Yes'
        # It's also possible to assign "Protected" on the client, as I did 
        # in Barbuda:
        # https://github.com/mcclintock-lab/barbuda-reports-v2/blob/master/scripts/arrayHabitatTab.coffee#L21
      }]
      representedCount: 3
      # Use something like this for representedCount when you have real data:
      # _.filter(representationData, (row) ->
      #   row.Protected is 'Yes'
      # ).length
      adjacentProtectedAreas: true # Placeholder
      # Would need to be changed in the future to something like this:
      # adjacentProtectedAreas: @recordSet('AdjacentProtectedAreas', 
      #   'adjacent').bool('ANY_ADJACENT')


    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()

module.exports = EnvironmentTab