
var map, searchManager, searchArea;
const credentials=
    "AsnjENk9o2btta0rJzurVwsuleYaFxsWcc78p0Bop4TjK4M7PdNcjX1JyCXi6C45";

//Query URL to the POI data source
var sdsDataSourceUrl =
  "https://spatial.virtualearth.net/REST/v1/data/Microsoft/PointsOfInterest";

function GetMap() {
  map = new Microsoft.Maps.Map("#myMap", {
      credentials: credentials,
/*      "AsnjENk9o2btta0rJzurVwsuleYaFxsWcc78p0Bop4TjK4M7PdNcjX1JyCXi6C45",*/
    zoom: 13,
  });

  Microsoft.Maps.loadModule("Microsoft.Maps.AutoSuggest", function () {
      var manager = new Microsoft.Maps.AutosuggestManager({
          map: map,
          businessSuggestions: true
      });
    manager.attachAutosuggest(
      "#searchBox",
      "#searchBoxContainer",
      selectedSuggestion
    );
  });

    //Load the directions module.
    Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {
        //Create an instance of the directions manager.
        directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);

        //Specify where to display the route instructions.
        directionsManager.setRenderOptions({ itineraryContainer: '#directionsItinerary' });

        //Specify the where to display the input panel
        directionsManager.showInputPanel('directionsPanel');
    });

  // //POLY
  // //Create a random 5 sided polyogn that fills a decent portion of the map.
  // searchArea = Microsoft.Maps.TestDataGenerator.getPolygons(
  //   0.5,
  //   map.getBounds(),
  //   2,
  //   0.7
  // );
  // map.entities.push(searchArea);
  // //POLY

  //SEARCHBOX
  //Create an infobox to display content for each result.
  infobox = new Microsoft.Maps.Infobox(map.getCenter(), { visible: false });
  infobox.setMap(map);

  //Create a layer for the results.
  layer = new Microsoft.Maps.Layer();
  map.layers.insert(layer);

  //Add a click event to the layer to show an infobox when a pushpin is clicked.
  Microsoft.Maps.Events.addHandler(layer, "click", function (e) {
    var m = e.target.metadata;

    infobox.setOptions({
      title: m.DisplayName,
      description: m.AddressLine + ", " + m.Locality,
      location: e.target.getLocation(),
      visible: true,
    });
  });
  //SEARCHBOX

  //Load the Bing Spatial Data Services module.
  Microsoft.Maps.loadModule("Microsoft.Maps.SpatialDataService", function () {
    //Add an event handler for when the map moves.
    Microsoft.Maps.Events.addHandler(map, "viewchangeend", getNearByLocations);

    //Trigger an initial search.
    getNearByLocations();
  });
}

function selectedSuggestion(result) {
  //Remove previously selected suggestions from the map.
  map.entities.clear();

  map.setView({ bounds: result.bestView });
}

function getNearByLocations() {
  //Remove any existing data from the layer.
  layer.clear();

  //Hide infobox.
  infobox.setOptions({ visible: false });

  //Create a query to get nearby data.
  var queryOptions = {
    queryUrl: sdsDataSourceUrl,
    top: 20,
    spatialFilter: {
      //POLY
      // spatialFilterType: "intersects",
      // intersects: searchArea,

      spatialFilterType: "nearby",
      location: map.getCenter(),
      radius: 15,
    },
    filter: new Microsoft.Maps.SpatialDataService.Filter(
      "EntityTypeID",
      "eq",
      5800
    ), //Filter to retrieve Gas Stations.
  };

  //Process the query.
  Microsoft.Maps.SpatialDataService.QueryAPIManager.search(
    queryOptions,
    map,
    function (data) {
      //Add results to the layer.
      layer.add(data);
    }
  );
}
//http://spatial.virtualearth.net/REST/v1/data/accessId/dataSourceName/
//entityTypeName?spatialFilter=intersects(geography)& queryOption1&queryOption2&queryOptionN
//&jsonp=jsonCallBackFunction&jsonso=jsonState&isStaging=isStaging&key=queryKey
