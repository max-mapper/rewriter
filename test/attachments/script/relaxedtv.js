var relaxedtv = function() {

  function showVideos(options) {
    if (!options) options = {};
    couch.request({url: app.baseURL + "api/videos"}).then(function(response) {
      app.videos = _.map(response.rows, function(row) { return row.value })
      util.render('videoList', 'video_list', {videos:app.videos});
      if(options.showFirst) relaxedtv.showVideo(app.videos[0]._id);
    })
  }
  
  function showVideo(id) {
    couch.request({url: app.baseURL + "api/" + id}).then(function(doc) {
      if (doc.url.match(/youtube/)) util.render('youtube', 'video', $.extend(doc, {videoid: youtubeID(doc.url)}));
      if (doc.url.match(/vimeo/)) util.render('vimeo', 'video', $.extend(doc, {videoid: vimeoID(doc.url)}));
    })
  }
  
  function vimeoID(url) {
    var re;
    var match;

    re = new RegExp('[0-9]{8}');
    match = re.exec(url);

    if(match != null) {
      return match[0];
    }
    else {
      return -1;
    }
  }
  
  function youtubeID(url) {
    return url.replace(/^[^v]+v.(.{11}).*/,"$1");
  }
  
  return {
    showVideos: showVideos,
    showVideo: showVideo,
    youtubeID: youtubeID, 
    vimeoID: vimeoID
  };
}();