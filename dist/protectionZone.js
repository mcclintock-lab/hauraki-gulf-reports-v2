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

  EnvironmentTab.prototype.dependencies = ['HabitatComprehensiveness', 'NearTerrestrialProtected', 'EcosystemServices'];

  EnvironmentTab.prototype.render = function() {
    var biogenic_habitat, context, ecosystem_productivity, habitats, habitatsInReserves, habitatsInTypeTwos, isCollection, near_terrestrial_protected, nutrient_recycling, representationData;
    isCollection = this.model.isCollection();
    habitats = this.recordSet('HabitatComprehensiveness', 'HabitatComprehensiveness').toArray();
    ecosystem_productivity = this.recordSet('EcosystemServices', 'EcosystemProductivity').toArray();
    nutrient_recycling = this.recordSet('EcosystemServices', 'NutrientRecycling').toArray();
    biogenic_habitat = this.recordSet('EcosystemServices', 'BiogenicHabitat').toArray();
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
      adjacentProtectedAreas: near_terrestrial_protected,
      nutrientRecycling: nutrient_recycling,
      biogenicHabitat: biogenic_habitat,
      ecosystemProductivity: ecosystem_productivity
    };
    this.$el.html(this.template.render(context, templates));
    this.enableTablePaging();
    return this.enableLayerTogglers();
  };

  return EnvironmentTab;

})(ReportTab);

