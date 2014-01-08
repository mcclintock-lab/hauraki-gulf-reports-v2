require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports = function(el) {
  var $el, $toggler, app, e, node, nodeid, toc, toggler, togglers, view, _i, _len, _ref;
  $el = $(el);
  app = window.app;
  toc = app.getToc();
  if (!toc) {
    console.log('No table of contents found');
    return;
  }
  togglers = $el.find('a[data-toggle-node]');
  _ref = togglers.toArray();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    nodeid = $toggler.data('toggle-node');
    try {
      view = toc.getChildViewById(nodeid);
      node = view.model;
      $toggler.attr('data-visible', !!node.get('visible'));
      $toggler.data('tocItem', view);
    } catch (_error) {
      e = _error;
      $toggler.attr('data-not-found', 'true');
    }
  }
  return togglers.on('click', function(e) {
    e.preventDefault();
    $el = $(e.target);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $el.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],3:[function(require,module,exports){
var JobItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JobItem = (function(_super) {
  __extends(JobItem, _super);

  JobItem.prototype.className = 'reportResult';

  JobItem.prototype.events = {};

  JobItem.prototype.bindings = {
    "h6 a": {
      observe: "serviceName",
      updateView: true,
      attributes: [
        {
          name: 'href',
          observe: 'serviceUrl'
        }
      ]
    },
    ".startedAt": {
      observe: ["startedAt", "status"],
      visible: function() {
        var _ref;
        return (_ref = this.model.get('status')) !== 'complete' && _ref !== 'error';
      },
      updateView: true,
      onGet: function() {
        if (this.model.get('startedAt')) {
          return "Started " + moment(this.model.get('startedAt')).fromNow() + ". ";
        } else {
          return "";
        }
      }
    },
    ".status": {
      observe: "status",
      onGet: function(s) {
        switch (s) {
          case 'pending':
            return "waiting in line";
          case 'running':
            return "running analytical service";
          case 'complete':
            return "completed";
          case 'error':
            return "an error occurred";
          default:
            return s;
        }
      }
    },
    ".queueLength": {
      observe: "queueLength",
      onGet: function(v) {
        var s;
        s = "Waiting behind " + v + " job";
        if (v.length > 1) {
          s += 's';
        }
        return s + ". ";
      },
      visible: function(v) {
        return (v != null) && parseInt(v) > 0;
      }
    },
    ".errors": {
      observe: 'error',
      updateView: true,
      visible: function(v) {
        return (v != null ? v.length : void 0) > 2;
      },
      onGet: function(v) {
        if (v != null) {
          return JSON.stringify(v, null, '  ');
        } else {
          return null;
        }
      }
    }
  };

  function JobItem(model) {
    this.model = model;
    JobItem.__super__.constructor.call(this);
  }

  JobItem.prototype.render = function() {
    this.$el.html("<h6><a href=\"#\" target=\"_blank\"></a><span class=\"status\"></span></h6>\n<div>\n  <span class=\"startedAt\"></span>\n  <span class=\"queueLength\"></span>\n  <pre class=\"errors\"></pre>\n</div>");
    return this.stickit();
  };

  return JobItem;

})(Backbone.View);

module.exports = JobItem;


},{}],4:[function(require,module,exports){
var ReportResults,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportResults = (function(_super) {
  __extends(ReportResults, _super);

  ReportResults.prototype.defaultPollingInterval = 3000;

  function ReportResults(sketch, deps) {
    var url;
    this.sketch = sketch;
    this.deps = deps;
    this.poll = __bind(this.poll, this);
    this.url = url = "/reports/" + this.sketch.id + "/" + (this.deps.join(','));
    ReportResults.__super__.constructor.call(this);
  }

  ReportResults.prototype.poll = function() {
    var _this = this;
    return this.fetch({
      success: function() {
        var problem, result, _i, _len, _ref, _ref1;
        _this.trigger('jobs');
        _ref = _this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          if ((_ref1 = result.get('status')) !== 'complete' && _ref1 !== 'error') {
            if (!_this.interval) {
              _this.interval = setInterval(_this.poll, _this.defaultPollingInterval);
            }
            return;
          }
        }
        if (_this.interval) {
          window.clearInterval(_this.interval);
        }
        if (problem = _.find(_this.models, function(r) {
          return r.get('error') != null;
        })) {
          return _this.trigger('error', "Problem with " + (problem.get('serviceName')) + " job");
        } else {
          return _this.trigger('finished');
        }
      },
      error: function(e, res, a, b) {
        var json, _ref, _ref1;
        if (res.status !== 0) {
          if ((_ref = res.responseText) != null ? _ref.length : void 0) {
            try {
              json = JSON.parse(res.responseText);
            } catch (_error) {

            }
          }
          if (_this.interval) {
            window.clearInterval(_this.interval);
          }
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"G1pDc3":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

ReportResults = require('./reportResults.coffee');

t = require('../templates/templates.js');

templates = {
  reportLoading: t['node_modules/seasketch-reporting-api/reportLoading']
};

JobItem = require('./jobItem.coffee');

CollectionView = require('views/collectionView');

RecordSet = (function() {
  function RecordSet(data, tab, sketchClassId) {
    this.data = data;
    this.tab = tab;
    this.sketchClassId = sketchClassId;
  }

  RecordSet.prototype.toArray = function() {
    var data,
      _this = this;
    if (this.sketchClassId) {
      data = _.find(this.data.value, function(v) {
        var _ref, _ref1, _ref2;
        return ((_ref = v.features) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.attributes) != null ? _ref2['SC_ID'] : void 0 : void 0 : void 0) === _this.sketchClassId;
      });
      if (!data) {
        throw "Could not find data for sketchClass " + this.sketchClassId;
      }
    } else {
      if (_.isArray(this.data.value)) {
        data = this.data.value[0];
      } else {
        data = this.data.value;
      }
    }
    return _.map(data.features, function(feature) {
      return feature.attributes;
    });
  };

  RecordSet.prototype.raw = function(attr) {
    var attrs;
    attrs = _.map(this.toArray(), function(row) {
      return row[attr];
    });
    attrs = _.filter(attrs, function(attr) {
      return attr !== void 0;
    });
    if (attrs.length === 0) {
      console.log(this.data);
      this.tab.reportError("Could not get attribute " + attr + " from results");
      throw "Could not get attribute " + attr;
    } else if (attrs.length === 1) {
      return attrs[0];
    } else {
      return attrs;
    }
  };

  RecordSet.prototype.int = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, parseInt);
    } else {
      return parseInt(raw);
    }
  };

  RecordSet.prototype.float = function(attr, decimalPlaces) {
    var raw;
    if (decimalPlaces == null) {
      decimalPlaces = 2;
    }
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return round(val, decimalPlaces);
      });
    } else {
      return round(raw, decimalPlaces);
    }
  };

  RecordSet.prototype.bool = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return val.toString().toLowerCase() === 'true';
      });
    } else {
      return raw.toString().toLowerCase() === 'true';
    }
  };

  return RecordSet;

})();

