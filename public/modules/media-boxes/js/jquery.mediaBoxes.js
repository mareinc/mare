    
/* ======================================================= 
 *
 *      Media Boxes     
 *      Version: 3.2
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
 *      [A] MEDIA BOXES CLASS
 *      [B] DEFAULTS
 *      [C] INIT
 *          [1] SETUP
 *          [2] GRID METHODS
 *          [3] EXTENGIN ISOTOPE
 *          [4] FILTERING ISOTOPE
 *          [5] LOAD MORE BOXES
 *          [6] FILTER
 *          [7] SEARCH
 *          [8] SORTING
 *          [9] THUMBNAIL OVERLAY EFFECT
 *          [10] IFRAME ON GRID
 *          [11] MAGNIFIC POPUP
 *          [12] DEEP LINKING
 *          [13] SOCIAL IN MAGNIFIC POPUP
 *      [D] DESTROY
 *      [E] INSERT
 *      [F] REFRESH
 *      [G] RESIZE
 *      [H] MEDIA BOXES PLUGIN
 *      
 * ======================================================= */

(function( window, $, undefined ){

/* ====================================================================== *
        [A] MEDIA BOXES CLASS
 * ====================================================================== */    

    var MediaBoxes = function(container, options){
        this.init(container, options);
    }

/* ====================================================================== *
        [B] DEFAULTS
 * ====================================================================== */    
    
    MediaBoxes.DEFAULTS = {
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
                horizontalSpaceBetweenBoxes: 10,
                verticalSpaceBetweenBoxes: 10,
            },
            {
                maxWidth: 450,
                columnWidth: 'auto',
                columns: 1,
                horizontalSpaceBetweenBoxes: 10,
                verticalSpaceBetweenBoxes: 10,
            },
        ],
        multipleFilterLogic: 'AND',
        filterContainer: '#filter',
        search: '', // i.e. #search
        searchTarget: '.media-box-title',
        sortContainer: '', // i.e. #sort
        getSortData: {
          title: '.media-box-title',
          text: '.media-box-text',
        }, 
        waitUntilThumbWithRatioLoads: true, // When they have dimensions specified
        waitForAllThumbsNoMatterWhat: false, // Wait for all the thumbnails to load even if they got dimensions specified
        thumbnailOverlay: true, //Show the overlay on mouse over
        overlayEffect: 'fade', // 'push-up', 'push-down', 'push-up-100%', 'push-down-100%', 'reveal-top', 'reveal-bottom', 'reveal-top-100%', 'reveal-bottom-100%', 'direction-aware', 'direction-aware-fade', 'direction-right', 'direction-left', 'direction-top', 'direction-bottom', 'fade'
        overlaySpeed: 200,
        overlayEasing: 'default',
        showOnlyVisibleBoxesInPopup: false,
        considerFilteringInPopup: true,
        deepLinkingOnPopup: true,
        deepLinkingOnFilter: true,
        deepLinkingOnSearch: false,
        gallery: true,
        LoadingWord: 'Loading...',
        loadMoreWord: 'Load More',
        noMoreEntriesWord: 'No More Entries',
        alignTop: false,
        preload: [0,2],
        magnificPopup: true,
        percentage: false,

        //some sharing hidden options :D
        /*facebook: true,
        twitter: true,
        googleplus: true,
        pinterest: true,*/
    };    

