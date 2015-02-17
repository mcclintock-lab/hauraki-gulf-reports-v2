ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
ids = require './ids.coffee'

partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

for key, value of ids
  window[key] = value

class ArrayFisheriesTab extends ReportTab
  # this is the name that will be displayed in the Tab
  name: 'Fisheries'
  className: 'arrayFisheries'
  timeout: 120000
  template: templates.arrayFisheries
  # Dependencies will likely need to be changed to something like this to
  # support more GP services:
  dependencies: ['FishingTool', 'SnapperFishing']

  render: () ->
    aquacultureZones = @getChildren AQUACULTURE_ID
    hasAquacultureClasses = aquacultureZones?.length > 0
    if hasAquacultureClasses
      try
        aquacultureRecreationalFishing = @recordSet('FishingTool', 'RecreationalFishing').toArray()
        hasAquacultureRecreationalFishing = aquacultureRecreationalFishing?.length > 0
        aquacultureCustomaryFishing = @recordSet('FishingTool', 'CustomaryFishing', AQUACULTURE_ID).toArray()
        hasAquacultureCustomaryFishing = aquacultureCustomaryFishing?.length > 0
        aquacultureCommercialFishing = @recordSet('FishingTool', 'CommercialFishing',AQUACULTURE_ID).toArray()
        hasAquacultureCommercialFishing = aquacultureCommercialFishing?.length > 0
      catch error
        hasAquacultureCustomaryFishing = false
        hasAquacultureCommercialFishing = false
        hasAquacultureRecreationalFishing = false
        
    else
      hasAquacultureCustomaryFishing = false
      hasAquacultureCommercialFishing = false
      hasAquacultureRecreationalFishing = false

    
    protectionZones = @getChildren PROTECTION_ID
    hasProtectionClasses = protectionZones?.length > 0
    if hasProtectionClasses
      protectionRecreationalFishing = @recordSet('FishingTool', 'RecreationalFishing', PROTECTION_ID).toArray()
      hasProtectionRecreationalFishing = protectionRecreationalFishing?.length > 0
      protectionCustomaryFishing = @recordSet('FishingTool', 'CustomaryFishing',PROTECTION_ID).toArray()
      hasProtectionCustomaryFishing = protectionCustomaryFishing?.length > 0
      protectionCommercialFishing = @recordSet('FishingTool', 'CommercialFishing',PROTECTION_ID).toArray()
      hasProtectionCommercialFishing = @protectionCommercialFishing?.length > 0
    else
      hasProtectionRecreationalFishing = false
      hasProtectionCustomaryFishing = false
      hasProtectionCommercialFishing = false

    try
      snapperFishing = @recordSet('SnapperFishing', 'SnapperFishing').data.value[0]
    catch err
      console.log("couldn't load snapper fishing...")

    context =
      isCollection: true
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      protectionCommercialFishing: protectionCommercialFishing
      hasProtectionCommercialFishing: hasProtectionCommercialFishing
      protectionRecreationalFishing: protectionRecreationalFishing
      hasProtectionRecreationalFishing: hasProtectionRecreationalFishing
      protectionCustomaryFishing: protectionCustomaryFishing
      hasProtectionCustomaryFishing: hasProtectionCustomaryFishing
      hasProtectionClasses: hasProtectionClasses
      protectionTotalFood: []

      aquacultureCommercialFishing: aquacultureCommercialFishing
      hasAquacultureCommercialFishing: hasAquacultureCommercialFishing
      aquacultureRecreationalFishing: aquacultureRecreationalFishing
      hasAquacultureRecreationalFishing: hasAquacultureRecreationalFishing
      aquacultureCustomaryFishing: aquacultureCustomaryFishing
      hasAquacultureCustomaryFishing: hasAquacultureCustomaryFishing
      hasAquacultureClasses: hasAquacultureClasses
      aquacultureTotalFood: []
      snapperFishing: snapperFishing


    @$el.html @template.render(context, partials)

module.exports = ArrayFisheriesTab