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


},{}],"api/templates":[function(require,module,exports){
module.exports=require('4l2XTc');
},{}],"4l2XTc":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,81,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.rp("attributes/attributeItem",c,p,"    "));});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}],11:[function(require,module,exports){
var ActivitiesTab, MIN_SIZE, ReportTab, key, partials, templates, val, _partials, _ref,
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

ActivitiesTab = (function(_super) {
  __extends(ActivitiesTab, _super);

  function ActivitiesTab() {
    _ref = ActivitiesTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ActivitiesTab.prototype.name = 'Activities';

  ActivitiesTab.prototype.className = 'activities';

  ActivitiesTab.prototype.timeout = 120000;

  ActivitiesTab.prototype.template = templates.overview;

  ActivitiesTab.prototype.dependencies = ['HabitatCount'];

  ActivitiesTab.prototype.render = function() {
    var context, habitats, habitatsInReserves, habitatsInTypeTwos, isCollection;
    isCollection = this.model.isCollection();
    habitats = this.recordSet('Habitat', 'Habitats').toArray();
    habitatsInReserves = habitats;
    habitatsInTypeTwos = habitats;
    context = {
      isCollection: isCollection,
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      habitatsCount: this.recordSet('Habitat', 'Habitats').toArray().length,
      reserveData: (habitatsInReserves != null ? habitatsInReserves.length : void 0) > 0,
      habitatsInReserves: habitatsInReserves,
      habitatsInReservesCount: _.filter(habitatsInReserves, function(row) {
        return row.Total > 0;
      }).length,
      typeTwoData: (habitatsInTypeTwos != null ? habitatsInTypeTwos.length : void 0) > 0,
      habitatsInTypeTwos: habitatsInTypeTwos,
      habitatsInTypeTwosCount: _.filter(habitatsInTypeTwos, function(row) {
        return row.Total > 0;
      }).length,
      representationData: [
        {
          HabType: 'Moderate Rocky Shore',
          Total: "12% / 25 ha",
          NumSites: 3,
          Protected: 'Yes'
        }
      ],
      representedCount: 3,
      adjacentProtectedAreas: true
    };
    this.$el.html(this.template.render(context, templates));
    this.enableTablePaging();
    return this.enableLayerTogglers();
  };

  return ActivitiesTab;

})(ReportTab);

module.exports = ActivitiesTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"4l2XTc","../templates/templates.js":16,"reportTab":"G1pDc3"}],12:[function(require,module,exports){
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

  EnvironmentTab.prototype.dependencies = ['HabitatComprehensiveness', 'NearTerrestrialProtected'];

  EnvironmentTab.prototype.render = function() {
    var context, habitats, habitatsInReserves, habitatsInTypeTwos, isCollection, near_terrestrial_protected, representationData;
    isCollection = this.model.isCollection();
    habitats = this.recordSet('HabitatComprehensiveness', 'HabitatComprehensiveness').toArray();
    near_terrestrial_protected = this.recordSet('NearTerrestrialProtected', 'NearTerrestrialProtected').bool('Adjacent');
    habitatsInReserves = _.filter(habitats, function(row) {
      return row.MPA_TYPE === 'MPA1';
    });
    habitatsInTypeTwos = _.filter(habitats, function(row) {
      return row.MPA_TYPE === 'MPA2';
    });
    representationData = _.filter(habitats, function(row) {
      return row.MPA_TYPE === 'ALL_TYPES';
    });
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
      hasTypeTwoData: (habitatsInTypeTwos != null ? habitatsInTypeTwos.length : void 0) > 0,
      habitatsInTypeTwoCount: habitatsInTypeTwos != null ? habitatsInTypeTwos.length : void 0,
      habitatsInTypeTwos: habitatsInTypeTwos,
      representationData: representationData,
      hasRepresentationData: (representationData != null ? representationData.length : void 0) > 0,
      representedCount: representationData != null ? representationData.length : void 0,
      adjacentProtectedAreas: near_terrestrial_protected
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

  FisheriesTab.prototype.render = function() {
    var context, isCollection;
    isCollection = this.model.isCollection();
    context = {
      isCollection: isCollection,
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      commercialFishing: [],
      recreationalFishing: [],
      customaryFishing: [],
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
      HECTARES = HECTARES / children.length;
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

this["Templates"]["activities"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection activities\">");_.b("\n" + i);_.b("  <h4>There will be activities and Uses Here</h4>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Report Sections</h4>");_.b("\n" + i);_.b("  <p>Use report sections to group information into meaningful categories</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>D3 Visualizations</h4>");_.b("\n" + i);_.b("  <ul class=\"nav nav-pills\" id=\"tabs2\">");_.b("\n" + i);_.b("    <li class=\"active\"><a href=\"#chart\">Chart</a></li>");_.b("\n" + i);_.b("    <li><a href=\"#dataTable\">Table</a></li>");_.b("\n" + i);_.b("  </ul>");_.b("\n" + i);_.b("  <div class=\"tab-content\">");_.b("\n" + i);_.b("    <div class=\"tab-pane active\" id=\"chart\">");_.b("\n" + i);_.b("      <!--[if IE 8]>");_.b("\n" + i);_.b("      <p class=\"unsupported\">");_.b("\n" + i);_.b("      This visualization is not compatible with Internet Explorer 8. ");_.b("\n" + i);_.b("      Please upgrade your browser, or view results in the table tab.");_.b("\n" + i);_.b("      </p>      ");_.b("\n" + i);_.b("      <![endif]-->");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        See <code>src/scripts/demo.coffee</code> for an example of how to ");_.b("\n" + i);_.b("        use d3.js to render visualizations. Provide a table-based view");_.b("\n" + i);_.b("        and use conditional comments to provide a fallback for IE8 users.");_.b("\n" + i);_.b("        <br>");_.b("\n" + i);_.b("        <a href=\"http://twitter.github.io/bootstrap/2.3.2/\">Bootstrap 2.x</a>");_.b("\n" + i);_.b("        is loaded within SeaSketch so you can use it to create tabs and other ");_.b("\n" + i);_.b("        interface components. jQuery and underscore are also available.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"tab-pane\" id=\"dataTable\">");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>index</th>");_.b("\n" + i);_.b("            <th>value</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("chartData",c,p,1),c,p,0,1351,1418,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr><td>");_.b(_.v(_.f("index",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection emphasis\">");_.b("\n" + i);_.b("  <h4>Emphasis</h4>");_.b("\n" + i);_.b("  <p>Give report sections an <code>emphasis</code> class to highlight important information.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection warning\">");_.b("\n" + i);_.b("  <h4>Warning</h4>");_.b("\n" + i);_.b("  <p>Or <code>warn</code> of potential problems.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection danger\">");_.b("\n" + i);_.b("  <h4>Danger</h4>");_.b("\n" + i);_.b("  <p><code>danger</code> can also be used... sparingly.</p>");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["fisheries"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Commercial Fishing</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Affected Area (%)</th>");_.b("\n" + i);_.b("        <th>Level of Fishing Displaced (%)</th>");_.b("\n" + i);_.b("        <th>Economic Value</th>");_.b("\n" + i);_.b("        <th>Number of Affected Fishers</th>");_.b("\n" + i);_.b("        <th>Fishers in Gulf Fishery</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("commercialFishing",c,p,1),c,p,0,410,604,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Affected",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Level",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Num",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Fishers",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          Note: as not all areas fished have the same fishing effort or catch, the “Level of Fishing Displaced” is a combination of the area being restricted and the catch that would normally be caught in that area.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Recreational Fishing</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Affected Area (%)</th>");_.b("\n" + i);_.b("        <th>Level of Fishing Displaced (%)</th>");_.b("\n" + i);_.b("        <th>Economic Value</th>");_.b("\n" + i);_.b("        <th>Number of Affected Fishers</th>");_.b("\n" + i);_.b("        <th>Fishers in Gulf Fishery</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("recreationalFishing",c,p,1),c,p,0,1419,1613,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Affected",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Level",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Num",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Fishers",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("<!-- ");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b(" -->");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Customary Fishing</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Affected Area (%)</th>");_.b("\n" + i);_.b("        <th>Level of Fishing Displaced (%)</th>");_.b("\n" + i);_.b("        <th>Economic Value</th>");_.b("\n" + i);_.b("        <th>Number of Affected Fishers</th>");_.b("\n" + i);_.b("        <th>Fishers in Gulf Fishery</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("customaryFishing",c,p,1),c,p,0,2219,2413,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Affected",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Level",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Num",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Fishers",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody> ");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          Important customary fishing locations have not been identified yet. Information on the whereabouts of these activities may be added during planning process.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Total Food Provision</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Fish Stock</th>");_.b("\n" + i);_.b("        <th>Catch Displaced (tonnss)</th>");_.b("\n" + i);_.b("        <th>Percent from Gulf</th>");_.b("\n" + i);_.b("        <th>Percent of TAC</th>");_.b("\n" + i);_.b("        <th>Value of Fish</th>");_.b("\n" + i);_.b("        <th>Value to NZ Economy</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("totalFood",c,p,1),c,p,0,3152,3346,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("fish",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("catch",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("gulf",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("tac",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("value_to_nz",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody> ");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          The total food provision includes commercial, recreational, and");_.b("\n" + i);_.b("          customary catch.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["habitat"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("isCollection",c,p,1),c,p,0,17,323,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<p>");_.b("\n" + i);_.b("  The collection of marine protected areas will protect the full range of ");_.b("\n" + i);_.b("  natural marine habitats and ecosystems. These reports show the proportion ");_.b("\n" + i);_.b("  of the gulf protected for each habitat type in Marine Reserves and Type-2 ");_.b("\n" + i);_.b("  Protected Areas, for both existing protected areas and sketches.");_.b("\n" + i);_.b("</p>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasReserveData",c,p,1),c,p,0,361,1486,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats Protected in Marine Reserves</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\">Habitats</th>");_.b("\n" + i);_.b("        <th>% In Existing Marine Reserves</th>");_.b("\n" + i);_.b("        <th>% In New Marine Reserves</th>");_.b("\n" + i);_.b("        <th style=\"width:50px;\">Total</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitatsInReserves",c,p,1),c,p,0,791,939,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("EX_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NEW_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,1124,1173,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            Marine Reserves protect");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("            This Marine Reserve protects");_.b("\n");};_.b("            <strong>");_.b(_.v(_.f("habitatsInReservesCount",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("habitatsCount",c,p,0)));_.b("</strong> habitat types.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasTypeTwoData",c,p,1),c,p,0,1526,2637,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats Protected in Type-2 Protected Areas</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\">Habitats</th>");_.b("\n" + i);_.b("        <th>% In Existing Type-2 Protected Areas</th>");_.b("\n" + i);_.b("        <th>% In New Type-2 Protected Areas</th>");_.b("\n" + i);_.b("        <th style=\"width:50px;\">Total</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitatsInTypeTwos",c,p,1),c,p,0,1935,2083,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("EX_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NEW_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,2268,2318,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            Type-2 Reserves protect ");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("            This Type-2 Protected Area protects");_.b("\n");};_.b("            <strong>");_.b(_.v(_.f("habitatsInTypeTwoCount",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("habitatsCount",c,p,0)));_.b("</strong> habitat types.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<!-- ");_.b("\n" + i);_.b("PDF says for both zones and collections. ");_.b("\n" + i);_.b("I just included collections for now  ");_.b("\n" + i);_.b("-->");_.b("\n" + i);if(_.s(_.f("hasRepresentationData",c,p,1),c,p,0,2774,3711,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitats</th>");_.b("\n" + i);_.b("        <th>Total HA Protected in All Areas</th>");_.b("\n" + i);_.b("        <th>Total % in All Areas</th>");_.b("\n" + i);_.b("        <th>Number of Sites Protected</th>");_.b("\n" + i);_.b("        <th>Adequately Represented?</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("representationData",c,p,1),c,p,0,3165,3334,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_SIZE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("REP_COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>??</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"5\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);_.b("\n" + i);_.b("            <strong>");_.b(_.v(_.f("representedCount",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("habitatsCount",c,p,0)));_.b("</strong> habitats are adequately ");_.b("\n" + i);_.b("            protected.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("adjacentProtectedAreas",c,p,1),c,p,0,3784,3982,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Adjacent Terrestrial Protected Area</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    This zone is adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}};return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large ");if(_.s(_.f("SIZE_OK",c,p,1),c,p,0,375,386,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("green-check");});c.pop();}_.b("\">");_.b("\n" + i);_.b("    <!-- Notice, using mustache tags here to test whether we're rendering a ");_.b("\n" + i);_.b("    collection or a single zone -->");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,535,657,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    The average size of the <strong>");_.b(_.v(_.f("NUM_PROTECTED",c,p,0)));_.b("</strong> protected ");_.b("\n" + i);_.b("    areas is <strong>");_.b(_.v(_.f("SIZE",c,p,0)));_.b(" ha</strong>,");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("    This protected area is <strong>");_.b(_.v(_.f("SIZE",c,p,0)));_.b(" ha</strong>,");_.b("\n");};if(_.s(_.f("SIZE_OK",c,p,1),c,p,0,792,840,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    meeting the target of ");_.b(_.v(_.f("MIN_SIZE",c,p,0)));_.b(" ha.");_.b("\n");});c.pop();}if(!_.s(_.f("SIZE_OK",c,p,1),c,p,1,0,0,"")){_.b("    which does not meet the target of ");_.b(_.v(_.f("MIN_SIZE",c,p,0)));_.b(" ha.");_.b("\n");};_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p style=\"font-size:12px;padding:11px;text-align:left;margin-top:-10px;\">For the same amount of area to be protected, it is desirable to protect fewer, larger areas rather than numerous smaller ones.</p>");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,1200,1541,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\" style=\"padding:0px 10px;padding-bottom:10px;\">");_.b("\n" + i);_.b("      The selected network contains <strong>");_.b(_.v(_.f("TYPE_TWO_MPAS",c,p,0)));_.b(" Habitat ");_.b("\n" + i);_.b("      Protection Zone");if(_.s(_.f("TYPE_TWO_MPAS_PLURAL",c,p,1),c,p,0,1386,1387,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" and ");_.b("\n" + i);_.b("      ");_.b(_.v(_.f("MARINE_RESERVES",c,p,0)));_.b(" Marine");_.b("\n" + i);_.b("      Reserve");if(_.s(_.f("MARINE_RESERVES_PLURAL",c,p,1),c,p,0,1491,1492,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong>.");_.b("\n" + i);_.b("    </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Representation of Habitats</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\"></th>");_.b("\n" + i);_.b("        <th>In Proposed Areas</th>");_.b("\n" + i);_.b("        <th>In Existing Areas</th>");_.b("\n" + i);_.b("        <th>Combined</th>");_.b("\n" + i);_.b("        <th>Total </th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td>Number of Habitats Protected</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_PROPOSED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_EXISTING",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_COMBINED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_TOTAL",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"5\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,2324,2390,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            New and existing Marine Reserves protect");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("            This Marine Reserve protects");_.b("\n");};_.b("            <strong>");_.b(_.v(_.f("HAB_COUNT_COMBINED",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("HAB_COUNT_TOTAL",c,p,0)));_.b("</strong> habitat types.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Percent of Hauraki Gulf Marine Park Protected</h4>");_.b("\n" + i);_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\"></th>");_.b("\n" + i);_.b("        <th>In Proposed Areas (%)</th>");_.b("\n" + i);_.b("        <th>In Existing Areas (%)</th>");_.b("\n" + i);_.b("        <th>Combined (%)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td>In Marine Reserves</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_MR_NEW",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_MR_EXISTING",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_MR_COMBINED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td>In Type 2 Protection Areas</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_T2_NEW",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_T2_EXISTING",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_T2_COMBINED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">This table shows how ‘comprehensive’ the proposed protection");if(_.s(_.f("isCollection",c,p,1),c,p,0,3654,3659,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" is");};_.b(". ");_.b("\n" + i);_.b("            Proposed and existing plans protect these percentages of the total areas.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!-- ");_.b("\n" + i);_.b("I'm leaving these items commented out because they seem hard to implement");_.b("\n" + i);_.b("and duplicative. It's also not clear how they would look at the zone-level.");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection representation\">");_.b("\n" + i);_.b("  <h4>Representation of Habitats</h4>");_.b("\n" + i);_.b("  <p>The proposed protection areas and existing reserves protect a sample of the following number of habitats:</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection percent\">");_.b("\n" + i);_.b("  <h4>Percent of Hauraki Gulf Marine Park Protected</h4>");_.b("\n" + i);_.b("  <p>The graph belows shows how ‘comprehensive’ the proposed protection is. The proposed plan includes the following protection types:</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b(" -->");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,4499,4623,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[12])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L19lbXB0eS5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRSZXN1bHRzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvc2NyaXB0cy9hY3Rpdml0aWVzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvc2NyaXB0cy9hcnJheS5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL3NjcmlwdHMvZW52aXJvbm1lbnQuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi9zY3JpcHRzL2Zpc2hlcmllcy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL3NjcmlwdHMvb3ZlcnZpZXcuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxHQUFZO0NBRFosQ0FFQSxDQUFBLEdBQU07QUFDQyxDQUFQLENBQUEsQ0FBQSxDQUFBO0NBQ0UsRUFBQSxDQUFBLEdBQU8scUJBQVA7Q0FDQSxTQUFBO0lBTEY7Q0FBQSxDQU1BLENBQVcsQ0FBQSxJQUFYLGFBQVc7Q0FFWDtDQUFBLE1BQUEsb0NBQUE7d0JBQUE7Q0FDRSxFQUFXLENBQVgsR0FBVyxDQUFYO0NBQUEsRUFDUyxDQUFULEVBQUEsRUFBaUIsS0FBUjtDQUNUO0NBQ0UsRUFBTyxDQUFQLEVBQUEsVUFBTztDQUFQLEVBQ08sQ0FBUCxDQURBLENBQ0E7QUFDK0IsQ0FGL0IsQ0FFOEIsQ0FBRSxDQUFoQyxFQUFBLEVBQVEs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SWlCLEVBQ1I7Q0FBRCxjQUFPO0NBTGYsTUFLUTtNQXpDSDtDQWpHVCxFQWlHUzs7Q0FqR1Q7O0NBRndCOztBQStJMUIsQ0F4SkEsRUF3SmlCLEdBQVgsQ0FBTixJQXhKQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3IgXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT4gXG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZCAgICAgICAgXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBpZiBfLmlzQXJyYXkgQGRhdGEudmFsdWVcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlWzBdXG4gICAgICBlbHNlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVxuICAgIF8ubWFwIGRhdGEuZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgY29uc29sZS5sb2cgQGRhdGFcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3IFxuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIHN1cGVyKClcbiAgXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgdG90YWwgPSAobmV3IERhdGUoQG1heEV0YSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoQGV0YVN0YXJ0KS5nZXRUaW1lKCkpIC8gMTAwMFxuICAgICAgbGVmdCA9IChuZXcgRGF0ZShAbWF4RXRhKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZSgpLmdldFRpbWUoKSkgLyAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAobGVmdCArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje2xlZnQgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGEnKVxuICAgICAgICBpZiAhbWF4RXRhIG9yIGpvYi5nZXQoJ2V0YScpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAZXRhU3RhcnQgPSBuZXcgRGF0ZSgpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT4gXG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG4gICAgICBcbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKSAgICBcbiAgICAgICAgICAkdGFibGUucmVtb3ZlKClcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MgJ3RhYmxlQ29udGFpbmVyJ1xuICAgICAgICAgIHBhcmVudC5hcHBlbmQgXCI8cD4je25vUm93c01lc3NhZ2V9PC9wPlwiXG5cbiAgZW5hYmxlTGF5ZXJUb2dnbGVyczogKCkgLT5cbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCw4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIixjLHAsXCIgICAgXCIpKTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvZ2VuZXJpY0F0dHJpYnV0ZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTsiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5NSU5fU0laRSA9IDEwMDAwXG5cbmNsYXNzIEFjdGl2aXRpZXNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgIyB0aGlzIGlzIHRoZSBuYW1lIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIFRhYlxuICBuYW1lOiAnQWN0aXZpdGllcydcbiAgY2xhc3NOYW1lOiAnYWN0aXZpdGllcydcbiAgdGltZW91dDogMTIwMDAwXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMub3ZlcnZpZXdcbiAgZGVwZW5kZW5jaWVzOiBbJ0hhYml0YXRDb3VudCddXG4gICMgRGVwZW5kZW5jaWVzIHdpbGwgbGlrZWx5IG5lZWQgdG8gYmUgY2hhbmdlZCB0byBzb21ldGhpbmcgbGlrZSB0aGlzIHRvXG4gICMgc3VwcG9ydCBtb3JlIEdQIHNlcnZpY2VzOlxuICAjIGRlcGVuZGVuY2llczogW1xuICAjICAgJ1RhcmdldFNpemUnXG4gICMgICAnUmVwcmVzZW50YXRpb25PZkhhYml0YXRzJ1xuICAjICAgJ1BlcmNlbnRQcm90ZWN0ZWQnXG4gICMgXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBoYWJpdGF0cyA9IEByZWNvcmRTZXQoJ0hhYml0YXQnLCAnSGFiaXRhdHMnKS50b0FycmF5KClcbiAgICBoYWJpdGF0c0luUmVzZXJ2ZXMgPSBoYWJpdGF0c1xuICAgIGhhYml0YXRzSW5UeXBlVHdvcyA9IGhhYml0YXRzXG4gICAgIyBUaGUgcHJlY2VlZGluZyBpcyBvZiBjb3Vyc2UsIHRoZSB3cm9uZyB3YXkgdG8gZG8gdGhpcy4gSSBoYXZlIG5vIGlkZWFcbiAgICAjIGhvdyBEYW4gaW50ZW5kcyB0byByZXByZXNlbnQgdGhlIGhhYml0YXQgbnVtYmVycyBmb3IgZWFjaCBvZiB0aGVzZS4gXG4gICAgIyBMZXRzIHNheSB0aGVyZSBpcyBhbiBhdHRyaWJ1dGUgZm9yIGVhY2ggZmVhdHVyZSBpbiB0aGUgc2V0IHRoYXQgaXNcbiAgICAjIE1QQV9UWVBFIChzbyB0aGVyZSBhcmUgdHdvIHJvd3MgcGVyIGhhYml0YXQpLiBUaGlzIGlzIGhvdyBJIHdvdWxkIHNwbGl0XG4gICAgIyB0aGUgZGF0YSB1cCBpbiB0aGF0IGNhc2U6XG4gICAgIyAgIFxuICAgICMgICBoYWJpdGF0cyA9IEByZWNvcmRTZXQoJ0hhYml0YXQnLCAnSGFiaXRhdHMnKVxuICAgICMgICBoYWJpdGF0c0luUmVzZXJ2ZXMgPSBfLmZpbHRlciBoYWJpdGF0cywgKHJvdykgLT5cbiAgICAjICAgICByb3cuTVBBX1RZUEUgaXMgJ01QQTEnIFxuICAgICMgICBoYWJpdGF0c0luVHlwZVR3b3MgPSBfLmZpbHRlciBoYWJpdGF0cywgKHJvdykgLT5cbiAgICAjICAgICByb3cuTVBBX1RZUEUgaXMgJ01QQTInIFxuICAgICMgXG4gICAgIyBJZiBpbnN0ZWFkIHRoZSBkYXRhIGlzIGluc3RlYWQgc3BsaXQgaW50byBtdWx0aXBsZSBmZWF0dXJlc2V0cyAod2l0aCBcbiAgICAjIHRoZSBzYW1lIHBhcmFtTmFtZSksIHRoZW4gaXQgZ2V0cyBtb3JlIGNvbXBsaWNhdGVkLiBZb3UnZCBuZWVkIHRvIGFjY2Vzc1xuICAgICMgdGhlIHJlc3BvbnNlIGRhdGEgdmlhIEByZWNvcmRTZXQoJ0hhYml0YXQnLCAnSGFiaXRhdHMnKS52YWx1ZSBhbmQgcGlja1xuICAgICMgb3V0IHRoZSBhcHByb3ByaWF0ZSBmZWF0dXJlU2V0cyBmb3IgZWFjaCB0eXBlLiBNYXliZSBzb21ldGhpbmcgbGlrZSBcbiAgICAjIHRoaXM6XG4gICAgIyBcbiAgICAjICAgcmVjb3JkU2V0ID0gQHJlY29yZFNldCgnSGFiaXRhdCcsICdIYWJpdGF0cycpXG4gICAgIyAgIGNvbnNvbGUubG9nIHJlY29yZFNldC52YWx1ZSAjIHJlbWVtYmVyIHRvIHVzZSB0aGlzIHRvIGRlYnVnXG4gICAgIyAgIGZlYXR1cmVTZXQgPSBfLmZpbmQgcmVjb3JkU2V0LnZhbHVlLCAoZnMpIC0+XG4gICAgIyAgICAgZnMuZmVhdHVyZXNbMF0uYXR0cmlidXRlc1snTVBBX1RZUEUnXSBpcyAnTVBBMSdcbiAgICAjICAgaGFiaXRhdHNJblJlc2VydmVzID0gXy5tYXAgZmVhdHVyZVNldC5mZWF0dXJlcywgKGYpIC0+IGYuYXR0cmlidXRlc1xuICAgICMgICAuLi4gYW5kIHJlcGVhdCBmb3IgVHlwZS1JSSBNUEFzXG4gICAgIyBcbiAgICBjb250ZXh0ID1cbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBoYWJpdGF0c0NvdW50OiBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRzJykudG9BcnJheSgpLmxlbmd0aFxuICAgICAgcmVzZXJ2ZURhdGE6IGhhYml0YXRzSW5SZXNlcnZlcz8ubGVuZ3RoID4gMFxuICAgICAgaGFiaXRhdHNJblJlc2VydmVzOiBoYWJpdGF0c0luUmVzZXJ2ZXNcbiAgICAgIGhhYml0YXRzSW5SZXNlcnZlc0NvdW50OiBfLmZpbHRlcihoYWJpdGF0c0luUmVzZXJ2ZXMsIChyb3cpIC0+IFxuICAgICAgICAjIE5lZWQgdG8gY29tZSB1cCB3aXRoIHNvbWUgb3RoZXIgc3RhbmRhcmQgdGhhdCBqdXN0IHByZXNlbmNlP1xuICAgICAgICByb3cuVG90YWwgPiAwXG4gICAgICApLmxlbmd0aFxuICAgICAgdHlwZVR3b0RhdGE6IGhhYml0YXRzSW5UeXBlVHdvcz8ubGVuZ3RoID4gMFxuICAgICAgaGFiaXRhdHNJblR5cGVUd29zOiBoYWJpdGF0c0luVHlwZVR3b3NcbiAgICAgIGhhYml0YXRzSW5UeXBlVHdvc0NvdW50OiBfLmZpbHRlcihoYWJpdGF0c0luVHlwZVR3b3MsIChyb3cpIC0+IFxuICAgICAgICAjIE5lZWQgdG8gY29tZSB1cCB3aXRoIHNvbWUgb3RoZXIgc3RhbmRhcmQgdGhhdCBqdXN0IHByZXNlbmNlP1xuICAgICAgICByb3cuVG90YWwgPiAwXG4gICAgICApLmxlbmd0aFxuICAgICAgIyByZXByZXNlbnRhdGlvbkRhdGE6IEByZWNvcmRTZXQoJ1JlcHJlc2VudGF0aW9uJywgJ1JlcHJlc2VudGF0aW9uJylcbiAgICAgICMgICAudG9BcnJheSgpXG4gICAgICByZXByZXNlbnRhdGlvbkRhdGE6IFt7ICMgUGxhY2Vob2xkZXIsIHNlZSBhYm92ZVxuICAgICAgICBIYWJUeXBlOiAnTW9kZXJhdGUgUm9ja3kgU2hvcmUnXG4gICAgICAgIFRvdGFsOiBcIjEyJSAvIDI1IGhhXCJcbiAgICAgICAgTnVtU2l0ZXM6IDNcbiAgICAgICAgUHJvdGVjdGVkOiAnWWVzJ1xuICAgICAgICAjIEl0J3MgYWxzbyBwb3NzaWJsZSB0byBhc3NpZ24gXCJQcm90ZWN0ZWRcIiBvbiB0aGUgY2xpZW50LCBhcyBJIGRpZCBcbiAgICAgICAgIyBpbiBCYXJidWRhOlxuICAgICAgICAjIGh0dHBzOi8vZ2l0aHViLmNvbS9tY2NsaW50b2NrLWxhYi9iYXJidWRhLXJlcG9ydHMtdjIvYmxvYi9tYXN0ZXIvc2NyaXB0cy9hcnJheUhhYml0YXRUYWIuY29mZmVlI0wyMVxuICAgICAgfV1cbiAgICAgIHJlcHJlc2VudGVkQ291bnQ6IDNcbiAgICAgICMgVXNlIHNvbWV0aGluZyBsaWtlIHRoaXMgZm9yIHJlcHJlc2VudGVkQ291bnQgd2hlbiB5b3UgaGF2ZSByZWFsIGRhdGE6XG4gICAgICAjIF8uZmlsdGVyKHJlcHJlc2VudGF0aW9uRGF0YSwgKHJvdykgLT5cbiAgICAgICMgICByb3cuUHJvdGVjdGVkIGlzICdZZXMnXG4gICAgICAjICkubGVuZ3RoXG4gICAgICBhZGphY2VudFByb3RlY3RlZEFyZWFzOiB0cnVlICMgUGxhY2Vob2xkZXJcbiAgICAgICMgV291bGQgbmVlZCB0byBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUgdG8gc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgICAgICMgYWRqYWNlbnRQcm90ZWN0ZWRBcmVhczogQHJlY29yZFNldCgnQWRqYWNlbnRQcm90ZWN0ZWRBcmVhcycsIFxuICAgICAgIyAgICdhZGphY2VudCcpLmJvb2woJ0FOWV9BREpBQ0VOVCcpXG5cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlVGFibGVQYWdpbmcoKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFjdGl2aXRpZXNUYWIiLCJPdmVydmlld1RhYiA9IHJlcXVpcmUgJy4vb3ZlcnZpZXcuY29mZmVlJ1xuRW52aXJvbm1lbnRUYWIgPSByZXF1aXJlICcuL2Vudmlyb25tZW50LmNvZmZlZSdcbkZpc2hlcmllc1RhYiA9IHJlcXVpcmUgJy4vZmlzaGVyaWVzLmNvZmZlZSdcbkFjaXRpdml0aWVzVGFiID0gcmVxdWlyZSAnLi9hY3Rpdml0aWVzLmNvZmZlZSdcblxud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbT3ZlcnZpZXdUYWIsIEVudmlyb25tZW50VGFiLCBGaXNoZXJpZXNUYWIsIEFjdGl2aXRpZXNUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcHJvdGVjdGlvblpvbmUuY3NzJ11cbiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEVudmlyb25tZW50VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdFbnZpcm9ubWVudCdcbiAgY2xhc3NOYW1lOiAnZW52aXJvbm1lbnQnXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmhhYml0YXRcbiAgZGVwZW5kZW5jaWVzOiBbJ0hhYml0YXRDb21wcmVoZW5zaXZlbmVzcycsICdOZWFyVGVycmVzdHJpYWxQcm90ZWN0ZWQnXVxuICAjIFdpbGwgbGlrZWx5IGJlIGV4dGVuZGVkIGluIHRoZSBmdXR1cmUgdG8gc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgIyBkZXBlbmRlbmNpZXM6IFtcbiAgIyAgICdIYWJpdGF0J1xuICAjICAgJ1JlcHJlc2VudGF0aW9uJ1xuICAjICAgJ0FkamFjZW50UHJvdGVjdGVkQXJlYXMnXG4gICMgXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBoYWJpdGF0cyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb21wcmVoZW5zaXZlbmVzcycsICdIYWJpdGF0Q29tcHJlaGVuc2l2ZW5lc3MnKS50b0FycmF5KClcbiAgICBuZWFyX3RlcnJlc3RyaWFsX3Byb3RlY3RlZCA9IEByZWNvcmRTZXQoJ05lYXJUZXJyZXN0cmlhbFByb3RlY3RlZCcsICdOZWFyVGVycmVzdHJpYWxQcm90ZWN0ZWQnKS5ib29sKCdBZGphY2VudCcpXG4gICAgaGFiaXRhdHNJblJlc2VydmVzID0gXy5maWx0ZXIgaGFiaXRhdHMsIChyb3cpIC0+XG4gICAgICByb3cuTVBBX1RZUEUgaXMgJ01QQTEnIFxuICAgIGhhYml0YXRzSW5UeXBlVHdvcyA9IF8uZmlsdGVyIGhhYml0YXRzLCAocm93KSAtPlxuICAgICAgcm93Lk1QQV9UWVBFIGlzICdNUEEyJyBcbiAgICByZXByZXNlbnRhdGlvbkRhdGEgPSBfLmZpbHRlciBoYWJpdGF0cywgKHJvdykgLT5cbiAgICAgIHJvdy5NUEFfVFlQRSBpcyAnQUxMX1RZUEVTJyBcblxuICAgICMgVGhlIHByZWNlZWRpbmcgaXMgb2YgY291cnNlLCB0aGUgd3Jvbmcgd2F5IHRvIGRvIHRoaXMuIEkgaGF2ZSBubyBpZGVhXG4gICAgIyBob3cgRGFuIGludGVuZHMgdG8gcmVwcmVzZW50IHRoZSBoYWJpdGF0IG51bWJlcnMgZm9yIGVhY2ggb2YgdGhlc2UuIFxuICAgICMgTGV0cyBzYXkgdGhlcmUgaXMgYW4gYXR0cmlidXRlIGZvciBlYWNoIGZlYXR1cmUgaW4gdGhlIHNldCB0aGF0IGlzXG4gICAgIyBNUEFfVFlQRSAoc28gdGhlcmUgYXJlIHR3byByb3dzIHBlciBoYWJpdGF0KS4gVGhpcyBpcyBob3cgSSB3b3VsZCBzcGxpdFxuICAgICMgdGhlIGRhdGEgdXAgaW4gdGhhdCBjYXNlOlxuICAgICMgICBcbiAgICAjICAgaGFiaXRhdHMgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRzJylcbiAgICAjICAgaGFiaXRhdHNJblJlc2VydmVzID0gXy5maWx0ZXIgaGFiaXRhdHMsIChyb3cpIC0+XG4gICAgIyAgICAgcm93Lk1QQV9UWVBFIGlzICdNUEExJyBcbiAgICAjICAgaGFiaXRhdHNJblR5cGVUd29zID0gXy5maWx0ZXIgaGFiaXRhdHMsIChyb3cpIC0+XG4gICAgIyAgICAgcm93Lk1QQV9UWVBFIGlzICdNUEEyJyBcbiAgICAjIFxuICAgICMgSWYgaW5zdGVhZCB0aGUgZGF0YSBpcyBpbnN0ZWFkIHNwbGl0IGludG8gbXVsdGlwbGUgZmVhdHVyZXNldHMgKHdpdGggXG4gICAgIyB0aGUgc2FtZSBwYXJhbU5hbWUpLCB0aGVuIGl0IGdldHMgbW9yZSBjb21wbGljYXRlZC4gWW91J2QgbmVlZCB0byBhY2Nlc3NcbiAgICAjIHRoZSByZXNwb25zZSBkYXRhIHZpYSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRzJykudmFsdWUgYW5kIHBpY2tcbiAgICAjIG91dCB0aGUgYXBwcm9wcmlhdGUgZmVhdHVyZVNldHMgZm9yIGVhY2ggdHlwZS4gTWF5YmUgc29tZXRoaW5nIGxpa2UgXG4gICAgIyB0aGlzOlxuICAgICMgXG4gICAgIyAgIHJlY29yZFNldCA9IEByZWNvcmRTZXQoJ0hhYml0YXQnLCAnSGFiaXRhdHMnKVxuICAgICMgICBjb25zb2xlLmxvZyByZWNvcmRTZXQudmFsdWUgIyByZW1lbWJlciB0byB1c2UgdGhpcyB0byBkZWJ1Z1xuICAgICMgICBmZWF0dXJlU2V0ID0gXy5maW5kIHJlY29yZFNldC52YWx1ZSwgKGZzKSAtPlxuICAgICMgICAgIGZzLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbJ01QQV9UWVBFJ10gaXMgJ01QQTEnXG4gICAgIyAgIGhhYml0YXRzSW5SZXNlcnZlcyA9IF8ubWFwIGZlYXR1cmVTZXQuZmVhdHVyZXMsIChmKSAtPiBmLmF0dHJpYnV0ZXNcbiAgICAjICAgLi4uIGFuZCByZXBlYXQgZm9yIFR5cGUtSUkgTVBBc1xuICAgICMgXG4gICAgY29udGV4dCA9XG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgI2ZpeCB0aGlzIHRvIGdldCByaWQgb2YgaGFyZGNvZGVkIHZhbHVlXG4gICAgICBoYWJpdGF0c0NvdW50OiA2MlxuICAgICAgaGFzUmVzZXJ2ZURhdGE6IGhhYml0YXRzSW5SZXNlcnZlcz8ubGVuZ3RoID4gMFxuICAgICAgaGFiaXRhdHNJblJlc2VydmVzOiBoYWJpdGF0c0luUmVzZXJ2ZXNcbiAgICAgIGhhYml0YXRzSW5SZXNlcnZlc0NvdW50OiBoYWJpdGF0c0luUmVzZXJ2ZXM/Lmxlbmd0aFxuICAgICAgI2hhYml0YXRzSW5SZXNlcnZlc0NvdW50OiBfLmZpbHRlcihoYWJpdGF0c0luUmVzZXJ2ZXMsIChyb3cpIC0+IFxuICAgICAgIyAgIyBOZWVkIHRvIGNvbWUgdXAgd2l0aCBzb21lIG90aGVyIHN0YW5kYXJkIHRoYXQganVzdCBwcmVzZW5jZT9cbiAgICAgICMgIHJvdy5DQl9QRVJDID4gMFxuICAgICAgIykubGVuZ3RoXG4gICAgICBoYXNUeXBlVHdvRGF0YTogaGFiaXRhdHNJblR5cGVUd29zPy5sZW5ndGggPiAwXG4gICAgICBoYWJpdGF0c0luVHlwZVR3b0NvdW50OiBoYWJpdGF0c0luVHlwZVR3b3M/Lmxlbmd0aFxuICAgICAgaGFiaXRhdHNJblR5cGVUd29zOiBoYWJpdGF0c0luVHlwZVR3b3NcbiAgICAgICNoYWJpdGF0c0luVHlwZVR3b3NDb3VudDogXy5maWx0ZXIoaGFiaXRhdHNJblR5cGVUd29zLCAocm93KSAtPiBcbiAgICAgICAgIyBOZWVkIHRvIGNvbWUgdXAgd2l0aCBzb21lIG90aGVyIHN0YW5kYXJkIHRoYXQganVzdCBwcmVzZW5jZT9cbiAgICAgICMgIHJvdy5DQl9QRVJDID4gMFxuICAgICAgIykubGVuZ3RoXG4gICAgICAjIHJlcHJlc2VudGF0aW9uRGF0YTogQHJlY29yZFNldCgnUmVwcmVzZW50YXRpb24nLCAnUmVwcmVzZW50YXRpb24nKVxuICAgICAgIyAgIC50b0FycmF5KClcbiAgICAgIHJlcHJlc2VudGF0aW9uRGF0YTpyZXByZXNlbnRhdGlvbkRhdGFcbiAgICAgIGhhc1JlcHJlc2VudGF0aW9uRGF0YTpyZXByZXNlbnRhdGlvbkRhdGE/Lmxlbmd0aCA+IDBcbiAgICAgIHJlcHJlc2VudGVkQ291bnQ6cmVwcmVzZW50YXRpb25EYXRhPy5sZW5ndGhcbiAgICAgICNyZXByZXNlbnRlZENvdW50Ol8uZmlsdGVyKHJlcHJlc2VudGF0aW9uRGF0YSwgKHJvdykgLT4gXG4gICAgICAgICMgTmVlZCB0byBjb21lIHVwIHdpdGggc29tZSBvdGhlciBzdGFuZGFyZCB0aGF0IGp1c3QgcHJlc2VuY2U/XG4gICAgICAjICByb3cuQ0JfUEVSQyA+IDBcbiAgICAgICMpLmxlbmd0aFxuXG4gICAgICAjIFVzZSBzb21ldGhpbmcgbGlrZSB0aGlzIGZvciByZXByZXNlbnRlZENvdW50IHdoZW4geW91IGhhdmUgcmVhbCBkYXRhOlxuICAgICAgIyBfLmZpbHRlcihyZXByZXNlbnRhdGlvbkRhdGEsIChyb3cpIC0+XG4gICAgICAjICAgcm93LlByb3RlY3RlZCBpcyAnWWVzJ1xuICAgICAgIyApLmxlbmd0aFxuICAgICAgYWRqYWNlbnRQcm90ZWN0ZWRBcmVhczogbmVhcl90ZXJyZXN0cmlhbF9wcm90ZWN0ZWQgIyBQbGFjZWhvbGRlclxuICAgICAgIyBXb3VsZCBuZWVkIHRvIGJlIGNoYW5nZWQgaW4gdGhlIGZ1dHVyZSB0byBzb21ldGhpbmcgbGlrZSB0aGlzOlxuICAgICAgIyBhZGphY2VudFByb3RlY3RlZEFyZWFzOiBAcmVjb3JkU2V0KCdBZGphY2VudFByb3RlY3RlZEFyZWFzJywgXG4gICAgICAjICAgJ2FkamFjZW50JykuYm9vbCgnQU5ZX0FESkFDRU5UJylcblxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVUYWJsZVBhZ2luZygpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudmlyb25tZW50VGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgRmlzaGVyaWVzVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gICMgdGhpcyBpcyB0aGUgbmFtZSB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBUYWJcbiAgbmFtZTogJ0Zpc2hlcmllcydcbiAgY2xhc3NOYW1lOiAnZmlzaGVyaWVzJ1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5maXNoZXJpZXNcbiAgIyBEZXBlbmRlbmNpZXMgd2lsbCBsaWtlbHkgbmVlZCB0byBiZSBjaGFuZ2VkIHRvIHNvbWV0aGluZyBsaWtlIHRoaXMgdG9cbiAgIyBzdXBwb3J0IG1vcmUgR1Agc2VydmljZXM6XG4gICMgZGVwZW5kZW5jaWVzOiBbXG4gICMgICAnQ29tbWVyY2lhbEZpc2hpbmcnXG4gICMgICAnUmVjcmVhdGlvbmFsRmlzaGluZydcbiAgIyAgICdDdXN0b21hcnlGaXNoaW5nJ1xuICAjICAgJ1RvdGFsRm9vZCdcbiAgIyBdXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuICAgIGNvbnRleHQgPVxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgY29tbWVyY2lhbEZpc2hpbmc6IFtdXG4gICAgICByZWNyZWF0aW9uYWxGaXNoaW5nOiBbXVxuICAgICAgY3VzdG9tYXJ5RmlzaGluZzogW11cbiAgICAgIHRvdGFsRm9vZDogW11cbiAgICAgICMgY29tbWVyY2lhbEZpc2hpbmc6IEByZWNvcmRTZXQoJ0NvbW1lcmNpYWxGaXNoaW5nJywgJ2Zpc2hpbmcnKS50b0FycmF5KClcbiAgICAgICMgcmVjcmVhdGlvbmFsRmlzaGluZzogQHJlY29yZFNldCgnUmVjcmVhdGlvbmFsRmlzaGluZycsICdmaXNoaW5nJylcbiAgICAgICMgICAudG9BcnJheSgpXG4gICAgICAjIGN1c3RvbWFyeUZpc2hpbmc6IEByZWNvcmRTZXQoJ0N1c3RvbWFyeUZpc2hpbmcnLCAnZmlzaGluZycpLnRvQXJyYXkoKVxuICAgICAgIyB0b3RhbEZvb2Q6IEByZWNvcmRTZXQoJ1RvdGFsRm9vZCcsICdUb3RhbEZvb2QnKS50b0FycmF5KClcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcblxubW9kdWxlLmV4cG9ydHMgPSBGaXNoZXJpZXNUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5NSU5fU0laRSA9IDEwMDAwXG5cbmNsYXNzIE92ZXJ2aWV3VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gICMgdGhpcyBpcyB0aGUgbmFtZSB0aGF0IHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGltZW91dDogMTIwMDAwXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMub3ZlcnZpZXdcbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ1RhcmdldFNpemUnXG4gICAgJ0hhYml0YXRDb3VudCdcbiAgICAnSGFiaXRhdENvdW50UGVyY2VudCdcbiAgXVxuICAjIERlcGVuZGVuY2llcyB3aWxsIGxpa2VseSBuZWVkIHRvIGJlIGNoYW5nZWQgdG8gc29tZXRoaW5nIGxpa2UgdGhpcyB0b1xuICAjIHN1cHBvcnQgbW9yZSBHUCBzZXJ2aWNlczpcbiAgIyBkZXBlbmRlbmNpZXM6IFtcbiAgIyAgICdUYXJnZXRTaXplJ1xuICAjICAgJ1JlcHJlc2VudGF0aW9uT2ZIYWJpdGF0cydcbiAgIyAgICdQZXJjZW50UHJvdGVjdGVkJ1xuICAjIF1cblxuICByZW5kZXI6ICgpIC0+XG4gICAgIyBUaGUgQHJlY29yZFNldCBtZXRob2QgY29udGFpbnMgc29tZSB1c2VmdWwgbWVhbnMgdG8gZ2V0IGRhdGEgb3V0IG9mIFxuICAgICMgdGhlIG1vbnN0ZXJvdXMgUmVjb3JkU2V0IGpzb24uIENoZWNrb3V0IHRoZSBzZWFza2V0Y2gtcmVwb3J0aW5nLXRlbXBsYXRlXG4gICAgIyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAgSEVDVEFSRVMgPSBAcmVjb3JkU2V0KCdUYXJnZXRTaXplJywgJ1RhcmdldFNpemUnKS5mbG9hdCgnU0laRV9JTl9IQScpXG4gICAgIyByZXN1bHQ6IEpTT04uc3RyaW5naWZ5KEByZXN1bHRzLmdldCgnZGF0YScpLCBudWxsLCAnICAnKVxuICAgIGhjX3Byb3Bvc2VkID0gQHJlY29yZFNldCgnSGFiaXRhdENvdW50JywgJ0hhYml0YXRDb3VudCcpLmZsb2F0KCdTRUxfSEFCJylcbiAgICBoY19leGlzdGluZyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudCcsICdIYWJpdGF0Q291bnQnKS5mbG9hdCgnRVhTVF9IQUInKVxuICAgIGhjX2NvbWJpbmVkID1AcmVjb3JkU2V0KCdIYWJpdGF0Q291bnQnLCAnSGFiaXRhdENvdW50JykuZmxvYXQoJ0NNQkRfSEFCJylcbiAgICBoY190b3RhbCA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudCcsICdIYWJpdGF0Q291bnQnKS5mbG9hdCgnVE9UX0hBQicpXG5cbiAgICBIQUJfUEVSQ19NUl9ORVcgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnTldfUkVTX1BSQycpXG4gICAgSEFCX1BFUkNfTVJfRVhJU1RJTkcgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnRVhfUkVTX1BSQycpXG4gICAgSEFCX1BFUkNfTVJfQ09NQklORUQgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnQ0JfUkVTX1BSQycpXG5cbiAgICBIQUJfUEVSQ19UMl9ORVcgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnTldfSFBBX1BSQycpXG4gICAgSEFCX1BFUkNfVDJfRVhJU1RJTkcgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnRVhfSFBBX1BSQycpXG4gICAgSEFCX1BFUkNfVDJfQ09NQklORUQgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnQ0JfSFBBX1BSQycpXG5cbiAgICAjaHBfbXJfbmV3ID0gQHJlY29yZFNldCgnSGFiaXRhdENvdW50UGVyY2VudCcsICdIYWJpdGF0Q291bnRQZXJjZW50JykuZmxvYXQoJ05XX1JFU19QUkMnKVxuICAgICNocF9tcl9leGlzdGluZyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdFWF9SRVNfUFJDJylcbiAgICAjaHBfbXJfY29tYmluZWQgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnQ0JfUkVTX1BSQycpXG5cbiAgICAjaHBfdHlwZTJfbmV3ID0gQHJlY29yZFNldCgnSGFiaXRhdENvdW50UGVyY2VudCcsICdIYWJpdGF0Q291bnRQZXJjZW50JykuZmxvYXQoJ05XX0hQQV9QUkMnKVxuICAgICNocF90eXBlMl9leGlzdGluZyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdFWF9IUEFfUFJDJylcbiAgICAjaHBfdHlwZTJfY29tYmluZWQgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnQ0JfSFBBX1BSQycpXG5cbiAgICAjIEkgdXNlIHRoaXMgaXNDb2xsZWN0aW9uIGZsYWcgdG8gY3VzdG9taXplIHRoZSBkaXNwbGF5LiBBbm90aGVyIG9wdGlvblxuICAgICMgd291bGQgYmUgdG8gaGF2ZSB0b3RhbGx5IGRpZmZlcmVudCBUYWIgaW1wbGVtZW50YXRpb25zIGZvciB6b25lcyB2cyBcbiAgICAjIGNvbGxlY3Rpb25zLiBJIGRpZG4ndCBkbyB0aGF0IGhlcmUgc2luY2UgdGhleSBhcmUgc28gc2ltaWxhci5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBpZiBpc0NvbGxlY3Rpb25cbiAgICAgICMgQG1vZGVsIGlzIHRoZSBjbGllbnQtc2lkZSBza2V0Y2ggcmVwcmVzZW50YXRpb24sIHdoaWNoIGhhcyBzb21lXG4gICAgICAjIHVzZWZ1bCwgaWYgdW5kb2N1bWVudGVkLCBtZXRob2RzIGxpa2UgZ2V0Q2hpbGRyZW4oKS5cbiAgICAgIGNoaWxkcmVuID0gQG1vZGVsLmdldENoaWxkcmVuKClcbiAgICAgICMgTk9URTogSSdtIGRpdmlkaW5nIGJ5IGFsbCBjaGlsZHJlbiBoZXJlLiBTaG91bGQgdGhpcyBiZSBmaWx0ZXJlZCB0b1xuICAgICAgIyBleGNsdWRlIEFxdWFjdWx0dXJlIGFuZCBNb29yaW5nIGFyZWFzPz9cbiAgICAgIEhFQ1RBUkVTID0gSEVDVEFSRVMgLyBjaGlsZHJlbi5sZW5ndGhcbiAgICAgIG1hcmluZVJlc2VydmVzID0gXy5maWx0ZXIgY2hpbGRyZW4sIChjaGlsZCkgLT4gXG4gICAgICAgIGNoaWxkLmdldEF0dHJpYnV0ZSgnTVBBX1RZUEUnKSBpcyAnTVBBMSdcbiAgICAgIHR5cGUyTVBBcyA9IF8uZmlsdGVyIGNoaWxkcmVuLCAoY2hpbGQpIC0+IFxuICAgICAgICBjaGlsZC5nZXRBdHRyaWJ1dGUoJ01QQV9UWVBFJykgaXMgJ01QQTInXG4gICAgY29udGV4dCA9XG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhbnlBdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpLmxlbmd0aCA+IDBcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBTSVpFOiBIRUNUQVJFU1xuICAgICAgU0laRV9PSzogSEVDVEFSRVMgPiBNSU5fU0laRVxuICAgICAgTUlOX1NJWkU6IE1JTl9TSVpFXG4gICAgICBNQVJJTkVfUkVTRVJWRVM6IG1hcmluZVJlc2VydmVzPy5sZW5ndGhcbiAgICAgIE1BUklORV9SRVNFUlZFU19QTFVSQUw6IG1hcmluZVJlc2VydmVzPy5sZW5ndGggIT0gMVxuICAgICAgVFlQRV9UV09fTVBBUzogdHlwZTJNUEFzPy5sZW5ndGhcbiAgICAgIFRZUEVfVFdPX01QQVNfUExVUkFMOiB0eXBlMk1QQXM/Lmxlbmd0aCAhPSAxXG4gICAgICBOVU1fUFJPVEVDVEVEOiBtYXJpbmVSZXNlcnZlcz8ubGVuZ3RoICsgdHlwZTJNUEFzPy5sZW5ndGhcbiAgICAgIEhBQl9DT1VOVF9QUk9QT1NFRDogaGNfcHJvcG9zZWRcbiAgICAgIEhBQl9DT1VOVF9FWElTVElORzogaGNfZXhpc3RpbmdcbiAgICAgIEhBQl9DT1VOVF9DT01CSU5FRDogaGNfY29tYmluZWRcbiAgICAgIEhBQl9DT1VOVF9UT1RBTDogaGNfdG90YWxcbiAgICAgIEhBQl9QRVJDX01SX05FVzogSEFCX1BFUkNfTVJfTkVXXG4gICAgICBIQUJfUEVSQ19NUl9FWElTVElORzogSEFCX1BFUkNfTVJfRVhJU1RJTkdcbiAgICAgIEhBQl9QRVJDX01SX0NPTUJJTkVEOiBIQUJfUEVSQ19NUl9DT01CSU5FRFxuICAgICAgSEFCX1BFUkNfVDJfTkVXOiBIQUJfUEVSQ19UMl9ORVdcbiAgICAgIEhBQl9QRVJDX1QyX0VYSVNUSU5HOiBIQUJfUEVSQ19UMl9FWElTVElOR1xuICAgICAgSEFCX1BFUkNfVDJfQ09NQklORUQ6IEhBQl9QRVJDX1QyX0NPTUJJTkVEXG5cbiAgICAjIEB0ZW1wbGF0ZSBpcyAvdGVtcGxhdGVzL292ZXJ2aWV3Lm11c3RhY2hlXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgcGFydGlhbHMpXG4gICAgIyBJZiB0aGUgbWVhc3VyZSBpcyB0b28gaGlnaCwgdGhlIHZpc3VhbGl6YXRpb24ganVzdCBsb29rcyBzdHVwaWRcbiAgICBpZiBIRUNUQVJFUyA8IE1JTl9TSVpFICogMlxuICAgICAgQGRyYXdWaXooSEVDVEFSRVMpXG4gICAgZWxzZVxuICAgICAgQCQoJy52aXonKS5oaWRlKClcblxuICAjIEQzIGlzIGEgYml0IG9mIGEgbWVzcyB1bmxlc3MgeW91J3ZlIHJlYWxseSBpbnRlcm5hbGl6ZWQgaXQncyB3YXkgb2YgZG9pbmdcbiAgIyB0aGluZ3MuIEknZCBzdWdnZXN0IGp1c3QgZGlzcGxheWluZyB0aGUgXCJSZXByZXNlbnRhdGlvblwiIGFuZCBcIlBlcmNlbnRcIlxuICAjIGluZm8gd2l0aCBzaW1wbGUgdGFibGVzIHVubGVzcyB0aGVyZSBpcyBwbGVudHkgb2YgdGltZSB0byB3b3JrIG9uIHRoZVxuICAjIHZpc3VhbGl6YXRpb25zIGluIHRoZSBtb2NrdXBzLlxuICBkcmF3Vml6OiAoc2l6ZSkgLT5cbiAgICAjIENoZWNrIGlmIGQzIGlzIHByZXNlbnQuIElmIG5vdCwgd2UncmUgcHJvYmFibHkgZGVhbGluZyB3aXRoIElFXG4gICAgaWYgd2luZG93LmQzXG4gICAgICBjb25zb2xlLmxvZyAnZDMnXG4gICAgICBlbCA9IEAkKCcudml6JylbMF1cbiAgICAgIG1heFNjYWxlID0gTUlOX1NJWkUgKiAyXG4gICAgICByYW5nZXMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnQmVsb3cgcmVjb21tZW5kZWQgKDAgLSAxMCwwMDAgaGEpJ1xuICAgICAgICAgIHN0YXJ0OiAwXG4gICAgICAgICAgZW5kOiBNSU5fU0laRVxuICAgICAgICAgIGJnOiBcIiM4ZTVlNTBcIlxuICAgICAgICAgIGNsYXNzOiAnYmVsb3cnXG4gICAgICAgIH1cbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdSZWNvbW1lbmRlZCAoPiAxMCwwMDAgaGEpJ1xuICAgICAgICAgIHN0YXJ0OiBNSU5fU0laRVxuICAgICAgICAgIGVuZDogTUlOX1NJWkUgKiAyXG4gICAgICAgICAgYmc6ICcjNTg4ZTNmJ1xuICAgICAgICAgIGNsYXNzOiAncmVjb21tZW5kZWQnXG4gICAgICAgIH1cbiAgICAgIF1cblxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIG1heFNjYWxlXSlcbiAgICAgICAgLnJhbmdlKFswLCA0MDBdKVxuICAgICAgXG4gICAgICBjaGFydCA9IGQzLnNlbGVjdChlbClcbiAgICAgIGNoYXJ0LnNlbGVjdEFsbChcImRpdi5yYW5nZVwiKVxuICAgICAgICAuZGF0YShyYW5nZXMpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGQpIC0+IHgoZC5lbmQgLSBkLnN0YXJ0KSArICdweCcpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQpIC0+IFwicmFuZ2UgXCIgKyBkLmNsYXNzKVxuICAgICAgICAuYXBwZW5kKFwic3BhblwiKVxuICAgICAgICAgIC50ZXh0KChkKSAtPiBkLm5hbWUpXG5cbiAgICAgIGNoYXJ0LnNlbGVjdEFsbChcImRpdi5tZWFzdXJlXCIpXG4gICAgICAgIC5kYXRhKFtzaXplXSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWVhc3VyZVwiKVxuICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIChkKSAtPiB4KGQpICsgJ3B4JylcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiXCIpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBPdmVydmlld1RhYiIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYWN0aXZpdGllc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gYWN0aXZpdGllc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VGhlcmUgd2lsbCBiZSBhY3Rpdml0aWVzIGFuZCBVc2VzIEhlcmU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZGVtb1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXBvcnQgU2VjdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+VXNlIHJlcG9ydCBzZWN0aW9ucyB0byBncm91cCBpbmZvcm1hdGlvbiBpbnRvIG1lYW5pbmdmdWwgY2F0ZWdvcmllczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkQzIFZpc3VhbGl6YXRpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx1bCBjbGFzcz1cXFwibmF2IG5hdi1waWxsc1xcXCIgaWQ9XFxcInRhYnMyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGxpIGNsYXNzPVxcXCJhY3RpdmVcXFwiPjxhIGhyZWY9XFxcIiNjaGFydFxcXCI+Q2hhcnQ8L2E+PC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGxpPjxhIGhyZWY9XFxcIiNkYXRhVGFibGVcXFwiPlRhYmxlPC9hPjwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3VsPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidGFiLWNvbnRlbnRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJ0YWItcGFuZSBhY3RpdmVcXFwiIGlkPVxcXCJjaGFydFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPCEtLVtpZiBJRSA4XT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cCBjbGFzcz1cXFwidW5zdXBwb3J0ZWRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFRoaXMgdmlzdWFsaXphdGlvbiBpcyBub3QgY29tcGF0aWJsZSB3aXRoIEludGVybmV0IEV4cGxvcmVyIDguIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFBsZWFzZSB1cGdyYWRlIHlvdXIgYnJvd3Nlciwgb3IgdmlldyByZXN1bHRzIGluIHRoZSB0YWJsZSB0YWIuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPiAgICAgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwhW2VuZGlmXS0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgU2VlIDxjb2RlPnNyYy9zY3JpcHRzL2RlbW8uY29mZmVlPC9jb2RlPiBmb3IgYW4gZXhhbXBsZSBvZiBob3cgdG8gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICB1c2UgZDMuanMgdG8gcmVuZGVyIHZpc3VhbGl6YXRpb25zLiBQcm92aWRlIGEgdGFibGUtYmFzZWQgdmlld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgYW5kIHVzZSBjb25kaXRpb25hbCBjb21tZW50cyB0byBwcm92aWRlIGEgZmFsbGJhY2sgZm9yIElFOCB1c2Vycy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxhIGhyZWY9XFxcImh0dHA6Ly90d2l0dGVyLmdpdGh1Yi5pby9ib290c3RyYXAvMi4zLjIvXFxcIj5Cb290c3RyYXAgMi54PC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgaXMgbG9hZGVkIHdpdGhpbiBTZWFTa2V0Y2ggc28geW91IGNhbiB1c2UgaXQgdG8gY3JlYXRlIHRhYnMgYW5kIG90aGVyIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgaW50ZXJmYWNlIGNvbXBvbmVudHMuIGpRdWVyeSBhbmQgdW5kZXJzY29yZSBhcmUgYWxzbyBhdmFpbGFibGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwidGFiLXBhbmVcXFwiIGlkPVxcXCJkYXRhVGFibGVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5pbmRleDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPnZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNoYXJ0RGF0YVwiLGMscCwxKSxjLHAsMCwxMzUxLDE0MTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcImluZGV4XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gZW1waGFzaXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkVtcGhhc2lzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPkdpdmUgcmVwb3J0IHNlY3Rpb25zIGFuIDxjb2RlPmVtcGhhc2lzPC9jb2RlPiBjbGFzcyB0byBoaWdobGlnaHQgaW1wb3J0YW50IGluZm9ybWF0aW9uLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gd2FybmluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+V2FybmluZzwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5PciA8Y29kZT53YXJuPC9jb2RlPiBvZiBwb3RlbnRpYWwgcHJvYmxlbXMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBkYW5nZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRhbmdlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD48Y29kZT5kYW5nZXI8L2NvZGU+IGNhbiBhbHNvIGJlIHVzZWQuLi4gc3BhcmluZ2x5LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJmaXNoZXJpZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+Q29tbWVyY2lhbCBGaXNoaW5nPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFmZmVjdGVkIEFyZWEgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5MZXZlbCBvZiBGaXNoaW5nIERpc3BsYWNlZCAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkVjb25vbWljIFZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgQWZmZWN0ZWQgRmlzaGVyczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+RmlzaGVycyBpbiBHdWxmIEZpc2hlcnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY29tbWVyY2lhbEZpc2hpbmdcIixjLHAsMSksYyxwLDAsNDEwLDYwNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFmZmVjdGVkXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJMZXZlbFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk51bVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRmlzaGVyc1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjZcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgTm90ZTogYXMgbm90IGFsbCBhcmVhcyBmaXNoZWQgaGF2ZSB0aGUgc2FtZSBmaXNoaW5nIGVmZm9ydCBvciBjYXRjaCwgdGhlIOKAnExldmVsIG9mIEZpc2hpbmcgRGlzcGxhY2Vk4oCdIGlzIGEgY29tYmluYXRpb24gb2YgdGhlIGFyZWEgYmVpbmcgcmVzdHJpY3RlZCBhbmQgdGhlIGNhdGNoIHRoYXQgd291bGQgbm9ybWFsbHkgYmUgY2F1Z2h0IGluIHRoYXQgYXJlYS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZWNyZWF0aW9uYWwgRmlzaGluZzwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OYW1lPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BZmZlY3RlZCBBcmVhICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TGV2ZWwgb2YgRmlzaGluZyBEaXNwbGFjZWQgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5FY29ub21pYyBWYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TnVtYmVyIG9mIEFmZmVjdGVkIEZpc2hlcnM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkZpc2hlcnMgaW4gR3VsZiBGaXNoZXJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInJlY3JlYXRpb25hbEZpc2hpbmdcIixjLHAsMSksYyxwLDAsMTQxOSwxNjEzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQWZmZWN0ZWRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkxldmVsXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTnVtXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJGaXNoZXJzXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCI2XFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkN1c3RvbWFyeSBGaXNoaW5nPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFmZmVjdGVkIEFyZWEgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5MZXZlbCBvZiBGaXNoaW5nIERpc3BsYWNlZCAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkVjb25vbWljIFZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgQWZmZWN0ZWQgRmlzaGVyczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+RmlzaGVycyBpbiBHdWxmIEZpc2hlcnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY3VzdG9tYXJ5RmlzaGluZ1wiLGMscCwxKSxjLHAsMCwyMjE5LDI0MTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBZmZlY3RlZFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTGV2ZWxcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOdW1cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkZpc2hlcnNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNlxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBJbXBvcnRhbnQgY3VzdG9tYXJ5IGZpc2hpbmcgbG9jYXRpb25zIGhhdmUgbm90IGJlZW4gaWRlbnRpZmllZCB5ZXQuIEluZm9ybWF0aW9uIG9uIHRoZSB3aGVyZWFib3V0cyBvZiB0aGVzZSBhY3Rpdml0aWVzIG1heSBiZSBhZGRlZCBkdXJpbmcgcGxhbm5pbmcgcHJvY2Vzcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Ub3RhbCBGb29kIFByb3Zpc2lvbjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5GaXNoIFN0b2NrPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5DYXRjaCBEaXNwbGFjZWQgKHRvbm5zcyk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgZnJvbSBHdWxmPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRBQzwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VmFsdWUgb2YgRmlzaDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VmFsdWUgdG8gTlogRWNvbm9teTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ0b3RhbEZvb2RcIixjLHAsMSksYyxwLDAsMzE1MiwzMzQ2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiZmlzaFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiY2F0Y2hcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcImd1bGZcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInRhY1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInZhbHVlX3RvX256XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjZcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgVGhlIHRvdGFsIGZvb2QgcHJvdmlzaW9uIGluY2x1ZGVzIGNvbW1lcmNpYWwsIHJlY3JlYXRpb25hbCwgYW5kXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIGN1c3RvbWFyeSBjYXRjaC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImhhYml0YXRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwxNywzMjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhlIGNvbGxlY3Rpb24gb2YgbWFyaW5lIHByb3RlY3RlZCBhcmVhcyB3aWxsIHByb3RlY3QgdGhlIGZ1bGwgcmFuZ2Ugb2YgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBuYXR1cmFsIG1hcmluZSBoYWJpdGF0cyBhbmQgZWNvc3lzdGVtcy4gVGhlc2UgcmVwb3J0cyBzaG93IHRoZSBwcm9wb3J0aW9uIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgb2YgdGhlIGd1bGYgcHJvdGVjdGVkIGZvciBlYWNoIGhhYml0YXQgdHlwZSBpbiBNYXJpbmUgUmVzZXJ2ZXMgYW5kIFR5cGUtMiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFByb3RlY3RlZCBBcmVhcywgZm9yIGJvdGggZXhpc3RpbmcgcHJvdGVjdGVkIGFyZWFzIGFuZCBza2V0Y2hlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNSZXNlcnZlRGF0YVwiLGMscCwxKSxjLHAsMCwzNjEsMTQ4NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgUHJvdGVjdGVkIGluIE1hcmluZSBSZXNlcnZlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj4gPCEtLSBkYXRhLXBhZ2luZy4uLiBhY3RpdmF0ZXMgcGFnaW5nICAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MTgwcHg7XFxcIj5IYWJpdGF0czwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+JSBJbiBFeGlzdGluZyBNYXJpbmUgUmVzZXJ2ZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPiUgSW4gTmV3IE1hcmluZSBSZXNlcnZlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjUwcHg7XFxcIj5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c0luUmVzZXJ2ZXNcIixjLHAsMSksYyxwLDAsNzkxLDkzOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9UWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJFWF9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJORVdfUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0JfUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjRcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDExMjQsMTE3MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgTWFyaW5lIFJlc2VydmVzIHByb3RlY3RcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgICAgVGhpcyBNYXJpbmUgUmVzZXJ2ZSBwcm90ZWN0c1wiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgICAgICAgICAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImhhYml0YXRzSW5SZXNlcnZlc0NvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJoYWJpdGF0c0NvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IGhhYml0YXQgdHlwZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNUeXBlVHdvRGF0YVwiLGMscCwxKSxjLHAsMCwxNTI2LDI2MzcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIFByb3RlY3RlZCBpbiBUeXBlLTIgUHJvdGVjdGVkIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoxODBweDtcXFwiPkhhYml0YXRzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD4lIEluIEV4aXN0aW5nIFR5cGUtMiBQcm90ZWN0ZWQgQXJlYXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPiUgSW4gTmV3IFR5cGUtMiBQcm90ZWN0ZWQgQXJlYXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDo1MHB4O1xcXCI+VG90YWw8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFiaXRhdHNJblR5cGVUd29zXCIsYyxwLDEpLGMscCwwLDE5MzUsMjA4MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9UWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJFWF9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJORVdfUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0JfUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjRcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDIyNjgsMjMxOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgVHlwZS0yIFJlc2VydmVzIHByb3RlY3QgXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgIFRoaXMgVHlwZS0yIFByb3RlY3RlZCBBcmVhIHByb3RlY3RzXCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgICAgICAgICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiaGFiaXRhdHNJblR5cGVUd29Db3VudFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiaGFiaXRhdHNDb3VudFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBoYWJpdGF0IHR5cGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlBERiBzYXlzIGZvciBib3RoIHpvbmVzIGFuZCBjb2xsZWN0aW9ucy4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiSSBqdXN0IGluY2x1ZGVkIGNvbGxlY3Rpb25zIGZvciBub3cgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIi0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNSZXByZXNlbnRhdGlvbkRhdGFcIixjLHAsMSksYyxwLDAsMjc3NCwzNzExLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0IFJlcHJlc2VudGF0aW9uPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXRzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Ub3RhbCBIQSBQcm90ZWN0ZWQgaW4gQWxsIEFyZWFzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Ub3RhbCAlIGluIEFsbCBBcmVhczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TnVtYmVyIG9mIFNpdGVzIFByb3RlY3RlZDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QWRlcXVhdGVseSBSZXByZXNlbnRlZD88L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVwcmVzZW50YXRpb25EYXRhXCIsYyxwLDEpLGMscCwwLDMxNjUsMzMzNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9UWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDQl9TSVpFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDQl9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJSRVBfQ09VTlRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPj8/PC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNVxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJyZXByZXNlbnRlZENvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJoYWJpdGF0c0NvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IGhhYml0YXRzIGFyZSBhZGVxdWF0ZWx5IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIHByb3RlY3RlZC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtpZihfLnMoXy5mKFwiYWRqYWNlbnRQcm90ZWN0ZWRBcmVhc1wiLGMscCwxKSxjLHAsMCwzNzg0LDM5ODIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkFkamFjZW50IFRlcnJlc3RyaWFsIFByb3RlY3RlZCBBcmVhPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZSBncmVlbi1jaGVja1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgem9uZSBpcyBhZGphY2VudCB0byBhIDxzdHJvbmc+VGVycmVzdHJpYWwgUHJvdGVjdGVkIEFyZWE8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319O3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wib3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpemVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlIFwiKTtpZihfLnMoXy5mKFwiU0laRV9PS1wiLGMscCwxKSxjLHAsMCwzNzUsMzg2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJncmVlbi1jaGVja1wiKTt9KTtjLnBvcCgpO31fLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8IS0tIE5vdGljZSwgdXNpbmcgbXVzdGFjaGUgdGFncyBoZXJlIHRvIHRlc3Qgd2hldGhlciB3ZSdyZSByZW5kZXJpbmcgYSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgY29sbGVjdGlvbiBvciBhIHNpbmdsZSB6b25lIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNTM1LDY1NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIFRoZSBhdmVyYWdlIHNpemUgb2YgdGhlIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTlVNX1BST1RFQ1RFRFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBwcm90ZWN0ZWQgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGFyZWFzIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiU0laRVwiLGMscCwwKSkpO18uYihcIiBoYTwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgIFRoaXMgcHJvdGVjdGVkIGFyZWEgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJTSVpFXCIsYyxwLDApKSk7Xy5iKFwiIGhhPC9zdHJvbmc+LFwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiU0laRV9PS1wiLGMscCwxKSxjLHAsMCw3OTIsODQwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgbWVldGluZyB0aGUgdGFyZ2V0IG9mIFwiKTtfLmIoXy52KF8uZihcIk1JTl9TSVpFXCIsYyxwLDApKSk7Xy5iKFwiIGhhLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJTSVpFX09LXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgIHdoaWNoIGRvZXMgbm90IG1lZXQgdGhlIHRhcmdldCBvZiBcIik7Xy5iKF8udihfLmYoXCJNSU5fU0laRVwiLGMscCwwKSkpO18uYihcIiBoYS5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgc3R5bGU9XFxcImZvbnQtc2l6ZToxMnB4O3BhZGRpbmc6MTFweDt0ZXh0LWFsaWduOmxlZnQ7bWFyZ2luLXRvcDotMTBweDtcXFwiPkZvciB0aGUgc2FtZSBhbW91bnQgb2YgYXJlYSB0byBiZSBwcm90ZWN0ZWQsIGl0IGlzIGRlc2lyYWJsZSB0byBwcm90ZWN0IGZld2VyLCBsYXJnZXIgYXJlYXMgcmF0aGVyIHRoYW4gbnVtZXJvdXMgc21hbGxlciBvbmVzLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDEyMDAsMTU0MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCIgc3R5bGU9XFxcInBhZGRpbmc6MHB4IDEwcHg7cGFkZGluZy1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFRoZSBzZWxlY3RlZCBuZXR3b3JrIGNvbnRhaW5zIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiVFlQRV9UV09fTVBBU1wiLGMscCwwKSkpO18uYihcIiBIYWJpdGF0IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFByb3RlY3Rpb24gWm9uZVwiKTtpZihfLnMoXy5mKFwiVFlQRV9UV09fTVBBU19QTFVSQUxcIixjLHAsMSksYyxwLDAsMTM4NiwxMzg3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIiBhbmQgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgXCIpO18uYihfLnYoXy5mKFwiTUFSSU5FX1JFU0VSVkVTXCIsYyxwLDApKSk7Xy5iKFwiIE1hcmluZVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFJlc2VydmVcIik7aWYoXy5zKF8uZihcIk1BUklORV9SRVNFUlZFU19QTFVSQUxcIixjLHAsMSksYyxwLDAsMTQ5MSwxNDkyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcHJlc2VudGF0aW9uIG9mIEhhYml0YXRzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPiA8IS0tIGRhdGEtcGFnaW5nLi4uIGFjdGl2YXRlcyBwYWdpbmcgIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoxODBweDtcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW4gUHJvcG9zZWQgQXJlYXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkluIEV4aXN0aW5nIEFyZWFzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Db21iaW5lZDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VG90YWwgPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPk51bWJlciBvZiBIYWJpdGF0cyBQcm90ZWN0ZWQ8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9DT1VOVF9QUk9QT1NFRFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX0NPVU5UX0VYSVNUSU5HXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfQ09VTlRfQ09NQklORURcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9DT1VOVF9UT1RBTFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCI1XFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwyMzI0LDIzOTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIE5ldyBhbmQgZXhpc3RpbmcgTWFyaW5lIFJlc2VydmVzIHByb3RlY3RcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgICAgVGhpcyBNYXJpbmUgUmVzZXJ2ZSBwcm90ZWN0c1wiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgICAgICAgICAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIkhBQl9DT1VOVF9DT01CSU5FRFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiSEFCX0NPVU5UX1RPVEFMXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IGhhYml0YXQgdHlwZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5QZXJjZW50IG9mIEhhdXJha2kgR3VsZiBNYXJpbmUgUGFyayBQcm90ZWN0ZWQ8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj4gPCEtLSBkYXRhLXBhZ2luZy4uLiBhY3RpdmF0ZXMgcGFnaW5nICAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MTgwcHg7XFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkluIFByb3Bvc2VkIEFyZWFzICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW4gRXhpc3RpbmcgQXJlYXMgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Db21iaW5lZCAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+SW4gTWFyaW5lIFJlc2VydmVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfUEVSQ19NUl9ORVdcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9QRVJDX01SX0VYSVNUSU5HXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfUEVSQ19NUl9DT01CSU5FRFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+SW4gVHlwZSAyIFByb3RlY3Rpb24gQXJlYXM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9QRVJDX1QyX05FV1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1BFUkNfVDJfRVhJU1RJTkdcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9QRVJDX1QyX0NPTUJJTkVEXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjRcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5UaGlzIHRhYmxlIHNob3dzIGhvdyDigJhjb21wcmVoZW5zaXZl4oCZIHRoZSBwcm9wb3NlZCBwcm90ZWN0aW9uXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzY1NCwzNjU5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzIGFyZVwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiBpc1wiKTt9O18uYihcIi4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgUHJvcG9zZWQgYW5kIGV4aXN0aW5nIHBsYW5zIHByb3RlY3QgdGhlc2UgcGVyY2VudGFnZXMgb2YgdGhlIHRvdGFsIGFyZWFzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJJJ20gbGVhdmluZyB0aGVzZSBpdGVtcyBjb21tZW50ZWQgb3V0IGJlY2F1c2UgdGhleSBzZWVtIGhhcmQgdG8gaW1wbGVtZW50XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiYW5kIGR1cGxpY2F0aXZlLiBJdCdzIGFsc28gbm90IGNsZWFyIGhvdyB0aGV5IHdvdWxkIGxvb2sgYXQgdGhlIHpvbmUtbGV2ZWwuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHJlcHJlc2VudGF0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXByZXNlbnRhdGlvbiBvZiBIYWJpdGF0czwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5UaGUgcHJvcG9zZWQgcHJvdGVjdGlvbiBhcmVhcyBhbmQgZXhpc3RpbmcgcmVzZXJ2ZXMgcHJvdGVjdCBhIHNhbXBsZSBvZiB0aGUgZm9sbG93aW5nIG51bWJlciBvZiBoYWJpdGF0czo8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHBlcmNlbnRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlBlcmNlbnQgb2YgSGF1cmFraSBHdWxmIE1hcmluZSBQYXJrIFByb3RlY3RlZDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5UaGUgZ3JhcGggYmVsb3dzIHNob3dzIGhvdyDigJhjb21wcmVoZW5zaXZl4oCZIHRoZSBwcm9wb3NlZCBwcm90ZWN0aW9uIGlzLiBUaGUgcHJvcG9zZWQgcGxhbiBpbmNsdWRlcyB0aGUgZm9sbG93aW5nIHByb3RlY3Rpb24gdHlwZXM6PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0OTksNDYyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07Il19
;