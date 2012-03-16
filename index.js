var request = require('request')
  , qs = require('querystring')
  , filed = require('filed')
  , path = require('path')
  , url = require('url')
  , _ = require('underscore')
  , BufferedStream = require('morestreams').BufferedStream
  , defaults = require('./defaults')()
  
function Rewriter(tako, rewrites, options) {
  this.tako = tako
  var self = this
  if (!options) options = {}  
  self.opts = _.extend({}, defaults, options)
  
  _.each(self.flattenRewrites(rewrites), function(rewrite) {
    var to = rewrite.to
    if (_.first(to) === "/") to = _.rest(to).join('')
    if (_.first(to) === '_') return self.proxyCouch(rewrite)
    return self.proxyRequest(rewrite)
  })
}

Rewriter.prototype.resolveSymbols = function(to, params, query) {
  var self = this
  _.each(params, function(val, param) {
    to = to.replace(':' + param, val)
    if (query) {
      _.each(query, function(queryVal, queryKey) {
        function replaceSymbol(input) {
          if (!_.isString(input)) return input
          return input.replace(':' + param, val)
        }
        var newVal = _.isArray(queryVal) ? _.map(queryVal, replaceSymbol) : replaceSymbol(queryVal)
        query[queryKey] = newVal
      })
    }
  })
  return to
}

Rewriter.prototype.createProxy = function(req, resp, proxyOpts, stream) {
  var proxy = request(proxyOpts)
  req.pipe(proxy)
  if (stream) {
    stream.pipe(proxy)
    stream.resume()
  }
  proxy.pipe(resp)
}

Rewriter.prototype.route = function(rewrite, callback) {
  if (typeof(rewrite.from) === "undefined") return console.error("NO FROM" + JSON.stringify(rewrite))
  var from = rewrite.from
  if (_.first(from) !== "/") from = "/" + from
  this.tako.route(from, function(req, resp) {
    if (!rewrite.before) return callback(req, resp)

    var stream = new BufferedStream
    stream.pause()
    req.pipe(stream)
    
    rewrite.before(req, resp, function(err) {
      if (err) resp.end(err)
      else callback(req, resp, stream)
    })
  })
}

Rewriter.prototype.proxyFile = function(to, req, resp, rewrite) {
  var self = this
  var files = self.opts.attachments
  if (!files) {
    resp.statusCode = 404
    return resp.end('file not found')
  }
  if (_.isString(files) && files.match(/https?/i)) {
    var dest = self.opts.attachments + '/' + to
    return self.createProxy(req, resp, dest)
  }
  filed(path.resolve(files, to)).pipe(resp)
}

Rewriter.prototype.proxyRequest = function(rewrite) {
  var self = this
  self.route(rewrite, function(req, resp, stream) {
    var to = rewrite.to
      , query = _.extend({}, rewrite.query)
      , protocol = url.parse(to).protocol
    if (req.route.splats) to = to.replace('*', req.route.splats.join('/'))
    if (req.query) _.extend(query, qs.parse(req.query))
    if (req.route.params) to = self.resolveSymbols(to, req.route.params, query)
    if (query.key) query.key = JSON.stringify(query.key)
    if (query.startkey) query.startkey = JSON.stringify(query.startkey)
    if (query.endkey) query.endkey = JSON.stringify(query.endkey)
    if (_.keys(query).length) to += "?" + qs.stringify(query)
    var proxyOpts = {url: to}
    if (rewrite.json) proxyOpts.json = rewrite.json
    if ( protocol && protocol.match(/https?/i) ) self.createProxy(req, resp, proxyOpts, stream)
    else self.proxyFile(to, req, resp, rewrite)
  })
}

Rewriter.prototype.proxyCouch = function(rewrite) {
  this.proxyRequest(_.extend({}, rewrite, {
    to: this.opts.ddoc + rewrite.to,
    json: true
  }))
}

Rewriter.prototype.flattenRewrites = function(rewrites) {
  var flattened = []
  _.each(rewrites, function(rewrite) {
    if (rewrite.rewrites) {
      _.each(rewrite.rewrites, function(subRewrite) {
        flattened.push(_.extend({}, subRewrite, {before: rewrite.before}))
      })
    } else {
      flattened.push(rewrite)
    }
  })
  return flattened
}

module.exports = Rewriter