var logging = require('logref')
logging.stdout()
process.logging = logging

var tako = require('tako')
  , http = require('http')
  , path = require('path')
  , Rewriter = require('../')
  , rewrites = [ 
      { from:"/", to:'pages/index.html', before: function(req, res, cb) { console.log(req.connection.remoteAddress); cb() }}
    , { from:"/edit", to:"pages/recline.html"}
    , { from:"/edit/*", to:"pages/recline.html"}
    , { from:"/api/applications/:dataset", to:"/_view/applications", query:{endkey:":dataset", startkey:":dataset", include_docs:"true", descending: "true"}}
    , { from:"/api/applications", to:"/_view/applications", query:{include_docs:"true", descending: "true"}}
    , { from:"/api/applications/user/:user", to:"/_view/applications_by_user", query:{endkey:":user", startkey:":user", include_docs:"true", descending: "true"}}
    , { from:"/api/datasets/:user", to:"/_view/by_user", query:{endkey: [":user",null], startkey:[":user",{}], include_docs:"true", descending: "true"}}
    , { from:"/api/datasets", to:"/_view/by_date", query:{include_docs:"true", descending: "true"}}
    , { from:"/api/forks/:id", to:"/_view/forks", query:{endkey:":id", startkey:":id", include_docs:"true", descending: "true"}}
    , { from:"/api/forks", to:"/_view/forks", query:{include_docs:"true", descending: "true"}}
    , { from:"/api/profile/all", to:"/datacouch-users/_design/users/_list/all/users"}
    , { from:"/api/trending", to:"/_view/popular", query:{include_docs: "true", descending: "true", limit: "10"}}
    , { from:"/api/templates", to:"/_view/templates", query:{include_docs: "true"}}
    , { from:"/api/users/search/:user", to:"/../../../datacouch-users/_design/users/_view/users", query:{startkey:":user", endkey:":user", include_docs: "true"}}
    , { from:"/api/users", to:'/../../../datacouch-users/'}
    , { from:"/api/users/*", to:'/../../../datacouch-users/*'}
    , { from:"/api/couch", to:"/../../../"}
    , { from:"/api/couch/*", to:"/../../../*"}
    , { from:"/api/epsg/:code", to:"/../../../epsg/:code"}
    , { from:"/api", to:"/../../../datacouch"}
    , { from:"/api/*", to:"/../../../datacouch/*"}
    , { from:"/analytics.gif", to:"/_analytics/spacer.gif"}
    , { before: function(req, res, cb) { console.log(req.connection.remoteAddress); cb() }
      , rewrites: [
          {from:"/db/:id/csv", to:'/../../../:id/_design/recline/_list/csv/all'}
        , {from:"/db/:id/json", to:'/../../../:id/_design/recline/_list/bulkDocs/all'}
        , {from:"/db/:id/headers", to:'/../../../:id/_design/recline/_list/array/headers', query: {group: "true"}}
        , {from:"/db/:id/rows", to:'/../../../:id/_design/recline/_view/all'}
        , {from:"/db/:id", to:"/../../../:id/"}
        , {from:"/db/:id/*", to:"/../../../:id/*"}
      ]
    }
    , {from:"/:user", to:"pages/index.html"}
    , {from:"/*", to:'*'}
    ]
  ;

  var t = tako()
  new Rewriter(t, rewrites, {verbose: true, root: "http://localhost:5984/datacouch/_design/datacouch", attachments: path.resolve(__dirname, 'attachments')})
  t.httpServer.listen(9999)
  console.log('listening on 9999')