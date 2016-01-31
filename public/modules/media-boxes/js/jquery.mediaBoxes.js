    
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