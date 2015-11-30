"function"!==typeof Object.create&&(Object.create=function(f){function g(){}g.prototype=f;return new g});
(function(f,g,k){var l={init:function(a,b){this.$elem=f(b);this.options=f.extend({},f.fn.owlCarousel.options,this.$elem.data(),a);this.userOptions=a;this.loadContent()},loadContent:function(){function a(a){var d,e="";if("function"===typeof b.options.jsonSuccess)b.options.jsonSuccess.apply(this,[a]);else{for(d in a.owl)a.owl.hasOwnProperty(d)&&(e+=a.owl[d].item);b.$elem.html(e)}b.logIn()}var b=this,e;"function"===typeof b.options.beforeInit&&b.options.beforeInit.apply(this,[b.$elem]);"string"===typeof b.options.jsonPath?
(e=b.options.jsonPath,f.getJSON(e,a)):b.logIn()},logIn:function(){this.$elem.data("owl-originalStyles",this.$elem.attr("style"));this.$elem.data("owl-originalClasses",this.$elem.attr("class"));this.$elem.css({opacity:0});this.orignalItems=this.options.items;this.checkBrowser();this.wrapperWidth=0;this.checkVisible=null;this.setVars()},setVars:function(){if(0===this.$elem.children().length)return!1;this.baseClass();this.eventTypes();this.$userItems=this.$elem.children();this.itemsAmount=this.$userItems.length;
this.wrapItems();this.$owlItems=this.$elem.find(".owl-item");this.$owlWrapper=this.$elem.find(".owl-wrapper");this.playDirection="next";this.prevItem=0;this.prevArr=[0];this.currentItem=0;this.customEvents();this.onStartup()},onStartup:function(){this.updateItems();this.calculateAll();this.buildControls();this.updateControls();this.response();this.moveEvents();this.stopOnHover();this.owlStatus();!1!==this.options.transitionStyle&&this.transitionTypes(this.options.transitionStyle);!0===this.options.autoPlay&&
(this.options.autoPlay=5E3);this.play();this.$elem.find(".owl-wrapper").css("display","block");this.$elem.is(":visible")?this.$elem.css("opacity",1):this.watchVisibility();this.onstartup=!1;this.eachMoveUpdate();"function"===typeof this.options.afterInit&&this.options.afterInit.apply(this,[this.$elem])},eachMoveUpdate:function(){!0===this.options.lazyLoad&&this.lazyLoad();!0===this.options.autoHeight&&this.autoHeight();this.onVisibleItems();"function"===typeof this.options.afterAction&&this.options.afterAction.apply(this,
[this.$elem])},updateVars:function(){"function"===typeof this.options.beforeUpdate&&this.options.beforeUpdate.apply(this,[this.$elem]);this.watchVisibility();this.updateItems();this.calculateAll();this.updatePosition();this.updateControls();this.eachMoveUpdate();"function"===typeof this.options.afterUpdate&&this.options.afterUpdate.apply(this,[this.$elem])},reload:function(){var a=this;g.setTimeout(function(){a.updateVars()},0)},watchVisibility:function(){var a=this;if(!1===a.$elem.is(":visible"))a.$elem.css({opacity:0}),
g.clearInterval(a.autoPlayInterval),g.clearInterval(a.checkVisible);else return!1;a.checkVisible=g.setInterval(function(){a.$elem.is(":visible")&&(a.reload(),a.$elem.animate({opacity:1},200),g.clearInterval(a.checkVisible))},500)},wrapItems:function(){this.$userItems.wrapAll('<div class="owl-wrapper">').wrap('<div class="owl-item"></div>');this.$elem.find(".owl-wrapper").wrap('<div class="owl-wrapper-outer">');this.wrapperOuter=this.$elem.find(".owl-wrapper-outer");this.$elem.css("display","block")},
baseClass:function(){var a=this.$elem.hasClass(this.options.baseClass),b=this.$elem.hasClass(this.options.theme);a||this.$elem.addClass(this.options.baseClass);b||this.$elem.addClass(this.options.theme)},updateItems:function(){var a,b;if(!1===this.options.responsive)return!1;if(!0===this.options.singleItem)return this.options.items=this.orignalItems=1,this.options.itemsCustom=!1,this.options.itemsDesktop=!1,this.options.itemsDesktopSmall=!1,this.options.itemsTablet=!1,this.options.itemsTabletSmall=
!1,this.options.itemsMobile=!1;a=f(this.options.responsiveBaseWidth).width();a>(this.options.itemsDesktop[0]||this.orignalItems)&&(this.options.items=this.orignalItems);if(!1!==this.options.itemsCustom)for(this.options.itemsCustom.sort(function(a,b){return a[0]-b[0]}),b=0;b<this.options.itemsCustom.length;b+=1)this.options.itemsCustom[b][0]<=a&&(this.options.items=this.options.itemsCustom[b][1]);else a<=this.options.itemsDesktop[0]&&!1!==this.options.itemsDesktop&&(this.options.items=this.options.itemsDesktop[1]),
a<=this.options.itemsDesktopSmall[0]&&!1!==this.options.itemsDesktopSmall&&(this.options.items=this.options.itemsDesktopSmall[1]),a<=this.options.itemsTablet[0]&&!1!==this.options.itemsTablet&&(this.options.items=this.options.itemsTablet[1]),a<=this.options.itemsTabletSmall[0]&&!1!==this.options.itemsTabletSmall&&(this.options.items=this.options.itemsTabletSmall[1]),a<=this.options.itemsMobile[0]&&!1!==this.options.itemsMobile&&(this.options.items=this.options.itemsMobile[1]);this.options.items>this.itemsAmount&&
!0===this.options.itemsScaleUp&&(this.options.items=this.itemsAmount)},response:function(){var a=this,b,e;if(!0!==a.options.responsive)return!1;e=f(g).width();a.resizer=function(){f(g).width()!==e&&(!1!==a.options.autoPlay&&g.clearInterval(a.autoPlayInterval),g.clearTimeout(b),b=g.setTimeout(function(){e=f(g).width();a.updateVars()},a.options.responsiveRefreshRate))};f(g).resize(a.resizer)},updatePosition:function(){this.jumpTo(this.currentItem);!1!==this.options.autoPlay&&this.checkAp()},appendItemsSizes:function(){var a=
this,b=0,e=a.itemsAmount-a.options.items;a.$owlItems.each(function(c){var d=f(this);d.css({width:a.itemWidth}).data("owl-item",Number(c));if(0===c%a.options.items||c===e)c>e||(b+=1);d.data("owl-roundPages",b)})},appendWrapperSizes:function(){this.$owlWrapper.css({width:this.$owlItems.length*this.itemWidth*2,left:0});this.appendItemsSizes()},calculateAll:function(){this.calculateWidth();this.appendWrapperSizes();this.loops();this.max()},calculateWidth:function(){this.itemWidth=Math.round(this.$elem.width()/
this.options.items)},max:function(){var a=-1*(this.itemsAmount*this.itemWidth-this.options.items*this.itemWidth);this.options.items>this.itemsAmount?this.maximumPixels=a=this.maximumItem=0:(this.maximumItem=this.itemsAmount-this.options.items,this.maximumPixels=a);return a},min:function(){return 0},loops:function(){var a=0,b=0,e,c;this.positionsInArray=[0];this.pagesInArray=[];for(e=0;e<this.itemsAmount;e+=1)b+=this.itemWidth,this.positionsInArray.push(-b),!0===this.options.scrollPerPage&&(c=f(this.$owlItems[e]),
c=c.data("owl-roundPages"),c!==a&&(this.pagesInArray[a]=this.positionsInArray[e],a=c))},buildControls:function(){if(!0===this.options.navigation||!0===this.options.pagination)this.owlControls=f('<div class="owl-controls"/>').toggleClass("clickable",!this.browser.isTouch).appendTo(this.$elem);!0===this.options.pagination&&this.buildPagination();!0===this.options.navigation&&this.buildButtons()},buildButtons:function(){var a=this,b=f('<div class="owl-buttons"/>');a.owlControls.append(b);a.buttonPrev=
f("<div/>",{"class":"owl-prev",html:a.options.navigationText[0]||""});a.buttonNext=f("<div/>",{"class":"owl-next",html:a.options.navigationText[1]||""});b.append(a.buttonPrev).append(a.buttonNext);b.on("touchstart.owlControls mousedown.owlControls",'div[class^="owl"]',function(a){a.preventDefault()});b.on("touchend.owlControls mouseup.owlControls",'div[class^="owl"]',function(b){b.preventDefault();f(this).hasClass("owl-next")?a.next():a.prev()})},buildPagination:function(){var a=this;a.paginationWrapper=
f('<div class="owl-pagination"/>');a.owlControls.append(a.paginationWrapper);a.paginationWrapper.on("touchend.owlControls mouseup.owlControls",".owl-page",function(b){b.preventDefault();Number(f(this).data("owl-page"))!==a.currentItem&&a.goTo(Number(f(this).data("owl-page")),!0)})},updatePagination:function(){var a,b,e,c,d,g;if(!1===this.options.pagination)return!1;this.paginationWrapper.html("");a=0;b=this.itemsAmount-this.itemsAmount%this.options.items;for(c=0;c<this.itemsAmount;c+=1)0===c%this.options.items&&
(a+=1,b===c&&(e=this.itemsAmount-this.options.items),d=f("<div/>",{"class":"owl-page"}),g=f("<span></span>",{text:!0===this.options.paginationNumbers?a:"","class":!0===this.options.paginationNumbers?"owl-numbers":""}),d.append(g),d.data("owl-page",b===c?e:c),d.data("owl-roundPages",a),this.paginationWrapper.append(d));this.checkPagination()},checkPagination:function(){var a=this;if(!1===a.options.pagination)return!1;a.paginationWrapper.find(".owl-page").each(function(){f(this).data("owl-roundPages")===
f(a.$owlItems[a.currentItem]).data("owl-roundPages")&&(a.paginationWrapper.find(".owl-page").removeClass("active"),f(this).addClass("active"))})},checkNavigation:function(){if(!1===this.options.navigation)return!1;!1===this.options.rewindNav&&(0===this.currentItem&&0===this.maximumItem?(this.buttonPrev.addClass("disabled"),this.buttonNext.addClass("disabled")):0===this.currentItem&&0!==this.maximumItem?(this.buttonPrev.addClass("disabled"),this.buttonNext.removeClass("disabled")):this.currentItem===
this.maximumItem?(this.buttonPrev.removeClass("disabled"),this.buttonNext.addClass("disabled")):0!==this.currentItem&&this.currentItem!==this.maximumItem&&(this.buttonPrev.removeClass("disabled"),this.buttonNext.removeClass("disabled")))},updateControls:function(){this.updatePagination();this.checkNavigation();this.owlControls&&(this.options.items>=this.itemsAmount?this.owlControls.hide():this.owlControls.show())},destroyControls:function(){this.owlControls&&this.owlControls.remove()},next:function(a){if(this.isTransition)return!1;
this.currentItem+=!0===this.options.scrollPerPage?this.options.items:1;if(this.currentItem>this.maximumItem+(!0===this.options.scrollPerPage?this.options.items-1:0))if(!0===this.options.rewindNav)this.currentItem=0,a="rewind";else return this.currentItem=this.maximumItem,!1;this.goTo(this.currentItem,a)},prev:function(a){if(this.isTransition)return!1;this.currentItem=!0===this.options.scrollPerPage&&0<this.currentItem&&this.currentItem<this.options.items?0:this.currentItem-(!0===this.options.scrollPerPage?
this.options.items:1);if(0>this.currentItem)if(!0===this.options.rewindNav)this.currentItem=this.maximumItem,a="rewind";else return this.currentItem=0,!1;this.goTo(this.currentItem,a)},goTo:function(a,b,e){var c=this;if(c.isTransition)return!1;"function"===typeof c.options.beforeMove&&c.options.beforeMove.apply(this,[c.$elem]);a>=c.maximumItem?a=c.maximumItem:0>=a&&(a=0);c.currentItem=c.owl.currentItem=a;if(!1!==c.options.transitionStyle&&"drag"!==e&&1===c.options.items&&!0===c.browser.support3d)return c.swapSpeed(0),
!0===c.browser.support3d?c.transition3d(c.positionsInArray[a]):c.css2slide(c.positionsInArray[a],1),c.afterGo(),c.singleItemTransition(),!1;a=c.positionsInArray[a];!0===c.browser.support3d?(c.isCss3Finish=!1,!0===b?(c.swapSpeed("paginationSpeed"),g.setTimeout(function(){c.isCss3Finish=!0},c.options.paginationSpeed)):"rewind"===b?(c.swapSpeed(c.options.rewindSpeed),g.setTimeout(function(){c.isCss3Finish=!0},c.options.rewindSpeed)):(c.swapSpeed("slideSpeed"),g.setTimeout(function(){c.isCss3Finish=!0},
c.options.slideSpeed)),c.transition3d(a)):!0===b?c.css2slide(a,c.options.paginationSpeed):"rewind"===b?c.css2slide(a,c.options.rewindSpeed):c.css2slide(a,c.options.slideSpeed);c.afterGo()},jumpTo:function(a){"function"===typeof this.options.beforeMove&&this.options.beforeMove.apply(this,[this.$elem]);a>=this.maximumItem||-1===a?a=this.maximumItem:0>=a&&(a=0);this.swapSpeed(0);!0===this.browser.support3d?this.transition3d(this.positionsInArray[a]):this.css2slide(this.positionsInArray[a],1);this.currentItem=
this.owl.currentItem=a;this.afterGo()},afterGo:function(){this.prevArr.push(this.currentItem);this.prevItem=this.owl.prevItem=this.prevArr[this.prevArr.length-2];this.prevArr.shift(0);this.prevItem!==this.currentItem&&(this.checkPagination(),this.checkNavigation(),this.eachMoveUpdate(),!1!==this.options.autoPlay&&this.checkAp());"function"===typeof this.options.afterMove&&this.prevItem!==this.currentItem&&this.options.afterMove.apply(this,[this.$elem])},stop:function(){this.apStatus="stop";g.clearInterval(this.autoPlayInterval)},
checkAp:function(){"stop"!==this.apStatus&&this.play()},play:function(){var a=this;a.apStatus="play";if(!1===a.options.autoPlay)return!1;g.clearInterval(a.autoPlayInterval);a.autoPlayInterval=g.setInterval(function(){a.next(!0)},a.options.autoPlay)},swapSpeed:function(a){"slideSpeed"===a?this.$owlWrapper.css(this.addCssSpeed(this.options.slideSpeed)):"paginationSpeed"===a?this.$owlWrapper.css(this.addCssSpeed(this.options.paginationSpeed)):"string"!==typeof a&&this.$owlWrapper.css(this.addCssSpeed(a))},
addCssSpeed:function(a){return{"-webkit-transition":"all "+a+"ms ease","-moz-transition":"all "+a+"ms ease","-o-transition":"all "+a+"ms ease",transition:"all "+a+"ms ease"}},removeTransition:function(){return{"-webkit-transition":"","-moz-transition":"","-o-transition":"",transition:""}},doTranslate:function(a){return{"-webkit-transform":"translate3d("+a+"px, 0px, 0px)","-moz-transform":"translate3d("+a+"px, 0px, 0px)","-o-transform":"translate3d("+a+"px, 0px, 0px)","-ms-transform":"translate3d("+
a+"px, 0px, 0px)",transform:"translate3d("+a+"px, 0px,0px)"}},transition3d:function(a){this.$owlWrapper.css(this.doTranslate(a))},css2move:function(a){this.$owlWrapper.css({left:a})},css2slide:function(a,b){var e=this;e.isCssFinish=!1;e.$owlWrapper.stop(!0,!0).animate({left:a},{duration:b||e.options.slideSpeed,complete:function(){e.isCssFinish=!0}})},checkBrowser:function(){var a=k.createElement("div");a.style.cssText="  -moz-transform:translate3d(0px, 0px, 0px); -ms-transform:translate3d(0px, 0px, 0px); -o-transform:translate3d(0px, 0px, 0px); -webkit-transform:translate3d(0px, 0px, 0px); transform:translate3d(0px, 0px, 0px)";
a=a.style.cssText.match(/translate3d\(0px, 0px, 0px\)/g);this.browser={support3d:null!==a&&1===a.length,isTouch:"ontouchstart"in g||g.navigator.msMaxTouchPoints}},moveEvents:function(){if(!1!==this.options.mouseDrag||!1!==this.options.touchDrag)this.gestures(),this.disabledEvents()},eventTypes:function(){var a=["s","e","x"];this.ev_types={};!0===this.options.mouseDrag&&!0===this.options.touchDrag?a=["touchstart.owl mousedown.owl","touchmove.owl mousemove.owl","touchend.owl touchcancel.owl mouseup.owl"]:
!1===this.options.mouseDrag&&!0===this.options.touchDrag?a=["touchstart.owl","touchmove.owl","touchend.owl touchcancel.owl"]:!0===this.options.mouseDrag&&!1===this.options.touchDrag&&(a=["mousedown.owl","mousemove.owl","mouseup.owl"]);this.ev_types.start=a[0];this.ev_types.move=a[1];this.ev_types.end=a[2]},disabledEvents:function(){this.$elem.on("dragstart.owl",function(a){a.preventDefault()});this.$elem.on("mousedown.disableTextSelect",function(a){return f(a.target).is("input, textarea, select, option")})},
gestures:function(){function a(a){if(void 0!==a.touches)return{x:a.touches[0].pageX,y:a.touches[0].pageY};if(void 0===a.touches){if(void 0!==a.pageX)return{x:a.pageX,y:a.pageY};if(void 0===a.pageX)return{x:a.clientX,y:a.clientY}}}function b(a){"on"===a?(f(k).on(d.ev_types.move,e),f(k).on(d.ev_types.end,c)):"off"===a&&(f(k).off(d.ev_types.move),f(k).off(d.ev_types.end))}function e(b){b=b.originalEvent||b||g.event;d.newPosX=a(b).x-h.offsetX;d.newPosY=a(b).y-h.offsetY;d.newRelativeX=d.newPosX-h.relativePos;
"function"===typeof d.options.startDragging&&!0!==h.dragging&&0!==d.newRelativeX&&(h.dragging=!0,d.options.startDragging.apply(d,[d.$elem]));(8<d.newRelativeX||-8>d.newRelativeX)&&!0===d.browser.isTouch&&(void 0!==b.preventDefault?b.preventDefault():b.returnValue=!1,h.sliding=!0);(10<d.newPosY||-10>d.newPosY)&&!1===h.sliding&&f(k).off("touchmove.owl");d.newPosX=Math.max(Math.min(d.newPosX,d.newRelativeX/5),d.maximumPixels+d.newRelativeX/5);!0===d.browser.support3d?d.transition3d(d.newPosX):d.css2move(d.newPosX)}
function c(a){a=a.originalEvent||a||g.event;var c;a.target=a.target||a.srcElement;h.dragging=!1;!0!==d.browser.isTouch&&d.$owlWrapper.removeClass("grabbing");d.dragDirection=0>d.newRelativeX?d.owl.dragDirection="left":d.owl.dragDirection="right";0!==d.newRelativeX&&(c=d.getNewPosition(),d.goTo(c,!1,"drag"),h.targetElement===a.target&&!0!==d.browser.isTouch&&(f(a.target).on("click.disable",function(a){a.stopImmediatePropagation();a.stopPropagation();a.preventDefault();f(a.target).off("click.disable")}),
a=f._data(a.target,"events").click,c=a.pop(),a.splice(0,0,c)));b("off")}var d=this,h={offsetX:0,offsetY:0,baseElWidth:0,relativePos:0,position:null,minSwipe:null,maxSwipe:null,sliding:null,dargging:null,targetElement:null};d.isCssFinish=!0;d.$elem.on(d.ev_types.start,".owl-wrapper",function(c){c=c.originalEvent||c||g.event;var e;if(3===c.which)return!1;if(!(d.itemsAmount<=d.options.items)){if(!1===d.isCssFinish&&!d.options.dragBeforeAnimFinish||!1===d.isCss3Finish&&!d.options.dragBeforeAnimFinish)return!1;
!1!==d.options.autoPlay&&g.clearInterval(d.autoPlayInterval);!0===d.browser.isTouch||d.$owlWrapper.hasClass("grabbing")||d.$owlWrapper.addClass("grabbing");d.newPosX=0;d.newRelativeX=0;f(this).css(d.removeTransition());e=f(this).position();h.relativePos=e.left;h.offsetX=a(c).x-e.left;h.offsetY=a(c).y-e.top;b("on");h.sliding=!1;h.targetElement=c.target||c.srcElement}})},getNewPosition:function(){var a=this.closestItem();a>this.maximumItem?a=this.currentItem=this.maximumItem:0<=this.newPosX&&(this.currentItem=
a=0);return a},closestItem:function(){var a=this,b=!0===a.options.scrollPerPage?a.pagesInArray:a.positionsInArray,e=a.newPosX,c=null;f.each(b,function(d,g){e-a.itemWidth/20>b[d+1]&&e-a.itemWidth/20<g&&"left"===a.moveDirection()?(c=g,a.currentItem=!0===a.options.scrollPerPage?f.inArray(c,a.positionsInArray):d):e+a.itemWidth/20<g&&e+a.itemWidth/20>(b[d+1]||b[d]-a.itemWidth)&&"right"===a.moveDirection()&&(!0===a.options.scrollPerPage?(c=b[d+1]||b[b.length-1],a.currentItem=f.inArray(c,a.positionsInArray)):
(c=b[d+1],a.currentItem=d+1))});return a.currentItem},moveDirection:function(){var a;0>this.newRelativeX?(a="right",this.playDirection="next"):(a="left",this.playDirection="prev");return a},customEvents:function(){var a=this;a.$elem.on("owl.next",function(){a.next()});a.$elem.on("owl.prev",function(){a.prev()});a.$elem.on("owl.play",function(b,e){a.options.autoPlay=e;a.play();a.hoverStatus="play"});a.$elem.on("owl.stop",function(){a.stop();a.hoverStatus="stop"});a.$elem.on("owl.goTo",function(b,e){a.goTo(e)});
a.$elem.on("owl.jumpTo",function(b,e){a.jumpTo(e)})},stopOnHover:function(){var a=this;!0===a.options.stopOnHover&&!0!==a.browser.isTouch&&!1!==a.options.autoPlay&&(a.$elem.on("mouseover",function(){a.stop()}),a.$elem.on("mouseout",function(){"stop"!==a.hoverStatus&&a.play()}))},lazyLoad:function(){var a,b,e,c,d;if(!1===this.options.lazyLoad)return!1;for(a=0;a<this.itemsAmount;a+=1)b=f(this.$owlItems[a]),"loaded"!==b.data("owl-loaded")&&(e=b.data("owl-item"),c=b.find(".lazyOwl"),"string"!==typeof c.data("src")?
b.data("owl-loaded","loaded"):(void 0===b.data("owl-loaded")&&(c.hide(),b.addClass("loading").data("owl-loaded","checked")),(d=!0===this.options.lazyFollow?e>=this.currentItem:!0)&&e<this.currentItem+this.options.items&&c.length&&this.lazyPreload(b,c)))},lazyPreload:function(a,b){function e(){a.data("owl-loaded","loaded").removeClass("loading");b.removeAttr("data-src");"fade"===d.options.lazyEffect?b.fadeIn(400):b.show();"function"===typeof d.options.afterLazyLoad&&d.options.afterLazyLoad.apply(this,
[d.$elem])}function c(){f+=1;d.completeImg(b.get(0))||!0===k?e():100>=f?g.setTimeout(c,100):e()}var d=this,f=0,k;"DIV"===b.prop("tagName")?(b.css("background-image","url("+b.data("src")+")"),k=!0):b[0].src=b.data("src");c()},autoHeight:function(){function a(){var a=f(e.$owlItems[e.currentItem]).height();e.wrapperOuter.css("height",a+"px");e.wrapperOuter.hasClass("autoHeight")||g.setTimeout(function(){e.wrapperOuter.addClass("autoHeight")},0)}function b(){d+=1;e.completeImg(c.get(0))?a():100>=d?g.setTimeout(b,
100):e.wrapperOuter.css("height","")}var e=this,c=f(e.$owlItems[e.currentItem]).find("img"),d;void 0!==c.get(0)?(d=0,b()):a()},completeImg:function(a){return!a.complete||"undefined"!==typeof a.naturalWidth&&0===a.naturalWidth?!1:!0},onVisibleItems:function(){var a;!0===this.options.addClassActive&&this.$owlItems.removeClass("active");this.visibleItems=[];for(a=this.currentItem;a<this.currentItem+this.options.items;a+=1)this.visibleItems.push(a),!0===this.options.addClassActive&&f(this.$owlItems[a]).addClass("active");
this.owl.visibleItems=this.visibleItems},transitionTypes:function(a){this.outClass="owl-"+a+"-out";this.inClass="owl-"+a+"-in"},singleItemTransition:function(){var a=this,b=a.outClass,e=a.inClass,c=a.$owlItems.eq(a.currentItem),d=a.$owlItems.eq(a.prevItem),f=Math.abs(a.positionsInArray[a.currentItem])+a.positionsInArray[a.prevItem],g=Math.abs(a.positionsInArray[a.currentItem])+a.itemWidth/2;a.isTransition=!0;a.$owlWrapper.addClass("owl-origin").css({"-webkit-transform-origin":g+"px","-moz-perspective-origin":g+
"px","perspective-origin":g+"px"});d.css({position:"relative",left:f+"px"}).addClass(b).on("webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend",function(){a.endPrev=!0;d.off("webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend");a.clearTransStyle(d,b)});c.addClass(e).on("webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend",function(){a.endCurrent=!0;c.off("webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend");a.clearTransStyle(c,e)})},clearTransStyle:function(a,
b){a.css({position:"",left:""}).removeClass(b);this.endPrev&&this.endCurrent&&(this.$owlWrapper.removeClass("owl-origin"),this.isTransition=this.endCurrent=this.endPrev=!1)},owlStatus:function(){this.owl={userOptions:this.userOptions,baseElement:this.$elem,userItems:this.$userItems,owlItems:this.$owlItems,currentItem:this.currentItem,prevItem:this.prevItem,visibleItems:this.visibleItems,isTouch:this.browser.isTouch,browser:this.browser,dragDirection:this.dragDirection}},clearEvents:function(){this.$elem.off(".owl owl mousedown.disableTextSelect");
f(k).off(".owl owl");f(g).off("resize",this.resizer)},unWrap:function(){0!==this.$elem.children().length&&(this.$owlWrapper.unwrap(),this.$userItems.unwrap().unwrap(),this.owlControls&&this.owlControls.remove());this.clearEvents();this.$elem.attr("style",this.$elem.data("owl-originalStyles")||"").attr("class",this.$elem.data("owl-originalClasses"))},destroy:function(){this.stop();g.clearInterval(this.checkVisible);this.unWrap();this.$elem.removeData()},reinit:function(a){a=f.extend({},this.userOptions,
a);this.unWrap();this.init(a,this.$elem)},addItem:function(a,b){var e;if(!a)return!1;if(0===this.$elem.children().length)return this.$elem.append(a),this.setVars(),!1;this.unWrap();e=void 0===b||-1===b?-1:b;e>=this.$userItems.length||-1===e?this.$userItems.eq(-1).after(a):this.$userItems.eq(e).before(a);this.setVars()},removeItem:function(a){if(0===this.$elem.children().length)return!1;a=void 0===a||-1===a?-1:a;this.unWrap();this.$userItems.eq(a).remove();this.setVars()}};f.fn.owlCarousel=function(a){return this.each(function(){if(!0===
f(this).data("owl-init"))return!1;f(this).data("owl-init",!0);var b=Object.create(l);b.init(a,this);f.data(this,"owlCarousel",b)})};f.fn.owlCarousel.options={items:5,itemsCustom:!1,itemsDesktop:[1199,4],itemsDesktopSmall:[979,3],itemsTablet:[768,2],itemsTabletSmall:!1,itemsMobile:[479,1],singleItem:!1,itemsScaleUp:!1,slideSpeed:200,paginationSpeed:800,rewindSpeed:1E3,autoPlay:!1,stopOnHover:!1,navigation:!1,navigationText:["prev","next"],rewindNav:!0,scrollPerPage:!1,pagination:!0,paginationNumbers:!1,
responsive:!0,responsiveRefreshRate:200,responsiveBaseWidth:g,baseClass:"owl-carousel",theme:"owl-theme",lazyLoad:!1,lazyFollow:!0,lazyEffect:"fade",autoHeight:!1,jsonPath:!1,jsonSuccess:!1,dragBeforeAnimFinish:!0,mouseDrag:!0,touchDrag:!0,addClassActive:!1,transitionStyle:!1,beforeUpdate:!1,afterUpdate:!1,beforeInit:!1,afterInit:!1,beforeMove:!1,afterMove:!1,afterAction:!1,startDragging:!1,afterLazyLoad:!1}})(jQuery,window,document);
/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright Â© 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright Â© 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */

/* 
 * Namespace changed by David Blanco to imagesLoadedMB
 */



/* ##################### OLD VERSION ##################### */
/*!
 * imagesLoaded PACKAGED v3.1.4
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */
/* 
(function(){function e(){}function t(e,t){for(var n=e.length;n--;)if(e[n].listener===t)return n;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var i=e.prototype,r=this,o=r.EventEmitter;i.getListeners=function(e){var t,n,i=this._getEvents();if("object"==typeof e){t={};for(n in i)i.hasOwnProperty(n)&&e.test(n)&&(t[n]=i[n])}else t=i[e]||(i[e]=[]);return t},i.flattenListeners=function(e){var t,n=[];for(t=0;e.length>t;t+=1)n.push(e[t].listener);return n},i.getListenersAsObject=function(e){var t,n=this.getListeners(e);return n instanceof Array&&(t={},t[e]=n),t||n},i.addListener=function(e,n){var i,r=this.getListenersAsObject(e),o="object"==typeof n;for(i in r)r.hasOwnProperty(i)&&-1===t(r[i],n)&&r[i].push(o?n:{listener:n,once:!1});return this},i.on=n("addListener"),i.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},i.once=n("addOnceListener"),i.defineEvent=function(e){return this.getListeners(e),this},i.defineEvents=function(e){for(var t=0;e.length>t;t+=1)this.defineEvent(e[t]);return this},i.removeListener=function(e,n){var i,r,o=this.getListenersAsObject(e);for(r in o)o.hasOwnProperty(r)&&(i=t(o[r],n),-1!==i&&o[r].splice(i,1));return this},i.off=n("removeListener"),i.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},i.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},i.manipulateListeners=function(e,t,n){var i,r,o=e?this.removeListener:this.addListener,s=e?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(i=n.length;i--;)o.call(this,t,n[i]);else for(i in t)t.hasOwnProperty(i)&&(r=t[i])&&("function"==typeof r?o.call(this,i,r):s.call(this,i,r));return this},i.removeEvent=function(e){var t,n=typeof e,i=this._getEvents();if("string"===n)delete i[e];else if("object"===n)for(t in i)i.hasOwnProperty(t)&&e.test(t)&&delete i[t];else delete this._events;return this},i.removeAllListeners=n("removeEvent"),i.emitEvent=function(e,t){var n,i,r,o,s=this.getListenersAsObject(e);for(r in s)if(s.hasOwnProperty(r))for(i=s[r].length;i--;)n=s[r][i],n.once===!0&&this.removeListener(e,n.listener),o=n.listener.apply(this,t||[]),o===this._getOnceReturnValue()&&this.removeListener(e,n.listener);return this},i.trigger=n("emitEvent"),i.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},i.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},i._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},i._getEvents=function(){return this._events||(this._events={})},e.noConflict=function(){return r.EventEmitter=o,e},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return e}):"object"==typeof module&&module.exports?module.exports=e:this.EventEmitter=e}).call(this),function(e){function t(t){var n=e.event;return n.target=n.target||n.srcElement||t,n}var n=document.documentElement,i=function(){};n.addEventListener?i=function(e,t,n){e.addEventListener(t,n,!1)}:n.attachEvent&&(i=function(e,n,i){e[n+i]=i.handleEvent?function(){var n=t(e);i.handleEvent.call(i,n)}:function(){var n=t(e);i.call(e,n)},e.attachEvent("on"+n,e[n+i])});var r=function(){};n.removeEventListener?r=function(e,t,n){e.removeEventListener(t,n,!1)}:n.detachEvent&&(r=function(e,t,n){e.detachEvent("on"+t,e[t+n]);try{delete e[t+n]}catch(i){e[t+n]=void 0}});var o={bind:i,unbind:r};"function"==typeof define&&define.amd?define("eventie/eventie",o):e.eventie=o}(this),function(e,t){"function"==typeof define&&define.amd?define(["eventEmitter/EventEmitter","eventie/eventie"],function(n,i){return t(e,n,i)}):"object"==typeof exports?module.exports=t(e,require("eventEmitter"),require("eventie")):e.imagesLoadedMB=t(e,e.EventEmitter,e.eventie)}(this,function(e,t,n){function i(e,t){for(var n in t)e[n]=t[n];return e}function r(e){return"[object Array]"===d.call(e)}function o(e){var t=[];if(r(e))t=e;else if("number"==typeof e.length)for(var n=0,i=e.length;i>n;n++)t.push(e[n]);else t.push(e);return t}function s(e,t,n){if(!(this instanceof s))return new s(e,t);"string"==typeof e&&(e=document.querySelectorAll(e)),this.elements=o(e),this.options=i({},this.options),"function"==typeof t?n=t:i(this.options,t),n&&this.on("always",n),this.getImages(),a&&(this.jqDeferred=new a.Deferred);var r=this;setTimeout(function(){r.check()})}function c(e){this.img=e}function f(e){this.src=e,v[e]=this}var a=e.jQuery,u=e.console,h=u!==void 0,d=Object.prototype.toString;s.prototype=new t,s.prototype.options={},s.prototype.getImages=function(){this.images=[];for(var e=0,t=this.elements.length;t>e;e++){var n=this.elements[e];"IMG"===n.nodeName&&this.addImage(n);for(var i=n.querySelectorAll("img"),r=0,o=i.length;o>r;r++){var s=i[r];this.addImage(s)}}},s.prototype.addImage=function(e){var t=new c(e);this.images.push(t)},s.prototype.check=function(){function e(e,r){return t.options.debug&&h&&u.log("confirm",e,r),t.progress(e),n++,n===i&&t.complete(),!0}var t=this,n=0,i=this.images.length;if(this.hasAnyBroken=!1,!i)return this.complete(),void 0;for(var r=0;i>r;r++){var o=this.images[r];o.on("confirm",e),o.check()}},s.prototype.progress=function(e){this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded;var t=this;setTimeout(function(){t.emit("progress",t,e),t.jqDeferred&&t.jqDeferred.notify&&t.jqDeferred.notify(t,e)})},s.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";this.isComplete=!0;var t=this;setTimeout(function(){if(t.emit(e,t),t.emit("always",t),t.jqDeferred){var n=t.hasAnyBroken?"reject":"resolve";t.jqDeferred[n](t)}})},a&&(a.fn.imagesLoadedMB=function(e,t){var n=new s(this,e,t);return n.jqDeferred.promise(a(this))}),c.prototype=new t,c.prototype.check=function(){var e=v[this.img.src]||new f(this.img.src);if(e.isConfirmed)return this.confirm(e.isLoaded,"cached was confirmed"),void 0;if(this.img.complete&&void 0!==this.img.naturalWidth)return this.confirm(0!==this.img.naturalWidth,"naturalWidth"),void 0;var t=this;e.on("confirm",function(e,n){return t.confirm(e.isLoaded,n),!0}),e.check()},c.prototype.confirm=function(e,t){this.isLoaded=e,this.emit("confirm",this,t)};var v={};return f.prototype=new t,f.prototype.check=function(){if(!this.isChecked){var e=new Image;n.bind(e,"load",this),n.bind(e,"error",this),e.src=this.src,this.isChecked=!0}},f.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},f.prototype.onload=function(e){this.confirm(!0,"onload"),this.unbindProxyEvents(e)},f.prototype.onerror=function(e){this.confirm(!1,"onerror"),this.unbindProxyEvents(e)},f.prototype.confirm=function(e,t){this.isConfirmed=!0,this.isLoaded=e,this.emit("confirm",this,t)},f.prototype.unbindProxyEvents=function(e){n.unbind(e.target,"load",this),n.unbind(e.target,"error",this)},s});
*
/* ##################### END OLD VERSION ##################### */


/*!
 * imagesLoaded PACKAGED v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

(function(){function e(){}function t(e,t){for(var n=e.length;n--;)if(e[n].listener===t)return n;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var i=e.prototype,r=this,o=r.EventEmitter;i.getListeners=function(e){var t,n,i=this._getEvents();if("object"==typeof e){t={};for(n in i)i.hasOwnProperty(n)&&e.test(n)&&(t[n]=i[n])}else t=i[e]||(i[e]=[]);return t},i.flattenListeners=function(e){var t,n=[];for(t=0;e.length>t;t+=1)n.push(e[t].listener);return n},i.getListenersAsObject=function(e){var t,n=this.getListeners(e);return n instanceof Array&&(t={},t[e]=n),t||n},i.addListener=function(e,n){var i,r=this.getListenersAsObject(e),o="object"==typeof n;for(i in r)r.hasOwnProperty(i)&&-1===t(r[i],n)&&r[i].push(o?n:{listener:n,once:!1});return this},i.on=n("addListener"),i.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},i.once=n("addOnceListener"),i.defineEvent=function(e){return this.getListeners(e),this},i.defineEvents=function(e){for(var t=0;e.length>t;t+=1)this.defineEvent(e[t]);return this},i.removeListener=function(e,n){var i,r,o=this.getListenersAsObject(e);for(r in o)o.hasOwnProperty(r)&&(i=t(o[r],n),-1!==i&&o[r].splice(i,1));return this},i.off=n("removeListener"),i.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},i.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},i.manipulateListeners=function(e,t,n){var i,r,o=e?this.removeListener:this.addListener,s=e?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(i=n.length;i--;)o.call(this,t,n[i]);else for(i in t)t.hasOwnProperty(i)&&(r=t[i])&&("function"==typeof r?o.call(this,i,r):s.call(this,i,r));return this},i.removeEvent=function(e){var t,n=typeof e,i=this._getEvents();if("string"===n)delete i[e];else if("object"===n)for(t in i)i.hasOwnProperty(t)&&e.test(t)&&delete i[t];else delete this._events;return this},i.removeAllListeners=n("removeEvent"),i.emitEvent=function(e,t){var n,i,r,o,s=this.getListenersAsObject(e);for(r in s)if(s.hasOwnProperty(r))for(i=s[r].length;i--;)n=s[r][i],n.once===!0&&this.removeListener(e,n.listener),o=n.listener.apply(this,t||[]),o===this._getOnceReturnValue()&&this.removeListener(e,n.listener);return this},i.trigger=n("emitEvent"),i.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},i.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},i._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},i._getEvents=function(){return this._events||(this._events={})},e.noConflict=function(){return r.EventEmitter=o,e},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return e}):"object"==typeof module&&module.exports?module.exports=e:this.EventEmitter=e}).call(this),function(e){function t(t){var n=e.event;return n.target=n.target||n.srcElement||t,n}var n=document.documentElement,i=function(){};n.addEventListener?i=function(e,t,n){e.addEventListener(t,n,!1)}:n.attachEvent&&(i=function(e,n,i){e[n+i]=i.handleEvent?function(){var n=t(e);i.handleEvent.call(i,n)}:function(){var n=t(e);i.call(e,n)},e.attachEvent("on"+n,e[n+i])});var r=function(){};n.removeEventListener?r=function(e,t,n){e.removeEventListener(t,n,!1)}:n.detachEvent&&(r=function(e,t,n){e.detachEvent("on"+t,e[t+n]);try{delete e[t+n]}catch(i){e[t+n]=void 0}});var o={bind:i,unbind:r};"function"==typeof define&&define.amd?define("eventie/eventie",o):e.eventie=o}(this),function(e,t){"function"==typeof define&&define.amd?define(["eventEmitter/EventEmitter","eventie/eventie"],function(n,i){return t(e,n,i)}):"object"==typeof exports?module.exports=t(e,require("wolfy87-eventemitter"),require("eventie")):e.imagesLoadedMB=t(e,e.EventEmitter,e.eventie)}(window,function(e,t,n){function i(e,t){for(var n in t)e[n]=t[n];return e}function r(e){return"[object Array]"===d.call(e)}function o(e){var t=[];if(r(e))t=e;else if("number"==typeof e.length)for(var n=0,i=e.length;i>n;n++)t.push(e[n]);else t.push(e);return t}function s(e,t,n){if(!(this instanceof s))return new s(e,t);"string"==typeof e&&(e=document.querySelectorAll(e)),this.elements=o(e),this.options=i({},this.options),"function"==typeof t?n=t:i(this.options,t),n&&this.on("always",n),this.getImages(),a&&(this.jqDeferred=new a.Deferred);var r=this;setTimeout(function(){r.check()})}function f(e){this.img=e}function c(e){this.src=e,v[e]=this}var a=e.jQuery,u=e.console,h=u!==void 0,d=Object.prototype.toString;s.prototype=new t,s.prototype.options={},s.prototype.getImages=function(){this.images=[];for(var e=0,t=this.elements.length;t>e;e++){var n=this.elements[e];"IMG"===n.nodeName&&this.addImage(n);var i=n.nodeType;if(i&&(1===i||9===i||11===i))for(var r=n.querySelectorAll("img"),o=0,s=r.length;s>o;o++){var f=r[o];this.addImage(f)}}},s.prototype.addImage=function(e){var t=new f(e);this.images.push(t)},s.prototype.check=function(){function e(e,r){return t.options.debug&&h&&u.log("confirm",e,r),t.progress(e),n++,n===i&&t.complete(),!0}var t=this,n=0,i=this.images.length;if(this.hasAnyBroken=!1,!i)return this.complete(),void 0;for(var r=0;i>r;r++){var o=this.images[r];o.on("confirm",e),o.check()}},s.prototype.progress=function(e){this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded;var t=this;setTimeout(function(){t.emit("progress",t,e),t.jqDeferred&&t.jqDeferred.notify&&t.jqDeferred.notify(t,e)})},s.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";this.isComplete=!0;var t=this;setTimeout(function(){if(t.emit(e,t),t.emit("always",t),t.jqDeferred){var n=t.hasAnyBroken?"reject":"resolve";t.jqDeferred[n](t)}})},a&&(a.fn.imagesLoadedMB=function(e,t){var n=new s(this,e,t);return n.jqDeferred.promise(a(this))}),f.prototype=new t,f.prototype.check=function(){var e=v[this.img.src]||new c(this.img.src);if(e.isConfirmed)return this.confirm(e.isLoaded,"cached was confirmed"),void 0;if(this.img.complete&&void 0!==this.img.naturalWidth)return this.confirm(0!==this.img.naturalWidth,"naturalWidth"),void 0;var t=this;e.on("confirm",function(e,n){return t.confirm(e.isLoaded,n),!0}),e.check()},f.prototype.confirm=function(e,t){this.isLoaded=e,this.emit("confirm",this,t)};var v={};return c.prototype=new t,c.prototype.check=function(){if(!this.isChecked){var e=new Image;n.bind(e,"load",this),n.bind(e,"error",this),e.src=this.src,this.isChecked=!0}},c.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},c.prototype.onload=function(e){this.confirm(!0,"onload"),this.unbindProxyEvents(e)},c.prototype.onerror=function(e){this.confirm(!1,"onerror"),this.unbindProxyEvents(e)},c.prototype.confirm=function(e,t){this.isConfirmed=!0,this.isLoaded=e,this.emit("confirm",this,t)},c.prototype.unbindProxyEvents=function(e){n.unbind(e.target,"load",this),n.unbind(e.target,"error",this)},s});

/* 
 * Namespace changed by David Blanco to IsotopeMB
 */



/* ##################### OLD VERSION ##################### */
/*!
 * Isotope PACKAGED v2.0.0
 * Filter & sort magical layouts
 * http://isotope.metafizzy.co
 */
/*
(function(e){function n(){}function r(e){function r(t){if(t.prototype.option){return}t.prototype.option=function(t){if(!e.isPlainObject(t)){return}this.options=e.extend(true,this.options,t)}}function s(n,r){e.fn[n]=function(s){if(typeof s==="string"){var o=t.call(arguments,1);for(var u=0,a=this.length;u<a;u++){var f=this[u];var l=e.data(f,n);if(!l){i("cannot call methods on "+n+" prior to initialization; "+"attempted to call '"+s+"'");continue}if(!e.isFunction(l[s])||s.charAt(0)==="_"){i("no such method '"+s+"' for "+n+" instance");continue}var c=l[s].apply(l,o);if(c!==undefined){return c}}return this}else{return this.each(function(){var t=e.data(this,n);if(t){t.option(s);t._init()}else{t=new r(this,s);e.data(this,n,t)}})}}}if(!e){return}var i=typeof console==="undefined"?n:function(e){console.error(e)};e.bridget=function(e,t){r(t);s(e,t)};return e.bridget}var t=Array.prototype.slice;if(typeof define==="function"&&define.amd){define("jquery-bridget/jquery.bridget",["jquery"],r)}else{r(e.jQuery)}})(window);(function(e){function r(t){var n=e.event;n.target=n.target||n.srcElement||t;return n}var t=document.documentElement;var n=function(){};if(t.addEventListener){n=function(e,t,n){e.addEventListener(t,n,false)}}else if(t.attachEvent){n=function(e,t,n){e[t+n]=n.handleEvent?function(){var t=r(e);n.handleEvent.call(n,t)}:function(){var t=r(e);n.call(e,t)};e.attachEvent("on"+t,e[t+n])}}var i=function(){};if(t.removeEventListener){i=function(e,t,n){e.removeEventListener(t,n,false)}}else if(t.detachEvent){i=function(e,t,n){e.detachEvent("on"+t,e[t+n]);try{delete e[t+n]}catch(r){e[t+n]=undefined}}}var s={bind:n,unbind:i};if(typeof define==="function"&&define.amd){define("eventie/eventie",s)}else if(typeof exports==="object"){module.exports=s}else{e.eventie=s}})(this);(function(e){function r(e){if(typeof e!=="function"){return}if(r.isReady){e()}else{n.push(e)}}function i(e){var i=e.type==="readystatechange"&&t.readyState!=="complete";if(r.isReady||i){return}r.isReady=true;for(var s=0,o=n.length;s<o;s++){var u=n[s];u()}}function s(n){n.bind(t,"DOMContentLoaded",i);n.bind(t,"readystatechange",i);n.bind(e,"load",i);return r}var t=e.document;var n=[];r.isReady=false;if(typeof define==="function"&&define.amd){r.isReady=typeof requirejs==="function";define("doc-ready/doc-ready",["eventie/eventie"],s)}else{e.docReady=s(e.eventie)}})(this);(function(){function e(){}function i(e,t){var n=e.length;while(n--){if(e[n].listener===t){return n}}return-1}function s(e){return function(){return this[e].apply(this,arguments)}}var t=e.prototype;var n=this;var r=n.EventEmitter;t.getListeners=function(t){var n=this._getEvents();var r;var i;if(t instanceof RegExp){r={};for(i in n){if(n.hasOwnProperty(i)&&t.test(i)){r[i]=n[i]}}}else{r=n[t]||(n[t]=[])}return r};t.flattenListeners=function(t){var n=[];var r;for(r=0;r<t.length;r+=1){n.push(t[r].listener)}return n};t.getListenersAsObject=function(t){var n=this.getListeners(t);var r;if(n instanceof Array){r={};r[t]=n}return r||n};t.addListener=function(t,n){var r=this.getListenersAsObject(t);var s=typeof n==="object";var o;for(o in r){if(r.hasOwnProperty(o)&&i(r[o],n)===-1){r[o].push(s?n:{listener:n,once:false})}}return this};t.on=s("addListener");t.addOnceListener=function(t,n){return this.addListener(t,{listener:n,once:true})};t.once=s("addOnceListener");t.defineEvent=function(t){this.getListeners(t);return this};t.defineEvents=function(t){for(var n=0;n<t.length;n+=1){this.defineEvent(t[n])}return this};t.removeListener=function(t,n){var r=this.getListenersAsObject(t);var s;var o;for(o in r){if(r.hasOwnProperty(o)){s=i(r[o],n);if(s!==-1){r[o].splice(s,1)}}}return this};t.off=s("removeListener");t.addListeners=function(t,n){return this.manipulateListeners(false,t,n)};t.removeListeners=function(t,n){return this.manipulateListeners(true,t,n)};t.manipulateListeners=function(t,n,r){var i;var s;var o=t?this.removeListener:this.addListener;var u=t?this.removeListeners:this.addListeners;if(typeof n==="object"&&!(n instanceof RegExp)){for(i in n){if(n.hasOwnProperty(i)&&(s=n[i])){if(typeof s==="function"){o.call(this,i,s)}else{u.call(this,i,s)}}}}else{i=r.length;while(i--){o.call(this,n,r[i])}}return this};t.removeEvent=function(t){var n=typeof t;var r=this._getEvents();var i;if(n==="string"){delete r[t]}else if(t instanceof RegExp){for(i in r){if(r.hasOwnProperty(i)&&t.test(i)){delete r[i]}}}else{delete this._events}return this};t.removeAllListeners=s("removeEvent");t.emitEvent=function(t,n){var r=this.getListenersAsObject(t);var i;var s;var o;var u;for(o in r){if(r.hasOwnProperty(o)){s=r[o].length;while(s--){i=r[o][s];if(i.once===true){this.removeListener(t,i.listener)}u=i.listener.apply(this,n||[]);if(u===this._getOnceReturnValue()){this.removeListener(t,i.listener)}}}}return this};t.trigger=s("emitEvent");t.emit=function(t){var n=Array.prototype.slice.call(arguments,1);return this.emitEvent(t,n)};t.setOnceReturnValue=function(t){this._onceReturnValue=t;return this};t._getOnceReturnValue=function(){if(this.hasOwnProperty("_onceReturnValue")){return this._onceReturnValue}else{return true}};t._getEvents=function(){return this._events||(this._events={})};e.noConflict=function(){n.EventEmitter=r;return e};if(typeof define==="function"&&define.amd){define("eventEmitter/EventEmitter",[],function(){return e})}else if(typeof module==="object"&&module.exports){module.exports=e}else{this.EventEmitter=e}}).call(this);(function(e){function r(e){if(!e){return}if(typeof n[e]==="string"){return e}e=e.charAt(0).toUpperCase()+e.slice(1);var r;for(var i=0,s=t.length;i<s;i++){r=t[i]+e;if(typeof n[r]==="string"){return r}}}var t="Webkit Moz ms Ms O".split(" ");var n=document.documentElement.style;if(typeof define==="function"&&define.amd){define("get-style-property/get-style-property",[],function(){return r})}else if(typeof exports==="object"){module.exports=r}else{e.getStyleProperty=r}})(window);(function(e,t){function i(e){var t=parseFloat(e);var n=e.indexOf("%")===-1&&!isNaN(t);return n&&t}function o(){var e={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0};for(var t=0,n=s.length;t<n;t++){var r=s[t];e[r]=0}return e}function u(e){function a(e){if(typeof e==="string"){e=document.querySelector(e)}if(!e||typeof e!=="object"||!e.nodeType){return}var n=r(e);if(n.display==="none"){return o()}var a={};a.width=e.offsetWidth;a.height=e.offsetHeight;var l=a.isBorderBox=!!(t&&n[t]&&n[t]==="border-box");for(var c=0,h=s.length;c<h;c++){var p=s[c];var d=n[p];d=f(e,d);var v=parseFloat(d);a[p]=!isNaN(v)?v:0}var m=a.paddingLeft+a.paddingRight;var g=a.paddingTop+a.paddingBottom;var y=a.marginLeft+a.marginRight;var b=a.marginTop+a.marginBottom;var w=a.borderLeftWidth+a.borderRightWidth;var E=a.borderTopWidth+a.borderBottomWidth;var S=l&&u;var x=i(n.width);if(x!==false){a.width=x+(S?0:m+w)}var T=i(n.height);if(T!==false){a.height=T+(S?0:g+E)}a.innerWidth=a.width-(m+w);a.innerHeight=a.height-(g+E);a.outerWidth=a.width+y;a.outerHeight=a.height+b;return a}function f(e,t){if(n||t.indexOf("%")===-1){return t}var r=e.style;var i=r.left;var s=e.runtimeStyle;var o=s&&s.left;if(o){s.left=e.currentStyle.left}r.left=t;t=r.pixelLeft;r.left=i;if(o){s.left=o}return t}var t=e("boxSizing");var u;(function(){if(!t){return}var e=document.createElement("div");e.style.width="200px";e.style.padding="1px 2px 3px 4px";e.style.borderStyle="solid";e.style.borderWidth="1px 2px 3px 4px";e.style[t]="border-box";var n=document.body||document.documentElement;n.appendChild(e);var s=r(e);u=i(s.width)===200;n.removeChild(e)})();return a}var n=e.getComputedStyle;var r=n?function(e){return n(e,null)}:function(e){return e.currentStyle};var s=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];if(typeof define==="function"&&define.amd){define("get-size/get-size",["get-style-property/get-style-property"],u)}else if(typeof exports==="object"){module.exports=u(require("get-style-property"))}else{e.getSize=u(e.getStyleProperty)}})(window);(function(e,t){function r(e,t){return e[n](t)}function i(e){if(e.parentNode){return}var t=document.createDocumentFragment();t.appendChild(e)}function s(e,t){i(e);var n=e.parentNode.querySelectorAll(t);for(var r=0,s=n.length;r<s;r++){if(n[r]===e){return true}}return false}function o(e,t){i(e);return r(e,t)}var n=function(){if(t.matchesSelector){return"matchesSelector"}var e=["webkit","moz","ms","o"];for(var n=0,r=e.length;n<r;n++){var i=e[n];var s=i+"MatchesSelector";if(t[s]){return s}}}();var u;if(n){var a=document.createElement("div");var f=r(a,"div");u=f?r:o}else{u=s}if(typeof define==="function"&&define.amd){define("matches-selector/matches-selector",[],function(){return u})}else{window.matchesSelector=u}})(this,Element.prototype);(function(e){function r(e,t){for(var n in t){e[n]=t[n]}return e}function i(e){for(var t in e){return false}t=null;return true}function s(e){return e.replace(/([A-Z])/g,function(e){return"-"+e.toLowerCase()})}function o(e,t,o){function d(e,t){if(!e){return}this.element=e;this.layout=t;this.position={x:0,y:0};this._create()}var u=o("transition");var a=o("transform");var f=u&&a;var l=!!o("perspective");var c={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[u];var h=["transform","transition","transitionDuration","transitionProperty"];var p=function(){var e={};for(var t=0,n=h.length;t<n;t++){var r=h[t];var i=o(r);if(i&&i!==r){e[r]=i}}return e}();r(d.prototype,e.prototype);d.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}};this.css({position:"absolute"})};d.prototype.handleEvent=function(e){var t="on"+e.type;if(this[t]){this[t](e)}};d.prototype.getSize=function(){this.size=t(this.element)};d.prototype.css=function(e){var t=this.element.style;for(var n in e){var r=p[n]||n;t[r]=e[n]}};d.prototype.getPosition=function(){var e=n(this.element);var t=this.layout.options;var r=t.isOriginLeft;var i=t.isOriginTop;var s=parseInt(e[r?"left":"right"],10);var o=parseInt(e[i?"top":"bottom"],10);s=isNaN(s)?0:s;o=isNaN(o)?0:o;var u=this.layout.size;s-=r?u.paddingLeft:u.paddingRight;o-=i?u.paddingTop:u.paddingBottom;this.position.x=s;this.position.y=o};d.prototype.layoutPosition=function(){var e=this.layout.size;var t=this.layout.options;var n={};if(t.isOriginLeft){n.left=this.position.x+e.paddingLeft+"px";n.right=""}else{n.right=this.position.x+e.paddingRight+"px";n.left=""}if(t.isOriginTop){n.top=this.position.y+e.paddingTop+"px";n.bottom=""}else{n.bottom=this.position.y+e.paddingBottom+"px";n.top=""}this.css(n);this.emitEvent("layout",[this])};var v=l?function(e,t){return"translate3d("+e+"px, "+t+"px, 0)"}:function(e,t){return"translate("+e+"px, "+t+"px)"};d.prototype._transitionTo=function(e,t){this.getPosition();var n=this.position.x;var r=this.position.y;var i=parseInt(e,10);var s=parseInt(t,10);var o=i===this.position.x&&s===this.position.y;this.setPosition(e,t);if(o&&!this.isTransitioning){this.layoutPosition();return}var u=e-n;var a=t-r;var f={};var l=this.layout.options;u=l.isOriginLeft?u:-u;a=l.isOriginTop?a:-a;f.transform=v(u,a);this.transition({to:f,onTransitionEnd:{transform:this.layoutPosition},isCleaning:true})};d.prototype.goTo=function(e,t){this.setPosition(e,t);this.layoutPosition()};d.prototype.moveTo=f?d.prototype._transitionTo:d.prototype.goTo;d.prototype.setPosition=function(e,t){this.position.x=parseInt(e,10);this.position.y=parseInt(t,10)};d.prototype._nonTransition=function(e){this.css(e.to);if(e.isCleaning){this._removeStyles(e.to)}for(var t in e.onTransitionEnd){e.onTransitionEnd[t].call(this)}};d.prototype._transition=function(e){if(!parseFloat(this.layout.options.transitionDuration)){this._nonTransition(e);return}var t=this._transn;for(var n in e.onTransitionEnd){t.onEnd[n]=e.onTransitionEnd[n]}for(n in e.to){t.ingProperties[n]=true;if(e.isCleaning){t.clean[n]=true}}if(e.from){this.css(e.from);var r=this.element.offsetHeight;r=null}this.enableTransition(e.to);this.css(e.to);this.isTransitioning=true};var m=a&&s(a)+",opacity";d.prototype.enableTransition=function(){if(this.isTransitioning){return}this.css({transitionProperty:m,transitionDuration:this.layout.options.transitionDuration});this.element.addEventListener(c,this,false)};d.prototype.transition=d.prototype[u?"_transition":"_nonTransition"];d.prototype.onwebkitTransitionEnd=function(e){this.ontransitionend(e)};d.prototype.onotransitionend=function(e){this.ontransitionend(e)};var g={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};d.prototype.ontransitionend=function(e){if(e.target!==this.element){return}var t=this._transn;var n=g[e.propertyName]||e.propertyName;delete t.ingProperties[n];if(i(t.ingProperties)){this.disableTransition()}if(n in t.clean){this.element.style[e.propertyName]="";delete t.clean[n]}if(n in t.onEnd){var r=t.onEnd[n];r.call(this);delete t.onEnd[n]}this.emitEvent("transitionEnd",[this])};d.prototype.disableTransition=function(){this.removeTransitionStyles();this.element.removeEventListener(c,this,false);this.isTransitioning=false};d.prototype._removeStyles=function(e){var t={};for(var n in e){t[n]=""}this.css(t)};var y={transitionProperty:"",transitionDuration:""};d.prototype.removeTransitionStyles=function(){this.css(y)};d.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element);this.emitEvent("remove",[this])};d.prototype.remove=function(){if(!u||!parseFloat(this.layout.options.transitionDuration)){this.removeElem();return}var e=this;this.on("transitionEnd",function(){e.removeElem();return true});this.hide()};d.prototype.reveal=function(){delete this.isHidden;this.css({display:""});var e=this.layout.options;this.transition({from:e.hiddenStyle,to:e.visibleStyle,isCleaning:true})};d.prototype.hide=function(){this.isHidden=true;this.css({display:""});var e=this.layout.options;this.transition({from:e.visibleStyle,to:e.hiddenStyle,isCleaning:true,onTransitionEnd:{opacity:function(){if(this.isHidden){this.css({display:"none"})}}}})};d.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})};return d}var t=e.getComputedStyle;var n=t?function(e){return t(e,null)}:function(e){return e.currentStyle};if(typeof define==="function"&&define.amd){define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property"],o)}else{e.Outlayer={};e.Outlayer.Item=o(e.EventEmitter,e.getSize,e.getStyleProperty)}})(window);(function(e){function s(e,t){for(var n in t){e[n]=t[n]}return e}function u(e){return o.call(e)==="[object Array]"}function a(e){var t=[];if(u(e)){t=e}else if(e&&typeof e.length==="number"){for(var n=0,r=e.length;n<r;n++){t.push(e[n])}}else{t.push(e)}return t}function c(e,t){var n=l(t,e);if(n!==-1){t.splice(n,1)}}function h(e){return e.replace(/(.)([A-Z])/g,function(e,t,n){return t+"-"+n}).toLowerCase()}function p(o,u,l,p,d,v){function y(e,r){if(typeof e==="string"){e=t.querySelector(e)}if(!e||!f(e)){if(n){n.error("Bad "+this.constructor.namespace+" element: "+e)}return}this.element=e;this.options=s({},this.constructor.defaults);this.option(r);var i=++m;this.element.outlayerGUID=i;g[i]=this;this._create();if(this.options.isInitLayout){this.layout()}}var m=0;var g={};y.namespace="outlayer";y.Item=v;y.defaults={containerStyle:{position:"relative"},isInitLayout:true,isOriginLeft:true,isOriginTop:true,isResizeBound:true,isResizingContainer:true,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}};s(y.prototype,l.prototype);y.prototype.option=function(e){s(this.options,e)};y.prototype._create=function(){this.reloadItems();this.stamps=[];this.stamp(this.options.stamp);s(this.element.style,this.options.containerStyle);if(this.options.isResizeBound){this.bindResize()}};y.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)};y.prototype._itemize=function(e){var t=this._filterFindItemElements(e);var n=this.constructor.Item;var r=[];for(var i=0,s=t.length;i<s;i++){var o=t[i];var u=new n(o,this);r.push(u)}return r};y.prototype._filterFindItemElements=function(e){e=a(e);var t=this.options.itemSelector;var n=[];for(var r=0,i=e.length;r<i;r++){var s=e[r];if(!f(s)){continue}if(t){if(d(s,t)){n.push(s)}var o=s.querySelectorAll(t);for(var u=0,l=o.length;u<l;u++){n.push(o[u])}}else{n.push(s)}}return n};y.prototype.getItemElements=function(){var e=[];for(var t=0,n=this.items.length;t<n;t++){e.push(this.items[t].element)}return e};y.prototype.layout=function(){this._resetLayout();this._manageStamps();var e=this.options.isLayoutInstant!==undefined?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,e);this._isLayoutInited=true};y.prototype._init=y.prototype.layout;y.prototype._resetLayout=function(){this.getSize()};y.prototype.getSize=function(){this.size=p(this.element)};y.prototype._getMeasurement=function(e,t){var n=this.options[e];var r;if(!n){this[e]=0}else{if(typeof n==="string"){r=this.element.querySelector(n)}else if(f(n)){r=n}this[e]=r?p(r)[t]:n}};y.prototype.layoutItems=function(e,t){e=this._getItemsForLayout(e);this._layoutItems(e,t);this._postLayout()};y.prototype._getItemsForLayout=function(e){var t=[];for(var n=0,r=e.length;n<r;n++){var i=e[n];if(!i.isIgnored){t.push(i)}}return t};y.prototype._layoutItems=function(e,t){function r(){n.emitEvent("layoutComplete",[n,e])}var n=this;if(!e||!e.length){r();return}this._itemsOn(e,"layout",r);var i=[];for(var s=0,o=e.length;s<o;s++){var u=e[s];var a=this._getItemLayoutPosition(u);a.item=u;a.isInstant=t||u.isLayoutInstant;i.push(a)}this._processLayoutQueue(i)};y.prototype._getItemLayoutPosition=function(){return{x:0,y:0}};y.prototype._processLayoutQueue=function(e){for(var t=0,n=e.length;t<n;t++){var r=e[t];this._positionItem(r.item,r.x,r.y,r.isInstant)}};y.prototype._positionItem=function(e,t,n,r){if(r){e.goTo(t,n)}else{e.moveTo(t,n)}};y.prototype._postLayout=function(){this.resizeContainer()};y.prototype.resizeContainer=function(){if(!this.options.isResizingContainer){return}var e=this._getContainerSize();if(e){this._setContainerMeasure(e.width,true);this._setContainerMeasure(e.height,false)}};y.prototype._getContainerSize=i;y.prototype._setContainerMeasure=function(e,t){if(e===undefined){return}var n=this.size;if(n.isBorderBox){e+=t?n.paddingLeft+n.paddingRight+n.borderLeftWidth+n.borderRightWidth:n.paddingBottom+n.paddingTop+n.borderTopWidth+n.borderBottomWidth}e=Math.max(e,0);this.element.style[t?"width":"height"]=e+"px"};y.prototype._itemsOn=function(e,t,n){function o(){r++;if(r===i){n.call(s)}return true}var r=0;var i=e.length;var s=this;for(var u=0,a=e.length;u<a;u++){var f=e[u];f.on(t,o)}};y.prototype.ignore=function(e){var t=this.getItem(e);if(t){t.isIgnored=true}};y.prototype.unignore=function(e){var t=this.getItem(e);if(t){delete t.isIgnored}};y.prototype.stamp=function(e){e=this._find(e);if(!e){return}this.stamps=this.stamps.concat(e);for(var t=0,n=e.length;t<n;t++){var r=e[t];this.ignore(r)}};y.prototype.unstamp=function(e){e=this._find(e);if(!e){return}for(var t=0,n=e.length;t<n;t++){var r=e[t];c(r,this.stamps);this.unignore(r)}};y.prototype._find=function(e){if(!e){return}if(typeof e==="string"){e=this.element.querySelectorAll(e)}e=a(e);return e};y.prototype._manageStamps=function(){if(!this.stamps||!this.stamps.length){return}this._getBoundingRect();for(var e=0,t=this.stamps.length;e<t;e++){var n=this.stamps[e];this._manageStamp(n)}};y.prototype._getBoundingRect=function(){var e=this.element.getBoundingClientRect();var t=this.size;this._boundingRect={left:e.left+t.paddingLeft+t.borderLeftWidth,top:e.top+t.paddingTop+t.borderTopWidth,right:e.right-(t.paddingRight+t.borderRightWidth),bottom:e.bottom-(t.paddingBottom+t.borderBottomWidth)}};y.prototype._manageStamp=i;y.prototype._getElementOffset=function(e){var t=e.getBoundingClientRect();var n=this._boundingRect;var r=p(e);var i={left:t.left-n.left-r.marginLeft,top:t.top-n.top-r.marginTop,right:n.right-t.right-r.marginRight,bottom:n.bottom-t.bottom-r.marginBottom};return i};y.prototype.handleEvent=function(e){var t="on"+e.type;if(this[t]){this[t](e)}};y.prototype.bindResize=function(){if(this.isResizeBound){return}o.bind(e,"resize",this);this.isResizeBound=true};y.prototype.unbindResize=function(){if(this.isResizeBound){o.unbind(e,"resize",this)}this.isResizeBound=false};y.prototype.onresize=function(){function t(){e.resize();delete e.resizeTimeout}if(this.resizeTimeout){clearTimeout(this.resizeTimeout)}var e=this;this.resizeTimeout=setTimeout(t,100)};y.prototype.resize=function(){if(!this.isResizeBound||!this.needsResizeLayout()){return}this.layout()};y.prototype.needsResizeLayout=function(){var e=p(this.element);var t=this.size&&e;return t&&e.innerWidth!==this.size.innerWidth};y.prototype.addItems=function(e){var t=this._itemize(e);if(t.length){this.items=this.items.concat(t)}return t};y.prototype.appended=function(e){var t=this.addItems(e);if(!t.length){return}this.layoutItems(t,true);this.reveal(t)};y.prototype.prepended=function(e){var t=this._itemize(e);if(!t.length){return}var n=this.items.slice(0);this.items=t.concat(n);this._resetLayout();this._manageStamps();this.layoutItems(t,true);this.reveal(t);this.layoutItems(n)};y.prototype.reveal=function(e){var t=e&&e.length;if(!t){return}for(var n=0;n<t;n++){var r=e[n];r.reveal()}};y.prototype.hide=function(e){var t=e&&e.length;if(!t){return}for(var n=0;n<t;n++){var r=e[n];r.hide()}};y.prototype.getItem=function(e){for(var t=0,n=this.items.length;t<n;t++){var r=this.items[t];if(r.element===e){return r}}};y.prototype.getItems=function(e){if(!e||!e.length){return}var t=[];for(var n=0,r=e.length;n<r;n++){var i=e[n];var s=this.getItem(i);if(s){t.push(s)}}return t};y.prototype.remove=function(e){e=a(e);var t=this.getItems(e);if(!t||!t.length){return}this._itemsOn(t,"remove",function(){this.emitEvent("removeComplete",[this,t])});for(var n=0,r=t.length;n<r;n++){var i=t[n];i.remove();c(i,this.items)}};y.prototype.destroy=function(){var e=this.element.style;e.height="";e.position="";e.width="";for(var t=0,n=this.items.length;t<n;t++){var i=this.items[t];i.destroy()}this.unbindResize();delete this.element.outlayerGUID;if(r){r.removeData(this.element,this.constructor.namespace)}};y.data=function(e){var t=e&&e.outlayerGUID;return t&&g[t]};y.create=function(e,i){function o(){y.apply(this,arguments)}if(Object.create){o.prototype=Object.create(y.prototype)}else{s(o.prototype,y.prototype)}o.prototype.constructor=o;o.defaults=s({},y.defaults);s(o.defaults,i);o.prototype.settings={};o.namespace=e;o.data=y.data;o.Item=function(){v.apply(this,arguments)};o.Item.prototype=new v;u(function(){var i=h(e);var s=t.querySelectorAll(".js-"+i);var u="data-"+i+"-options";for(var a=0,f=s.length;a<f;a++){var l=s[a];var c=l.getAttribute(u);var p;try{p=c&&JSON.parse(c)}catch(d){if(n){n.error("Error parsing "+u+" on "+l.nodeName.toLowerCase()+(l.id?"#"+l.id:"")+": "+d)}continue}var v=new o(l,p);if(r){r.data(l,e,v)}}});if(r&&r.bridget){r.bridget(e,o)}return o};y.Item=v;return y}var t=e.document;var n=e.console;var r=e.jQuery;var i=function(){};var o=Object.prototype.toString;var f=typeof HTMLElement==="object"?function(t){return t instanceof HTMLElement}:function(t){return t&&typeof t==="object"&&t.nodeType===1&&typeof t.nodeName==="string"};var l=Array.prototype.indexOf?function(e,t){return e.indexOf(t)}:function(e,t){for(var n=0,r=e.length;n<r;n++){if(e[n]===t){return n}}return-1};if(typeof define==="function"&&define.amd){define("outlayer/outlayer",["eventie/eventie","doc-ready/doc-ready","eventEmitter/EventEmitter","get-size/get-size","matches-selector/matches-selector","./item"],p)}else{e.Outlayer=p(e.eventie,e.docReady,e.EventEmitter,e.getSize,e.matchesSelector,e.Outlayer.Item)}})(window);(function(e){function t(e){function t(){e.Item.apply(this,arguments)}t.prototype=new e.Item;t.prototype._create=function(){this.id=this.layout.itemGUID++;e.Item.prototype._create.call(this);this.sortData={}};t.prototype.updateSortData=function(){if(this.isIgnored){return}this.sortData.id=this.id;this.sortData["original-order"]=this.id;this.sortData.random=Math.random();var e=this.layout.options.getSortData;var t=this.layout._sorters;for(var n in e){var r=t[n];this.sortData[n]=r(this.element,this)}};return t}if(typeof define==="function"&&define.amd){define("isotopeMB/js/item",["outlayer/outlayer"],t)}else{e.IsotopeMB=e.IsotopeMB||{};e.IsotopeMB.Item=t(e.Outlayer)}})(window);(function(e){function t(e,t){function n(e){this.isotopeMB=e;if(e){this.options=e.options[this.namespace];this.element=e.element;this.items=e.filteredItems;this.size=e.size}}(function(){function o(e){return function(){return t.prototype[e].apply(this.isotopeMB,arguments)}}var e=["_resetLayout","_getItemLayoutPosition","_manageStamp","_getContainerSize","_getElementOffset","needsResizeLayout"];for(var r=0,i=e.length;r<i;r++){var s=e[r];n.prototype[s]=o(s)}})();n.prototype.needsVerticalResizeLayout=function(){var t=e(this.isotopeMB.element);var n=this.isotopeMB.size&&t;return n&&t.innerHeight!==this.isotopeMB.size.innerHeight};n.prototype._getMeasurement=function(){this.isotopeMB._getMeasurement.apply(this,arguments)};n.prototype.getColumnWidth=function(){this.getSegmentSize("column","Width")};n.prototype.getRowHeight=function(){this.getSegmentSize("row","Height")};n.prototype.getSegmentSize=function(e,t){var n=e+t;var r="outer"+t;this._getMeasurement(n,r);if(this[n]){return}var i=this.getFirstItemSize();this[n]=i&&i[r]||this.isotopeMB.size["inner"+t]};n.prototype.getFirstItemSize=function(){var t=this.isotopeMB.filteredItems[0];return t&&t.element&&e(t.element)};n.prototype.layout=function(){this.isotopeMB.layout.apply(this.isotopeMB,arguments)};n.prototype.getSize=function(){this.isotopeMB.getSize();this.size=this.isotopeMB.size};n.modes={};n.create=function(e,t){function r(){n.apply(this,arguments)}r.prototype=new n;if(t){r.options=t}r.prototype.namespace=e;n.modes[e]=r;return r};return n}if(typeof define==="function"&&define.amd){define("isotopeMB/js/layout-mode",["get-size/get-size","outlayer/outlayer"],t)}else{e.IsotopeMB=e.IsotopeMB||{};e.IsotopeMB.LayoutMode=t(e.getSize,e.Outlayer)}})(window);(function(e){function n(e,n){var r=e.create("masonry");r.prototype._resetLayout=function(){this.getSize();this._getMeasurement("columnWidth","outerWidth");this._getMeasurement("gutter","outerWidth");this.measureColumns();var e=this.cols;this.colYs=[];while(e--){this.colYs.push(0)}this.maxY=0};r.prototype.measureColumns=function(){this.getContainerWidth();if(!this.columnWidth){var e=this.items[0];var t=e&&e.element;this.columnWidth=t&&n(t).outerWidth||this.containerWidth}this.columnWidth+=this.gutter;this.cols=Math.floor((this.containerWidth+this.gutter)/this.columnWidth);this.cols=Math.max(this.cols,1)};r.prototype.getContainerWidth=function(){var e=this.options.isFitWidth?this.element.parentNode:this.element;var t=n(e);this.containerWidth=t&&t.innerWidth};r.prototype._getItemLayoutPosition=function(e){e.getSize();var n=e.size.outerWidth%this.columnWidth;var r=n&&n<1?"round":"ceil";var i=Math[r](e.size.outerWidth/this.columnWidth);i=Math.min(i,this.cols);var s=this._getColGroup(i);var o=Math.min.apply(Math,s);var u=t(s,o);var a={x:this.columnWidth*u,y:o};var f=o+e.size.outerHeight;var l=this.cols+1-s.length;for(var c=0;c<l;c++){this.colYs[u+c]=f}return a};r.prototype._getColGroup=function(e){if(e<2){return this.colYs}var t=[];var n=this.cols+1-e;for(var r=0;r<n;r++){var i=this.colYs.slice(r,r+e);t[r]=Math.max.apply(Math,i)}return t};r.prototype._manageStamp=function(e){var t=n(e);var r=this._getElementOffset(e);var i=this.options.isOriginLeft?r.left:r.right;var s=i+t.outerWidth;var o=Math.floor(i/this.columnWidth);o=Math.max(0,o);var u=Math.floor(s/this.columnWidth);u-=s%this.columnWidth?0:1;u=Math.min(this.cols-1,u);var a=(this.options.isOriginTop?r.top:r.bottom)+t.outerHeight;for(var f=o;f<=u;f++){this.colYs[f]=Math.max(a,this.colYs[f])}};r.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var e={height:this.maxY};if(this.options.isFitWidth){e.width=this._getContainerFitWidth()}return e};r.prototype._getContainerFitWidth=function(){var e=0;var t=this.cols;while(--t){if(this.colYs[t]!==0){break}e++}return(this.cols-e)*this.columnWidth-this.gutter};r.prototype.needsResizeLayout=function(){var e=this.containerWidth;this.getContainerWidth();return e!==this.containerWidth};return r}var t=Array.prototype.indexOf?function(e,t){return e.indexOf(t)}:function(e,t){for(var n=0,r=e.length;n<r;n++){var i=e[n];if(i===t){return n}}return-1};if(typeof define==="function"&&define.amd){define("masonry/masonry",["outlayer/outlayer","get-size/get-size"],n)}else{e.Masonry=n(e.Outlayer,e.getSize)}})(window);(function(e){function t(e,t){for(var n in t){e[n]=t[n]}return e}function n(e,n){var r=e.create("masonry");var i=r.prototype._getElementOffset;var s=r.prototype.layout;var o=r.prototype._getMeasurement;t(r.prototype,n.prototype);r.prototype._getElementOffset=i;r.prototype.layout=s;r.prototype._getMeasurement=o;var u=r.prototype.measureColumns;r.prototype.measureColumns=function(){this.items=this.isotopeMB.filteredItems;u.call(this)};var a=r.prototype._manageStamp;r.prototype._manageStamp=function(){this.options.isOriginLeft=this.isotopeMB.options.isOriginLeft;this.options.isOriginTop=this.isotopeMB.options.isOriginTop;a.apply(this,arguments)};return r}if(typeof define==="function"&&define.amd){define("isotopeMB/js/layout-modes/masonry",["../layout-mode","masonry/masonry"],n)}else{n(e.IsotopeMB.LayoutMode,e.Masonry)}})(window);(function(e){function t(e){var t=e.create("fitRows");t.prototype._resetLayout=function(){this.x=0;this.y=0;this.maxY=0};t.prototype._getItemLayoutPosition=function(e){e.getSize();if(this.x!==0&&e.size.outerWidth+this.x>this.isotopeMB.size.innerWidth){this.x=0;this.y=this.maxY}var t={x:this.x,y:this.y};this.maxY=Math.max(this.maxY,this.y+e.size.outerHeight);this.x+=e.size.outerWidth;return t};t.prototype._getContainerSize=function(){return{height:this.maxY}};return t}if(typeof define==="function"&&define.amd){define("isotopeMB/js/layout-modes/fit-rows",["../layout-mode"],t)}else{t(e.IsotopeMB.LayoutMode)}})(window);(function(e){function t(e){var t=e.create("vertical",{horizontalAlignment:0});t.prototype._resetLayout=function(){this.y=0};t.prototype._getItemLayoutPosition=function(e){e.getSize();var t=(this.isotopeMB.size.innerWidth-e.size.outerWidth)*this.options.horizontalAlignment;var n=this.y;this.y+=e.size.outerHeight;return{x:t,y:n}};t.prototype._getContainerSize=function(){return{height:this.y}};return t}if(typeof define==="function"&&define.amd){define("isotopeMB/js/layout-modes/vertical",["../layout-mode"],t)}else{t(e.IsotopeMB.LayoutMode)}})(window);(function(e){function n(e,t){for(var n in t){e[n]=t[n]}return e}function u(e){return o.call(e)==="[object Array]"}function f(e){var t=[];if(u(e)){t=e}else if(e&&typeof e.length==="number"){for(var n=0,r=e.length;n<r;n++){t.push(e[n])}}else{t.push(e)}return t}function l(e,t){var n=a(t,e);if(n!==-1){t.splice(n,1)}}function c(e,i,o,u,a){function p(e,t){return function(r,i){for(var s=0,o=e.length;s<o;s++){var u=e[s];var a=r.sortData[u];var f=i.sortData[u];if(a>f||a<f){var l=t[u]!==undefined?t[u]:t;var c=l?1:-1;return(a>f?1:-1)*c}}return 0}}var c=e.create("isotopeMB",{layoutMode:"masonry",isJQueryFiltering:true,sortAscending:true});c.Item=u;c.LayoutMode=a;c.prototype._create=function(){this.itemGUID=0;this._sorters={};this._getSorters();e.prototype._create.call(this);this.modes={};this.filteredItems=this.items;this.sortHistory=["original-order"];for(var t in a.modes){this._initLayoutMode(t)}};c.prototype.reloadItems=function(){this.itemGUID=0;e.prototype.reloadItems.call(this)};c.prototype._itemize=function(){var t=e.prototype._itemize.apply(this,arguments);for(var n=0,r=t.length;n<r;n++){var i=t[n];i.id=this.itemGUID++}this._updateItemsSortData(t);return t};c.prototype._initLayoutMode=function(e){var t=a.modes[e];var r=this.options[e]||{};this.options[e]=t.options?n(t.options,r):r;this.modes[e]=new t(this)};c.prototype.layout=function(){if(!this._isLayoutInited&&this.options.isInitLayout){this.arrange();return}this._layout()};c.prototype._layout=function(){var e=this._getIsInstant();this._resetLayout();this._manageStamps();this.layoutItems(this.filteredItems,e);this._isLayoutInited=true};c.prototype.arrange=function(e){this.option(e);this._getIsInstant();this.filteredItems=this._filter(this.items);this._sort();this._layout()};c.prototype._init=c.prototype.arrange;c.prototype._getIsInstant=function(){var e=this.options.isLayoutInstant!==undefined?this.options.isLayoutInstant:!this._isLayoutInited;this._isInstant=e;return e};c.prototype._filter=function(e){function c(){l.reveal(r);l.hide(i)}var t=this.options.filter;t=t||"*";var n=[];var r=[];var i=[];var s=this._getFilterTest(t);for(var o=0,u=e.length;o<u;o++){var a=e[o];if(a.isIgnored){continue}var f=s(a);if(f){n.push(a)}if(f&&a.isHidden){r.push(a)}else if(!f&&!a.isHidden){i.push(a)}}var l=this;if(this._isInstant){this._noTransition(c)}else{c()}return n};c.prototype._getFilterTest=function(e){if(t&&this.options.isJQueryFiltering){return function(n){return t(n.element).is(e)}}if(typeof e==="function"){return function(t){return e(t.element)}}return function(t){return o(t.element,e)}};c.prototype.updateSortData=function(e){this._getSorters();e=f(e);var t=this.getItems(e);t=t.length?t:this.items;this._updateItemsSortData(t)};c.prototype._getSorters=function(){var e=this.options.getSortData;for(var t in e){var n=e[t];this._sorters[t]=h(n)}};c.prototype._updateItemsSortData=function(e){for(var t=0,n=e.length;t<n;t++){var r=e[t];r.updateSortData()}};var h=function(){function e(e){if(typeof e!=="string"){return e}var n=r(e).split(" ");var i=n[0];var s=i.match(/^\[(.+)\]$/);var o=s&&s[1];var u=t(o,i);var a=c.sortDataParsers[n[1]];e=a?function(e){return e&&a(u(e))}:function(e){return e&&u(e)};return e}function t(e,t){var n;if(e){n=function(t){return t.getAttribute(e)}}else{n=function(e){var n=e.querySelector(t);return n&&s(n)}}return n}return e}();c.sortDataParsers={parseInt:function(e){return parseInt(e,10)},parseFloat:function(e){return parseFloat(e)}};c.prototype._sort=function(){var e=this.options.sortBy;if(!e){return}var t=[].concat.apply(e,this.sortHistory);var n=p(t,this.options.sortAscending);this.filteredItems.sort(n);if(e!==this.sortHistory[0]){this.sortHistory.unshift(e)}};c.prototype._mode=function(){var e=this.options.layoutMode;var t=this.modes[e];if(!t){throw new Error("No layout mode: "+e)}t.options=this.options[e];return t};c.prototype._resetLayout=function(){e.prototype._resetLayout.call(this);this._mode()._resetLayout()};c.prototype._getItemLayoutPosition=function(e){return this._mode()._getItemLayoutPosition(e)};c.prototype._manageStamp=function(e){this._mode()._manageStamp(e)};c.prototype._getContainerSize=function(){return this._mode()._getContainerSize()};c.prototype.needsResizeLayout=function(){return this._mode().needsResizeLayout()};c.prototype.appended=function(e){var t=this.addItems(e);if(!t.length){return}var n=this._filterRevealAdded(t);this.filteredItems=this.filteredItems.concat(n)};c.prototype.prepended=function(e){var t=this._itemize(e);if(!t.length){return}var n=this.items.slice(0);this.items=t.concat(n);this._resetLayout();this._manageStamps();var r=this._filterRevealAdded(t);this.layoutItems(n);this.filteredItems=r.concat(this.filteredItems)};c.prototype._filterRevealAdded=function(e){var t=this._noTransition(function(){return this._filter(e)});this.layoutItems(t,true);this.reveal(t);return e};c.prototype.insert=function(e){var t=this.addItems(e);if(!t.length){return}var n,r;var i=t.length;for(n=0;n<i;n++){r=t[n];this.element.appendChild(r.element)}var s=this._filter(t);this._noTransition(function(){this.hide(s)});for(n=0;n<i;n++){t[n].isLayoutInstant=true}this.arrange();for(n=0;n<i;n++){delete t[n].isLayoutInstant}this.reveal(s)};var d=c.prototype.remove;c.prototype.remove=function(e){e=f(e);var t=this.getItems(e);d.call(this,e);if(!t||!t.length){return}for(var n=0,r=t.length;n<r;n++){var i=t[n];l(i,this.filteredItems)}};c.prototype._noTransition=function(e){var t=this.options.transitionDuration;this.options.transitionDuration=0;var n=e.call(this);this.options.transitionDuration=t;return n};return c}var t=e.jQuery;var r=String.prototype.trim?function(e){return e.trim()}:function(e){return e.replace(/^\s+|\s+$/g,"")};var i=document.documentElement;var s=i.textContent?function(e){return e.textContent}:function(e){return e.innerText};var o=Object.prototype.toString;var a=Array.prototype.indexOf?function(e,t){return e.indexOf(t)}:function(e,t){for(var n=0,r=e.length;n<r;n++){if(e[n]===t){return n}}return-1};if(typeof define==="function"&&define.amd){define(["outlayer/outlayer","get-size/get-size","matches-selector/matches-selector","isotopeMB/js/item","isotopeMB/js/layout-mode","isotopeMB/js/layout-modes/masonry","isotopeMB/js/layout-modes/fit-rows","isotopeMB/js/layout-modes/vertical"],c)}else{e.IsotopeMB=c(e.Outlayer,e.getSize,e.matchesSelector,e.IsotopeMB.Item,e.IsotopeMB.LayoutMode)}})(window)
*/
/* ##################### END OLD VERSION ##################### */


/*!
 * Isotope PACKAGED v2.2.0
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * http://isotope.metafizzy.co
 * Copyright 2015 Metafizzy
 */

!function(a){function b(){}function c(a){function c(b){b.prototype.option||(b.prototype.option=function(b){a.isPlainObject(b)&&(this.options=a.extend(!0,this.options,b))})}function e(b,c){a.fn[b]=function(e){if("string"==typeof e){for(var g=d.call(arguments,1),h=0,i=this.length;i>h;h++){var j=this[h],k=a.data(j,b);if(k)if(a.isFunction(k[e])&&"_"!==e.charAt(0)){var l=k[e].apply(k,g);if(void 0!==l)return l}else f("no such method '"+e+"' for "+b+" instance");else f("cannot call methods on "+b+" prior to initialization; attempted to call '"+e+"'")}return this}return this.each(function(){var d=a.data(this,b);d?(d.option(e),d._init()):(d=new c(this,e),a.data(this,b,d))})}}if(a){var f="undefined"==typeof console?b:function(a){console.error(a)};return a.bridget=function(a,b){c(b),e(a,b)},a.bridget}}var d=Array.prototype.slice;"function"==typeof define&&define.amd?define("jquery-bridget/jquery.bridget",["jquery"],c):c("object"==typeof exports?require("jquery"):a.jQuery)}(window),function(a){function b(b){var c=a.event;return c.target=c.target||c.srcElement||b,c}var c=document.documentElement,d=function(){};c.addEventListener?d=function(a,b,c){a.addEventListener(b,c,!1)}:c.attachEvent&&(d=function(a,c,d){a[c+d]=d.handleEvent?function(){var c=b(a);d.handleEvent.call(d,c)}:function(){var c=b(a);d.call(a,c)},a.attachEvent("on"+c,a[c+d])});var e=function(){};c.removeEventListener?e=function(a,b,c){a.removeEventListener(b,c,!1)}:c.detachEvent&&(e=function(a,b,c){a.detachEvent("on"+b,a[b+c]);try{delete a[b+c]}catch(d){a[b+c]=void 0}});var f={bind:d,unbind:e};"function"==typeof define&&define.amd?define("eventie/eventie",f):"object"==typeof exports?module.exports=f:a.eventie=f}(window),function(){"use strict";function a(){}function b(a,b){for(var c=a.length;c--;)if(a[c].listener===b)return c;return-1}function c(a){return function(){return this[a].apply(this,arguments)}}var d=a.prototype,e=this,f=e.EventEmitter;d.getListeners=function(a){var b,c,d=this._getEvents();if(a instanceof RegExp){b={};for(c in d)d.hasOwnProperty(c)&&a.test(c)&&(b[c]=d[c])}else b=d[a]||(d[a]=[]);return b},d.flattenListeners=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[b].listener);return c},d.getListenersAsObject=function(a){var b,c=this.getListeners(a);return c instanceof Array&&(b={},b[a]=c),b||c},d.addListener=function(a,c){var d,e=this.getListenersAsObject(a),f="object"==typeof c;for(d in e)e.hasOwnProperty(d)&&-1===b(e[d],c)&&e[d].push(f?c:{listener:c,once:!1});return this},d.on=c("addListener"),d.addOnceListener=function(a,b){return this.addListener(a,{listener:b,once:!0})},d.once=c("addOnceListener"),d.defineEvent=function(a){return this.getListeners(a),this},d.defineEvents=function(a){for(var b=0;b<a.length;b+=1)this.defineEvent(a[b]);return this},d.removeListener=function(a,c){var d,e,f=this.getListenersAsObject(a);for(e in f)f.hasOwnProperty(e)&&(d=b(f[e],c),-1!==d&&f[e].splice(d,1));return this},d.off=c("removeListener"),d.addListeners=function(a,b){return this.manipulateListeners(!1,a,b)},d.removeListeners=function(a,b){return this.manipulateListeners(!0,a,b)},d.manipulateListeners=function(a,b,c){var d,e,f=a?this.removeListener:this.addListener,g=a?this.removeListeners:this.addListeners;if("object"!=typeof b||b instanceof RegExp)for(d=c.length;d--;)f.call(this,b,c[d]);else for(d in b)b.hasOwnProperty(d)&&(e=b[d])&&("function"==typeof e?f.call(this,d,e):g.call(this,d,e));return this},d.removeEvent=function(a){var b,c=typeof a,d=this._getEvents();if("string"===c)delete d[a];else if(a instanceof RegExp)for(b in d)d.hasOwnProperty(b)&&a.test(b)&&delete d[b];else delete this._events;return this},d.removeAllListeners=c("removeEvent"),d.emitEvent=function(a,b){var c,d,e,f,g=this.getListenersAsObject(a);for(e in g)if(g.hasOwnProperty(e))for(d=g[e].length;d--;)c=g[e][d],c.once===!0&&this.removeListener(a,c.listener),f=c.listener.apply(this,b||[]),f===this._getOnceReturnValue()&&this.removeListener(a,c.listener);return this},d.trigger=c("emitEvent"),d.emit=function(a){var b=Array.prototype.slice.call(arguments,1);return this.emitEvent(a,b)},d.setOnceReturnValue=function(a){return this._onceReturnValue=a,this},d._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},d._getEvents=function(){return this._events||(this._events={})},a.noConflict=function(){return e.EventEmitter=f,a},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return a}):"object"==typeof module&&module.exports?module.exports=a:e.EventEmitter=a}.call(this),function(a){function b(a){if(a){if("string"==typeof d[a])return a;a=a.charAt(0).toUpperCase()+a.slice(1);for(var b,e=0,f=c.length;f>e;e++)if(b=c[e]+a,"string"==typeof d[b])return b}}var c="Webkit Moz ms Ms O".split(" "),d=document.documentElement.style;"function"==typeof define&&define.amd?define("get-style-property/get-style-property",[],function(){return b}):"object"==typeof exports?module.exports=b:a.getStyleProperty=b}(window),function(a,b){function c(a){var b=parseFloat(a),c=-1===a.indexOf("%")&&!isNaN(b);return c&&b}function d(){}function e(){for(var a={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},b=0,c=h.length;c>b;b++){var d=h[b];a[d]=0}return a}function f(b){function d(){if(!m){m=!0;var d=a.getComputedStyle;if(j=function(){var a=d?function(a){return d(a,null)}:function(a){return a.currentStyle};return function(b){var c=a(b);return c||g("Style returned "+c+". Are you running this code in a hidden iframe on Firefox? See http://bit.ly/getsizebug1"),c}}(),k=b("boxSizing")){var e=document.createElement("div");e.style.width="200px",e.style.padding="1px 2px 3px 4px",e.style.borderStyle="solid",e.style.borderWidth="1px 2px 3px 4px",e.style[k]="border-box";var f=document.body||document.documentElement;f.appendChild(e);var h=j(e);l=200===c(h.width),f.removeChild(e)}}}function f(a){if(d(),"string"==typeof a&&(a=document.querySelector(a)),a&&"object"==typeof a&&a.nodeType){var b=j(a);if("none"===b.display)return e();var f={};f.width=a.offsetWidth,f.height=a.offsetHeight;for(var g=f.isBorderBox=!(!k||!b[k]||"border-box"!==b[k]),m=0,n=h.length;n>m;m++){var o=h[m],p=b[o];p=i(a,p);var q=parseFloat(p);f[o]=isNaN(q)?0:q}var r=f.paddingLeft+f.paddingRight,s=f.paddingTop+f.paddingBottom,t=f.marginLeft+f.marginRight,u=f.marginTop+f.marginBottom,v=f.borderLeftWidth+f.borderRightWidth,w=f.borderTopWidth+f.borderBottomWidth,x=g&&l,y=c(b.width);y!==!1&&(f.width=y+(x?0:r+v));var z=c(b.height);return z!==!1&&(f.height=z+(x?0:s+w)),f.innerWidth=f.width-(r+v),f.innerHeight=f.height-(s+w),f.outerWidth=f.width+t,f.outerHeight=f.height+u,f}}function i(b,c){if(a.getComputedStyle||-1===c.indexOf("%"))return c;var d=b.style,e=d.left,f=b.runtimeStyle,g=f&&f.left;return g&&(f.left=b.currentStyle.left),d.left=c,c=d.pixelLeft,d.left=e,g&&(f.left=g),c}var j,k,l,m=!1;return f}var g="undefined"==typeof console?d:function(a){console.error(a)},h=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];"function"==typeof define&&define.amd?define("get-size/get-size",["get-style-property/get-style-property"],f):"object"==typeof exports?module.exports=f(require("desandro-get-style-property")):a.getSize=f(a.getStyleProperty)}(window),function(a){function b(a){"function"==typeof a&&(b.isReady?a():g.push(a))}function c(a){var c="readystatechange"===a.type&&"complete"!==f.readyState;b.isReady||c||d()}function d(){b.isReady=!0;for(var a=0,c=g.length;c>a;a++){var d=g[a];d()}}function e(e){return"complete"===f.readyState?d():(e.bind(f,"DOMContentLoaded",c),e.bind(f,"readystatechange",c),e.bind(a,"load",c)),b}var f=a.document,g=[];b.isReady=!1,"function"==typeof define&&define.amd?define("doc-ready/doc-ready",["eventie/eventie"],e):"object"==typeof exports?module.exports=e(require("eventie")):a.docReady=e(a.eventie)}(window),function(a){"use strict";function b(a,b){return a[g](b)}function c(a){if(!a.parentNode){var b=document.createDocumentFragment();b.appendChild(a)}}function d(a,b){c(a);for(var d=a.parentNode.querySelectorAll(b),e=0,f=d.length;f>e;e++)if(d[e]===a)return!0;return!1}function e(a,d){return c(a),b(a,d)}var f,g=function(){if(a.matches)return"matches";if(a.matchesSelector)return"matchesSelector";for(var b=["webkit","moz","ms","o"],c=0,d=b.length;d>c;c++){var e=b[c],f=e+"MatchesSelector";if(a[f])return f}}();if(g){var h=document.createElement("div"),i=b(h,"div");f=i?b:e}else f=d;"function"==typeof define&&define.amd?define("matches-selector/matches-selector",[],function(){return f}):"object"==typeof exports?module.exports=f:window.matchesSelector=f}(Element.prototype),function(a,b){"use strict";"function"==typeof define&&define.amd?define("fizzy-ui-utils/utils",["doc-ready/doc-ready","matches-selector/matches-selector"],function(c,d){return b(a,c,d)}):"object"==typeof exports?module.exports=b(a,require("doc-ready"),require("desandro-matches-selector")):a.fizzyUIUtils=b(a,a.docReady,a.matchesSelector)}(window,function(a,b,c){var d={};d.extend=function(a,b){for(var c in b)a[c]=b[c];return a},d.modulo=function(a,b){return(a%b+b)%b};var e=Object.prototype.toString;d.isArray=function(a){return"[object Array]"==e.call(a)},d.makeArray=function(a){var b=[];if(d.isArray(a))b=a;else if(a&&"number"==typeof a.length)for(var c=0,e=a.length;e>c;c++)b.push(a[c]);else b.push(a);return b},d.indexOf=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},d.removeFrom=function(a,b){var c=d.indexOf(a,b);-1!=c&&a.splice(c,1)},d.isElement="function"==typeof HTMLElement||"object"==typeof HTMLElement?function(a){return a instanceof HTMLElement}:function(a){return a&&"object"==typeof a&&1==a.nodeType&&"string"==typeof a.nodeName},d.setText=function(){function a(a,c){b=b||(void 0!==document.documentElement.textContent?"textContent":"innerText"),a[b]=c}var b;return a}(),d.getParent=function(a,b){for(;a!=document.body;)if(a=a.parentNode,c(a,b))return a},d.getQueryElement=function(a){return"string"==typeof a?document.querySelector(a):a},d.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},d.filterFindElements=function(a,b){a=d.makeArray(a);for(var e=[],f=0,g=a.length;g>f;f++){var h=a[f];if(d.isElement(h))if(b){c(h,b)&&e.push(h);for(var i=h.querySelectorAll(b),j=0,k=i.length;k>j;j++)e.push(i[j])}else e.push(h)}return e},d.debounceMethod=function(a,b,c){var d=a.prototype[b],e=b+"Timeout";a.prototype[b]=function(){var a=this[e];a&&clearTimeout(a);var b=arguments,f=this;this[e]=setTimeout(function(){d.apply(f,b),delete f[e]},c||100)}},d.toDashed=function(a){return a.replace(/(.)([A-Z])/g,function(a,b,c){return b+"-"+c}).toLowerCase()};var f=a.console;return d.htmlInit=function(c,e){b(function(){for(var b=d.toDashed(e),g=document.querySelectorAll(".js-"+b),h="data-"+b+"-options",i=0,j=g.length;j>i;i++){var k,l=g[i],m=l.getAttribute(h);try{k=m&&JSON.parse(m)}catch(n){f&&f.error("Error parsing "+h+" on "+l.nodeName.toLowerCase()+(l.id?"#"+l.id:"")+": "+n);continue}var o=new c(l,k),p=a.jQuery;p&&p.data(l,e,o)}})},d}),function(a,b){"use strict";"function"==typeof define&&define.amd?define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property","fizzy-ui-utils/utils"],function(c,d,e,f){return b(a,c,d,e,f)}):"object"==typeof exports?module.exports=b(a,require("wolfy87-eventemitter"),require("get-size"),require("desandro-get-style-property"),require("fizzy-ui-utils")):(a.Outlayer={},a.Outlayer.Item=b(a,a.EventEmitter,a.getSize,a.getStyleProperty,a.fizzyUIUtils))}(window,function(a,b,c,d,e){"use strict";function f(a){for(var b in a)return!1;return b=null,!0}function g(a,b){a&&(this.element=a,this.layout=b,this.position={x:0,y:0},this._create())}function h(a){return a.replace(/([A-Z])/g,function(a){return"-"+a.toLowerCase()})}var i=a.getComputedStyle,j=i?function(a){return i(a,null)}:function(a){return a.currentStyle},k=d("transition"),l=d("transform"),m=k&&l,n=!!d("perspective"),o={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[k],p=["transform","transition","transitionDuration","transitionProperty"],q=function(){for(var a={},b=0,c=p.length;c>b;b++){var e=p[b],f=d(e);f&&f!==e&&(a[e]=f)}return a}();e.extend(g.prototype,b.prototype),g.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},g.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},g.prototype.getSize=function(){this.size=c(this.element)},g.prototype.css=function(a){var b=this.element.style;for(var c in a){var d=q[c]||c;b[d]=a[c]}},g.prototype.getPosition=function(){var a=j(this.element),b=this.layout.options,c=b.isOriginLeft,d=b.isOriginTop,e=a[c?"left":"right"],f=a[d?"top":"bottom"],g=parseInt(e,10),h=parseInt(f,10),i=this.layout.size;g=-1!=e.indexOf("%")?g/100*i.width:g,h=-1!=f.indexOf("%")?h/100*i.height:h,g=isNaN(g)?0:g,h=isNaN(h)?0:h,g-=c?i.paddingLeft:i.paddingRight,h-=d?i.paddingTop:i.paddingBottom,this.position.x=g,this.position.y=h},g.prototype.layoutPosition=function(){var a=this.layout.size,b=this.layout.options,c={},d=b.isOriginLeft?"paddingLeft":"paddingRight",e=b.isOriginLeft?"left":"right",f=b.isOriginLeft?"right":"left",g=this.position.x+a[d];c[e]=this.getXValue(g),c[f]="";var h=b.isOriginTop?"paddingTop":"paddingBottom",i=b.isOriginTop?"top":"bottom",j=b.isOriginTop?"bottom":"top",k=this.position.y+a[h];c[i]=this.getYValue(k),c[j]="",this.css(c),this.emitEvent("layout",[this])},g.prototype.getXValue=function(a){var b=this.layout.options;return b.percentPosition&&!b.isHorizontal?a/this.layout.size.width*100+"%":a+"px"},g.prototype.getYValue=function(a){var b=this.layout.options;return b.percentPosition&&b.isHorizontal?a/this.layout.size.height*100+"%":a+"px"},g.prototype._transitionTo=function(a,b){this.getPosition();var c=this.position.x,d=this.position.y,e=parseInt(a,10),f=parseInt(b,10),g=e===this.position.x&&f===this.position.y;if(this.setPosition(a,b),g&&!this.isTransitioning)return void this.layoutPosition();var h=a-c,i=b-d,j={};j.transform=this.getTranslate(h,i),this.transition({to:j,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},g.prototype.getTranslate=function(a,b){var c=this.layout.options;return a=c.isOriginLeft?a:-a,b=c.isOriginTop?b:-b,a=this.getXValue(a),b=this.getYValue(b),n?"translate3d("+a+", "+b+", 0)":"translate("+a+", "+b+")"},g.prototype.goTo=function(a,b){this.setPosition(a,b),this.layoutPosition()},g.prototype.moveTo=m?g.prototype._transitionTo:g.prototype.goTo,g.prototype.setPosition=function(a,b){this.position.x=parseInt(a,10),this.position.y=parseInt(b,10)},g.prototype._nonTransition=function(a){this.css(a.to),a.isCleaning&&this._removeStyles(a.to);for(var b in a.onTransitionEnd)a.onTransitionEnd[b].call(this)},g.prototype._transition=function(a){if(!parseFloat(this.layout.options.transitionDuration))return void this._nonTransition(a);var b=this._transn;for(var c in a.onTransitionEnd)b.onEnd[c]=a.onTransitionEnd[c];for(c in a.to)b.ingProperties[c]=!0,a.isCleaning&&(b.clean[c]=!0);if(a.from){this.css(a.from);var d=this.element.offsetHeight;d=null}this.enableTransition(a.to),this.css(a.to),this.isTransitioning=!0};var r="opacity,"+h(q.transform||"transform");g.prototype.enableTransition=function(){this.isTransitioning||(this.css({transitionProperty:r,transitionDuration:this.layout.options.transitionDuration}),this.element.addEventListener(o,this,!1))},g.prototype.transition=g.prototype[k?"_transition":"_nonTransition"],g.prototype.onwebkitTransitionEnd=function(a){this.ontransitionend(a)},g.prototype.onotransitionend=function(a){this.ontransitionend(a)};var s={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};g.prototype.ontransitionend=function(a){if(a.target===this.element){var b=this._transn,c=s[a.propertyName]||a.propertyName;if(delete b.ingProperties[c],f(b.ingProperties)&&this.disableTransition(),c in b.clean&&(this.element.style[a.propertyName]="",delete b.clean[c]),c in b.onEnd){var d=b.onEnd[c];d.call(this),delete b.onEnd[c]}this.emitEvent("transitionEnd",[this])}},g.prototype.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(o,this,!1),this.isTransitioning=!1},g.prototype._removeStyles=function(a){var b={};for(var c in a)b[c]="";this.css(b)};var t={transitionProperty:"",transitionDuration:""};return g.prototype.removeTransitionStyles=function(){this.css(t)},g.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element),this.css({display:""}),this.emitEvent("remove",[this])},g.prototype.remove=function(){if(!k||!parseFloat(this.layout.options.transitionDuration))return void this.removeElem();var a=this;this.once("transitionEnd",function(){a.removeElem()}),this.hide()},g.prototype.reveal=function(){delete this.isHidden,this.css({display:""});var a=this.layout.options,b={},c=this.getHideRevealTransitionEndProperty("visibleStyle");b[c]=this.onRevealTransitionEnd,this.transition({from:a.hiddenStyle,to:a.visibleStyle,isCleaning:!0,onTransitionEnd:b})},g.prototype.onRevealTransitionEnd=function(){this.isHidden||this.emitEvent("reveal")},g.prototype.getHideRevealTransitionEndProperty=function(a){var b=this.layout.options[a];if(b.opacity)return"opacity";for(var c in b)return c},g.prototype.hide=function(){this.isHidden=!0,this.css({display:""});var a=this.layout.options,b={},c=this.getHideRevealTransitionEndProperty("hiddenStyle");b[c]=this.onHideTransitionEnd,this.transition({from:a.visibleStyle,to:a.hiddenStyle,isCleaning:!0,onTransitionEnd:b})},g.prototype.onHideTransitionEnd=function(){this.isHidden&&(this.css({display:"none"}),this.emitEvent("hide"))},g.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},g}),function(a,b){"use strict";"function"==typeof define&&define.amd?define("outlayer/outlayer",["eventie/eventie","eventEmitter/EventEmitter","get-size/get-size","fizzy-ui-utils/utils","./item"],function(c,d,e,f,g){return b(a,c,d,e,f,g)}):"object"==typeof exports?module.exports=b(a,require("eventie"),require("wolfy87-eventemitter"),require("get-size"),require("fizzy-ui-utils"),require("./item")):a.Outlayer=b(a,a.eventie,a.EventEmitter,a.getSize,a.fizzyUIUtils,a.Outlayer.Item)}(window,function(a,b,c,d,e,f){"use strict";function g(a,b){var c=e.getQueryElement(a);if(!c)return void(h&&h.error("Bad element for "+this.constructor.namespace+": "+(c||a)));this.element=c,i&&(this.$element=i(this.element)),this.options=e.extend({},this.constructor.defaults),this.option(b);var d=++k;this.element.outlayerGUID=d,l[d]=this,this._create(),this.options.isInitLayout&&this.layout()}var h=a.console,i=a.jQuery,j=function(){},k=0,l={};return g.namespace="outlayer",g.Item=f,g.defaults={containerStyle:{position:"relative"},isInitLayout:!0,isOriginLeft:!0,isOriginTop:!0,isResizeBound:!0,isResizingContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}},e.extend(g.prototype,c.prototype),g.prototype.option=function(a){e.extend(this.options,a)},g.prototype._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),e.extend(this.element.style,this.options.containerStyle),this.options.isResizeBound&&this.bindResize()},g.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)},g.prototype._itemize=function(a){for(var b=this._filterFindItemElements(a),c=this.constructor.Item,d=[],e=0,f=b.length;f>e;e++){var g=b[e],h=new c(g,this);d.push(h)}return d},g.prototype._filterFindItemElements=function(a){return e.filterFindElements(a,this.options.itemSelector)},g.prototype.getItemElements=function(){for(var a=[],b=0,c=this.items.length;c>b;b++)a.push(this.items[b].element);return a},g.prototype.layout=function(){this._resetLayout(),this._manageStamps();var a=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,a),this._isLayoutInited=!0},g.prototype._init=g.prototype.layout,g.prototype._resetLayout=function(){this.getSize()},g.prototype.getSize=function(){this.size=d(this.element)},g.prototype._getMeasurement=function(a,b){var c,f=this.options[a];f?("string"==typeof f?c=this.element.querySelector(f):e.isElement(f)&&(c=f),this[a]=c?d(c)[b]:f):this[a]=0},g.prototype.layoutItems=function(a,b){a=this._getItemsForLayout(a),this._layoutItems(a,b),this._postLayout()},g.prototype._getItemsForLayout=function(a){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c];e.isIgnored||b.push(e)}return b},g.prototype._layoutItems=function(a,b){if(this._emitCompleteOnItems("layout",a),a&&a.length){for(var c=[],d=0,e=a.length;e>d;d++){var f=a[d],g=this._getItemLayoutPosition(f);g.item=f,g.isInstant=b||f.isLayoutInstant,c.push(g)}this._processLayoutQueue(c)}},g.prototype._getItemLayoutPosition=function(){return{x:0,y:0}},g.prototype._processLayoutQueue=function(a){for(var b=0,c=a.length;c>b;b++){var d=a[b];this._positionItem(d.item,d.x,d.y,d.isInstant)}},g.prototype._positionItem=function(a,b,c,d){d?a.goTo(b,c):a.moveTo(b,c)},g.prototype._postLayout=function(){this.resizeContainer()},g.prototype.resizeContainer=function(){if(this.options.isResizingContainer){var a=this._getContainerSize();a&&(this._setContainerMeasure(a.width,!0),this._setContainerMeasure(a.height,!1))}},g.prototype._getContainerSize=j,g.prototype._setContainerMeasure=function(a,b){if(void 0!==a){var c=this.size;c.isBorderBox&&(a+=b?c.paddingLeft+c.paddingRight+c.borderLeftWidth+c.borderRightWidth:c.paddingBottom+c.paddingTop+c.borderTopWidth+c.borderBottomWidth),a=Math.max(a,0),this.element.style[b?"width":"height"]=a+"px"}},g.prototype._emitCompleteOnItems=function(a,b){function c(){e.dispatchEvent(a+"Complete",null,[b])}function d(){g++,g===f&&c()}var e=this,f=b.length;if(!b||!f)return void c();for(var g=0,h=0,i=b.length;i>h;h++){var j=b[h];j.once(a,d)}},g.prototype.dispatchEvent=function(a,b,c){var d=b?[b].concat(c):c;if(this.emitEvent(a,d),i)if(this.$element=this.$element||i(this.element),b){var e=i.Event(b);e.type=a,this.$element.trigger(e,c)}else this.$element.trigger(a,c)},g.prototype.ignore=function(a){var b=this.getItem(a);b&&(b.isIgnored=!0)},g.prototype.unignore=function(a){var b=this.getItem(a);b&&delete b.isIgnored},g.prototype.stamp=function(a){if(a=this._find(a)){this.stamps=this.stamps.concat(a);for(var b=0,c=a.length;c>b;b++){var d=a[b];this.ignore(d)}}},g.prototype.unstamp=function(a){if(a=this._find(a))for(var b=0,c=a.length;c>b;b++){var d=a[b];e.removeFrom(this.stamps,d),this.unignore(d)}},g.prototype._find=function(a){return a?("string"==typeof a&&(a=this.element.querySelectorAll(a)),a=e.makeArray(a)):void 0},g.prototype._manageStamps=function(){if(this.stamps&&this.stamps.length){this._getBoundingRect();for(var a=0,b=this.stamps.length;b>a;a++){var c=this.stamps[a];this._manageStamp(c)}}},g.prototype._getBoundingRect=function(){var a=this.element.getBoundingClientRect(),b=this.size;this._boundingRect={left:a.left+b.paddingLeft+b.borderLeftWidth,top:a.top+b.paddingTop+b.borderTopWidth,right:a.right-(b.paddingRight+b.borderRightWidth),bottom:a.bottom-(b.paddingBottom+b.borderBottomWidth)}},g.prototype._manageStamp=j,g.prototype._getElementOffset=function(a){var b=a.getBoundingClientRect(),c=this._boundingRect,e=d(a),f={left:b.left-c.left-e.marginLeft,top:b.top-c.top-e.marginTop,right:c.right-b.right-e.marginRight,bottom:c.bottom-b.bottom-e.marginBottom};return f},g.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},g.prototype.bindResize=function(){this.isResizeBound||(b.bind(a,"resize",this),this.isResizeBound=!0)},g.prototype.unbindResize=function(){this.isResizeBound&&b.unbind(a,"resize",this),this.isResizeBound=!1},g.prototype.onresize=function(){function a(){b.resize(),delete b.resizeTimeout}this.resizeTimeout&&clearTimeout(this.resizeTimeout);var b=this;this.resizeTimeout=setTimeout(a,100)},g.prototype.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},g.prototype.needsResizeLayout=function(){var a=d(this.element),b=this.size&&a;return b&&a.innerWidth!==this.size.innerWidth},g.prototype.addItems=function(a){var b=this._itemize(a);return b.length&&(this.items=this.items.concat(b)),b},g.prototype.appended=function(a){var b=this.addItems(a);b.length&&(this.layoutItems(b,!0),this.reveal(b))},g.prototype.prepended=function(a){var b=this._itemize(a);if(b.length){var c=this.items.slice(0);this.items=b.concat(c),this._resetLayout(),this._manageStamps(),this.layoutItems(b,!0),this.reveal(b),this.layoutItems(c)}},g.prototype.reveal=function(a){this._emitCompleteOnItems("reveal",a);for(var b=a&&a.length,c=0;b&&b>c;c++){var d=a[c];d.reveal()}},g.prototype.hide=function(a){this._emitCompleteOnItems("hide",a);for(var b=a&&a.length,c=0;b&&b>c;c++){var d=a[c];d.hide()}},g.prototype.revealItemElements=function(a){var b=this.getItems(a);this.reveal(b)},g.prototype.hideItemElements=function(a){var b=this.getItems(a);this.hide(b)},g.prototype.getItem=function(a){for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];if(d.element===a)return d}},g.prototype.getItems=function(a){a=e.makeArray(a);for(var b=[],c=0,d=a.length;d>c;c++){var f=a[c],g=this.getItem(f);g&&b.push(g)}return b},g.prototype.remove=function(a){var b=this.getItems(a);if(this._emitCompleteOnItems("remove",b),b&&b.length)for(var c=0,d=b.length;d>c;c++){var f=b[c];f.remove(),e.removeFrom(this.items,f)}},g.prototype.destroy=function(){var a=this.element.style;a.height="",a.position="",a.width="";for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];d.destroy()}this.unbindResize();var e=this.element.outlayerGUID;delete l[e],delete this.element.outlayerGUID,i&&i.removeData(this.element,this.constructor.namespace)},g.data=function(a){a=e.getQueryElement(a);var b=a&&a.outlayerGUID;return b&&l[b]},g.create=function(a,b){function c(){g.apply(this,arguments)}return Object.create?c.prototype=Object.create(g.prototype):e.extend(c.prototype,g.prototype),c.prototype.constructor=c,c.defaults=e.extend({},g.defaults),e.extend(c.defaults,b),c.prototype.settings={},c.namespace=a,c.data=g.data,c.Item=function(){f.apply(this,arguments)},c.Item.prototype=new f,e.htmlInit(c,a),i&&i.bridget&&i.bridget(a,c),c},g.Item=f,g}),function(a,b){"use strict";"function"==typeof define&&define.amd?define("isotopeMB/js/item",["outlayer/outlayer"],b):"object"==typeof exports?module.exports=b(require("outlayer")):(a.IsotopeMB=a.IsotopeMB||{},a.IsotopeMB.Item=b(a.Outlayer))}(window,function(a){"use strict";function b(){a.Item.apply(this,arguments)}b.prototype=new a.Item,b.prototype._create=function(){this.id=this.layout.itemGUID++,a.Item.prototype._create.call(this),this.sortData={}},b.prototype.updateSortData=function(){if(!this.isIgnored){this.sortData.id=this.id,this.sortData["original-order"]=this.id,this.sortData.random=Math.random();var a=this.layout.options.getSortData,b=this.layout._sorters;for(var c in a){var d=b[c];this.sortData[c]=d(this.element,this)}}};var c=b.prototype.destroy;return b.prototype.destroy=function(){c.apply(this,arguments),this.css({display:""})},b}),function(a,b){"use strict";"function"==typeof define&&define.amd?define("isotopeMB/js/layout-mode",["get-size/get-size","outlayer/outlayer"],b):"object"==typeof exports?module.exports=b(require("get-size"),require("outlayer")):(a.IsotopeMB=a.IsotopeMB||{},a.IsotopeMB.LayoutMode=b(a.getSize,a.Outlayer))}(window,function(a,b){"use strict";function c(a){this.isotopeMB=a,a&&(this.options=a.options[this.namespace],this.element=a.element,this.items=a.filteredItems,this.size=a.size)}return function(){function a(a){return function(){return b.prototype[a].apply(this.isotopeMB,arguments)}}for(var d=["_resetLayout","_getItemLayoutPosition","_manageStamp","_getContainerSize","_getElementOffset","needsResizeLayout"],e=0,f=d.length;f>e;e++){var g=d[e];c.prototype[g]=a(g)}}(),c.prototype.needsVerticalResizeLayout=function(){var b=a(this.isotopeMB.element),c=this.isotopeMB.size&&b;return c&&b.innerHeight!=this.isotopeMB.size.innerHeight},c.prototype._getMeasurement=function(){this.isotopeMB._getMeasurement.apply(this,arguments)},c.prototype.getColumnWidth=function(){this.getSegmentSize("column","Width")},c.prototype.getRowHeight=function(){this.getSegmentSize("row","Height")},c.prototype.getSegmentSize=function(a,b){var c=a+b,d="outer"+b;if(this._getMeasurement(c,d),!this[c]){var e=this.getFirstItemSize();this[c]=e&&e[d]||this.isotopeMB.size["inner"+b]}},c.prototype.getFirstItemSize=function(){var b=this.isotopeMB.filteredItems[0];return b&&b.element&&a(b.element)},c.prototype.layout=function(){this.isotopeMB.layout.apply(this.isotopeMB,arguments)},c.prototype.getSize=function(){this.isotopeMB.getSize(),this.size=this.isotopeMB.size},c.modes={},c.create=function(a,b){function d(){c.apply(this,arguments)}return d.prototype=new c,b&&(d.options=b),d.prototype.namespace=a,c.modes[a]=d,d},c}),function(a,b){"use strict";"function"==typeof define&&define.amd?define("masonry/masonry",["outlayer/outlayer","get-size/get-size","fizzy-ui-utils/utils"],b):"object"==typeof exports?module.exports=b(require("outlayer"),require("get-size"),require("fizzy-ui-utils")):a.Masonry=b(a.Outlayer,a.getSize,a.fizzyUIUtils)}(window,function(a,b,c){var d=a.create("masonry");return d.prototype._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns();var a=this.cols;for(this.colYs=[];a--;)this.colYs.push(0);this.maxY=0},d.prototype.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var a=this.items[0],c=a&&a.element;this.columnWidth=c&&b(c).outerWidth||this.containerWidth}var d=this.columnWidth+=this.gutter,e=this.containerWidth+this.gutter,f=e/d,g=d-e%d,h=g&&1>g?"round":"floor";f=Math[h](f),this.cols=Math.max(f,1)},d.prototype.getContainerWidth=function(){var a=this.options.isFitWidth?this.element.parentNode:this.element,c=b(a);this.containerWidth=c&&c.innerWidth},d.prototype._getItemLayoutPosition=function(a){a.getSize();var b=a.size.outerWidth%this.columnWidth,d=b&&1>b?"round":"ceil",e=Math[d](a.size.outerWidth/this.columnWidth);e=Math.min(e,this.cols);for(var f=this._getColGroup(e),g=Math.min.apply(Math,f),h=c.indexOf(f,g),i={x:this.columnWidth*h,y:g},j=g+a.size.outerHeight,k=this.cols+1-f.length,l=0;k>l;l++)this.colYs[h+l]=j;return i},d.prototype._getColGroup=function(a){if(2>a)return this.colYs;for(var b=[],c=this.cols+1-a,d=0;c>d;d++){var e=this.colYs.slice(d,d+a);b[d]=Math.max.apply(Math,e)}return b},d.prototype._manageStamp=function(a){var c=b(a),d=this._getElementOffset(a),e=this.options.isOriginLeft?d.left:d.right,f=e+c.outerWidth,g=Math.floor(e/this.columnWidth);g=Math.max(0,g);var h=Math.floor(f/this.columnWidth);h-=f%this.columnWidth?0:1,h=Math.min(this.cols-1,h);for(var i=(this.options.isOriginTop?d.top:d.bottom)+c.outerHeight,j=g;h>=j;j++)this.colYs[j]=Math.max(i,this.colYs[j])},d.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var a={height:this.maxY};return this.options.isFitWidth&&(a.width=this._getContainerFitWidth()),a},d.prototype._getContainerFitWidth=function(){for(var a=0,b=this.cols;--b&&0===this.colYs[b];)a++;return(this.cols-a)*this.columnWidth-this.gutter},d.prototype.needsResizeLayout=function(){var a=this.containerWidth;return this.getContainerWidth(),a!==this.containerWidth},d}),function(a,b){"use strict";"function"==typeof define&&define.amd?define("isotopeMB/js/layout-modes/masonry",["../layout-mode","masonry/masonry"],b):"object"==typeof exports?module.exports=b(require("../layout-mode"),require("masonry-layout")):b(a.IsotopeMB.LayoutMode,a.Masonry)}(window,function(a,b){"use strict";function c(a,b){for(var c in b)a[c]=b[c];return a}var d=a.create("masonry"),e=d.prototype._getElementOffset,f=d.prototype.layout,g=d.prototype._getMeasurement;
c(d.prototype,b.prototype),d.prototype._getElementOffset=e,d.prototype.layout=f,d.prototype._getMeasurement=g;var h=d.prototype.measureColumns;d.prototype.measureColumns=function(){this.items=this.isotopeMB.filteredItems,h.call(this)};var i=d.prototype._manageStamp;return d.prototype._manageStamp=function(){this.options.isOriginLeft=this.isotopeMB.options.isOriginLeft,this.options.isOriginTop=this.isotopeMB.options.isOriginTop,i.apply(this,arguments)},d}),function(a,b){"use strict";"function"==typeof define&&define.amd?define("isotopeMB/js/layout-modes/fit-rows",["../layout-mode"],b):"object"==typeof exports?module.exports=b(require("../layout-mode")):b(a.IsotopeMB.LayoutMode)}(window,function(a){"use strict";var b=a.create("fitRows");return b.prototype._resetLayout=function(){this.x=0,this.y=0,this.maxY=0,this._getMeasurement("gutter","outerWidth")},b.prototype._getItemLayoutPosition=function(a){a.getSize();var b=a.size.outerWidth+this.gutter,c=this.isotopeMB.size.innerWidth+this.gutter;0!==this.x&&b+this.x>c&&(this.x=0,this.y=this.maxY);var d={x:this.x,y:this.y};return this.maxY=Math.max(this.maxY,this.y+a.size.outerHeight),this.x+=b,d},b.prototype._getContainerSize=function(){return{height:this.maxY}},b}),function(a,b){"use strict";"function"==typeof define&&define.amd?define("isotopeMB/js/layout-modes/vertical",["../layout-mode"],b):"object"==typeof exports?module.exports=b(require("../layout-mode")):b(a.IsotopeMB.LayoutMode)}(window,function(a){"use strict";var b=a.create("vertical",{horizontalAlignment:0});return b.prototype._resetLayout=function(){this.y=0},b.prototype._getItemLayoutPosition=function(a){a.getSize();var b=(this.isotopeMB.size.innerWidth-a.size.outerWidth)*this.options.horizontalAlignment,c=this.y;return this.y+=a.size.outerHeight,{x:b,y:c}},b.prototype._getContainerSize=function(){return{height:this.y}},b}),function(a,b){"use strict";"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size","matches-selector/matches-selector","fizzy-ui-utils/utils","isotopeMB/js/item","isotopeMB/js/layout-mode","isotopeMB/js/layout-modes/masonry","isotopeMB/js/layout-modes/fit-rows","isotopeMB/js/layout-modes/vertical"],function(c,d,e,f,g,h){return b(a,c,d,e,f,g,h)}):"object"==typeof exports?module.exports=b(a,require("outlayer"),require("get-size"),require("desandro-matches-selector"),require("fizzy-ui-utils"),require("./item"),require("./layout-mode"),require("./layout-modes/masonry"),require("./layout-modes/fit-rows"),require("./layout-modes/vertical")):a.IsotopeMB=b(a,a.Outlayer,a.getSize,a.matchesSelector,a.fizzyUIUtils,a.IsotopeMB.Item,a.IsotopeMB.LayoutMode)}(window,function(a,b,c,d,e,f,g){function h(a,b){return function(c,d){for(var e=0,f=a.length;f>e;e++){var g=a[e],h=c.sortData[g],i=d.sortData[g];if(h>i||i>h){var j=void 0!==b[g]?b[g]:b,k=j?1:-1;return(h>i?1:-1)*k}}return 0}}var i=a.jQuery,j=String.prototype.trim?function(a){return a.trim()}:function(a){return a.replace(/^\s+|\s+$/g,"")},k=document.documentElement,l=k.textContent?function(a){return a.textContent}:function(a){return a.innerText},m=b.create("isotopeMB",{layoutMode:"masonry",isJQueryFiltering:!0,sortAscending:!0});m.Item=f,m.LayoutMode=g,m.prototype._create=function(){this.itemGUID=0,this._sorters={},this._getSorters(),b.prototype._create.call(this),this.modes={},this.filteredItems=this.items,this.sortHistory=["original-order"];for(var a in g.modes)this._initLayoutMode(a)},m.prototype.reloadItems=function(){this.itemGUID=0,b.prototype.reloadItems.call(this)},m.prototype._itemize=function(){for(var a=b.prototype._itemize.apply(this,arguments),c=0,d=a.length;d>c;c++){var e=a[c];e.id=this.itemGUID++}return this._updateItemsSortData(a),a},m.prototype._initLayoutMode=function(a){var b=g.modes[a],c=this.options[a]||{};this.options[a]=b.options?e.extend(b.options,c):c,this.modes[a]=new b(this)},m.prototype.layout=function(){return!this._isLayoutInited&&this.options.isInitLayout?void this.arrange():void this._layout()},m.prototype._layout=function(){var a=this._getIsInstant();this._resetLayout(),this._manageStamps(),this.layoutItems(this.filteredItems,a),this._isLayoutInited=!0},m.prototype.arrange=function(a){function b(){d.reveal(c.needReveal),d.hide(c.needHide)}this.option(a),this._getIsInstant();var c=this._filter(this.items);this.filteredItems=c.matches;var d=this;this._bindArrangeComplete(),this._isInstant?this._noTransition(b):b(),this._sort(),this._layout()},m.prototype._init=m.prototype.arrange,m.prototype._getIsInstant=function(){var a=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;return this._isInstant=a,a},m.prototype._bindArrangeComplete=function(){function a(){b&&c&&d&&e.dispatchEvent("arrangeComplete",null,[e.filteredItems])}var b,c,d,e=this;this.once("layoutComplete",function(){b=!0,a()}),this.once("hideComplete",function(){c=!0,a()}),this.once("revealComplete",function(){d=!0,a()})},m.prototype._filter=function(a){var b=this.options.filter;b=b||"*";for(var c=[],d=[],e=[],f=this._getFilterTest(b),g=0,h=a.length;h>g;g++){var i=a[g];if(!i.isIgnored){var j=f(i);j&&c.push(i),j&&i.isHidden?d.push(i):j||i.isHidden||e.push(i)}}return{matches:c,needReveal:d,needHide:e}},m.prototype._getFilterTest=function(a){return i&&this.options.isJQueryFiltering?function(b){return i(b.element).is(a)}:"function"==typeof a?function(b){return a(b.element)}:function(b){return d(b.element,a)}},m.prototype.updateSortData=function(a){var b;a?(a=e.makeArray(a),b=this.getItems(a)):b=this.items,this._getSorters(),this._updateItemsSortData(b)},m.prototype._getSorters=function(){var a=this.options.getSortData;for(var b in a){var c=a[b];this._sorters[b]=n(c)}},m.prototype._updateItemsSortData=function(a){for(var b=a&&a.length,c=0;b&&b>c;c++){var d=a[c];d.updateSortData()}};var n=function(){function a(a){if("string"!=typeof a)return a;var c=j(a).split(" "),d=c[0],e=d.match(/^\[(.+)\]$/),f=e&&e[1],g=b(f,d),h=m.sortDataParsers[c[1]];return a=h?function(a){return a&&h(g(a))}:function(a){return a&&g(a)}}function b(a,b){var c;return c=a?function(b){return b.getAttribute(a)}:function(a){var c=a.querySelector(b);return c&&l(c)}}return a}();m.sortDataParsers={parseInt:function(a){return parseInt(a,10)},parseFloat:function(a){return parseFloat(a)}},m.prototype._sort=function(){var a=this.options.sortBy;if(a){var b=[].concat.apply(a,this.sortHistory),c=h(b,this.options.sortAscending);this.filteredItems.sort(c),a!=this.sortHistory[0]&&this.sortHistory.unshift(a)}},m.prototype._mode=function(){var a=this.options.layoutMode,b=this.modes[a];if(!b)throw new Error("No layout mode: "+a);return b.options=this.options[a],b},m.prototype._resetLayout=function(){b.prototype._resetLayout.call(this),this._mode()._resetLayout()},m.prototype._getItemLayoutPosition=function(a){return this._mode()._getItemLayoutPosition(a)},m.prototype._manageStamp=function(a){this._mode()._manageStamp(a)},m.prototype._getContainerSize=function(){return this._mode()._getContainerSize()},m.prototype.needsResizeLayout=function(){return this._mode().needsResizeLayout()},m.prototype.appended=function(a){var b=this.addItems(a);if(b.length){var c=this._filterRevealAdded(b);this.filteredItems=this.filteredItems.concat(c)}},m.prototype.prepended=function(a){var b=this._itemize(a);if(b.length){this._resetLayout(),this._manageStamps();var c=this._filterRevealAdded(b);this.layoutItems(this.filteredItems),this.filteredItems=c.concat(this.filteredItems),this.items=b.concat(this.items)}},m.prototype._filterRevealAdded=function(a){var b=this._filter(a);return this.hide(b.needHide),this.reveal(b.matches),this.layoutItems(b.matches,!0),b.matches},m.prototype.insert=function(a){var b=this.addItems(a);if(b.length){var c,d,e=b.length;for(c=0;e>c;c++)d=b[c],this.element.appendChild(d.element);var f=this._filter(b).matches;for(c=0;e>c;c++)b[c].isLayoutInstant=!0;for(this.arrange(),c=0;e>c;c++)delete b[c].isLayoutInstant;this.reveal(f)}};var o=m.prototype.remove;return m.prototype.remove=function(a){a=e.makeArray(a);var b=this.getItems(a);o.call(this,a);var c=b&&b.length;if(c)for(var d=0;c>d;d++){var f=b[d];e.removeFrom(this.filteredItems,f)}},m.prototype.shuffle=function(){for(var a=0,b=this.items.length;b>a;a++){var c=this.items[a];c.sortData.random=Math.random()}this.options.sortBy="random",this._sort(),this._layout()},m.prototype._noTransition=function(a){var b=this.options.transitionDuration;this.options.transitionDuration=0;var c=a.call(this);return this.options.transitionDuration=b,c},m.prototype.getFilteredItemElements=function(){for(var a=[],b=0,c=this.filteredItems.length;c>b;b++)a.push(this.filteredItems[b].element);return a},m});
/*! Magnific Popup - v0.9.9 - 2014-09-06
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2014 Dmitry Semenov; */
;(function($) {

/*>>core*/
/**
 * 
 * Magnific Popup Core JS file
 * 
 */


/**
 * Private static constants
 */
var CLOSE_EVENT = 'Close',
	BEFORE_CLOSE_EVENT = 'BeforeClose',
	AFTER_CLOSE_EVENT = 'AfterClose',
	BEFORE_APPEND_EVENT = 'BeforeAppend',
	MARKUP_PARSE_EVENT = 'MarkupParse',
	OPEN_EVENT = 'Open',
	CHANGE_EVENT = 'Change',
	NS = 'mfp',
	EVENT_NS = '.' + NS,
	READY_CLASS = 'mfp-ready',
	REMOVING_CLASS = 'mfp-removing',
	PREVENT_CLOSE_CLASS = 'mfp-prevent-close';


/**
 * Private vars 
 */
var mfp, // As we have only one instance of MagnificPopup object, we define it locally to not to use 'this'
	MagnificPopup = function(){},
	_isJQ = !!(window.jQuery),
	_prevStatus,
	_window = $(window),
	_body,
	_document,
	_prevContentType,
	_wrapClasses,
	_currPopupType;


/**
 * Private functions
 */
var _mfpOn = function(name, f) {
		mfp.ev.on(NS + name + EVENT_NS, f);
	},
	_getEl = function(className, appendTo, html, raw) {
		var el = document.createElement('div');
		el.className = 'mfp-'+className;
		if(html) {
			el.innerHTML = html;
		}
		if(!raw) {
			el = $(el);
			if(appendTo) {
				el.appendTo(appendTo);
			}
		} else if(appendTo) {
			appendTo.appendChild(el);
		}
		return el;
	},
	_mfpTrigger = function(e, data) {
		mfp.ev.triggerHandler(NS + e, data);

		if(mfp.st.callbacks) {
			// converts "mfpEventName" to "eventName" callback and triggers it if it's present
			e = e.charAt(0).toLowerCase() + e.slice(1);
			if(mfp.st.callbacks[e]) {
				mfp.st.callbacks[e].apply(mfp, $.isArray(data) ? data : [data]);
			}
		}
	},
	_getCloseBtn = function(type) {
		if(type !== _currPopupType || !mfp.currTemplate.closeBtn) {
			mfp.currTemplate.closeBtn = $( mfp.st.closeMarkup.replace('%title%', mfp.st.tClose ) );
			_currPopupType = type;
		}
		return mfp.currTemplate.closeBtn;
	},
	// Initialize Magnific Popup only when called at least once
	_checkInstance = function() {
		if(!$.magnificPopup.instance) {
			mfp = new MagnificPopup();
			mfp.init();
			$.magnificPopup.instance = mfp;
		}
	},
	// CSS transition detection, http://stackoverflow.com/questions/7264899/detect-css-transitions-using-javascript-and-without-modernizr
	supportsTransitions = function() {
		var s = document.createElement('p').style, // 's' for style. better to create an element if body yet to exist
			v = ['ms','O','Moz','Webkit']; // 'v' for vendor

		if( s['transition'] !== undefined ) {
			return true; 
		}
			
		while( v.length ) {
			if( v.pop() + 'Transition' in s ) {
				return true;
			}
		}
				
		return false;
	};



/**
 * Public functions
 */
MagnificPopup.prototype = {

	constructor: MagnificPopup,

	/**
	 * Initializes Magnific Popup plugin. 
	 * This function is triggered only once when $.fn.magnificPopup or $.magnificPopup is executed
	 */
	init: function() {
		var appVersion = navigator.appVersion;
		mfp.isIE7 = appVersion.indexOf("MSIE 7.") !== -1; 
		mfp.isIE8 = appVersion.indexOf("MSIE 8.") !== -1;
		mfp.isLowIE = mfp.isIE7 || mfp.isIE8;
		mfp.isAndroid = (/android/gi).test(appVersion);
		mfp.isIOS = (/iphone|ipad|ipod/gi).test(appVersion);
		mfp.supportsTransition = supportsTransitions();

		// We disable fixed positioned lightbox on devices that don't handle it nicely.
		// If you know a better way of detecting this - let me know.
		mfp.probablyMobile = (mfp.isAndroid || mfp.isIOS || /(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent) );
		_document = $(document);

		mfp.popupsCache = {};
	},

	/**
	 * Opens popup
	 * @param  data [description]
	 */
	open: function(data) {

		if(!_body) {
			_body = $(document.body);
		}

		var i;

		if(data.isObj === false) { 
			// convert jQuery collection to array to avoid conflicts later
			mfp.items = data.items.toArray();

			mfp.index = 0;
			var items = data.items,
				item;
			for(i = 0; i < items.length; i++) {
				item = items[i];
				if(item.parsed) {
					item = item.el[0];
				}
				if(item === data.el[0]) {
					mfp.index = i;
					break;
				}
			}
		} else {
			mfp.items = $.isArray(data.items) ? data.items : [data.items];
			mfp.index = data.index || 0;
		}

		// if popup is already opened - we just update the content
		if(mfp.isOpen) {
			mfp.updateItemHTML();
			return;
		}
		
		mfp.types = []; 
		_wrapClasses = '';
		if(data.mainEl && data.mainEl.length) {
			mfp.ev = data.mainEl.eq(0);
		} else {
			mfp.ev = _document;
		}

		if(data.key) {
			if(!mfp.popupsCache[data.key]) {
				mfp.popupsCache[data.key] = {};
			}
			mfp.currTemplate = mfp.popupsCache[data.key];
		} else {
			mfp.currTemplate = {};
		}



		mfp.st = $.extend(true, {}, $.magnificPopup.defaults, data ); 
		mfp.fixedContentPos = mfp.st.fixedContentPos === 'auto' ? !mfp.probablyMobile : mfp.st.fixedContentPos;

		if(mfp.st.modal) {
			mfp.st.closeOnContentClick = false;
			mfp.st.closeOnBgClick = false;
			mfp.st.showCloseBtn = false;
			mfp.st.enableEscapeKey = false;
		}
		

		// Building markup
		// main containers are created only once
		if(!mfp.bgOverlay) {

			// Dark overlay
			mfp.bgOverlay = _getEl('bg').on('click'+EVENT_NS, function() {
				mfp.close();
			});

			mfp.wrap = _getEl('wrap').attr('tabindex', -1).on('click'+EVENT_NS, function(e) {
				if(mfp._checkIfClose(e.target)) {
					mfp.close();
				}
			});

			mfp.container = _getEl('container', mfp.wrap);
		}

		mfp.contentContainer = _getEl('content');
		if(mfp.st.preloader) {
			mfp.preloader = _getEl('preloader', mfp.container, mfp.st.tLoading);
		}


		// Initializing modules
		var modules = $.magnificPopup.modules;
		for(i = 0; i < modules.length; i++) {
			var n = modules[i];
			n = n.charAt(0).toUpperCase() + n.slice(1);
			mfp['init'+n].call(mfp);
		}
		_mfpTrigger('BeforeOpen');


		if(mfp.st.showCloseBtn) {
			// Close button
			if(!mfp.st.closeBtnInside) {
				mfp.wrap.append( _getCloseBtn() );
			} else {
				_mfpOn(MARKUP_PARSE_EVENT, function(e, template, values, item) {
					values.close_replaceWith = _getCloseBtn(item.type);
				});
				_wrapClasses += ' mfp-close-btn-in';
			}
		}

		if(mfp.st.alignTop) {
			_wrapClasses += ' mfp-align-top';
		}

	

		if(mfp.fixedContentPos) {
			mfp.wrap.css({
				overflow: mfp.st.overflowY,
				overflowX: 'hidden',
				overflowY: mfp.st.overflowY
			});
		} else {
			mfp.wrap.css({ 
				top: _window.scrollTop(),
				position: 'absolute'
			});
		}
		if( mfp.st.fixedBgPos === false || (mfp.st.fixedBgPos === 'auto' && !mfp.fixedContentPos) ) {
			mfp.bgOverlay.css({
				height: _document.height(),
				position: 'absolute'
			});
		}

		

		if(mfp.st.enableEscapeKey) {
			// Close on ESC key
			_document.on('keyup' + EVENT_NS, function(e) {
				if(e.keyCode === 27) {
					mfp.close();
				}
			});
		}

		_window.on('resize' + EVENT_NS, function() {
			mfp.updateSize();
		});


		if(!mfp.st.closeOnContentClick) {
			_wrapClasses += ' mfp-auto-cursor';
		}
		
		if(_wrapClasses)
			mfp.wrap.addClass(_wrapClasses);


		// this triggers recalculation of layout, so we get it once to not to trigger twice
		var windowHeight = mfp.wH = _window.height();

		
		var windowStyles = {};

		if( mfp.fixedContentPos ) {
            if(mfp._hasScrollBar(windowHeight)){
                var s = mfp._getScrollbarSize();
                if(s) {
                    windowStyles.marginRight = s;
                }
            }
        }

		if(mfp.fixedContentPos) {
			if(!mfp.isIE7) {
				windowStyles.overflow = 'hidden';
			} else {
				// ie7 double-scroll bug
				$('body, html').css('overflow', 'hidden');
			}
		}

		
		
		var classesToadd = mfp.st.mainClass;
		if(mfp.isIE7) {
			classesToadd += ' mfp-ie7';
		}
		if(classesToadd) {
			mfp._addClassToMFP( classesToadd );
		}

		// add content
		mfp.updateItemHTML();

		_mfpTrigger('BuildControls');

		// remove scrollbar, add margin e.t.c
		$('html').css(windowStyles);
		
		// add everything to DOM
		mfp.bgOverlay.add(mfp.wrap).prependTo( mfp.st.prependTo || _body );

		// Save last focused element
		mfp._lastFocusedEl = document.activeElement;
		
		// Wait for next cycle to allow CSS transition
		setTimeout(function() {
			
			if(mfp.content) {
				mfp._addClassToMFP(READY_CLASS);
				mfp._setFocus();
			} else {
				// if content is not defined (not loaded e.t.c) we add class only for BG
				mfp.bgOverlay.addClass(READY_CLASS);
			}
			
			// Trap the focus in popup
			_document.on('focusin' + EVENT_NS, mfp._onFocusIn);

		}, 16);

		mfp.isOpen = true;
		mfp.updateSize(windowHeight);
		_mfpTrigger(OPEN_EVENT);

		return data;
	},

	/**
	 * Closes the popup
	 */
	close: function() {
		if(!mfp.isOpen) return;
		_mfpTrigger(BEFORE_CLOSE_EVENT);

		mfp.isOpen = false;
		// for CSS3 animation
		if(mfp.st.removalDelay && !mfp.isLowIE && mfp.supportsTransition )  {
			mfp._addClassToMFP(REMOVING_CLASS);
			setTimeout(function() {
				mfp._close();
			}, mfp.st.removalDelay);
		} else {
			mfp._close();
		}
	},

	/**
	 * Helper for close() function
	 */
	_close: function() {
		_mfpTrigger(CLOSE_EVENT);

		var classesToRemove = REMOVING_CLASS + ' ' + READY_CLASS + ' ';

		mfp.bgOverlay.detach();
		mfp.wrap.detach();
		mfp.container.empty();

		if(mfp.st.mainClass) {
			classesToRemove += mfp.st.mainClass + ' ';
		}

		mfp._removeClassFromMFP(classesToRemove);

		if(mfp.fixedContentPos) {
			var windowStyles = {marginRight: ''};
			if(mfp.isIE7) {
				$('body, html').css('overflow', '');
			} else {
				windowStyles.overflow = '';
			}
			$('html').css(windowStyles);
		}
		
		_document.off('keyup' + EVENT_NS + ' focusin' + EVENT_NS);
		mfp.ev.off(EVENT_NS);

		// clean up DOM elements that aren't removed
		mfp.wrap.attr('class', 'mfp-wrap').removeAttr('style');
		mfp.bgOverlay.attr('class', 'mfp-bg');
		mfp.container.attr('class', 'mfp-container');

		// remove close button from target element
		if(mfp.st.showCloseBtn &&
		(!mfp.st.closeBtnInside || mfp.currTemplate[mfp.currItem.type] === true)) {
			if(mfp.currTemplate.closeBtn)
				mfp.currTemplate.closeBtn.detach();
		}


		if(mfp._lastFocusedEl) {
			//$(mfp._lastFocusedEl).focus(); // put tab focus back
		}
		mfp.currItem = null;	
		mfp.content = null;
		mfp.currTemplate = null;
		mfp.prevHeight = 0;

		_mfpTrigger(AFTER_CLOSE_EVENT);
	},
	
	updateSize: function(winHeight) {

		if(mfp.isIOS) {
			// fixes iOS nav bars https://github.com/dimsemenov/Magnific-Popup/issues/2
			var zoomLevel = document.documentElement.clientWidth / window.innerWidth;
			var height = window.innerHeight * zoomLevel;
			mfp.wrap.css('height', height);
			mfp.wH = height;
		} else {
			mfp.wH = winHeight || _window.height();
		}
		// Fixes #84: popup incorrectly positioned with position:relative on body
		if(!mfp.fixedContentPos) {
			mfp.wrap.css('height', mfp.wH);
		}

		_mfpTrigger('Resize');

	},

	/**
	 * Set content of popup based on current index
	 */
	updateItemHTML: function() {
		var item = mfp.items[mfp.index];

		// Detach and perform modifications
		mfp.contentContainer.detach();

		if(mfp.content)
			mfp.content.detach();

		if(!item.parsed) {
			item = mfp.parseEl( mfp.index );
		}

		var type = item.type;	

		_mfpTrigger('BeforeChange', [mfp.currItem ? mfp.currItem.type : '', type]);
		// BeforeChange event works like so:
		// _mfpOn('BeforeChange', function(e, prevType, newType) { });
		
		mfp.currItem = item;

		

		

		if(!mfp.currTemplate[type]) {
			var markup = mfp.st[type] ? mfp.st[type].markup : false;

			// allows to modify markup
			_mfpTrigger('FirstMarkupParse', markup);

			if(markup) {
				mfp.currTemplate[type] = $(markup);
			} else {
				// if there is no markup found we just define that template is parsed
				mfp.currTemplate[type] = true;
			}
		}

		if(_prevContentType && _prevContentType !== item.type) {
			mfp.container.removeClass('mfp-'+_prevContentType+'-holder');
		}
		
		var newContent = mfp['get' + type.charAt(0).toUpperCase() + type.slice(1)](item, mfp.currTemplate[type]);
		mfp.appendContent(newContent, type);

		item.preloaded = true;

		_mfpTrigger(CHANGE_EVENT, item);
		_prevContentType = item.type;
		
		// Append container back after its content changed
		mfp.container.prepend(mfp.contentContainer);

		_mfpTrigger('AfterChange');
	},


	/**
	 * Set HTML content of popup
	 */
	appendContent: function(newContent, type) {
		mfp.content = newContent;
		
		if(newContent) {
			if(mfp.st.showCloseBtn && mfp.st.closeBtnInside &&
				mfp.currTemplate[type] === true) {
				// if there is no markup, we just append close button element inside
				if(!mfp.content.find('.mfp-close').length) {
					mfp.content.append(_getCloseBtn());
				}
			} else {
				mfp.content = newContent;
			}
		} else {
			mfp.content = '';
		}

		_mfpTrigger(BEFORE_APPEND_EVENT);
		mfp.container.addClass('mfp-'+type+'-holder');

		mfp.contentContainer.append(mfp.content);
	},



	
	/**
	 * Creates Magnific Popup data object based on given data
	 * @param  {int} index Index of item to parse
	 */
	parseEl: function(index) {
		var item = mfp.items[index],
			type;

		if(item.tagName) {
			item = { el: $(item) };
		} else {
			type = item.type;
			item = { data: item, src: item.src };
		}

		if(item.el) {
			var types = mfp.types;

			// check for 'mfp-TYPE' class
			for(var i = 0; i < types.length; i++) {
				if( item.el.hasClass('mfp-'+types[i]) ) {
					type = types[i];
					break;
				}
			}

			item.src = item.el.attr('data-mfp-src');
			if(!item.src) {
				item.src = item.el.attr('href');
			}
		}

		item.type = type || mfp.st.type || 'inline';
		item.index = index;
		item.parsed = true;
		mfp.items[index] = item;
		_mfpTrigger('ElementParse', item);

		return mfp.items[index];
	},


	/**
	 * Initializes single popup or a group of popups
	 */
	addGroup: function(el, options) {
		var eHandler = function(e) {
			e.mfpEl = this;
			mfp._openClick(e, el, options);
		};

		if(!options) {
			options = {};
		} 

		var eName = 'click.magnificPopup';
		options.mainEl = el;
		
		if(options.items) {
			options.isObj = true;
			el.off(eName).on(eName, eHandler);
		} else {
			options.isObj = false;
			if(options.delegate) {
				el.off(eName).on(eName, options.delegate , eHandler);
			} else {
				options.items = el;
				el.off(eName).on(eName, eHandler);
			}
		}
	},
	_openClick: function(e, el, options) {
		var midClick = options.midClick !== undefined ? options.midClick : $.magnificPopup.defaults.midClick;


		if(!midClick && ( e.which === 2 || e.ctrlKey || e.metaKey ) ) {
			return;
		}

		var disableOn = options.disableOn !== undefined ? options.disableOn : $.magnificPopup.defaults.disableOn;

		if(disableOn) {
			if($.isFunction(disableOn)) {
				if( !disableOn.call(mfp) ) {
					return true;
				}
			} else { // else it's number
				if( _window.width() < disableOn ) {
					return true;
				}
			}
		}
		
		if(e.type) {
			e.preventDefault();

			// This will prevent popup from closing if element is inside and popup is already opened
			if(mfp.isOpen) {
				e.stopPropagation();
			}
		}
			

		options.el = $(e.mfpEl);
		if(options.delegate) {
			options.items = el.find(options.delegate);
		}
		mfp.open(options);
	},


	/**
	 * Updates text on preloader
	 */
	updateStatus: function(status, text) {

		if(mfp.preloader) {
			if(_prevStatus !== status) {
				mfp.container.removeClass('mfp-s-'+_prevStatus);
			}

			if(!text && status === 'loading') {
				text = mfp.st.tLoading;
			}

			var data = {
				status: status,
				text: text
			};
			// allows to modify status
			_mfpTrigger('UpdateStatus', data);

			status = data.status;
			text = data.text;

			mfp.preloader.html(text);

			mfp.preloader.find('a').on('click', function(e) {
				e.stopImmediatePropagation();
			});

			mfp.container.addClass('mfp-s-'+status);
			_prevStatus = status;
		}
	},


	/*
		"Private" helpers that aren't private at all
	 */
	// Check to close popup or not
	// "target" is an element that was clicked
	_checkIfClose: function(target) {

		if($(target).hasClass(PREVENT_CLOSE_CLASS)) {
			return;
		}

		var closeOnContent = mfp.st.closeOnContentClick;
		var closeOnBg = mfp.st.closeOnBgClick;

		if(closeOnContent && closeOnBg) {
			return true;
		} else {

			// We close the popup if click is on close button or on preloader. Or if there is no content.
			if(!mfp.content || $(target).hasClass('mfp-close') || (mfp.preloader && target === mfp.preloader[0]) ) {
				return true;
			}

			// if click is outside the content
			if(  (target !== mfp.content[0] && !$.contains(mfp.content[0], target))  ) {
				if(closeOnBg) {
					// last check, if the clicked element is in DOM, (in case it's removed onclick)
					if( $.contains(document, target) ) {
						return true;
					}
				}
			} else if(closeOnContent) {
				return true;
			}

		}
		return false;
	},
	_addClassToMFP: function(cName) {
		mfp.bgOverlay.addClass(cName);
		mfp.wrap.addClass(cName);
	},
	_removeClassFromMFP: function(cName) {
		this.bgOverlay.removeClass(cName);
		mfp.wrap.removeClass(cName);
	},
	_hasScrollBar: function(winHeight) {
		return (  (mfp.isIE7 ? _document.height() : document.body.scrollHeight) > (winHeight || _window.height()) );
	},
	_setFocus: function() {
		(mfp.st.focus ? mfp.content.find(mfp.st.focus).eq(0) : mfp.wrap).focus();
	},
	_onFocusIn: function(e) {
		if( e.target !== mfp.wrap[0] && !$.contains(mfp.wrap[0], e.target) ) {
			mfp._setFocus();
			return false;
		}
	},
	_parseMarkup: function(template, values, item) {
		var arr;
		if(item.data) {
			values = $.extend(item.data, values);
		}
		_mfpTrigger(MARKUP_PARSE_EVENT, [template, values, item] );

		$.each(values, function(key, value) {
			if(value === undefined || value === false) {
				return true;
			}
			arr = key.split('_');
			if(arr.length > 1) {
				var el = template.find(EVENT_NS + '-'+arr[0]);

				if(el.length > 0) {
					var attr = arr[1];
					if(attr === 'replaceWith') {
						if(el[0] !== value[0]) {
							el.replaceWith(value);
						}
					} else if(attr === 'img') {
						if(el.is('img')) {
							el.attr('src', value);
						} else {
							el.replaceWith( '<img src="'+value+'" class="' + el.attr('class') + '" />' );
						}
					} else {
						el.attr(arr[1], value);
					}
				}

			} else {
				template.find(EVENT_NS + '-'+key).html(value);
			}
		});
	},

	_getScrollbarSize: function() {
		// thx David
		if(mfp.scrollbarSize === undefined) {
			var scrollDiv = document.createElement("div");
			scrollDiv.style.cssText = 'width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;';
			document.body.appendChild(scrollDiv);
			mfp.scrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			document.body.removeChild(scrollDiv);
		}
		return mfp.scrollbarSize;
	}

}; /* MagnificPopup core prototype end */




/**
 * Public static functions
 */
$.magnificPopup = {
	instance: null,
	proto: MagnificPopup.prototype,
	modules: [],

	open: function(options, index) {
		_checkInstance();	

		if(!options) {
			options = {};
		} else {
			options = $.extend(true, {}, options);
		}
			

		options.isObj = true;
		options.index = index || 0;
		return this.instance.open(options);
	},

	close: function() {
		return $.magnificPopup.instance && $.magnificPopup.instance.close();
	},

	registerModule: function(name, module) {
		if(module.options) {
			$.magnificPopup.defaults[name] = module.options;
		}
		$.extend(this.proto, module.proto);			
		this.modules.push(name);
	},

	defaults: {   

		// Info about options is in docs:
		// http://dimsemenov.com/plugins/magnific-popup/documentation.html#options
		
		disableOn: 0,	

		key: null,

		midClick: false,

		mainClass: '',

		preloader: true,

		focus: '', // CSS selector of input to focus after popup is opened
		
		closeOnContentClick: false,

		closeOnBgClick: true,

		closeBtnInside: true, 

		showCloseBtn: true,

		enableEscapeKey: true,

		modal: false,

		alignTop: false,
	
		removalDelay: 0,

		prependTo: null,
		
		fixedContentPos: 'auto', 
	
		fixedBgPos: 'auto',

		overflowY: 'auto',

		closeMarkup: '<button title="%title%" type="button" class="mfp-close">&times;</button>',

		tClose: 'Close (Esc)',

		tLoading: 'Loading...'

	}
};



$.fn.magnificPopup = function(options) {
	_checkInstance();

	var jqEl = $(this);

	// We call some API method of first param is a string
	if (typeof options === "string" ) {

		if(options === 'open') {
			var items,
				itemOpts = _isJQ ? jqEl.data('magnificPopup') : jqEl[0].magnificPopup,
				index = parseInt(arguments[1], 10) || 0;

			if(itemOpts.items) {
				items = itemOpts.items[index];
			} else {
				items = jqEl;
				if(itemOpts.delegate) {
					items = items.find(itemOpts.delegate);
				}
				items = items.eq( index );
			}
			mfp._openClick({mfpEl:items}, jqEl, itemOpts);
		} else {
			if(mfp.isOpen)
				mfp[options].apply(mfp, Array.prototype.slice.call(arguments, 1));
		}

	} else {
		// clone options obj
		options = $.extend(true, {}, options);
		
		/*
		 * As Zepto doesn't support .data() method for objects 
		 * and it works only in normal browsers
		 * we assign "options" object directly to the DOM element. FTW!
		 */
		if(_isJQ) {
			jqEl.data('magnificPopup', options);
		} else {
			jqEl[0].magnificPopup = options;
		}

		mfp.addGroup(jqEl, options);

	}
	return jqEl;
};


//Quick benchmark
/*
var start = performance.now(),
	i,
	rounds = 1000;
for(i = 0; i < rounds; i++) {
}
console.log('Test #1:', performance.now() - start);
start = performance.now();
for(i = 0; i < rounds; i++) {
}
console.log('Test #2:', performance.now() - start);
*/


/*>>core*/

/*>>inline*/

var INLINE_NS = 'inline',
	_hiddenClass,
	_inlinePlaceholder, 
	_lastInlineElement,
	_putInlineElementsBack = function() {
		if(_lastInlineElement) {
			_inlinePlaceholder.after( _lastInlineElement.addClass(_hiddenClass) ).detach();
			_lastInlineElement = null;
		}
	};

$.magnificPopup.registerModule(INLINE_NS, {
	options: {
		hiddenClass: 'hide', // will be appended with `mfp-` prefix
		markup: '',
		tNotFound: 'Content not found'
	},
	proto: {

		initInline: function() {
			mfp.types.push(INLINE_NS);

			_mfpOn(CLOSE_EVENT+'.'+INLINE_NS, function() {
				_putInlineElementsBack();
			});
		},

		getInline: function(item, template) {

			_putInlineElementsBack();

			if(item.src) {
				var inlineSt = mfp.st.inline,
					el = $(item.src);

				if(el.length) {

					// If target element has parent - we replace it with placeholder and put it back after popup is closed
					var parent = el[0].parentNode;
					if(parent && parent.tagName) {
						if(!_inlinePlaceholder) {
							_hiddenClass = inlineSt.hiddenClass;
							_inlinePlaceholder = _getEl(_hiddenClass);
							_hiddenClass = 'mfp-'+_hiddenClass;
						}
						// replace target inline element with placeholder
						_lastInlineElement = el.after(_inlinePlaceholder).detach().removeClass(_hiddenClass);
					}

					mfp.updateStatus('ready');
				} else {
					mfp.updateStatus('error', inlineSt.tNotFound);
					el = $('<div>');
				}

				item.inlineElement = el;
				return el;
			}

			mfp.updateStatus('ready');
			mfp._parseMarkup(template, {}, item);
			return template;
		}
	}
});

/*>>inline*/

/*>>ajax*/
var AJAX_NS = 'ajax',
	_ajaxCur,
	_removeAjaxCursor = function() {
		if(_ajaxCur) {
			_body.removeClass(_ajaxCur);
		}
	},
	_destroyAjaxRequest = function() {
		_removeAjaxCursor();
		if(mfp.req) {
			mfp.req.abort();
		}
	};

$.magnificPopup.registerModule(AJAX_NS, {

	options: {
		settings: null,
		cursor: 'mfp-ajax-cur',
		tError: '<a href="%url%">The content</a> could not be loaded.'
	},

	proto: {
		initAjax: function() {
			mfp.types.push(AJAX_NS);
			_ajaxCur = mfp.st.ajax.cursor;

			_mfpOn(CLOSE_EVENT+'.'+AJAX_NS, _destroyAjaxRequest);
			_mfpOn('BeforeChange.' + AJAX_NS, _destroyAjaxRequest);
		},
		getAjax: function(item) {

			if(_ajaxCur)
				_body.addClass(_ajaxCur);

			mfp.updateStatus('loading');

			var opts = $.extend({
				url: item.src,
				success: function(data, textStatus, jqXHR) {
					var temp = {
						data:data,
						xhr:jqXHR
					};

					_mfpTrigger('ParseAjax', temp);

					mfp.appendContent( $(temp.data), AJAX_NS );

					item.finished = true;

					_removeAjaxCursor();

					mfp._setFocus();

					setTimeout(function() {
						mfp.wrap.addClass(READY_CLASS);
					}, 16);

					mfp.updateStatus('ready');

					_mfpTrigger('AjaxContentAdded');
				},
				error: function() {
					_removeAjaxCursor();
					item.finished = item.loadError = true;
					mfp.updateStatus('error', mfp.st.ajax.tError.replace('%url%', item.src));
				}
			}, mfp.st.ajax.settings);

			mfp.req = $.ajax(opts);

			return '';
		}
	}
});





	

/*>>ajax*/

/*>>image*/
var _imgInterval,
	_getTitle = function(item) {
		if(item.data && item.data.title !== undefined) 
			return item.data.title;

		var src = mfp.st.image.titleSrc;

		if(src) {
			if($.isFunction(src)) {
				return src.call(mfp, item);
			} else if(item.el) {
				return item.el.attr(src) || '';
			}
		}
		return '';
	};

$.magnificPopup.registerModule('image', {

	options: {
		markup: '<div class="mfp-figure">'+
					'<div class="mfp-close"></div>'+
					'<figure>'+
						'<div class="mfp-img"></div>'+
						'<figcaption>'+
							'<div class="mfp-bottom-bar">'+
								'<div class="mfp-title"></div>'+
								'<div class="mfp-counter"></div>'+
							'</div>'+
						'</figcaption>'+
					'</figure>'+
				'</div>',
		cursor: 'mfp-zoom-out-cur',
		titleSrc: 'title', 
		verticalFit: true,
		tError: '<a href="%url%">The image</a> could not be loaded.'
	},

	proto: {
		initImage: function() {
			var imgSt = mfp.st.image,
				ns = '.image';

			mfp.types.push('image');

			_mfpOn(OPEN_EVENT+ns, function() {
				if(mfp.currItem.type === 'image' && imgSt.cursor) {
					_body.addClass(imgSt.cursor);
				}
			});

			_mfpOn(CLOSE_EVENT+ns, function() {
				if(imgSt.cursor) {
					_body.removeClass(imgSt.cursor);
				}
				_window.off('resize' + EVENT_NS);
			});

			_mfpOn('Resize'+ns, mfp.resizeImage);
			if(mfp.isLowIE) {
				_mfpOn('AfterChange', mfp.resizeImage);
			}
		},
		resizeImage: function() {
			var item = mfp.currItem;
			if(!item || !item.img) return;

			if(mfp.st.image.verticalFit) {
				var decr = 0;
				// fix box-sizing in ie7/8
				if(mfp.isLowIE) {
					decr = parseInt(item.img.css('padding-top'), 10) + parseInt(item.img.css('padding-bottom'),10);
				}
				item.img.css('max-height', mfp.wH-decr);
			}
		},
		_onImageHasSize: function(item) {
			if(item.img) {
				
				item.hasSize = true;

				if(_imgInterval) {
					clearInterval(_imgInterval);
				}
				
				item.isCheckingImgSize = false;

				_mfpTrigger('ImageHasSize', item);

				if(item.imgHidden) {
					if(mfp.content)
						mfp.content.removeClass('mfp-loading');
					
					item.imgHidden = false;
				}

			}
		},

		/**
		 * Function that loops until the image has size to display elements that rely on it asap
		 */
		findImageSize: function(item) {

			var counter = 0,
				img = item.img[0],
				mfpSetInterval = function(delay) {

					if(_imgInterval) {
						clearInterval(_imgInterval);
					}
					// decelerating interval that checks for size of an image
					_imgInterval = setInterval(function() {
						if(img.naturalWidth > 0) {
							mfp._onImageHasSize(item);
							return;
						}

						if(counter > 200) {
							clearInterval(_imgInterval);
						}

						counter++;
						if(counter === 3) {
							mfpSetInterval(10);
						} else if(counter === 40) {
							mfpSetInterval(50);
						} else if(counter === 100) {
							mfpSetInterval(500);
						}
					}, delay);
				};

			mfpSetInterval(1);
		},

		getImage: function(item, template) {

			var guard = 0,

				// image load complete handler
				onLoadComplete = function() {
					if(item) {
						if (item.img[0].complete) {
							item.img.off('.mfploader');
							
							if(item === mfp.currItem){
								mfp._onImageHasSize(item);

								mfp.updateStatus('ready');
							}

							item.hasSize = true;
							item.loaded = true;

							_mfpTrigger('ImageLoadComplete');
							
						}
						else {
							// if image complete check fails 200 times (20 sec), we assume that there was an error.
							guard++;
							if(guard < 200) {
								setTimeout(onLoadComplete,100);
							} else {
								onLoadError();
							}
						}
					}
				},

				// image error handler
				onLoadError = function() {
					if(item) {
						item.img.off('.mfploader');
						if(item === mfp.currItem){
							mfp._onImageHasSize(item);
							mfp.updateStatus('error', imgSt.tError.replace('%url%', item.src) );
						}

						item.hasSize = true;
						item.loaded = true;
						item.loadError = true;
					}
				},
				imgSt = mfp.st.image;


			var el = template.find('.mfp-img');
			if(el.length) {
				var img = document.createElement('img');
				img.className = 'mfp-img';
				item.img = $(img).on('load.mfploader', onLoadComplete).on('error.mfploader', onLoadError);
				img.src = item.src;

				// without clone() "error" event is not firing when IMG is replaced by new IMG
				// TODO: find a way to avoid such cloning
				if(el.is('img')) {
					item.img = item.img.clone();
				}

				img = item.img[0];
				if(img.naturalWidth > 0) {
					item.hasSize = true;
				} else if(!img.width) {										
					item.hasSize = false;
				}
			}

			mfp._parseMarkup(template, {
				title: _getTitle(item),
				img_replaceWith: item.img
			}, item);

			mfp.resizeImage();

			if(item.hasSize) {
				if(_imgInterval) clearInterval(_imgInterval);

				if(item.loadError) {
					template.addClass('mfp-loading');
					mfp.updateStatus('error', imgSt.tError.replace('%url%', item.src) );
				} else {
					template.removeClass('mfp-loading');
					mfp.updateStatus('ready');
				}
				return template;
			}

			mfp.updateStatus('loading');
			item.loading = true;

			if(!item.hasSize) {
				item.imgHidden = true;
				template.addClass('mfp-loading');
				mfp.findImageSize(item);
			} 

			return template;
		}
	}
});



/*>>image*/

/*>>zoom*/
var hasMozTransform,
	getHasMozTransform = function() {
		if(hasMozTransform === undefined) {
			hasMozTransform = document.createElement('p').style.MozTransform !== undefined;
		}
		return hasMozTransform;		
	};

$.magnificPopup.registerModule('zoom', {

	options: {
		enabled: false,
		easing: 'ease-in-out',
		duration: 300,
		opener: function(element) {
			return element.is('img') ? element : element.find('img');
		}
	},

	proto: {

		initZoom: function() {
			var zoomSt = mfp.st.zoom,
				ns = '.zoom',
				image;
				
			if(!zoomSt.enabled || !mfp.supportsTransition) {
				return;
			}

			var duration = zoomSt.duration,
				getElToAnimate = function(image) {
					var newImg = image.clone().removeAttr('style').removeAttr('class').addClass('mfp-animated-image'),
						transition = 'all '+(zoomSt.duration/1000)+'s ' + zoomSt.easing,
						cssObj = {
							position: 'fixed',
							zIndex: 9999,
							left: 0,
							top: 0,
							'-webkit-backface-visibility': 'hidden'
						},
						t = 'transition';

					cssObj['-webkit-'+t] = cssObj['-moz-'+t] = cssObj['-o-'+t] = cssObj[t] = transition;

					newImg.css(cssObj);
					return newImg;
				},
				showMainContent = function() {
					mfp.content.css('visibility', 'visible');
				},
				openTimeout,
				animatedImg;

			_mfpOn('BuildControls'+ns, function() {
				if(mfp._allowZoom()) {

					clearTimeout(openTimeout);
					mfp.content.css('visibility', 'hidden');

					// Basically, all code below does is clones existing image, puts in on top of the current one and animated it
					
					image = mfp._getItemToZoom();

					if(!image) {
						showMainContent();
						return;
					}

					animatedImg = getElToAnimate(image); 
					
					animatedImg.css( mfp._getOffset() );

					mfp.wrap.append(animatedImg);

					openTimeout = setTimeout(function() {
						animatedImg.css( mfp._getOffset( true ) );
						openTimeout = setTimeout(function() {

							showMainContent();

							setTimeout(function() {
								animatedImg.remove();
								image = animatedImg = null;
								_mfpTrigger('ZoomAnimationEnded');
							}, 16); // avoid blink when switching images 

						}, duration); // this timeout equals animation duration

					}, 16); // by adding this timeout we avoid short glitch at the beginning of animation


					// Lots of timeouts...
				}
			});
			_mfpOn(BEFORE_CLOSE_EVENT+ns, function() {
				if(mfp._allowZoom()) {

					clearTimeout(openTimeout);

					mfp.st.removalDelay = duration;

					if(!image) {
						image = mfp._getItemToZoom();
						if(!image) {
							return;
						}
						animatedImg = getElToAnimate(image);
					}
					
					
					animatedImg.css( mfp._getOffset(true) );
					mfp.wrap.append(animatedImg);
					mfp.content.css('visibility', 'hidden');
					
					setTimeout(function() {
						animatedImg.css( mfp._getOffset() );
					}, 16);
				}

			});

			_mfpOn(CLOSE_EVENT+ns, function() {
				if(mfp._allowZoom()) {
					showMainContent();
					if(animatedImg) {
						animatedImg.remove();
					}
					image = null;
				}	
			});
		},

		_allowZoom: function() {
			return mfp.currItem.type === 'image';
		},

		_getItemToZoom: function() {
			if(mfp.currItem.hasSize) {
				return mfp.currItem.img;
			} else {
				return false;
			}
		},

		// Get element postion relative to viewport
		_getOffset: function(isLarge) {
			var el;
			if(isLarge) {
				el = mfp.currItem.img;
			} else {
				el = mfp.st.zoom.opener(mfp.currItem.el || mfp.currItem);
			}

			var offset = el.offset();
			var paddingTop = parseInt(el.css('padding-top'),10);
			var paddingBottom = parseInt(el.css('padding-bottom'),10);
			offset.top -= ( $(window).scrollTop() - paddingTop );


			/*
			
			Animating left + top + width/height looks glitchy in Firefox, but perfect in Chrome. And vice-versa.
			 */
			var obj = {
				width: el.width(),
				// fix Zepto height+padding issue
				height: (_isJQ ? el.innerHeight() : el[0].offsetHeight) - paddingBottom - paddingTop
			};

			// I hate to do this, but there is no another option
			if( getHasMozTransform() ) {
				obj['-moz-transform'] = obj['transform'] = 'translate(' + offset.left + 'px,' + offset.top + 'px)';
			} else {
				obj.left = offset.left;
				obj.top = offset.top;
			}
			return obj;
		}

	}
});



/*>>zoom*/

/*>>iframe*/

var IFRAME_NS = 'iframe',
	_emptyPage = '//about:blank',
	
	_fixIframeBugs = function(isShowing) {
		if(mfp.currTemplate[IFRAME_NS]) {
			var el = mfp.currTemplate[IFRAME_NS].find('iframe');
			if(el.length) { 
				// reset src after the popup is closed to avoid "video keeps playing after popup is closed" bug
				if(!isShowing) {
					el[0].src = _emptyPage;
				}

				// IE8 black screen bug fix
				if(mfp.isIE8) {
					el.css('display', isShowing ? 'block' : 'none');
				}
			}
		}
	};

$.magnificPopup.registerModule(IFRAME_NS, {

	options: {
		markup: '<div class="mfp-iframe-scaler">'+
					'<div class="mfp-close"></div>'+
					'<iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe>'+
				'</div>',

		srcAction: 'iframe_src',

		// we don't care and support only one default type of URL by default
		patterns: {
			youtube: {
				index: 'youtube.com', 
				id: 'v=', 
				src: '//www.youtube.com/embed/%id%?autoplay=1'
			},
			vimeo: {
				index: 'vimeo.com/',
				id: '/',
				src: '//player.vimeo.com/video/%id%?autoplay=1'
			},
			gmaps: {
				index: '//maps.google.',
				src: '%id%&output=embed'
			}
		}
	},

	proto: {
		initIframe: function() {
			mfp.types.push(IFRAME_NS);

			_mfpOn('BeforeChange', function(e, prevType, newType) {
				if(prevType !== newType) {
					if(prevType === IFRAME_NS) {
						_fixIframeBugs(); // iframe if removed
					} else if(newType === IFRAME_NS) {
						_fixIframeBugs(true); // iframe is showing
					} 
				}// else {
					// iframe source is switched, don't do anything
				//}
			});

			_mfpOn(CLOSE_EVENT + '.' + IFRAME_NS, function() {
				_fixIframeBugs();
			});
		},

		getIframe: function(item, template) {
			var embedSrc = item.src;
			var iframeSt = mfp.st.iframe;
				
			$.each(iframeSt.patterns, function() {
				if(embedSrc.indexOf( this.index ) > -1) {
					if(this.id) {
						if(typeof this.id === 'string') {
							embedSrc = embedSrc.substr(embedSrc.lastIndexOf(this.id)+this.id.length, embedSrc.length);
						} else {
							embedSrc = this.id.call( this, embedSrc );
						}
					}
					embedSrc = this.src.replace('%id%', embedSrc );
					return false; // break;
				}
			});
			
			var dataObj = {};
			if(iframeSt.srcAction) {
				dataObj[iframeSt.srcAction] = embedSrc;
			}
			mfp._parseMarkup(template, dataObj, item);

			mfp.updateStatus('ready');

			return template;
		}
	}
});



/*>>iframe*/

/*>>gallery*/
/**
 * Get looped index depending on number of slides
 */
var _getLoopedId = function(index) {
		var numSlides = mfp.items.length;
		if(index > numSlides - 1) {
			return index - numSlides;
		} else  if(index < 0) {
			return numSlides + index;
		}
		return index;
	},
	_replaceCurrTotal = function(text, curr, total) {
		return text.replace(/%curr%/gi, curr + 1).replace(/%total%/gi, total);
	};

$.magnificPopup.registerModule('gallery', {

	options: {
		enabled: false,
		arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',
		preload: [0,2],
		navigateByImgClick: true,
		arrows: true,

		tPrev: 'Previous (Left arrow key)',
		tNext: 'Next (Right arrow key)',
		tCounter: '%curr% of %total%'
	},

	proto: {
		initGallery: function() {

			var gSt = mfp.st.gallery,
				ns = '.mfp-gallery',
				supportsFastClick = Boolean($.fn.mfpFastClick);

			mfp.direction = true; // true - next, false - prev
			
			if(!gSt || !gSt.enabled ) return false;

			_wrapClasses += ' mfp-gallery';

			_mfpOn(OPEN_EVENT+ns, function() {

				if(gSt.navigateByImgClick) {
					mfp.wrap.on('click'+ns, '.mfp-img', function() {
						if(mfp.items.length > 1) {
							mfp.next();
							return false;
						}
					});
				}

				_document.on('keydown'+ns, function(e) {
					if (e.keyCode === 37) {
						mfp.prev();
					} else if (e.keyCode === 39) {
						mfp.next();
					}
				});
			});

			_mfpOn('UpdateStatus'+ns, function(e, data) {
				if(data.text) {
					data.text = _replaceCurrTotal(data.text, mfp.currItem.index, mfp.items.length);
				}
			});

			_mfpOn(MARKUP_PARSE_EVENT+ns, function(e, element, values, item) {
				var l = mfp.items.length;
				values.counter = l > 1 ? _replaceCurrTotal(gSt.tCounter, item.index, l) : '';
			});

			_mfpOn('BuildControls' + ns, function() {
				if(mfp.items.length > 1 && gSt.arrows && !mfp.arrowLeft) {
					var markup = gSt.arrowMarkup,
						arrowLeft = mfp.arrowLeft = $( markup.replace(/%title%/gi, gSt.tPrev).replace(/%dir%/gi, 'left') ).addClass(PREVENT_CLOSE_CLASS),			
						arrowRight = mfp.arrowRight = $( markup.replace(/%title%/gi, gSt.tNext).replace(/%dir%/gi, 'right') ).addClass(PREVENT_CLOSE_CLASS);

					var eName = supportsFastClick ? 'mfpFastClick' : 'click';
					arrowLeft[eName](function() {
						mfp.prev();
					});			
					arrowRight[eName](function() {
						mfp.next();
					});	

					// Polyfill for :before and :after (adds elements with classes mfp-a and mfp-b)
					if(mfp.isIE7) {
						_getEl('b', arrowLeft[0], false, true);
						_getEl('a', arrowLeft[0], false, true);
						_getEl('b', arrowRight[0], false, true);
						_getEl('a', arrowRight[0], false, true);
					}

					mfp.container.append(arrowLeft.add(arrowRight));
				}
			});

			_mfpOn(CHANGE_EVENT+ns, function() {
				if(mfp._preloadTimeout) clearTimeout(mfp._preloadTimeout);

				mfp._preloadTimeout = setTimeout(function() {
					mfp.preloadNearbyImages();
					mfp._preloadTimeout = null;
				}, 16);		
			});


			_mfpOn(CLOSE_EVENT+ns, function() {
				_document.off(ns);
				mfp.wrap.off('click'+ns);
			
				if(mfp.arrowLeft && supportsFastClick) {
					mfp.arrowLeft.add(mfp.arrowRight).destroyMfpFastClick();
				}
				mfp.arrowRight = mfp.arrowLeft = null;
			});

		}, 
		next: function() {
			mfp.direction = true;
			mfp.index = _getLoopedId(mfp.index + 1);
			mfp.updateItemHTML();
		},
		prev: function() {
			mfp.direction = false;
			mfp.index = _getLoopedId(mfp.index - 1);
			mfp.updateItemHTML();
		},
		goTo: function(newIndex) {
			mfp.direction = (newIndex >= mfp.index);
			mfp.index = newIndex;
			mfp.updateItemHTML();
		},
		preloadNearbyImages: function() {
			var p = mfp.st.gallery.preload,
				preloadBefore = Math.min(p[0], mfp.items.length),
				preloadAfter = Math.min(p[1], mfp.items.length),
				i;

			for(i = 1; i <= (mfp.direction ? preloadAfter : preloadBefore); i++) {
				mfp._preloadItem(mfp.index+i);
			}
			for(i = 1; i <= (mfp.direction ? preloadBefore : preloadAfter); i++) {
				mfp._preloadItem(mfp.index-i);
			}
		},
		_preloadItem: function(index) {
			index = _getLoopedId(index);

			if(mfp.items[index].preloaded) {
				return;
			}

			var item = mfp.items[index];
			if(!item.parsed) {
				item = mfp.parseEl( index );
			}

			_mfpTrigger('LazyLoad', item);

			if(item.type === 'image') {
				item.img = $('<img class="mfp-img" />').on('load.mfploader', function() {
					item.hasSize = true;
				}).on('error.mfploader', function() {
					item.hasSize = true;
					item.loadError = true;
					_mfpTrigger('LazyLoadError', item);
				}).attr('src', item.src);
			}


			item.preloaded = true;
		}
	}
});

/*
Touch Support that might be implemented some day
addSwipeGesture: function() {
	var startX,
		moved,
		multipleTouches;
		return;
	var namespace = '.mfp',
		addEventNames = function(pref, down, move, up, cancel) {
			mfp._tStart = pref + down + namespace;
			mfp._tMove = pref + move + namespace;
			mfp._tEnd = pref + up + namespace;
			mfp._tCancel = pref + cancel + namespace;
		};
	if(window.navigator.msPointerEnabled) {
		addEventNames('MSPointer', 'Down', 'Move', 'Up', 'Cancel');
	} else if('ontouchstart' in window) {
		addEventNames('touch', 'start', 'move', 'end', 'cancel');
	} else {
		return;
	}
	_window.on(mfp._tStart, function(e) {
		var oE = e.originalEvent;
		multipleTouches = moved = false;
		startX = oE.pageX || oE.changedTouches[0].pageX;
	}).on(mfp._tMove, function(e) {
		if(e.originalEvent.touches.length > 1) {
			multipleTouches = e.originalEvent.touches.length;
		} else {
			//e.preventDefault();
			moved = true;
		}
	}).on(mfp._tEnd + ' ' + mfp._tCancel, function(e) {
		if(moved && !multipleTouches) {
			var oE = e.originalEvent,
				diff = startX - (oE.pageX || oE.changedTouches[0].pageX);
			if(diff > 20) {
				mfp.next();
			} else if(diff < -20) {
				mfp.prev();
			}
		}
	});
},
*/


/*>>gallery*/

/*>>retina*/

var RETINA_NS = 'retina';

$.magnificPopup.registerModule(RETINA_NS, {
	options: {
		replaceSrc: function(item) {
			return item.src.replace(/\.\w+$/, function(m) { return '@2x' + m; });
		},
		ratio: 1 // Function or number.  Set to 1 to disable.
	},
	proto: {
		initRetina: function() {
			if(window.devicePixelRatio > 1) {

				var st = mfp.st.retina,
					ratio = st.ratio;

				ratio = !isNaN(ratio) ? ratio : ratio();

				if(ratio > 1) {
					_mfpOn('ImageHasSize' + '.' + RETINA_NS, function(e, item) {
						item.img.css({
							'max-width': item.img[0].naturalWidth / ratio,
							'width': '100%'
						});
					});
					_mfpOn('ElementParse' + '.' + RETINA_NS, function(e, item) {
						item.src = st.replaceSrc(item, ratio);
					});
				}
			}

		}
	}
});

/*>>retina*/

/*>>fastclick*/
/**
 * FastClick event implementation. (removes 300ms delay on touch devices)
 * Based on https://developers.google.com/mobile/articles/fast_buttons
 *
 * You may use it outside the Magnific Popup by calling just:
 *
 * $('.your-el').mfpFastClick(function() {
 *     console.log('Clicked!');
 * });
 *
 * To unbind:
 * $('.your-el').destroyMfpFastClick();
 * 
 * 
 * Note that it's a very basic and simple implementation, it blocks ghost click on the same element where it was bound.
 * If you need something more advanced, use plugin by FT Labs https://github.com/ftlabs/fastclick
 * 
 */

(function() {
	var ghostClickDelay = 1000,
		supportsTouch = 'ontouchstart' in window,
		unbindTouchMove = function() {
			_window.off('touchmove'+ns+' touchend'+ns);
		},
		eName = 'mfpFastClick',
		ns = '.'+eName;


	// As Zepto.js doesn't have an easy way to add custom events (like jQuery), so we implement it in this way
	$.fn.mfpFastClick = function(callback) {

		return $(this).each(function() {

			var elem = $(this),
				lock;

			if( supportsTouch ) {

				var timeout,
					startX,
					startY,
					pointerMoved,
					point,
					numPointers;

				elem.on('touchstart' + ns, function(e) {
					pointerMoved = false;
					numPointers = 1;

					point = e.originalEvent ? e.originalEvent.touches[0] : e.touches[0];
					startX = point.clientX;
					startY = point.clientY;

					_window.on('touchmove'+ns, function(e) {
						point = e.originalEvent ? e.originalEvent.touches : e.touches;
						numPointers = point.length;
						point = point[0];
						if (Math.abs(point.clientX - startX) > 10 ||
							Math.abs(point.clientY - startY) > 10) {
							pointerMoved = true;
							unbindTouchMove();
						}
					}).on('touchend'+ns, function(e) {
						unbindTouchMove();
						if(pointerMoved || numPointers > 1) {
							return;
						}
						lock = true;
						e.preventDefault();
						clearTimeout(timeout);
						timeout = setTimeout(function() {
							lock = false;
						}, ghostClickDelay);
						callback();
					});
				});

			}

			elem.on('click' + ns, function() {
				if(!lock) {
					callback();
				}
			});
		});
	};

	$.fn.destroyMfpFastClick = function() {
		$(this).off('touchstart' + ns + ' click' + ns);
		if(supportsTouch) _window.off('touchmove'+ns+' touchend'+ns);
	};
})();

/*>>fastclick*/
 _checkInstance(); })(window.jQuery || window.Zepto);
    
/* ======================================================= 
 *
 *      Media Boxes     
 *      Version: 2.8
 *      By castlecode
 *
 *      Contact: http://codecanyon.net/user/castlecode
 *      Created: March 11, 2014
 *
 *      Copyright (c) 2013, castlecode. All rights reserved.
 *      Available only in http://codecanyon.net/
 *      
 *      ---------------------------------
 *      CONTENTS
 *      ---------------------------------
 *
 *      [1] SETUP
 *      [2] GRID METHODS
 *      [3] EXTENGIN ISOTOPE
 *      [4] FILTERING ISOTOPE
 *      [5] LOAD MORE BOXES
 *      [6] FILTER
 *      [7] SEARCH
 *      [8] SORTING
 *      [9] THUMBNAIL OVERLAY EFFECT
 *      [10] MAGNIFIC POPUP
 *      [11] DEEP LINKING
 *      [12] SOCIAL IN MAGNIFIC POPUP
 *      
 * ======================================================= */


// convert divs into images
(function( window, $, undefined ){

    var MediaBoxes = function(container, options){
        
    /* ====================================================================== *
            [1] SETUP
     * ====================================================================== */

        /* SETTINGS */
        var settings = $.extend({}, $.fn.mediaBoxes.defaults, options);

        /* VARS */
        var $container                  = $(container).addClass('media-boxes-container');        
        var itemSelector                = '.media-box';
        var boxImageSelector            = '.media-box-image';
        var itemClass                   = 'media-box'; /* same as itemSelector but without the '.' */
        var itemHiddenClass             = 'media-box-hidden';
        var animation                   = Modernizr.csstransitions?'transition':'animate'; /* CSS3 transition or jQuery animate depending on the browser support */
        var filters                     = {};
        var loadingsCounter             = 0; /* When there's more than one loading at the same time */

        if( settings.overlayEasing == 'default' ){
            settings.overlayEasing = (animation=='transition')?'_default':'swing'; /* 'default' is for CSS3 and 'swing' for jQuery animate */
        }
        
        /* LOAD MORE BUTTON */
        var loadMoreButton              = $('<div class="media-boxes-load-more media-boxes-load-more-button"></div>').insertAfter($container);

        /* Sort the resolutions from lower to higher */
        settings.resolutions.sort(function(a,b){ return a.maxWidth - b.maxWidth; });

        /* Save the settings in the container */
        $container.data('settings', settings);
        
        /* Fix the margins for the container (for horizontal and vertical space)  */
        $container
            .css({
                    'margin-left' : -settings.horizontalSpaceBetweenBoxes,
                    //'margin-top'  : -settings.verticalSpaceBetweenBoxes,
                });

        /* Hide all boxes */
        $container.find(itemSelector).removeClass(itemClass).addClass(itemHiddenClass);

        /* default sort selected */
        var defSortElem = $(settings.sortContainer).find(settings.sort).filter('.selected');
        var defSort     = defSortElem.attr('data-sort-by');
        var defAsc      = getSortDirection(defSortElem);

        /* Add the sizer for defining the width of isotope */
        $container.append('<div class="media-boxes-grid-sizer"></div>');

        /* Initialize isotope plugin */
        $container.isotopeMB({
            itemSelector    : itemSelector,  
            //transitionDuration: '0.3s',  
            //filter: combineFilters(filters),     
            masonry: {
                columnWidth: '.media-boxes-grid-sizer'
            },
            getSortData: settings.getSortData,
            sortBy: defSort, 
            sortAscending: defAsc,     
        }); 

        //updateFilterClasses(); /* this is used for the popup, so it does show the images depending on the filter */

    /* ====================================================================== *
            [2] GRID METHODS
     * ====================================================================== */

        /* ****** Add the trigger for the magnific popup ****** */
        function addPopupTrigger(container){

            container.find(itemSelector+', .'+itemHiddenClass).find(boxImageSelector+':not([data-popupTrigger])').each(function(){
                var boxImage        = $(this);
                var popupDiv        = boxImage.find('div[data-popup]').eq(0); /* only one popup allowed */
                var popupTrigger    = boxImage.find('.mb-open-popup').addBack('.mb-open-popup');
                //var popupTrigger  = boxImage.find('.mb-open-popup').andSelf().filter('.mb-open-popup'); // For jQuery v1.7.1 - v1.8

                // instead of openning the iframe in the popup open it in the grid
                if( popupDiv.hasClass('iframe-on-grid') && popupDiv.data('type') == 'iframe' ){
                    popupTrigger.attr('iframe-on-grid-src', popupDiv.data('popup'));
                    popupTrigger.addClass('mb-open-iframe-on-grid');
                    return;
                }

                boxImage.attr('data-popupTrigger', 'yes');
                
                var type = 'mfp-image';
                if(popupDiv.data('type') == 'iframe'){
                    type = 'mfp-iframe';
                }else if(popupDiv.data('type') == 'inline'){
                    type = 'mfp-inline';
                }else if(popupDiv.data('type') == 'ajax'){
                    type = 'mfp-ajax';
                }

                popupTrigger.attr('data-mfp-src', popupDiv.data('popup')).addClass(type);
                if(popupDiv.attr('title') != undefined){
                    popupTrigger.attr('mfp-title', popupDiv.attr('title'));
                }
                if(popupDiv.attr('alt') != undefined){
                    popupTrigger.attr('mfp-alt', popupDiv.attr('alt'));
                }
            });

        }

        /* ****** Convert the divs with the URL specified to real images ****** */
        function convertDivsIntoImages(container, imagesWithDimensions){
            container.find(itemSelector).find(boxImageSelector+':not([data-imageconverted])').each(function(){
                var boxImage        = $(this);
                var thumbnailDiv    = boxImage.find('div[data-thumbnail]').eq(0); /* only one thumb allowed */
                var popupDiv        = boxImage.find('div[data-popup]').eq(0); /* only one popup allowed */
                var thumbSrc        = thumbnailDiv.data('thumbnail');

                if(thumbnailDiv[0] == undefined){ /* if you haven't sepcified a thumbnail then take the image */
                    thumbnailDiv   = popupDiv;
                    thumbSrc    = popupDiv.data('popup');
                }
                
                if( imagesWithDimensions == false && container.data('settings').waitForAllThumbsNoMatterWhat == false ){
                    if( thumbnailDiv.data('width') == undefined && thumbnailDiv.data('height') == undefined ){
                        /* Then we are good to go since we don't want images with dimenssions specified */
                    }else{
                        return;
                        /* If you are here then nothing after this will be executed */
                    }
                }

                boxImage.attr('data-imageconverted', 'yes');
                
                var thumbTitle = thumbnailDiv.attr('title');
                if(thumbTitle == undefined){
                    thumbTitle = "";
                }

                var thumbAlt = thumbnailDiv.attr('alt');
                if(thumbAlt == undefined){
                    thumbAlt = thumbSrc;
                }

                var imgHTML   = $('<img alt="'+ thumbAlt +'" title="'+ thumbTitle +'" src="'+ thumbSrc +'" />');

                if(imagesWithDimensions == true){
                    /* If the dmienssions are specified in the images then ignore them in the imagesLoaded plugin when you insert new items */
                    imgHTML.attr('data-dont-wait-for-me', 'yes');

                    thumbnailDiv.addClass('image-with-dimensions');

                    if( container.data('settings').waitUntilThumbLoads ){
                        imgHTML.hide();
                    }
                }

                thumbnailDiv.addClass('media-box-thumbnail-container').prepend(imgHTML);
            });

            if(imagesWithDimensions == true){

                    /* FadeIn the thumbnail or show broken thumbnail */
                    function fadeInOrBroken(image){
                        var $image          = $(image.img);
                        var thumbnailDiv    = $image.parents('.image-with-dimensions');
                        
                        if(thumbnailDiv[0] == undefined){ /* If is undefined it means that it has already been loaded or broken so skip it */
                            return;
                        }

                        if( image.isLoaded ){
                            $image.fadeIn(400, function(){ /* This will only be trigger if you hide the image above (if the "waitUntilThumbLoads" settings is true) */
                                thumbnailDiv.removeClass('image-with-dimensions'); 
                            }); 
                        }else{
                            thumbnailDiv.removeClass('image-with-dimensions');
                            $image.hide(); /* hide image since you are going to show a broken logo */
                            thumbnailDiv.addClass('broken-image-here');
                        }
                    }

                    /* FadeIn thumbnails that have dimensions specified if you want to show them after they have been loaded */
                    container.find('.image-with-dimensions').imagesLoadedMB()
                        .always(function(instance){
                            
                            /* In case the progress event don't get to show the images (this happens sometimes when you refresh the page) */
                            for(index in instance.images){
                                var image = instance.images[index];
                                fadeInOrBroken(image);
                            }

                        })
                        .progress(function(instance, image) {
                            
                            fadeInOrBroken(image);

                        });

            }

        }

        function setDimensionsToImageContainer(container){
            container.find(itemSelector).each(function(){
                var box             = $(this);

                var boxImage        = box.find(boxImageSelector);
                var thumbnailDiv    = boxImage.find('div[data-thumbnail]').eq(0); /* only one thumb allowed */
                var popupDiv        = boxImage.find('div[data-popup]').eq(0); /* only one popup allowed */

                if(thumbnailDiv[0] == undefined){ /* if you haven't sepcified a thumbnail then take the image */
                    thumbnailDiv   = popupDiv;
                }

                var display = box.css('display');
                if(display == 'none'){// If it is hidden, display to 'none' wont give you the right height so you need to do this trick
                    box.css('margin-top', 99999999999999).show();
                }

                boxImage.width( thumbnailDiv.width() );
                boxImage.height( thumbnailDiv.height() );

                if(display == 'none'){
                    box.css('margin-top', 0).hide();
                }
            });
        }

        /* ****** Calculate the right dimensions for the thumbnails ****** */
        function setStaticDimensionsOfThumbnails(container){
            
            container.find(itemSelector).find(boxImageSelector).each(function(){
                var boxImage        = $(this);
                var thumbnailDiv    = boxImage.find('div[data-thumbnail]').eq(0); /* only one thumb allowed */
                var popupDiv        = boxImage.find('div[data-popup]').eq(0); /* only one popup allowed */

                if(thumbnailDiv[0] == undefined){ /* if you haven't sepcified a thumbnail then take the image */
                    thumbnailDiv = popupDiv;
                }
                
                var imgWidth    = parseFloat( thumbnailDiv.data('width') );
                var imgHeight   = parseFloat( thumbnailDiv.data('height') );

                var newWidth    = boxImage.parents(itemSelector).width() - container.data('settings').horizontalSpaceBetweenBoxes;
                var newHeight   = (imgHeight * newWidth)/imgWidth;
                
                thumbnailDiv.css('width', newWidth);

                /* Set the height only to those thumbs with width and height specified */ 
                if( thumbnailDiv.data('width') != undefined || thumbnailDiv.data('height') != undefined ){
                    thumbnailDiv.css('height', Math.floor(newHeight));
                }
            });

        }
        
        /* ****** Set the width of the columns according to the settings specified ****** */
        function setColumnWidth(container, columnWidth, columns){
            var mediaBoxes = container.find(itemSelector);
            var newWidth;
            var percentage = false;

            if( columnWidth == 'auto' ){
                if(percentage){
                    newWidth = 100/columns+'%';
                }else{
                   //newWidth = Math.floor( (container.width()-1)/columns ); // minus 1px because some resolutions don't fit perfectly
                   newWidth = Math.floor(  Math.floor(container.width())/columns ); // minus 1px because some resolutions don't fit perfectly
                }
            }else{
                newWidth = columnWidth;
            }

            /* the width that the isotope logic will use for each column of the grid */
            container.find('.media-boxes-grid-sizer').css( 'width' , newWidth );
            
            mediaBoxes.each(function(index){
                var $this       = $(this);
                var boxColumns  = $this.data('columns');

                /* if the box has columns asigned, check that it doesn't have more than the number of columns in the grid */
                if(boxColumns != undefined && parseInt(boxColumns)>parseInt(columns)){
                    boxColumns = columns;
                }

                /* for columns that don't have data-columns specified */
                if(boxColumns == undefined){
                    boxColumns = 1;
                }
                
                /* Adjust the width */
                //if(boxColumns != undefined && parseInt(columns)>=parseInt(boxColumns)){ // erase this if you don't remember what it was
                //if(boxColumns != undefined){
                    if(percentage){
                        $this.css( 'width' , parseFloat(100/columns)*boxColumns+'%' );
                    }else{
                        $this.css( 'width' , newWidth*parseInt(boxColumns) );
                    }
                /*}else{
                    if(percentage){
                        $this.css( 'width' , parseFloat(100/columns)+'%' );
                    }else{
                        $this.css( 'width' , newWidth );
                    }
                }*/
            });
        }
        
        /* ****** Get viewport dimensions ****** */
        function viewport() {
            var e = window, a = 'inner';
            if (!('innerWidth' in window )) {
                a = 'client';
                e = document.documentElement || document.body;
            }
            return { width : e[ a+'Width' ] , height : e[ a+'Height' ] };
        }
        
        /* ****** Get and set the correct columnWidth for the current resolution ****** */
        function getAndSetColumnWidth(container){
            var resolutionFound = false;
            for (var key in container.data('settings').resolutions) {
                var value = container.data('settings').resolutions[key];
                
                if( value.maxWidth >= viewport().width ){
                    setColumnWidth(container, value.columnWidth, value.columns);
                    resolutionFound = true;
                    break;
                }
            }
            
            /* If there wasn't a match then use the default one */
            if( resolutionFound == false ){
                setColumnWidth(container, container.data('settings').columnWidth, container.data('settings').columns);
            }
        }

        /* ****** Add div with margins (for horizontal and vertical space) ****** */
        function addWrapperForMargins(container){
            var wrapper = $('<div class="media-box-container"></div')
                            .css({
                                    'margin-left' : container.data('settings').horizontalSpaceBetweenBoxes,
                                    'margin-bottom'  : container.data('settings').verticalSpaceBetweenBoxes
                                });

            var boxes = container.find(itemSelector+':not([data-wrapper-added])').attr('data-wrapper-added', 'yes');
            
            boxes.wrapInner( wrapper );
        }

        /* ****** Set the overlay depending on the overlay effect before the hover event is trigger ****** */
        function setupOverlayForHoverEffect(container){
            if( container.data('settings').thumbnailOverlay == false ) return;

            var boxes = container.find(itemSelector+':not([data-set-overlay-for-hover-effect])').attr('data-set-overlay-for-hover-effect', 'yes');

            /* Add extra divs for vertical aliognment */
            boxes.find('.thumbnail-overlay').wrapInner( "<div class='aligment'><div class='aligment'></div></div>" );

            boxes.each(function(){

                var box         = $(this);
                var boxImage    = box.find(boxImageSelector);
                var effect      = container.data('settings').overlayEffect;
                if(boxImage.data('overlay-effect') != undefined){
                    effect = boxImage.data('overlay-effect');
                }

                    /* Add wrapper for some effects */
                    if( effect == 'push-up' || effect == 'push-down' || effect == 'push-up-100%' || effect == 'push-down-100%'  ){
                        
                            var thumbnailDiv        = boxImage.find('.media-box-thumbnail-container');
                            var thumbnailOverlay    = boxImage.find('.thumbnail-overlay').css('position', 'relative');
                            if( effect == 'push-up-100%' || effect == 'push-down-100%' ){/* set the height of the overlay to the same of the thumbnail */
                                thumbnailOverlay.outerHeight( thumbnailDiv.outerHeight(false) );
                            }
                            var heightOverlay       = thumbnailOverlay.outerHeight(false);
                            


                            var wrapper             = $('<div class="wrapper-for-some-effects"></div');

                            if( effect == 'push-up' || effect == 'push-up-100%' ){
                                thumbnailOverlay.appendTo(boxImage);    
                            }else if( effect == 'push-down' || effect == 'push-down-100%'  ){
                                thumbnailOverlay.prependTo(boxImage);    
                                wrapper.css('margin-top', -heightOverlay);
                            }
                    
                            boxImage.wrapInner( wrapper );

                    }
                    /* Set some CSS style for this effects */
                    else if( effect == 'reveal-top' || effect == 'reveal-top-100%' ){
                        
                        box.addClass('position-reveal-effect');
                        
                        var overlay = box.find('.thumbnail-overlay').css('top', 0);
                        if( effect == 'reveal-top-100%' ){
                            overlay.css('height', '100%');
                        }

                    }else if( effect == 'reveal-bottom' || effect == 'reveal-bottom-100%' ){
                        
                        box.addClass('position-reveal-effect').addClass('position-bottom-reveal-effect');
                        
                        var overlay = box.find('.thumbnail-overlay').css('bottom', 0);
                        if( effect == 'reveal-bottom-100%' ){
                            overlay.css('height', '100%');
                        }

                    }else if( effect.substr(0, 9) == 'direction'){ // 'direction-aware', 'direction-aware-fade', 'direction-right', 'direction-left', 'direction-top', 'direction-bottom'

                        /* Set the height to 100% if not it would be just the default height of the overlay */
                        box.find('.thumbnail-overlay').css('height', '100%');

                    }else if( effect == 'fade' ){
                        
                        var thumbOverlay = box.find('.thumbnail-overlay').hide();
                        thumbOverlay.css({
                                            'height' : '100%',
                                            'top'    : '0',
                                            'left'   : '0',
                                        });
                        thumbOverlay.find('i.fa').css({ scale : 1.4 });

                    }

            });

        }

        function hideOverlaysOnResize(container){
            var boxes = container.find(itemSelector);

            boxes.each(function(){
                var box         = $(this);
                var boxImage    = box.find(boxImageSelector);
                var effect      = container.data('settings').overlayEffect;
                if(boxImage.data('overlay-effect') != undefined){
                    effect = boxImage.data('overlay-effect');
                }

                if( effect.substr(0, 9) == 'direction' ){
                    boxImage.find('.thumbnail-overlay').hide();
                }
            });

            /* reload isotope for the new width */
            container.isotopeMB('layout');
        }

    /* ====================================================================== *
            [3] EXTENDING ISOTOPE
     * ====================================================================== */

        /* ****** Extending Isotope on resize event ****** */
        $.extend( IsotopeMB.prototype, {
            resize : function() {
                /* Hack for setting the right sizes of the column */
                var container = $(this.element);
                getAndSetColumnWidth(container);
                setStaticDimensionsOfThumbnails(container);
                setDimensionsToImageContainer(container);
                hideOverlaysOnResize(container);
                /* End hack */
                
                // don't trigger if size did not change
                // or if resize was unbound. See #9
                if ( !this.isResizeBound || !this.needsResizeLayout() ) {
                    return;
                }

                this.layout();
            }
        });
        
        /* ****** Extending Isotope so when it does set the container width the plugin can refresh the lazy load feature ****** */
        $.extend( IsotopeMB.prototype, {
            _setContainerMeasure : function( measure, isWidth ) {
                  if ( measure === undefined ) {
                    return;
                  }

                  var elemSize = this.size;
                  // add padding and border width if border box
                  if ( elemSize.isBorderBox ) {
                    measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight +
                      elemSize.borderLeftWidth + elemSize.borderRightWidth :
                      elemSize.paddingBottom + elemSize.paddingTop +
                      elemSize.borderTopWidth + elemSize.borderBottomWidth;
                  }

                  measure = Math.max( measure, 0 );
                  this.element.style[ isWidth ? 'width' : 'height' ] = measure + 'px';
                  
                  /* Hack to refresh the waypoint */
                  var container = $(this.element);
                  $.waypoints('refresh');
                  container.addClass('lazy-load-ready');
                  /* End hack */

                  /* Remove this class since the grid has been resized due to the filtering system */
                  container.removeClass('filtering-isotope');
                  /* End Remove this class */
            }
        });

        /* ****** Extending Isotope so when you insert items they got the right settings (like columnWidth, staticDimensions, convertDivsIntoImages, etc.) ****** */
        $.extend( IsotopeMB.prototype, {
            insert : function( elems, callback ) {
                
                var container   = $(this.element);

                /* Make sure the new boxes got all the sorting targets, this must be before the items are passed to isotope */
                container.find(itemSelector).each(function(){
                    var mb = $(this);
                    for (var key in container.data('settings').getSortData) {
                        var obj = container.data('settings').getSortData[key];
                        if(mb.find(obj)[0] == undefined){
                            mb.append($('<div class="'+obj.substring(1)+'" style="display:none !important;" data-comment="This is added in JS because it needs it for sorting">ZZ</div>'));
                        }
                    }
                });
                
                /* COMMENT THIS FOR PREPEND */
                var items = this.addItems( elems );
                if ( !items.length ) {

                    /* Callback for inserting items, I added this 3 lines */
                    if (typeof callback === 'function'){
                        callback();
                    }

                    return;
                }   

                // Snippet (the insertBefore method so it is always ordered) 
                var firstHiddenBox = container.find('.'+itemHiddenClass)[0];
                // append item elements
                var i, item;
                var len = items.length;
                for ( i=0; i < len; i++ ) {
                  item = items[i];
                  if(firstHiddenBox != undefined){
                    this.element.insertBefore( item.element, firstHiddenBox );
                  }else{
                    this.element.appendChild( item.element );
                  }
                } 
                // End Snippet
                /**/

                var isotopeDefaultLogic = function(){

                    /* COMMENT THIS FOR PREPEND */
                    var filteredInsertItems = this._filter( items ).matches; /* when updating to Isotope V2.2.0 I had to add .matches */
                    // hide all newitems
                    this._noTransition( function() {
                      this.hide( filteredInsertItems );
                    });
                    // set flag
                    for ( i=0; i < len; i++ ) {
                      items[i].isLayoutInstant = true;
                    }
                    this.arrange();
                    // reset flag
                    for ( i=0; i < len; i++ ) {
                      delete items[i].isLayoutInstant;
                    }
                    this.reveal( filteredInsertItems );
                    /**/
                    
                    /* UNCOMMENT THIS FOR PREPEND
                    var items = this._itemize( elems );
                    if ( !items.length ) {
                      return;
                    }
                    // add items to beginning of collection
                    var previousItems = this.items.slice(0);
                    this.items = items.concat( previousItems );
                    // start new layout
                    this._resetLayout();
                    this._manageStamps();
                    // layout new stuff without transition
                    var filteredItems = this._filterRevealAdded( items );
                    // layout previous items
                    this.layoutItems( previousItems );
                    // add to filteredItems
                    this.filteredItems = filteredItems.concat( this.filteredItems );
                    $(this.element).isotopeMB('layout');*/
                }

                /* ======== Hack when inserting new boxes so they are properly converted ======== */
                var checkForBrokenImages = function(image){
                    var $image          = $(image.img);
                    var thumbnailDiv    = $image.parents('div[data-thumbnail], div[data-popup]');

                    if( image.isLoaded == false ){
                        $image.hide();
                        thumbnailDiv.addClass('broken-image-here');
                    }
                }



                var instance    = this;
                
                /* Set the vertical and horizontal space between boxes */
                addWrapperForMargins(container);
                
                /* Set the columnWidth and set the static dimensions of the images that have it specified */
                getAndSetColumnWidth(container);
                setStaticDimensionsOfThumbnails(container);

                addPopupTrigger(container);
                
                convertDivsIntoImages(container, false); /* only the ones that have NO width and height */

                container.find('img:not([data-dont-wait-for-me])').imagesLoadedMB()
                    .always(function(){
                        if( container.data('settings').waitForAllThumbsNoMatterWhat == false ){
                            convertDivsIntoImages(container, true); /* the ones left that have width and height */                  
                        }

                        /* Add the class to show the box */
                        container.find(itemSelector).addClass('media-box-loaded');

                        /* show or hide according to the searching criteria */
                        $(container.data('settings').search).trigger('keyup');

                        /* Now you can call the default logic of the insert method from Isotope */
                        isotopeDefaultLogic.call(instance);

                        setDimensionsToImageContainer(container); /* set the same dimensions of the thumbnail to the container (for caption purposes) */

                        setupOverlayForHoverEffect(container);

                        /* Callback for inserting items */
                        if (typeof callback === 'function'){
                            callback();
                        }

                        /* In case the progress event don't get to check for broken images (this happens sometimes when you refresh the page) */
                        for(index in instance.images){
                            var image = instance.images[index];
                            checkForBrokenImages(image);
                        }
                    })
                    .progress(function( instance, image ) {
                        /* For broken images */
                        checkForBrokenImages(image);
                    });
                
                /* ======== End Hack ======== */
            }                  
        });

    /* ====================================================================== *
            [4] FILTERING ISOTOPE
     * ====================================================================== */

        function updateFilterClasses(){
            var boxes         = $container.find(itemSelector+', .'+itemHiddenClass);   
            
            var filter = getCurrentFilter();
            boxes.filter( filter ).removeClass('hidden-media-boxes-by-filter').addClass('visible-media-boxes-by-filter');
            boxes.not( filter ).addClass('hidden-media-boxes-by-filter').removeClass('visible-media-boxes-by-filter');
        }

        function filterTheBoxes( filterValue, filterGroup ){
            /* Add a class until it resizes the grid */
            $container.addClass('filtering-isotope');

            // Combined the filters and filter isotope
            goAndFilterIsotope(filterValue, filterGroup);

            // update some CSS classes 
            updateFilterClasses();

            // Fix some details, like the loading button, the minBoxesPerFilter
            seeItFiltered();
        }

        function seeItFiltered(){
            // fix load more button
            if( getLoadingBoxesInCurrentFilter().length > 0 ){
                loading();
            }else{
                fixLoadMoreButton();
            }

            if( checkMinBoxesPerFilter() ){
                /* it will load the missing boxes */
            }
        }

        function goAndFilterIsotope(filterValue, filterGroup){
            // set filter for group
            filters[ filterGroup ] = filterValue;
            
            // set filters for Isotope
            $container.isotopeMB({ filter: combineFilters(filters) });
        }

        function combineFilters( filters ) {
            //Remove undefined values
            for ( var prop in filters ) {
                var filter = filters[ prop ];
                if(filter == undefined){
                    filters[ prop ] = '*';
                }
            }
            
            var longerFilter = ''; // i.e. navigation-bar 
            for ( var prop in filters ) {
                var filter = filters[ prop ];

                if(longerFilter == ''){
                    longerFilter = prop;
                }else if( longerFilter.split(',').length < filter.split(',').length ){
                    longerFilter = prop;
                }
            }

            var combinedFilters = filters[longerFilter]; // i.e. .images, .sounds
            for ( var prop in filters ) {
                if(prop == longerFilter)continue;

                var filterSplit = filters[ prop ].split(',');
                for(var i=0; i<filterSplit.length; i++){

                    var largerFilterSplit   = combinedFilters.split(',');
                    var newFilter           = [];
                    for(var j=0; j<largerFilterSplit.length; j++){
                        if(largerFilterSplit[j] == '*' && filterSplit[i] == '*'){
                            filterSplit[i] = '';
                        }else{
                            if(filterSplit[i] == '*'){
                                filterSplit[i] = '';
                            }   
                            if(largerFilterSplit[j] == '*'){
                                largerFilterSplit[j] = '';
                            }
                        }
                        
                        
                        newFilter.push( largerFilterSplit[j]+filterSplit[i] );
                    }
                    combinedFilters = newFilter.join(',');
                }
            }

            return combinedFilters;
        }

    /* ====================================================================== *
            [5] LOAD MORE BOXES
     * ====================================================================== */

        function checkMinBoxesPerFilter(){

            var boxesInCurrentCategory = getBoxesInCurrentFilter().length;

            /* Also check if there's boxes waiting to get load from that category, because maybe there isn't and there's no case to try to load them */
            if( boxesInCurrentCategory < settings.minBoxesPerFilter && hiddenBoxesWaitingToLoad().length > 0 ){
                /* Load the boxes that are missing */
                loadMore( settings.minBoxesPerFilter - boxesInCurrentCategory );

                return true;
            }

            return false;
        }

        function getBoxesInCurrentFilter(){
            var boxes = $container.find(itemSelector);   
            var filter = getCurrentFilter();
            if( filter != '*' ){
                boxes = boxes.filter( filter );
            }

            return boxes;
        }

        function getLoadingBoxesInCurrentFilter(){
            var boxes = getBoxesInCurrentFilter().not('.media-box-loaded');   

            return boxes;
        }

        function getCurrentFilter(){
            var filter = $container.data('isotopeMB').options.filter;
            if( filter == '' || filter == undefined ){
                filter = '*';
            }

            return filter;
        }

        function hiddenBoxesWaitingToLoad(ignoreFilter){ /* Number of hidden boxes waiting to get load, depending on the filter */
            var boxes = $container.find('.'+itemHiddenClass);   

            var filter = getCurrentFilter();
            if( filter != '*' && ignoreFilter == undefined){
                boxes = boxes.filter( filter );
            }

            return boxes;
        }

        function loading(){
            loadMoreButton.html(settings.LoadingWord);
            loadMoreButton.removeClass('media-boxes-load-more');
            loadMoreButton.addClass('media-boxes-loading');
        }

        function startLoading(){
            loadingsCounter++;

            loading();
        }

        function finishLoading(){
            loadingsCounter--;
            if(loadingsCounter == 0){
                fixLoadMoreButton();
            }
        }

        function fixLoadMoreButton(){
            loadMoreButton.removeClass('media-boxes-load-more');
            loadMoreButton.removeClass('media-boxes-loading');
            loadMoreButton.removeClass('media-boxes-no-more-entries');

            if( hiddenBoxesWaitingToLoad().length > 0 ){
                loadMoreButton.html(settings.loadMoreWord);
                loadMoreButton.addClass('media-boxes-load-more'); 
            }else{
                loadMoreButton.html(settings.noMoreEntriesWord); 
                loadMoreButton.addClass('media-boxes-no-more-entries');
            }
        }

        function loadMore( boxesToLoad, ignoreFilter){
            if( loadMoreButton.hasClass('media-boxes-no-more-entries') == true ){ /* Only if it is the "load more" button or the "loading...", no the "no more entries" button */
                return;
            }

            /* Loading... */
            startLoading();

            /* The new boxes */
            var newBoxes = [];

            /* Boxes that will be loaded as part of isotope */
            hiddenBoxesWaitingToLoad(ignoreFilter).each(function(index){
                var $this = $(this);
                if( (index+1) <=  boxesToLoad){ 
                    $this.removeClass(itemHiddenClass).addClass(itemClass);
                    $this.hide();
                    newBoxes.push(this);
                }
            }); 
            
            $container.isotopeMB( 'insert', $(newBoxes), function(){
                /* Fix Load More Button */   
                finishLoading();

                /* Force a relayout of Isotope */
                $container.isotopeMB('layout');

                // == START CUSTOMIZATION         REMEMBER: deepLinking:false , id of target1, target2 , hiddenStyle:{opacity:0,transform:"scale(0.001)"} 
                /*if(firstTime == true && location.hash.substr(0, 2) == '#-'){
                    var hash        = location.href.split('#-')[1];
                    var scrollTo    = $container.find('#'+hash);

                    if(scrollTo[0] != undefined){
                        setTimeout(function(){ 
                           $("body, html").animate({ 
                                scrollTop: scrollTo.offset().top 
                            }, 600);
                        }, 500);
                    }
                }*/
                // == END CUSTOMIZATION
            });
        }
        loadMore( settings.boxesToLoadStart, true);
        
        /* Load more boxes when you click the button */
        loadMoreButton.on('click', function(){
            loadMore( settings.boxesToLoad );
        });
        

        if( settings.lazyLoad ){

            /* Load more boxes when you reach the bottom of the grid */
            $container.waypoint(function(direction) {
                if( $container.hasClass('lazy-load-ready') ){
                    if( direction == 'down' && $container.hasClass('filtering-isotope') == false){
                        $container.removeClass('lazy-load-ready');
                        loadMore( settings.boxesToLoad );
                    }
                }
             }, {
                context: window,
                continuous: true,
                enabled: true,
                horizontal: false,
                offset: 'bottom-in-view',
                triggerOnce: false,   
             });

        }

    /* ====================================================================== *
            [6] FILTER
     * ====================================================================== */   

        var filterContainer = $(settings.filterContainer);  
        
        filterContainer.on('click', settings.filter, function(e){
            var $this = $(this);
            
            /* Remove selected class from others */
            var filterContainer = $this.parents(settings.filterContainer);
            filterContainer.find(settings.filter).removeClass('selected');
            
            /* Add class of selected */
            $this.addClass('selected');

            /* Filter isotope */
            var filterValue = $this.attr('data-filter');
            var filterId = "filter";
            if (filterContainer.data("id") != undefined) {
                filterId = filterContainer.data("id")
            }
            filterTheBoxes( filterValue , filterId );

            e.preventDefault();
        });

        /* DEFAULT FILTERS SELECTED */
        filterContainer.each(function(){
            var $this = $(this);
            var f = $this.find(settings.filter).filter('.selected');
            if(f[0]==undefined)return;

            /* Filter isotope */
            var filterValue = f.attr('data-filter');
            var filterId = "filter";
            if ($this.data("id") != undefined) {
                filterId = $this.data("id")
            }

            //filters[ filterId ] = filterValue;
            goAndFilterIsotope(filterValue, filterId);
        });

        seeItFiltered();

        //var defFilter = filterContainer.find(settings.filter).filter('.selected').attr('data-filter');
        //filters[ 'filter' ] = defFilter;

        /* default search  selected */
        search( $(settings.search).val() );

    /* ====================================================================== *
            [7] SEARCH
     * ====================================================================== */     

        function search(value){
            if(value == undefined) return;

            var allBoxes = $container.find('.'+itemClass+', .'+itemHiddenClass);
            if(value == ''){
                /* If there's nothing in the input text field then show all the boxes */
                allBoxes.addClass('search-match');
            }else{
                allBoxes.removeClass('search-match');

                $container.find(settings.searchTarget).each(function(){
                    var $this = $(this);
                    var box   = $this.parents('.'+itemClass+', .'+itemHiddenClass);
                    if( $this.text().toLowerCase().indexOf(value.toLowerCase()) !== -1 ){
                        box.addClass('search-match');
                    }
                });
            }

            setTimeout( function() {
                filterTheBoxes('.search-match', 'search');
            }, 100 );
        }

        $(settings.search).on('keyup', function(){
            var value = $(this).val();

            search( value );
        });

    /* ====================================================================== *
            [8] SORTING
     * ====================================================================== */     

        function getSortDirection($this){
            var direction = $this.data('sort-ascending');
            if(direction == undefined){
                direction = true;
            }

            if($this.data('sort-toggle') && $this.data('sort-toggle') == true){
                $this.data('sort-ascending', !direction);
            }

            return direction;
        }

        $(settings.sortContainer).find(settings.sort).on('click', function(e){
            var $this = $(this);

            /* Remove selected class from others */
            $this.parents(settings.sortContainer).find(settings.sort).removeClass('selected');
            
            /* Add class of selected */
            $this.addClass('selected');

            /* Sort isotope */
            var sortValue = $this.attr('data-sort-by');
            $container.isotopeMB({ sortBy: sortValue, sortAscending: getSortDirection($this) });

            e.preventDefault();
        });

    /* ====================================================================== *
            [9] THUMBNAIL OVERLAY EFFECT
     * ====================================================================== */    

        function hideWhenDone(element){
            if( element.attr('data-stop') != undefined ){
                element.hide();
                element.removeAttr('data-stop');
            }
        }

        $container.on( 'mouseenter.hoverdir, mouseleave.hoverdir', boxImageSelector, function(event){
            if( settings.thumbnailOverlay == false ) return;

            var boxImage            = $(this);
            var effect              = settings.overlayEffect;
            if(boxImage.data('overlay-effect') != undefined){
                effect = boxImage.data('overlay-effect');
            }
            
            var eventType           = event.type;
            var thumbnailDiv        = boxImage.find('.media-box-thumbnail-container');
            var thumbnailOverlay    = boxImage.find('.thumbnail-overlay') ;
            var heightOverlay       = thumbnailOverlay.outerHeight(false);
            
            /* The effects */
            if( effect == 'push-up' || effect == 'push-up-100%' ){
                var wrapper = boxImage.find('div.wrapper-for-some-effects');

                if( eventType === 'mouseenter' ) {
                    wrapper.stop().show()[animation]({ 'margin-top': -heightOverlay }, settings.overlaySpeed, settings.overlayEasing); 
                }else{
                    wrapper.stop()[animation]({ 'margin-top': 0 }, settings.overlaySpeed, settings.overlayEasing); 
                }
            }

            else if( effect == 'push-down' || effect == 'push-down-100%' ){
                var wrapper = boxImage.find('div.wrapper-for-some-effects');

                if( eventType === 'mouseenter' ) {
                    wrapper.stop().show()[animation]({ 'margin-top': 0 }, settings.overlaySpeed, settings.overlayEasing); 
                }else{
                    wrapper.stop()[animation]({ 'margin-top': -heightOverlay }, settings.overlaySpeed, settings.overlayEasing); 
                }
            }

            else if( effect == 'reveal-top' || effect == 'reveal-top-100%' ){
                if( eventType === 'mouseenter' ) {
                    thumbnailDiv.stop().show()[animation]({ 'margin-top': heightOverlay }, settings.overlaySpeed, settings.overlayEasing); 
                }else{
                    thumbnailDiv.stop()[animation]({ 'margin-top': 0 }, settings.overlaySpeed, settings.overlayEasing); 
                }   
            }

            else if( effect == 'reveal-bottom' || effect == 'reveal-bottom-100%' ){
                if( eventType === 'mouseenter' ) {
                    thumbnailDiv.stop().show()[animation]({ 'margin-top': -heightOverlay }, settings.overlaySpeed, settings.overlayEasing); 
                }else{
                    thumbnailDiv.stop()[animation]({ 'margin-top': 0 }, settings.overlaySpeed, settings.overlayEasing); 
                }   
            }

            else if( effect.substr(0, 9) == 'direction' ){ // 'direction-aware', 'direction-aware-fade', 'direction-right', 'direction-left', 'direction-top', 'direction-bottom'
                var direction   = _getDir( boxImage, { x : event.pageX, y : event.pageY } );
                
                if( effect == 'direction-top' ){
                    direction   = 0;
                }else if( effect == 'direction-bottom' ){
                    direction   = 2;
                }else if( effect == 'direction-right' ){
                    direction   = 1;
                }else if( effect == 'direction-left' ){
                    direction   = 3
                }

                var cssPos      = _getPosition( direction, boxImage );

                if( eventType == 'mouseenter' ){
                    thumbnailOverlay.css( { 'left' : cssPos.from, 'top' : cssPos.to } );

                    thumbnailOverlay.stop().show().fadeTo(0, 1, function(){
                                                                    $(this).stop()[animation]({ 'left' : 0, 'top' : 0 }, settings.overlaySpeed, settings.overlayEasing); 
                                                                });
                }else{
                    if( effect == 'direction-aware-fade' ){
                        thumbnailOverlay.fadeOut(700);
                    }else{
                        thumbnailOverlay.stop()[animation]({ 'left' : cssPos.from, 'top' : cssPos.to }, settings.overlaySpeed, settings.overlayEasing ); 
                    }
                }
            }

            else if( effect == 'fade' ){

                if( eventType == 'mouseenter' ){
                    thumbnailOverlay.stop().fadeOut(0);
                    thumbnailOverlay.fadeIn( settings.overlaySpeed );
                }else{
                    thumbnailOverlay.stop().fadeIn(0);
                    thumbnailOverlay.fadeOut( settings.overlaySpeed );
                }

                /* Effect of the icons */
                var icons = thumbnailOverlay.find('i.fa');
                if( eventType == 'mouseenter' ){
                    icons.css({ scale: 1.4 }); 
                    icons[animation]({ scale: 1 }, 200); 
                }else{
                    icons.css({ scale: 1 }); 
                    icons[animation]({ scale: 1.4 }, 200); 
                }
            }


        });   


        /* ****** Methods for the direction-aware hover effect ****** */

        var _getDir = function( $el, coordinates ) {
            /** the width and height of the current div **/
            var w = $el.width(),
                h = $el.height(),

                /** calculate the x and y to get an angle to the center of the div from that x and y. **/
                /** gets the x value relative to the center of the DIV and "normalize" it **/
                x = ( coordinates.x - $el.offset().left - ( w/2 )) * ( w > h ? ( h/w ) : 1 ),
                y = ( coordinates.y - $el.offset().top  - ( h/2 )) * ( h > w ? ( w/h ) : 1 ),
            
                /** the angle and the direction from where the mouse came in/went out clockwise (TRBL=0123);**/
                /** first calculate the angle of the point, 
                add 180 deg to get rid of the negative values
                divide by 90 to get the quadrant
                add 3 and do a modulo by 4  to shift the quadrants to a proper clockwise TRBL (top/right/bottom/left) **/
                direction = Math.round( ( ( ( Math.atan2(y, x) * (180 / Math.PI) ) + 180 ) / 90 ) + 3 )  % 4;
            
            return direction;
            
        };

        var _getPosition = function( direction, $el ) {
            var fromLeft, fromTop;
            switch( direction ) {
                case 0:
                    // from top
                    if ( !settings.reverse ) { 
                            fromLeft = 0, fromTop = - $el.height() 
                    }else {  
                            fromLeft = 0, fromTop = - $el.height()  
                    }
                    break;
                case 1:
                    // from right
                    if ( !settings.reverse ) { 
                            fromLeft = $el.width()  , fromTop = 0
                    }else {  
                            fromLeft = - $el.width() , fromTop = 0 
                    }
                    break;
                case 2:
                    // from bottom
                    if ( !settings.reverse ) { 
                            fromLeft = 0 , fromTop = $el.height() 
                    }
                    else {  
                            fromLeft = 0, fromTop = - $el.height()  
                    }
                    break;
                case 3:
                    // from left
                    if ( !settings.reverse ) {
                            fromLeft = -$el.width()  , fromTop = 0
                    }
                    else {  
                            fromLeft =  $el.width(), fromTop = 0 
                    }
                    break;
            };
            return { from : fromLeft, to: fromTop };
        }; 


    /* ====================================================================== *
            [10] MAGNIFIC POPUP
     * ====================================================================== */

        var delegate = '.mb-open-popup[data-mfp-src]';
        
        if(settings.considerFilteringInPopup){
            delegate = itemSelector+':not(.hidden-media-boxes-by-filter) .mb-open-popup[data-mfp-src], .'+itemHiddenClass+':not(.hidden-media-boxes-by-filter) .mb-open-popup[data-mfp-src]';
        }
        if(settings.showOnlyLoadedBoxesInPopup){
            delegate = itemSelector+':visible .mb-open-popup[data-mfp-src]';
        }

        if(settings.magnificPopup){

            $container.magnificPopup({
                delegate: delegate, // child items selector, by clicking on it popup will open
                type: 'image',
                removalDelay : 200,
                closeOnContentClick : false,
                alignTop: settings.alignTop,
                preload: settings.preload,
                tLoading: 'loading...',
                mainClass : 'my-mfp-slide-bottom',
                gallery:{
                    enabled:settings.gallery
                },
                closeMarkup : '<button title="%title%" class="mfp-close"></button>',
                titleSrc: 'title',
                iframe : {
                    patterns : {
                        youtube: {
                          index: 'youtube.com/', // String that detects type of video (in this case YouTube). Simply via url.indexOf(index).

                          id: 'v=', // String that splits URL in a two parts, second part should be %id%
                          // Or null - full URL will be returned
                          // Or a function that should return %id%, for example:
                          // id: function(url) { return 'parsed id'; } 

                          src: 'https://www.youtube.com/embed/%id%?autoplay=1' // URL that will be set as a source for iframe. 
                        },
                        vimeo: {
                          index: 'vimeo.com/',
                          id: '/',
                          src: 'https://player.vimeo.com/video/%id%?autoplay=1'
                        },
                    },
                    markup : '<div class="mfp-iframe-scaler">'+
                                    '<div class="mfp-close"></div>'+
                                    '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>'+
                                    '<div class="mfp-bottom-bar" style="margin-top:4px;"><div class="mfp-title"></div><div class="mfp-counter"></div></div>'+
                             '</div>'                      
                },
                callbacks : {
                    change : function() {
                        var item    = $(this.currItem.el);
                        setTimeout(function(){ 
                            if(item.attr('mfp-title') != undefined){
                                $('.mfp-title').html(item.attr('mfp-title'));    
                            }else{
                                $('.mfp-title').html('');
                            }

                            if(item.attr('mfp-alt') != undefined){
                                $('.mfp-img').attr('alt', item.attr('mfp-alt'));    
                            }

                            // ==== SOCIAL BUTTONS ==== //

                            var FullURL             = location.href; // the url of your page
                            var URLWithoutHash      = location.href.replace(location.hash,""); // the url of your page without the hashtag
                            var imageURL            = item.attr('data-mfp-src'); // the image URL

                            // which URL do you want to share of the 3 options above?
                            var sharingURL = FullURL;


                            var social = "<div class='media-boxes-social-container'>";
                            if(settings.facebook != undefined){//FB
                              social+="<div class='media-boxes-facebook fa fa-facebook-square' data-url='"+sharingURL+"'></div>";
                            }
                            if(settings.twitter != undefined){//Twitter
                              social+="<div class='media-boxes-twitter fa fa-twitter-square' data-url='"+sharingURL+"'></div>";
                            }
                            if(settings.googleplus != undefined){//Google+
                              social+="<div class='media-boxes-googleplus fa fa-google-plus-square' data-url='"+sharingURL+"'></div>";
                            }
                            if(settings.pinterest != undefined){//Pintrest
                              social+="<div class='media-boxes-pinterest fa fa-pinterest-square' data-url='"+sharingURL+"'></div>";
                            }
                            social+="</div>";

                            var oldHTML = $('.mfp-title').html();
                            $('.mfp-title').html(oldHTML+social);

                            // ==== END SOCIAL BUTTONS ==== //


                        }, 5);

                        if(settings.deepLinking){
                            location.hash   = '#mb=' + item.attr('data-mfp-src') + '||' + item.parents('.media-boxes-container').attr('id'); /* with the "src" of the image and the "id" of the container */
                        }
                    },
                    beforeOpen: function() {
                        this.container.data('scrollTop', parseInt($(window).scrollTop()));
                    },
                    open: function(){
                        $('html, body').scrollTop( this.container.data('scrollTop') );
                    },
                    close: function () {
                        if(settings.deepLinking){
                            //window.location.hash = '#!';
                            
                            //if(history.pushState) {
                                //history.pushState(null, null, '#');
                            //}
                            //else {
                                location.hash = '#!';
                            //}
                        }
                    },
                },
            });

        }

        /* Instead of openning the youtube/vimeo video in the popup open it in the grid  */
        $container.on('click', '.mb-open-iframe-on-grid', function(){
            var $this   = $(this);
            var mbImage = $this.parents(itemSelector).find(boxImageSelector);

            show_video_on_grid(mbImage, $this.attr('iframe-on-grid-src'));
        });

        function show_video_on_grid(mbImage, src){
            var iframeContainer  = "";

            if(mbImage.find('.iframe-on-grid-container')[0] != undefined){
                iframeContainer = mbImage.find('.iframe-on-grid-container');
            }else{

                if(src.indexOf('vimeo.com/') > -1){
                    src = src.split('vimeo.com/').pop();
                    src = 'https://player.vimeo.com/video/'+src+'?autoplay=1';
                }else if(src.indexOf('youtube.com/') > -1){
                    src = src.split('?v=').pop();
                    src = 'https://www.youtube.com/embed/'+src+'?autoplay=1';
                }

                iframeContainer = $('<div class="iframe-on-grid-container"><iframe src="'+src+'" allowfullscreen></iframe></div>').appendTo(mbImage);

                iframeContainer.find('iframe').load(function(){
                    $(this).fadeIn(100);
                });
            }

            iframeContainer.fadeIn(300);
        }

    /* ====================================================================== *
            [11] DEEP LINKING
     * ====================================================================== */

        if(settings.deepLinking){
        
                function urlFromHash() {
                    if ( location.hash.indexOf('#mb=') == -1 ) {
                        return null;
                    }
                    // why not location.hash? => http://stackoverflow.com/q/4835784/298479
                    var hash    = location.href.split('#mb=')[1];
                    var id      = hash.split('||')[1];
                    var src     = hash.split('||')[0];
                    return {
                        hash: hash,
                        id: id,
                        src: src
                    };
                }

                var hashUrl = urlFromHash();
                if (hashUrl) {
                    $container.filter('[id="' + hashUrl.id + '"]').find('.mb-open-popup[data-mfp-src="' + hashUrl.src + '"]').trigger('click');
                }

                function doHash() {
                    var mp = $.magnificPopup.instance;
                    if (!mp) {
                        // this check is not needed in this example, but in some cases you might delay everything before
                        // this event e.g. until something else finished loading - in that case hashchange might trigger before
                        return;
                    }
                    
                    var url = urlFromHash();
                    if (!url && mp.isOpen) {
                        // no url => close popup
                        mp.close();
                    } else if (url) {
                        if ( mp.isOpen && mp.currItem && mp.currItem.el.parents('.media-boxes-container').attr('id') == url.id ) {
                            if( mp.currItem.el.attr('data-mfp-src') != url.src ){
                                // open => only update if necessary
                                var index = null;
                                $.each(mp.items, function (i, item) {
                                    var jqItem = item.parsed ? item.el : $(item);
                                    if (jqItem.attr('data-mfp-src') == url.src) {
                                        index = i;
                                        return false;
                                    }
                                });
                                if (index !== null) {
                                    mp.goTo(index);
                                }
                            }else{
                                // is already in the correct one
                            }
                        }else{
                            // not open or doesn't match the right one => simply click the matching link
                            $container.filter('[id="' + url.id + '"]').find('.mb-open-popup[data-mfp-src="' + url.src + '"]').trigger('click');
                        }
                    }
                }

                if (window.addEventListener) {
                    window.addEventListener("hashchange", doHash, false);
                } else if (window.attachEvent) {
                    window.attachEvent("onhashchange", doHash);  
                }

        }

    /* ====================================================================== *
            [12] SOCIAL IN MAGNIFIC POPUP
     * ====================================================================== */

        // OPEN WINDOWS FOR SHARING :D
        var openWindow = function(url){
            var w = window.open(url, "ftgw", "location=1,status=1,scrollbars=1,width=600,height=400");
            w.moveTo((screen.width / 2) - (300), (screen.height / 2) - (200));
        }

        //FACEBOOK SHARE
        $('body').on('click', 'div.media-boxes-facebook', function(){
            var $this = $(this);
            var url = encodeURIComponent($this.data('url'));
            url = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
            openWindow(url);
        });
        //TWITTER SHARE
        $('body').on('click', 'div.media-boxes-twitter', function(){
            var $this = $(this);
            var url = encodeURIComponent($this.data('url'));
            url = "https://twitter.com/intent/tweet?url=&text=" + url;
            openWindow(url);
        });
        //GOOGLE PLUS
        $('body').on('click', 'div.media-boxes-googleplus', function(){
            var $this = $(this);
            var url = encodeURIComponent($this.data('url'));
            url = 'https://plus.google.com/share?url=' + url
            openWindow(url);
        });
        //PINTREST
        $('body').on('click', 'div.media-boxes-pinterest', function(){
            var $this = $(this);
            var url = encodeURIComponent($this.data('url'));
            url = 'http://pinterest.com/pin/create/button/?url=' + url + '&media=' + url;
            openWindow(url);
        });







        return this;

    };//END OF FUSION OBJECT
    

     $.fn.mediaBoxes = function(options) {

        return this.each(function(key, value){
            var element = $(this);
            // Return early if this element already has a plugin instance
            if (element.data('mediaBoxes')) return element.data('mediaBoxes');
            // Pass options to plugin constructor
            var mediaBoxes = new MediaBoxes(this, options);
            // Store plugin object in this element's data
            element.data('mediaBoxes', mediaBoxes);
        });

    };
    
    //Default settings
    $.fn.mediaBoxes.defaults = {
        boxesToLoadStart: 8,
        boxesToLoad: 4,
        minBoxesPerFilter: 0,
        lazyLoad: true,
        horizontalSpaceBetweenBoxes: 15,
        verticalSpaceBetweenBoxes: 15,
        columnWidth: 'auto',
        columns: 4,
        resolutions: [
            {
                maxWidth: 960,
                columnWidth: 'auto',
                columns: 3,
            },
            {
                maxWidth: 650,
                columnWidth: 'auto',
                columns: 2,
            },
            {
                maxWidth: 450,
                columnWidth: 'auto',
                columns: 1,
            },
        ],
        filterContainer: '#filter',
        filter: 'a',
        search: '', // i.e. #search
        searchTarget: '.media-box-title',
        sortContainer: '', // i.e. #sort
        sort: 'a',
        getSortData: {
          title: '.media-box-title',
          text: '.media-box-text',
        }, 
        waitUntilThumbLoads: true, // When they have dimensions specified
        waitForAllThumbsNoMatterWhat: false, // Wait for all the thumbnails to load even if they got dimensions specified
        thumbnailOverlay: true, //Show the overlay on mouse over
        overlayEffect: 'fade', // 'push-up', 'push-down', 'push-up-100%', 'push-down-100%', 'reveal-top', 'reveal-bottom', 'reveal-top-100%', 'reveal-bottom-100%', 'direction-aware', 'direction-aware-fade', 'direction-right', 'direction-left', 'direction-top', 'direction-bottom', 'fade'
        overlaySpeed: 200,
        overlayEasing: 'default',
        showOnlyLoadedBoxesInPopup: false,
        considerFilteringInPopup: true,
        deepLinking: true,
        gallery: true,
        LoadingWord: 'Loading...',
        loadMoreWord: 'Load More',
        noMoreEntriesWord: 'No More Entries',
        alignTop: false,
        preload: [0,2],
        magnificPopup: true,

        //some sharing hidden options :D
        /*facebook: true,
        twitter: true,
        googleplus: true,
        pinterest: true,*/
    };




    /* DROP DOWN PLUGIN */

    (function(){


        /* CHECK FOR MOBILE BROWSER */ 
        function isMobileBrowser() {
            var check = false;
            (function(a){
                if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))
                    check = true
            })(navigator.userAgent||navigator.vendor||window.opera);

            if(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())) {
                check = true;
            }

            return check; 
        }

        function start($wrapper){
            var $menu           = $wrapper.find('.media-boxes-drop-down-menu');
            var $header         = $wrapper.find('.media-boxes-drop-down-header');
            
            function mouseout(){
                $menu.hide(); 
            };

            function mouseover(){
                $menu.show();
            };

            function updateHeader(){
                var $selectedDefault    = $menu.find( '.selected' );
                var $selected           = $selectedDefault.length ? $selectedDefault.parents('li') : $menu.children().first();
                var $clone              = $selected.clone().find('a').html();
                
                //$clone.removeAttr('data-sort-toggle').removeAttr('data-sort-by');
                $header.html( '<span class="fa fa-sort-desc"></span>' + $clone );
            }
            updateHeader();

            function click(e){
                e.preventDefault();
                //e.stopPropagation();
                
                $(this).parents('li').siblings('li').find('a').removeClass('selected').end().end().find('a').addClass('selected');
                updateHeader();

                //mouseout();
            }

            if(isMobileBrowser()){
            //if(true){

                function clickToggle(e){
                    e.stopPropagation();

                    if($menu.is(":visible")){
                        mouseout();
                    }else{
                        mouseover();
                    }
                }

                $('body').on('click', function(){
                    if($menu.is(":visible")){
                        mouseout();
                    }
                })

                $header
                    .bind('click', clickToggle);

                $menu.find('> li > *')
                    .bind('click', click);
            }else{
                $header
                    .bind('mouseout', mouseout)
                    .bind('mouseover', mouseover);

                $menu
                    .bind('mouseout', mouseout)
                    .bind('mouseover', mouseover);

                $menu.find('> li > *')    
                    .bind('click', click);
            }

            $header.on('click', 'a', function(e){
                e.preventDefault();
                //return false;
            });

        }


        $('.media-boxes-drop-down').each(function(){
            start($(this));
        });

    })();


    
})( window, jQuery );
/*!
 * jQuery Transit - CSS3 transitions and transformations
 * (c) 2011-2012 Rico Sta. Cruz
 * MIT Licensed.
 *
 * http://ricostacruz.com/jquery.transit
 * http://github.com/rstacruz/jquery.transit
 */

(function(k){k.transit={version:"0.9.9",propertyMap:{marginLeft:"margin",marginRight:"margin",marginBottom:"margin",marginTop:"margin",paddingLeft:"padding",paddingRight:"padding",paddingBottom:"padding",paddingTop:"padding"},enabled:true,useTransitionEnd:false};var d=document.createElement("div");var q={};function b(v){if(v in d.style){return v}var u=["Moz","Webkit","O","ms"];var r=v.charAt(0).toUpperCase()+v.substr(1);for(var t=0;t<u.length;++t){var s=u[t]+r;if(s in d.style){return s}}}function e(){d.style[q.transform]="";d.style[q.transform]="rotateY(90deg)";return d.style[q.transform]!==""}var a=navigator.userAgent.toLowerCase().indexOf("chrome")>-1;q.transition=b("transition");q.transitionDelay=b("transitionDelay");q.transform=b("transform");q.transformOrigin=b("transformOrigin");q.filter=b("Filter");q.transform3d=e();var i={transition:"transitionend",MozTransition:"transitionend",OTransition:"oTransitionEnd",WebkitTransition:"webkitTransitionEnd",msTransition:"MSTransitionEnd"};var f=q.transitionEnd=i[q.transition]||null;for(var p in q){if(q.hasOwnProperty(p)&&typeof k.support[p]==="undefined"){k.support[p]=q[p]}}d=null;k.cssEase={_default:"ease","in":"ease-in",out:"ease-out","in-out":"ease-in-out",snap:"cubic-bezier(0,1,.5,1)",easeInCubic:"cubic-bezier(.550,.055,.675,.190)",easeOutCubic:"cubic-bezier(.215,.61,.355,1)",easeInOutCubic:"cubic-bezier(.645,.045,.355,1)",easeInCirc:"cubic-bezier(.6,.04,.98,.335)",easeOutCirc:"cubic-bezier(.075,.82,.165,1)",easeInOutCirc:"cubic-bezier(.785,.135,.15,.86)",easeInExpo:"cubic-bezier(.95,.05,.795,.035)",easeOutExpo:"cubic-bezier(.19,1,.22,1)",easeInOutExpo:"cubic-bezier(1,0,0,1)",easeInQuad:"cubic-bezier(.55,.085,.68,.53)",easeOutQuad:"cubic-bezier(.25,.46,.45,.94)",easeInOutQuad:"cubic-bezier(.455,.03,.515,.955)",easeInQuart:"cubic-bezier(.895,.03,.685,.22)",easeOutQuart:"cubic-bezier(.165,.84,.44,1)",easeInOutQuart:"cubic-bezier(.77,0,.175,1)",easeInQuint:"cubic-bezier(.755,.05,.855,.06)",easeOutQuint:"cubic-bezier(.23,1,.32,1)",easeInOutQuint:"cubic-bezier(.86,0,.07,1)",easeInSine:"cubic-bezier(.47,0,.745,.715)",easeOutSine:"cubic-bezier(.39,.575,.565,1)",easeInOutSine:"cubic-bezier(.445,.05,.55,.95)",easeInBack:"cubic-bezier(.6,-.28,.735,.045)",easeOutBack:"cubic-bezier(.175, .885,.32,1.275)",easeInOutBack:"cubic-bezier(.68,-.55,.265,1.55)"};k.cssHooks["transit:transform"]={get:function(r){return k(r).data("transform")||new j()},set:function(s,r){var t=r;if(!(t instanceof j)){t=new j(t)}if(q.transform==="WebkitTransform"&&!a){s.style[q.transform]=t.toString(true)}else{s.style[q.transform]=t.toString()}k(s).data("transform",t)}};k.cssHooks.transform={set:k.cssHooks["transit:transform"].set};k.cssHooks.filter={get:function(r){return r.style[q.filter]},set:function(r,s){r.style[q.filter]=s}};if(k.fn.jquery<"1.8"){k.cssHooks.transformOrigin={get:function(r){return r.style[q.transformOrigin]},set:function(r,s){r.style[q.transformOrigin]=s}};k.cssHooks.transition={get:function(r){return r.style[q.transition]},set:function(r,s){r.style[q.transition]=s}}}n("scale");n("scaleX");n("scaleY");n("translate");n("rotate");n("rotateX");n("rotateY");n("rotate3d");n("perspective");n("skewX");n("skewY");n("x",true);n("y",true);function j(r){if(typeof r==="string"){this.parse(r)}return this}j.prototype={setFromString:function(t,s){var r=(typeof s==="string")?s.split(","):(s.constructor===Array)?s:[s];r.unshift(t);j.prototype.set.apply(this,r)},set:function(s){var r=Array.prototype.slice.apply(arguments,[1]);if(this.setter[s]){this.setter[s].apply(this,r)}else{this[s]=r.join(",")}},get:function(r){if(this.getter[r]){return this.getter[r].apply(this)}else{return this[r]||0}},setter:{rotate:function(r){this.rotate=o(r,"deg")},rotateX:function(r){this.rotateX=o(r,"deg")},rotateY:function(r){this.rotateY=o(r,"deg")},scale:function(r,s){if(s===undefined){s=r}this.scale=r+","+s},skewX:function(r){this.skewX=o(r,"deg")},skewY:function(r){this.skewY=o(r,"deg")},perspective:function(r){this.perspective=o(r,"px")},x:function(r){this.set("translate",r,null)},y:function(r){this.set("translate",null,r)},translate:function(r,s){if(this._translateX===undefined){this._translateX=0}if(this._translateY===undefined){this._translateY=0}if(r!==null&&r!==undefined){this._translateX=o(r,"px")}if(s!==null&&s!==undefined){this._translateY=o(s,"px")}this.translate=this._translateX+","+this._translateY}},getter:{x:function(){return this._translateX||0},y:function(){return this._translateY||0},scale:function(){var r=(this.scale||"1,1").split(",");if(r[0]){r[0]=parseFloat(r[0])}if(r[1]){r[1]=parseFloat(r[1])}return(r[0]===r[1])?r[0]:r},rotate3d:function(){var t=(this.rotate3d||"0,0,0,0deg").split(",");for(var r=0;r<=3;++r){if(t[r]){t[r]=parseFloat(t[r])}}if(t[3]){t[3]=o(t[3],"deg")}return t}},parse:function(s){var r=this;s.replace(/([a-zA-Z0-9]+)\((.*?)\)/g,function(t,v,u){r.setFromString(v,u)})},toString:function(t){var s=[];for(var r in this){if(this.hasOwnProperty(r)){if((!q.transform3d)&&((r==="rotateX")||(r==="rotateY")||(r==="perspective")||(r==="transformOrigin"))){continue}if(r[0]!=="_"){if(t&&(r==="scale")){s.push(r+"3d("+this[r]+",1)")}else{if(t&&(r==="translate")){s.push(r+"3d("+this[r]+",0)")}else{s.push(r+"("+this[r]+")")}}}}}return s.join(" ")}};function m(s,r,t){if(r===true){s.queue(t)}else{if(r){s.queue(r,t)}else{s.each(function(){t.call(this)})}}}function h(s){var r=[];k.each(s,function(t){t=k.camelCase(t);t=k.transit.propertyMap[t]||k.cssProps[t]||t;t=c(t);if(q[t]){t=c(q[t])}if(k.inArray(t,r)===-1){r.push(t)}});return r}function g(s,v,x,r){var t=h(s);if(k.cssEase[x]){x=k.cssEase[x]}var w=""+l(v)+" "+x;if(parseInt(r,10)>0){w+=" "+l(r)}var u=[];k.each(t,function(z,y){u.push(y+" "+w)});return u.join(", ")}k.fn.transition=k.fn.transit=function(A,t,z,D){var E=this;var v=0;var x=true;var r=jQuery.extend(true,{},A);if(typeof t==="function"){D=t;t=undefined}if(typeof t==="object"){z=t.easing;v=t.delay||0;x=typeof t.queue==="undefined"?true:t.queue;D=t.complete;t=t.duration}if(typeof z==="function"){D=z;z=undefined}if(typeof r.easing!=="undefined"){z=r.easing;delete r.easing}if(typeof r.duration!=="undefined"){t=r.duration;delete r.duration}if(typeof r.complete!=="undefined"){D=r.complete;delete r.complete}if(typeof r.queue!=="undefined"){x=r.queue;delete r.queue}if(typeof r.delay!=="undefined"){v=r.delay;delete r.delay}if(typeof t==="undefined"){t=k.fx.speeds._default}if(typeof z==="undefined"){z=k.cssEase._default}t=l(t);var F=g(r,t,z,v);var C=k.transit.enabled&&q.transition;var u=C?(parseInt(t,10)+parseInt(v,10)):0;if(u===0){var B=function(G){E.css(r);if(D){D.apply(E)}if(G){G()}};m(E,x,B);return E}var y={};var s=function(I){var H=false;var G=function(){if(H){E.unbind(f,G)}if(u>0){E.each(function(){this.style[q.transition]=(y[this]||null)})}if(typeof D==="function"){D.apply(E)}if(typeof I==="function"){I()}};if((u>0)&&(f)&&(k.transit.useTransitionEnd)){H=true;E.bind(f,G)}else{window.setTimeout(G,u)}E.each(function(){if(u>0){this.style[q.transition]=F}k(this).css(A)})};var w=function(G){this.offsetWidth;s(G)};m(E,x,w);return this};function n(s,r){if(!r){k.cssNumber[s]=true}k.transit.propertyMap[s]=q.transform;k.cssHooks[s]={get:function(v){var u=k(v).css("transit:transform");return u.get(s)},set:function(v,w){var u=k(v).css("transit:transform");u.setFromString(s,w);k(v).css({"transit:transform":u})}}}function c(r){return r.replace(/([A-Z])/g,function(s){return"-"+s.toLowerCase()})}function o(s,r){if((typeof s==="string")&&(!s.match(/^[\-0-9\.]+$/))){return s}else{return""+s+r}}function l(s){var r=s;if(typeof r==="string"&&(!r.match(/^[\-0-9\.]+/))){r=k.fx.speeds[r]||k.fx.speeds._default}return o(r,"ms")}k.transit.getTransitionValue=g})(jQuery);
// Generated by CoffeeScript 1.6.2
/*
jQuery Waypoints - v2.0.4
Copyright (c) 2011-2014 Caleb Troughton
Dual licensed under the MIT license and GPL license.
https://github.com/imakewebthings/jquery-waypoints/blob/master/licenses.txt
*/
(function(){var t=[].indexOf||function(t){for(var e=0,n=this.length;e<n;e++){if(e in this&&this[e]===t)return e}return-1},e=[].slice;(function(t,e){if(typeof define==="function"&&define.amd){return define("waypoints",["jquery"],function(n){return e(n,t)})}else{return e(t.jQuery,t)}})(this,function(n,r){var i,o,l,s,f,u,c,a,h,d,p,y,v,w,g,m;i=n(r);a=t.call(r,"ontouchstart")>=0;s={horizontal:{},vertical:{}};f=1;c={};u="waypoints-context-id";p="resize.waypoints";y="scroll.waypoints";v=1;w="waypoints-waypoint-ids";g="waypoint";m="waypoints";o=function(){function t(t){var e=this;this.$element=t;this.element=t[0];this.didResize=false;this.didScroll=false;this.id="context"+f++;this.oldScroll={x:t.scrollLeft(),y:t.scrollTop()};this.waypoints={horizontal:{},vertical:{}};this.element[u]=this.id;c[this.id]=this;t.bind(y,function(){var t;if(!(e.didScroll||a)){e.didScroll=true;t=function(){e.doScroll();return e.didScroll=false};return r.setTimeout(t,n[m].settings.scrollThrottle)}});t.bind(p,function(){var t;if(!e.didResize){e.didResize=true;t=function(){n[m]("refresh");return e.didResize=false};return r.setTimeout(t,n[m].settings.resizeThrottle)}})}t.prototype.doScroll=function(){var t,e=this;t={horizontal:{newScroll:this.$element.scrollLeft(),oldScroll:this.oldScroll.x,forward:"right",backward:"left"},vertical:{newScroll:this.$element.scrollTop(),oldScroll:this.oldScroll.y,forward:"down",backward:"up"}};if(a&&(!t.vertical.oldScroll||!t.vertical.newScroll)){n[m]("refresh")}n.each(t,function(t,r){var i,o,l;l=[];o=r.newScroll>r.oldScroll;i=o?r.forward:r.backward;n.each(e.waypoints[t],function(t,e){var n,i;if(r.oldScroll<(n=e.offset)&&n<=r.newScroll){return l.push(e)}else if(r.newScroll<(i=e.offset)&&i<=r.oldScroll){return l.push(e)}});l.sort(function(t,e){return t.offset-e.offset});if(!o){l.reverse()}return n.each(l,function(t,e){if(e.options.continuous||t===l.length-1){return e.trigger([i])}})});return this.oldScroll={x:t.horizontal.newScroll,y:t.vertical.newScroll}};t.prototype.refresh=function(){var t,e,r,i=this;r=n.isWindow(this.element);e=this.$element.offset();this.doScroll();t={horizontal:{contextOffset:r?0:e.left,contextScroll:r?0:this.oldScroll.x,contextDimension:this.$element.width(),oldScroll:this.oldScroll.x,forward:"right",backward:"left",offsetProp:"left"},vertical:{contextOffset:r?0:e.top,contextScroll:r?0:this.oldScroll.y,contextDimension:r?n[m]("viewportHeight"):this.$element.height(),oldScroll:this.oldScroll.y,forward:"down",backward:"up",offsetProp:"top"}};return n.each(t,function(t,e){return n.each(i.waypoints[t],function(t,r){var i,o,l,s,f;i=r.options.offset;l=r.offset;o=n.isWindow(r.element)?0:r.$element.offset()[e.offsetProp];if(n.isFunction(i)){i=i.apply(r.element)}else if(typeof i==="string"){i=parseFloat(i);if(r.options.offset.indexOf("%")>-1){i=Math.ceil(e.contextDimension*i/100)}}r.offset=o-e.contextOffset+e.contextScroll-i;if(r.options.onlyOnScroll&&l!=null||!r.enabled){return}if(l!==null&&l<(s=e.oldScroll)&&s<=r.offset){return r.trigger([e.backward])}else if(l!==null&&l>(f=e.oldScroll)&&f>=r.offset){return r.trigger([e.forward])}else if(l===null&&e.oldScroll>=r.offset){return r.trigger([e.forward])}})})};t.prototype.checkEmpty=function(){if(n.isEmptyObject(this.waypoints.horizontal)&&n.isEmptyObject(this.waypoints.vertical)){this.$element.unbind([p,y].join(" "));return delete c[this.id]}};return t}();l=function(){function t(t,e,r){var i,o;r=n.extend({},n.fn[g].defaults,r);if(r.offset==="bottom-in-view"){r.offset=function(){var t;t=n[m]("viewportHeight");if(!n.isWindow(e.element)){t=e.$element.height()}return t-n(this).outerHeight()}}this.$element=t;this.element=t[0];this.axis=r.horizontal?"horizontal":"vertical";this.callback=r.handler;this.context=e;this.enabled=r.enabled;this.id="waypoints"+v++;this.offset=null;this.options=r;e.waypoints[this.axis][this.id]=this;s[this.axis][this.id]=this;i=(o=this.element[w])!=null?o:[];i.push(this.id);this.element[w]=i}t.prototype.trigger=function(t){if(!this.enabled){return}if(this.callback!=null){this.callback.apply(this.element,t)}if(this.options.triggerOnce){return this.destroy()}};t.prototype.disable=function(){return this.enabled=false};t.prototype.enable=function(){this.context.refresh();return this.enabled=true};t.prototype.destroy=function(){delete s[this.axis][this.id];delete this.context.waypoints[this.axis][this.id];return this.context.checkEmpty()};t.getWaypointsByElement=function(t){var e,r;r=t[w];if(!r){return[]}e=n.extend({},s.horizontal,s.vertical);return n.map(r,function(t){return e[t]})};return t}();d={init:function(t,e){var r;if(e==null){e={}}if((r=e.handler)==null){e.handler=t}this.each(function(){var t,r,i,s;t=n(this);i=(s=e.context)!=null?s:n.fn[g].defaults.context;if(!n.isWindow(i)){i=t.closest(i)}i=n(i);r=c[i[0][u]];if(!r){r=new o(i)}return new l(t,r,e)});n[m]("refresh");return this},disable:function(){return d._invoke.call(this,"disable")},enable:function(){return d._invoke.call(this,"enable")},destroy:function(){return d._invoke.call(this,"destroy")},prev:function(t,e){return d._traverse.call(this,t,e,function(t,e,n){if(e>0){return t.push(n[e-1])}})},next:function(t,e){return d._traverse.call(this,t,e,function(t,e,n){if(e<n.length-1){return t.push(n[e+1])}})},_traverse:function(t,e,i){var o,l;if(t==null){t="vertical"}if(e==null){e=r}l=h.aggregate(e);o=[];this.each(function(){var e;e=n.inArray(this,l[t]);return i(o,e,l[t])});return this.pushStack(o)},_invoke:function(t){this.each(function(){var e;e=l.getWaypointsByElement(this);return n.each(e,function(e,n){n[t]();return true})});return this}};n.fn[g]=function(){var t,r;r=arguments[0],t=2<=arguments.length?e.call(arguments,1):[];if(d[r]){return d[r].apply(this,t)}else if(n.isFunction(r)){return d.init.apply(this,arguments)}else if(n.isPlainObject(r)){return d.init.apply(this,[null,r])}else if(!r){return n.error("jQuery Waypoints needs a callback function or handler option.")}else{return n.error("The "+r+" method does not exist in jQuery Waypoints.")}};n.fn[g].defaults={context:r,continuous:true,enabled:true,horizontal:false,offset:0,triggerOnce:false};h={refresh:function(){return n.each(c,function(t,e){return e.refresh()})},viewportHeight:function(){var t;return(t=r.innerHeight)!=null?t:i.height()},aggregate:function(t){var e,r,i;e=s;if(t){e=(i=c[n(t)[0][u]])!=null?i.waypoints:void 0}if(!e){return[]}r={horizontal:[],vertical:[]};n.each(r,function(t,i){n.each(e[t],function(t,e){return i.push(e)});i.sort(function(t,e){return t.offset-e.offset});r[t]=n.map(i,function(t){return t.element});return r[t]=n.unique(r[t])});return r},above:function(t){if(t==null){t=r}return h._filter(t,"vertical",function(t,e){return e.offset<=t.oldScroll.y})},below:function(t){if(t==null){t=r}return h._filter(t,"vertical",function(t,e){return e.offset>t.oldScroll.y})},left:function(t){if(t==null){t=r}return h._filter(t,"horizontal",function(t,e){return e.offset<=t.oldScroll.x})},right:function(t){if(t==null){t=r}return h._filter(t,"horizontal",function(t,e){return e.offset>t.oldScroll.x})},enable:function(){return h._invoke("enable")},disable:function(){return h._invoke("disable")},destroy:function(){return h._invoke("destroy")},extendFn:function(t,e){return d[t]=e},_invoke:function(t){var e;e=n.extend({},s.vertical,s.horizontal);return n.each(e,function(e,n){n[t]();return true})},_filter:function(t,e,r){var i,o;i=c[n(t)[0][u]];if(!i){return[]}o=[];n.each(i.waypoints[e],function(t,e){if(r(i,e)){return o.push(e)}});o.sort(function(t,e){return t.offset-e.offset});return n.map(o,function(t){return t.element})}};n[m]=function(){var t,n;n=arguments[0],t=2<=arguments.length?e.call(arguments,1):[];if(h[n]){return h[n].apply(null,t)}else{return h.aggregate.call(null,n)}};n[m].settings={resizeThrottle:100,scrollThrottle:30};return i.load(function(){return n[m]("refresh")})})}).call(this);
/*	
 * jQuery mmenu v5.3.4
 * @requires jQuery 1.7.0 or later
 *
 * mmenu.frebsite.nl
 *	
 * Copyright (c) Fred Heusschen
 * www.frebsite.nl
 *
 * Licensed under the MIT license:
 * http://en.wikipedia.org/wiki/MIT_License
 */
!function(e){function t(){e[n].glbl||(l={$wndw:e(window),$html:e("html"),$body:e("body")},a={},i={},r={},e.each([a,i,r],function(e,t){t.add=function(e){e=e.split(" ");for(var n=0,s=e.length;s>n;n++)t[e[n]]=t.mm(e[n])}}),a.mm=function(e){return"mm-"+e},a.add("wrapper menu panel nopanel current highest opened subopened navbar hasnavbar title btn prev next listview nolistview inset vertical selected divider spacer hidden fullsubopen"),a.umm=function(e){return"mm-"==e.slice(0,3)&&(e=e.slice(3)),e},i.mm=function(e){return"mm-"+e},i.add("parent sub"),r.mm=function(e){return e+".mm"},r.add("transitionend webkitTransitionEnd mousedown mouseup touchstart touchmove touchend click keydown"),e[n]._c=a,e[n]._d=i,e[n]._e=r,e[n].glbl=l)}var n="mmenu",s="5.3.4";if(!e[n]){e[n]=function(e,t,n){this.$menu=e,this._api=["bind","init","update","setSelected","getInstance","openPanel","closePanel","closeAllPanels"],this.opts=t,this.conf=n,this.vars={},this.cbck={},"function"==typeof this.___deprecated&&this.___deprecated(),this._initMenu(),this._initAnchors();var s=this.$menu.children(this.conf.panelNodetype);return this._initAddons(),this.init(s),"function"==typeof this.___debug&&this.___debug(),this},e[n].version=s,e[n].addons={},e[n].uniqueId=0,e[n].defaults={extensions:[],navbar:{add:!0,title:"Menu",titleLink:"panel"},onClick:{setSelected:!0},slidingSubmenus:!0},e[n].configuration={classNames:{divider:"Divider",inset:"Inset",panel:"Panel",selected:"Selected",spacer:"Spacer",vertical:"Vertical"},clone:!1,openingInterval:25,panelNodetype:"ul, ol, div",transitionDuration:400},e[n].prototype={init:function(e){e=e.not("."+a.nopanel),e=this._initPanels(e),this.trigger("init",e),this.trigger("update")},update:function(){this.trigger("update")},setSelected:function(e){this.$menu.find("."+a.listview).children().removeClass(a.selected),e.addClass(a.selected),this.trigger("setSelected",e)},openPanel:function(t){var s=t.parent();if(s.hasClass(a.vertical)){var i=s.parents("."+a.subopened);if(i.length)return this.openPanel(i.first());s.addClass(a.opened)}else{if(t.hasClass(a.current))return;var r=this.$menu.children("."+a.panel),l=r.filter("."+a.current);r.removeClass(a.highest).removeClass(a.current).not(t).not(l).not("."+a.vertical).addClass(a.hidden),e[n].support.csstransitions||l.addClass(a.hidden),t.hasClass(a.opened)?t.nextAll("."+a.opened).addClass(a.highest).removeClass(a.opened).removeClass(a.subopened):(t.addClass(a.highest),l.addClass(a.subopened)),t.removeClass(a.hidden).addClass(a.current),setTimeout(function(){t.removeClass(a.subopened).addClass(a.opened)},this.conf.openingInterval)}this.trigger("openPanel",t)},closePanel:function(e){var t=e.parent();t.hasClass(a.vertical)&&(t.removeClass(a.opened),this.trigger("closePanel",e))},closeAllPanels:function(){this.$menu.find("."+a.listview).children().removeClass(a.selected).filter("."+a.vertical).removeClass(a.opened);var e=this.$menu.children("."+a.panel),t=e.first();this.$menu.children("."+a.panel).not(t).removeClass(a.subopened).removeClass(a.opened).removeClass(a.current).removeClass(a.highest).addClass(a.hidden),this.openPanel(t)},togglePanel:function(e){var t=e.parent();t.hasClass(a.vertical)&&this[t.hasClass(a.opened)?"closePanel":"openPanel"](e)},getInstance:function(){return this},bind:function(e,t){this.cbck[e]=this.cbck[e]||[],this.cbck[e].push(t)},trigger:function(){var e=this,t=Array.prototype.slice.call(arguments),n=t.shift();if(this.cbck[n])for(var s=0,a=this.cbck[n].length;a>s;s++)this.cbck[n][s].apply(e,t)},_initMenu:function(){this.opts.offCanvas&&this.conf.clone&&(this.$menu=this.$menu.clone(!0),this.$menu.add(this.$menu.find("[id]")).filter("[id]").each(function(){e(this).attr("id",a.mm(e(this).attr("id")))})),this.$menu.contents().each(function(){3==e(this)[0].nodeType&&e(this).remove()}),this.$menu.parent().addClass(a.wrapper);var t=[a.menu];this.opts.slidingSubmenus||t.push(a.vertical),this.opts.extensions=this.opts.extensions.length?"mm-"+this.opts.extensions.join(" mm-"):"",this.opts.extensions&&t.push(this.opts.extensions),this.$menu.addClass(t.join(" "))},_initPanels:function(t){var n=this,s=this.__findAddBack(t,"ul, ol");this.__refactorClass(s,this.conf.classNames.inset,"inset").addClass(a.nolistview+" "+a.nopanel),s.not("."+a.nolistview).addClass(a.listview);var r=this.__findAddBack(t,"."+a.listview).children();this.__refactorClass(r,this.conf.classNames.selected,"selected"),this.__refactorClass(r,this.conf.classNames.divider,"divider"),this.__refactorClass(r,this.conf.classNames.spacer,"spacer"),this.__refactorClass(this.__findAddBack(t,"."+this.conf.classNames.panel),this.conf.classNames.panel,"panel");var l=e(),d=t.add(t.find("."+a.panel)).add(this.__findAddBack(t,"."+a.listview).children().children(this.conf.panelNodetype)).not("."+a.nopanel);this.__refactorClass(d,this.conf.classNames.vertical,"vertical"),this.opts.slidingSubmenus||d.addClass(a.vertical),d.each(function(){var t=e(this),s=t;t.is("ul, ol")?(t.wrap('<div class="'+a.panel+'" />'),s=t.parent()):s.addClass(a.panel);var i=t.attr("id");t.removeAttr("id"),s.attr("id",i||n.__getUniqueId()),t.hasClass(a.vertical)&&(t.removeClass(n.conf.classNames.vertical),s.add(s.parent()).addClass(a.vertical)),l=l.add(s)});var o=e("."+a.panel,this.$menu);l.each(function(){var t=e(this),s=t.parent(),r=s.children("a, span").first();if(s.is("."+a.menu)||(s.data(i.sub,t),t.data(i.parent,s)),!s.children("."+a.next).length&&s.parent().is("."+a.listview)){var l=t.attr("id"),d=e('<a class="'+a.next+'" href="#'+l+'" data-target="#'+l+'" />').insertBefore(r);r.is("span")&&d.addClass(a.fullsubopen)}if(!t.children("."+a.navbar).length&&!s.hasClass(a.vertical)){if(s.parent().is("."+a.listview))var s=s.closest("."+a.panel);else var r=s.closest("."+a.panel).find('a[href="#'+t.attr("id")+'"]').first(),s=r.closest("."+a.panel);var o=e('<div class="'+a.navbar+'" />');if(s.length){var l=s.attr("id");switch(n.opts.navbar.titleLink){case"anchor":_url=r.attr("href");break;case"panel":case"parent":_url="#"+l;break;case"none":default:_url=!1}o.append('<a class="'+a.btn+" "+a.prev+'" href="#'+l+'" data-target="#'+l+'"></a>').append('<a class="'+a.title+'"'+(_url?' href="'+_url+'"':"")+">"+r.text()+"</a>").prependTo(t),n.opts.navbar.add&&t.addClass(a.hasnavbar)}else n.opts.navbar.title&&(o.append('<a class="'+a.title+'">'+n.opts.navbar.title+"</a>").prependTo(t),n.opts.navbar.add&&t.addClass(a.hasnavbar))}});var c=this.__findAddBack(t,"."+a.listview).children("."+a.selected).removeClass(a.selected).last().addClass(a.selected);c.add(c.parentsUntil("."+a.menu,"li")).filter("."+a.vertical).addClass(a.opened).end().not("."+a.vertical).each(function(){e(this).parentsUntil("."+a.menu,"."+a.panel).not("."+a.vertical).first().addClass(a.opened).parentsUntil("."+a.menu,"."+a.panel).not("."+a.vertical).first().addClass(a.opened).addClass(a.subopened)}),c.children("."+a.panel).not("."+a.vertical).addClass(a.opened).parentsUntil("."+a.menu,"."+a.panel).not("."+a.vertical).first().addClass(a.opened).addClass(a.subopened);var u=o.filter("."+a.opened);return u.length||(u=l.first()),u.addClass(a.opened).last().addClass(a.current),l.not("."+a.vertical).not(u.last()).addClass(a.hidden).end().appendTo(this.$menu),l},_initAnchors:function(){var t=this;l.$body.on(r.click+"-oncanvas","a[href]",function(s){var i=e(this),r=!1,d=t.$menu.find(i).length;for(var o in e[n].addons)if(r=e[n].addons[o].clickAnchor.call(t,i,d))break;if(!r&&d){var c=i.attr("href");if(c.length>1&&"#"==c.slice(0,1))try{var u=e(c,t.$menu);u.is("."+a.panel)&&(r=!0,t[i.parent().hasClass(a.vertical)?"togglePanel":"openPanel"](u))}catch(h){}}if(r&&s.preventDefault(),!r&&d&&i.is("."+a.listview+" > li > a")&&!i.is('[rel="external"]')&&!i.is('[target="_blank"]')){t.__valueOrFn(t.opts.onClick.setSelected,i)&&t.setSelected(e(s.target).parent());var p=t.__valueOrFn(t.opts.onClick.preventDefault,i,"#"==c.slice(0,1));p&&s.preventDefault(),t.__valueOrFn(t.opts.onClick.blockUI,i,!p)&&l.$html.addClass(a.blocking),t.__valueOrFn(t.opts.onClick.close,i,p)&&t.close()}})},_initAddons:function(){for(var t in e[n].addons)e[n].addons[t].add.call(this),e[n].addons[t].add=function(){};for(var t in e[n].addons)e[n].addons[t].setup.call(this)},__api:function(){var t=this,n={};return e.each(this._api,function(){var e=this;n[e]=function(){var s=t[e].apply(t,arguments);return"undefined"==typeof s?n:s}}),n},__valueOrFn:function(e,t,n){return"function"==typeof e?e.call(t[0]):"undefined"==typeof e&&"undefined"!=typeof n?n:e},__refactorClass:function(e,t,n){return e.filter("."+t).removeClass(t).addClass(a[n])},__findAddBack:function(e,t){return e.find(t).add(e.filter(t))},__filterListItems:function(e){return e.not("."+a.divider).not("."+a.hidden)},__transitionend:function(e,t,n){var s=!1,a=function(){s||t.call(e[0]),s=!0};e.one(r.transitionend,a),e.one(r.webkitTransitionEnd,a),setTimeout(a,1.1*n)},__getUniqueId:function(){return a.mm(e[n].uniqueId++)}},e.fn[n]=function(s,a){return t(),s=e.extend(!0,{},e[n].defaults,s),a=e.extend(!0,{},e[n].configuration,a),this.each(function(){var t=e(this);if(!t.data(n)){var i=new e[n](t,s,a);t.data(n,i.__api())}})},e[n].support={touch:"ontouchstart"in window||navigator.msMaxTouchPoints,csstransitions:function(){if("undefined"!=typeof Modernizr)return Modernizr.csstransitions;var e=document.body||document.documentElement,t=e.style,n="transition";if("string"==typeof t[n])return!0;var s=["Moz","webkit","Webkit","Khtml","O","ms"];n=n.charAt(0).toUpperCase()+n.substr(1);for(var a=0;a<s.length;a++)if("string"==typeof t[s[a]+n])return!0;return!1}()};var a,i,r,l}}(jQuery);
/*	
 * jQuery mmenu offCanvas addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(t){var e="mmenu",o="offCanvas";t[e].addons[o]={setup:function(){if(this.opts[o]){var n=this.opts[o],i=this.conf[o];a=t[e].glbl,this._api=t.merge(this._api,["open","close","setPage"]),("top"==n.position||"bottom"==n.position)&&(n.zposition="front"),"string"!=typeof i.pageSelector&&(i.pageSelector="> "+i.pageNodetype),a.$allMenus=(a.$allMenus||t()).add(this.$menu),this.vars.opened=!1;var r=[s.offcanvas];"left"!=n.position&&r.push(s.mm(n.position)),"back"!=n.zposition&&r.push(s.mm(n.zposition)),this.$menu.addClass(r.join(" ")).parent().removeClass(s.wrapper),this.setPage(a.$page),this._initBlocker(),this["_initWindow_"+o](),this.$menu[i.menuInjectMethod+"To"](i.menuWrapperSelector)}},add:function(){s=t[e]._c,n=t[e]._d,i=t[e]._e,s.add("offcanvas slideout modal background opening blocker page"),n.add("style"),i.add("resize")},clickAnchor:function(t){if(!this.opts[o])return!1;var e=this.$menu.attr("id");if(e&&e.length&&(this.conf.clone&&(e=s.umm(e)),t.is('[href="#'+e+'"]')))return this.open(),!0;if(a.$page){var e=a.$page.first().attr("id");return e&&e.length&&t.is('[href="#'+e+'"]')?(this.close(),!0):!1}}},t[e].defaults[o]={position:"left",zposition:"back",modal:!1,moveBackground:!0},t[e].configuration[o]={pageNodetype:"div",pageSelector:null,wrapPageIfNeeded:!0,menuWrapperSelector:"body",menuInjectMethod:"prepend"},t[e].prototype.open=function(){if(!this.vars.opened){var t=this;this._openSetup(),setTimeout(function(){t._openFinish()},this.conf.openingInterval),this.trigger("open")}},t[e].prototype._openSetup=function(){var e=this;this.closeAllOthers(),a.$page.each(function(){t(this).data(n.style,t(this).attr("style")||"")}),a.$wndw.trigger(i.resize+"-offcanvas",[!0]);var r=[s.opened];this.opts[o].modal&&r.push(s.modal),this.opts[o].moveBackground&&r.push(s.background),"left"!=this.opts[o].position&&r.push(s.mm(this.opts[o].position)),"back"!=this.opts[o].zposition&&r.push(s.mm(this.opts[o].zposition)),this.opts.extensions&&r.push(this.opts.extensions),a.$html.addClass(r.join(" ")),setTimeout(function(){e.vars.opened=!0},this.conf.openingInterval),this.$menu.addClass(s.current+" "+s.opened)},t[e].prototype._openFinish=function(){var t=this;this.__transitionend(a.$page.first(),function(){t.trigger("opened")},this.conf.transitionDuration),a.$html.addClass(s.opening),this.trigger("opening")},t[e].prototype.close=function(){if(this.vars.opened){var e=this;this.__transitionend(a.$page.first(),function(){e.$menu.removeClass(s.current).removeClass(s.opened),a.$html.removeClass(s.opened).removeClass(s.modal).removeClass(s.background).removeClass(s.mm(e.opts[o].position)).removeClass(s.mm(e.opts[o].zposition)),e.opts.extensions&&a.$html.removeClass(e.opts.extensions),a.$page.each(function(){t(this).attr("style",t(this).data(n.style))}),e.vars.opened=!1,e.trigger("closed")},this.conf.transitionDuration),a.$html.removeClass(s.opening),this.trigger("close"),this.trigger("closing")}},t[e].prototype.closeAllOthers=function(){a.$allMenus.not(this.$menu).each(function(){var o=t(this).data(e);o&&o.close&&o.close()})},t[e].prototype.setPage=function(e){var n=this,i=this.conf[o];e&&e.length||(e=a.$body.find(i.pageSelector),e.length>1&&i.wrapPageIfNeeded&&(e=e.wrapAll("<"+this.conf[o].pageNodetype+" />").parent())),e.each(function(){t(this).attr("id",t(this).attr("id")||n.__getUniqueId())}),e.addClass(s.page+" "+s.slideout),a.$page=e,this.trigger("setPage",e)},t[e].prototype["_initWindow_"+o]=function(){a.$wndw.off(i.keydown+"-offcanvas").on(i.keydown+"-offcanvas",function(t){return a.$html.hasClass(s.opened)&&9==t.keyCode?(t.preventDefault(),!1):void 0});var t=0;a.$wndw.off(i.resize+"-offcanvas").on(i.resize+"-offcanvas",function(e,o){if(1==a.$page.length&&(o||a.$html.hasClass(s.opened))){var n=a.$wndw.height();(o||n!=t)&&(t=n,a.$page.css("minHeight",n))}})},t[e].prototype._initBlocker=function(){var e=this;a.$blck||(a.$blck=t('<div id="'+s.blocker+'" class="'+s.slideout+'" />')),a.$blck.appendTo(a.$body).off(i.touchstart+"-offcanvas "+i.touchmove+"-offcanvas").on(i.touchstart+"-offcanvas "+i.touchmove+"-offcanvas",function(t){t.preventDefault(),t.stopPropagation(),a.$blck.trigger(i.mousedown+"-offcanvas")}).off(i.mousedown+"-offcanvas").on(i.mousedown+"-offcanvas",function(t){t.preventDefault(),a.$html.hasClass(s.modal)||(e.closeAllOthers(),e.close())})};var s,n,i,a}(jQuery);
/*	
 * jQuery mmenu autoHeight addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(t){var e="mmenu",i="autoHeight";t[e].addons[i]={setup:function(){if(this.opts.offCanvas){switch(this.opts.offCanvas.position){case"left":case"right":return}var n=this,o=this.opts[i];if(this.conf[i],h=t[e].glbl,"boolean"==typeof o&&o&&(o={height:"auto"}),"object"!=typeof o&&(o={}),o=this.opts[i]=t.extend(!0,{},t[e].defaults[i],o),"auto"==o.height){this.$menu.addClass(s.autoheight);var u=function(t){var e=this.$menu.children("."+s.current);_top=parseInt(e.css("top"),10)||0,_bot=parseInt(e.css("bottom"),10)||0,this.$menu.addClass(s.measureheight),t=t||this.$menu.children("."+s.current),t.is("."+s.vertical)&&(t=t.parents("."+s.panel).not("."+s.vertical).first()),this.$menu.height(t.outerHeight()+_top+_bot).removeClass(s.measureheight)};this.bind("update",u),this.bind("openPanel",u),this.bind("closePanel",u),this.bind("open",u),h.$wndw.off(a.resize+"-autoheight").on(a.resize+"-autoheight",function(){u.call(n)})}}},add:function(){s=t[e]._c,n=t[e]._d,a=t[e]._e,s.add("autoheight measureheight"),a.add("resize")},clickAnchor:function(){}},t[e].defaults[i]={height:"default"};var s,n,a,h}(jQuery);
/*	
 * jQuery mmenu backButton addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(o){var t="mmenu",n="backButton";o[t].addons[n]={setup:function(){if(this.opts.offCanvas){var i=this,e=this.opts[n];if(this.conf[n],a=o[t].glbl,"boolean"==typeof e&&(e={close:e}),"object"!=typeof e&&(e={}),e=o.extend(!0,{},o[t].defaults[n],e),e.close){var c="#"+i.$menu.attr("id");this.bind("opened",function(){location.hash!=c&&history.pushState(null,document.title,c)}),o(window).on("popstate",function(o){a.$html.hasClass(s.opened)?(o.stopPropagation(),i.close()):location.hash==c&&(o.stopPropagation(),i.open())})}}},add:function(){return window.history&&window.history.pushState?(s=o[t]._c,i=o[t]._d,e=o[t]._e,void 0):(o[t].addons[n].setup=function(){},void 0)},clickAnchor:function(){}},o[t].defaults[n]={close:!1};var s,i,e,a}(jQuery);
/*	
 * jQuery mmenu counters addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(t){var n="mmenu",e="counters";t[n].addons[e]={setup:function(){var c=this,o=this.opts[e];this.conf[e],s=t[n].glbl,"boolean"==typeof o&&(o={add:o,update:o}),"object"!=typeof o&&(o={}),o=this.opts[e]=t.extend(!0,{},t[n].defaults[e],o),this.bind("init",function(n){this.__refactorClass(t("em",n),this.conf.classNames[e].counter,"counter")}),o.add&&this.bind("init",function(n){n.each(function(){var n=t(this).data(a.parent);n&&(n.children("em."+i.counter).length||n.prepend(t('<em class="'+i.counter+'" />')))})}),o.update&&this.bind("update",function(){this.$menu.find("."+i.panel).each(function(){var n=t(this),e=n.data(a.parent);if(e){var s=e.children("em."+i.counter);s.length&&(n=n.children("."+i.listview),n.length&&s.html(c.__filterListItems(n.children()).length))}})})},add:function(){i=t[n]._c,a=t[n]._d,c=t[n]._e,i.add("counter search noresultsmsg")},clickAnchor:function(){}},t[n].defaults[e]={add:!1,update:!1},t[n].configuration.classNames[e]={counter:"Counter"};var i,a,c,s}(jQuery);
/*	
 * jQuery mmenu dividers addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(i){var e="mmenu",s="dividers";i[e].addons[s]={setup:function(){var n=this,a=this.opts[s];if(this.conf[s],l=i[e].glbl,"boolean"==typeof a&&(a={add:a,fixed:a}),"object"!=typeof a&&(a={}),a=this.opts[s]=i.extend(!0,{},i[e].defaults[s],a),this.bind("init",function(){this.__refactorClass(i("li",this.$menu),this.conf.classNames[s].collapsed,"collapsed")}),a.add&&this.bind("init",function(e){switch(a.addTo){case"panels":var s=e;break;default:var s=i(a.addTo,this.$menu).filter("."+d.panel)}i("."+d.divider,s).remove(),s.find("."+d.listview).not("."+d.vertical).each(function(){var e="";n.__filterListItems(i(this).children()).each(function(){var s=i.trim(i(this).children("a, span").text()).slice(0,1).toLowerCase();s!=e&&s.length&&(e=s,i('<li class="'+d.divider+'">'+s+"</li>").insertBefore(this))})})}),a.collapse&&this.bind("init",function(e){i("."+d.divider,e).each(function(){var e=i(this),s=e.nextUntil("."+d.divider,"."+d.collapsed);s.length&&(e.children("."+d.subopen).length||(e.wrapInner("<span />"),e.prepend('<a href="#" class="'+d.subopen+" "+d.fullsubopen+'" />')))})}),a.fixed){var o=function(e){e=e||this.$menu.children("."+d.current);var s=e.find("."+d.divider).not("."+d.hidden);if(s.length){this.$menu.addClass(d.hasdividers);var n=e.scrollTop()||0,t="";e.is(":visible")&&e.find("."+d.divider).not("."+d.hidden).each(function(){i(this).position().top+n<n+1&&(t=i(this).text())}),this.$fixeddivider.text(t)}else this.$menu.removeClass(d.hasdividers)};this.$fixeddivider=i('<ul class="'+d.listview+" "+d.fixeddivider+'"><li class="'+d.divider+'"></li></ul>').prependTo(this.$menu).children(),this.bind("openPanel",o),this.bind("init",function(e){e.off(t.scroll+"-dividers "+t.touchmove+"-dividers").on(t.scroll+"-dividers "+t.touchmove+"-dividers",function(){o.call(n,i(this))})})}},add:function(){d=i[e]._c,n=i[e]._d,t=i[e]._e,d.add("collapsed uncollapsed fixeddivider hasdividers"),t.add("scroll")},clickAnchor:function(i,e){if(this.opts[s].collapse&&e){var n=i.parent();if(n.is("."+d.divider)){var t=n.nextUntil("."+d.divider,"."+d.collapsed);return n.toggleClass(d.opened),t[n.hasClass(d.opened)?"addClass":"removeClass"](d.uncollapsed),!0}}return!1}},i[e].defaults[s]={add:!1,addTo:"panels",fixed:!1,collapse:!1},i[e].configuration.classNames[s]={collapsed:"Collapsed"};var d,n,t,l}(jQuery);
/*	
 * jQuery mmenu dragOpen addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(e){function t(e,t,n){return t>e&&(e=t),e>n&&(e=n),e}var n="mmenu",o="dragOpen";e[n].addons[o]={setup:function(){if(this.opts.offCanvas){var i=this,a=this.opts[o],p=this.conf[o];if(r=e[n].glbl,"boolean"==typeof a&&(a={open:a}),"object"!=typeof a&&(a={}),a=this.opts[o]=e.extend(!0,{},e[n].defaults[o],a),a.open){var d,f,c,u,h,l={},m=0,g=!1,v=!1,w=0,_=0;switch(this.opts.offCanvas.position){case"left":case"right":l.events="panleft panright",l.typeLower="x",l.typeUpper="X",v="width";break;case"top":case"bottom":l.events="panup pandown",l.typeLower="y",l.typeUpper="Y",v="height"}switch(this.opts.offCanvas.position){case"right":case"bottom":l.negative=!0,u=function(e){e>=r.$wndw[v]()-a.maxStartPos&&(m=1)};break;default:l.negative=!1,u=function(e){e<=a.maxStartPos&&(m=1)}}switch(this.opts.offCanvas.position){case"left":l.open_dir="right",l.close_dir="left";break;case"right":l.open_dir="left",l.close_dir="right";break;case"top":l.open_dir="down",l.close_dir="up";break;case"bottom":l.open_dir="up",l.close_dir="down"}switch(this.opts.offCanvas.zposition){case"front":h=function(){return this.$menu};break;default:h=function(){return e("."+s.slideout)}}var b=this.__valueOrFn(a.pageNode,this.$menu,r.$page);"string"==typeof b&&(b=e(b));var y=new Hammer(b[0],a.vendors.hammer);y.on("panstart",function(e){u(e.center[l.typeLower]),r.$slideOutNodes=h(),g=l.open_dir}).on(l.events+" panend",function(e){m>0&&e.preventDefault()}).on(l.events,function(e){if(d=e["delta"+l.typeUpper],l.negative&&(d=-d),d!=w&&(g=d>=w?l.open_dir:l.close_dir),w=d,w>a.threshold&&1==m){if(r.$html.hasClass(s.opened))return;m=2,i._openSetup(),i.trigger("opening"),r.$html.addClass(s.dragging),_=t(r.$wndw[v]()*p[v].perc,p[v].min,p[v].max)}2==m&&(f=t(w,10,_)-("front"==i.opts.offCanvas.zposition?_:0),l.negative&&(f=-f),c="translate"+l.typeUpper+"("+f+"px )",r.$slideOutNodes.css({"-webkit-transform":"-webkit-"+c,transform:c}))}).on("panend",function(){2==m&&(r.$html.removeClass(s.dragging),r.$slideOutNodes.css("transform",""),i[g==l.open_dir?"_openFinish":"close"]()),m=0})}}},add:function(){return"function"!=typeof Hammer||Hammer.VERSION<2?(e[n].addons[o].setup=function(){},void 0):(s=e[n]._c,i=e[n]._d,a=e[n]._e,s.add("dragging"),void 0)},clickAnchor:function(){}},e[n].defaults[o]={open:!1,maxStartPos:100,threshold:50,vendors:{hammer:{}}},e[n].configuration[o]={width:{perc:.8,min:140,max:440},height:{perc:.8,min:140,max:880}};var s,i,a,r}(jQuery);
/*	
 * jQuery mmenu fixedElements addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(i){var s="mmenu",n="fixedElements";i[s].addons[n]={setup:function(){if(this.opts.offCanvas){this.opts[n],this.conf[n],o=i[s].glbl;var a=function(i){var s=this.conf.classNames[n].fixed;this.__refactorClass(i.find("."+s),s,"slideout").appendTo(o.$body)};a.call(this,o.$page),this.bind("setPage",a)}},add:function(){a=i[s]._c,t=i[s]._d,e=i[s]._e,a.add("fixed")},clickAnchor:function(){}},i[s].configuration.classNames[n]={fixed:"Fixed"};var a,t,e,o}(jQuery);
/*	
 * jQuery mmenu iconPanels addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(e){var n="mmenu",i="iconPanels";e[n].addons[i]={setup:function(){var a=this,l=this.opts[i];if(this.conf[i],d=e[n].glbl,"boolean"==typeof l&&(l={add:l}),"number"==typeof l&&(l={add:!0,visible:l}),"object"!=typeof l&&(l={}),l=this.opts[i]=e.extend(!0,{},e[n].defaults[i],l),l.visible++,l.add){this.$menu.addClass(s.iconpanel);for(var t=[],o=0;o<=l.visible;o++)t.push(s.iconpanel+"-"+o);t=t.join(" ");var c=function(n){var i=a.$menu.children("."+s.panel).removeClass(t),d=i.filter("."+s.subopened);d.removeClass(s.hidden).add(n).slice(-l.visible).each(function(n){e(this).addClass(s.iconpanel+"-"+n)})};this.bind("openPanel",c),this.bind("init",function(n){c.call(a,a.$menu.children("."+s.current)),l.hideNavbars&&n.removeClass(s.hasnavbar),n.each(function(){e(this).children("."+s.subblocker).length||e(this).prepend('<a href="#'+e(this).closest("."+s.panel).attr("id")+'" class="'+s.subblocker+'" />')})})}},add:function(){s=e[n]._c,a=e[n]._d,l=e[n]._e,s.add("iconpanel subblocker")},clickAnchor:function(){}},e[n].defaults[i]={add:!1,visible:3,hideNavbars:!1};var s,a,l,d}(jQuery);
/*	
 * jQuery mmenu navbar addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(n){var a="mmenu",e="navbars";n[a].addons[e]={setup:function(){var r=this,i=this.opts[e],c=this.conf[e];if(s=n[a].glbl,"undefined"!=typeof i){i instanceof Array||(i=[i]);var d={};n.each(i,function(s){var o=i[s];"boolean"==typeof o&&o&&(o={}),"object"!=typeof o&&(o={}),"undefined"==typeof o.content&&(o.content=["prev","title"]),o.content instanceof Array||(o.content=[o.content]),o=n.extend(!0,{},r.opts.navbar,o);var l=o.position,h=o.height;"number"!=typeof h&&(h=1),h=Math.min(4,Math.max(1,h)),"bottom"!=l&&(l="top"),d[l]||(d[l]=0),d[l]++;var f=n("<div />").addClass(t.navbar+" "+t.navbar+"-"+l+" "+t.navbar+"-"+l+"-"+d[l]+" "+t.navbar+"-size-"+h);d[l]+=h-1;for(var v=0,u=o.content.length;u>v;v++){var p=n[a].addons[e][o.content[v]]||!1;p?p.call(r,f,o,c):(p=o.content[v],p instanceof n||(p=n(o.content[v])),p.each(function(){f.append(n(this))}))}var b=Math.ceil(f.children().not("."+t.btn).length/h);b>1&&f.addClass(t.navbar+"-content-"+b),f.children("."+t.btn).length&&f.addClass(t.hasbtns),f.prependTo(r.$menu)});for(var o in d)r.$menu.addClass(t.hasnavbar+"-"+o+"-"+d[o])}},add:function(){t=n[a]._c,r=n[a]._d,i=n[a]._e,t.add("close hasbtns")},clickAnchor:function(){}},n[a].configuration[e]={breadcrumbSeparator:"/"},n[a].configuration.classNames[e]={panelTitle:"Title",panelNext:"Next",panelPrev:"Prev"};var t,r,i,s}(jQuery),/*	
 * jQuery mmenu navbar addon breadcrumbs content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="breadcrumbs";n[a].addons[e][t]=function(e,t,r){var i=n[a]._c,s=n[a]._d;i.add("breadcrumbs separator"),e.append('<span class="'+i.breadcrumbs+'"></span>'),this.bind("init",function(a){a.removeClass(i.hasnavbar).each(function(){for(var a=[],e=n(this),t=n('<span class="'+i.breadcrumbs+'"></span>'),c=n(this).children().first(),d=!0;c&&c.length;){c.is("."+i.panel)||(c=c.closest("."+i.panel));var o=c.children("."+i.navbar).children("."+i.title).text();a.unshift(d?"<span>"+o+"</span>":'<a href="#'+c.attr("id")+'">'+o+"</a>"),d=!1,c=c.data(s.parent)}t.append(a.join('<span class="'+i.separator+'">'+r.breadcrumbSeparator+"</span>")).appendTo(e.children("."+i.navbar))})});var c=function(){var n=this.$menu.children("."+i.current),a=e.find("."+i.breadcrumbs),t=n.children("."+i.navbar).children("."+i.breadcrumbs);a.html(t.html())};this.bind("openPanel",c),this.bind("init",c)}}(jQuery),/*	
 * jQuery mmenu navbar addon close content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="close";n[a].addons[e][t]=function(e){var t=n[a]._c,r=n[a].glbl;e.append('<a class="'+t.close+" "+t.btn+'" href="#"></a>');var i=function(n){e.find("."+t.close).attr("href","#"+n.attr("id"))};i.call(this,r.$page),this.bind("setPage",i)}}(jQuery),/*	
 * jQuery mmenu navbar addon next content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="next";n[a].addons[e][t]=function(t){var r=n[a]._c;t.append('<a class="'+r.next+" "+r.btn+'" href="#"></a>');var i=function(n){n=n||this.$menu.children("."+r.current);var a=t.find("."+r.next),i=n.find("."+this.conf.classNames[e].panelNext),s=i.attr("href"),c=i.html();a[s?"attr":"removeAttr"]("href",s),a[s||c?"removeClass":"addClass"](r.hidden),a.html(c)};this.bind("openPanel",i),this.bind("init",function(){i.call(this)})}}(jQuery),/*	
 * jQuery mmenu navbar addon prev content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="prev";n[a].addons[e][t]=function(t){var r=n[a]._c;t.append('<a class="'+r.prev+" "+r.btn+'" href="#"></a>'),this.bind("init",function(n){n.removeClass(r.hasnavbar)});var i=function(){var n=this.$menu.children("."+r.current),a=t.find("."+r.prev),i=n.find("."+this.conf.classNames[e].panelPrev);i.length||(i=n.children("."+r.navbar).children("."+r.prev));var s=i.attr("href"),c=i.html();a[s?"attr":"removeAttr"]("href",s),a[s||c?"removeClass":"addClass"](r.hidden),a.html(c)};this.bind("openPanel",i),this.bind("init",i)}}(jQuery),/*	
 * jQuery mmenu navbar addon searchfield content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="searchfield";n[a].addons[e][t]=function(e){var t=n[a]._c,r=n('<div class="'+t.search+'" />').appendTo(e);"object"!=typeof this.opts.searchfield&&(this.opts.searchfield={}),this.opts.searchfield.add=!0,this.opts.searchfield.addTo=r}}(jQuery),/*	
 * jQuery mmenu navbar addon title content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="title";n[a].addons[e][t]=function(t,r){var i=n[a]._c;t.append('<a class="'+i.title+'"></a>');var s=function(n){n=n||this.$menu.children("."+i.current);var a=t.find("."+i.title),s=n.find("."+this.conf.classNames[e].panelTitle);s.length||(s=n.children("."+i.navbar).children("."+i.title));var c=s.attr("href"),d=s.html()||r.title;a[c?"attr":"removeAttr"]("href",c),a[c||d?"removeClass":"addClass"](i.hidden),a.html(d)};this.bind("openPanel",s),this.bind("init",function(){s.call(this)})}}(jQuery);
/*	
 * jQuery mmenu searchfield addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(e){function s(e){switch(e){case 9:case 16:case 17:case 18:case 37:case 38:case 39:case 40:return!0}return!1}var n="mmenu",a="searchfield";e[n].addons[a]={setup:function(){var o=this,d=this.opts[a],c=this.conf[a];r=e[n].glbl,"boolean"==typeof d&&(d={add:d}),"object"!=typeof d&&(d={}),d=this.opts[a]=e.extend(!0,{},e[n].defaults[a],d),this.bind("close",function(){this.$menu.find("."+t.search).find("input").blur()}),this.bind("init",function(n){if(d.add){switch(d.addTo){case"panels":var a=n;break;default:var a=e(d.addTo,this.$menu)}a.each(function(){var s=e(this);if(!s.is("."+t.panel)||!s.is("."+t.vertical)){if(!s.children("."+t.search).length){var n=c.form?"form":"div",a=e("<"+n+' class="'+t.search+'" />');if(c.form&&"object"==typeof c.form)for(var l in c.form)a.attr(l,c.form[l]);a.append('<input placeholder="'+d.placeholder+'" type="text" autocomplete="off" />'),s.hasClass(t.search)?s.replaceWith(a):s.prepend(a).addClass(t.hassearch)}if(d.noResults){var i=s.closest("."+t.panel).length;if(i||(s=o.$menu.children("."+t.panel).first()),!s.children("."+t.noresultsmsg).length){var r=s.children("."+t.listview).first();e('<div class="'+t.noresultsmsg+'" />').append(d.noResults)[r.length?"insertAfter":"prependTo"](r.length?r:s)}}}}),d.search&&e("."+t.search,this.$menu).each(function(){var n=e(this),a=n.closest("."+t.panel).length;if(a)var r=n.closest("."+t.panel),c=r;else var r=e("."+t.panel,o.$menu),c=o.$menu;var h=n.children("input"),u=o.__findAddBack(r,"."+t.listview).children("li"),f=u.filter("."+t.divider),p=o.__filterListItems(u),v="> a",m=v+", > span",b=function(){var s=h.val().toLowerCase();r.scrollTop(0),p.add(f).addClass(t.hidden).find("."+t.fullsubopensearch).removeClass(t.fullsubopen).removeClass(t.fullsubopensearch),p.each(function(){var n=e(this),a=v;(d.showTextItems||d.showSubPanels&&n.find("."+t.next))&&(a=m),e(a,n).text().toLowerCase().indexOf(s)>-1&&n.add(n.prevAll("."+t.divider).first()).removeClass(t.hidden)}),d.showSubPanels&&r.each(function(){var s=e(this);o.__filterListItems(s.find("."+t.listview).children()).each(function(){var s=e(this),n=s.data(l.sub);s.removeClass(t.nosubresults),n&&n.find("."+t.listview).children().removeClass(t.hidden)})}),e(r.get().reverse()).each(function(s){var n=e(this),i=n.data(l.parent);i&&(o.__filterListItems(n.find("."+t.listview).children()).length?(i.hasClass(t.hidden)&&i.children("."+t.next).not("."+t.fullsubopen).addClass(t.fullsubopen).addClass(t.fullsubopensearch),i.removeClass(t.hidden).removeClass(t.nosubresults).prevAll("."+t.divider).first().removeClass(t.hidden)):a||(n.hasClass(t.opened)&&setTimeout(function(){o.openPanel(i.closest("."+t.panel))},1.5*(s+1)*o.conf.openingInterval),i.addClass(t.nosubresults)))}),c[p.not("."+t.hidden).length?"removeClass":"addClass"](t.noresults),this.update()};h.off(i.keyup+"-searchfield "+i.change+"-searchfield").on(i.keyup+"-searchfield",function(e){s(e.keyCode)||b.call(o)}).on(i.change+"-searchfield",function(){b.call(o)})})}})},add:function(){t=e[n]._c,l=e[n]._d,i=e[n]._e,t.add("search hassearch noresultsmsg noresults nosubresults fullsubopensearch"),i.add("change keyup")},clickAnchor:function(){}},e[n].defaults[a]={add:!1,addTo:"panels",search:!0,placeholder:"Search",noResults:"No results found.",showTextItems:!1,showSubPanels:!0},e[n].configuration[a]={form:!1};var t,l,i,r}(jQuery);
/*	
 * jQuery mmenu sectionIndexer addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(e){var a="mmenu",r="sectionIndexer";e[a].addons[r]={setup:function(){var i=this,d=this.opts[r];this.conf[r],s=e[a].glbl,"boolean"==typeof d&&(d={add:d}),"object"!=typeof d&&(d={}),d=this.opts[r]=e.extend(!0,{},e[a].defaults[r],d),this.bind("init",function(a){if(d.add){switch(d.addTo){case"panels":var r=a;break;default:var r=e(d.addTo,this.$menu).filter("."+n.panel)}r.find("."+n.divider).closest("."+n.panel).addClass(n.hasindexer)}if(!this.$indexer&&this.$menu.children("."+n.hasindexer).length){this.$indexer=e('<div class="'+n.indexer+'" />').prependTo(this.$menu).append('<a href="#a">a</a><a href="#b">b</a><a href="#c">c</a><a href="#d">d</a><a href="#e">e</a><a href="#f">f</a><a href="#g">g</a><a href="#h">h</a><a href="#i">i</a><a href="#j">j</a><a href="#k">k</a><a href="#l">l</a><a href="#m">m</a><a href="#n">n</a><a href="#o">o</a><a href="#p">p</a><a href="#q">q</a><a href="#r">r</a><a href="#s">s</a><a href="#t">t</a><a href="#u">u</a><a href="#v">v</a><a href="#w">w</a><a href="#x">x</a><a href="#y">y</a><a href="#z">z</a>'),this.$indexer.children().on(t.mouseover+"-sectionindexer "+n.touchstart+"-sectionindexer",function(){var a=e(this).attr("href").slice(1),r=i.$menu.children("."+n.current),t=r.find("."+n.listview),s=!1,d=r.scrollTop(),h=t.position().top+parseInt(t.css("margin-top"),10)+parseInt(t.css("padding-top"),10)+d;r.scrollTop(0),t.children("."+n.divider).not("."+n.hidden).each(function(){s===!1&&a==e(this).text().slice(0,1).toLowerCase()&&(s=e(this).position().top+h)}),r.scrollTop(s!==!1?s:d)});var s=function(e){i.$menu[(e.hasClass(n.hasindexer)?"add":"remove")+"Class"](n.hasindexer)};this.bind("openPanel",s),s.call(this,this.$menu.children("."+n.current))}})},add:function(){n=e[a]._c,i=e[a]._d,t=e[a]._e,n.add("indexer hasindexer"),t.add("mouseover touchstart")},clickAnchor:function(e){return e.parent().is("."+n.indexer)?!0:void 0}},e[a].defaults[r]={add:!1,addTo:"panels"};var n,i,t,s}(jQuery);
/*	
 * jQuery mmenu toggles addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(t){var e="mmenu",c="toggles";t[e].addons[c]={setup:function(){var n=this;this.opts[c],this.conf[c],l=t[e].glbl,this.bind("init",function(e){this.__refactorClass(t("input",e),this.conf.classNames[c].toggle,"toggle"),this.__refactorClass(t("input",e),this.conf.classNames[c].check,"check"),t("input."+s.toggle+", input."+s.check,e).each(function(){var e=t(this),c=e.closest("li"),i=e.hasClass(s.toggle)?"toggle":"check",l=e.attr("id")||n.__getUniqueId();c.children('label[for="'+l+'"]').length||(e.attr("id",l),c.prepend(e),t('<label for="'+l+'" class="'+s[i]+'"></label>').insertBefore(c.children("a, span").last()))})})},add:function(){s=t[e]._c,n=t[e]._d,i=t[e]._e,s.add("toggle check")},clickAnchor:function(){}},t[e].configuration.classNames[c]={toggle:"Toggle",check:"Check"};var s,n,i,l}(jQuery);
/*	
 * jQuery mmenu counters addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(t){var n="mmenu",e="counters";t[n].addons[e]={setup:function(){var c=this,o=this.opts[e];this.conf[e],s=t[n].glbl,"boolean"==typeof o&&(o={add:o,update:o}),"object"!=typeof o&&(o={}),o=this.opts[e]=t.extend(!0,{},t[n].defaults[e],o),this.bind("init",function(n){this.__refactorClass(t("em",n),this.conf.classNames[e].counter,"counter")}),o.add&&this.bind("init",function(n){n.each(function(){var n=t(this).data(a.parent);n&&(n.children("em."+i.counter).length||n.prepend(t('<em class="'+i.counter+'" />')))})}),o.update&&this.bind("update",function(){this.$menu.find("."+i.panel).each(function(){var n=t(this),e=n.data(a.parent);if(e){var s=e.children("em."+i.counter);s.length&&(n=n.children("."+i.listview),n.length&&s.html(c.__filterListItems(n.children()).length))}})})},add:function(){i=t[n]._c,a=t[n]._d,c=t[n]._e,i.add("counter search noresultsmsg")},clickAnchor:function(){}},t[n].defaults[e]={add:!1,update:!1},t[n].configuration.classNames[e]={counter:"Counter"};var i,a,c,s}(jQuery);
/*	
 * jQuery mmenu navbar addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(n){var a="mmenu",e="navbars";n[a].addons[e]={setup:function(){var r=this,i=this.opts[e],c=this.conf[e];if(s=n[a].glbl,"undefined"!=typeof i){i instanceof Array||(i=[i]);var d={};n.each(i,function(s){var o=i[s];"boolean"==typeof o&&o&&(o={}),"object"!=typeof o&&(o={}),"undefined"==typeof o.content&&(o.content=["prev","title"]),o.content instanceof Array||(o.content=[o.content]),o=n.extend(!0,{},r.opts.navbar,o);var l=o.position,h=o.height;"number"!=typeof h&&(h=1),h=Math.min(4,Math.max(1,h)),"bottom"!=l&&(l="top"),d[l]||(d[l]=0),d[l]++;var f=n("<div />").addClass(t.navbar+" "+t.navbar+"-"+l+" "+t.navbar+"-"+l+"-"+d[l]+" "+t.navbar+"-size-"+h);d[l]+=h-1;for(var v=0,u=o.content.length;u>v;v++){var p=n[a].addons[e][o.content[v]]||!1;p?p.call(r,f,o,c):(p=o.content[v],p instanceof n||(p=n(o.content[v])),p.each(function(){f.append(n(this))}))}var b=Math.ceil(f.children().not("."+t.btn).length/h);b>1&&f.addClass(t.navbar+"-content-"+b),f.children("."+t.btn).length&&f.addClass(t.hasbtns),f.prependTo(r.$menu)});for(var o in d)r.$menu.addClass(t.hasnavbar+"-"+o+"-"+d[o])}},add:function(){t=n[a]._c,r=n[a]._d,i=n[a]._e,t.add("close hasbtns")},clickAnchor:function(){}},n[a].configuration[e]={breadcrumbSeparator:"/"},n[a].configuration.classNames[e]={panelTitle:"Title",panelNext:"Next",panelPrev:"Prev"};var t,r,i,s}(jQuery),/*	
 * jQuery mmenu navbar addon breadcrumbs content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="breadcrumbs";n[a].addons[e][t]=function(e,t,r){var i=n[a]._c,s=n[a]._d;i.add("breadcrumbs separator"),e.append('<span class="'+i.breadcrumbs+'"></span>'),this.bind("init",function(a){a.removeClass(i.hasnavbar).each(function(){for(var a=[],e=n(this),t=n('<span class="'+i.breadcrumbs+'"></span>'),c=n(this).children().first(),d=!0;c&&c.length;){c.is("."+i.panel)||(c=c.closest("."+i.panel));var o=c.children("."+i.navbar).children("."+i.title).text();a.unshift(d?"<span>"+o+"</span>":'<a href="#'+c.attr("id")+'">'+o+"</a>"),d=!1,c=c.data(s.parent)}t.append(a.join('<span class="'+i.separator+'">'+r.breadcrumbSeparator+"</span>")).appendTo(e.children("."+i.navbar))})});var c=function(){var n=this.$menu.children("."+i.current),a=e.find("."+i.breadcrumbs),t=n.children("."+i.navbar).children("."+i.breadcrumbs);a.html(t.html())};this.bind("openPanel",c),this.bind("init",c)}}(jQuery),/*	
 * jQuery mmenu navbar addon close content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="close";n[a].addons[e][t]=function(e){var t=n[a]._c,r=n[a].glbl;e.append('<a class="'+t.close+" "+t.btn+'" href="#"></a>');var i=function(n){e.find("."+t.close).attr("href","#"+n.attr("id"))};i.call(this,r.$page),this.bind("setPage",i)}}(jQuery),/*	
 * jQuery mmenu navbar addon next content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="next";n[a].addons[e][t]=function(t){var r=n[a]._c;t.append('<a class="'+r.next+" "+r.btn+'" href="#"></a>');var i=function(n){n=n||this.$menu.children("."+r.current);var a=t.find("."+r.next),i=n.find("."+this.conf.classNames[e].panelNext),s=i.attr("href"),c=i.html();a[s?"attr":"removeAttr"]("href",s),a[s||c?"removeClass":"addClass"](r.hidden),a.html(c)};this.bind("openPanel",i),this.bind("init",function(){i.call(this)})}}(jQuery),/*	
 * jQuery mmenu navbar addon prev content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="prev";n[a].addons[e][t]=function(t){var r=n[a]._c;t.append('<a class="'+r.prev+" "+r.btn+'" href="#"></a>'),this.bind("init",function(n){n.removeClass(r.hasnavbar)});var i=function(){var n=this.$menu.children("."+r.current),a=t.find("."+r.prev),i=n.find("."+this.conf.classNames[e].panelPrev);i.length||(i=n.children("."+r.navbar).children("."+r.prev));var s=i.attr("href"),c=i.html();a[s?"attr":"removeAttr"]("href",s),a[s||c?"removeClass":"addClass"](r.hidden),a.html(c)};this.bind("openPanel",i),this.bind("init",i)}}(jQuery),/*	
 * jQuery mmenu navbar addon searchfield content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="searchfield";n[a].addons[e][t]=function(e){var t=n[a]._c,r=n('<div class="'+t.search+'" />').appendTo(e);"object"!=typeof this.opts.searchfield&&(this.opts.searchfield={}),this.opts.searchfield.add=!0,this.opts.searchfield.addTo=r}}(jQuery),/*	
 * jQuery mmenu navbar addon title content
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
function(n){var a="mmenu",e="navbars",t="title";n[a].addons[e][t]=function(t,r){var i=n[a]._c;t.append('<a class="'+i.title+'"></a>');var s=function(n){n=n||this.$menu.children("."+i.current);var a=t.find("."+i.title),s=n.find("."+this.conf.classNames[e].panelTitle);s.length||(s=n.children("."+i.navbar).children("."+i.title));var c=s.attr("href"),d=s.html()||r.title;a[c?"attr":"removeAttr"]("href",c),a[c||d?"removeClass":"addClass"](i.hidden),a.html(d)};this.bind("openPanel",s),this.bind("init",function(){s.call(this)})}}(jQuery);
/*	
 * jQuery mmenu offCanvas addon
 * mmenu.frebsite.nl
 *
 * Copyright (c) Fred Heusschen
 */
!function(t){var e="mmenu",o="offCanvas";t[e].addons[o]={setup:function(){if(this.opts[o]){var n=this.opts[o],i=this.conf[o];a=t[e].glbl,this._api=t.merge(this._api,["open","close","setPage"]),("top"==n.position||"bottom"==n.position)&&(n.zposition="front"),"string"!=typeof i.pageSelector&&(i.pageSelector="> "+i.pageNodetype),a.$allMenus=(a.$allMenus||t()).add(this.$menu),this.vars.opened=!1;var r=[s.offcanvas];"left"!=n.position&&r.push(s.mm(n.position)),"back"!=n.zposition&&r.push(s.mm(n.zposition)),this.$menu.addClass(r.join(" ")).parent().removeClass(s.wrapper),this.setPage(a.$page),this._initBlocker(),this["_initWindow_"+o](),this.$menu[i.menuInjectMethod+"To"](i.menuWrapperSelector)}},add:function(){s=t[e]._c,n=t[e]._d,i=t[e]._e,s.add("offcanvas slideout modal background opening blocker page"),n.add("style"),i.add("resize")},clickAnchor:function(t){if(!this.opts[o])return!1;var e=this.$menu.attr("id");if(e&&e.length&&(this.conf.clone&&(e=s.umm(e)),t.is('[href="#'+e+'"]')))return this.open(),!0;if(a.$page){var e=a.$page.first().attr("id");return e&&e.length&&t.is('[href="#'+e+'"]')?(this.close(),!0):!1}}},t[e].defaults[o]={position:"left",zposition:"back",modal:!1,moveBackground:!0},t[e].configuration[o]={pageNodetype:"div",pageSelector:null,wrapPageIfNeeded:!0,menuWrapperSelector:"body",menuInjectMethod:"prepend"},t[e].prototype.open=function(){if(!this.vars.opened){var t=this;this._openSetup(),setTimeout(function(){t._openFinish()},this.conf.openingInterval),this.trigger("open")}},t[e].prototype._openSetup=function(){var e=this;this.closeAllOthers(),a.$page.each(function(){t(this).data(n.style,t(this).attr("style")||"")}),a.$wndw.trigger(i.resize+"-offcanvas",[!0]);var r=[s.opened];this.opts[o].modal&&r.push(s.modal),this.opts[o].moveBackground&&r.push(s.background),"left"!=this.opts[o].position&&r.push(s.mm(this.opts[o].position)),"back"!=this.opts[o].zposition&&r.push(s.mm(this.opts[o].zposition)),this.opts.extensions&&r.push(this.opts.extensions),a.$html.addClass(r.join(" ")),setTimeout(function(){e.vars.opened=!0},this.conf.openingInterval),this.$menu.addClass(s.current+" "+s.opened)},t[e].prototype._openFinish=function(){var t=this;this.__transitionend(a.$page.first(),function(){t.trigger("opened")},this.conf.transitionDuration),a.$html.addClass(s.opening),this.trigger("opening")},t[e].prototype.close=function(){if(this.vars.opened){var e=this;this.__transitionend(a.$page.first(),function(){e.$menu.removeClass(s.current).removeClass(s.opened),a.$html.removeClass(s.opened).removeClass(s.modal).removeClass(s.background).removeClass(s.mm(e.opts[o].position)).removeClass(s.mm(e.opts[o].zposition)),e.opts.extensions&&a.$html.removeClass(e.opts.extensions),a.$page.each(function(){t(this).attr("style",t(this).data(n.style))}),e.vars.opened=!1,e.trigger("closed")},this.conf.transitionDuration),a.$html.removeClass(s.opening),this.trigger("close"),this.trigger("closing")}},t[e].prototype.closeAllOthers=function(){a.$allMenus.not(this.$menu).each(function(){var o=t(this).data(e);o&&o.close&&o.close()})},t[e].prototype.setPage=function(e){var n=this,i=this.conf[o];e&&e.length||(e=a.$body.find(i.pageSelector),e.length>1&&i.wrapPageIfNeeded&&(e=e.wrapAll("<"+this.conf[o].pageNodetype+" />").parent())),e.each(function(){t(this).attr("id",t(this).attr("id")||n.__getUniqueId())}),e.addClass(s.page+" "+s.slideout),a.$page=e,this.trigger("setPage",e)},t[e].prototype["_initWindow_"+o]=function(){a.$wndw.off(i.keydown+"-offcanvas").on(i.keydown+"-offcanvas",function(t){return a.$html.hasClass(s.opened)&&9==t.keyCode?(t.preventDefault(),!1):void 0});var t=0;a.$wndw.off(i.resize+"-offcanvas").on(i.resize+"-offcanvas",function(e,o){if(1==a.$page.length&&(o||a.$html.hasClass(s.opened))){var n=a.$wndw.height();(o||n!=t)&&(t=n,a.$page.css("minHeight",n))}})},t[e].prototype._initBlocker=function(){var e=this;a.$blck||(a.$blck=t('<div id="'+s.blocker+'" class="'+s.slideout+'" />')),a.$blck.appendTo(a.$body).off(i.touchstart+"-offcanvas "+i.touchmove+"-offcanvas").on(i.touchstart+"-offcanvas "+i.touchmove+"-offcanvas",function(t){t.preventDefault(),t.stopPropagation(),a.$blck.trigger(i.mousedown+"-offcanvas")}).off(i.mousedown+"-offcanvas").on(i.mousedown+"-offcanvas",function(t){t.preventDefault(),a.$html.hasClass(s.modal)||(e.closeAllOthers(),e.close())})};var s,n,i,a}(jQuery);
(function() {
    'use strict';

    window.app = {
		utils: {},
		settings: {},
		url: {},
		config: {
			STRIPE_TEST_KEY: 'pk_test_wxuno1w3EmQ14Q6EPar6d59w',
			STRIPE_KEY: 'pk_live_VJ7k6spQvGiizCPLUt4NHwzG'
		}
	};
})();
app.functions = function() {

	storeUrlInfo = function() {
		// Pull the current url information into the app namespace
		app.url.protocol = window.location.protocol;
		app.url.host = window.location.host;
		app.url.pathName =  window.location.pathname.substr(1); // get the pathname without the leading '/'

		// Create convenience member attribute for more intuitive url checking
		app.url.pathArray = app.url.pathName.split( '/' );
		app.url.siteArea = app.url.pathArray[0];
		app.url.page = app.url.pathArray[1];
	};

	bindTouch = function() {
		// Bind adding of 'hover' class to tap vs hover depending on whether it is a touch enabled device
		if (Modernizr.touch) {
			$(".nav li").unbind('mouseenter mouseleave');
			$(".nav li a.parent").unbind('click');
			$(".nav li .more").unbind('click').bind('click', function() {     
				$(this).parent("li").toggleClass("hover");
			});

		} else {
			$(".nav li").removeClass("hover");
			$(".nav li a").unbind('click');
			$(".nav li").unbind('mouseenter mouseleave').bind('mouseenter mouseleave', function() {
				// must be attached to li so that mouseleave is not triggered when hovering over a submenu
				$(this).toggleClass('hover');
			});
		}
	};

	enablePageScrolling = function() {
		$('html, body').removeClass('scrolling-disabled');
	};

	disablePageScrolling = function() {
		$('html, body').addClass('scrolling-disabled');
	};

	initializeModal = function() {
		$('.modal__close').on('click', function() {
	    	app.functions.closeModal();
	    	app.functions.clearModalContents();
	    });
	};

	openModal = function() {
		$('.modal__background').fadeIn();
		$('.modal-container__contents').hide();
		$('.modal-container__loading').show();
		$('.modal__container').fadeIn();

		app.functions.disablePageScrolling();
	};

	closeModal = function() {
		$('.modal__background').fadeOut();
		$('.modal__container').fadeOut();

		app.functions.enablePageScrolling();
	};

	clearModalContents = function() {
		$('.modal-container__contents').html('');
	};

	initializeModalControls = function() {
		$('.profile-navigation__previous, .profile-navigation__next').on('click', function() {
	    	var registrationNumber = $(this).data('registration-number');

	    	$('.modal-container__contents').fadeOut(function() {

	    		app.functions.clearModalContents();

	    		$('.modal-container__loading').fadeIn(function() {
	    			app.functions.getChildData(registrationNumber);
	    		});

	    	});
	    });
	};

	initializeModalTabs = function() {
		$('.profile-tabs__tab').removeClass('profile-tabs__tab--selected');
		$('.profile-tabs__tab').first().addClass('profile-tabs__tab--selected');

		$('.profile-tab__contents').removeClass('profile-tab__contents--selected');
		$('.profile-tab__contents').first().addClass('profile-tab__contents--selected');

		$('.profile-tabs__tab').on('click', function() {
			if($(this).hasClass('profile-tabs__tab--selected')) {
				return;
			}

			var selectedContentType = $(this).data('tab');

			$('.profile-tabs__tab--selected').removeClass('profile-tabs__tab--selected');
			$(this).addClass('profile-tabs__tab--selected');

			$('.profile-tab__contents--selected').removeClass('profile-tab__contents--selected');
			$('[data-contents=' + selectedContentType + ']').addClass('profile-tab__contents--selected');

		});
	};

	initializeSiteMenu = function() {
		// allows the mobile menu to be seen (it was hidden to prevent it flashing on the screen during page load)
		$('#mobile-menu').removeClass('hidden');

		// initialize the log-in menu
		$('.log-in-link').click(function() {
			$('.log-in-container').toggle();
		});

		/* TODO: This is a hacky mess, change the top nav for better markup and JavaScript */
		$('.log-in-container').click(function(e) {
			e.stopPropagation();
		});
	};

	initializeMobileMenu = function() {
		// initialize the mobile menu attached to the hamburger icon
		$("#mobile-menu").mmenu({
			"extensions": [
				"border-full",
				"effect-slide-menu",
				"effect-slide-panels-0",
				"pageshadow",
				"theme-dark"
			],
			"offCanvas": {
				"position": "right"
			},
			"counters": true,
			"navbars": [
				{
					"position": "top",
					"content": [
						"prev",
						"title",
						"close"
					]
				},
				{
					"position": "bottom",
					"content": [
						"<a class='fa fa-envelope' href='#/'></a>",
						"<a class='fa fa-twitter' href='#/'></a>",
						"<a class='fa fa-facebook' href='#/'></a>"
					]
				}
			]
		});
	};

	initializeHomePage = function() {
		// initialize the carousel default settings
		$("#owl-demo").owlCarousel({
			autoPlay : 3000,
			stopOnHover: true,
			singleItem : true,
			lazyLoad : true,
			lazyEffect: 'fade',
			autoHeight: true,
			transitionStyle : 'fade'
		});

		// prevents the carousel image descriptions from loading in before the images do
		// TODO: This doesn't seem to be working as well as it needs to.
		$( "#owl-demo img" ).load(function() {
			$(this).siblings('.featured-description').removeClass('hidden');
		});
	};

	initializeRegistrationPage = function() {
		/* check for dropdown menu selection on registration page to show the correct form */
		/* TODO: consider adding a class to the 'active' form, hide that with a fadeOut(), then fadeIn() the selected form. */
		$('.registration-type-selector').change(function() {
			var siteForm = $('.site-visitor-registration'),
				socialWorkerForm = $('.social-worker-registration'),
				prospectiveParentForm = $('.prospective-parent-registration'),
				currentValue = $(this).val();

			switch(currentValue) {
				case 'siteVisitor': socialWorkerForm.hide(); prospectiveParentForm.hide(); siteForm.show(); break;
				case 'socialWorker': siteForm.hide(); prospectiveParentForm.hide(); socialWorkerForm.show(); break;
				case 'prospectiveParent': siteForm.hide(); socialWorkerForm.hide(); prospectiveParentForm.show(); break;
			}
		});
	};

	initializePhotoListingPage = function() {
		// initialize the photo listing gallery grid
		$('#grid').mediaBoxes({
	        boxesToLoadStart: 12,
	        boxesToLoad: 8,

	        sortContainer: '#sort',
	        sort: 'a',
	        getSortData: {
		        name: '.media-box-name', //When you sort by name, it will only look in the elements with the class "media-box-name"
		        age: '.media-box-age' //When you sort by age, it will only look in the elements with the class "media-box-age"
		        // addedDate: '.media-box-added' //When you sort by date added, it will only look in the elements with the class "media-box-date-added"
		    }
	    });

	    // setup the modal window when a child card is clicked
	    $('.media-box').on('click', function() {
	    	var selectedChild = $(this),
	    		registrationNumber = selectedChild.data('registration-number');

	    	app.functions.openModal();
	    	app.functions.getChildData(registrationNumber);
	    });

	    app.functions.initializeModal();
	};

    getChildData = function(registrationNumber) {
    	// Submit token to server so it can charge the card
        $.ajax({
        	dataType: 'json',
            url: '/getChildDetails',
            type: 'POST',
            data: {
                registrationNumber: registrationNumber
            }
     	}).done(function(childDetails) {
     		app.children = app.children || {};
     		app.children.selectedChild = childDetails.registrationNumber;

     		var selectedChildElement = $('[data-registration-number=' + app.children.selectedChild + ']');
     		var previousChildElement = selectedChildElement.prev();
     		var nextChildElement = selectedChildElement.next();

     		childDetails.previousChildRegistrationNumber = previousChildElement.data('registration-number');
     		childDetails.nextChildRegistrationNumber = nextChildElement.data('registration-number');

     		var source = $("#child-details-template").html();
			var template = Handlebars.compile(source);
			var html = template(childDetails);
			
			$('.modal-container__contents').html(html);

			$('.modal-container__loading').fadeOut(function() {
				$('.modal-container__contents').fadeIn();
			});

			app.functions.initializeModalControls();
			app.functions.initializeModalTabs();

			console.log(childDetails);

     	});
    }

	initializeDonationspage = function() {
		// Define handler to be called when Stripe returns a card token
	    function onReceiveToken(token, args) {
	        // Submit token to server so it can charge the card
	        $.ajax({
	            url: '/charge',
	            type: 'POST',
	            data: {
	                stripeToken: token.id
	            }
	        });
	    };

		// Configure Checkout
	    var checkout = StripeCheckout.configure({
	        key: app.config.STRIPE_TEST_KEY,
	        token: onReceiveToken,

	        image: 'http://nairteashop.org/wp-content/uploads/avatar.png',
	        name: 'adoptions.io',
	        description: 'Do it for the children',
	        amount: 1000,
	        billingAddress: 'true'
	    });

	    // Open Checkout when the link is clicked
		$('.donate').on('click', function() {
	        checkout.open();
	        return false;
	    });
	};

	return {
		storeUrlInfo				: storeUrlInfo,
		bindTouch					: bindTouch,
		enablePageScrolling			: enablePageScrolling,
		disablePageScrolling		: disablePageScrolling,
		initializeModal				: initializeModal,
		openModal					: openModal,
		closeModal					: closeModal,
		clearModalContents			: clearModalContents,
		initializeModalControls		: initializeModalControls,
		initializeModalTabs			: initializeModalTabs,
		initializeSiteMenu 			: initializeSiteMenu,
		initializeMobileMenu 		: initializeMobileMenu,
		initializeHomePage 			: initializeHomePage,
		initializeRegistrationPage 	: initializeRegistrationPage,
		initializePhotoListingPage 	: initializePhotoListingPage,
		getChildData				: getChildData,
		initializeDonationspage 	: initializeDonationspage
	}
}();

$(function() {
	// basic setup function for every page
	app.functions.bindTouch();
	app.functions.storeUrlInfo();
	app.functions.initializeSiteMenu();
	app.functions.initializeMobileMenu();

	app.router.initializeRouter();
});
app.router = function() {
	initializeRouter = function() {

		// handle basic routing, initializing based on the result
		switch(app.url.siteArea) {
			case '':
				setupHomePage();
				break;
			case 'page':
				setupGeneralPage();
				break;
			case 'form':
				setupForm();
				break;
			case 'photo-listing':
				setupPhotoListingPage();
				break;
			case 'register':
				setupRegistrationPage();
				break;
			case 'preferences':
				setupPreferencesPage();
				break;
			case 'donate':
				setupDonationsPage();
				break;
			default:
				console.log('default route, nothing matched');
		}
	};

	setupHomePage = function() {
		console.log('home page route');
		app.functions.initializeHomePage();
	};

	setupGeneralPage = function() {
		console.log('page route');
	};

	setupForm = function() {
		console.log('form route');
	};

	setupPhotoListingPage = function() {
		console.log('photo listing route');
		app.functions.initializePhotoListingPage();
	};

	setupRegistrationPage = function() {
		console.log('registration route');
		app.functions.initializeRegistrationPage();
	};

	setupPreferencesPage = function() {
		console.log('preferences route');
	};

	setupDonationsPage = function() {
		console.log('donate route');
		app.functions.initialzeDonationsPage();
	};

	return {
		initializeRouter: initializeRouter
	}
}();