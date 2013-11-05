ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class EnvironmentTab extends ReportTab
  name: 'Environment'
  className: 'environment'
  template: templates.habitat
  dependencies: ['Habitat']
  timeout: 120000

  render: () ->
    console.log 'habitats', @recordSet('Habitat', 'Habitats').toArray()
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      habitats: @recordSet('Habitat', 'Habitats').toArray()

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()

module.exports = EnvironmentTab