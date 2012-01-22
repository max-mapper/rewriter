var logging = require('logref')
logging.stdout()
process.logging = logging

var tako = require('tako')
  , http = require('http')
  , path = require('path')
  , rewriter = require('../')
  , rewrites = [ 
      {from:"/", to:'index.html'}
      , {from:"/edit", to:"pages/recline.html"}
      , {from:"/edit/*", to:"pages/recline.html"}
      , {from:"/proxy", to:"../../../_smalldata/"}
      , {from:"/proxy/*", to:"../../../_smalldata/*"}
      , {from:"/login", to:"../../../_smalldata/twitter/auth/twitter"}
      , {from:"/login/callback", to:"../../../_smalldata/twitter/auth/twitter/callback"}
      , {from:"/logout", to:"../../../_smalldata/twitter/logout"}
      , {from:"/api/token", to:"../../../_smalldata/twitter/auth/token"}
      , {from:"/api/upload/*", to:"../../../_smalldata/upload/*"}
      , {from:"/api/applications", to:"_view/test", query:{include_docs:"true", descending: "true"}}
      , {from:"/api/applications/user/:user", to:"_view/applications_by_user", query:{endkey:":user", startkey:":user", include_docs:"true", descending: "true"}}
      , {from:"/api/datasets/:user", to:"_view/by_user", query:{endkey: [":user",null], startkey:[":user",{}], include_docs:"true", descending: "true"}}
      , {from:"/api/trending", to:"_view/popular", query:{include_docs: "true", descending: "true", limit: "10"}}
      , {from:"/api/users/search/:user", to:"../../../datacouch-users/_design/users/_view/users", query:{startkey:":user", endkey:":user", include_docs: "true"}}
      , {from:"/api/epsg/:code", to:"../../../epsg/:code"}
      , {from:"/api", to:"index.html"}
      , {from:"/api/*", to:"index.html"}
      , {from:"/analytics.gif", to:"../../../_analytics/spacer.gif"}
      , {from:"/db/:id/json", to:'../../../:id/_design/recline/_list/bulkDocs/all'}
      , {from:"/db/:id/headers", to:'../../../:id/_design/recline/_list/array/headers', query: {group: "true"}}
      , {from:"/db/:id", to:"../../../:id/"}
      , {from:"/db/:id/*", to:"../../../:id/*"}
      , {from:"/:user", to:"pages/index.html"}
      , {from:"/*", to:'*'}
    ]
  ;

function createServer(cb) {
  var t = tako()
  rewriter(t, rewrites, {attachments: path.resolve(__dirname, 'attachments')})
  t.listen(function(handler) {
    return http.createServer(handler)
  }, 9999, cb)
}

createServer(function() {
  console.log('running')
})