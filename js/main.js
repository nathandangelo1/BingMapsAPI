map = null;

function LoadMap() {
  map = new Microsoft.Maps.Map("#myMap", {});

  //let mapCenter = map.getCenter();

  Microsoft.Maps.Events.addHandler(map, "click", function (e) {
    let loc = e.location;
    AddPin(loc, 0, 0);
  });

  //   AddPin(mapCenter, 0, 0);
  //   AddPin(mapCenter, 32, 32);
} //end function

function AddPin(location, offsetX = 0, offsetY = 0) {
  //CREATE CUSTOM PUSHPIN
  var pin = new Microsoft.Maps.Pushpin(location);

  var offset = new Microsoft.Maps.Point(offsetX, offsetY);

  //SET PINS DATA
  let pinOptionsData = { icon: "images/ryu.gif", anchor: offset };
  pin.setOptions(pinOptionsData);

  //ADD THE PUSHPIN TO THE MAP
  map.entities.push(pin);
} //end function
