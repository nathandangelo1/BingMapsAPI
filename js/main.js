// import { credentials } from "jsconstants.js";

var map, searchManager;

//Query URL to the POI data source
var sdsDataSourceUrl =
  "https://spatial.virtualearth.net/REST/v1/data/Microsoft/PointsOfInterest";

function GetMap() {
  map = new Microsoft.Maps.Map("#myMap", {
    credentials:
      "AsnjENk9o2btta0rJzurVwsuleYaFxsWcc78p0Bop4TjK4M7PdNcjX1JyCXi6C45",
  });

  Microsoft.Maps.loadModule("Microsoft.Maps.AutoSuggest", function () {
    var manager = new Microsoft.Maps.AutosuggestManager({ map: map });
    manager.attachAutosuggest(
      "#searchBox",
      "#searchBoxContainer",
      selectedSuggestion
    );
  });

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
    spatialFilter: {
      spatialFilterType: "nearby",
      location: map.getCenter(),
      radius: 25,
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
