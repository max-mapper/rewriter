var app = {
	baseURL: util.getBaseURL(document.location.pathname),
	container: 'body'
};

app.handler = function(route) {
  if (route.params && route.params.route) {
    var path = route.params.route;
    app.routes[path](route.params.id);
  } else {
    app.routes['home']();
  }  
};

app.routes = {
  home: function() {
    relaxedtv.showVideos({showFirst: true});
  },
  video: function(id) {
    relaxedtv.showVideos();
    relaxedtv.showVideo(id);
  },
  upload: function() {
    util.show('dialog');
    util.render('upload', 'dialog-content');
  }
}

app.after = {
  upload: function() {
    var form = $('#upload-form');
    form.submit(function(e) {
      e.preventDefault();
      
      var data = form.serializeObject();
      
      _.map(_.keys(data), function(key) {
        if (data[key] === "") delete data[key];
      })
      
      $.extend(data, {"verified": false, "created_at": new Date()});
      
      util.hide('dialog');
      
      if (data.url) {
        couch.request({url: app.baseURL + "api", type: "POST", data: JSON.stringify(data)}).then(function(response) {
          util.resetForm(form);
          window.scrollTo(0, 0);
          alert('Thanks! Your video was successfully submitted. It will be added after it gets spam-checked');
        }); 
      }
      
      window.location = "#";
      return false;
    })
  }
}

app.sammy = $.sammy(function () {
  this.get('', app.handler);
  this.get("#/", app.handler);
  this.get("#:route", app.handler);
  this.get("#:route/:id", app.handler);
});

$(function() {
  app.sammy.run();  
})