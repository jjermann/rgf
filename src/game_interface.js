/*  GameInterface
    --------------
    Defines a control interface for the game stream with access to the media stream
*/
function GameInterface(config,gameStream,mediaStream) {
    var self=this;
    
    self.gameStream=gameStream;
    self.mediaStream=mediaStream;

    self.config = {
        ignoreList:     config.ignoreList ? config.ignoreList : [";","BL","WL","OB","OW"],
        stepBackId:     config.stepBackId,
        stepForwardId:  config.stepForwardId
    }

    // Initialize the GameInterface (the HTML has to be present already, organized by the GUI)
    self.init(self.config);
}

GameInterface.prototype.init=function(config) {
    var self=this;
    var ignoreList=config.ignoreList;

    $('#'+config.stepForwardId).click(function() {
        var oldTime=self.gameStream.status.time;
        if (oldTime<0) oldTime=0;
        self.gameStream.step(1,false,ignoreList,false);
        var newTime=self.gameStream.status.time;
        if (newTime<0) newTime=0;
        
        if (oldTime!=newTime) {
            var oldControl=self.gameStream.status.inControl;
            self.gameStream.status.inControl=true;
            self.gameStream.status.storedTime=undefined;
            self.mediaStream.seekTime(newTime);
            self.gameStream.status.inControl=oldControl;
        }
    });
    $('#'+config.stepBackId).click(function() {
        var oldTime=self.gameStream.status.time;
        if (oldTime<0) oldTime=0;
        self.gameStream.step(-1,false,ignoreList,false);
        var newTime=self.gameStream.status.time;
        if (newTime<0) newTime=0;

        if (oldTime!=newTime) {
            var oldControl=self.gameStream.status.inControl;
            self.gameStream.status.inControl=true;
            self.gameStream.status.storedTime=undefined;
            self.mediaStream.seekTime(newTime);
            self.gameStream.status.inControl=oldControl;
        }
    });
};
