function extend(from,to) {
    for (var prop in to) {
        from[prop] = to[prop];
    };
    return from;
};

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