/* ====================================================================== *
        [C] INIT
 * ====================================================================== */    

    MediaBoxes.prototype.init = function(container, options){   
        
    /* ====================================================================== *
            [1] SETUP
     * ====================================================================== */

        /* SETTINGS */
        var settings = $.extend({}, MediaBoxes.DEFAULTS, options);

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

        /* SET GLOBAL VARS, USED FOR "OUTSIDE" METHODS */
        this.container                  = $container;
        this.container_clone            = $container.clone().removeClass('media-boxes-container');
        
        /* Load more button */
        var loadMoreButton              = $('<div class="media-boxes-load-more media-boxes-load-more-button"></div>').insertAfter($container);

        /* Sort the resolutions from lower to higher */
        settings.resolutions.sort(function(a,b){ return a.maxWidth - b.maxWidth; });

        /* Save the settings in the container */
        $container.data('settings', settings);
        
        /* Fix the margins for the container (for horizontal and vertical space)  */
        //$container.css('margin-left', -settings.horizontalSpaceBetweenBoxes);

        /* Hide all boxes */
        $container.find(itemSelector).removeClass(itemClass).addClass(itemHiddenClass);

        /* default sort selected */
        var defSortElem = $(settings.sortContainer).find('*[data-sort-by]').filter('.selected');
        var defSort     = defSortElem.attr('data-sort-by');
        var defAsc      = getSortDirection(defSortElem);

        /* Add the sizer for defining the width of isotope */
        $container.append('<div class="media-boxes-grid-sizer"></div>');

        /* Initialize isotope plugin */
        $container.isotopeMB({
            itemSelector    : itemSelector,   
            transitionDuration: '0.4s',
            hiddenStyle: { opacity: 0, transform: 'scale(0.001)' },
            visibleStyle: { opacity: 1, transform: 'scale(1)' },
            masonry: {
                columnWidth: '.media-boxes-grid-sizer'
            },
            getSortData: settings.getSortData,
            sortBy: defSort, 
            sortAscending: defAsc,     
        }); 

    /* ====================================================================== *
            [2] GRID METHODS
     * ====================================================================== */

        /* ****** Add div with margins (for horizontal and vertical space) ****** */
        function addWrapperForMargins(container){
            /*var wrapper = $('<div class="media-box-container"></div').css({
                                    'margin-left'       : container.data('settings').horizontalSpaceBetweenBoxes,
                                    'margin-bottom'     : container.data('settings').verticalSpaceBetweenBoxes
                                });*/

            var wrapper = $('<div class="media-box-container"></div');
            container.find(itemSelector+':not([data-wrapper-added])').attr('data-wrapper-added', 'yes').wrapInner( wrapper );
        }

        /* ****** FadeIn the thumbnail or show broken thumbnail only for the ones with ratio specified ****** */
        function fadeInOrBroken(imageObj){
            var image           = $(imageObj.img);
            var thumbnailDiv    = image.parents('.image-with-dimensions');
            
            /* it has already been loaded or broken so skip it */

            if(image.hasClass('done')){ 
                return;
            }
            image.addClass('done');

            /* if the media-box is fully scaled (100%) then no need for the delay, fadeIn right away */

            var delay               = 400;
            var media_box           = image.parents(itemSelector);
            var transform_matrix    = media_box.css("-webkit-transform") || media_box.css("-moz-transform") || media_box.css("-ms-transform") || media_box.css("-o-transform") || media_box.css("transform");
            if(transform_matrix == 'none'){
                delay = 0;
            }

            /* Load or broken */

            setTimeout(function(){

                if( imageObj.isLoaded ){
                    
                    image.fadeIn(300, function(){ /* This will only be trigger if you hide the image above (if the "waitUntilThumbWithRatioLoads" settings is true) */
                        thumbnailDiv.removeClass('image-with-dimensions'); 
                    }); 
                    
                }else{
                    thumbnailDiv.removeClass('image-with-dimensions');
                    image.hide(); /* hide image since you are going to show a broken logo */
                    thumbnailDiv.addClass('broken-image-here');
                }

            }, delay);
        }

        /* ****** Load images with dimensions ****** */
        function loadImagesWithDimensions(container){
            /* FadeIn thumbnails that have dimensions specified if you want to show them after they have been loaded */
            container.find('.image-with-dimensions').imagesLoadedMB()
                .always(function(instance){
                    /* In case the progress event don't get to show the images (this happens sometimes when you refresh the page) */
                    for(index in instance.images){
                        var imageObj = instance.images[index];
                        fadeInOrBroken(imageObj);
                    }
                })
                .progress(function(instance, imageObj) {
                    fadeInOrBroken(imageObj);
                });
        }

        /* ****** Convert the divs with the URL specified to real images ****** */
        function convertDivsIntoImages(container, imagesWithDimensions){
            container.find(itemSelector).find(boxImageSelector+':not([data-imageconverted])').each(function(){
                var boxImage        = $(this);
                var thumbnailDiv    = boxImage.find('div[data-thumbnail]').eq(0); /* only one thumb allowed */
                var thumbnailSrc    = thumbnailDiv.attr('data-thumbnail');
                var thumbnailTitle  = thumbnailDiv.attr('data-title') != undefined ? thumbnailDiv.attr('data-title') : "";
                var thumbnailAlt    = thumbnailDiv.attr('data-alt') != undefined ? thumbnailDiv.attr('data-alt') : "";
                var gotDimensions   = thumbnailDiv.attr('data-width') != undefined && thumbnailDiv.attr('data-height') != undefined;
                var waitForAll      = container.data('settings').waitForAllThumbsNoMatterWhat;

                if(imagesWithDimensions == false && gotDimensions == true && waitForAll == false){
                    /* when the plugin wants the images WITHOUT dimensions, only ignore the images WITH dimensions if option "waitForAll..." is false */
                    return;
                }

                var imgHTML         = $('<img alt="'+thumbnailAlt+'" title="'+thumbnailTitle+'" src="'+thumbnailSrc+'" />');

                if(imagesWithDimensions == true){
                    /* If the dimensions are specified in the images then ignore them in the imagesLoaded plugin when you insert new items */
                    imgHTML.attr('data-dont-wait-for-me', 'yes');
                    thumbnailDiv.addClass('image-with-dimensions');

                    if( container.data('settings').waitUntilThumbWithRatioLoads ){
                        imgHTML.hide();
                    }
                }

                boxImage.attr('data-imageconverted', 'yes');
                thumbnailDiv.addClass('media-box-thumbnail-container').prepend(imgHTML);
            });

            loadImagesWithDimensions(container);
        }

        /* ****** Set the width and height for the media-box-image div, this is helpful for some overlay effects ****** */
        function setDimensionsToImageContainer(container){
            container.find(itemSelector).find(boxImageSelector).each(function(){
                var boxImage        = $(this);
                var box             = boxImage.parents(itemSelector);
                var hiddenBox       = box.css('display') == 'none';
                var thumbnailDiv    = boxImage.find('div[data-thumbnail]').eq(0); // only one thumb allowed

                if(thumbnailDiv[0] != undefined){ // if you haven't specified a thumbnail then ignore
                    if(hiddenBox){// If it is hidden, display 'none' wont give you the right height so you need to do this trick
                        box.css('margin-top', 99999999999999).show();
                    }

                    boxImage.width( thumbnailDiv[0].offsetWidth ); // now using offsetWidth, since jQuery3.width() changed to getBoundingClientRect()
                    boxImage.height( thumbnailDiv[0].offsetHeight );

                    if(hiddenBox){
                        box.css('margin-top', 0).hide();
                    }
                }
            });
        }

        /* ****** Calculate the right dimensions for the thumbnails ****** */
        function setStaticDimensionsOfThumbnails(container){
            container.find(itemSelector).find(boxImageSelector).each(function(){
                var boxImage        = $(this);
                var box             = boxImage.parents(itemSelector);
                var hiddenBox       = box.css('display') == 'none';
                var thumbnailDiv    = boxImage.find('div[data-thumbnail]').eq(0); /* only one thumb allowed */
                var gotDimensions   = thumbnailDiv.attr('data-width') != undefined && thumbnailDiv.attr('data-height') != undefined;

                var imgWidth        = parseFloat( thumbnailDiv.data('width') );
                var imgHeight       = parseFloat( thumbnailDiv.data('height') );

                if(hiddenBox){// If it is hidden, display 'none' wont give you the right height so you need to do this trick
                    box.css('margin-top', 99999999999999).show();
                }

                var newWidth        = box[0].offsetWidth - container.data('current_horizontalSpaceBetweenBoxes'); // now using offsetWidth, since jQuery3.width() changed to getBoundingClientRect()
                var newHeight       = (imgHeight * newWidth)/imgWidth;

                if(hiddenBox){
                    box.css('margin-top', 0).hide();
                }
                
                thumbnailDiv.css('width', newWidth);

                /* Set the height only to those thumbs with width and height specified */ 
                if( gotDimensions ){
                    thumbnailDiv.css('height', Math.floor(newHeight));
                }
            });
        }
        
        /* ****** Set the width of the columns according to the settings specified ****** */
        function setColumnWidth(container, columnWidth, columns){
            var newWidth    = 0;
            var percentage  = container.data('settings').percentage;
            var symbol      = '';

            if( columnWidth == 'auto' ){
                if(percentage){
                    newWidth    = 100/columns;
                    symbol      = '%';
                }else{
                    newWidth    = Math.floor(  Math.floor(container.width())/columns ); // minus 1px because some resolutions don't fit perfectly
                }
            }else{
                newWidth = columnWidth;
            }

            /* the width that the isotope logic will use for each column of the grid */
            container.find('.media-boxes-grid-sizer').css( 'width' , newWidth + symbol );
            
            container.find(itemSelector).each(function(index){
                var box         = $(this);
                var boxColumns  = box.data('columns');

                /* if the box has columns asigned, check that it doesn't have more than the number of columns in the grid */
                if(boxColumns != undefined && parseInt(boxColumns)>parseInt(columns)){
                    boxColumns = columns;
                }

                /* for columns that don't have data-columns specified */
                if(boxColumns == undefined){
                    boxColumns = 1;
                }
                
                /* Adjust the width */
                box.css( 'width' , (parseFloat(newWidth)*parseInt(boxColumns)) + symbol );
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
        
        /* ****** Set new horizontal and vertical space between boxes ****** */
        function setSpaceBetweenBoxes(container, horizontal, vertical){
            container.data('current_horizontalSpaceBetweenBoxes', horizontal);
            container.data('current_verticalSpaceBetweenBoxes', vertical);

            container.css('margin-left', -horizontal);
            container.find('.media-box-container').css({
                                    'margin-left'       : horizontal,
                                    'margin-bottom'     : vertical
                                });

        }

        /* ****** Get and set the correct columnWidth for the current resolution ****** */
        function getAndSetColumnWidth(container){
            var resolutionFound = false;
            for (var key in container.data('settings').resolutions) {
                var value = container.data('settings').resolutions[key];
                
                if( value.maxWidth >= viewport().width ){
                    if(value.horizontalSpaceBetweenBoxes != undefined && value.verticalSpaceBetweenBoxes != undefined){
                        setSpaceBetweenBoxes(container, value.horizontalSpaceBetweenBoxes, value.verticalSpaceBetweenBoxes);
                    }else{
                        setSpaceBetweenBoxes(container, container.data('settings').horizontalSpaceBetweenBoxes, container.data('settings').verticalSpaceBetweenBoxes);
                    }
                    setColumnWidth(container, value.columnWidth, value.columns);
                    resolutionFound = true;
                    break;
                }
            }
            
            /* If there wasn't a match then use the default one */
            if( resolutionFound == false ){
                setSpaceBetweenBoxes(container, container.data('settings').horizontalSpaceBetweenBoxes, container.data('settings').verticalSpaceBetweenBoxes);
                setColumnWidth(container, container.data('settings').columnWidth, container.data('settings').columns);
            }
        }

        /* ****** Hide overlays when resizing ****** */
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
                /* Hack for seting the grid */
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
                Waypoint.refreshAll();
                setTimeout(function(){ container.addClass('lazy-load-ready'); }, 10); // delay 10 ms, since the new version of waypoints triggers to fast
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
                
                var items = this.addItems( elems );
                if ( !items.length ) {
                    /* Callback for inserting items, I added this 3 lines */
                    if (typeof callback === 'function'){
                        callback();
                    }
                    return;
                }   

                // append item elements
                var i, item, firstHiddenBox = container.find('.'+itemHiddenClass)[0];
                var len = items.length;
                for ( i=0; i < len; i++ ) {
                    item = items[i];
                    if(firstHiddenBox != undefined){
                        this.element.insertBefore( item.element, firstHiddenBox );
                    }else{
                        this.element.appendChild( item.element );
                    }
                }

                var isotopeDefaultLogic = function(){

                    // filter new stuff
                    var filteredInsertItems = this._filter( items ).matches;
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

                
                addPopupTrigger(container);                /* Add popup trigger */
                addWrapperForMargins(container);            /* Set the vertical and horizontal space between boxes */
                getAndSetColumnWidth(container);            /* Set the column width */
                setStaticDimensionsOfThumbnails(container); /* Set the static ratio to the thumbnailDiv */
                convertDivsIntoImages(container, false);    /* Only the ones that have NO width and height */

                container.find('img:not([data-dont-wait-for-me])').imagesLoadedMB()
                    .always(function(){
                        if( container.data('settings').waitForAllThumbsNoMatterWhat == false ){
                            convertDivsIntoImages(container, true);                 /* the ones left that have width and height */                  
                        }

                        container.find(itemSelector).addClass('media-box-loaded');  /* Add the class to show the box */
                        $(container.data('settings').search).trigger('keyup');      /* Show or hide according to the searching criteria */
                        isotopeDefaultLogic.call(instance);                         /* Now you can call the default logic of the insert method from Isotope */
                        setDimensionsToImageContainer(container);                   /* Set the same dimensions of the thumbnail to the container (for caption purposes) */
                        setupOverlayForHoverEffect(container);                      /* Get ready for the overlay effect */

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

        function filterTheBoxes(filterValue, filterGroup){

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

            // load more boxes if neccessary 
            checkMinBoxesPerFilter();
        }

        function goAndFilterIsotope(filterValue, filterGroup){
            // set filter for group
            filters[ filterGroup ] = filterValue;
            
            // set filters for Isotope
            $container.isotopeMB({ filter: combineFilters(filters) });
        }

        function combineFilters( filters ) {

            var output = [];

            for ( var prop in filters ) {
                var selector        = filters[prop];
                var selector_clean  = selector.split(" ").join(""); // Remove empty spaces, so if we have this: .red, .blue it should be: .red,.blue
                var selector_split  = selector_clean.split(",")     

                /* ###### AND ###### */
                if(settings.multipleFilterLogic == 'AND'){
                    
                    if(selector_clean != '*'){
                        if(output.length == 0){
                            output = selector_split;                        
                        }else{
                            output = allPossibleCases([ output, selector_split ]);                        
                        }
                    }

                }

                /* ###### OR ###### */
                else if(settings.multipleFilterLogic == 'OR'){
                    if(selector_clean != '*' && selector_clean != '.search-match'){
                        if('search' in filters){ // if the search filter is enable, then combine it with the current selector
                            var mixed = allPossibleCases([ ['.search-match'], selector_split ]);
                            output.push( mixed.join(',') );
                        }else{
                            output.push( selector_split.join(',') );             
                        }
                    }
                }

            }

            var combined = output.length > 0 ? output.join(',') : '*'; // if output is empty, is probably because all filters were '*'

            return combined;
        }

        function allPossibleCases(arr) {
            if (arr.length == 1) {
                return arr[0];
            } else {
                var result = [];
                var allCasesOfRest = allPossibleCases(arr.slice(1));  // recur with the rest of array
                for (var i = 0; i < allCasesOfRest.length; i++) {
                    for (var j = 0; j < arr[0].length; j++) {
                        result.push(arr[0][j] + allCasesOfRest[i]);
                    }
                }
                return result;
            }
        }

    /* ====================================================================== *
            [5] LOAD MORE BOXES
     * ====================================================================== */

        function checkMinBoxesPerFilter(){

            var filter  = getCurrentFilter();
            var in_all  = false;
            if( filter == '*' || (filter == '.search-match' && $(settings.search).val() == '') ){
                in_all = true;
            }
            
            if(in_all == false){//only execute the minBoxesPerFilter when is not showing all the boxes

                var boxesInCurrentCategory  = getBoxesInCurrentFilter().length;

                /* Also check if there's boxes waiting to get load from that category, because maybe there isn't and there's no case to try to load them */
                if( boxesInCurrentCategory < settings.minBoxesPerFilter && hiddenBoxesWaitingToLoad().length > 0 ){
                    /* Load the boxes that are missing */
                    loadMore( settings.minBoxesPerFilter - boxesInCurrentCategory );

                    return true;
                }

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
            });
        }
        loadMore( settings.boxesToLoadStart, true );
        
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

        var filtersContainers = $(settings.filterContainer);  
        
        /* EVENT IF THE FILTER IS A SELECT */
        filtersContainers.on('change', function(){
            if($(this).is("select")){ // check if its a select element 
                /* current items */
                var current_filter          = $(this).find("*[data-filter]:selected");
                var current_filterContainer = $(this);
                
                /* initialize the filtering */
                init_filtering(current_filter, current_filterContainer, 'change');
            }
        });

        /* EVENT FOR WHEN CLICKING A FILTER NAVIGATION BAR OR A DROPDOWN MENU */
        filtersContainers.on('click', '*[data-filter]', function(e){
            if(!$(this).is("option")){ // check if its not an option from a select element 
                /* current items */
                var current_filter          = $(this);
                var current_filterContainer = $(this).parents(settings.filterContainer);
                
                /* initialize the filtering */
                init_filtering(current_filter, current_filterContainer, 'click');

                e.preventDefault();
            }
        });

        /* DEFAULT FILTERS SELECTED */
        filtersContainers.each(function(){
            /* current items */
            var current_filter          = $(this).find('*[data-filter]').filter('.selected');
            var current_filterContainer = $(this);

            if(current_filter[0] == undefined) return;

            /* set default value */
            current_filterContainer.attr('default-value', current_filter.attr('data-filter'));

            /* initialize the filtering */
            init_filtering(current_filter, current_filterContainer, 'default');
        });

        function init_filtering(current_filter, current_filterContainer, evt){
            /* Remove selected class from others */
            current_filterContainer.find('*[data-filter]').removeClass('selected');
            
            /* Add class of selected */
            current_filter.addClass('selected');

            /* Filter isotope */
            var filterValue     = current_filter.attr('data-filter');
            var filterGroup     = current_filterContainer.data("id") != undefined ? current_filterContainer.data("id") : "filter"; // take the id of the filter container if exists, if not just a string
            var is_default      = current_filterContainer.attr('default-value') == filterValue;

            // Hash on filter change, but do not take in consideration when the plugin set a default value when first loads
            if(evt != 'default'){
                hash_on_filter_change(filterValue, filterGroup, is_default);
            }

            // Filter the boxes
            filterTheBoxes( filterValue , filterGroup);
        }

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

            var is_default      = $(settings.search).attr('default-value') == value;

            setTimeout( function() {
                // Hash on filter change
                hash_on_filter_change(value, 'search', is_default);

                // Filter the boxes
                filterTheBoxes('.search-match', 'search');
            }, 100 );
        }

        $(settings.search).on('keyup', function(){
            search( $(this).val() );
        });

        /* set default value */
        $(settings.search).attr('default-value', $(settings.search).attr('value') === undefined ? "" : $(settings.search).attr('value'));

        /* default search  selected */
        search( $(settings.search).val() );

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

        $(settings.sortContainer).find('*[data-sort-by]').on('click', function(e){
            var $this = $(this);

            /* Remove selected class from others */
            $this.parents(settings.sortContainer).find('*[data-sort-by]').removeClass('selected');
            
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

        /* ****** Set the overlay depending on the overlay effect before the hover event is trigger ****** */
        function setupOverlayForHoverEffect(container){
            if( container.data('settings').thumbnailOverlay == false ) return;

            var boxes = container.find(itemSelector+':not([data-set-overlay-for-hover-effect])').attr('data-set-overlay-for-hover-effect', 'yes');

            /* Add extra divs for vertical alignment */
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

        /* ****** Hide element when done ****** */
        function hideWhenDone(element){
            if( element.attr('data-stop') != undefined ){
                element.hide();
                element.removeAttr('data-stop');
            }
        }

        /* ****** Trigger the overlay effect ****** */
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
            [10] IFRAME ON GRID
     * ====================================================================== */

        /* Instead of openning the youtube/vimeo video in the popup open it in the grid  */
        $container.on('click', '.iframe-on-grid', function(){
            var $this   = $(this);
            var mbImage = $this.parents(itemSelector).find(boxImageSelector);
            
            show_video_on_grid(mbImage, $this.attr('data-src'));
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
            [11] MAGNIFIC POPUP
     * ====================================================================== */

        function addPopupTrigger(container){

            container.find(itemSelector+', .'+itemHiddenClass).find('.mb-open-popup:not(.popup-trigger-added)').each(function(){
                
                var $this            = $(this).addClass('popup-trigger-added');
                var attr_src         = $this.attr('data-src');
                var attr_type        = $this.attr('data-type');
                var attr_title       = $this.attr('data-title') != undefined ? $this.attr('data-title') : "";
                var attr_alt         = $this.attr('data-alt') != undefined ? $this.attr('data-alt') : "";

                // Instead of openning the iframe in the popup open it in the grid
                if( $this.hasClass('iframe-on-grid') && attr_type == 'iframe' ){
                    return;
                }
                
                // Magnific Popup attributes

                var type = 'mfp-image';
                if(attr_type == 'iframe'){
                    type = 'mfp-iframe';
                }else if(attr_type == 'inline'){
                    type = 'mfp-inline';
                }else if(attr_type == 'ajax'){
                    type = 'mfp-ajax';
                }

                $this.attr('data-mfp-src', attr_src);
                $this.addClass(type);
                $this.attr('mfp-title', attr_title);
                $this.attr('mfp-alt', attr_alt);
                
            });

        }

        function startPopup(container, delegate){

            $container.magnificPopup({
                delegate            : delegate, // child items selector, by clicking on it popup will open
                type                : 'image',
                removalDelay        : 200,
                closeOnContentClick : false,
                alignTop            : settings.alignTop,
                preload             : settings.preload,
                tLoading            : 'loading...',
                mainClass           : 'my-mfp-slide-bottom',
                gallery             : { enabled : settings.gallery },
                closeMarkup         : '<button title="%title%" class="mfp-close"></button>',
                titleSrc            : 'title',
                autoFocusLast       : false, // in the new version of Magnific Popup on IE it jumps to the element that triggered the popup, which looks odd, so we better disable it 
                iframe              : {
                    patterns : {
                        youtube: {
                          index: 'youtube.com/', // String that detects type of video (in this case YouTube). Simply via url.indexOf(index).
                          id: 'v=', // String that splits URL in a two parts, second part should be %id%
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
                callbacks           : {
                    change : function() {
                        var item    = $(this.currItem.el);

                        setTimeout(function(){ 
                            $('.mfp-title').html(item.attr('mfp-title'));    
                            $('.mfp-img').attr('alt', item.attr('mfp-alt'));    

                            addSocialButtons(item)
                        }, 5);

                        hash_on_popup_change(item.attr('data-src'));
                    },
                    close: function () {
                        if(settings.deepLinkingOnPopup){
                            var item    = $(this.currItem.el);
                            remove_from_hash('('+item.parents('.media-boxes-container').attr('id')+'|popup)=');
                        }
                    },
                    /* FIX SO THE BACKGROUND DOESN'T MOVE */
                    beforeOpen: function() {
                        this.container.data('scrollTop', parseInt($(window).scrollTop()));
                    },
                    open: function(){
                        $('html, body').scrollTop( this.container.data('scrollTop') );
                    },
                },
            });

        }

        if(settings.magnificPopup){
            var delegate = '.mb-open-popup[data-src]';
            if(settings.considerFilteringInPopup){
                delegate = itemSelector+':not(.hidden-media-boxes-by-filter) .mb-open-popup[data-src], .'+itemHiddenClass+':not(.hidden-media-boxes-by-filter) .mb-open-popup[data-src]';
            }
            if(settings.showOnlyVisibleBoxesInPopup){
                delegate = itemSelector+':visible .mb-open-popup[data-src]';
            }

            startPopup($container, delegate)
        }

    /* ====================================================================== *
            [12] DEEP LINKING
     * ====================================================================== */

        function hash_on_filter_change(filterValue, filterGroup, is_default){
            if( (filterGroup=='search' && settings.deepLinkingOnSearch) || (filterGroup!='search' && settings.deepLinkingOnFilter) ){
                if(is_default === true){
                    remove_from_hash('('+$container.attr('id')+'|'+filterGroup+')=');
                }else{
                    set_key_and_value_in_hash('('+$container.attr('id')+'|'+filterGroup+')=', filterValue);
                }
            }
        }

        function hash_on_popup_change(value){
            if(settings.deepLinkingOnPopup){
                set_key_and_value_in_hash('('+$container.attr('id')+'|popup)=', value); /* with the "src" of the image and the "id" of the container */
            }
        }

        var cleaned_hash = '';

        function trigger_filter_and_search(){
            if(settings.deepLinkingOnFilter){
                $(settings.filterContainer).each(function(){
                    var current_filterContainer = $(this);
                    var filterGroup             = current_filterContainer.data("id") != undefined ? current_filterContainer.data("id") : "filter"; // take the id of the filter container if exists, if not just a string
                    var key                     = '('+$container.attr('id')+'|'+filterGroup+')=';
                    var hash_value              = get_value_from_hash(key);

                    cleaned_hash += get_value_and_start_from_hash(key);
                    
                    if(hash_value != ''){
                        if(current_filterContainer.is("select")){ // check if its a select element 
                            var val = current_filterContainer.find('*[data-filter="'+hash_value+'"]').val();
                            current_filterContainer.val(val).trigger('change');
                        }else{
                            current_filterContainer.find('*[data-filter="'+hash_value+'"]').trigger('click');
                        }
                    }
                });
            }

            if(settings.deepLinkingOnSearch){
                var key             = '('+$container.attr('id')+'|search)=';
                var hash_value      = get_value_from_hash(key);

                cleaned_hash += get_value_and_start_from_hash(key);

                if(hash_value != ''){
                    $(settings.search).val(hash_value).trigger('keyup');
                }
            }
        }
        trigger_filter_and_search();

        function trigger_popup(){
            if(settings.deepLinkingOnPopup){
                var key             = '('+$container.attr('id')+'|popup)=';
                var hash_value      = get_value_from_hash(key);

                cleaned_hash += get_value_and_start_from_hash(key);

                if(hash_value != ''){
                    $container.find('.mb-open-popup[data-src="'+ hash_value +'"]').trigger('click');
                }
            }
        }
        trigger_popup();

        // save only the part of the hash that's correct (without trash)
        $container.attr('cleaned_hash', cleaned_hash); // this is helpful if later on, outside the scope of the MediaBoxes method, you wish to clean the has from old values or trash

/*
        // THIS MAY CAUSE BUGS!!
        
        if(window.addEventListener){
            window.addEventListener("hashchange", function(){ trigger_popup(); trigger_filter_and_search(); }, false);
        }else if (window.attachEvent){
            window.attachEvent("onhashchange", function(){ trigger_popup(); trigger_filter_and_search(); });  
        }
*/

        /* ### HELPFUL METHODS ### */

        function remove_from_hash(start){
            var new_hash    = get_hash().split( get_value_and_start_from_hash(start) ).join('');
            set_hash(new_hash);
        }

        function get_hash(){
            if(location.href.indexOf("#") != -1){
                //return decodeURI( location.href.split("#")[1] ); // this wouldn't work if there are more # in the hash
                return decodeURI( location.href.substring(location.href.indexOf('#')+1) );
            }else{
                return '';
            }
        }

        function set_hash(new_hash){
            if(new_hash === '' || new_hash === '#' || new_hash === '!'){
                /* if the hash will be empty then use this following peace of code, otherwise it will jump back to the top of the page if you set an empty result for the hash */
                if(history.pushState) { 
                    history.pushState(null, null, '#'); 
                }else{ 
                    location.hash = '#!'; 
                }
            }else{
                location.hash = '#' + new_hash;

                /* This may be helpful later on (I found in a site it jumps to the beginning of the page the first time you change the hash, but in the examples is working like a charm)
                if(history.pushState) { 
                    history.pushState(null, null, '#'+ new_hash); 
                }else{ 
                    location.hash = '#!'+ new_hash; 
                }
                */
            }
        }

        function replace_in_hash(old_value, new_value){
            var hash        = get_hash();

            if(hash.indexOf(old_value) > -1 && old_value != ""){ // if the old value exists, then just replace it
                set_hash( hash.split(old_value).join(new_value) );
            }else{ // if the old value doesn't exists then just add the new one
                set_hash( hash+new_value );
            }
        }

        function get_value_and_start_from_hash(start){
            var hash            = get_hash();
            var output          = '';
            var index_start     = hash.indexOf(start);
            
            if(index_start > -1 && hash.indexOf(';', index_start) > -1){
                output = hash.substring(index_start, hash.indexOf(';', index_start)+1);
            }

            return output;
        }

        function get_value_from_hash(start){
            var hash            = get_hash();
            var output          = '';
            var index_start     = hash.indexOf(start);
            
            if(index_start > -1 && hash.indexOf(';', index_start) > -1){
                output = hash.substring(index_start+(start.length), hash.indexOf(';', index_start))
            }

            return output;
        }

        function set_key_and_value_in_hash(start, value){
            if(get_value_from_hash(start) == value){
                // do nothing, since there's no change in the hash
            }else{
                var old_value   = get_value_and_start_from_hash(start);
                var new_value   = start + value + ';'; // i.e. // (grid|popup)=some_image.png;
                replace_in_hash(old_value, new_value);
            }
        }

    /* ====================================================================== *
            [13] SOCIAL IN MAGNIFIC POPUP
     * ====================================================================== */

        function addSocialButtons(item){
            var FullURL             = location.href; // the url of your page
            var URLWithoutHash      = location.href.replace(location.hash,""); // the url of your page without the hashtag
            var imageURL            = item.attr('data-src'); // the image URL

            // which URL do you want to share of the 3 options above?
            // var sharingURL = URLWithoutHash+"/"+imageURL;
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
        }

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

        //return this;

    };//END OF INIT

/* ====================================================================== *
        [D] DESTROY
 * ====================================================================== */

    MediaBoxes.prototype.destroy = function () {

        this.container_clone.insertBefore(this.container).removeData('mediaBoxes');

        this.container.removeClass(); // remove all classes! (if I don't the lazy load gets triggered)
        this.container.next('.media-boxes-load-more-button').remove();
        this.container.isotopeMB('destroy');
        this.container.remove();

    }   

/* ====================================================================== *
        [E] INSERT
 * ====================================================================== */

    MediaBoxes.prototype.insert = function (content, callback) {

        var $container = this.container;

        $container.isotopeMB( 'insert', $(content), function(){
            callback();
            $container.isotopeMB('layout'); 
        });  

    }      

/* ====================================================================== *
        [F] REFRESH
 * ====================================================================== */

    MediaBoxes.prototype.refresh = function () {

        this.container.isotopeMB('layout'); 

    }     

/* ====================================================================== *
        [G] RESIZE
 * ====================================================================== */

    MediaBoxes.prototype.resize = function () {

        this.container.isotopeMB('resize'); 

    }      

/* ====================================================================== *
        [H] MEDIA BOXES PLUGIN
 * ====================================================================== */

    $.fn.mediaBoxes = function(options, content, callback) {

        return this.each(function(key, value){
            var $this   = $(this);
            var data    = $this.data('mediaBoxes')
            
            // Initialize plugin
            if (!data && typeof options != 'string'){
                $this.data('mediaBoxes', new MediaBoxes(this, options));
            }

            // Call method
            if (data && typeof options == 'string'){
                data[options](content, callback);    
            }
        });

    };      
    
})( window, jQuery );