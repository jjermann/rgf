function DisplayGUI(baseId,msSources,duration) {
    /*
       DisplayGUI:      ID
       MediaStream:     ID_media
       MediaInterface:  ID_media_interface
       GoSpeedPlayer:   ID_player
       GameStream:      ID_game
                        ID_game_rgf
       GameInterface:   ID_game_interface
    */
    var self = this;
    
    self.id=baseId;
    
    /* Configuration for GoSpeed */
    DIV_ID_BOARD = DIV_ID_TREE = DIV_ID_CAPTURED_W = DIV_ID_CAPTURED_B = DIV_ID_RESULT = DIV_ID_COMMENTS = DIV_ID_MOVE_NUMBER = self.id+"_player_";

    DIV_ID_BOARD += "rgf_board";
    DIV_ID_TREE += "tree";
    // if performance is an issue set DIV_ID_TREE to undefined
    // DIV_ID_TREE = undefined;
    DIV_ID_CAPTURED_W += "cap_w";
    DIV_ID_CAPTURED_B += "cap_b";
    DIV_ID_RESULT += "res";
    DIV_ID_COMMENTS += "comments";
    DIV_ID_MOVE_NUMBER += "move_no";

    var goSpeedConf = {
        size: 19,
        div_id_board: DIV_ID_BOARD,
        div_id_tree: DIV_ID_TREE,
        div_id_captured_w: DIV_ID_CAPTURED_W,
        div_id_captured_b: DIV_ID_CAPTURED_B,
        div_id_result: DIV_ID_RESULT,
        div_id_move_number: DIV_ID_MOVE_NUMBER,
        div_id_comments: DIV_ID_COMMENTS,
        server_path_gospeed_root: "./"
    };

    self.boardPlayer=new GoSpeedPlayer(self.id+"_player");
    self.gameStream=new GameStream(self.id+"_game");
    self.mediaStream=new MediaStream(self.id+"_media",msSources,duration);
    self.mediaInterface=new MediaInterface(self.id+"_media_interface");
    self.gameInterface=new GameInterface(self.id+"_game_interface");

    self.gameStream.attachStream(self.mediaStream);
    self.boardPlayer.attachStream(self.gameStream);
    self.boardPlayer.bind('insertActions', function (actions) {
        self.gameStream.applyActionList(actions);
    });
    
    self.onStatusChange = function(newstatus) {
        if (newstatus.failed) {
            // TODO: should load the fallback media stream...
            alert("Media stream loading failed!");
        }
    };
    
    // "attach" the mediaStream to the GUI
    self.mediaStream.bind('statusChange', self.onStatusChange);

    // initialize the main HTML element(s)
    self.html=document.createElement("div");
    self.html.id=self.id;    
    self.html.appendChild(self.mediaStream.html({
        position: "absolute",
        top:      "4px",
        left:     "4px",
        width:    "640px",
        //height:   "500px",
        border:   "solid black 1px"
    }));
    self.html.appendChild(self.boardPlayer.html({
        position: "absolute",
        /*
        overflow: "hidden";
        width:    "431px",
        height:   "431px",
        */
        left:     "650px",
        top:      "4px"
    }));
    self.html.appendChild(self.mediaInterface.html({
        position: "absolute",
        left:     "654px",
//        top:      "434px"
        top:      "800px"
//          left:     "1080px",
//          top:      "8px"
    }));
    self.html.appendChild(self.gameInterface.html({
        position: "absolute",
        left:     "770px",
//        top:      "434px"
        top:      "790px"
//          left:     "1080px",
//          top:      "8px"
    }));

    // Textbox to output the current RGF tree
    self.html.appendChild(createBox(self.id+"_game_rgf","Current RGF Tree",{
        position: "absolute",
        width:    "640px",
        height:   "500px",
        top:      "560px",
        left:     "4px"
    }));
    
    // insert the gui into the html body
    document.body.appendChild(self.html);

    // The game stream is set to the initial (starting) position,
    // the other components are initialized
    self.boardPlayer.init(goSpeedConf);
    self.gameStream.update(0);
    self.mediaInterface.init(self.mediaStream);
    self.mediaStream.init();
    self.gameInterface.init(self.gameStream, self.mediaStream);
};


DisplayGUI.prototype.hide = function() {
    $("div#"+this.id+" ").hide();
};

DisplayGUI.prototype.show = function() {
    $("div#"+this.id+" ").show();
};

    
