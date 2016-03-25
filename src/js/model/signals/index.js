'use strict';
var dl = require('datalib'),
    ns = require('../../util/ns'),
    defaults = require('./defaults'),
    signals = defaults.signals;

function api() {
  return signals;
}

// Augment the signals API with properties like SELECTED that define the
// strings used to identify and trigger a given signal
dl.extend(api, defaults.signalNames);

function ref(name) {
  return {signal: ns(name)};
}

api.init = function(name, val) {
  name = ns(name);
  signals[name] = {
    name: name,
    init: val,
    _idx: dl.keys(signals).length
  };
  return ref(name);
};

api.getValue = function(name) {
  var model = require('../'),
      // `view` is a vega runtime component; view.signal is a getter/setter
      view = model.view,
      signalObj = signals[ns(name)];

  // Wrap signal accessors in a try/catch in case view doesn't exist,
  // or signal hasn't been registered yet with the view.
  try {
    return view.signal(name);
  } catch (e) {
    return signalObj.init;
  }
};

api.value = function(name, val) {
  var model = require('../'),
      // `view` is a vega runtime component; view.signal is a getter/setter
      view = model.view,
      signalObj = signals[ns(name)],
      calledAsSetter = arguments.length === 2;

  // Wrap signal accessors in a try/catch in case view doesn't exist,
  // or signal hasn't been registered yet with the view.
  try {
    val = view.signal.apply(view, arguments);
    return calledAsSetter ? api : val;
  } catch (e) {
    if (calledAsSetter) {
      signalObj.init = val;
    }
    return calledAsSetter ? api : signalObj.init;
  }
};

// Stash current signal values from the view into our model
// to allow seamless re-renders.
api.stash = function() {
  var model = require('../'),
      view = model.view;
  if (!view) {
    return signals;
  }

  for (var key in signals) {
    if (defaults.names.indexOf(key) >= 0) {
      continue;
    }
    if (view && typeof view.signal === 'function') {
      signals[key].init = view.signal(key);
    }
  }

  return signals;
};

api.streams = function(name, def) {
  var sg = signals[ns(name)];
  if (arguments.length === 1) {
    return sg.streams;
  }
  sg.streams = def;
  return api;
};

module.exports = api;