module.exports = EnvironmentTab;


},{"../templates/templates.js":16,"reportTab":"G1pDc3"}],13:[function(require,module,exports){
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


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"4l2XTc","../templates/templates.js":16,"reportTab":"G1pDc3"}],14:[function(require,module,exports){
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


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"4l2XTc","../templates/templates.js":16,"reportTab":"G1pDc3"}],15:[function(require,module,exports){
var ActivitiesTab, EnvironmentTab, FisheriesTab, OverviewTab;

OverviewTab = require('./overview.coffee');

EnvironmentTab = require('./environment.coffee');

FisheriesTab = require('./fisheries.coffee');

ActivitiesTab = require('./activities.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, EnvironmentTab, FisheriesTab, ActivitiesTab]);
  return report.stylesheets(['./protectionZone.css']);
});


},{"./activities.coffee":11,"./environment.coffee":12,"./fisheries.coffee":13,"./overview.coffee":14}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["activities"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Possible Effects on Aquaculture</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\">Type</th>");_.b("\n" + i);_.b("        <th>Area Affected (Ha)</th>");_.b("\n" + i);_.b("        <th>Area Affect (%)</th>");_.b("\n" + i);_.b("        <th>Potential Impact on Production</th>");_.b("\n" + i);_.b("        <th>Potential Impact on Economic Value</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("aquaculture",c,p,1),c,p,0,745,912,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <tr>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("FARM_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("SIZE_IN_HA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"5\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);_.b("            Note: as not all areas fished have the same fishing effort or catch, the ");_.b("\n" + i);_.b("            “Level of Fishing Displaced” is a combination of the area being ");_.b("\n" + i);_.b("            restricted and the catch that would normally be caught in that area");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Existing Use Conflicts</h4>");_.b("\n" + i);if(_.s(_.f("hasExistingUseConflicts",c,p,1),c,p,0,1486,1681,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p class=\"large\">");_.b("\n" + i);_.b("        One or more protection classes overlap with, or are near, <strong>existing uses</strong> that are in conflict with the purposes of the protection.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Existing Use</th>");_.b("\n" + i);_.b("        <th>Is Compatible</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("existingUses",c,p,1),c,p,0,1923,2012,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <tr>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("FEAT_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Recreational Uses</h4>");_.b("\n" + i);if(_.s(_.f("hasRecreationalUseConflicts",c,p,1),c,p,0,2183,2385,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p class=\"large\">");_.b("\n" + i);_.b("        One or more protection classes overlap with, or are near, <strong>recreational uses</strong> that may be in conflict with the purposes of the protection.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Recreational Use</th>");_.b("\n" + i);_.b("        <th>Is Compatible</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("recreationalUses",c,p,1),c,p,0,2639,2728,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <tr>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("FEAT_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>--</td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("overlapWithMooringsAndAnchorages",c,p,1),c,p,0,2820,3075,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Overlaps with Mooring and Anchorage Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    One more more protection areas overlap with sites that are identified as good for <strong>Mooring and Anchorages</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Report Sections</h4>");_.b("\n" + i);_.b("  <p>Use report sections to group information into meaningful categories</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>D3 Visualizations</h4>");_.b("\n" + i);_.b("  <ul class=\"nav nav-pills\" id=\"tabs2\">");_.b("\n" + i);_.b("    <li class=\"active\"><a href=\"#chart\">Chart</a></li>");_.b("\n" + i);_.b("    <li><a href=\"#dataTable\">Table</a></li>");_.b("\n" + i);_.b("  </ul>");_.b("\n" + i);_.b("  <div class=\"tab-content\">");_.b("\n" + i);_.b("    <div class=\"tab-pane active\" id=\"chart\">");_.b("\n" + i);_.b("      <!--[if IE 8]>");_.b("\n" + i);_.b("      <p class=\"unsupported\">");_.b("\n" + i);_.b("      This visualization is not compatible with Internet Explorer 8. ");_.b("\n" + i);_.b("      Please upgrade your browser, or view results in the table tab.");_.b("\n" + i);_.b("      </p>      ");_.b("\n" + i);_.b("      <![endif]-->");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        See <code>src/scripts/demo.coffee</code> for an example of how to ");_.b("\n" + i);_.b("        use d3.js to render visualizations. Provide a table-based view");_.b("\n" + i);_.b("        and use conditional comments to provide a fallback for IE8 users.");_.b("\n" + i);_.b("        <br>");_.b("\n" + i);_.b("        <a href=\"http://twitter.github.io/bootstrap/2.3.2/\">Bootstrap 2.x</a>");_.b("\n" + i);_.b("        is loaded within SeaSketch so you can use it to create tabs and other ");_.b("\n" + i);_.b("        interface components. jQuery and underscore are also available.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"tab-pane\" id=\"dataTable\">");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>index</th>");_.b("\n" + i);_.b("            <th>value</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("chartData",c,p,1),c,p,0,1351,1418,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr><td>");_.b(_.v(_.f("index",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection emphasis\">");_.b("\n" + i);_.b("  <h4>Emphasis</h4>");_.b("\n" + i);_.b("  <p>Give report sections an <code>emphasis</code> class to highlight important information.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection warning\">");_.b("\n" + i);_.b("  <h4>Warning</h4>");_.b("\n" + i);_.b("  <p>Or <code>warn</code> of potential problems.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection danger\">");_.b("\n" + i);_.b("  <h4>Danger</h4>");_.b("\n" + i);_.b("  <p><code>danger</code> can also be used... sparingly.</p>");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["fisheries"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Commercial Fishing</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Affected Area (%)</th>");_.b("\n" + i);_.b("        <th>Level of Fishing Displaced (%)</th>");_.b("\n" + i);_.b("        <th>Economic Value</th>");_.b("\n" + i);_.b("        <th>Number of Affected Fishers</th>");_.b("\n" + i);_.b("        <th>Fishers in Gulf Fishery</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("commercialFishing",c,p,1),c,p,0,410,605,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PrcDsplcd",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Level",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Num",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Fishers",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          Note: as not all areas fished have the same fishing effort or catch, the “Level of Fishing Displaced” is a combination of the area being restricted and the catch that would normally be caught in that area.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Recreational Fishing</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Affected Area (%)</th>");_.b("\n" + i);_.b("        <th>Level of Fishing Displaced (%)</th>");_.b("\n" + i);_.b("        <th>Economic Value</th>");_.b("\n" + i);_.b("        <th>Number of Affected Fishers</th>");_.b("\n" + i);_.b("        <th>Fishers in Gulf Fishery</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("recreationalFishing",c,p,1),c,p,0,1420,1615,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PrcDsplcd",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Level",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Num",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Fishers",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("<!-- ");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b(" -->");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Customary Fishing</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Name</th>");_.b("\n" + i);_.b("        <th>Affected Area (%)</th>");_.b("\n" + i);_.b("        <th>Level of Fishing Displaced (%)</th>");_.b("\n" + i);_.b("        <th>Economic Value</th>");_.b("\n" + i);_.b("        <th>Number of Affected Fishers</th>");_.b("\n" + i);_.b("        <th>Fishers in Gulf Fishery</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("customaryFishing",c,p,1),c,p,0,2221,2416,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PrcDsplcd",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Level",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Num",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Fishers",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody> ");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          Important customary fishing locations have not been identified yet. Information on the whereabouts of these activities may be added during planning process.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Total Food Provision</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Fish Stock</th>");_.b("\n" + i);_.b("        <th>Catch Displaced (tonnss)</th>");_.b("\n" + i);_.b("        <th>Percent from Gulf</th>");_.b("\n" + i);_.b("        <th>Percent of TAC</th>");_.b("\n" + i);_.b("        <th>Value of Fish</th>");_.b("\n" + i);_.b("        <th>Value to NZ Economy</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("totalFood",c,p,1),c,p,0,3155,3359,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("FishStock",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Kgs_Ha",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Gulf_Kgs",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("tac",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("value_to_nz",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody> ");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"6\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          The total food provision includes commercial, recreational, and");_.b("\n" + i);_.b("          customary catch.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["habitat"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("isCollection",c,p,1),c,p,0,17,323,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<p>");_.b("\n" + i);_.b("  The collection of marine protected areas will protect the full range of ");_.b("\n" + i);_.b("  natural marine habitats and ecosystems. These reports show the proportion ");_.b("\n" + i);_.b("  of the gulf protected for each habitat type in Marine Reserves and Type-2 ");_.b("\n" + i);_.b("  Protected Areas, for both existing protected areas and sketches.");_.b("\n" + i);_.b("</p>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasReserveData",c,p,1),c,p,0,361,1486,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats Protected in Marine Reserves</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\">Habitats</th>");_.b("\n" + i);_.b("        <th>% In Existing Marine Reserves</th>");_.b("\n" + i);_.b("        <th>% In New Marine Reserves</th>");_.b("\n" + i);_.b("        <th style=\"width:50px;\">Total</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitatsInReserves",c,p,1),c,p,0,791,939,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("EX_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NEW_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,1124,1173,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            Marine Reserves protect");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("            This Marine Reserve protects");_.b("\n");};_.b("            <strong>");_.b(_.v(_.f("habitatsInReservesCount",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("habitatsCount",c,p,0)));_.b("</strong> habitat types.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasTypeTwoData",c,p,1),c,p,0,1526,2637,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats Protected in Type-2 Protected Areas</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\">Habitats</th>");_.b("\n" + i);_.b("        <th>% In Existing Type-2 Protected Areas</th>");_.b("\n" + i);_.b("        <th>% In New Type-2 Protected Areas</th>");_.b("\n" + i);_.b("        <th style=\"width:50px;\">Total</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitatsInTypeTwos",c,p,1),c,p,0,1935,2083,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("EX_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NEW_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,2268,2318,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            Type-2 Reserves protect ");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("            This Type-2 Protected Area protects");_.b("\n");};_.b("            <strong>");_.b(_.v(_.f("habitatsInTypeTwoCount",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("habitatsCount",c,p,0)));_.b("</strong> habitat types.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<!-- ");_.b("\n" + i);_.b("PDF says for both zones and collections. ");_.b("\n" + i);_.b("I just included collections for now  ");_.b("\n" + i);_.b("-->");_.b("\n" + i);if(_.s(_.f("hasRepresentationData",c,p,1),c,p,0,2774,3711,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitats</th>");_.b("\n" + i);_.b("        <th>Total HA Protected in All Areas</th>");_.b("\n" + i);_.b("        <th>Total % in All Areas</th>");_.b("\n" + i);_.b("        <th>Number of Sites Protected</th>");_.b("\n" + i);_.b("        <th>Adequately Represented?</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("representationData",c,p,1),c,p,0,3165,3334,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_SIZE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CB_PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("REP_COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>??</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"5\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);_.b("\n" + i);_.b("            <strong>");_.b(_.v(_.f("representedCount",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("habitatsCount",c,p,0)));_.b("</strong> habitats are adequately ");_.b("\n" + i);_.b("            protected.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("adjacentProtectedAreas",c,p,1),c,p,0,3784,3982,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Adjacent Terrestrial Protected Area</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    This zone is adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}};_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Nutrient Recycling</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Value</th>");_.b("\n" + i);_.b("        <th>Area in Hectares</th>");_.b("\n" + i);_.b("        <th>Percent</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("nutrientRecycling",c,p,1),c,p,0,4298,4414,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Class",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("AreaInHa",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Biogenic Habitat</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Value</th>");_.b("\n" + i);_.b("        <th>Area in Hectares</th>");_.b("\n" + i);_.b("        <th>Percent</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("biogenicHabitat",c,p,1),c,p,0,4737,4853,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Class",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("AreaInHa",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Ecosystem Productivity</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Value</th>");_.b("\n" + i);_.b("        <th>Area in Hectares</th>");_.b("\n" + i);_.b("        <th>Percent</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("ecosystemProductivity",c,p,1),c,p,0,5184,5300,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Class",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("AreaInHa",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large ");if(_.s(_.f("SIZE_OK",c,p,1),c,p,0,375,386,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("green-check");});c.pop();}_.b("\">");_.b("\n" + i);_.b("    <!-- Notice, using mustache tags here to test whether we're rendering a ");_.b("\n" + i);_.b("    collection or a single zone -->");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,535,657,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    The average size of the <strong>");_.b(_.v(_.f("NUM_PROTECTED",c,p,0)));_.b("</strong> protected ");_.b("\n" + i);_.b("    areas is <strong>");_.b(_.v(_.f("SIZE",c,p,0)));_.b(" ha</strong>,");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("    This protected area is <strong>");_.b(_.v(_.f("SIZE",c,p,0)));_.b(" ha</strong>,");_.b("\n");};if(_.s(_.f("SIZE_OK",c,p,1),c,p,0,792,840,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    meeting the target of ");_.b(_.v(_.f("MIN_SIZE",c,p,0)));_.b(" ha.");_.b("\n");});c.pop();}if(!_.s(_.f("SIZE_OK",c,p,1),c,p,1,0,0,"")){_.b("    which does not meet the target of ");_.b(_.v(_.f("MIN_SIZE",c,p,0)));_.b(" ha.");_.b("\n");};_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p style=\"font-size:12px;padding:11px;text-align:left;margin-top:-10px;\">For the same amount of area to be protected, it is desirable to protect fewer, larger areas rather than numerous smaller ones.</p>");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,1200,1541,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\" style=\"padding:0px 10px;padding-bottom:10px;\">");_.b("\n" + i);_.b("      The selected network contains <strong>");_.b(_.v(_.f("TYPE_TWO_MPAS",c,p,0)));_.b(" Habitat ");_.b("\n" + i);_.b("      Protection Zone");if(_.s(_.f("TYPE_TWO_MPAS_PLURAL",c,p,1),c,p,0,1386,1387,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" and ");_.b("\n" + i);_.b("      ");_.b(_.v(_.f("MARINE_RESERVES",c,p,0)));_.b(" Marine");_.b("\n" + i);_.b("      Reserve");if(_.s(_.f("MARINE_RESERVES_PLURAL",c,p,1),c,p,0,1491,1492,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong>.");_.b("\n" + i);_.b("    </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Representation of Habitats</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\"></th>");_.b("\n" + i);_.b("        <th>In Proposed Areas</th>");_.b("\n" + i);_.b("        <th>In Existing Areas</th>");_.b("\n" + i);_.b("        <th>Combined</th>");_.b("\n" + i);_.b("        <th>Total </th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td>Number of Habitats Protected</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_PROPOSED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_EXISTING",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_COMBINED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_COUNT_TOTAL",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"5\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,2324,2390,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            New and existing Marine Reserves protect");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("            This Marine Reserve protects");_.b("\n");};_.b("            <strong>");_.b(_.v(_.f("HAB_COUNT_COMBINED",c,p,0)));_.b("</strong>");_.b("\n" + i);_.b("            of <strong>");_.b(_.v(_.f("HAB_COUNT_TOTAL",c,p,0)));_.b("</strong> habitat types.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Percent of Hauraki Gulf Marine Park Protected</h4>");_.b("\n" + i);_.b("\n" + i);_.b("  <table data-paging=\"10\"> <!-- data-paging... activates paging  -->");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th style=\"width:180px;\"></th>");_.b("\n" + i);_.b("        <th>In Proposed Areas (%)</th>");_.b("\n" + i);_.b("        <th>In Existing Areas (%)</th>");_.b("\n" + i);_.b("        <th>Combined (%)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td>In Marine Reserves</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_MR_NEW",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_MR_EXISTING",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_MR_COMBINED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td>In Type 2 Protection Areas</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_T2_NEW",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_T2_EXISTING",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_PERC_T2_COMBINED",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\" style=\"text-align:left;\">");_.b("\n" + i);_.b("          <p class=\"large\">This table shows how ‘comprehensive’ the proposed protection");if(_.s(_.f("isCollection",c,p,1),c,p,0,3654,3659,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" is");};_.b(". ");_.b("\n" + i);_.b("            Proposed and existing plans protect these percentages of the total areas.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!-- ");_.b("\n" + i);_.b("I'm leaving these items commented out because they seem hard to implement");_.b("\n" + i);_.b("and duplicative. It's also not clear how they would look at the zone-level.");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection representation\">");_.b("\n" + i);_.b("  <h4>Representation of Habitats</h4>");_.b("\n" + i);_.b("  <p>The proposed protection areas and existing reserves protect a sample of the following number of habitats:</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection percent\">");_.b("\n" + i);_.b("  <h4>Percent of Hauraki Gulf Marine Park Protected</h4>");_.b("\n" + i);_.b("  <p>The graph belows shows how ‘comprehensive’ the proposed protection is. The proposed plan includes the following protection types:</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b(" -->");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,4499,4623,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[15])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L19lbXB0eS5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRSZXN1bHRzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvc2NyaXB0cy9hY3Rpdml0aWVzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvc2NyaXB0cy9lbnZpcm9ubWVudC5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL3NjcmlwdHMvZmlzaGVyaWVzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvaGF1cmFraS1ndWxmLXJlcG9ydHMtdjIvc2NyaXB0cy9vdmVydmlldy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2hhdXJha2ktZ3VsZi1yZXBvcnRzLXYyL3NjcmlwdHMvcHJvdGVjdGlvblpvbmUuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9oYXVyYWtpLWd1bGYtcmVwb3J0cy12Mi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxHQUFZO0NBRFosQ0FFQSxDQUFBLEdBQU07QUFDQyxDQUFQLENBQUEsQ0FBQSxDQUFBO0NBQ0UsRUFBQSxDQUFBLEdBQU8scUJBQVA7Q0FDQSxTQUFBO0lBTEY7Q0FBQSxDQU1BLENBQVcsQ0FBQSxJQUFYLGFBQVc7Q0FFWDtDQUFBLE1BQUEsb0NBQUE7d0JBQUE7Q0FDRSxFQUFXLENBQVgsR0FBVyxDQUFYO0NBQUEsRUFDUyxDQUFULEVBQUEsRUFBaUIsS0FBUjtDQUNUO0NBQ0UsRUFBTyxDQUFQLEVBQUEsVUFBTztDQUFQLEVBQ08sQ0FBUCxDQURBLENBQ0E7QUFDK0IsQ0FGL0IsQ0FFOEIsQ0FBRSxDQUFoQyxF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LEVBQ2lCLElBQUEsT0FBakIsUUFBaUI7O0FBQ2pCLENBRkEsRUFFZSxJQUFBLEtBQWYsUUFBZTs7QUFDZixDQUhBLEVBR2dCLElBQUEsTUFBaEIsUUFBZ0I7O0FBRWhCLENBTEEsRUFLVSxHQUFKLEdBQXFCLEtBQTNCO0NBQ0UsQ0FBQSxFQUFBLEVBQU0sS0FBTSxDQUFBLENBQUEsQ0FBQTtDQUVMLEtBQUQsR0FBTixFQUFBLFdBQW1CO0NBSEs7Ozs7QUNMMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6W251bGwsIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJjbGFzcyBKb2JJdGVtIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjbGFzc05hbWU6ICdyZXBvcnRSZXN1bHQnXG4gIGV2ZW50czoge31cbiAgYmluZGluZ3M6XG4gICAgXCJoNiBhXCI6XG4gICAgICBvYnNlcnZlOiBcInNlcnZpY2VOYW1lXCJcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIG5hbWU6ICdocmVmJ1xuICAgICAgICBvYnNlcnZlOiAnc2VydmljZVVybCdcbiAgICAgIH1dXG4gICAgXCIuc3RhcnRlZEF0XCI6XG4gICAgICBvYnNlcnZlOiBbXCJzdGFydGVkQXRcIiwgXCJzdGF0dXNcIl1cbiAgICAgIHZpc2libGU6ICgpIC0+XG4gICAgICAgIEBtb2RlbC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIG9uR2V0OiAoKSAtPlxuICAgICAgICBpZiBAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKVxuICAgICAgICAgIHJldHVybiBcIlN0YXJ0ZWQgXCIgKyBtb21lbnQoQG1vZGVsLmdldCgnc3RhcnRlZEF0JykpLmZyb21Ob3coKSArIFwiLiBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgXCJcIlxuICAgIFwiLnN0YXR1c1wiOiAgICAgIFxuICAgICAgb2JzZXJ2ZTogXCJzdGF0dXNcIlxuICAgICAgb25HZXQ6IChzKSAtPlxuICAgICAgICBzd2l0Y2ggc1xuICAgICAgICAgIHdoZW4gJ3BlbmRpbmcnXG4gICAgICAgICAgICBcIndhaXRpbmcgaW4gbGluZVwiXG4gICAgICAgICAgd2hlbiAncnVubmluZydcbiAgICAgICAgICAgIFwicnVubmluZyBhbmFseXRpY2FsIHNlcnZpY2VcIlxuICAgICAgICAgIHdoZW4gJ2NvbXBsZXRlJ1xuICAgICAgICAgICAgXCJjb21wbGV0ZWRcIlxuICAgICAgICAgIHdoZW4gJ2Vycm9yJ1xuICAgICAgICAgICAgXCJhbiBlcnJvciBvY2N1cnJlZFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc1xuICAgIFwiLnF1ZXVlTGVuZ3RoXCI6IFxuICAgICAgb2JzZXJ2ZTogXCJxdWV1ZUxlbmd0aFwiXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIHMgPSBcIldhaXRpbmcgYmVoaW5kICN7dn0gam9iXCJcbiAgICAgICAgaWYgdi5sZW5ndGggPiAxXG4gICAgICAgICAgcyArPSAncydcbiAgICAgICAgcmV0dXJuIHMgKyBcIi4gXCJcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2PyBhbmQgcGFyc2VJbnQodikgPiAwXG4gICAgXCIuZXJyb3JzXCI6XG4gICAgICBvYnNlcnZlOiAnZXJyb3InXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8ubGVuZ3RoID4gMlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHYsIG51bGwsICcgICcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAbW9kZWwpIC0+XG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBAJGVsLmh0bWwgXCJcIlwiXG4gICAgICA8aDY+PGEgaHJlZj1cIiNcIiB0YXJnZXQ9XCJfYmxhbmtcIj48L2E+PHNwYW4gY2xhc3M9XCJzdGF0dXNcIj48L3NwYW4+PC9oNj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwic3RhcnRlZEF0XCI+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInF1ZXVlTGVuZ3RoXCI+PC9zcGFuPlxuICAgICAgICA8cHJlIGNsYXNzPVwiZXJyb3JzXCI+PC9wcmU+XG4gICAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICBAc3RpY2tpdCgpXG5cbm1vZHVsZS5leHBvcnRzID0gSm9iSXRlbSIsImNsYXNzIFJlcG9ydFJlc3VsdHMgZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG5cbiAgZGVmYXVsdFBvbGxpbmdJbnRlcnZhbDogMzAwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQHNrZXRjaCwgQGRlcHMpIC0+XG4gICAgQHVybCA9IHVybCA9IFwiL3JlcG9ydHMvI3tAc2tldGNoLmlkfS8je0BkZXBzLmpvaW4oJywnKX1cIlxuICAgIHN1cGVyKClcblxuICBwb2xsOiAoKSA9PlxuICAgIEBmZXRjaCB7XG4gICAgICBzdWNjZXNzOiAoKSA9PlxuICAgICAgICBAdHJpZ2dlciAnam9icydcbiAgICAgICAgZm9yIHJlc3VsdCBpbiBAbW9kZWxzXG4gICAgICAgICAgaWYgcmVzdWx0LmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgICAgICAgdW5sZXNzIEBpbnRlcnZhbFxuICAgICAgICAgICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAcG9sbCwgQGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvciBcbiAgICAgICAgICAgICdQcm9ibGVtIGNvbnRhY3RpbmcgdGhlIFNlYVNrZXRjaCBzZXJ2ZXInXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFJlc3VsdHNcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5SZXBvcnRSZXN1bHRzID0gcmVxdWlyZSAnLi9yZXBvcnRSZXN1bHRzLmNvZmZlZSdcbnQgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJylcbnRlbXBsYXRlcyA9XG4gIHJlcG9ydExvYWRpbmc6IHRbJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nJ11cbkpvYkl0ZW0gPSByZXF1aXJlICcuL2pvYkl0ZW0uY29mZmVlJ1xuQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCd2aWV3cy9jb2xsZWN0aW9uVmlldycpXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEsIEB0YWIsIEBza2V0Y2hDbGFzc0lkKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgaWYgQHNrZXRjaENsYXNzSWRcbiAgICAgIGRhdGEgPSBfLmZpbmQgQGRhdGEudmFsdWUsICh2KSA9PiBcbiAgICAgICAgdi5mZWF0dXJlcz9bMF0/LmF0dHJpYnV0ZXM/WydTQ19JRCddIGlzIEBza2V0Y2hDbGFzc0lkICAgICAgICBcbiAgICAgIHVubGVzcyBkYXRhXG4gICAgICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgZGF0YSBmb3Igc2tldGNoQ2xhc3MgI3tAc2tldGNoQ2xhc3NJZH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIF8uaXNBcnJheSBAZGF0YS52YWx1ZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlXG4gICAgXy5tYXAgZGF0YS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICBjb25zb2xlLmxvZyBAZGF0YVxuICAgICAgQHRhYi5yZXBvcnRFcnJvciBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn0gZnJvbSByZXN1bHRzXCJcbiAgICAgIHRocm93IFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfVwiXG4gICAgZWxzZSBpZiBhdHRycy5sZW5ndGggaXMgMVxuICAgICAgcmV0dXJuIGF0dHJzWzBdXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGF0dHJzXG5cbiAgaW50OiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgcGFyc2VJbnRcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChyYXcpXG5cbiAgZmxvYXQ6IChhdHRyLCBkZWNpbWFsUGxhY2VzPTIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHJvdW5kKHZhbCwgZGVjaW1hbFBsYWNlcylcbiAgICBlbHNlXG4gICAgICByb3VuZChyYXcsIGRlY2ltYWxQbGFjZXMpXG5cbiAgYm9vbDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHZhbC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG4gICAgZWxzZVxuICAgICAgcmF3LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcblxuY2xhc3MgUmVwb3J0VGFiIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBuYW1lOiAnSW5mb3JtYXRpb24nXG4gIGRlcGVuZGVuY2llczogW11cblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAb3B0aW9ucykgLT5cbiAgICAjIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYnkgU2VhU2tldGNoIHdpdGggdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgIyAgICogbW9kZWwgLSBUaGUgc2tldGNoIGJlaW5nIHJlcG9ydGVkIG9uXG4gICAgIyAgICogb3B0aW9uc1xuICAgICMgICAgIC0gLnBhcmVudCAtIHRoZSBwYXJlbnQgcmVwb3J0IHZpZXcgXG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCBAZXRhSW50ZXJ2YWxcbiAgICBAc3RvcExpc3RlbmluZygpXG4gICAgc3VwZXIoKVxuICBcbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICB0b3RhbCA9IChuZXcgRGF0ZShAbWF4RXRhKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShAZXRhU3RhcnQpLmdldFRpbWUoKSkgLyAxMDAwXG4gICAgICBsZWZ0ID0gKG5ldyBEYXRlKEBtYXhFdGEpLmdldFRpbWUoKSAtIG5ldyBEYXRlKCkuZ2V0VGltZSgpKSAvIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgICAsIChsZWZ0ICsgMSkgKiAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24nLCAnbGluZWFyJ1xuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBcIiN7bGVmdCArIDF9c1wiXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICAgICwgNTAwXG5cbiAgcmVuZGVySm9iRGV0YWlsczogKCkgPT5cbiAgICBtYXhFdGEgPSBudWxsXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGlmIGpvYi5nZXQoJ2V0YScpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGEnKVxuICAgIGlmIG1heEV0YVxuICAgICAgQG1heEV0YSA9IG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzUlJylcbiAgICAgIEBldGFTdGFydCA9IG5ldyBEYXRlKClcbiAgICAgIEBzdGFydEV0YUNvdW50ZG93bigpXG5cbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jbGljayAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5oaWRlKClcbiAgICAgIEAkKCcuZGV0YWlscycpLnNob3coKVxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpdGVtID0gbmV3IEpvYkl0ZW0oam9iKVxuICAgICAgaXRlbS5yZW5kZXIoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuYXBwZW5kIGl0ZW0uZWxcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXN1bHRzID0gQHJlcG9ydFJlc3VsdHMubWFwKChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMpXG4gICAgdW5sZXNzIHJlc3VsdHM/Lmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkPWZhbHNlKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBAcmVwb3J0UmVzdWx0cy5maW5kIChyKSAtPiByLmdldCgnc2VydmljZU5hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgncmVzdWx0JykucmVzdWx0cywgKHBhcmFtKSAtPiBcbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcbiAgICAgIFxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpICAgIFxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBnZXRDaGlsZHJlbjogKHNrZXRjaENsYXNzSWQpIC0+XG4gICAgXy5maWx0ZXIgQGNoaWxkcmVuLCAoY2hpbGQpIC0+IGNoaWxkLmdldFNrZXRjaENsYXNzKCkuaWQgaXMgc2tldGNoQ2xhc3NJZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0VGFiIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dHIgZGF0YS1hdHRyaWJ1dGUtaWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS1leHBvcnRpZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiZXhwb3J0aWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLXR5cGU9XFxcIlwiKTtfLmIoXy52KF8uZihcInR5cGVcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJuYW1lXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwidmFsdWVcXFwiPlwiKTtfLmIoXy52KF8uZihcImZvcm1hdHRlZFZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3RyPlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO30pO2MucG9wKCk7fV8uYihcIjwvdGFibGU+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdOyIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbk1JTl9TSVpFID0gMTAwMDBcblxuY2xhc3MgQWN0aXZpdGllc1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdBY3Rpdml0aWVzJ1xuICBjbGFzc05hbWU6ICdhY3Rpdml0aWVzJ1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hY3Rpdml0aWVzXG4gIGRlcGVuZGVuY2llczogW1xuICAgICdPdmVybGFwV2l0aEFxdWFjdWx0dXJlJ1xuICAgICdPdmVybGFwV2l0aEV4aXN0aW5nVXNlcydcbiAgICAnT3ZlcmxhcFdpdGhNb29yaW5nc0FuZEFuY2hvcmFnZXMnXG4gICAgJ092ZXJsYXBXaXRoUmVjcmVhdGlvbmFsVXNlcydcbiAgXVxuXG5cblxuICByZW5kZXI6ICgpIC0+XG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgYXF1YWN1bHR1cmUgPSBAcmVjb3JkU2V0KCdPdmVybGFwV2l0aEFxdWFjdWx0dXJlJywgJ092ZXJsYXBXaXRoQXF1YWN1bHR1cmUnKS50b0FycmF5KClcbiAgICBleGlzdGluZ1VzZXMgPSBAcmVjb3JkU2V0KCdPdmVybGFwV2l0aEV4aXN0aW5nVXNlcycsICdPdmVybGFwV2l0aEV4aXN0aW5nVXNlcycpLnRvQXJyYXkoKVxuICAgIG92ZXJsYXBXaXRoTW9vcmluZ3NBbmRBbmNob3JhZ2VzID0gQHJlY29yZFNldCgnT3ZlcmxhcFdpdGhNb29yaW5nc0FuZEFuY2hvcmFnZXMnLCAnT3ZlcmxhcFdpdGhNb29yaW5nc0FuZEFuY2hvcmFnZXMnKS5ib29sKCdPVkVSTEFQUycpXG4gICAgcmVjcmVhdGlvbmFsVXNlcyA9IEByZWNvcmRTZXQoJ092ZXJsYXBXaXRoUmVjcmVhdGlvbmFsVXNlcycsICdPdmVybGFwV2l0aFJlY3JlYXRpb25hbFVzZXMnKS50b0FycmF5KClcbiAgICBjb250ZXh0ID1cbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBhcXVhY3VsdHVyZTogYXF1YWN1bHR1cmVcbiAgICAgIGFxdWFjdWx0dXJlQ291bnQ6IGFxdWFjdWx0dXJlPy5sZW5ndGhcbiAgICAgIGV4aXN0aW5nVXNlczogZXhpc3RpbmdVc2VzXG4gICAgICBoYXNFeGlzdGluZ1VzZUNvbmZsaWN0czogZXhpc3RpbmdVc2VzPy5sZW5ndGggPiAwXG4gICAgICBvdmVybGFwV2l0aE1vb3JpbmdzQW5kQW5jaG9yYWdlczogb3ZlcmxhcFdpdGhNb29yaW5nc0FuZEFuY2hvcmFnZXNcbiAgICAgIHJlY3JlYXRpb25hbFVzZXM6IHJlY3JlYXRpb25hbFVzZXNcbiAgICAgIGhhc1JlY3JlYXRpb25hbFVzZUNvbmZsaWN0czogcmVjcmVhdGlvbmFsVXNlcz8ubGVuZ3RoID4gMFxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVUYWJsZVBhZ2luZygpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gQWN0aXZpdGllc1RhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEVudmlyb25tZW50VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdFbnZpcm9ubWVudCdcbiAgY2xhc3NOYW1lOiAnZW52aXJvbm1lbnQnXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmhhYml0YXRcbiAgZGVwZW5kZW5jaWVzOiBbJ0hhYml0YXRDb21wcmVoZW5zaXZlbmVzcycsICdOZWFyVGVycmVzdHJpYWxQcm90ZWN0ZWQnLCAnRWNvc3lzdGVtU2VydmljZXMnXVxuICAjIFdpbGwgbGlrZWx5IGJlIGV4dGVuZGVkIGluIHRoZSBmdXR1cmUgdG8gc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgIyBkZXBlbmRlbmNpZXM6IFtcbiAgIyAgICdIYWJpdGF0J1xuICAjICAgJ1JlcHJlc2VudGF0aW9uJ1xuICAjICAgJ0FkamFjZW50UHJvdGVjdGVkQXJlYXMnXG4gICMgXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBoYWJpdGF0cyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb21wcmVoZW5zaXZlbmVzcycsICdIYWJpdGF0Q29tcHJlaGVuc2l2ZW5lc3MnKS50b0FycmF5KClcbiAgICBlY29zeXN0ZW1fcHJvZHVjdGl2aXR5ID0gQHJlY29yZFNldCgnRWNvc3lzdGVtU2VydmljZXMnLCAnRWNvc3lzdGVtUHJvZHVjdGl2aXR5JykudG9BcnJheSgpXG4gICAgbnV0cmllbnRfcmVjeWNsaW5nID0gQHJlY29yZFNldCgnRWNvc3lzdGVtU2VydmljZXMnLCAnTnV0cmllbnRSZWN5Y2xpbmcnKS50b0FycmF5KClcbiAgICBiaW9nZW5pY19oYWJpdGF0ID0gQHJlY29yZFNldCgnRWNvc3lzdGVtU2VydmljZXMnLCAnQmlvZ2VuaWNIYWJpdGF0JykudG9BcnJheSgpXG4gICAgbmVhcl90ZXJyZXN0cmlhbF9wcm90ZWN0ZWQgPSBAcmVjb3JkU2V0KCdOZWFyVGVycmVzdHJpYWxQcm90ZWN0ZWQnLCAnTmVhclRlcnJlc3RyaWFsUHJvdGVjdGVkJykuYm9vbCgnQWRqYWNlbnQnKVxuICAgIGhhYml0YXRzSW5SZXNlcnZlcyA9IF8uZmlsdGVyIGhhYml0YXRzLCAocm93KSAtPlxuICAgICAgcm93Lk1QQV9UWVBFIGlzICdNUEExJyBcbiAgICBoYWJpdGF0c0luVHlwZVR3b3MgPSBfLmZpbHRlciBoYWJpdGF0cywgKHJvdykgLT5cbiAgICAgIHJvdy5NUEFfVFlQRSBpcyAnTVBBMicgXG4gICAgcmVwcmVzZW50YXRpb25EYXRhID0gXy5maWx0ZXIgaGFiaXRhdHMsIChyb3cpIC0+XG4gICAgICByb3cuTVBBX1RZUEUgaXMgJ0FMTF9UWVBFUycgXG5cbiAgICAjIFRoZSBwcmVjZWVkaW5nIGlzIG9mIGNvdXJzZSwgdGhlIHdyb25nIHdheSB0byBkbyB0aGlzLiBJIGhhdmUgbm8gaWRlYVxuICAgICMgaG93IERhbiBpbnRlbmRzIHRvIHJlcHJlc2VudCB0aGUgaGFiaXRhdCBudW1iZXJzIGZvciBlYWNoIG9mIHRoZXNlLiBcbiAgICAjIExldHMgc2F5IHRoZXJlIGlzIGFuIGF0dHJpYnV0ZSBmb3IgZWFjaCBmZWF0dXJlIGluIHRoZSBzZXQgdGhhdCBpc1xuICAgICMgTVBBX1RZUEUgKHNvIHRoZXJlIGFyZSB0d28gcm93cyBwZXIgaGFiaXRhdCkuIFRoaXMgaXMgaG93IEkgd291bGQgc3BsaXRcbiAgICAjIHRoZSBkYXRhIHVwIGluIHRoYXQgY2FzZTpcbiAgICAjICAgXG4gICAgIyAgIGhhYml0YXRzID0gQHJlY29yZFNldCgnSGFiaXRhdCcsICdIYWJpdGF0cycpXG4gICAgIyAgIGhhYml0YXRzSW5SZXNlcnZlcyA9IF8uZmlsdGVyIGhhYml0YXRzLCAocm93KSAtPlxuICAgICMgICAgIHJvdy5NUEFfVFlQRSBpcyAnTVBBMScgXG4gICAgIyAgIGhhYml0YXRzSW5UeXBlVHdvcyA9IF8uZmlsdGVyIGhhYml0YXRzLCAocm93KSAtPlxuICAgICMgICAgIHJvdy5NUEFfVFlQRSBpcyAnTVBBMicgXG4gICAgIyBcbiAgICAjIElmIGluc3RlYWQgdGhlIGRhdGEgaXMgaW5zdGVhZCBzcGxpdCBpbnRvIG11bHRpcGxlIGZlYXR1cmVzZXRzICh3aXRoIFxuICAgICMgdGhlIHNhbWUgcGFyYW1OYW1lKSwgdGhlbiBpdCBnZXRzIG1vcmUgY29tcGxpY2F0ZWQuIFlvdSdkIG5lZWQgdG8gYWNjZXNzXG4gICAgIyB0aGUgcmVzcG9uc2UgZGF0YSB2aWEgQHJlY29yZFNldCgnSGFiaXRhdCcsICdIYWJpdGF0cycpLnZhbHVlIGFuZCBwaWNrXG4gICAgIyBvdXQgdGhlIGFwcHJvcHJpYXRlIGZlYXR1cmVTZXRzIGZvciBlYWNoIHR5cGUuIE1heWJlIHNvbWV0aGluZyBsaWtlIFxuICAgICMgdGhpczpcbiAgICAjIFxuICAgICMgICByZWNvcmRTZXQgPSBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0hhYml0YXRzJylcbiAgICAjICAgY29uc29sZS5sb2cgcmVjb3JkU2V0LnZhbHVlICMgcmVtZW1iZXIgdG8gdXNlIHRoaXMgdG8gZGVidWdcbiAgICAjICAgZmVhdHVyZVNldCA9IF8uZmluZCByZWNvcmRTZXQudmFsdWUsIChmcykgLT5cbiAgICAjICAgICBmcy5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzWydNUEFfVFlQRSddIGlzICdNUEExJ1xuICAgICMgICBoYWJpdGF0c0luUmVzZXJ2ZXMgPSBfLm1hcCBmZWF0dXJlU2V0LmZlYXR1cmVzLCAoZikgLT4gZi5hdHRyaWJ1dGVzXG4gICAgIyAgIC4uLiBhbmQgcmVwZWF0IGZvciBUeXBlLUlJIE1QQXNcbiAgICAjIFxuICAgIGNvbnRleHQgPVxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgICNmaXggdGhpcyB0byBnZXQgcmlkIG9mIGhhcmRjb2RlZCB2YWx1ZVxuICAgICAgaGFiaXRhdHNDb3VudDogNjJcbiAgICAgIGhhc1Jlc2VydmVEYXRhOiBoYWJpdGF0c0luUmVzZXJ2ZXM/Lmxlbmd0aCA+IDBcbiAgICAgIGhhYml0YXRzSW5SZXNlcnZlczogaGFiaXRhdHNJblJlc2VydmVzXG4gICAgICBoYWJpdGF0c0luUmVzZXJ2ZXNDb3VudDogaGFiaXRhdHNJblJlc2VydmVzPy5sZW5ndGhcbiAgICAgICNoYWJpdGF0c0luUmVzZXJ2ZXNDb3VudDogXy5maWx0ZXIoaGFiaXRhdHNJblJlc2VydmVzLCAocm93KSAtPiBcbiAgICAgICMgICMgTmVlZCB0byBjb21lIHVwIHdpdGggc29tZSBvdGhlciBzdGFuZGFyZCB0aGF0IGp1c3QgcHJlc2VuY2U/XG4gICAgICAjICByb3cuQ0JfUEVSQyA+IDBcbiAgICAgICMpLmxlbmd0aFxuICAgICAgaGFzVHlwZVR3b0RhdGE6IGhhYml0YXRzSW5UeXBlVHdvcz8ubGVuZ3RoID4gMFxuICAgICAgaGFiaXRhdHNJblR5cGVUd29Db3VudDogaGFiaXRhdHNJblR5cGVUd29zPy5sZW5ndGhcbiAgICAgIGhhYml0YXRzSW5UeXBlVHdvczogaGFiaXRhdHNJblR5cGVUd29zXG4gICAgICAjaGFiaXRhdHNJblR5cGVUd29zQ291bnQ6IF8uZmlsdGVyKGhhYml0YXRzSW5UeXBlVHdvcywgKHJvdykgLT4gXG4gICAgICAgICMgTmVlZCB0byBjb21lIHVwIHdpdGggc29tZSBvdGhlciBzdGFuZGFyZCB0aGF0IGp1c3QgcHJlc2VuY2U/XG4gICAgICAjICByb3cuQ0JfUEVSQyA+IDBcbiAgICAgICMpLmxlbmd0aFxuICAgICAgIyByZXByZXNlbnRhdGlvbkRhdGE6IEByZWNvcmRTZXQoJ1JlcHJlc2VudGF0aW9uJywgJ1JlcHJlc2VudGF0aW9uJylcbiAgICAgICMgICAudG9BcnJheSgpXG4gICAgICByZXByZXNlbnRhdGlvbkRhdGE6cmVwcmVzZW50YXRpb25EYXRhXG4gICAgICBoYXNSZXByZXNlbnRhdGlvbkRhdGE6cmVwcmVzZW50YXRpb25EYXRhPy5sZW5ndGggPiAwXG4gICAgICByZXByZXNlbnRlZENvdW50OnJlcHJlc2VudGF0aW9uRGF0YT8ubGVuZ3RoXG4gICAgICAjcmVwcmVzZW50ZWRDb3VudDpfLmZpbHRlcihyZXByZXNlbnRhdGlvbkRhdGEsIChyb3cpIC0+IFxuICAgICAgICAjIE5lZWQgdG8gY29tZSB1cCB3aXRoIHNvbWUgb3RoZXIgc3RhbmRhcmQgdGhhdCBqdXN0IHByZXNlbmNlP1xuICAgICAgIyAgcm93LkNCX1BFUkMgPiAwXG4gICAgICAjKS5sZW5ndGhcblxuICAgICAgIyBVc2Ugc29tZXRoaW5nIGxpa2UgdGhpcyBmb3IgcmVwcmVzZW50ZWRDb3VudCB3aGVuIHlvdSBoYXZlIHJlYWwgZGF0YTpcbiAgICAgICMgXy5maWx0ZXIocmVwcmVzZW50YXRpb25EYXRhLCAocm93KSAtPlxuICAgICAgIyAgIHJvdy5Qcm90ZWN0ZWQgaXMgJ1llcydcbiAgICAgICMgKS5sZW5ndGhcbiAgICAgIGFkamFjZW50UHJvdGVjdGVkQXJlYXM6IG5lYXJfdGVycmVzdHJpYWxfcHJvdGVjdGVkICMgUGxhY2Vob2xkZXJcbiAgICAgICMgV291bGQgbmVlZCB0byBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUgdG8gc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgICAgICMgYWRqYWNlbnRQcm90ZWN0ZWRBcmVhczogQHJlY29yZFNldCgnQWRqYWNlbnRQcm90ZWN0ZWRBcmVhcycsIFxuICAgICAgIyAgICdhZGphY2VudCcpLmJvb2woJ0FOWV9BREpBQ0VOVCcpXG5cbiAgICAgIG51dHJpZW50UmVjeWNsaW5nOiBudXRyaWVudF9yZWN5Y2xpbmdcbiAgICAgIGJpb2dlbmljSGFiaXRhdDogYmlvZ2VuaWNfaGFiaXRhdFxuXG4gICAgICBlY29zeXN0ZW1Qcm9kdWN0aXZpdHk6IGVjb3N5c3RlbV9wcm9kdWN0aXZpdHlcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlVGFibGVQYWdpbmcoKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxubW9kdWxlLmV4cG9ydHMgPSBFbnZpcm9ubWVudFRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5fcGFydGlhbHMgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEZpc2hlcmllc1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICAjIHRoaXMgaXMgdGhlIG5hbWUgdGhhdCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgVGFiXG4gIG5hbWU6ICdGaXNoZXJpZXMnXG4gIGNsYXNzTmFtZTogJ2Zpc2hlcmllcydcbiAgdGltZW91dDogMTIwMDAwXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZmlzaGVyaWVzXG4gICMgRGVwZW5kZW5jaWVzIHdpbGwgbGlrZWx5IG5lZWQgdG8gYmUgY2hhbmdlZCB0byBzb21ldGhpbmcgbGlrZSB0aGlzIHRvXG4gICMgc3VwcG9ydCBtb3JlIEdQIHNlcnZpY2VzOlxuICBkZXBlbmRlbmNpZXM6IFsnRmlzaGluZ1Rvb2wnXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBcbiAgICByZWNyZWF0aW9uYWxGaXNoaW5nID0gQHJlY29yZFNldCgnRmlzaGluZ1Rvb2wnLCAnUmVjcmVhdGlvbmFsRmlzaGluZycpLnRvQXJyYXkoKVxuICAgIGN1c3RvbWFyeUZpc2hpbmcgPSBAcmVjb3JkU2V0KCdGaXNoaW5nVG9vbCcsICdDdXN0b21hcnlGaXNoaW5nJykudG9BcnJheSgpXG4gICAgY29tbWVyY2lhbEZpc2hpbmcgPSBAcmVjb3JkU2V0KCdGaXNoaW5nVG9vbCcsICdDb21tZXJjaWFsRmlzaGluZycpLnRvQXJyYXkoKVxuICAgIGNvbnRleHQgPVxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgY29tbWVyY2lhbEZpc2hpbmc6IGNvbW1lcmNpYWxGaXNoaW5nXG4gICAgICByZWNyZWF0aW9uYWxGaXNoaW5nOiByZWNyZWF0aW9uYWxGaXNoaW5nXG4gICAgICBjdXN0b21hcnlGaXNoaW5nOiBjdXN0b21hcnlGaXNoaW5nXG4gICAgICB0b3RhbEZvb2Q6IFtdXG5cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpc2hlcmllc1RhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5fcGFydGlhbHMgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbk1JTl9TSVpFID0gMTAwMDBcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgIyB0aGlzIGlzIHRoZSBuYW1lIHRoYXQgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIFRhYlxuICBuYW1lOiAnT3ZlcnZpZXcnXG4gIGNsYXNzTmFtZTogJ292ZXJ2aWV3J1xuICB0aW1lb3V0OiAxMjAwMDBcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnVGFyZ2V0U2l6ZSdcbiAgICAnSGFiaXRhdENvdW50J1xuICAgICdIYWJpdGF0Q291bnRQZXJjZW50J1xuICBdXG4gICMgRGVwZW5kZW5jaWVzIHdpbGwgbGlrZWx5IG5lZWQgdG8gYmUgY2hhbmdlZCB0byBzb21ldGhpbmcgbGlrZSB0aGlzIHRvXG4gICMgc3VwcG9ydCBtb3JlIEdQIHNlcnZpY2VzOlxuICAjIGRlcGVuZGVuY2llczogW1xuICAjICAgJ1RhcmdldFNpemUnXG4gICMgICAnUmVwcmVzZW50YXRpb25PZkhhYml0YXRzJ1xuICAjICAgJ1BlcmNlbnRQcm90ZWN0ZWQnXG4gICMgXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICAjIFRoZSBAcmVjb3JkU2V0IG1ldGhvZCBjb250YWlucyBzb21lIHVzZWZ1bCBtZWFucyB0byBnZXQgZGF0YSBvdXQgb2YgXG4gICAgIyB0aGUgbW9uc3Rlcm91cyBSZWNvcmRTZXQganNvbi4gQ2hlY2tvdXQgdGhlIHNlYXNrZXRjaC1yZXBvcnRpbmctdGVtcGxhdGVcbiAgICAjIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICBIRUNUQVJFUyA9IEByZWNvcmRTZXQoJ1RhcmdldFNpemUnLCAnVGFyZ2V0U2l6ZScpLmZsb2F0KCdTSVpFX0lOX0hBJylcbiAgICAjIHJlc3VsdDogSlNPTi5zdHJpbmdpZnkoQHJlc3VsdHMuZ2V0KCdkYXRhJyksIG51bGwsICcgICcpXG4gICAgaGNfcHJvcG9zZWQgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnQnLCAnSGFiaXRhdENvdW50JykuZmxvYXQoJ1NFTF9IQUInKVxuICAgIGhjX2V4aXN0aW5nID0gQHJlY29yZFNldCgnSGFiaXRhdENvdW50JywgJ0hhYml0YXRDb3VudCcpLmZsb2F0KCdFWFNUX0hBQicpXG4gICAgaGNfY29tYmluZWQgPUByZWNvcmRTZXQoJ0hhYml0YXRDb3VudCcsICdIYWJpdGF0Q291bnQnKS5mbG9hdCgnQ01CRF9IQUInKVxuICAgIGhjX3RvdGFsID0gQHJlY29yZFNldCgnSGFiaXRhdENvdW50JywgJ0hhYml0YXRDb3VudCcpLmZsb2F0KCdUT1RfSEFCJylcblxuICAgIEhBQl9QRVJDX01SX05FVyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdOV19SRVNfUFJDJylcbiAgICBIQUJfUEVSQ19NUl9FWElTVElORyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdFWF9SRVNfUFJDJylcbiAgICBIQUJfUEVSQ19NUl9DT01CSU5FRCA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdDQl9SRVNfUFJDJylcblxuICAgIEhBQl9QRVJDX1QyX05FVyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdOV19IUEFfUFJDJylcbiAgICBIQUJfUEVSQ19UMl9FWElTVElORyA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdFWF9IUEFfUFJDJylcbiAgICBIQUJfUEVSQ19UMl9DT01CSU5FRCA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdDQl9IUEFfUFJDJylcblxuICAgICNocF9tcl9uZXcgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnTldfUkVTX1BSQycpXG4gICAgI2hwX21yX2V4aXN0aW5nID0gQHJlY29yZFNldCgnSGFiaXRhdENvdW50UGVyY2VudCcsICdIYWJpdGF0Q291bnRQZXJjZW50JykuZmxvYXQoJ0VYX1JFU19QUkMnKVxuICAgICNocF9tcl9jb21iaW5lZCA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdDQl9SRVNfUFJDJylcblxuICAgICNocF90eXBlMl9uZXcgPSBAcmVjb3JkU2V0KCdIYWJpdGF0Q291bnRQZXJjZW50JywgJ0hhYml0YXRDb3VudFBlcmNlbnQnKS5mbG9hdCgnTldfSFBBX1BSQycpXG4gICAgI2hwX3R5cGUyX2V4aXN0aW5nID0gQHJlY29yZFNldCgnSGFiaXRhdENvdW50UGVyY2VudCcsICdIYWJpdGF0Q291bnRQZXJjZW50JykuZmxvYXQoJ0VYX0hQQV9QUkMnKVxuICAgICNocF90eXBlMl9jb21iaW5lZCA9IEByZWNvcmRTZXQoJ0hhYml0YXRDb3VudFBlcmNlbnQnLCAnSGFiaXRhdENvdW50UGVyY2VudCcpLmZsb2F0KCdDQl9IUEFfUFJDJylcblxuICAgICMgSSB1c2UgdGhpcyBpc0NvbGxlY3Rpb24gZmxhZyB0byBjdXN0b21pemUgdGhlIGRpc3BsYXkuIEFub3RoZXIgb3B0aW9uXG4gICAgIyB3b3VsZCBiZSB0byBoYXZlIHRvdGFsbHkgZGlmZmVyZW50IFRhYiBpbXBsZW1lbnRhdGlvbnMgZm9yIHpvbmVzIHZzIFxuICAgICMgY29sbGVjdGlvbnMuIEkgZGlkbid0IGRvIHRoYXQgaGVyZSBzaW5jZSB0aGV5IGFyZSBzbyBzaW1pbGFyLlxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuICAgIGlmIGlzQ29sbGVjdGlvblxuICAgICAgIyBAbW9kZWwgaXMgdGhlIGNsaWVudC1zaWRlIHNrZXRjaCByZXByZXNlbnRhdGlvbiwgd2hpY2ggaGFzIHNvbWVcbiAgICAgICMgdXNlZnVsLCBpZiB1bmRvY3VtZW50ZWQsIG1ldGhvZHMgbGlrZSBnZXRDaGlsZHJlbigpLlxuICAgICAgY2hpbGRyZW4gPSBAbW9kZWwuZ2V0Q2hpbGRyZW4oKVxuICAgICAgIyBOT1RFOiBJJ20gZGl2aWRpbmcgYnkgYWxsIGNoaWxkcmVuIGhlcmUuIFNob3VsZCB0aGlzIGJlIGZpbHRlcmVkIHRvXG4gICAgICAjIGV4Y2x1ZGUgQXF1YWN1bHR1cmUgYW5kIE1vb3JpbmcgYXJlYXM/P1xuICAgICAgSEVDVEFSRVMgPSAoSEVDVEFSRVMgLyBjaGlsZHJlbi5sZW5ndGgpLnRvRml4ZWQoMSlcbiAgICAgIFxuICAgICAgbWFyaW5lUmVzZXJ2ZXMgPSBfLmZpbHRlciBjaGlsZHJlbiwgKGNoaWxkKSAtPiBcbiAgICAgICAgY2hpbGQuZ2V0QXR0cmlidXRlKCdNUEFfVFlQRScpIGlzICdNUEExJ1xuICAgICAgdHlwZTJNUEFzID0gXy5maWx0ZXIgY2hpbGRyZW4sIChjaGlsZCkgLT4gXG4gICAgICAgIGNoaWxkLmdldEF0dHJpYnV0ZSgnTVBBX1RZUEUnKSBpcyAnTVBBMidcbiAgICBjb250ZXh0ID1cbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFueUF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKCkubGVuZ3RoID4gMFxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIFNJWkU6IEhFQ1RBUkVTXG4gICAgICBTSVpFX09LOiBIRUNUQVJFUyA+IE1JTl9TSVpFXG4gICAgICBNSU5fU0laRTogTUlOX1NJWkVcbiAgICAgIE1BUklORV9SRVNFUlZFUzogbWFyaW5lUmVzZXJ2ZXM/Lmxlbmd0aFxuICAgICAgTUFSSU5FX1JFU0VSVkVTX1BMVVJBTDogbWFyaW5lUmVzZXJ2ZXM/Lmxlbmd0aCAhPSAxXG4gICAgICBUWVBFX1RXT19NUEFTOiB0eXBlMk1QQXM/Lmxlbmd0aFxuICAgICAgVFlQRV9UV09fTVBBU19QTFVSQUw6IHR5cGUyTVBBcz8ubGVuZ3RoICE9IDFcbiAgICAgIE5VTV9QUk9URUNURUQ6IG1hcmluZVJlc2VydmVzPy5sZW5ndGggKyB0eXBlMk1QQXM/Lmxlbmd0aFxuICAgICAgSEFCX0NPVU5UX1BST1BPU0VEOiBoY19wcm9wb3NlZFxuICAgICAgSEFCX0NPVU5UX0VYSVNUSU5HOiBoY19leGlzdGluZ1xuICAgICAgSEFCX0NPVU5UX0NPTUJJTkVEOiBoY19jb21iaW5lZFxuICAgICAgSEFCX0NPVU5UX1RPVEFMOiBoY190b3RhbFxuICAgICAgSEFCX1BFUkNfTVJfTkVXOiBIQUJfUEVSQ19NUl9ORVdcbiAgICAgIEhBQl9QRVJDX01SX0VYSVNUSU5HOiBIQUJfUEVSQ19NUl9FWElTVElOR1xuICAgICAgSEFCX1BFUkNfTVJfQ09NQklORUQ6IEhBQl9QRVJDX01SX0NPTUJJTkVEXG4gICAgICBIQUJfUEVSQ19UMl9ORVc6IEhBQl9QRVJDX1QyX05FV1xuICAgICAgSEFCX1BFUkNfVDJfRVhJU1RJTkc6IEhBQl9QRVJDX1QyX0VYSVNUSU5HXG4gICAgICBIQUJfUEVSQ19UMl9DT01CSU5FRDogSEFCX1BFUkNfVDJfQ09NQklORURcblxuICAgICMgQHRlbXBsYXRlIGlzIC90ZW1wbGF0ZXMvb3ZlcnZpZXcubXVzdGFjaGVcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICAjIElmIHRoZSBtZWFzdXJlIGlzIHRvbyBoaWdoLCB0aGUgdmlzdWFsaXphdGlvbiBqdXN0IGxvb2tzIHN0dXBpZFxuICAgIGlmIEhFQ1RBUkVTIDwgTUlOX1NJWkUgKiAyXG4gICAgICBAZHJhd1ZpeihIRUNUQVJFUylcbiAgICBlbHNlXG4gICAgICBAJCgnLnZpeicpLmhpZGUoKVxuXG4gICMgRDMgaXMgYSBiaXQgb2YgYSBtZXNzIHVubGVzcyB5b3UndmUgcmVhbGx5IGludGVybmFsaXplZCBpdCdzIHdheSBvZiBkb2luZ1xuICAjIHRoaW5ncy4gSSdkIHN1Z2dlc3QganVzdCBkaXNwbGF5aW5nIHRoZSBcIlJlcHJlc2VudGF0aW9uXCIgYW5kIFwiUGVyY2VudFwiXG4gICMgaW5mbyB3aXRoIHNpbXBsZSB0YWJsZXMgdW5sZXNzIHRoZXJlIGlzIHBsZW50eSBvZiB0aW1lIHRvIHdvcmsgb24gdGhlXG4gICMgdmlzdWFsaXphdGlvbnMgaW4gdGhlIG1vY2t1cHMuXG4gIGRyYXdWaXo6IChzaXplKSAtPlxuICAgICMgQ2hlY2sgaWYgZDMgaXMgcHJlc2VudC4gSWYgbm90LCB3ZSdyZSBwcm9iYWJseSBkZWFsaW5nIHdpdGggSUVcbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIGNvbnNvbGUubG9nICdkMydcbiAgICAgIGVsID0gQCQoJy52aXonKVswXVxuICAgICAgbWF4U2NhbGUgPSBNSU5fU0laRSAqIDJcbiAgICAgIHJhbmdlcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdCZWxvdyByZWNvbW1lbmRlZCAoMCAtIDEwLDAwMCBoYSknXG4gICAgICAgICAgc3RhcnQ6IDBcbiAgICAgICAgICBlbmQ6IE1JTl9TSVpFXG4gICAgICAgICAgYmc6IFwiIzhlNWU1MFwiXG4gICAgICAgICAgY2xhc3M6ICdiZWxvdydcbiAgICAgICAgfVxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ1JlY29tbWVuZGVkICg+IDEwLDAwMCBoYSknXG4gICAgICAgICAgc3RhcnQ6IE1JTl9TSVpFXG4gICAgICAgICAgZW5kOiBNSU5fU0laRSAqIDJcbiAgICAgICAgICBiZzogJyM1ODhlM2YnXG4gICAgICAgICAgY2xhc3M6ICdyZWNvbW1lbmRlZCdcbiAgICAgICAgfVxuICAgICAgXVxuXG4gICAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihbMCwgbWF4U2NhbGVdKVxuICAgICAgICAucmFuZ2UoWzAsIDQwMF0pXG4gICAgICBcbiAgICAgIGNoYXJ0ID0gZDMuc2VsZWN0KGVsKVxuICAgICAgY2hhcnQuc2VsZWN0QWxsKFwiZGl2LnJhbmdlXCIpXG4gICAgICAgIC5kYXRhKHJhbmdlcylcbiAgICAgIC5lbnRlcigpLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAuc3R5bGUoXCJ3aWR0aFwiLCAoZCkgLT4geChkLmVuZCAtIGQuc3RhcnQpICsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCkgLT4gXCJyYW5nZSBcIiArIGQuY2xhc3MpXG4gICAgICAgIC5hcHBlbmQoXCJzcGFuXCIpXG4gICAgICAgICAgLnRleHQoKGQpIC0+IGQubmFtZSlcblxuICAgICAgY2hhcnQuc2VsZWN0QWxsKFwiZGl2Lm1lYXN1cmVcIilcbiAgICAgICAgLmRhdGEoW3NpemVdKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtZWFzdXJlXCIpXG4gICAgICAgIC5zdHlsZShcImxlZnRcIiwgKGQpIC0+IHgoZCkgKyAncHgnKVxuICAgICAgICAudGV4dCgoZCkgLT4gXCJcIilcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE92ZXJ2aWV3VGFiIiwiT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3LmNvZmZlZSdcbkVudmlyb25tZW50VGFiID0gcmVxdWlyZSAnLi9lbnZpcm9ubWVudC5jb2ZmZWUnXG5GaXNoZXJpZXNUYWIgPSByZXF1aXJlICcuL2Zpc2hlcmllcy5jb2ZmZWUnXG5BY3Rpdml0aWVzVGFiID0gcmVxdWlyZSAnLi9hY3Rpdml0aWVzLmNvZmZlZSdcblxud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbT3ZlcnZpZXdUYWIsIEVudmlyb25tZW50VGFiLCBGaXNoZXJpZXNUYWIsIEFjdGl2aXRpZXNUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcHJvdGVjdGlvblpvbmUuY3NzJ11cbiIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYWN0aXZpdGllc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlBvc3NpYmxlIEVmZmVjdHMgb24gQXF1YWN1bHR1cmU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+IDwhLS0gZGF0YS1wYWdpbmcuLi4gYWN0aXZhdGVzIHBhZ2luZyAgLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjE4MHB4O1xcXCI+VHlwZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QXJlYSBBZmZlY3RlZCAoSGEpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BcmVhIEFmZmVjdCAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBvdGVudGlhbCBJbXBhY3Qgb24gUHJvZHVjdGlvbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UG90ZW50aWFsIEltcGFjdCBvbiBFY29ub21pYyBWYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZVwiLGMscCwxKSxjLHAsMCw3NDUsOTEyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkZBUk1fVFlQRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTSVpFX0lOX0hBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkPi0tPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkPi0tPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkPi0tPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCI1XFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgTm90ZTogYXMgbm90IGFsbCBhcmVhcyBmaXNoZWQgaGF2ZSB0aGUgc2FtZSBmaXNoaW5nIGVmZm9ydCBvciBjYXRjaCwgdGhlIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIOKAnExldmVsIG9mIEZpc2hpbmcgRGlzcGxhY2Vk4oCdIGlzIGEgY29tYmluYXRpb24gb2YgdGhlIGFyZWEgYmVpbmcgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgcmVzdHJpY3RlZCBhbmQgdGhlIGNhdGNoIHRoYXQgd291bGQgbm9ybWFsbHkgYmUgY2F1Z2h0IGluIHRoYXQgYXJlYVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RXhpc3RpbmcgVXNlIENvbmZsaWN0czwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc0V4aXN0aW5nVXNlQ29uZmxpY3RzXCIsYyxwLDEpLGMscCwwLDE0ODYsMTY4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIE9uZSBvciBtb3JlIHByb3RlY3Rpb24gY2xhc3NlcyBvdmVybGFwIHdpdGgsIG9yIGFyZSBuZWFyLCA8c3Ryb25nPmV4aXN0aW5nIHVzZXM8L3N0cm9uZz4gdGhhdCBhcmUgaW4gY29uZmxpY3Qgd2l0aCB0aGUgcHVycG9zZXMgb2YgdGhlIHByb3RlY3Rpb24uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj4gPCEtLSBkYXRhLXBhZ2luZy4uLiBhY3RpdmF0ZXMgcGFnaW5nICAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5FeGlzdGluZyBVc2U8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPklzIENvbXBhdGlibGU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZXhpc3RpbmdVc2VzXCIsYyxwLDEpLGMscCwwLDE5MjMsMjAxMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJGRUFUX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGQ+LS08L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBSZWNyZWF0aW9uYWwgVXNlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1JlY3JlYXRpb25hbFVzZUNvbmZsaWN0c1wiLGMscCwxKSxjLHAsMCwyMTgzLDIzODUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBPbmUgb3IgbW9yZSBwcm90ZWN0aW9uIGNsYXNzZXMgb3ZlcmxhcCB3aXRoLCBvciBhcmUgbmVhciwgPHN0cm9uZz5yZWNyZWF0aW9uYWwgdXNlczwvc3Ryb25nPiB0aGF0IG1heSBiZSBpbiBjb25mbGljdCB3aXRoIHRoZSBwdXJwb3NlcyBvZiB0aGUgcHJvdGVjdGlvbi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPiA8IS0tIGRhdGEtcGFnaW5nLi4uIGFjdGl2YXRlcyBwYWdpbmcgIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlJlY3JlYXRpb25hbCBVc2U8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPklzIENvbXBhdGlibGU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVjcmVhdGlvbmFsVXNlc1wiLGMscCwxKSxjLHAsMCwyNjM5LDI3MjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRkVBVF9UWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkPi0tPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJvdmVybGFwV2l0aE1vb3JpbmdzQW5kQW5jaG9yYWdlc1wiLGMscCwxKSxjLHAsMCwyODIwLDMwNzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXBzIHdpdGggTW9vcmluZyBhbmQgQW5jaG9yYWdlIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZSBncmVlbi1jaGVja1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIE9uZSBtb3JlIG1vcmUgcHJvdGVjdGlvbiBhcmVhcyBvdmVybGFwIHdpdGggc2l0ZXMgdGhhdCBhcmUgaWRlbnRpZmllZCBhcyBnb29kIGZvciA8c3Ryb25nPk1vb3JpbmcgYW5kIEFuY2hvcmFnZXM8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImRlbW9cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVwb3J0IFNlY3Rpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlVzZSByZXBvcnQgc2VjdGlvbnMgdG8gZ3JvdXAgaW5mb3JtYXRpb24gaW50byBtZWFuaW5nZnVsIGNhdGVnb3JpZXM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EMyBWaXN1YWxpemF0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcIm5hdiBuYXYtcGlsbHNcXFwiIGlkPVxcXCJ0YWJzMlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxsaSBjbGFzcz1cXFwiYWN0aXZlXFxcIj48YSBocmVmPVxcXCIjY2hhcnRcXFwiPkNoYXJ0PC9hPjwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxsaT48YSBocmVmPVxcXCIjZGF0YVRhYmxlXFxcIj5UYWJsZTwvYT48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC91bD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInRhYi1jb250ZW50XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwidGFiLXBhbmUgYWN0aXZlXFxcIiBpZD1cXFwiY2hhcnRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwhLS1baWYgSUUgOF0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHAgY2xhc3M9XFxcInVuc3VwcG9ydGVkXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUaGlzIHZpc3VhbGl6YXRpb24gaXMgbm90IGNvbXBhdGlibGUgd2l0aCBJbnRlcm5ldCBFeHBsb3JlciA4LiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBQbGVhc2UgdXBncmFkZSB5b3VyIGJyb3dzZXIsIG9yIHZpZXcgcmVzdWx0cyBpbiB0aGUgdGFibGUgdGFiLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD4gICAgICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8IVtlbmRpZl0tLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFNlZSA8Y29kZT5zcmMvc2NyaXB0cy9kZW1vLmNvZmZlZTwvY29kZT4gZm9yIGFuIGV4YW1wbGUgb2YgaG93IHRvIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgdXNlIGQzLmpzIHRvIHJlbmRlciB2aXN1YWxpemF0aW9ucy4gUHJvdmlkZSBhIHRhYmxlLWJhc2VkIHZpZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGFuZCB1c2UgY29uZGl0aW9uYWwgY29tbWVudHMgdG8gcHJvdmlkZSBhIGZhbGxiYWNrIGZvciBJRTggdXNlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8YSBocmVmPVxcXCJodHRwOi8vdHdpdHRlci5naXRodWIuaW8vYm9vdHN0cmFwLzIuMy4yL1xcXCI+Qm9vdHN0cmFwIDIueDwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGlzIGxvYWRlZCB3aXRoaW4gU2VhU2tldGNoIHNvIHlvdSBjYW4gdXNlIGl0IHRvIGNyZWF0ZSB0YWJzIGFuZCBvdGhlciBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGludGVyZmFjZSBjb21wb25lbnRzLiBqUXVlcnkgYW5kIHVuZGVyc2NvcmUgYXJlIGFsc28gYXZhaWxhYmxlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInRhYi1wYW5lXFxcIiBpZD1cXFwiZGF0YVRhYmxlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+aW5kZXg8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD52YWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjaGFydERhdGFcIixjLHAsMSksYyxwLDAsMTM1MSwxNDE4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJpbmRleFwiLGMscCwwKSkpO18uYihcIjwvdGQ+PHRkPlwiKTtfLmIoXy52KF8uZihcInZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGVtcGhhc2lzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5FbXBoYXNpczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5HaXZlIHJlcG9ydCBzZWN0aW9ucyBhbiA8Y29kZT5lbXBoYXNpczwvY29kZT4gY2xhc3MgdG8gaGlnaGxpZ2h0IGltcG9ydGFudCBpbmZvcm1hdGlvbi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHdhcm5pbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pldhcm5pbmc8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+T3IgPGNvZGU+d2FybjwvY29kZT4gb2YgcG90ZW50aWFsIHByb2JsZW1zLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gZGFuZ2VyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EYW5nZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+PGNvZGU+ZGFuZ2VyPC9jb2RlPiBjYW4gYWxzbyBiZSB1c2VkLi4uIHNwYXJpbmdseS48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZmlzaGVyaWVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkNvbW1lcmNpYWwgRmlzaGluZzwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OYW1lPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BZmZlY3RlZCBBcmVhICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TGV2ZWwgb2YgRmlzaGluZyBEaXNwbGFjZWQgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5FY29ub21pYyBWYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TnVtYmVyIG9mIEFmZmVjdGVkIEZpc2hlcnM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkZpc2hlcnMgaW4gR3VsZiBGaXNoZXJ5PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNvbW1lcmNpYWxGaXNoaW5nXCIsYyxwLDEpLGMscCwwLDQxMCw2MDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQcmNEc3BsY2RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkxldmVsXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTnVtXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJGaXNoZXJzXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNlxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBOb3RlOiBhcyBub3QgYWxsIGFyZWFzIGZpc2hlZCBoYXZlIHRoZSBzYW1lIGZpc2hpbmcgZWZmb3J0IG9yIGNhdGNoLCB0aGUg4oCcTGV2ZWwgb2YgRmlzaGluZyBEaXNwbGFjZWTigJ0gaXMgYSBjb21iaW5hdGlvbiBvZiB0aGUgYXJlYSBiZWluZyByZXN0cmljdGVkIGFuZCB0aGUgY2F0Y2ggdGhhdCB3b3VsZCBub3JtYWxseSBiZSBjYXVnaHQgaW4gdGhhdCBhcmVhLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlY3JlYXRpb25hbCBGaXNoaW5nPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFmZmVjdGVkIEFyZWEgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5MZXZlbCBvZiBGaXNoaW5nIERpc3BsYWNlZCAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkVjb25vbWljIFZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgQWZmZWN0ZWQgRmlzaGVyczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+RmlzaGVycyBpbiBHdWxmIEZpc2hlcnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVjcmVhdGlvbmFsRmlzaGluZ1wiLGMscCwxKSxjLHAsMCwxNDIwLDE2MTUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQcmNEc3BsY2RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkxldmVsXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTnVtXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJGaXNoZXJzXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCI2XFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkN1c3RvbWFyeSBGaXNoaW5nPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFmZmVjdGVkIEFyZWEgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5MZXZlbCBvZiBGaXNoaW5nIERpc3BsYWNlZCAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkVjb25vbWljIFZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgQWZmZWN0ZWQgRmlzaGVyczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+RmlzaGVycyBpbiBHdWxmIEZpc2hlcnk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY3VzdG9tYXJ5RmlzaGluZ1wiLGMscCwxKSxjLHAsMCwyMjIxLDI0MTYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQcmNEc3BsY2RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkxldmVsXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTnVtXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJGaXNoZXJzXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjZcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgSW1wb3J0YW50IGN1c3RvbWFyeSBmaXNoaW5nIGxvY2F0aW9ucyBoYXZlIG5vdCBiZWVuIGlkZW50aWZpZWQgeWV0LiBJbmZvcm1hdGlvbiBvbiB0aGUgd2hlcmVhYm91dHMgb2YgdGhlc2UgYWN0aXZpdGllcyBtYXkgYmUgYWRkZWQgZHVyaW5nIHBsYW5uaW5nIHByb2Nlc3MuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VG90YWwgRm9vZCBQcm92aXNpb248L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+RmlzaCBTdG9jazwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+Q2F0Y2ggRGlzcGxhY2VkICh0b25uc3MpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IGZyb20gR3VsZjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUQUM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlZhbHVlIG9mIEZpc2g8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlZhbHVlIHRvIE5aIEVjb25vbXk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwidG90YWxGb29kXCIsYyxwLDEpLGMscCwwLDMxNTUsMzM1OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkZpc2hTdG9ja1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiS2dzX0hhXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJHdWxmX0tnc1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidGFjXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJ2YWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVfdG9fbnpcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNlxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBUaGUgdG90YWwgZm9vZCBwcm92aXNpb24gaW5jbHVkZXMgY29tbWVyY2lhbCwgcmVjcmVhdGlvbmFsLCBhbmRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgY3VzdG9tYXJ5IGNhdGNoLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiaGFiaXRhdFwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDE3LDMyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGUgY29sbGVjdGlvbiBvZiBtYXJpbmUgcHJvdGVjdGVkIGFyZWFzIHdpbGwgcHJvdGVjdCB0aGUgZnVsbCByYW5nZSBvZiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5hdHVyYWwgbWFyaW5lIGhhYml0YXRzIGFuZCBlY29zeXN0ZW1zLiBUaGVzZSByZXBvcnRzIHNob3cgdGhlIHByb3BvcnRpb24gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBvZiB0aGUgZ3VsZiBwcm90ZWN0ZWQgZm9yIGVhY2ggaGFiaXRhdCB0eXBlIGluIE1hcmluZSBSZXNlcnZlcyBhbmQgVHlwZS0yIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgUHJvdGVjdGVkIEFyZWFzLCBmb3IgYm90aCBleGlzdGluZyBwcm90ZWN0ZWQgYXJlYXMgYW5kIHNrZXRjaGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1Jlc2VydmVEYXRhXCIsYyxwLDEpLGMscCwwLDM2MSwxNDg2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyBQcm90ZWN0ZWQgaW4gTWFyaW5lIFJlc2VydmVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPiA8IS0tIGRhdGEtcGFnaW5nLi4uIGFjdGl2YXRlcyBwYWdpbmcgIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoxODBweDtcXFwiPkhhYml0YXRzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD4lIEluIEV4aXN0aW5nIE1hcmluZSBSZXNlcnZlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+JSBJbiBOZXcgTWFyaW5lIFJlc2VydmVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6NTBweDtcXFwiPlRvdGFsPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhYml0YXRzSW5SZXNlcnZlc1wiLGMscCwxKSxjLHAsMCw3OTEsOTM5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkVYX1BFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5FV19QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDQl9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNFxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMTEyNCwxMTczLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICBNYXJpbmUgUmVzZXJ2ZXMgcHJvdGVjdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgICBUaGlzIE1hcmluZSBSZXNlcnZlIHByb3RlY3RzXCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgICAgICAgICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiaGFiaXRhdHNJblJlc2VydmVzQ291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImhhYml0YXRzQ291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gaGFiaXRhdCB0eXBlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1R5cGVUd29EYXRhXCIsYyxwLDEpLGMscCwwLDE1MjYsMjYzNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgUHJvdGVjdGVkIGluIFR5cGUtMiBQcm90ZWN0ZWQgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjE4MHB4O1xcXCI+SGFiaXRhdHM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPiUgSW4gRXhpc3RpbmcgVHlwZS0yIFByb3RlY3RlZCBBcmVhczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+JSBJbiBOZXcgVHlwZS0yIFByb3RlY3RlZCBBcmVhczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjUwcHg7XFxcIj5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c0luVHlwZVR3b3NcIixjLHAsMSksYyxwLDAsMTkzNSwyMDgzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkVYX1BFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5FV19QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDQl9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNFxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMjI2OCwyMzE4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICBUeXBlLTIgUmVzZXJ2ZXMgcHJvdGVjdCBcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgICAgVGhpcyBUeXBlLTIgUHJvdGVjdGVkIEFyZWEgcHJvdGVjdHNcIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICAgICAgICAgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJoYWJpdGF0c0luVHlwZVR3b0NvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJoYWJpdGF0c0NvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IGhhYml0YXQgdHlwZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiUERGIHNheXMgZm9yIGJvdGggem9uZXMgYW5kIGNvbGxlY3Rpb25zLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJJIGp1c3QgaW5jbHVkZWQgY29sbGVjdGlvbnMgZm9yIG5vdyAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiLS0+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1JlcHJlc2VudGF0aW9uRGF0YVwiLGMscCwxKSxjLHAsMCwyNzc0LDM3MTEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXQgUmVwcmVzZW50YXRpb248L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdHM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlRvdGFsIEhBIFByb3RlY3RlZCBpbiBBbGwgQXJlYXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlRvdGFsICUgaW4gQWxsIEFyZWFzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgU2l0ZXMgUHJvdGVjdGVkPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5BZGVxdWF0ZWx5IFJlcHJlc2VudGVkPzwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJyZXByZXNlbnRhdGlvbkRhdGFcIixjLHAsMSksYyxwLDAsMzE2NSwzMzM0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNCX1NJWkVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNCX1BFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlJFUF9DT1VOVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+Pz88L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCI1XFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInJlcHJlc2VudGVkQ291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImhhYml0YXRzQ291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gaGFiaXRhdHMgYXJlIGFkZXF1YXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgcHJvdGVjdGVkLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJhZGphY2VudFByb3RlY3RlZEFyZWFzXCIsYyxwLDEpLGMscCwwLDM3ODQsMzk4MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+QWRqYWNlbnQgVGVycmVzdHJpYWwgUHJvdGVjdGVkIEFyZWE8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlIGdyZWVuLWNoZWNrXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIGFkamFjZW50IHRvIGEgPHN0cm9uZz5UZXJyZXN0cmlhbCBQcm90ZWN0ZWQgQXJlYTwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fX07Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk51dHJpZW50IFJlY3ljbGluZzwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5WYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QXJlYSBpbiBIZWN0YXJlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJudXRyaWVudFJlY3ljbGluZ1wiLGMscCwxKSxjLHAsMCw0Mjk4LDQ0MTQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDbGFzc1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQXJlYUluSGFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+QmlvZ2VuaWMgSGFiaXRhdDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5WYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+QXJlYSBpbiBIZWN0YXJlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJiaW9nZW5pY0hhYml0YXRcIixjLHAsMSksYyxwLDAsNDczNyw0ODUzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFyZWFJbkhhXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkVjb3N5c3RlbSBQcm9kdWN0aXZpdHk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkFyZWEgaW4gSGVjdGFyZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZWNvc3lzdGVtUHJvZHVjdGl2aXR5XCIsYyxwLDEpLGMscCwwLDUxODQsNTMwMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBcmVhSW5IYVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2l6ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2UgXCIpO2lmKF8ucyhfLmYoXCJTSVpFX09LXCIsYyxwLDEpLGMscCwwLDM3NSwzODYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImdyZWVuLWNoZWNrXCIpO30pO2MucG9wKCk7fV8uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwhLS0gTm90aWNlLCB1c2luZyBtdXN0YWNoZSB0YWdzIGhlcmUgdG8gdGVzdCB3aGV0aGVyIHdlJ3JlIHJlbmRlcmluZyBhIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBjb2xsZWN0aW9uIG9yIGEgc2luZ2xlIHpvbmUgLS0+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw1MzUsNjU3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhlIGF2ZXJhZ2Ugc2l6ZSBvZiB0aGUgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJOVU1fUFJPVEVDVEVEXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IHByb3RlY3RlZCBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgYXJlYXMgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJTSVpFXCIsYyxwLDApKSk7Xy5iKFwiIGhhPC9zdHJvbmc+LFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgVGhpcyBwcm90ZWN0ZWQgYXJlYSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNJWkVcIixjLHAsMCkpKTtfLmIoXCIgaGE8L3N0cm9uZz4sXCIpO18uYihcIlxcblwiKTt9O2lmKF8ucyhfLmYoXCJTSVpFX09LXCIsYyxwLDEpLGMscCwwLDc5Miw4NDAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICBtZWV0aW5nIHRoZSB0YXJnZXQgb2YgXCIpO18uYihfLnYoXy5mKFwiTUlOX1NJWkVcIixjLHAsMCkpKTtfLmIoXCIgaGEuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIlNJWkVfT0tcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgd2hpY2ggZG9lcyBub3QgbWVldCB0aGUgdGFyZ2V0IG9mIFwiKTtfLmIoXy52KF8uZihcIk1JTl9TSVpFXCIsYyxwLDApKSk7Xy5iKFwiIGhhLlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBzdHlsZT1cXFwiZm9udC1zaXplOjEycHg7cGFkZGluZzoxMXB4O3RleHQtYWxpZ246bGVmdDttYXJnaW4tdG9wOi0xMHB4O1xcXCI+Rm9yIHRoZSBzYW1lIGFtb3VudCBvZiBhcmVhIHRvIGJlIHByb3RlY3RlZCwgaXQgaXMgZGVzaXJhYmxlIHRvIHByb3RlY3QgZmV3ZXIsIGxhcmdlciBhcmVhcyByYXRoZXIgdGhhbiBudW1lcm91cyBzbWFsbGVyIG9uZXMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMTIwMCwxNTQxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIiBzdHlsZT1cXFwicGFkZGluZzowcHggMTBweDtwYWRkaW5nLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhlIHNlbGVjdGVkIG5ldHdvcmsgY29udGFpbnMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJUWVBFX1RXT19NUEFTXCIsYyxwLDApKSk7Xy5iKFwiIEhhYml0YXQgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgUHJvdGVjdGlvbiBab25lXCIpO2lmKF8ucyhfLmYoXCJUWVBFX1RXT19NUEFTX1BMVVJBTFwiLGMscCwxKSxjLHAsMCwxMzg2LDEzODcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGFuZCBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBcIik7Xy5iKF8udihfLmYoXCJNQVJJTkVfUkVTRVJWRVNcIixjLHAsMCkpKTtfLmIoXCIgTWFyaW5lXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgUmVzZXJ2ZVwiKTtpZihfLnMoXy5mKFwiTUFSSU5FX1JFU0VSVkVTX1BMVVJBTFwiLGMscCwxKSxjLHAsMCwxNDkxLDE0OTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVwcmVzZW50YXRpb24gb2YgSGFiaXRhdHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+IDwhLS0gZGF0YS1wYWdpbmcuLi4gYWN0aXZhdGVzIHBhZ2luZyAgLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjE4MHB4O1xcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JbiBQcm9wb3NlZCBBcmVhczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW4gRXhpc3RpbmcgQXJlYXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkNvbWJpbmVkPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Ub3RhbCA8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+TnVtYmVyIG9mIEhhYml0YXRzIFByb3RlY3RlZDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX0NPVU5UX1BST1BPU0VEXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfQ09VTlRfRVhJU1RJTkdcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9DT1VOVF9DT01CSU5FRFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX0NPVU5UX1RPVEFMXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjVcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDIzMjQsMjM5MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgTmV3IGFuZCBleGlzdGluZyBNYXJpbmUgUmVzZXJ2ZXMgcHJvdGVjdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgICBUaGlzIE1hcmluZSBSZXNlcnZlIHByb3RlY3RzXCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgICAgICAgICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiSEFCX0NPVU5UX0NPTUJJTkVEXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJIQUJfQ09VTlRfVE9UQUxcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gaGFiaXRhdCB0eXBlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlBlcmNlbnQgb2YgSGF1cmFraSBHdWxmIE1hcmluZSBQYXJrIFByb3RlY3RlZDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPiA8IS0tIGRhdGEtcGFnaW5nLi4uIGFjdGl2YXRlcyBwYWdpbmcgIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoxODBweDtcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW4gUHJvcG9zZWQgQXJlYXMgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JbiBFeGlzdGluZyBBcmVhcyAoJSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkNvbWJpbmVkICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5JbiBNYXJpbmUgUmVzZXJ2ZXM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9QRVJDX01SX05FV1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1BFUkNfTVJfRVhJU1RJTkdcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9QRVJDX01SX0NPTUJJTkVEXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5JbiBUeXBlIDIgUHJvdGVjdGlvbiBBcmVhczwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1BFUkNfVDJfTkVXXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfUEVSQ19UMl9FWElTVElOR1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1BFUkNfVDJfQ09NQklORURcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNFxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlRoaXMgdGFibGUgc2hvd3MgaG93IOKAmGNvbXByZWhlbnNpdmXigJkgdGhlIHByb3Bvc2VkIHByb3RlY3Rpb25cIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwzNjU0LDM2NTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInMgYXJlXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiIGlzXCIpO307Xy5iKFwiLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBQcm9wb3NlZCBhbmQgZXhpc3RpbmcgcGxhbnMgcHJvdGVjdCB0aGVzZSBwZXJjZW50YWdlcyBvZiB0aGUgdG90YWwgYXJlYXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIkknbSBsZWF2aW5nIHRoZXNlIGl0ZW1zIGNvbW1lbnRlZCBvdXQgYmVjYXVzZSB0aGV5IHNlZW0gaGFyZCB0byBpbXBsZW1lbnRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJhbmQgZHVwbGljYXRpdmUuIEl0J3MgYWxzbyBub3QgY2xlYXIgaG93IHRoZXkgd291bGQgbG9vayBhdCB0aGUgem9uZS1sZXZlbC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gcmVwcmVzZW50YXRpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcHJlc2VudGF0aW9uIG9mIEhhYml0YXRzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlRoZSBwcm9wb3NlZCBwcm90ZWN0aW9uIGFyZWFzIGFuZCBleGlzdGluZyByZXNlcnZlcyBwcm90ZWN0IGEgc2FtcGxlIG9mIHRoZSBmb2xsb3dpbmcgbnVtYmVyIG9mIGhhYml0YXRzOjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gcGVyY2VudFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UGVyY2VudCBvZiBIYXVyYWtpIEd1bGYgTWFyaW5lIFBhcmsgUHJvdGVjdGVkPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlRoZSBncmFwaCBiZWxvd3Mgc2hvd3MgaG93IOKAmGNvbXByZWhlbnNpdmXigJkgdGhlIHByb3Bvc2VkIHByb3RlY3Rpb24gaXMuIFRoZSBwcm9wb3NlZCBwbGFuIGluY2x1ZGVzIHRoZSBmb2xsb3dpbmcgcHJvdGVjdGlvbiB0eXBlczo8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQ5OSw0NjIzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTsiXX0=
;