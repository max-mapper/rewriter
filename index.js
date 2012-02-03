var request = require('request')
  , bouncy = require('bouncy')
  , qs = require('querystring')
  , filed = require('filed')
  , path = require('path')
  , url = require('url')
  , _ = require('underscore')
  , opts = require('./defaults')()

module.exports = function (t, rewrites, options) {
  if (options) _.extend(opts, options)

  function resolveSymbols(to, params, query) {
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
  
  function createProxy(req, resp, opts) {
    req.on('data', function(data) {
      if (data.isgood) req.pipe(request("http://localhost:9998"))
    })
    req.on('end', function() {
      
    })
    // var dest = url.parse(opts.url)
    // bouncy(function (reqst, bounce) {
    //   var data = ""
    //   reqst.on('data', function (buf) { data += buf })
    //   reqst.on('end', function () {
    //     // inspect data, then:
    //     bounce({ port: dest.port, path: dest.path, headers: {host: dest.host} })
    //   })
    // }).listen(9998)
  }
  
  function route(rewrite, callback) {
    t.route(rewrite.from, function(req, resp) {
      if (!rewrite.before) return callback(req, resp)
      rewrite.before(req, resp, function(err) {
        if (err) console.error(err)
        else callback(req, resp)
      })
    })
  }
  
  function proxyFile(rewrite, req, resp) {
    route(rewrite, function(req, resp) {
      filed(path.resolve(opts.attachments, rewrite.to)).pipe(resp)
    })
  }
  
  function proxyRequest(rewrite) {
    route(rewrite, function(req, resp) {
      var to = rewrite.to
        , query = _.extend({}, rewrite.query)
      if (req.route.splats) to = to.replace('*', req.route.splats.join('/'))
      if (req.query) _.extend(query, qs.parse(req.query))
      if (req.route.params) to = resolveSymbols(to, req.route.params, query)
      if (query.key) query.key = JSON.stringify(query.key)
      if (query.startkey) query.startkey = JSON.stringify(query.startkey)
      if (query.endkey) query.endkey = JSON.stringify(query.endkey)
      if (_.keys(query).length) to += "?" + qs.stringify(query)
      var opts = {url: to}
      if (rewrite.json) opts.json = rewrite.json
      createProxy(req, resp, opts)
    })
  }
  
  function proxyCouch(rewrite) {
    proxyRequest(_.extend({}, rewrite, {
      to: opts.ddoc + rewrite.to,
      json: true
    }))
  }
  
  function flattenRewrites(rewrites) {
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
  
  _.each(flattenRewrites(rewrites), function(rewrite) {
    var to = rewrite.to
      , protocol = url.parse(to).protocol
    if (_.first(to) === "/") to = _.rest(to).join('')
    if (_.first(to) === '_') return proxyCouch(rewrite)
    if (protocol && protocol.match(/https?/i)) return proxyRequest(rewrite)
    else return proxyFile(rewrite)
  })

  t.route('/*').files(opts.attachments)
}

