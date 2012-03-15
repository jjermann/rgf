function createBox(id,title,style) {
    var el,tmp;
    var titleHeight=20;
    var titleMargin=0;
    var titlePadding=4;
    var mainMargin=0;
    var mainPadding=4;
    el=document.createElement("div");
        el.id=id+"_all";
        el.style.overflow="hidden";
        extend(el.style,style);
    
        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.top=0+"px";
        tmp.style.height=titleHeight+"px";
        tmp.style.left=0+"px";
        tmp.style.right=0+"px";
        tmp.style.border="solid grey 1px";
        tmp.style.overflow="hidden";
        tmp.style.fontWeight="bold";
        tmp.style.fontSize="100%";
        tmp.style.margin=titleMargin+"px";
        tmp.style.padding=titlePadding+"px";
        tmp.innerHTML=title;
        tmp.id=id+"_title";
        el.appendChild(tmp);

        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.top=(titleHeight+15)+"px";
        tmp.style.bottom=0+"px";
        tmp.style.left=0+"px";
        tmp.style.right=0+"px";
        tmp.style.border="solid black 1px";
        tmp.style.margin=mainMargin+"px";
        tmp.style.padding=mainPadding+"px";
        tmp.style.whiteSpace="pre";
        tmp.style.overflow="auto";
        tmp.id=id;
        el.appendChild(tmp);
    return el;
};


// Container for examples and display gui...
function ExampleCollection() {
    this.exampleList=new Object();
    this.displayGuiList=new Object();
    this.currentId;
    this.menu=this.html();
    document.body.appendChild(this.menu);
};

ExampleCollection.prototype.insertExample = function(example) {
    var self=this;
    this.exampleList[example.id]=example;
    var el=document.createElement("p");
    el.id=this.menu.id+"_"+example.id;
    el.className="unselected";
    el.style.cursor="pointer";
    el.style.border="1px solid grey";
    el.style.padding="2px";
    el.innerHTML=this.exampleList[example.id].description;
    this.menu.appendChild(el);
    $("p#"+this.menu.id+"_"+example.id).click(function() {
        self.loadExample(example.id);
    });
};

ExampleCollection.prototype.loadExample = function(id) {
    if (!this.exampleList[id]) return false;
    if (this.currentId) {
        this.displayGuiList[this.currentId].mediaStream.player.pause();
        this.displayGuiList[this.currentId].hide();
        $("p#"+this.menu.id+"_"+this.currentId).attr("class","unselected");
    }
    this.currentId=id;
    $("p#"+this.menu.id+"_"+this.currentId).attr("class","selected");

    if (this.displayGuiList[this.currentId]) {
        this.displayGuiList[this.currentId].show();
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
        console.log(parser.actionList);
        if (parser.actionList && !this.displayGuiList[id].gameStream.applyTimedActionList(parser.actionList)) {
            alert("Invalid action list!");
        }
    }
    return true;
};

ExampleCollection.prototype.html = function() {
    this.menu=document.createElement("div");
    this.menu.id="main";
    this.menu.style.position="fixed";
    this.menu.style.width="20%";
    this.menu.style.height="50%";
    this.menu.style.top="0%";
    this.menu.style.right="0%";
    this.menu.style.zIndex=1;
    this.menu.style.overflow="hidden";
    this.menu.style.background="white";
    this.menu.style.border="4px solid black";
    this.menu.style.padding="8px";
    
    return this.menu;
}
