/*  Interface
    ---------
    Defines the standard audio/video/control gui
*/
function Interface(interface_id) {
    this.interface_id=interface_id;
    this.stream;
    this.interface_element=this._initInterfaceElement(this.interface_id);
}

Interface.prototype._initInterfaceElement=function(id) {
    var el, container, singletype, gui, lvl1, lvl2, lvl3;
    /* jp-controls */
    el=document.createElement("div");
    el.id=id;
      container=document.createElement("div");
      container.className="jp-audio";
        singletype=document.createElement("div");
        singletype.className="jp-type-single";
          gui=document.createElement("div");
          gui.className="jp-gui jp-interface";
            lvl1=document.createElement("ul");
            lvl1.className="jp-controls";
              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-play">play';
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-pause">pause</a>';
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-stop">stop</a>';
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-mute" title="mute">mute</a>';
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-unmute" title="unmute">unmute</a>';
              lvl1.appendChild(lvl2);
/*
              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-volume-max" title="max volume">max volume</a>';
              lvl1.appendChild(lvl2);
*/
          gui.appendChild(lvl1);
            lvl1=document.createElement("div");
            lvl1.className="jp-progress";
              lvl2=document.createElement("div");
              lvl2.className="jp-seek-bar";
                lvl3=document.createElement("div");
                lvl3.className="jp-play-bar";
                lvl2.appendChild(lvl3);
              lvl1.appendChild(lvl2);
            gui.appendChild(lvl1);

            lvl1=document.createElement("div");
            lvl1.className="jp-volume-bar";
              lvl2=document.createElement("div");
              lvl2.className="jp-volume-bar-value";
              lvl1.appendChild(lvl2);
            gui.appendChild(lvl1);

            lvl1=document.createElement("div");
            lvl1.className="jp-time-holder";
              lvl2=document.createElement("div");
              lvl2.className="jp-current-time";
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("div");
              lvl2.className="jp-duration";
              lvl1.appendChild(lvl2);
            gui.appendChild(lvl1);
          singletype.appendChild(gui);
        container.appendChild(singletype);
      el.appendChild(container);

    return el;
};

Interface.prototype.initInterface=function(stream) {
    this.stream=stream;
    this.stream.addInterface(this.updatedStatus.bind(this),this.updatedTime.bind(this));
    var self_stream=this.stream;
    // initial setup
    this.updatedStatus();
    this.updatedTime();

    /* set eventHandlers */
    $('div#'+this.interface_id+' .jp-play').click(function() {
        self_stream.player.play();
    });
    $('div#'+this.interface_id+' .jp-pause').click(function() {
        self_stream.player.pause();
    });
    $('div#'+this.interface_id+' .jp-stop').click(function() {
        self_stream.player.pause();
        if (self_stream.status.ready) {
            self_stream.player.currentTime(0);
        }
        self_stream.player.trigger("stop");
    });
    $('div#'+this.interface_id+' .jp-mute').click(function() {
        self_stream.player.mute();
    });
    $('div#'+this.interface_id+' .jp-unmute').click(function() {
        self_stream.player.unmute();
    });

    //TODO    $('div#'+this.interface_id+' .jp-volume-max').click(function() { /* TODO */ });
    $('div#'+this.interface_id+' .jp-progress').click(function(e) { /* TODO */ });
    $('div#'+this.interface_id+' .jp-seek-bar').click(function(e) { /* TODO */ });
    $('div#'+this.interface_id+' .jp-play-bar').click(function(e) { /* TODO */ });
    $('div#'+this.interface_id+' .jp-volume-bar').click(function(e) { /* TODO */ });
    $('div#'+this.interface_id+' .jp-volume-bar-value').click(function(e) { /* TODO */ });
};

// Called whenever the time or duration changes
Interface.prototype.updatedTime = function() {
    $('div#'+this.interface_id+' .jp-current-time').text(this.stream.convertTime(this.stream.status.currentTime));
    $('div#'+this.interface_id+' .jp-duration').text(this.stream.convertTime(this.stream.status.duration));
};

// Called whenever any stream.status entry changes that is not related to time/duration
Interface.prototype.updatedStatus = function() {
    if (this.stream.status.paused) {
        $('div#'+this.interface_id+' .jp-pause').hide();
        $('div#'+this.interface_id+' .jp-play').show();
    } else {
        $('div#'+this.interface_id+' .jp-pause').show();
        $('div#'+this.interface_id+' .jp-play').hide();
    }

    if (this.stream.status.muted) {
        $('div#'+this.interface_id+' .jp-mute').hide();
        $('div#'+this.interface_id+' .jp-unmute').show();
    } else {
        $('div#'+this.interface_id+' .jp-mute').show();
        $('div#'+this.interface_id+' .jp-unmute').hide();
    }
};