ReportTab = (function(_super) {
  __extends(ReportTab, _super);

  function ReportTab() {
    this.renderJobDetails = __bind(this.renderJobDetails, this);
    this.startEtaCountdown = __bind(this.startEtaCountdown, this);
    this.reportJobs = __bind(this.reportJobs, this);
    this.showError = __bind(this.showError, this);
    this.reportError = __bind(this.reportError, this);
    this.reportRequested = __bind(this.reportRequested, this);
    this.remove = __bind(this.remove, this);
    _ref = ReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ReportTab.prototype.name = 'Information';

  ReportTab.prototype.dependencies = [];

  ReportTab.prototype.initialize = function(model, options) {
    this.model = model;
    this.options = options;
    this.app = window.app;
    _.extend(this, this.options);
    this.reportResults = new ReportResults(this.model, this.dependencies);
    this.listenToOnce(this.reportResults, 'error', this.reportError);
    this.listenToOnce(this.reportResults, 'jobs', this.renderJobDetails);
    this.listenToOnce(this.reportResults, 'jobs', this.reportJobs);
    this.listenTo(this.reportResults, 'finished', _.bind(this.render, this));
    return this.listenToOnce(this.reportResults, 'request', this.reportRequested);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    var _ref1, _ref2;
    this.$el.show();
    this.visible = true;
    if (((_ref1 = this.dependencies) != null ? _ref1.length : void 0) && !this.reportResults.models.length) {
      return this.reportResults.poll();
    } else if (!((_ref2 = this.dependencies) != null ? _ref2.length : void 0)) {
      return this.render();
    }
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    window.clearInterval(this.etaInterval);
    this.stopListening();
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.reportRequested = function() {
    return this.$el.html(templates.reportLoading.render({}));
  };

  ReportTab.prototype.reportError = function(msg, cancelledRequest) {
    if (!cancelledRequest) {
      if (msg === 'JOB_ERROR') {
        return this.showError('Error with specific job');
      } else {
        return this.showError(msg);
      }
    }
  };

  ReportTab.prototype.showError = function(msg) {
    this.$('.progress').remove();
    this.$('p.error').remove();
    return this.$('h4').text("An Error Occurred").after("<p class=\"error\" style=\"text-align:center;\">" + msg + "</p>");
  };

  ReportTab.prototype.reportJobs = function() {
    if (!this.maxEta) {
      this.$('.progress .bar').width('100%');
    }
    return this.$('h4').text("Analyzing Designs");
  };

  ReportTab.prototype.startEtaCountdown = function() {
    var left, total,
      _this = this;
    if (this.maxEta) {
      total = (new Date(this.maxEta).getTime() - new Date(this.etaStart).getTime()) / 1000;
      left = (new Date(this.maxEta).getTime() - new Date().getTime()) / 1000;
      _.delay(function() {
        return _this.reportResults.poll();
      }, (left + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (left + 1) + "s");
        return _this.$('.progress .bar').width('100%');
      }, 500);
    }
  };

  ReportTab.prototype.renderJobDetails = function() {
    var item, job, maxEta, _i, _j, _len, _len1, _ref1, _ref2, _results,
      _this = this;
    maxEta = null;
    _ref1 = this.reportResults.models;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job.get('eta')) {
        if (!maxEta || job.get('eta') > maxEta) {
          maxEta = job.get('eta');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.etaStart = new Date();
      this.startEtaCountdown();
    }
    this.$('[rel=details]').css('display', 'block');
    this.$('[rel=details]').click(function(e) {
      e.preventDefault();
      _this.$('[rel=details]').hide();
      return _this.$('.details').show();
    });
    _ref2 = this.reportResults.models;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      job = _ref2[_j];
      item = new JobItem(job);
      item.render();
      _results.push(this.$('.details').append(item.el));
    }
    return _results;
  };

  ReportTab.prototype.getResult = function(id) {
    var result, results;
    results = this.getResults();
    result = _.find(results, function(r) {
      return r.paramName === id;
    });
    if (result == null) {
      throw new Error('No result with id ' + id);
    }
    return result.value;
  };

  ReportTab.prototype.getFirstResult = function(param, id) {
    var e, result;
    result = this.getResult(param);
    try {
      return result[0].features[0].attributes[id];
    } catch (_error) {
      e = _error;
      throw "Error finding " + param + ":" + id + " in gp results";
    }
  };

  ReportTab.prototype.getResults = function() {
    var results;
    results = this.reportResults.map(function(result) {
      return result.get('result').results;
    });
    if (!(results != null ? results.length : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref1;
      return (_ref1 = result.paramName) !== 'ResultCode' && _ref1 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param;
    if (sketchClassId == null) {
      sketchClassId = false;
    }
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = this.reportResults.find(function(r) {
      return r.get('serviceName') === dependency;
    });
    if (!dep) {
      console.log(this.reportResults.models);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('result').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param, this, sketchClassId);
  };

  ReportTab.prototype.enableTablePaging = function() {
    return this.$('[data-paging]').each(function() {
      var $table, i, noRowsMessage, pageSize, pages, parent, rows, ul, _i, _len, _ref1;
      $table = $(this);
      pageSize = $table.data('paging');
      rows = $table.find('tbody tr').length;
      pages = Math.ceil(rows / pageSize);
      if (pages > 1) {
        $table.append("<tfoot>\n  <tr>\n    <td colspan=\"" + ($table.find('thead th').length) + "\">\n      <div class=\"pagination\">\n        <ul>\n          <li><a href=\"#\">Prev</a></li>\n        </ul>\n      </div>\n    </td>\n  </tr>\n</tfoot>");
        ul = $table.find('tfoot ul');
        _ref1 = _.range(1, pages + 1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          ul.append("<li><a href=\"#\">" + i + "</a></li>");
        }
        ul.append("<li><a href=\"#\">Next</a></li>");
        $table.find('li a').click(function(e) {
          var $a, a, n, offset, text;
          e.preventDefault();
          $a = $(this);
          text = $a.text();
          if (text === 'Next') {
            a = $a.parent().parent().find('.active').next().find('a');
            if (a.text() !== 'Next') {
              return a.click();
            }
          } else if (text === 'Prev') {
            a = $a.parent().parent().find('.active').prev().find('a');
            if (a.text() !== 'Prev') {
              return a.click();
            }
          } else {
            $a.parent().parent().find('.active').removeClass('active');
            $a.parent().addClass('active');
            n = parseInt(text);
            $table.find('tbody tr').hide();
            offset = pageSize * (n - 1);
            return $table.find("tbody tr").slice(offset, n * pageSize).show();
          }
        });
        $($table.find('li a')[1]).click();
      }
      if (noRowsMessage = $table.data('no-rows')) {
        if (rows === 0) {
          parent = $table.parent();
          $table.remove();
          parent.removeClass('tableContainer');
          return parent.append("<p>" + noRowsMessage + "</p>");
        }
      }
    });
  };

  ReportTab.prototype.enableLayerTogglers = function() {
    return enableLayerTogglers(this.$el);
  };

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"../templates/templates.js":"4l2XTc","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"tfKrs8","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('G1pDc3');
},{}],"api/utils":[function(require,module,exports){
module.exports=require('tfKrs8');
},{}],"tfKrs8":[function(require,module,exports){
module.exports = {
  round: function(number, decimalPlaces) {
    var multiplier;
    if (!_.isNumber(number)) {
      number = parseFloat(number);
    }
    multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }
};


},{}],"4l2XTc":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,81,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.rp("attributes/attributeItem",c,p,"    "));});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}],"api/templates":[function(require,module,exports){
module.exports=require('4l2XTc');
},{}],11:[function(require,module,exports){
var ActivitiesTab, MIN_SIZE, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

MIN_SIZE = 10000;

ActivitiesTab = (function(_super) {
  __extends(ActivitiesTab, _super);

  function ActivitiesTab() {
    _ref = ActivitiesTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ActivitiesTab.prototype.name = 'Activities';

  ActivitiesTab.prototype.className = 'activities';

  ActivitiesTab.prototype.timeout = 120000;

  ActivitiesTab.prototype.template = templates.activities;

  ActivitiesTab.prototype.dependencies = ['OverlapWithAquaculture', 'OverlapWithExistingUses', 'OverlapWithMooringsAndAnchorages', 'OverlapWithRecreationalUses'];

  ActivitiesTab.prototype.render = function() {
    var aquaculture, context, existingUses, isCollection, overlapWithMooringsAndAnchorages, recreationalUses;
    isCollection = this.model.isCollection();
    aquaculture = this.recordSet('OverlapWithAquaculture', 'OverlapWithAquaculture').toArray();
    existingUses = this.recordSet('OverlapWithExistingUses', 'OverlapWithExistingUses').toArray();
    overlapWithMooringsAndAnchorages = this.recordSet('OverlapWithMooringsAndAnchorages', 'OverlapWithMooringsAndAnchorages').bool('OVERLAPS');
    recreationalUses = this.recordSet('OverlapWithRecreationalUses', 'OverlapWithRecreationalUses').toArray();
    context = {
      isCollection: isCollection,
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      aquaculture: aquaculture,
      aquacultureCount: aquaculture != null ? aquaculture.length : void 0,
      existingUses: existingUses,
      hasExistingUseConflicts: (existingUses != null ? existingUses.length : void 0) > 0,
      overlapWithMooringsAndAnchorages: overlapWithMooringsAndAnchorages,
      recreationalUses: recreationalUses,
      hasRecreationalUseConflicts: (recreationalUses != null ? recreationalUses.length : void 0) > 0
    };
    this.$el.html(this.template.render(context, templates));
    this.enableTablePaging();
    return this.enableLayerTogglers();
  };

  return ActivitiesTab;

})(ReportTab);

module.exports = ActivitiesTab;


},{"../templates/templates.js":16,"reportTab":"G1pDc3"}],12:[function(require,module,exports){
var AcitivitiesTab, EnvironmentTab, FisheriesTab, OverviewTab;

OverviewTab = require('./overview.coffee');

EnvironmentTab = require('./environment.coffee');

FisheriesTab = require('./fisheries.coffee');

AcitivitiesTab = require('./activities.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, EnvironmentTab, FisheriesTab, ActivitiesTab]);
  return report.stylesheets(['./protectionZone.css']);
});


},{"./activities.coffee":11,"./environment.coffee":13,"./fisheries.coffee":14,"./overview.coffee":15}],13:[function(require,module,exports){
var EnvironmentTab, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

EnvironmentTab = (function(_super) {
  __extends(EnvironmentTab, _super);

  function EnvironmentTab() {
    _ref = EnvironmentTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EnvironmentTab.prototype.name = 'Environment';

  EnvironmentTab.prototype.className = 'environment';

  EnvironmentTab.prototype.timeout = 120000;

  EnvironmentTab.prototype.template = templates.habitat;

  EnvironmentTab.prototype.dependencies = ['HabitatComprehensiveness', 'NearTerrestrialProtected', 'EcosystemServices', 'SensitiveAreas', 'ProtectedAndThreatenedSpecies'];

  EnvironmentTab.prototype.render = function() {
    var biogenic_habitat, context, ecosystem_productivity, habitats, habitatsInReserves, habitatsInTypeTwos, hasTypeTwoData, isCollection, near_terrestrial_protected, nutrient_recycling, protectedMammals, representationData, seabirdBreedingSites, sensitiveAreas, shorebirdSites;
    isCollection = this.model.isCollection();
    habitats = this.recordSet('HabitatComprehensiveness', 'HabitatComprehensiveness').toArray();
    ecosystem_productivity = this.recordSet('EcosystemServices', 'EcosystemProductivity').toArray();
    nutrient_recycling = this.recordSet('EcosystemServices', 'NutrientRecycling').toArray();
    biogenic_habitat = this.recordSet('EcosystemServices', 'BiogenicHabitat').toArray();
    near_terrestrial_protected = this.recordSet('NearTerrestrialProtected', 'NearTerrestrialProtected').bool('Adjacent');
    sensitiveAreas = this.recordSet('SensitiveAreas', 'SensitiveAreas').toArray();
    sensitiveAreas = _.sortBy(sensitiveAreas, function(row) {
      return parseFloat(row.PERC_AREA);
    });
    sensitiveAreas.reverse();
    habitatsInReserves = _.filter(habitats, function(row) {
      return row.MPA_TYPE === 'MPA1';
    });
    habitatsInReserves = _.sortBy(habitatsInReserves, function(row) {
      return parseFloat(row.NEW_PERC);
    });
    habitatsInReserves.reverse();
    habitatsInTypeTwos = _.filter(habitats, function(row) {
      return row.MPA_TYPE === 'MPA2';
    });
    habitatsInTypeTwos = _.sortBy(habitatsInTypeTwos, function(row) {
      return parseFloat(row.NEW_PERC);
    });
    habitatsInTypeTwos.reverse();
    representationData = _.filter(habitats, function(row) {
      return row.MPA_TYPE === 'ALL_TYPES';
    });
    representationData = _.sortBy(representationData, function(row) {
      return parseFloat(row.CB_PERC);
    });
    representationData.reverse();
    protectedMammals = this.recordSet('ProtectedAndThreatenedSpecies', 'Mammals').toArray();
    protectedMammals = _.sortBy(protectedMammals, function(row) {
      return parseInt(row.Count);
    });
    protectedMammals.reverse();
    seabirdBreedingSites = this.recordSet('ProtectedAndThreatenedSpecies', 'SeabirdBreedingSites').toArray();
    seabirdBreedingSites = _.sortBy(seabirdBreedingSites, function(row) {
      return parseInt(row.Count);
    });
    seabirdBreedingSites.reverse();
    shorebirdSites = this.recordSet('ProtectedAndThreatenedSpecies', 'ShorebirdPoints').toArray();
    shorebirdSites = _.sortBy(shorebirdSites, function(row) {
      return parseInt(row.Count);
    });
    shorebirdSites.reverse();
    hasTypeTwoData = habitatsInTypeTwos.length > 0;
    context = {
      isCollection: isCollection,
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      habitatsCount: 62,
      hasReserveData: (habitatsInReserves != null ? habitatsInReserves.length : void 0) > 0,
      habitatsInReserves: habitatsInReserves,
      habitatsInReservesCount: habitatsInReserves != null ? habitatsInReserves.length : void 0,
      hasTypeTwoData: hasTypeTwoData,
      habitatsInTypeTwoCount: habitatsInTypeTwos != null ? habitatsInTypeTwos.length : void 0,
      habitatsInTypeTwos: habitatsInTypeTwos,
      representationData: representationData,
      hasRepresentationData: (representationData != null ? representationData.length : void 0) > 0,
      representedCount: representationData != null ? representationData.length : void 0,
      adjacentProtectedAreas: near_terrestrial_protected,
      nutrientRecycling: nutrient_recycling,
      biogenicHabitat: biogenic_habitat,
      ecosystemProductivity: ecosystem_productivity,
      sensitiveAreas: sensitiveAreas,
      hasSensitiveAreas: (sensitiveAreas != null ? sensitiveAreas.length : void 0) > 0,
      protectedMammals: protectedMammals,
      hasProtectedMammals: (protectedMammals != null ? protectedMammals.length : void 0) > 0,
      seabirdBreedingSites: seabirdBreedingSites,
      hasSeabirdBreedingSites: (seabirdBreedingSites != null ? seabirdBreedingSites.length : void 0) > 0,
      shorebirdSites: shorebirdSites,
      hasShorebirdSites: (shorebirdSites != null ? shorebirdSites.length : void 0) > 0
    };
    this.$el.html(this.template.render(context, templates));
    this.enableTablePaging();
    return this.enableLayerTogglers();
  };

  return EnvironmentTab;

})(ReportTab);

module.exports = EnvironmentTab;


},{"../templates/templates.js":16,"reportTab":"G1pDc3"}],14:[function(require,module,exports){
var FisheriesTab, ReportTab, key, partials, templates, val, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

FisheriesTab = (function(_super) {
  __extends(FisheriesTab, _super);

  function FisheriesTab() {
    _ref = FisheriesTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  FisheriesTab.prototype.name = 'Fisheries';

  FisheriesTab.prototype.className = 'fisheries';

  FisheriesTab.prototype.timeout = 120000;

  FisheriesTab.prototype.template = templates.fisheries;

  FisheriesTab.prototype.dependencies = ['FishingTool'];

  FisheriesTab.prototype.render = function() {
    var commercialFishing, context, customaryFishing, isCollection, recreationalFishing;
    isCollection = this.model.isCollection();
    recreationalFishing = this.recordSet('FishingTool', 'RecreationalFishing').toArray();
    customaryFishing = this.recordSet('FishingTool', 'CustomaryFishing').toArray();
    commercialFishing = this.recordSet('FishingTool', 'CommercialFishing').toArray();
    context = {
      isCollection: isCollection,
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      commercialFishing: commercialFishing,
      recreationalFishing: recreationalFishing,
      customaryFishing: customaryFishing,
      totalFood: []
    };
    return this.$el.html(this.template.render(context, partials));
  };

  return FisheriesTab;

})(ReportTab);

module.exports = FisheriesTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"4l2XTc","../templates/templates.js":16,"reportTab":"G1pDc3"}],15:[function(require,module,exports){
var MIN_SIZE, OverviewTab, ReportTab, key, partials, templates, val, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

MIN_SIZE = 10000;

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Overview';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.timeout = 120000;

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.dependencies = ['TargetSize', 'HabitatCount', 'HabitatCountPercent'];

  OverviewTab.prototype.render = function() {
    var HAB_PERC_MR_COMBINED, HAB_PERC_MR_EXISTING, HAB_PERC_MR_NEW, HAB_PERC_T2_COMBINED, HAB_PERC_T2_EXISTING, HAB_PERC_T2_NEW, HECTARES, children, context, hc_combined, hc_existing, hc_proposed, hc_total, isCollection, marineReserves, type2MPAs;
    HECTARES = this.recordSet('TargetSize', 'TargetSize').float('SIZE_IN_HA');
    hc_proposed = this.recordSet('HabitatCount', 'HabitatCount').float('SEL_HAB');
    hc_existing = this.recordSet('HabitatCount', 'HabitatCount').float('EXST_HAB');
    hc_combined = this.recordSet('HabitatCount', 'HabitatCount').float('CMBD_HAB');
    hc_total = this.recordSet('HabitatCount', 'HabitatCount').float('TOT_HAB');
    HAB_PERC_MR_NEW = this.recordSet('HabitatCountPercent', 'HabitatCountPercent').float('NW_RES_PRC');
    HAB_PERC_MR_EXISTING = this.recordSet('HabitatCountPercent', 'HabitatCountPercent').float('EX_RES_PRC');
    HAB_PERC_MR_COMBINED = this.recordSet('HabitatCountPercent', 'HabitatCountPercent').float('CB_RES_PRC');
    HAB_PERC_T2_NEW = this.recordSet('HabitatCountPercent', 'HabitatCountPercent').float('NW_HPA_PRC');
    HAB_PERC_T2_EXISTING = this.recordSet('HabitatCountPercent', 'HabitatCountPercent').float('EX_HPA_PRC');
    HAB_PERC_T2_COMBINED = this.recordSet('HabitatCountPercent', 'HabitatCountPercent').float('CB_HPA_PRC');
    isCollection = this.model.isCollection();
    if (isCollection) {
      children = this.model.getChildren();
      HECTARES = (HECTARES / children.length).toFixed(1);
      marineReserves = _.filter(children, function(child) {
        return child.getAttribute('MPA_TYPE') === 'MPA1';
      });
      type2MPAs = _.filter(children, function(child) {
        return child.getAttribute('MPA_TYPE') === 'MPA2';
      });
    }
    context = {
      isCollection: isCollection,
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      SIZE: HECTARES,
      SIZE_OK: HECTARES > MIN_SIZE,
      MIN_SIZE: MIN_SIZE,
      MARINE_RESERVES: marineReserves != null ? marineReserves.length : void 0,
      MARINE_RESERVES_PLURAL: (marineReserves != null ? marineReserves.length : void 0) !== 1,
      TYPE_TWO_MPAS: type2MPAs != null ? type2MPAs.length : void 0,
      TYPE_TWO_MPAS_PLURAL: (type2MPAs != null ? type2MPAs.length : void 0) !== 1,
      NUM_PROTECTED: (marineReserves != null ? marineReserves.length : void 0) + (type2MPAs != null ? type2MPAs.length : void 0),
      HAB_COUNT_PROPOSED: hc_proposed,
      HAB_COUNT_EXISTING: hc_existing,
      HAB_COUNT_COMBINED: hc_combined,
      HAB_COUNT_TOTAL: hc_total,
      HAB_PERC_MR_NEW: HAB_PERC_MR_NEW,
      HAB_PERC_MR_EXISTING: HAB_PERC_MR_EXISTING,
      HAB_PERC_MR_COMBINED: HAB_PERC_MR_COMBINED,
      HAB_PERC_T2_NEW: HAB_PERC_T2_NEW,
      HAB_PERC_T2_EXISTING: HAB_PERC_T2_EXISTING,
      HAB_PERC_T2_COMBINED: HAB_PERC_T2_COMBINED
    };
    this.$el.html(this.template.render(context, partials));
    if (HECTARES < MIN_SIZE * 2) {
      return this.drawViz(HECTARES);
    } else {
      return this.$('.viz').hide();
    }
  };

  OverviewTab.prototype.drawViz = function(size) {
    var chart, el, maxScale, ranges, x;
    if (window.d3) {
      console.log('d3');
      el = this.$('.viz')[0];
      maxScale = MIN_SIZE * 2;
      ranges = [
        {
          name: 'Below recommended (0 - 10,000 ha)',
          start: 0,
          end: MIN_SIZE,
          bg: "#8e5e50",
          "class": 'below'
        }, {
          name: 'Recommended (> 10,000 ha)',
          start: MIN_SIZE,
          end: MIN_SIZE * 2,
          bg: '#588e3f',
          "class": 'recommended'
        }
      ];
      x = d3.scale.linear().domain([0, maxScale]).range([0, 400]);
      chart = d3.select(el);
      chart.selectAll("div.range").data(ranges).enter().append("div").style("width", function(d) {
        return x(d.end - d.start) + 'px';
      }).attr("class", function(d) {
        return "range " + d["class"];
      }).append("span").text(function(d) {
        return d.name;
      });
      return chart.selectAll("div.measure").data([size]).enter().append("div").attr("class", "measure").style("left", function(d) {
        return x(d) + 'px';
      }).text(function(d) {
        return "";
      });
    }
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"4l2XTc","../templates/templates.js":16,"reportTab":"G1pDc3"}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["activities"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Possible Effects on Aquaculture</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\">Type</th>");_.b("\n" + i);_.b("        <th>Area Affected (Ha)</th>");_.b("\n" + i);_.b("        <th>Area Affect (%)</th>");_.b("\n" + i);_.b("        <th>Potential Impact on Production</th>");_.b("\n" + i);_.b("        <th>Potential Impact on Economic Value</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("aquaculture",c,p,1),c,p,0,745,912,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <tr>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("FARM_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("SIZE_IN_HA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"5\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);_.b("            Note: as not all areas fished have the same fishing effort or catch, the ");_.b("\n" + i);_.b("            “Level of Fishing Displaced” is a combination of the area being ");_.b("\n" + i);_.b("            restricted and the catch that would normally be caught in that area");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Existing Use Conflicts</h4>");_.b("\n" + i);if(_.s(_.f("hasExistingUseConflicts",c,p,1),c,p,0,1486,1681,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p class=\"large\">");_.b("\n" + i);_.b("        One or more protection classes overlap with, or are near, <strong>existing uses</strong> that are in conflict with the purposes of the protection.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Existing Use</th>");_.b("\n" + i);_.b("        <th>Is Compatible</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("existingUses",c,p,1),c,p,0,1923,2012,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <tr>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("FEAT_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Recreational Uses</h4>");_.b("\n" + i);if(_.s(_.f("hasRecreationalUseConflicts",c,p,1),c,p,0,2183,2385,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p class=\"large\">");_.b("\n" + i);_.b("        One or more protection classes overlap with, or are near, <strong>recreational uses</strong> that may be in conflict with the purposes of the protection.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Recreational Use</th>");_.b("\n" + i);_.b("        <th>Is Compatible</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("recreationalUses",c,p,1),c,p,0,2639,2728,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <tr>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("FEAT_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("overlapWithMooringsAndAnchorages",c,p,1),c,p,0,2820,3075,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Overlaps with Mooring and Anchorage Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    One more more protection areas overlap with sites that are identified as good for <strong>Mooring and Anchorages</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Report Sections</h4>");_.b("\n" + i);_.b("  <p>Use report sections to group information into meaningful categories</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>D3 Visualizations</h4>");_.b("\n" + i);_.b("  <ul class=\"nav nav-pills\" id=\"tabs2\">");_.b("\n" + i);_.b("    <li class=\"active\"><a href=\"#chart\">Chart</a></li>");_.b("\n" + i);_.b("    <li><a href=\"#dataTable\">Table</a></li>");_.b("\n" + i);_.b("  </ul>");_.b("\n" + i);_.b("  <div class=\"tab-content\">");_.b("\n" + i);_.b("    <div class=\"tab-pane active\" id=\"chart\">");_.b("\n" + i);_.b("      <!--[if IE 8]>");_.b("\n" + i);_.b("      <p class=\"unsupported\">");_.b("\n" + i);_.b("      This visualization is not compatible with Internet Explorer 8. ");_.b("\n" + i);_.b("      Please upgrade your browser, or view results in the table tab.");_.b("\n" + i);_.b("      </p>      ");_.b("\n" + i);_.b("      <![endif]-->");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        See <code>src/scripts/demo.coffee</code> for an example of how to ");_.b("\n" + i);_.b("        use d3.js to render visualizations. Provide a table-based view");_.b("\n" + i);_.b("        and use conditional comments to provide a fallback for IE8 users.");_.b("\n" + i);_.b("        <br>");_.b("\n" + i);_.b("        <a href=\"http://twitter.github.io/bootstrap/2.3.2/\">Bootstrap 2.x</a>");_.b("\n" + i);_.b("        is loaded within SeaSketch so you can use it to create tabs and other ");_.b("\n" + i);_.b("        interface components. jQuery and underscore are also available.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"tab-pane\" id=\"dataTable\">");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>index</th>");_.b("\n" + i);_.b("            <th>value</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("chartData",c,p,1),c,p,0,1351,1418,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr><td>");_.b(_.v(_.f("index",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection emphasis\">");_.b("\n" + i);_.b("  <h4>Emphasis</h4>");_.b("\n" + i);_.b("  <p>Give report sections an <code>emphasis</code> class to highlight important information.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection warning\">");_.b("\n" + i);_.b("  <h4>Warning</h4>");_.b("\n" + i);_.b("  <p>Or <code>warn</code> of potential problems.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection danger\">");_.b("\n" + i);_.b("  <h4>Danger</h4>");_.b("\n" + i);_.b("  <p><code>danger</code> can also be used... sparingly.</p>");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["fisheries"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Commercial Fishing</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Affected Area (%)</th>");_.b("\n" + i);_.b("        <th>Level of Fishing Displaced (%)</th>");_.b("\n" + i);_.b("        <th>Economic Value</th>");_.b("\n" + i);_.b("        <th>Number of Affected Fishers</th>");_.b("\n" + i);_.b("        <th>Fishers in Gulf Fishery</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("commercialFishing",c,p,1),c,p,0,410,605,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PrcDsplcd",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Level",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Num",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Fishers",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          Note: as not all areas fished have the same fishing effort or catch, the “Level of Fishing Displaced” is a combination of the area being restricted and the catch that would normally be caught in that area.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Recreational Fishing</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Affected Area (%)</th>");_.b("\n" + i);_.b("        <th>Level of Fishing Displaced (%)</th>");_.b("\n" + i);_.b("        <th>Economic Value</th>");_.b("\n" + i);_.b("        <th>Number of Affected Fishers</th>");_.b("\n" + i);_.b("        <th>Fishers in Gulf Fishery</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("recreationalFishing",c,p,1),c,p,0,1420,1615,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PrcDsplcd",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Level",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Num",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Fishers",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("<!-- ");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b(" -->");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Customary Fishing</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Affected Area (%)</th>");_.b("\n" + i);_.b("        <th>Level of Fishing Displaced (%)</th>");_.b("\n" + i);_.b("        <th>Economic Value</th>");_.b("\n" + i);_.b("        <th>Number of Affected Fishers</th>");_.b("\n" + i);_.b("        <th>Fishers in Gulf Fishery</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("customaryFishing",c,p,1),c,p,0,2221,2416,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PrcDsplcd",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Level",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Num",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Fishers",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody> ");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          Important customary fishing locations have not been identified yet. Information on the whereabouts of these activities may be added during planning process.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Total Food Provision</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Fish Stock</th>");_.b("\n" + i);_.b("        <th>Catch Displaced (tonnss)</th>");_.b("\n" + i);_.b("        <th>Percent from Gulf</th>");_.b("\n" + i);_.b("        <th>Percent of TAC</th>");_.b("\n" + i);_.b("        <th>Value of Fish</th>");_.b("\n" + i);_.b("        <th>Value to NZ Economy</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("totalFood",c,p,1),c,p,0,3155,3359,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("FishStock",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Kgs_Ha",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Gulf_Kgs",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("tac",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("value_to_nz",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody> ");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          The total food provision includes commercial, recreational, and");_.b("\n" + i);_.b("          customary catch.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["habitat"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("isCollection",c,p,1),c,p,0,17,323,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<p>");_.b("\n" + i);_.b("  The collection of marine protected areas will protect the full range of ");_.b("\n" + i);_.b("  natural marine habitats and ecosystems. These reports show the proportion ");_.b("\n" + i);_.b("  of the gulf protected for each habitat type in Marine Reserves and Type-2 ");_.b("\n" + i);_.b("  Protected Areas, for both existing protected areas and sketches.");_.b("\n" + i);_.b("</p>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasReserveData",c,p,1),c,p,0,361,1487,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats Protected in Marine Reserves</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\">Habitats</th>");_.b("\n" + i);_.b("        <th>% In New Marine Reserves</th>");_.b("\n" + i);_.b("        <th>% In Existing Marine Reserves</th>");_.b("\n" + i);_.b("        <th style=\"width:50px;\">Total</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitatsInReserves",c,p,1),c,p,0,791,940,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NEW_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("EX_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,1125,1174,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            Marine Reserves protect");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("            This Marine Reserve protects");_.b("\n");};_.b("            <strong>");_.b(_.v(_.f("habitatsInReservesCount",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("habitatsCount",c,p,0)));_.b("</strong> habitat types.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasTypeTwoData",c,p,1),c,p,0,1527,2638,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats Protected in Type-2 Protected Areas</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\">Habitats</th>");_.b("\n" + i);_.b("        <th>% In New Type-2 Protected Areas</th>");_.b("\n" + i);_.b("        <th>% In Existing Type-2 Protected Areas</th>");_.b("\n" + i);_.b("        <th style=\"width:50px;\">Total</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitatsInTypeTwos",c,p,1),c,p,0,1936,2084,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NEW_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("EX_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,2269,2319,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            Type-2 Reserves protect ");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("            This Type-2 Protected Area protects");_.b("\n");};_.b("            <strong>");_.b(_.v(_.f("habitatsInTypeTwoCount",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("habitatsCount",c,p,0)));_.b("</strong> habitat types.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<!-- ");_.b("\n" + i);_.b("PDF says for both zones and collections. ");_.b("\n" + i);_.b("I just included collections for now  ");_.b("\n" + i);_.b("-->");_.b("\n" + i);if(_.s(_.f("hasRepresentationData",c,p,1),c,p,0,2775,3712,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitats</th>");_.b("\n" + i);_.b("        <th>Total HA Protected in All Areas</th>");_.b("\n" + i);_.b("        <th>Total % in All Areas</th>");_.b("\n" + i);_.b("        <th>Number of Sites Protected</th>");_.b("\n" + i);_.b("        <th>Adequately Represented?</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("representationData",c,p,1),c,p,0,3166,3335,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_SIZE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("REP_COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>??</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"5\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);_.b("\n" + i);_.b("            <strong>");_.b(_.v(_.f("representedCount",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("habitatsCount",c,p,0)));_.b("</strong> habitats are adequately ");_.b("\n" + i);_.b("            protected.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasSensitiveAreas",c,p,1),c,p,0,3762,4272,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Sensitive Habitats</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Type</th>");_.b("\n" + i);_.b("        <th>Hectares Protected</th>");_.b("\n" + i);_.b("        <th>Percent of Area Protected</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("sensitiveAreas",c,p,1),c,p,0,4071,4221,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SA_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SA_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasProtectedMammals",c,p,1),c,p,0,4320,4754,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Protected Mammals</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Status</th>");_.b("\n" + i);_.b("        <th>Number of Overlapping Areas</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("protectedMammals",c,p,1),c,p,0,4598,4701,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>--</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Count",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasSeabirdBreedingSites",c,p,1),c,p,0,4808,5238,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Seabirds</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Status</th>");_.b("\n" + i);_.b("        <th>Number of Breeding Sites</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("seabirdBreedingSites",c,p,1),c,p,0,5078,5181,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>--</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Count",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("hasShorebirdSites",c,p,1),c,p,0,5291,5710,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Seabirds</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Status</th>");_.b("\n" + i);_.b("        <th>Number of Shorebird Sites</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("shorebirdSites",c,p,1),c,p,0,5556,5659,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>--</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Count",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("adjacentProtectedAreas",c,p,1),c,p,0,5779,5977,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Adjacent Terrestrial Protected Area</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    This zone is adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}};_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Nutrient Recycling</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Value</th>");_.b("\n" + i);_.b("        <th>Area in Hectares</th>");_.b("\n" + i);_.b("        <th>Percent</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("nutrientRecycling",c,p,1),c,p,0,6293,6409,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Class",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("AreaInHa",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Biogenic Habitat</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Value</th>");_.b("\n" + i);_.b("        <th>Area in Hectares</th>");_.b("\n" + i);_.b("        <th>Percent</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("biogenicHabitat",c,p,1),c,p,0,6732,6848,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Class",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("AreaInHa",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Ecosystem Productivity</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Value</th>");_.b("\n" + i);_.b("        <th>Area in Hectares</th>");_.b("\n" + i);_.b("        <th>Percent</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("ecosystemProductivity",c,p,1),c,p,0,7179,7295,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Class",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("AreaInHa",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large ");if(_.s(_.f("SIZE_OK",c,p,1),c,p,0,375,386,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("green-check");});c.pop();}_.b("\">");_.b("\n" + i);_.b("    <!-- Notice, using mustache tags here to test whether we're rendering a ");_.b("\n" + i);_.b("    collection or a single zone -->");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,535,657,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    The average size of the <strong>");_.b(_.v(_.f("NUM_PROTECTED",c,p,0)));_.b("</strong> protected ");_.b("\n" + i);_.b("    areas is <strong>");_.b(_.v(_.f("SIZE",c,p,0)));_.b(" ha</strong>,");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("    This protected area is <strong>");_.b(_.v(_.f("SIZE",c,p,0)));_.b(" ha</strong>,");_.b("\n");};if(_.s(_.f("SIZE_OK",c,p,1),c,p,0,792,840,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    meeting the target of ");_.b(_.v(_.f("MIN_SIZE",c,p,0)));_.b(" ha.");_.b("\n");});c.pop();}if(!_.s(_.f("SIZE_OK",c,p,1),c,p,1,0,0,"")){_.b("    which does not meet the target of ");_.b(_.v(_.f("MIN_SIZE",c,p,0)));_.b(" ha.");_.b("\n");};_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p style=\"font-size:12px;padding:11px;text-align:left;margin-top:-10px;\">For the same amount of area to be protected, it is desirable to protect fewer, larger areas rather than numerous smaller ones.</p>");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,1200,1550,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\" style=\"padding:0px 10px;padding-bottom:10px;\">");_.b("\n" + i);_.b("      The selected network contains <strong>");_.b(_.v(_.f("MARINE_RESERVES",c,p,0)));_.b(" Marine");_.b("\n" + i);_.b("      Reserve");if(_.s(_.f("MARINE_RESERVES_PLURAL",c,p,1),c,p,0,1380,1381,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> and ");_.b("\n" + i);_.b("      <strong>");_.b(_.v(_.f("TYPE_TWO_MPAS",c,p,0)));_.b(" Type 2 Protection Area");if(_.s(_.f("TYPE_TWO_MPAS_PLURAL",c,p,1),c,p,0,1502,1503,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong>.");_.b("\n" + i);_.b("    </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Representation of Habitats</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\"></th>");_.b("\n" + i);_.b("        <th>In Proposed Areas</th>");_.b("\n" + i);_.b("        <th>In Existing Areas</th>");_.b("\n" + i);_.b("        <th>Combined</th>");_.b("\n" + i);_.b("        <th>Total </th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td>Number of Habitats Protected</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_PROPOSED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_EXISTING",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_COMBINED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_TOTAL",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"5\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,2333,2399,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            New and existing Marine Reserves protect");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("            This Marine Reserve protects");_.b("\n");};_.b("            <strong>");_.b(_.v(_.f("HAB_COUNT_COMBINED",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("HAB_COUNT_TOTAL",c,p,0)));_.b("</strong> habitat types.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Percent of Hauraki Gulf Marine Park Protected</h4>");_.b("\n" + i);_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\"></th>");_.b("\n" + i);_.b("        <th>In Proposed Areas (%)</th>");_.b("\n" + i);_.b("        <th>In Existing Areas (%)</th>");_.b("\n" + i);_.b("        <th>Combined (%)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td>In Marine Reserves</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_MR_NEW",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_MR_EXISTING",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_MR_COMBINED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td>In Type 2 Protection Areas</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_T2_NEW",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_T2_EXISTING",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_T2_COMBINED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">This table shows how ‘comprehensive’ the proposed protection");if(_.s(_.f("isCollection",c,p,1),c,p,0,3663,3668,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" is");};_.b(". ");_.b("\n" + i);_.b("            Proposed and existing plans protect these percentages of the total areas.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!-- ");_.b("\n" + i);_.b("I'm leaving these items commented out because they seem hard to implement");_.b("\n" + i);_.b("and duplicative. It's also not clear how they would look at the zone-level.");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection representation\">");_.b("\n" + i);_.b("  <h4>Representation of Habitats</h4>");_.b("\n" + i);_.b("  <p>The proposed protection areas and existing reserves protect a sample of the following number of habitats:</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection percent\">");_.b("\n" + i);_.b("  <h4>Percent of Hauraki Gulf Marine Park Protected</h4>");_.b("\n" + i);_.b("  <p>The graph belows shows how ‘comprehensive’ the proposed protection is. The proposed plan includes the following protection types:</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b(" -->");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,4508,4632,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[12])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L19lbXB0eS5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRSZXN1bHRzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvc2NyaXB0cy9hY3Rpdml0aWVzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvc2NyaXB0cy9hcnJheS5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL3NjcmlwdHMvZW52aXJvbm1lbnQuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi9zY3JpcHRzL2Zpc2hlcmllcy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL3NjcmlwdHMvb3ZlcnZpZXcuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxHQUFZO0NBRFosQ0FFQSxDQUFBLEdBQU07QUFDQyxDQUFQLENBQUEsQ0FBQSxDQUFBO0NBQ0UsRUFBQSxDQUFBLEdBQU8scUJBQVA7Q0FDQSxTQUFBO0lBTEY7Q0FBQSxDQU1BLENBQVcsQ0FBQSxJQUFYLGFBQVc7Q0FFWDtDQUFBLE1BQUEsb0NBQUE7d0JBQUE7Q0FDRSxFQUFXLENBQVgsR0FBVyxDQUFYO0NBQUEsRUFDUyxDQUFULEVBQUEsRUFBaUIsS0FBUjtDQUNUO0NBQ0UsRUFBTyxDQUFQLEVBQUEsVUFBTztDQUFQLEVBQ08sQ0FBUCxDQURBLENBQ0E7QUFDK0IsQ0FGL0IsQ0FFOEIsQ0FBRSxDQUFoQyxFQUFBLEVBQVEs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LEVBQUw7Q0FIRixDQUlFLE9BSkYsQ0FJRTtDQUpGLENBS1MsS0FBUCxHQUFBLEdBTEY7VUFSTztDQUhULE9BQUE7Q0FBQSxDQW9CTSxDQUFGLEVBQVEsQ0FBWixFQUNVO0NBckJWLENBd0JVLENBQUYsRUFBUixDQUFBO0NBeEJBLENBNEJrQixDQUFBLENBSGxCLENBQUssQ0FBTCxDQUFBLEVBQUEsRUFBQTtDQUd5QixFQUFFLEVBQUYsVUFBQTtDQUh6QixDQUlpQixDQUFBLENBSmpCLEdBR2tCLEVBQ0E7Q0FBa0IsRUFBRCxJQUFDLENBQVosT0FBQTtDQUp4QixFQU1VLENBTlYsRUFBQSxDQUlpQixFQUVOO0NBQU8sY0FBRDtDQU5qQixNQU1VO0NBRUosQ0FHVyxDQUNBLENBSmpCLENBQUssQ0FBTCxDQUFBLEVBQUEsSUFBQTtDQUl3QixFQUFPLFlBQVA7Q0FKeEIsRUFLUSxDQUxSLEdBSWlCLEVBQ1I7Q0FBRCxjQUFPO0NBTGYsTUFLUTtNQXpDSDtDQTNGVCxFQTJGUzs7Q0EzRlQ7O0NBRndCOztBQXlJMUIsQ0FsSkEsRUFrSmlCLEdBQVgsQ0FBTixJQWxKQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3IgXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT4gXG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZCAgICAgICAgXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBpZiBfLmlzQXJyYXkgQGRhdGEudmFsdWVcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlWzBdXG4gICAgICBlbHNlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVxuICAgIF8ubWFwIGRhdGEuZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgY29uc29sZS5sb2cgQGRhdGFcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3IFxuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIHN1cGVyKClcbiAgXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgdG90YWwgPSAobmV3IERhdGUoQG1heEV0YSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoQGV0YVN0YXJ0KS5nZXRUaW1lKCkpIC8gMTAwMFxuICAgICAgbGVmdCA9IChuZXcgRGF0ZShAbWF4RXRhKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZSgpLmdldFRpbWUoKSkgLyAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAobGVmdCArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje2xlZnQgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGEnKVxuICAgICAgICBpZiAhbWF4RXRhIG9yIGpvYi5nZXQoJ2V0YScpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAZXRhU3RhcnQgPSBuZXcgRGF0ZSgpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT4gXG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG4gICAgICBcbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKSAgICBcbiAgICAgICAgICAkdGFibGUucmVtb3ZlKClcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MgJ3RhYmxlQ29udGFpbmVyJ1xuICAgICAgICAgIHBhcmVudC5hcHBlbmQgXCI8cD4je25vUm93c01lc3NhZ2V9PC9wPlwiXG5cbiAgZW5hYmxlTGF5ZXJUb2dnbGVyczogKCkgLT5cbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCw4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIixjLHAsXCIgICAgXCIpKTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvZ2VuZXJpY0F0dHJpYnV0ZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTsiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5NSU5fU0laRSA9IDEwMDAwXG5cbmNsYXNzIEFjdGl2aXRpZXNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgIyB0aGlzIGlzIHRoZSBuYW1lIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIFRhYlxuICBuYW1lOiAnQWN0aXZpdGllcydcbiAgY2xhc3NOYW1lOiAnYWN0aXZpdGllcydcbiAgdGltZW91dDogMTIwMDAwXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYWN0aXZpdGllc1xuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnT3ZlcmxhcFdpdGhBcXVhY3VsdHVyZSdcbiAgICAnT3ZlcmxhcFdpdGhFeGlzdGluZ1VzZXMnXG4gICAgJ092ZXJsYXBXaXRoTW9vcmluZ3NBbmRBbmNob3JhZ2VzJ1xuICAgICdPdmVybGFwV2l0aFJlY3JlYXRpb25hbFVzZXMnXG4gIF1cblxuXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuICAgIGFxdWFjdWx0dXJlID0gQHJlY29yZFNldCgnT3ZlcmxhcFdpdGhBcXVhY3VsdHVyZScsICdPdmVybGFwV2l0aEFxdWFjdWx0dXJlJykudG9BcnJheSgpXG4gICAgZXhpc3RpbmdVc2VzID0gQHJlY29yZFNldCgnT3ZlcmxhcFdpdGhFeGlzdGluZ1VzZXMnLCAnT3ZlcmxhcFdpdGhFeGlzdGluZ1VzZXMnKS50b0FycmF5KClcbiAgICBvdmVybGFwV2l0aE1vb3JpbmdzQW5kQW5jaG9yYWdlcyA9IEByZWNvcmRTZXQoJ092ZXJsYXBXaXRoTW9vcmluZ3NBbmRBbmNob3JhZ2VzJywgJ092ZXJsYXBXaXRoTW9vcmluZ3NBbmRBbmNob3JhZ2VzJykuYm9vbCgnT1ZFUkxBUFMnKVxuICAgIHJlY3JlYXRpb25hbFVzZXMgPSBAcmVjb3JkU2V0KCdPdmVybGFwV2l0aFJlY3JlYXRpb25hbFVzZXMnLCAnT3ZlcmxhcFdpdGhSZWNyZWF0aW9uYWxVc2VzJykudG9BcnJheSgpXG4gICAgY29udGV4dCA9XG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgYXF1YWN1bHR1cmU6IGFxdWFjdWx0dXJlXG4gICAgICBhcXVhY3VsdHVyZUNvdW50OiBhcXVhY3VsdHVyZT8ubGVuZ3RoXG4gICAgICBleGlzdGluZ1VzZXM6IGV4aXN0aW5nVXNlc1xuICAgICAgaGFzRXhpc3RpbmdVc2VDb25mbGljdHM6IGV4aXN0aW5nVXNlcz8ubGVuZ3RoID4gMFxuICAgICAgb3ZlcmxhcFdpdGhNb29yaW5nc0FuZEFuY2hvcmFnZXM6IG92ZXJsYXBXaXRoTW9vcmluZ3NBbmRBbmNob3JhZ2VzXG4gICAgICByZWNyZWF0aW9uYWxVc2VzOiByZWNyZWF0aW9uYWxVc2VzXG4gICAgICBoYXNSZWNyZWF0aW9uYWxVc2VDb25mbGljdHM6IHJlY3JlYXRpb25hbFVzZXM/Lmxlbmd0aCA+IDBcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlVGFibGVQYWdpbmcoKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFjdGl2aXRpZXNUYWIiLCJPdmVydmlld1RhYiA9IHJlcXVpcmUgJy4vb3ZlcnZpZXcuY29mZmVlJ1xuRW52aXJvbm1lbnRUYWIgPSByZXF1aXJlICcuL2Vudmlyb25tZW50LmNvZmZlZSdcbkZpc2hlcmllc1RhYiA9IHJlcXVpcmUgJy4vZmlzaGVyaWVzLmNvZmZlZSdcbkFjaXRpdml0aWVzVGFiID0gcmVxdWlyZSAnLi9hY3Rpdml0aWVzLmNvZmZlZSdcblxud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbT3ZlcnZpZXdUYWIsIEVudmlyb25tZW50VGFiLCBGaXNoZXJpZXNUYWIsIEFjdGl2aXRpZXNUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcHJvdGVjdGlvblpvbmUuY3NzJ11cbiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEVudmlyb25tZW50VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdFbnZpcm9ubWVudCdcbiAgY2xhc3NOYW1lOiAnZW52aXJvbm1lbnQnXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmhhYml0YXRcbiAgZGVwZW5kZW5jaWVzOiBbJ0hhYml0YXRDb21wcmVoZW5zaXZlbmVzcycsICdOZWFyVGVycmVzdHJpYWxQcm90ZWN0ZWQnLCAnRWNvc3lzdGVtU2VydmljZXMnLCAnU2Vuc2l0aXZlQXJlYXMnLCAnUHJvdGVjdGVkQW5kVGhyZWF0ZW5lZFNwZWNpZXMnXVxuICAjIFdpbGwgbGlrZWx5IGJlIGV4dGVuZGVkIGluIHRoZSBmdXR1cmUgdG8gc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgIyBkZXBlbmRlbmNpZXM6IFtcbiAgIyAgICdIYWJpdGF0J1xuICAjICAgJ1JlcHJlc2VudGF0aW9uJ1xuICAjICAgJ0FkamFjZW50UHJvdGVjdGVkQXJlYXMnXG4gICMgXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBoYWJpdGF0cyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb21wcmVoZW5zaXZlbmVzcycsICdIYWJpdGF0Q29tcHJlaGVuc2l2ZW5lc3MnKS50b0FycmF5KClcbiAgICBlY29zeXN0ZW1fcHJvZHVjdGl2aXR5ID0gQHJlY29yZFNldCgnRWNvc3lzdGVtU2VydmljZXMnLCAnRWNvc3lzdGVtUHJvZHVjdGl2aXR5JykudG9BcnJheSgpXG4gICAgbnV0cmllbnRfcmVjeWNsaW5nID0gQHJlY29yZFNldCgnRWNvc3lzdGVtU2VydmljZXMnLCAnTnV0cmllbnRSZWN5Y2xpbmcnKS50b0FycmF5KClcbiAgICBiaW9nZW5pY19oYWJpdGF0ID0gQHJlY29yZFNldCgnRWNvc3lzdGVtU2VydmljZXMnLCAnQmlvZ2VuaWNIYWJpdGF0JykudG9BcnJheSgpXG4gICAgbmVhcl90ZXJyZXN0cmlhbF9wcm90ZWN0ZWQgPSBAcmVjb3JkU2V0KCdOZWFyVGVycmVzdHJpYWxQcm90ZWN0ZWQnLCAnTmVhclRlcnJlc3RyaWFsUHJvdGVjdGVkJykuYm9vbCgnQWRqYWNlbnQnKVxuXG4gICAgc2Vuc2l0aXZlQXJlYXMgPSBAcmVjb3JkU2V0KCdTZW5zaXRpdmVBcmVhcycsICdTZW5zaXRpdmVBcmVhcycpLnRvQXJyYXkoKVxuICAgIHNlbnNpdGl2ZUFyZWFzID0gXy5zb3J0Qnkgc2Vuc2l0aXZlQXJlYXMsIChyb3cpIC0+IHBhcnNlRmxvYXQocm93LlBFUkNfQVJFQSlcbiAgICBzZW5zaXRpdmVBcmVhcy5yZXZlcnNlKClcbiAgICBcbiAgICBcbiAgICBoYWJpdGF0c0luUmVzZXJ2ZXMgPSBfLmZpbHRlciBoYWJpdGF0cywgKHJvdykgLT5cbiAgICAgIHJvdy5NUEFfVFlQRSBpcyAnTVBBMScgXG4gICAgaGFiaXRhdHNJblJlc2VydmVzID0gXy5zb3J0QnkgaGFiaXRhdHNJblJlc2VydmVzLCAocm93KSAtPiBwYXJzZUZsb2F0KHJvdy5ORVdfUEVSQylcbiAgICBoYWJpdGF0c0luUmVzZXJ2ZXMucmV2ZXJzZSgpXG5cbiAgICBoYWJpdGF0c0luVHlwZVR3b3MgPSBfLmZpbHRlciBoYWJpdGF0cywgKHJvdykgLT5cbiAgICAgIHJvdy5NUEFfVFlQRSBpcyAnTVBBMicgXG4gICAgaGFiaXRhdHNJblR5cGVUd29zID0gXy5zb3J0QnkgaGFiaXRhdHNJblR5cGVUd29zLCAocm93KSAtPiBwYXJzZUZsb2F0KHJvdy5ORVdfUEVSQylcbiAgICBoYWJpdGF0c0luVHlwZVR3b3MucmV2ZXJzZSgpXG5cbiAgICByZXByZXNlbnRhdGlvbkRhdGEgPSBfLmZpbHRlciBoYWJpdGF0cywgKHJvdykgLT5cbiAgICAgIHJvdy5NUEFfVFlQRSBpcyAnQUxMX1RZUEVTJyBcbiAgICByZXByZXNlbnRhdGlvbkRhdGEgPSBfLnNvcnRCeSByZXByZXNlbnRhdGlvbkRhdGEsIChyb3cpIC0+IHBhcnNlRmxvYXQocm93LkNCX1BFUkMpXG4gICAgcmVwcmVzZW50YXRpb25EYXRhLnJldmVyc2UoKVxuXG4gICAgcHJvdGVjdGVkTWFtbWFscyA9IEByZWNvcmRTZXQoJ1Byb3RlY3RlZEFuZFRocmVhdGVuZWRTcGVjaWVzJywgJ01hbW1hbHMnKS50b0FycmF5KClcbiAgICBwcm90ZWN0ZWRNYW1tYWxzID0gXy5zb3J0QnkgcHJvdGVjdGVkTWFtbWFscywgKHJvdykgLT4gcGFyc2VJbnQocm93LkNvdW50KVxuICAgIHByb3RlY3RlZE1hbW1hbHMucmV2ZXJzZSgpXG5cbiAgICBzZWFiaXJkQnJlZWRpbmdTaXRlcyA9IEByZWNvcmRTZXQoJ1Byb3RlY3RlZEFuZFRocmVhdGVuZWRTcGVjaWVzJywgJ1NlYWJpcmRCcmVlZGluZ1NpdGVzJykudG9BcnJheSgpXG4gICAgc2VhYmlyZEJyZWVkaW5nU2l0ZXMgPSBfLnNvcnRCeSBzZWFiaXJkQnJlZWRpbmdTaXRlcywgKHJvdykgLT4gcGFyc2VJbnQocm93LkNvdW50KVxuICAgIHNlYWJpcmRCcmVlZGluZ1NpdGVzLnJldmVyc2UoKVxuXG4gICAgc2hvcmViaXJkU2l0ZXMgPSBAcmVjb3JkU2V0KCdQcm90ZWN0ZWRBbmRUaHJlYXRlbmVkU3BlY2llcycsICdTaG9yZWJpcmRQb2ludHMnKS50b0FycmF5KClcbiAgICBzaG9yZWJpcmRTaXRlcyA9IF8uc29ydEJ5IHNob3JlYmlyZFNpdGVzLCAocm93KSAtPiBwYXJzZUludChyb3cuQ291bnQpXG4gICAgc2hvcmViaXJkU2l0ZXMucmV2ZXJzZSgpXG5cbiAgICAjIFRoZSBwcmVjZWVkaW5nIGlzIG9mIGNvdXJzZSwgdGhlIHdyb25nIHdheSB0byBkbyB0aGlzLiBJIGhhdmUgbm8gaWRlYVxuICAgICMgaG93IERhbiBpbnRlbmRzIHRvIHJlcHJlc2VudCB0aGUgaGFiaXRhdCBudW1iZXJzIGZvciBlYWNoIG9mIHRoZXNlLiBcbiAgICAjIExldHMgc2F5IHRoZXJlIGlzIGFuIGF0dHJpYnV0ZSBmb3IgZWFjaCBmZWF0dXJlIGluIHRoZSBzZXQgdGhhdCBpc1xuICAgICMgTVBBX1RZUEUgKHNvIHRoZXJlIGFyZSB0d28gcm93cyBwZXIgaGFiaXRhdCkuIFRoaXMgaXMgaG93IEkgd291bGQgc3BsaXRcbiAgICAjIHRoZSBkYXRhIHVwIGluIHRoYXQgY2FzZTpcbiAgICAjICAgXG4gICAgIyAgIGhhYml0YXRzID0gQHJlY29yZFNldCgnSGFiaXRhdCcsICdIYWJpdGF0cycpXG4gICAgIyAgIGhhYml0YXRzSW5SZXNlcnZlcyA9IF8uZmlsdGVyIGhhYml0YXRzLCAocm93KSAtPlxuICAgICMgICAgIHJvdy5NUEFfVFlQRSBpcyAnTVBBMScgXG4gICAgIyAgIGhhYml0YXRzSW5UeXBlVHdvcyA9IF8uZmlsdGVyIGhhYml0YXRzLCAocm93KSAtPlxuICAgICMgICAgIHJvdy5NUEFfVFlQRSBpcyAnTVBBMicgXG4gICAgIyBcbiAgICAjIElmIGluc3RlYWQgdGhlIGRhdGEgaXMgaW5zdGVhZCBzcGxpdCBpbnRvIG11bHRpcGxlIGZlYXR1cmVzZXRzICh3aXRoIFxuICAgICMgdGhlIHNhbWUgcGFyYW1OYW1lKSwgdGhlbiBpdCBnZXRzIG1vcmUgY29tcGxpY2F0ZWQuIFlvdSdkIG5lZWQgdG8gYWNjZXNzXG4gICAgIyB0aGUgcmVzcG9uc2UgZGF0YSB2aWEgQHJlY29yZFNldCgnSGFiaXRhdCcsICdIYWJpdGF0cycpLnZhbHVlIGFuZCBwaWNrXG4gICAgIyBvdXQgdGhlIGFwcHJvcHJpYXRlIGZlYXR1cmVTZXRzIGZvciBlYWNoIHR5cGUuIE1heWJlIHNvbWV0aGluZyBsaWtlIFxuICAgICMgdGhpczpcbiAgICAjIFxuICAgICMgICByZWNvcmRTZXQgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRzJylcbiAgICAjICAgY29uc29sZS5sb2cgcmVjb3JkU2V0LnZhbHVlICMgcmVtZW1iZXIgdG8gdXNlIHRoaXMgdG8gZGVidWdcbiAgICAjICAgZmVhdHVyZVNldCA9IF8uZmluZCByZWNvcmRTZXQudmFsdWUsIChmcykgLT5cbiAgICAjICAgICBmcy5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzWydNUEFfVFlQRSddIGlzICdNUEExJ1xuICAgICMgICBoYWJpdGF0c0luUmVzZXJ2ZXMgPSBfLm1hcCBmZWF0dXJlU2V0LmZlYXR1cmVzLCAoZikgLT4gZi5hdHRyaWJ1dGVzXG4gICAgIyAgIC4uLiBhbmQgcmVwZWF0IGZvciBUeXBlLUlJIE1QQXNcbiAgICAjIFxuICAgIGhhc1R5cGVUd29EYXRhID0gaGFiaXRhdHNJblR5cGVUd29zLmxlbmd0aCA+IDBcblxuICAgIGNvbnRleHQgPVxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgICNmaXggdGhpcyB0byBnZXQgcmlkIG9mIGhhcmRjb2RlZCB2YWx1ZVxuICAgICAgaGFiaXRhdHNDb3VudDogNjJcbiAgICAgIGhhc1Jlc2VydmVEYXRhOiBoYWJpdGF0c0luUmVzZXJ2ZXM/Lmxlbmd0aCA+IDBcbiAgICAgIGhhYml0YXRzSW5SZXNlcnZlczogaGFiaXRhdHNJblJlc2VydmVzXG4gICAgICBoYWJpdGF0c0luUmVzZXJ2ZXNDb3VudDogaGFiaXRhdHNJblJlc2VydmVzPy5sZW5ndGhcbiAgICAgICNoYWJpdGF0c0luUmVzZXJ2ZXNDb3VudDogXy5maWx0ZXIoaGFiaXRhdHNJblJlc2VydmVzLCAocm93KSAtPiBcbiAgICAgICMgICMgTmVlZCB0byBjb21lIHVwIHdpdGggc29tZSBvdGhlciBzdGFuZGFyZCB0aGF0IGp1c3QgcHJlc2VuY2U/XG4gICAgICAjICByb3cuQ0JfUEVSQyA+IDBcbiAgICAgICMpLmxlbmd0aFxuXG4gICAgICBoYXNUeXBlVHdvRGF0YTogaGFzVHlwZVR3b0RhdGFcbiAgICAgIGhhYml0YXRzSW5UeXBlVHdvQ291bnQ6IGhhYml0YXRzSW5UeXBlVHdvcz8ubGVuZ3RoXG4gICAgICBoYWJpdGF0c0luVHlwZVR3b3M6IGhhYml0YXRzSW5UeXBlVHdvc1xuXG4gICAgICAjaGFiaXRhdHNJblR5cGVUd29zQ291bnQ6IF8uZmlsdGVyKGhhYml0YXRzSW5UeXBlVHdvcywgKHJvdykgLT4gXG4gICAgICAgICMgTmVlZCB0byBjb21lIHVwIHdpdGggc29tZSBvdGhlciBzdGFuZGFyZCB0aGF0IGp1c3QgcHJlc2VuY2U/XG4gICAgICAjICByb3cuQ0JfUEVSQyA+IDBcbiAgICAgICMpLmxlbmd0aFxuICAgICAgIyByZXByZXNlbnRhdGlvbkRhdGE6IEByZWNvcmRTZXQoJ1JlcHJlc2VudGF0aW9uJywgJ1JlcHJlc2VudGF0aW9uJylcbiAgICAgICMgICAudG9BcnJheSgpXG4gICAgICByZXByZXNlbnRhdGlvbkRhdGE6cmVwcmVzZW50YXRpb25EYXRhXG4gICAgICBoYXNSZXByZXNlbnRhdGlvbkRhdGE6cmVwcmVzZW50YXRpb25EYXRhPy5sZW5ndGggPiAwXG4gICAgICByZXByZXNlbnRlZENvdW50OnJlcHJlc2VudGF0aW9uRGF0YT8ubGVuZ3RoXG4gICAgICAjcmVwcmVzZW50ZWRDb3VudDpfLmZpbHRlcihyZXByZXNlbnRhdGlvbkRhdGEsIChyb3cpIC0+IFxuICAgICAgICAjIE5lZWQgdG8gY29tZSB1cCB3aXRoIHNvbWUgb3RoZXIgc3RhbmRhcmQgdGhhdCBqdXN0IHByZXNlbmNlP1xuICAgICAgIyAgcm93LkNCX1BFUkMgPiAwXG4gICAgICAjKS5sZW5ndGhcblxuICAgICAgIyBVc2Ugc29tZXRoaW5nIGxpa2UgdGhpcyBmb3IgcmVwcmVzZW50ZWRDb3VudCB3aGVuIHlvdSBoYXZlIHJlYWwgZGF0YTpcbiAgICAgICMgXy5maWx0ZXIocmVwcmVzZW50YXRpb25EYXRhLCAocm93KSAtPlxuICAgICAgIyAgIHJvdy5Qcm90ZWN0ZWQgaXMgJ1llcydcbiAgICAgICMgKS5sZW5ndGhcbiAgICAgIGFkamFjZW50UHJvdGVjdGVkQXJlYXM6IG5lYXJfdGVycmVzdHJpYWxfcHJvdGVjdGVkICMgUGxhY2Vob2xkZXJcbiAgICAgICMgV291bGQgbmVlZCB0byBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUgdG8gc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgICAgICMgYWRqYWNlbnRQcm90ZWN0ZWRBcmVhczogQHJlY29yZFNldCgnQWRqYWNlbnRQcm90ZWN0ZWRBcmVhcycsIFxuICAgICAgIyAgICdhZGphY2VudCcpLmJvb2woJ0FOWV9BREpBQ0VOVCcpXG5cbiAgICAgIG51dHJpZW50UmVjeWNsaW5nOiBudXRyaWVudF9yZWN5Y2xpbmdcbiAgICAgIGJpb2dlbmljSGFiaXRhdDogYmlvZ2VuaWNfaGFiaXRhdFxuXG4gICAgICBlY29zeXN0ZW1Qcm9kdWN0aXZpdHk6IGVjb3N5c3RlbV9wcm9kdWN0aXZpdHlcbiAgICAgIHNlbnNpdGl2ZUFyZWFzOiBzZW5zaXRpdmVBcmVhcyBcbiAgICAgIGhhc1NlbnNpdGl2ZUFyZWFzOiBzZW5zaXRpdmVBcmVhcz8ubGVuZ3RoID4gMFxuXG4gICAgICBwcm90ZWN0ZWRNYW1tYWxzOnByb3RlY3RlZE1hbW1hbHNcbiAgICAgIGhhc1Byb3RlY3RlZE1hbW1hbHM6cHJvdGVjdGVkTWFtbWFscz8ubGVuZ3RoID4gMFxuXG4gICAgICBzZWFiaXJkQnJlZWRpbmdTaXRlczpzZWFiaXJkQnJlZWRpbmdTaXRlc1xuICAgICAgaGFzU2VhYmlyZEJyZWVkaW5nU2l0ZXM6c2VhYmlyZEJyZWVkaW5nU2l0ZXM/Lmxlbmd0aCA+IDBcblxuICAgICAgc2hvcmViaXJkU2l0ZXM6c2hvcmViaXJkU2l0ZXNcbiAgICAgIGhhc1Nob3JlYmlyZFNpdGVzOnNob3JlYmlyZFNpdGVzPy5sZW5ndGggPiAwXG5cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlVGFibGVQYWdpbmcoKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxubW9kdWxlLmV4cG9ydHMgPSBFbnZpcm9ubWVudFRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5fcGFydGlhbHMgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEZpc2hlcmllc1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdGaXNoZXJpZXMnXG4gIGNsYXNzTmFtZTogJ2Zpc2hlcmllcydcbiAgdGltZW91dDogMTIwMDAwXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZmlzaGVyaWVzXG4gICMgRGVwZW5kZW5jaWVzIHdpbGwgbGlrZWx5IG5lZWQgdG8gYmUgY2hhbmdlZCB0byBzb21ldGhpbmcgbGlrZSB0aGlzIHRvXG4gICMgc3VwcG9ydCBtb3JlIEdQIHNlcnZpY2VzOlxuICBkZXBlbmRlbmNpZXM6IFsnRmlzaGluZ1Rvb2wnXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBcbiAgICByZWNyZWF0aW9uYWxGaXNoaW5nID0gQHJlY29yZFNldCgnRmlzaGluZ1Rvb2wnLCAnUmVjcmVhdGlvbmFsRmlzaGluZycpLnRvQXJyYXkoKVxuICAgIGN1c3RvbWFyeUZpc2hpbmcgPSBAcmVjb3JkU2V0KCdGaXNoaW5nVG9vbCcsICdDdXN0b21hcnlGaXNoaW5nJykudG9BcnJheSgpXG4gICAgY29tbWVyY2lhbEZpc2hpbmcgPSBAcmVjb3JkU2V0KCdGaXNoaW5nVG9vbCcsICdDb21tZXJjaWFsRmlzaGluZycpLnRvQXJyYXkoKVxuICAgIGNvbnRleHQgPVxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgY29tbWVyY2lhbEZpc2hpbmc6IGNvbW1lcmNpYWxGaXNoaW5nXG4gICAgICByZWNyZWF0aW9uYWxGaXNoaW5nOiByZWNyZWF0aW9uYWxGaXNoaW5nXG4gICAgICBjdXN0b21hcnlGaXNoaW5nOiBjdXN0b21hcnlGaXNoaW5nXG4gICAgICB0b3RhbEZvb2Q6IFtdXG5cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpc2hlcmllc1RhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5fcGFydGlhbHMgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbk1JTl9TSVpFID0gMTAwMDBcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgIyB0aGlzIGlzIHRoZSBuYW1lIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIFRhYlxuICBuYW1lOiAnT3ZlcnZpZXcnXG4gIGNsYXNzTmFtZTogJ292ZXJ2aWV3J1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnVGFyZ2V0U2l6ZSdcbiAgICAnSGFiaXRhdENvdW50J1xuICAgICdIYWJpdGF0Q291bnRQZXJjZW50J1xuICBdXG4gICMgRGVwZW5kZW5jaWVzIHdpbGwgbGlrZWx5IG5lZWQgdG8gYmUgY2hhbmdlZCB0byBzb21ldGhpbmcgbGlrZSB0aGlzIHRvXG4gICMgc3VwcG9ydCBtb3JlIEdQIHNlcnZpY2VzOlxuICAjIGRlcGVuZGVuY2llczogW1xuICAjICAgJ1RhcmdldFNpemUnXG4gICMgICAnUmVwcmVzZW50YXRpb25PZkhhYml0YXRzJ1xuICAjICAgJ1BlcmNlbnRQcm90ZWN0ZWQnXG4gICMgXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICAjIFRoZSBAcmVjb3JkU2V0IG1ldGhvZCBjb250YWlucyBzb21lIHVzZWZ1bCBtZWFucyB0byBnZXQgZGF0YSBvdXQgb2YgXG4gICAgIyB0aGUgbW9uc3Rlcm91cyBSZWNvcmRTZXQganNvbi4gQ2hlY2tvdXQgdGhlIHNlYXNrZXRjaC1yZXBvcnRpbmctdGVtcGxhdGVcbiAgICAjIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICBIRUNUQVJFUyA9IEByZWNvcmRTZXQoJ1RhcmdldFNpemUnLCAnVGFyZ2V0U2l6ZScpLmZsb2F0KCdTSVpFX0lOX0hBJylcbiAgICAjIHJlc3VsdDogSlNPTi5zdHJpbmdpZnkoQHJlc3VsdHMuZ2V0KCdkYXRhJyksIG51bGwsICcgICcpXG4gICAgaGNfcHJvcG9zZWQgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnQnLCAnSGFiaXRhdENvdW50JykuZmxvYXQoJ1NFTF9IQUInKVxuICAgIGhjX2V4aXN0aW5nID0gQHJlY29yZFNldCgnSGFiaXRhdENvdW50JywgJ0hhYml0YXRDb3VudCcpLmZsb2F0KCdFWFNUX0hBQicpXG4gICAgaGNfY29tYmluZWQgPUByZWNvcmRTZXQoJ0hhYml0YXRDb3VudCcsICdIYWJpdGF0Q291bnQnKS5mbG9hdCgnQ01CRF9IQUInKVxuICAgIGhjX3RvdGFsID0gQHJlY29yZFNldCgnSGFiaXRhdENvdW50JywgJ0hhYml0YXRDb3VudCcpLmZsb2F0KCdUT1RfSEFCJylcblxuICAgIEhBQl9QRVJDX01SX05FVyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdOV19SRVNfUFJDJylcbiAgICBIQUJfUEVSQ19NUl9FWElTVElORyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdFWF9SRVNfUFJDJylcbiAgICBIQUJfUEVSQ19NUl9DT01CSU5FRCA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdDQl9SRVNfUFJDJylcblxuICAgIEhBQl9QRVJDX1QyX05FVyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdOV19IUEFfUFJDJylcbiAgICBIQUJfUEVSQ19UMl9FWElTVElORyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdFWF9IUEFfUFJDJylcbiAgICBIQUJfUEVSQ19UMl9DT01CSU5FRCA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdDQl9IUEFfUFJDJylcblxuXG4gICAgIyBJIHVzZSB0aGlzIGlzQ29sbGVjdGlvbiBmbGFnIHRvIGN1c3RvbWl6ZSB0aGUgZGlzcGxheS4gQW5vdGhlciBvcHRpb25cbiAgICAjIHdvdWxkIGJlIHRvIGhhdmUgdG90YWxseSBkaWZmZXJlbnQgVGFiIGltcGxlbWVudGF0aW9ucyBmb3Igem9uZXMgdnMgXG4gICAgIyBjb2xsZWN0aW9ucy4gSSBkaWRuJ3QgZG8gdGhhdCBoZXJlIHNpbmNlIHRoZXkgYXJlIHNvIHNpbWlsYXIuXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgaWYgaXNDb2xsZWN0aW9uXG4gICAgICAjIEBtb2RlbCBpcyB0aGUgY2xpZW50LXNpZGUgc2tldGNoIHJlcHJlc2VudGF0aW9uLCB3aGljaCBoYXMgc29tZVxuICAgICAgIyB1c2VmdWwsIGlmIHVuZG9jdW1lbnRlZCwgbWV0aG9kcyBsaWtlIGdldENoaWxkcmVuKCkuXG4gICAgICBjaGlsZHJlbiA9IEBtb2RlbC5nZXRDaGlsZHJlbigpXG4gICAgICAjIE5PVEU6IEknbSBkaXZpZGluZyBieSBhbGwgY2hpbGRyZW4gaGVyZS4gU2hvdWxkIHRoaXMgYmUgZmlsdGVyZWQgdG9cbiAgICAgICMgZXhjbHVkZSBBcXVhY3VsdHVyZSBhbmQgTW9vcmluZyBhcmVhcz8/XG4gICAgICBIRUNUQVJFUyA9IChIRUNUQVJFUyAvIGNoaWxkcmVuLmxlbmd0aCkudG9GaXhlZCgxKVxuICAgICAgXG4gICAgICBtYXJpbmVSZXNlcnZlcyA9IF8uZmlsdGVyIGNoaWxkcmVuLCAoY2hpbGQpIC0+IFxuICAgICAgICBjaGlsZC5nZXRBdHRyaWJ1dGUoJ01QQV9UWVBFJykgaXMgJ01QQTEnXG4gICAgICB0eXBlMk1QQXMgPSBfLmZpbHRlciBjaGlsZHJlbiwgKGNoaWxkKSAtPiBcbiAgICAgICAgY2hpbGQuZ2V0QXR0cmlidXRlKCdNUEFfVFlQRScpIGlzICdNUEEyJ1xuICAgIGNvbnRleHQgPVxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgU0laRTogSEVDVEFSRVNcbiAgICAgIFNJWkVfT0s6IEhFQ1RBUkVTID4gTUlOX1NJWkVcbiAgICAgIE1JTl9TSVpFOiBNSU5fU0laRVxuICAgICAgTUFSSU5FX1JFU0VSVkVTOiBtYXJpbmVSZXNlcnZlcz8ubGVuZ3RoXG4gICAgICBNQVJJTkVfUkVTRVJWRVNfUExVUkFMOiBtYXJpbmVSZXNlcnZlcz8ubGVuZ3RoICE9IDFcbiAgICAgIFRZUEVfVFdPX01QQVM6IHR5cGUyTVBBcz8ubGVuZ3RoXG4gICAgICBUWVBFX1RXT19NUEFTX1BMVVJBTDogdHlwZTJNUEFzPy5sZW5ndGggIT0gMVxuICAgICAgTlVNX1BST1RFQ1RFRDogbWFyaW5lUmVzZXJ2ZXM/Lmxlbmd0aCArIHR5cGUyTVBBcz8ubGVuZ3RoXG4gICAgICBIQUJfQ09VTlRfUFJPUE9TRUQ6IGhjX3Byb3Bvc2VkXG4gICAgICBIQUJfQ09VTlRfRVhJU1RJTkc6IGhjX2V4aXN0aW5nXG4gICAgICBIQUJfQ09VTlRfQ09NQklORUQ6IGhjX2NvbWJpbmVkXG4gICAgICBIQUJfQ09VTlRfVE9UQUw6IGhjX3RvdGFsXG4gICAgICBIQUJfUEVSQ19NUl9ORVc6IEhBQl9QRVJDX01SX05FV1xuICAgICAgSEFCX1BFUkNfTVJfRVhJU1RJTkc6IEhBQl9QRVJDX01SX0VYSVNUSU5HXG4gICAgICBIQUJfUEVSQ19NUl9DT01CSU5FRDogSEFCX1BFUkNfTVJfQ09NQklORURcbiAgICAgIEhBQl9QRVJDX1QyX05FVzogSEFCX1BFUkNfVDJfTkVXXG4gICAgICBIQUJfUEVSQ19UMl9FWElTVElORzogSEFCX1BFUkNfVDJfRVhJU1RJTkdcbiAgICAgIEhBQl9QRVJDX1QyX0NPTUJJTkVEOiBIQUJfUEVSQ19UMl9DT01CSU5FRFxuXG4gICAgIyBAdGVtcGxhdGUgaXMgL3RlbXBsYXRlcy9vdmVydmlldy5tdXN0YWNoZVxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgICMgSWYgdGhlIG1lYXN1cmUgaXMgdG9vIGhpZ2gsIHRoZSB2aXN1YWxpemF0aW9uIGp1c3QgbG9va3Mgc3R1cGlkXG4gICAgaWYgSEVDVEFSRVMgPCBNSU5fU0laRSAqIDJcbiAgICAgIEBkcmF3Vml6KEhFQ1RBUkVTKVxuICAgIGVsc2VcbiAgICAgIEAkKCcudml6JykuaGlkZSgpXG5cbiAgIyBEMyBpcyBhIGJpdCBvZiBhIG1lc3MgdW5sZXNzIHlvdSd2ZSByZWFsbHkgaW50ZXJuYWxpemVkIGl0J3Mgd2F5IG9mIGRvaW5nXG4gICMgdGhpbmdzLiBJJ2Qgc3VnZ2VzdCBqdXN0IGRpc3BsYXlpbmcgdGhlIFwiUmVwcmVzZW50YXRpb25cIiBhbmQgXCJQZXJjZW50XCJcbiAgIyBpbmZvIHdpdGggc2ltcGxlIHRhYmxlcyB1bmxlc3MgdGhlcmUgaXMgcGxlbnR5IG9mIHRpbWUgdG8gd29yayBvbiB0aGVcbiAgIyB2aXN1YWxpemF0aW9ucyBpbiB0aGUgbW9ja3Vwcy5cbiAgZHJhd1ZpejogKHNpemUpIC0+XG4gICAgIyBDaGVjayBpZiBkMyBpcyBwcmVzZW50LiBJZiBub3QsIHdlJ3JlIHByb2JhYmx5IGRlYWxpbmcgd2l0aCBJRVxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgY29uc29sZS5sb2cgJ2QzJ1xuICAgICAgZWwgPSBAJCgnLnZpeicpWzBdXG4gICAgICBtYXhTY2FsZSA9IE1JTl9TSVpFICogMlxuICAgICAgcmFuZ2VzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0JlbG93IHJlY29tbWVuZGVkICgwIC0gMTAsMDAwIGhhKSdcbiAgICAgICAgICBzdGFydDogMFxuICAgICAgICAgIGVuZDogTUlOX1NJWkVcbiAgICAgICAgICBiZzogXCIjOGU1ZTUwXCJcbiAgICAgICAgICBjbGFzczogJ2JlbG93J1xuICAgICAgICB9XG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnUmVjb21tZW5kZWQgKD4gMTAsMDAwIGhhKSdcbiAgICAgICAgICBzdGFydDogTUlOX1NJWkVcbiAgICAgICAgICBlbmQ6IE1JTl9TSVpFICogMlxuICAgICAgICAgIGJnOiAnIzU4OGUzZidcbiAgICAgICAgICBjbGFzczogJ3JlY29tbWVuZGVkJ1xuICAgICAgICB9XG4gICAgICBdXG5cbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCBtYXhTY2FsZV0pXG4gICAgICAgIC5yYW5nZShbMCwgNDAwXSlcbiAgICAgIFxuICAgICAgY2hhcnQgPSBkMy5zZWxlY3QoZWwpXG4gICAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYucmFuZ2VcIilcbiAgICAgICAgLmRhdGEocmFuZ2VzKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgIC5zdHlsZShcIndpZHRoXCIsIChkKSAtPiB4KGQuZW5kIC0gZC5zdGFydCkgKyAncHgnKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkKSAtPiBcInJhbmdlIFwiICsgZC5jbGFzcylcbiAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgICAudGV4dCgoZCkgLT4gZC5uYW1lKVxuXG4gICAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYubWVhc3VyZVwiKVxuICAgICAgICAuZGF0YShbc2l6ZV0pXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1lYXN1cmVcIilcbiAgICAgICAgLnN0eWxlKFwibGVmdFwiLCAoZCkgLT4geChkKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIlwiKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcnZpZXdUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFjdGl2aXRpZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Qb3NzaWJsZSBFZmZlY3RzIG9uIEFxdWFjdWx0dXJlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPiA8IS0tIGRhdGEtcGFnaW5nLi4uIGFjdGl2YXRlcyBwYWdpbmcgIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoxODBweDtcXFwiPlR5cGU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgQWZmZWN0ZWQgKEhhKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QXJlYSBBZmZlY3QgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qb3RlbnRpYWwgSW1wYWN0IG9uIFByb2R1Y3Rpb248L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBvdGVudGlhbCBJbXBhY3Qgb24gRWNvbm9taWMgVmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVcIixjLHAsMSksYyxwLDAsNzQ1LDkxMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJGQVJNX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiU0laRV9JTl9IQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZD4tLTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZD4tLTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZD4tLTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNVxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIE5vdGU6IGFzIG5vdCBhbGwgYXJlYXMgZmlzaGVkIGhhdmUgdGhlIHNhbWUgZmlzaGluZyBlZmZvcnQgb3IgY2F0Y2gsIHRoZSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICDigJxMZXZlbCBvZiBGaXNoaW5nIERpc3BsYWNlZOKAnSBpcyBhIGNvbWJpbmF0aW9uIG9mIHRoZSBhcmVhIGJlaW5nIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIHJlc3RyaWN0ZWQgYW5kIHRoZSBjYXRjaCB0aGF0IHdvdWxkIG5vcm1hbGx5IGJlIGNhdWdodCBpbiB0aGF0IGFyZWFcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkV4aXN0aW5nIFVzZSBDb25mbGljdHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNFeGlzdGluZ1VzZUNvbmZsaWN0c1wiLGMscCwxKSxjLHAsMCwxNDg2LDE2ODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBPbmUgb3IgbW9yZSBwcm90ZWN0aW9uIGNsYXNzZXMgb3ZlcmxhcCB3aXRoLCBvciBhcmUgbmVhciwgPHN0cm9uZz5leGlzdGluZyB1c2VzPC9zdHJvbmc+IHRoYXQgYXJlIGluIGNvbmZsaWN0IHdpdGggdGhlIHB1cnBvc2VzIG9mIHRoZSBwcm90ZWN0aW9uLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+IDwhLS0gZGF0YS1wYWdpbmcuLi4gYWN0aXZhdGVzIHBhZ2luZyAgLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+RXhpc3RpbmcgVXNlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JcyBDb21wYXRpYmxlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImV4aXN0aW5nVXNlc1wiLGMscCwxKSxjLHAsMCwxOTIzLDIwMTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRkVBVF9UWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkPi0tPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggUmVjcmVhdGlvbmFsIFVzZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNSZWNyZWF0aW9uYWxVc2VDb25mbGljdHNcIixjLHAsMSksYyxwLDAsMjE4MywyMzg1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgT25lIG9yIG1vcmUgcHJvdGVjdGlvbiBjbGFzc2VzIG92ZXJsYXAgd2l0aCwgb3IgYXJlIG5lYXIsIDxzdHJvbmc+cmVjcmVhdGlvbmFsIHVzZXM8L3N0cm9uZz4gdGhhdCBtYXkgYmUgaW4gY29uZmxpY3Qgd2l0aCB0aGUgcHVycG9zZXMgb2YgdGhlIHByb3RlY3Rpb24uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj4gPCEtLSBkYXRhLXBhZ2luZy4uLiBhY3RpdmF0ZXMgcGFnaW5nICAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5SZWNyZWF0aW9uYWwgVXNlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JcyBDb21wYXRpYmxlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInJlY3JlYXRpb25hbFVzZXNcIixjLHAsMSksYyxwLDAsMjYzOSwyNzI4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkZFQVRfVFlQRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZD4tLTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwib3ZlcmxhcFdpdGhNb29yaW5nc0FuZEFuY2hvcmFnZXNcIixjLHAsMSksYyxwLDAsMjgyMCwzMDc1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwcyB3aXRoIE1vb3JpbmcgYW5kIEFuY2hvcmFnZSBBcmVhczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2UgZ3JlZW4tY2hlY2tcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBPbmUgbW9yZSBtb3JlIHByb3RlY3Rpb24gYXJlYXMgb3ZlcmxhcCB3aXRoIHNpdGVzIHRoYXQgYXJlIGlkZW50aWZpZWQgYXMgZ29vZCBmb3IgPHN0cm9uZz5Nb29yaW5nIGFuZCBBbmNob3JhZ2VzPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJkZW1vXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcG9ydCBTZWN0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5Vc2UgcmVwb3J0IHNlY3Rpb25zIHRvIGdyb3VwIGluZm9ybWF0aW9uIGludG8gbWVhbmluZ2Z1bCBjYXRlZ29yaWVzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RDMgVmlzdWFsaXphdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJuYXYgbmF2LXBpbGxzXFxcIiBpZD1cXFwidGFiczJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGkgY2xhc3M9XFxcImFjdGl2ZVxcXCI+PGEgaHJlZj1cXFwiI2NoYXJ0XFxcIj5DaGFydDwvYT48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGk+PGEgaHJlZj1cXFwiI2RhdGFUYWJsZVxcXCI+VGFibGU8L2E+PC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ0YWItY29udGVudFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInRhYi1wYW5lIGFjdGl2ZVxcXCIgaWQ9XFxcImNoYXJ0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8IS0tW2lmIElFIDhdPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwIGNsYXNzPVxcXCJ1bnN1cHBvcnRlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhpcyB2aXN1YWxpemF0aW9uIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggSW50ZXJuZXQgRXhwbG9yZXIgOC4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgUGxlYXNlIHVwZ3JhZGUgeW91ciBicm93c2VyLCBvciB2aWV3IHJlc3VsdHMgaW4gdGhlIHRhYmxlIHRhYi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+ICAgICAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPCFbZW5kaWZdLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBTZWUgPGNvZGU+c3JjL3NjcmlwdHMvZGVtby5jb2ZmZWU8L2NvZGU+IGZvciBhbiBleGFtcGxlIG9mIGhvdyB0byBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIHVzZSBkMy5qcyB0byByZW5kZXIgdmlzdWFsaXphdGlvbnMuIFByb3ZpZGUgYSB0YWJsZS1iYXNlZCB2aWV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBhbmQgdXNlIGNvbmRpdGlvbmFsIGNvbW1lbnRzIHRvIHByb3ZpZGUgYSBmYWxsYmFjayBmb3IgSUU4IHVzZXJzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGEgaHJlZj1cXFwiaHR0cDovL3R3aXR0ZXIuZ2l0aHViLmlvL2Jvb3RzdHJhcC8yLjMuMi9cXFwiPkJvb3RzdHJhcCAyLng8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpcyBsb2FkZWQgd2l0aGluIFNlYVNrZXRjaCBzbyB5b3UgY2FuIHVzZSBpdCB0byBjcmVhdGUgdGFicyBhbmQgb3RoZXIgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpbnRlcmZhY2UgY29tcG9uZW50cy4galF1ZXJ5IGFuZCB1bmRlcnNjb3JlIGFyZSBhbHNvIGF2YWlsYWJsZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJ0YWItcGFuZVxcXCIgaWQ9XFxcImRhdGFUYWJsZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPmluZGV4PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+dmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY2hhcnREYXRhXCIsYyxwLDEpLGMscCwwLDEzNTEsMTQxOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj48dGQ+XCIpO18uYihfLnYoXy5mKFwiaW5kZXhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJ2YWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBlbXBoYXNpc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1waGFzaXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+R2l2ZSByZXBvcnQgc2VjdGlvbnMgYW4gPGNvZGU+ZW1waGFzaXM8L2NvZGU+IGNsYXNzIHRvIGhpZ2hsaWdodCBpbXBvcnRhbnQgaW5mb3JtYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB3YXJuaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5XYXJuaW5nPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPk9yIDxjb2RlPndhcm48L2NvZGU+IG9mIHBvdGVudGlhbCBwcm9ibGVtcy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRhbmdlclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGFuZ2VyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPjxjb2RlPmRhbmdlcjwvY29kZT4gY2FuIGFsc28gYmUgdXNlZC4uLiBzcGFyaW5nbHkuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImZpc2hlcmllc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Db21tZXJjaWFsIEZpc2hpbmc8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TmFtZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QWZmZWN0ZWQgQXJlYSAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkxldmVsIG9mIEZpc2hpbmcgRGlzcGxhY2VkICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+RWNvbm9taWMgVmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk51bWJlciBvZiBBZmZlY3RlZCBGaXNoZXJzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5GaXNoZXJzIGluIEd1bGYgRmlzaGVyeTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjb21tZXJjaWFsRmlzaGluZ1wiLGMscCwxKSxjLHAsMCw0MTAsNjA1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUHJjRHNwbGNkXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJMZXZlbFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk51bVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRmlzaGVyc1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjZcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgTm90ZTogYXMgbm90IGFsbCBhcmVhcyBmaXNoZWQgaGF2ZSB0aGUgc2FtZSBmaXNoaW5nIGVmZm9ydCBvciBjYXRjaCwgdGhlIOKAnExldmVsIG9mIEZpc2hpbmcgRGlzcGxhY2Vk4oCdIGlzIGEgY29tYmluYXRpb24gb2YgdGhlIGFyZWEgYmVpbmcgcmVzdHJpY3RlZCBhbmQgdGhlIGNhdGNoIHRoYXQgd291bGQgbm9ybWFsbHkgYmUgY2F1Z2h0IGluIHRoYXQgYXJlYS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZWNyZWF0aW9uYWwgRmlzaGluZzwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OYW1lPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BZmZlY3RlZCBBcmVhICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TGV2ZWwgb2YgRmlzaGluZyBEaXNwbGFjZWQgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5FY29ub21pYyBWYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TnVtYmVyIG9mIEFmZmVjdGVkIEZpc2hlcnM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkZpc2hlcnMgaW4gR3VsZiBGaXNoZXJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInJlY3JlYXRpb25hbEZpc2hpbmdcIixjLHAsMSksYyxwLDAsMTQyMCwxNjE1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUHJjRHNwbGNkXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJMZXZlbFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk51bVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRmlzaGVyc1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNlxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5DdXN0b21hcnkgRmlzaGluZzwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OYW1lPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BZmZlY3RlZCBBcmVhICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TGV2ZWwgb2YgRmlzaGluZyBEaXNwbGFjZWQgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5FY29ub21pYyBWYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TnVtYmVyIG9mIEFmZmVjdGVkIEZpc2hlcnM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkZpc2hlcnMgaW4gR3VsZiBGaXNoZXJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImN1c3RvbWFyeUZpc2hpbmdcIixjLHAsMSksYyxwLDAsMjIyMSwyNDE2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUHJjRHNwbGNkXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJMZXZlbFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk51bVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRmlzaGVyc1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCI2XFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIEltcG9ydGFudCBjdXN0b21hcnkgZmlzaGluZyBsb2NhdGlvbnMgaGF2ZSBub3QgYmVlbiBpZGVudGlmaWVkIHlldC4gSW5mb3JtYXRpb24gb24gdGhlIHdoZXJlYWJvdXRzIG9mIHRoZXNlIGFjdGl2aXRpZXMgbWF5IGJlIGFkZGVkIGR1cmluZyBwbGFubmluZyBwcm9jZXNzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlRvdGFsIEZvb2QgUHJvdmlzaW9uPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkZpc2ggU3RvY2s8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkNhdGNoIERpc3BsYWNlZCAodG9ubnNzKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBmcm9tIEd1bGY8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVEFDPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5WYWx1ZSBvZiBGaXNoPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5WYWx1ZSB0byBOWiBFY29ub215PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInRvdGFsRm9vZFwiLGMscCwxKSxjLHAsMCwzMTU1LDMzNTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJGaXNoU3RvY2tcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIktnc19IYVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiR3VsZl9LZ3NcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInRhY1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInZhbHVlX3RvX256XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjZcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgVGhlIHRvdGFsIGZvb2QgcHJvdmlzaW9uIGluY2x1ZGVzIGNvbW1lcmNpYWwsIHJlY3JlYXRpb25hbCwgYW5kXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIGN1c3RvbWFyeSBjYXRjaC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImhhYml0YXRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwxNywzMjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhlIGNvbGxlY3Rpb24gb2YgbWFyaW5lIHByb3RlY3RlZCBhcmVhcyB3aWxsIHByb3RlY3QgdGhlIGZ1bGwgcmFuZ2Ugb2YgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBuYXR1cmFsIG1hcmluZSBoYWJpdGF0cyBhbmQgZWNvc3lzdGVtcy4gVGhlc2UgcmVwb3J0cyBzaG93IHRoZSBwcm9wb3J0aW9uIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgb2YgdGhlIGd1bGYgcHJvdGVjdGVkIGZvciBlYWNoIGhhYml0YXQgdHlwZSBpbiBNYXJpbmUgUmVzZXJ2ZXMgYW5kIFR5cGUtMiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFByb3RlY3RlZCBBcmVhcywgZm9yIGJvdGggZXhpc3RpbmcgcHJvdGVjdGVkIGFyZWFzIGFuZCBza2V0Y2hlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNSZXNlcnZlRGF0YVwiLGMscCwxKSxjLHAsMCwzNjEsMTQ4NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgUHJvdGVjdGVkIGluIE1hcmluZSBSZXNlcnZlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj4gPCEtLSBkYXRhLXBhZ2luZy4uLiBhY3RpdmF0ZXMgcGFnaW5nICAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MTgwcHg7XFxcIj5IYWJpdGF0czwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+JSBJbiBOZXcgTWFyaW5lIFJlc2VydmVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD4lIEluIEV4aXN0aW5nIE1hcmluZSBSZXNlcnZlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjUwcHg7XFxcIj5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c0luUmVzZXJ2ZXNcIixjLHAsMSksYyxwLDAsNzkxLDk0MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9UWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJORVdfUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRVhfUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0JfUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNFxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMTEyNSwxMTc0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICBNYXJpbmUgUmVzZXJ2ZXMgcHJvdGVjdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgICBUaGlzIE1hcmluZSBSZXNlcnZlIHByb3RlY3RzXCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgICAgICAgICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiaGFiaXRhdHNJblJlc2VydmVzQ291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImhhYml0YXRzQ291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gaGFiaXRhdCB0eXBlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1R5cGVUd29EYXRhXCIsYyxwLDEpLGMscCwwLDE1MjcsMjYzOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgUHJvdGVjdGVkIGluIFR5cGUtMiBQcm90ZWN0ZWQgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjE4MHB4O1xcXCI+SGFiaXRhdHM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPiUgSW4gTmV3IFR5cGUtMiBQcm90ZWN0ZWQgQXJlYXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPiUgSW4gRXhpc3RpbmcgVHlwZS0yIFByb3RlY3RlZCBBcmVhczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjUwcHg7XFxcIj5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c0luVHlwZVR3b3NcIixjLHAsMSksYyxwLDAsMTkzNiwyMDg0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5FV19QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJFWF9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDQl9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNFxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMjI2OSwyMzE5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICBUeXBlLTIgUmVzZXJ2ZXMgcHJvdGVjdCBcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgICAgVGhpcyBUeXBlLTIgUHJvdGVjdGVkIEFyZWEgcHJvdGVjdHNcIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICAgICAgICAgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJoYWJpdGF0c0luVHlwZVR3b0NvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJoYWJpdGF0c0NvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IGhhYml0YXQgdHlwZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiUERGIHNheXMgZm9yIGJvdGggem9uZXMgYW5kIGNvbGxlY3Rpb25zLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJJIGp1c3QgaW5jbHVkZWQgY29sbGVjdGlvbnMgZm9yIG5vdyAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiLS0+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1JlcHJlc2VudGF0aW9uRGF0YVwiLGMscCwxKSxjLHAsMCwyNzc1LDM3MTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXQgUmVwcmVzZW50YXRpb248L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdHM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlRvdGFsIEhBIFByb3RlY3RlZCBpbiBBbGwgQXJlYXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlRvdGFsICUgaW4gQWxsIEFyZWFzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgU2l0ZXMgUHJvdGVjdGVkPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BZGVxdWF0ZWx5IFJlcHJlc2VudGVkPzwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJyZXByZXNlbnRhdGlvbkRhdGFcIixjLHAsMSksYyxwLDAsMzE2NiwzMzM1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNCX1NJWkVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNCX1BFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlJFUF9DT1VOVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+Pz88L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCI1XFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInJlcHJlc2VudGVkQ291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImhhYml0YXRzQ291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gaGFiaXRhdHMgYXJlIGFkZXF1YXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgcHJvdGVjdGVkLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzU2Vuc2l0aXZlQXJlYXNcIixjLHAsMSksYyxwLDAsMzc2Miw0MjcyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TZW5zaXRpdmUgSGFiaXRhdHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TmFtZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VHlwZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGVjdGFyZXMgUHJvdGVjdGVkPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIEFyZWEgUHJvdGVjdGVkPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNlbnNpdGl2ZUFyZWFzXCIsYyxwLDEpLGMscCwwLDQwNzEsNDIyMSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNBX05BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNBX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzUHJvdGVjdGVkTWFtbWFsc1wiLGMscCwxKSxjLHAsMCw0MzIwLDQ3NTQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlByb3RlY3RlZCBNYW1tYWxzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlN0YXR1czwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TnVtYmVyIG9mIE92ZXJsYXBwaW5nIEFyZWFzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInByb3RlY3RlZE1hbW1hbHNcIixjLHAsMSksYyxwLDAsNDU5OCw0NzAxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+LS08L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzU2VhYmlyZEJyZWVkaW5nU2l0ZXNcIixjLHAsMSksYyxwLDAsNDgwOCw1MjM4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TZWFiaXJkczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OYW1lPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5TdGF0dXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk51bWJlciBvZiBCcmVlZGluZyBTaXRlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzZWFiaXJkQnJlZWRpbmdTaXRlc1wiLGMscCwxKSxjLHAsMCw1MDc4LDUxODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD4tLTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1Nob3JlYmlyZFNpdGVzXCIsYyxwLDEpLGMscCwwLDUyOTEsNTcxMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2VhYmlyZHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TmFtZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+U3RhdHVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgU2hvcmViaXJkIFNpdGVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNob3JlYmlyZFNpdGVzXCIsYyxwLDEpLGMscCwwLDU1NTYsNTY1OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPi0tPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDb3VudFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtpZihfLnMoXy5mKFwiYWRqYWNlbnRQcm90ZWN0ZWRBcmVhc1wiLGMscCwxKSxjLHAsMCw1Nzc5LDU5NzcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkFkamFjZW50IFRlcnJlc3RyaWFsIFByb3RlY3RlZCBBcmVhPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZSBncmVlbi1jaGVja1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgem9uZSBpcyBhZGphY2VudCB0byBhIDxzdHJvbmc+VGVycmVzdHJpYWwgUHJvdGVjdGVkIEFyZWE8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319O18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5OdXRyaWVudCBSZWN5Y2xpbmc8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgaW4gSGVjdGFyZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibnV0cmllbnRSZWN5Y2xpbmdcIixjLHAsMSksYyxwLDAsNjI5Myw2NDA5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFyZWFJbkhhXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkJpb2dlbmljIEhhYml0YXQ8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgaW4gSGVjdGFyZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYmlvZ2VuaWNIYWJpdGF0XCIsYyxwLDEpLGMscCwwLDY3MzIsNjg0OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBcmVhSW5IYVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5FY29zeXN0ZW0gUHJvZHVjdGl2aXR5PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BcmVhIGluIEhlY3RhcmVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImVjb3N5c3RlbVByb2R1Y3Rpdml0eVwiLGMscCwxKSxjLHAsMCw3MTc5LDcyOTUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDbGFzc1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQXJlYUluSGFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZSBcIik7aWYoXy5zKF8uZihcIlNJWkVfT0tcIixjLHAsMSksYyxwLDAsMzc1LDM4NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiZ3JlZW4tY2hlY2tcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPCEtLSBOb3RpY2UsIHVzaW5nIG11c3RhY2hlIHRhZ3MgaGVyZSB0byB0ZXN0IHdoZXRoZXIgd2UncmUgcmVuZGVyaW5nIGEgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGNvbGxlY3Rpb24gb3IgYSBzaW5nbGUgem9uZSAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDUzNSw2NTcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICBUaGUgYXZlcmFnZSBzaXplIG9mIHRoZSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5VTV9QUk9URUNURURcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gcHJvdGVjdGVkIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBhcmVhcyBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNJWkVcIixjLHAsMCkpKTtfLmIoXCIgaGE8L3N0cm9uZz4sXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICBUaGlzIHByb3RlY3RlZCBhcmVhIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiU0laRVwiLGMscCwwKSkpO18uYihcIiBoYTwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcIlNJWkVfT0tcIixjLHAsMSksYyxwLDAsNzkyLDg0MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIG1lZXRpbmcgdGhlIHRhcmdldCBvZiBcIik7Xy5iKF8udihfLmYoXCJNSU5fU0laRVwiLGMscCwwKSkpO18uYihcIiBoYS5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiU0laRV9PS1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICB3aGljaCBkb2VzIG5vdCBtZWV0IHRoZSB0YXJnZXQgb2YgXCIpO18uYihfLnYoXy5mKFwiTUlOX1NJWkVcIixjLHAsMCkpKTtfLmIoXCIgaGEuXCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIHN0eWxlPVxcXCJmb250LXNpemU6MTJweDtwYWRkaW5nOjExcHg7dGV4dC1hbGlnbjpsZWZ0O21hcmdpbi10b3A6LTEwcHg7XFxcIj5Gb3IgdGhlIHNhbWUgYW1vdW50IG9mIGFyZWEgdG8gYmUgcHJvdGVjdGVkLCBpdCBpcyBkZXNpcmFibGUgdG8gcHJvdGVjdCBmZXdlciwgbGFyZ2VyIGFyZWFzIHJhdGhlciB0aGFuIG51bWVyb3VzIHNtYWxsZXIgb25lcy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwxMjAwLDE1NTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiIHN0eWxlPVxcXCJwYWRkaW5nOjBweCAxMHB4O3BhZGRpbmctYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUaGUgc2VsZWN0ZWQgbmV0d29yayBjb250YWlucyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk1BUklORV9SRVNFUlZFU1wiLGMscCwwKSkpO18uYihcIiBNYXJpbmVcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBSZXNlcnZlXCIpO2lmKF8ucyhfLmYoXCJNQVJJTkVfUkVTRVJWRVNfUExVUkFMXCIsYyxwLDEpLGMscCwwLDEzODAsMTM4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gYW5kIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiVFlQRV9UV09fTVBBU1wiLGMscCwwKSkpO18uYihcIiBUeXBlIDIgUHJvdGVjdGlvbiBBcmVhXCIpO2lmKF8ucyhfLmYoXCJUWVBFX1RXT19NUEFTX1BMVVJBTFwiLGMscCwxKSxjLHAsMCwxNTAyLDE1MDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVwcmVzZW50YXRpb24gb2YgSGFiaXRhdHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+IDwhLS0gZGF0YS1wYWdpbmcuLi4gYWN0aXZhdGVzIHBhZ2luZyAgLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjE4MHB4O1xcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JbiBQcm9wb3NlZCBBcmVhczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW4gRXhpc3RpbmcgQXJlYXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkNvbWJpbmVkPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Ub3RhbCA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+TnVtYmVyIG9mIEhhYml0YXRzIFByb3RlY3RlZDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX0NPVU5UX1BST1BPU0VEXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfQ09VTlRfRVhJU1RJTkdcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9DT1VOVF9DT01CSU5FRFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX0NPVU5UX1RPVEFMXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjVcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDIzMzMsMjM5OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgTmV3IGFuZCBleGlzdGluZyBNYXJpbmUgUmVzZXJ2ZXMgcHJvdGVjdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgICBUaGlzIE1hcmluZSBSZXNlcnZlIHByb3RlY3RzXCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgICAgICAgICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiSEFCX0NPVU5UX0NPTUJJTkVEXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJIQUJfQ09VTlRfVE9UQUxcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gaGFiaXRhdCB0eXBlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlBlcmNlbnQgb2YgSGF1cmFraSBHdWxmIE1hcmluZSBQYXJrIFByb3RlY3RlZDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPiA8IS0tIGRhdGEtcGFnaW5nLi4uIGFjdGl2YXRlcyBwYWdpbmcgIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoxODBweDtcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW4gUHJvcG9zZWQgQXJlYXMgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JbiBFeGlzdGluZyBBcmVhcyAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkNvbWJpbmVkICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5JbiBNYXJpbmUgUmVzZXJ2ZXM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9QRVJDX01SX05FV1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1BFUkNfTVJfRVhJU1RJTkdcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9QRVJDX01SX0NPTUJJTkVEXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5JbiBUeXBlIDIgUHJvdGVjdGlvbiBBcmVhczwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1BFUkNfVDJfTkVXXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfUEVSQ19UMl9FWElTVElOR1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1BFUkNfVDJfQ09NQklORURcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNFxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlRoaXMgdGFibGUgc2hvd3MgaG93IOKAmGNvbXByZWhlbnNpdmXigJkgdGhlIHByb3Bvc2VkIHByb3RlY3Rpb25cIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwzNjYzLDM2NjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInMgYXJlXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiIGlzXCIpO307Xy5iKFwiLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBQcm9wb3NlZCBhbmQgZXhpc3RpbmcgcGxhbnMgcHJvdGVjdCB0aGVzZSBwZXJjZW50YWdlcyBvZiB0aGUgdG90YWwgYXJlYXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIkknbSBsZWF2aW5nIHRoZXNlIGl0ZW1zIGNvbW1lbnRlZCBvdXQgYmVjYXVzZSB0aGV5IHNlZW0gaGFyZCB0byBpbXBsZW1lbnRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJhbmQgZHVwbGljYXRpdmUuIEl0J3MgYWxzbyBub3QgY2xlYXIgaG93IHRoZXkgd291bGQgbG9vayBhdCB0aGUgem9uZS1sZXZlbC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gcmVwcmVzZW50YXRpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcHJlc2VudGF0aW9uIG9mIEhhYml0YXRzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlRoZSBwcm9wb3NlZCBwcm90ZWN0aW9uIGFyZWFzIGFuZCBleGlzdGluZyByZXNlcnZlcyBwcm90ZWN0IGEgc2FtcGxlIG9mIHRoZSBmb2xsb3dpbmcgbnVtYmVyIG9mIGhhYml0YXRzOjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gcGVyY2VudFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UGVyY2VudCBvZiBIYXVyYWtpIEd1bGYgTWFyaW5lIFBhcmsgUHJvdGVjdGVkPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlRoZSBncmFwaCBiZWxvd3Mgc2hvd3MgaG93IOKAmGNvbXByZWhlbnNpdmXigJkgdGhlIHByb3Bvc2VkIHByb3RlY3Rpb24gaXMuIFRoZSBwcm9wb3NlZCBwbGFuIGluY2x1ZGVzIHRoZSBmb2xsb3dpbmcgcHJvdGVjdGlvbiB0eXBlczo8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDUwOCw0NjMyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTsiXX0=
;