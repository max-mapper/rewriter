serve apps with node point javascript! uses the unreleased streaming web framework codenamed tako

all you need is a folder full of static assets and a little bit o' javascripts:

    var tako = require('tako')
      , http = require('http')
      , path = require('path')
      , rewriter = require('rewriter')
      , rewrites = [ 
          { from:"/", to:'index.html' }
        ]
      ;
   
    var t = tako()
    
    rewriter(t, rewrites, { attachments: path.resolve(__dirname, 'attachments') })
    
    t.listen(function(handler) {
      return http.createServer(handler)
    }, 9999)

rewriter was built to work easily with couchdb! you can do things like serve couchapps from node and proxy to couch:

    var couch = "http://localhost:5984"
      , rewrites = [ 
          {from:"/", to:'index.html'}
        , {from:"/api/couch", to: couch + "/"}
        , {from:"/api/couch/*", to: couch + "/*"}
        , {from:"/api", to: couch + "/appdatabase"}
        , {from:"/api/*", to: couch + "/appdatabase/*"}
        , {from:"/db/:id", to: couch + "/:id/"}
        , {from:"/db/:id/*", to: couch + "/:id/*"}
        ]
      ;
      
    rewriter(t, rewrites)
    
you can specify a middleware function that proxied request will be run through either singularly or using a group:

    var rewrites = [ 
          {from:"/awesome", to: couch + "/", before: function(req, res) { console.log(req.connection.remoteAddress) }}
        , {before: function(req, res) { if (req.headers.referrer !== "awesome.com") res.end('go away hotlinkers') }
          , rewrites: [
              {from:"/api/couch/*", to: couch + "/*"}
            , {from:"/api", to: couch + "/appdatabase"}
            , {from:"/api/*", to: couch + "/appdatabase/*"}
            , {from:"/db/:id", to: couch + "/:id/"}
            , {from:"/db/:id/*", to: couch + "/:id/*"}
            ]
          }
        ]
      ;

    rewriter(t, rewrites)

there is also a shorthand for querying the couch view server (start to: with _ and pass in the design document URL):

    var rewrites = [ 
        {from:"/api/applications/:dataset", to:"_view/applications", query:{endkey:":dataset", startkey:":dataset", include_docs:"true", descending: "true"}}
      , {from:"/api/applications", to:"_view/applications", query:{include_docs:"true", descending: "true"}}
      , {from:"/api/applications/user/:user", to:"_view/applications_by_user", query:{endkey:":user", startkey:":user", include_docs:"true", descending: "true"}}
      , {from:"/api/datasets/:user", to:"_view/by_user", query:{endkey: [":user",null], startkey:[":user",{}], include_docs:"true", descending: "true"}}
      , {from:"/api/datasets", to:"_view/by_date", query:{include_docs:"true", descending: "true"}}
    ]
    
    rewriter(t, rewrites, {ddoc: "http://localhost:5984/mydataset/_design/mydesigndocument"})

MIT License