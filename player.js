var Player = function(params) {
   var container = document.getElementById(params.id);
   if (container == undefined) {
      console.error('Failed to init player');
      return;
   }

   var engine = 'flash,html';
   try {
      if (browser.getFlashVersion() < 10)
         engine = 'html,flash';
   } catch(e) {
   }

   this._player = $(container).jPlayer({
      wmode: 'window',
      preload: 'none',
      swfPath: '/deep/',
      supplied: 'mp3',
      volume: 1,
      solution: engine
   });

   if (typeof (params.onplay) === 'function') {
      this._player.bind($.jPlayer.event.play, params.onplay);
   }

   if (typeof (params.onended) === 'function') {
      this._player.bind($.jPlayer.event.ended, params.onended);
   }

   if (typeof (params.ontime) === 'function') {
      this._player.bind($.jPlayer.event.timeupdate, function(e) {
         params.ontime(e.jPlayer.status.currentPercentAbsolute);
      });
   }
};

Player.prototype.play = function(mp3Url) {
   if (this._player == undefined) {
      console.error('Player in not initialized');
      return;
   }

   this._player.jPlayer('setMedia', {
      mp3: mp3Url
   }).jPlayer('play');
};
