function createBox(boxName,bodyId,title) {
    var el=document.createElement("div");
    el.className=boxName;
        var tmp=document.createElement("div");
        tmp.innerHTML=title;
        tmp.className="box_title";
        el.appendChild(tmp);

        tmp=document.createElement("div");
        tmp.id=bodyId;
        tmp.className="box_body";
        el.appendChild(tmp);
    return el;
};

function printAction(action) {
    var txt=action.name
        + ((action.arg!==undefined && action.arg!="") ?
            "[" + action.arg + "]" :
            "")
        + ((action.time!==undefined) ?
            "TS[" + action.time + ((action.counter!==undefined) ?
                ":" + action.counter :
                 "")
            + "]" :
            "")
        + ((action.position!==undefined) ?
            " (pos: " + action.position + ")" :
            "")
        + " ";
    return txt;
};


// Container for examples and display gui...
function ExampleCollection(menuId) {
    this.exampleList=new Object();
    this.displayGuiList=new Object();
    this.id=menuId;
    this.menu=document.getElementById(this.id);
    this.currentGui;
};

ExampleCollection.prototype.insertExample = function(example) {
    var self=this;
    this.exampleList[example.id]=example;
    var el=document.createElement("p");
    el.id=this.id+"_"+example.id;
    el.className="unselected";
    el.style.cursor="pointer";
    el.style.border="1px solid grey";
    el.style.padding="2px";
    el.innerHTML=this.exampleList[example.id].description;
    this.menu.appendChild(el);
    $("p#"+this.id+"_"+example.id).click(function() {
        self.loadExample(example.id);
    });
};

ExampleCollection.prototype.loadExample = function(id) {
    if (!this.exampleList[id]) return false;
    if (this.currentGui) {
        this.displayGuiList[this.currentGui].mediaStream.player.pause();
        this.displayGuiList[this.currentGui].hide();
        $("p#"+this.id+"_"+this.currentGui).attr("class","unselected");
    }
    this.currentGui=id;
    $("p#"+this.id+"_"+this.currentGui).attr("class","selected");

    if (this.displayGuiList[this.currentGui]) {
        this.displayGuiList[this.currentGui].show();
    } else {
        // MAIN LOADING PROCEDURE
        var parser=new RGFParser;
        if (this.exampleList[id].rgf) {
            parser.loadRGF(this.exampleList[id].rgf);
        } else if (this.exampleList[id].sgf) {
            parser.importLinearSGF(this.exampleList[id].sgf,this.exampleList[id].timeMode);
        }
        if (this.exampleList[id].duration==undefined) {
            this.exampleList[id].duration=parser.maxDuration;
            if (!parser.ended) this.exampleList[id].duration=this.exampleList[id].duration+1;
        }
        this.displayGuiList[id]=new DisplayGUI(
            id,
            this.exampleList[id].ms,
            this.exampleList[id].duration
        );
        
        if (parser.actionList && !this.displayGuiList[id].gameStream.applyTimedActionList(parser.actionList)) {
            alert("Invalid action list!");
        }
    }
    return true;
};
