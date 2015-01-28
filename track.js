var asyncLoad = function(src, id) {
    if (!document.getElementById(id)) {
        var obj = document.createElement('script');
        obj.type = 'text/javascript';
        obj.id = id;
        obj.async = true;
        obj.src = src;

        var x = document.getElementsByTagName("script")[0];
        x.parentNode.insertBefore(obj, x);
    }
};

var timeFormat = function(value) {
    var time = parseInt(value);
    var mins = Math.floor(time / 60);
    var secs = Math.floor(time % 60);

    if (mins < 10)
        mins = '0' + mins;
    if (secs < 10)
        secs = '0' + secs;

    return mins + ':' + secs;
};

var getAudio = function(obj) {
   for (var i = 0; i < obj.attachments.length; ++i) {
      if (obj.attachments[i].type != 'audio') continue;
      return obj.attachments[i].audio;
   }

   return undefined;
};

var getPhoto = function(obj) {
   for (var i = 0; i < obj.attachments.length; ++i) {
      if (obj.attachments[i].type != 'photo') continue;
      return obj.attachments[i].photo;
   }

   return undefined;
};

var getRating = function(obj) {
   if (obj == undefined) 
      return -1;

   var rating = 0;
   if (obj.comments)
      rating += obj.comments.count*3;

   if (obj.reposts)
      rating += obj.reposts.count*2;

   if (obj.likes)
      rating += obj.likes.count;

   return rating;
};

var createTrack = function(obj) {
   if (obj == undefined || obj.attachments == undefined)
      return undefined;

   var audio = getAudio(obj),
       photo = getPhoto(obj);

   if (audio == undefined || photo == undefined)
      return undefined;

   return {
      id: obj.date + obj.id,
      title: audio.performer + ' - ' + audio.title,
      duration: timeFormat(audio.duration),
      audio: audio.url,
      photo: photo.src,
      rating: getRating(obj)
   };
};

var addTrack = function(trackObj) {
   var li = document.createElement('li'), 
       track = document.createElement('div'),
       trackImage = document.createElement('div'),
       trackHolder = document.createElement('div'),
       trackRating = document.createElement('span'),
       trackTitle = document.createElement('div'),
       trackDuration = document.createElement('div'),
       id = 'track' + trackObj.id;

   track.className = 'track';
   trackImage.className = 'track-image';
   trackHolder.className = 'track-holder';
   trackRating.className = 'rating';
   trackTitle.className = 'track-title';
   trackDuration.className = 'track-duration';

   trackImage.style.backgroundImage = 'url(' + trackObj.photo + ')';
   trackTitle.innerHTML = trackObj.title;
   trackDuration.innerText = trackObj.duration;
   trackRating.innerText = trackObj.rating;
   
   trackHolder.appendChild(trackTitle);
   trackHolder.appendChild(trackDuration);
   trackImage.appendChild(trackRating);
   track.appendChild(trackImage);
   track.appendChild(trackHolder);
   li.appendChild(track);
   li.id = id;
   li.setAttribute('onclick', 'return play("' + id + '", "' + trackObj.title + '", "' + trackObj.audio + '");');

   document.getElementById('tracks').appendChild(li);

   window._pl.push({
      id: id,
      audio: trackObj.audio,
      title: trackObj.title
   });
};

var clearAll = function() {
   var lis = document.getElementsByClassName('li-active');
   for (var i = 0; i < lis.length; ++i)
      lis[i].classList.remove('li-active');
};

var play = function(id, title, audio) {
   if (window._p == undefined || window._pl == undefined)
      return false;

   clearAll();
   setHeader('Playing ' + title);
   window._p.play(audio);
   window._id = id;

   document.getElementById(id).classList.add('li-active');
   return true;
};

var playNext = function() {
   if (window._pl == undefined || window._id == undefined)
      return false;

   if (window._pl[window._pl.length-1].id === window._id)
      return play(window._pl[0].id, window._pl[0].title, window._pl[0].audio);
   else {
      for (var i = 0; i < window._pl.length; ++i) {
         if (window._pl[i].id === window._id) {
            return play(window._pl[i+1].id, window._pl[i+1].title, window._pl[i+1].audio);
         }
      }
   }
};

var setHeader = function(text) {
   document.title = text;
   document.getElementById('header').innerHTML = text;
};

var getTracks = function() {
   var oids = [34220506, 55526638, 31134999, 23125104, 14114], 
       def, 
       defs = [], 
       tracks = [];

   for (var i = 0; i < oids.length; ++i) {
      def = (function(id) {
         var defObj = new $.Deferred();

         VK.Api.call('wall.get', {owner_id: -id, count: 50}, function(data) {
            for (var i = 1; i < data.response.length; ++i) {
               var obj = data.response[i];
               if (obj.is_pinned || 
                   obj.attachments == undefined || 
                   obj.attachments.length != 2) continue;

               var track = createTrack(obj);
               if (track == undefined) continue;
               tracks.push(track);
            }

            return defObj.resolve();
         });

         return defObj.promise();
      })(oids[i]);

      defs.push(def);
   }

   $.when.apply($, defs).done(function() {
      var avgRating = 0, i = 0, best = [];
      for (; i < tracks.length; ++i) {
         avgRating += tracks[i].rating;
      }

      avgRating = parseInt(avgRating/tracks.length);
      setHeader('Track list. AVG rating ' + avgRating);

      for (i = 0; i < tracks.length; ++i) {
         if (tracks[i].rating > avgRating)
            best.push(tracks[i]);
         else {
            delete tracks[i];
            tracks.splice(i, 1);
         }
      }

      $(best).sort(function(x, y) {
         return x.rating > y.rating ? -1 : 1;
      }).each(function (i, t) {
         addTrack(t);
      });
   });
};

window.onload = function() {
   var slider = document.getElementById('slider');

   window._pl = [];
   window._p = new Player({
      id: 'player',
      ontime: function(p) {
         slider.style.width = p + '%';
      },
      onended: function() {
         playNext();
      }
   });

   window.vkAsyncInit = function() {
      VK.init({ apiId: 4488055 });
      VK.Auth.getLoginStatus(function() {
         getTracks();
      });
   };

   asyncLoad('http://vk.com/js/api/openapi.js', 'vk-openapi');
};