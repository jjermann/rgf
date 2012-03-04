function pathToArray(path) {
    if (path=="" || path==undefined) return [];
    else if (typeof path=='string') return path.split('.');
    else return path;
}

function extend(from,to) {
    for (var prop in to) {
        from[prop] = to[prop];
    };
    return from;
};

function deepclone(o) {
    return (o && typeof(o) === 'object' ?
    function(t) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                t[p] = deepclone(o[p])
            }
        }
        return t
    }({}) : o)
}

// only for testing
function createBox(id,title,style) {
    var el,tmp;
    var title_height=20;
    var title_margin=0;
    var title_padding=4;
    var main_margin=0;
    var main_padding=4;
    el=document.createElement("div");
        el.id=id+"_all";
        el.style.overflow="hidden";
        extend(el.style,style);
    
        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.top=0+"px";
        tmp.style.height=title_height+"px";
        tmp.style.left=0+"px";
        tmp.style.right=0+"px";
        tmp.style.border="solid grey 1px";
        tmp.style.overflow="hidden";
        tmp.style.fontWeight="bold";
        tmp.style.fontSize="100%";
        tmp.style.margin=title_margin+"px";
        tmp.style.padding=title_padding+"px";
        tmp.innerHTML=title;
        tmp.id=id+"_title";
        el.appendChild(tmp);

        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.top=(title_height+15)+"px";
        tmp.style.bottom=0+"px";
        tmp.style.left=0+"px";
        tmp.style.right=0+"px";
        tmp.style.border="solid black 1px";
        tmp.style.margin=main_margin+"px";
        tmp.style.padding=main_padding+"px";
        tmp.style.whiteSpace="pre";
        tmp.style.overflow="auto";
        tmp.id=id;
        el.appendChild(tmp);
    return el;
};


// Container for examples and display gui...
function ExampleCollection() {
    this.example_list=new Object();
    this.display_gui_list=new Object();
    this.current_id;
    this.menu=this.html();
    document.body.appendChild(this.menu);
};

ExampleCollection.prototype.insertExample = function(example) {
    var self=this;
    this.example_list[example.id]=example;
    var el=document.createElement("p");
    el.id=this.menu.id+"_"+example.id;
    el.className="unselected";
    el.style.cursor="pointer";
    el.style.border="1px solid grey";
    el.style.padding="2px";
    el.innerHTML=this.example_list[example.id].description;
    this.menu.appendChild(el);
    $("p#"+this.menu.id+"_"+example.id).click(function() {
        self.loadExample(example.id);
    });
};

ExampleCollection.prototype.loadExample = function(id) {
    if (!this.example_list[id]) return false;
    if (this.current_id) {
        this.display_gui_list[this.current_id].media_stream.player.pause();
        this.display_gui_list[this.current_id].hide();
        $("p#"+this.menu.id+"_"+this.current_id).attr("class","unselected");
    }
    this.current_id=id;
    $("p#"+this.menu.id+"_"+this.current_id).attr("class","selected");

    if (this.display_gui_list[this.current_id]) {
        this.display_gui_list[this.current_id].show();
    } else {
        // MAIN LOADING PROCEDURE
        var parser=new RGFParser;
        if (this.example_list[id].rgf) {
            parser.loadRGF(this.example_list[id].rgf);
        } else if (this.example_list[id].sgf) {
            parser.importLinearSGF(this.example_list[id].sgf,this.example_list[id].time_mode);
        }
        if (this.example_list[id].duration==undefined) {
            this.example_list[id].duration=parser.max_duration;
            if (!parser.ended) this.example_list[id].duration=this.example_list[id].duration+10;
        }
        this.display_gui_list[id]=new DisplayGUI(
            id,
            this.example_list[id].ms,
            this.example_list[id].duration
        );
        if (!this.display_gui_list[id].game_stream.applyTimedActionList(parser.action_list)) {
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
