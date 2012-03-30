/*  RecorderBarInterface
    --------------------
    Provides a recorder interface for the game stream
*/
function RecorderBarInterface(config,gameStream) {
    var self=this;
    
    self.onActionQueued = self.insertAction.bind(self);
    self.onUpdate = self.update.bind(self);

    self.gameStream=gameStream;

    self.config={
        interfaceId: config.interfaceId,
        timeInterval: config.timeInterval ? config.timeInterval : 120,
        _width: parseInt($('#'+config.interfaceId).width(),10),
        _height: parseInt($('#'+config.interfaceId).height(),10)
    };
    self.config._barWidth=self.config._width;
    self.config._barHeight=Math.round(self.config._height*0.4);
    self.config._barHalfHeight=Math.round(self.config._barHeight/2);

    self.status={ };
        
    // add the necessary html and initialize the RecorderBar
    document.getElementById(self.config.interfaceId).appendChild(self.html(self.config));
    self.init();
}

RecorderBarInterface.prototype.html = function(config) {
    var self=this;

    var barInterface=document.createElement("div");
    self._barInterface=barInterface;
    barInterface.className="recorder_bar_interface";
    barInterface.style.overflow="hidden";
    barInterface.style.position="absolute";
    barInterface.style.top=0+"px";
    barInterface.style.left=0+"px";
    barInterface.style.width=config._width+"px";
    barInterface.style.height=config._height+"px";

      var bar=document.createElement("div");
      self._bar=bar;
      bar.className="recorder_bar";
      bar.style.position="absolute";
      bar.style.top=Math.round((self.config._height-self.config._barHeight)/2)+"px";
      bar.style.height=self.config._barHeight+"px";
      // TODO: add a duration bar on top
      bar.style.width="1000000px";
      bar.style.left="0px";
      barInterface.appendChild(bar);

      var baseMarker=document.createElement("div");
      self._baseMarker=baseMarker;
      baseMarker.id=self.config.interfaceId+"_basemarker";
      baseMarker.style.position="absolute";
      baseMarker.style.top="0px";
      baseMarker.style.left="0px";
        var el=document.createElement("div");
        el.style.position="absolute";
        el.style.zIndex=10000;
        el.className="basemarker";
        baseMarker.appendChild(el);
      barInterface.appendChild(baseMarker);

    return self._barInterface;
};

RecorderBarInterface.prototype.actionHtml = function(index) {
    var self=this;
    
    var action=self.gameStream._rgfGame.actionList[index];
    
    if (action.time>=0) {
        var pos=self._getPos(action.time);
    } else {
        var pos=self._getPos(0);
    }
    var container=document.createElement("div");
    container.id=self.config.interfaceId+"_aid_"+index;
    container.className="action_container";
    container.style.position="absolute";
    container.style.left=pos+"px";
    container.style.top=self.config._barHalfHeight+"px";

      var el=document.createElement("div");
      el.style.position="absolute";
      el.className="action";
      el.className+=" name_"+action.name;
      if (typeof action.arg == 'string' && action.arg!="" && action.arg.length < 10) el.className+=" arg_"+action.arg;
      else el.className+=" noarg";
      if (action.position) el.className+=" pos";
      else el.className+=" nopos";
      if (action.time<0) el.className+=" initial";
      else el.className+=" regular";
      el.style.zIndex=index+1;

        var el2=document.createElement("div");
        el2.className="top";
        el2.style.top="0px";
        el2.style.zIndex=index+1;
        el.appendChild(el2);

        var el2=document.createElement("div");
        el2.className="center";
        el2.style.zIndex=index+1;
        el.appendChild(el2);

        var el2=document.createElement("div");
        el2.className="bottom";
        el2.style.bottom="0px";
        el2.style.zIndex=index+1;
        el.appendChild(el2);

      container.appendChild(el);

    return container;
};


RecorderBarInterface.prototype.init = function() {
    var self=this;

    self.gameStream._rgfGame.bind('actionQueued', self.onActionQueued);
    self.gameStream.bind('update', self.onUpdate);

    self.setDuration(self.gameStream._rgfGame.duration.time);
    self.setBasePos(0.5);
};


RecorderBarInterface.prototype._getPos = function(time) {
    return Math.round(time*this.config._barWidth/this.config.timeInterval);
};
RecorderBarInterface.prototype.update = function() {
    var gsIndex=this.gameStream.status.timeIndex-1,
        gsTime=this.gameStream.status.time,
        gsCounter=this.gameStream.status.timeCounter;
    gsIndex=(gsIndex < 0) ? 0 : gsIndex;

    this.setCurrentAction(gsIndex);
    this.setCurrentTime(gsTime,gsCounter);
};
RecorderBarInterface.prototype.setDuration = function(duration) {
    this._bar.style.width=this._getPos(duration)+"px";
    this.status.gsDuration=duration;
};
RecorderBarInterface.prototype.setBasePos = function(p) {
    this.config._barBasePos=Math.round(this.config._barWidth*p);
    this._baseMarker.style.left=this.config._barBasePos+"px";
    this.update();
};
RecorderBarInterface.prototype.setCurrentAction = function(index) {
    if (index==this.status.gsIndex) return;
    if (index!=undefined) $('#'+this.config.interfaceId+"_aid_"+index+" .action").addClass("currentAction");
    $('#'+this.config.interfaceId+"_aid_"+this.status.gsIndex+" .action").removeClass("currentAction");

    this.status.gsIndex=index;
};
RecorderBarInterface.prototype.setCurrentTime = function(time,counter) {
    this._bar.style.left=(this.config._barBasePos-this._getPos(time))+"px";
    this.status.gsTime=time;
    this.status.gsCounter=counter;
};
RecorderBarInterface.prototype.insertAction = function(index) {
    var gsDuration=this.gameStream._rgfGame.duration.time;

    this.setDuration(gsDuration);
    this._bar.appendChild(this.actionHtml(index));
}
