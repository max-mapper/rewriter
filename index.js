var request = require('request')
  , couch = require('couch')
  , qs = require('querystring')
  , filed = require('filed')
  , path = require('path')
  , _ = require('underscore')
  , opts = require('./defaults')()
  ;

module.exports = function (t, rewrites, options) {
  if (options) _.extend(opts, options)
  
  var _handlers = {
    "_view": function(rewrite, req, resp) {
      proxyCouch(rewrite, req, resp)
    }
  }
  
  function proxyCouch(rewrite, req, resp) {
    // var url = opts.ddoc + req.route.splats.join('/') 
    var url = opts.ddoc + rewrite.to
    var query = rewrite.query
    if (req.query) _.extend(query, req.query)
    if (query) url += "?" + qs.stringify(query)
    request({url:url, json:true}).pipe(resp)
  }
  
  _.each(rewrites, function(rewrite) {
    var to = rewrite.to
    if (_.first(to) === "/") to = _.rest(to).join('')
    if (_.first(to) === '_') t.route(rewrite.from, function(req, resp) {
      _handlers[_.first(to.split('/'))](rewrite, req, resp)
    })
  })
  t.route('/*').files(opts.attachments)
}

