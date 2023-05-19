var map;
var dest;
var lat;
var lon;
const credentials =
  "AsnjENk9o2btta0rJzurVwsuleYaFxsWcc78p0Bop4TjK4M7PdNcjX1JyCXi6C45";

//Query URL to the POI data source
var sdsDataSourceUrl =
  "https://spatial.virtualearth.net/REST/v1/data/Microsoft/PointsOfInterest";

navigator.geolocation.getCurrentPosition(function (position) {
  lat = position.coords.latitude;
  lon = position.coords.longitude;
});

function GetMap() {
  map = new Microsoft.Maps.Map("#myMap", {
    credentials: credentials,
    /*      "AsnjENk9o2btta0rJzurVwsuleYaFxsWcc78p0Bop4TjK4M7PdNcjX1JyCXi6C45",*/
    zoom: 13,
  });

  Microsoft.Maps.loadModule("Microsoft.Maps.AutoSuggest", function () {
    var manager = new Microsoft.Maps.AutosuggestManager({
      map: map,
      businessSuggestions: true,
    });

    manager.attachAutosuggest(
      "#searchBox",
      "#searchBoxContainer",
      selectedSuggestion
    );
  });

  document
    .getElementById("fetchLocal")
    .addEventListener("click", fetchLocalSearch);
  document
    .getElementById("searchBox")
    .addEventListener("keyup", function (event) {
      // If the user presses the "Enter" key on the keyboard
      if (event.code === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("fetchLocal").click();
      }
    });

  let button = document.getElementById("btnRestaurants");
  button.addEventListener("click", function (e) {
    let buttonValue = button.value;
    NearbyLocations(buttonValue);
  });
}

function NearbyLocations(value) {
  //Create an infobox to display content for each result.
  infobox = new Microsoft.Maps.Infobox(map.getCenter(), { visible: false });
  infobox.setMap(map);

  //Create a layer for the results.
  layer = new Microsoft.Maps.Layer();
  map.layers.insert(layer);

  //Add a click event to the layer to show an infobox when a pushpin is clicked.
  Microsoft.Maps.Events.addHandler(layer, "click", function (e) {
    var m = e.target.metadata;
    dest = m;

    infobox.setOptions({
      htmlContent: `<div id="infoboxText" style="background: #e3b3b3; color: #000000; padding: 5px;">
      <div class="pull-right">
      <a id="ibox-close" class="infobox-close" onclick="closeInfoBox()">x
      </a></div><h2>${m.DisplayName.toString()}</h2><p>${
        m.AddressLine.toString() + ", " + m.Locality.toString()
      }</p><button id="btn-getdirections2" type="button">Get Directions</button>
      </div>
      `,
      // title: m.DisplayName,
      // description: m.AddressLine + ", " + m.Locality,
      location: e.target.getLocation(),
      visible: true,
    });

    document
      .getElementById("btn-getdirections2")
      .addEventListener("click", () => {
        GetDirections();
      });
  });

  //Load the Bing Spatial Data Services module.
  Microsoft.Maps.loadModule("Microsoft.Maps.SpatialDataService", function () {
    //Add an event handler for when the map moves.
    Microsoft.Maps.Events.addHandler(map, "viewchangeend", getNearByLocations);

    //Trigger an initial search.
    getNearByLocations(value);
  });
}

function closeInfoBox() {
  infobox.setOptions({ visible: false });
}

async function fetchLocalSearch() {
  let query = document.getElementById("searchBox").value;
  let point = map.getCenter();
  const lat1 = point.latitude;
  const lon1 = point.longitude;
  if (query != "" && point && credentials) {
    const LOCALSEARCHAPI_URL = `https://dev.virtualearth.net/REST/v1/LocalSearch/?query=${query}&userLocation=${
      lat1 + "," + lon1
    }&key=${credentials}`;
    try {
      const response = await fetch(LOCALSEARCHAPI_URL);
      const res = await response.json();
      console.log(res);
      Search(res);
    } catch (err) {
      console.error(err);
    }
  }
}

function Search(res) {
  r = res.resourceSets[0].resources;
  //Remove any previous results from the map.
  map.entities.clear();
  layer.clear();

  if (r && r.length > 0) {
    var pin,
      pins = [],
      locs = [],
      output = "Results:<br/>";

    for (var i = 0; i < r.length; i++) {
      let coords = r[i].point.coordinates;
      var location = new Microsoft.Maps.Location(coords[0], coords[1]);
      //Create a pushpin for each result.
      pin = new Microsoft.Maps.Pushpin(location, {
        title: r[i].name,
        subTitle: r[i].Address.addressLine,
        text: i + 1 + "",
      });
      pins.push(pin);
      locs.push(r[i].point.coordinates);

      output += i + 1 + ") " + r[i].name + "<br/>";
    }

    //Add the pins to the map
    map.entities.push(pins);

    //Display list of results
    document.getElementById("directionsItinerary").innerHTML = output;

    //Determine a bounding box to best view the results.
    var bounds;

    if (r.length == 1) {
      bounds = r[0].bestView;
    } else {
      //Use the locations from the results to calculate a bounding box.
      bounds = Microsoft.Maps.LocationRect.fromLocations(locs);
    }

    map.setView({ bounds: bounds });
  }
}

function GetDirections() {
  //Load the directions module.
  Microsoft.Maps.loadModule("Microsoft.Maps.Directions", function () {
    if (typeof directionsManager === "undefined") {
      //myVariable is undefined
      //Create an instance of the directions manager.
      directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
    } else {
      directionsManager.clearAll();
    }
    //Specify where to display the route instructions.
    directionsManager.setRenderOptions({
      itineraryContainer: "#directionsItinerary",
    });

    //Specify where to display the input panel
    directionsManager.showInputPanel("directionsPanel");
    //Create waypoints to route between.

    var origination = new Microsoft.Maps.Directions.Waypoint({
      address: "Current Location",
      location: new Microsoft.Maps.Location(lat, lon),
    });
    directionsManager.addWaypoint(origination);

    var destination = new Microsoft.Maps.Directions.Waypoint({
      address: dest.DisplayName.toString(),
      location: new Microsoft.Maps.Location(dest.Latitude, dest.Longitude),
    });
    directionsManager.addWaypoint(destination);

    //Specify the element in which the itinerary will be rendered.
    directionsManager.setRenderOptions({
      itineraryContainer: "#directionsItinerary",
    });

    //Calculate directions.
    directionsManager.calculateDirections();
  });
}

function getNearByLocations(value) {
  //Remove any existing data from the layer.
  layer.clear();

  //Hide infobox.
  infobox.setOptions({ visible: false });

  //Create a query to get nearby data.
  var queryOptions = {
    queryUrl: sdsDataSourceUrl,
    top: 20,
    spatialFilter: {
      spatialFilterType: "nearby",
      location: map.getCenter(),
      radius: 15,
    },
    filter: new Microsoft.Maps.SpatialDataService.Filter(
      "EntityTypeID",
      "eq",
      value //restaurants
    ),
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

function selectedSuggestion(result) {
  //Remove previously selected suggestions from the map.
  map.entities.clear();

  map.setView({ bounds: result.bestView });
}
