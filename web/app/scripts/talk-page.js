(function() {
  'use strict';

  var addTalkInfo = function(talk) {
    var template = [
      '<h3><a href="{{slug}}">{{title}}</a></h3>',
      '<div class="talk-info-body">',
        '<a href="{{slug}}"><img src="{{src}}"></a>',
        '<p>{{description}}</p>',
      '</div>'
      ].join('\n');
    var mkTalkSrc = function(slug) {
      return 'https://www.ted.com/talks/' + slug;
    };
    document.getElementById('talk-info')
      .innerHTML = template.replace(/{{slug}}/g, mkTalkSrc(talk.slug))
                           .replace('{{src}}', talk.image)
                           .replace('{{title}}', talk.name)
                           .replace('{{description}}', talk.description);

  };

  var addLanguage, setSelected;
  var selected = [];
  setSelected = function(e) {
    var li, languageCode, length, index;
    li= e.target;
    languageCode = li.dataset.code;
    length = selected.length;
    index = selected.indexOf(languageCode);
    if (length < 2) {
      li.classList.toggle('selected');
      if (index === -1) {
        selected.push(languageCode);
      } else {
        selected.splice(index, 1);
      }
    } else if (length === 2) {
      li.classList.remove('selected');
      if (index !== -1) { selected.splice(index, 1); }
    }
  };

  addLanguage = function(language) {
    var li = document.createElement('li');
    li.dataset.code = language.code;
    li.innerHTML = language.name;
    li.addEventListener('click', setSelected);
    document.querySelector('#languages ul').appendChild(li);
  };

  var downloadUrl = 'http://download.ted.com/talks/';
  var mkVideoUrl = function(slug, quality) {
    return downloadUrl + slug + '-' + quality + '.mp4';
  };
  var addVideoDownloads = function (mediaSlug) {
    var template = [
      '<ul><h4>Video</h4><li>',
        '<a href="{{720p}}" title="Right click to save (1280x720)" target="_blank">720p</a>',
      '</li><li>',
        '<a href="{{480p}}" title="Right click to save (854x480)" target="_blank">480p</a>',
      '</li><li>',
        '<a href="{{360p}}" title="Right click to save (640x360)" target="_blank">360p</a>',
      '</li><li>',
        '<a href="{{288p}}" title="Right click to save (512x288)" target="_blank">288p</a>',
      '</li></ul>'
      ].join('\n');
    var $video = document.getElementById('video');
    $video.innerHTML = template.replace('{{720p}}', mkVideoUrl(mediaSlug, '1500k'))
                               .replace('{{480p}}', mkVideoUrl(mediaSlug, '950k'))
                               .replace('{{360p}}', mkVideoUrl(mediaSlug, '600k'))
                               .replace('{{288p}}', mkVideoUrl(mediaSlug, '320k'));
  };

  var mkTranscriptUrl = function(tid, format, download) {
    var pathSlug = '/transcripts/';
    if (download) {
      pathSlug += 'download/';
    }
    var queryString = '';
    if (selected.length === 0) {
      queryString = 'lang=en';
    } else {
      queryString = selected.map(function(code) {
        return 'lang=' + code;
      }).join('&');
    }
    return '/api/talks/' + tid + pathSlug + format + '?' + queryString;
  };

  var addTranscriptsHandler = function(tid) {
    document.querySelector('#subtitles ul').addEventListener('click', function(e) {
      if (e.target.id) {
        window.location = mkTranscriptUrl(tid, e.target.id, true);
      }
    });
  };

  var bindEvents = function(talk) {
    document.getElementById('watch').addEventListener('click', function() {
      var template = [
        '<video controls autoplay>',
          '<source src="{{video_src}}" type="video/mp4">',
          '<track kind="captions" src="{{vtt_src}}" default>',
        '</video>',
        ].join('\n');
      var $playerContainer = document.getElementById('player-container');
      $playerContainer.style.display = 'flex';
      $playerContainer.innerHTML =
        template.replace('{{video_src}}', mkVideoUrl(talk.mSlug, '950k'))
                .replace('{{vtt_src}}', mkTranscriptUrl(talk.id, 'vtt', false));
    });

    document.getElementById('player-container').addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
        this.innerHTML = '';
      }
    });
  };

  var app = window.app || (window.app = {});
  app.talkPageHandler = function(slug) {
    var request = new XMLHttpRequest();
    var url = '/api/talks/' + slug;

    request.open('GET', url, true);
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        var data = JSON.parse(request.responseText);
        document.title = data.talk.name + ' - TED2srt';
        addTalkInfo(data.talk);
        data.languages.forEach(addLanguage);
        addVideoDownloads(data.talk.mSlug);
        addTranscriptsHandler(data.talk.id);
        bindEvents(data.talk);
      }
    };
    request.send();
  };
})();
