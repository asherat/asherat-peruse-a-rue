/*
** Copyright 2013 Google Inc.
**
** Licensed under the Apache License, Version 2.0 (the "License");
** you may not use this file except in compliance with the License.
** You may obtain a copy of the License at
**
**    http://www.apache.org/licenses/LICENSE-2.0
**
** Unless required by applicable law or agreed to in writing, software
** distributed under the License is distributed on an "AS IS" BASIS,
** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
** See the License for the specific language governing permissions and
** limitations under the License.
*/

define(
['config', 'bigl', 'validate', 'stapes', 'googlemaps', 'sv_svc'],
function(config, L, validate, Stapes, GMaps, sv_svc) {
  var StreetViewModule = Stapes.subclass({

    // street view horizontal field of view per zoom level
    // varies per render mode
    SV_HFOV_TABLES: {
      "webgl": [
        127,
        90,
        53.5,
        28.125,
        14.25
      ],
      "html4": [
        180,
        90,
        45,
        22.5,
        11.25
      ],
      "html5": [
        127,
        90,
        53.5,
        //Alf 28.125,
	22,
        14.25
      ],
      "flash": [
        180,
        90,
        45,
        22.5,
        11.25
      ]
    },

    constructor: function($canvas, master) {
      this.$canvas = $canvas;
      this.master = master;
      this.map = null;
      this.streetview = null;
      this.meta = null;
      this.pov = null;
      this.mode = config.display.mode;
      this.zoom = config.display.zoom;
      this.fov_table = this.SV_HFOV_TABLES[this.mode];
      this.hfov = this.fov_table[this.zoom] *1.27; // Alf
      this.vfov = null;
    },

    // PUBLIC

    // *** init()
    // should be called once when ready to set Maps API into motion
    init: function() {
      console.debug('StreetView: init');

      var self = this;

      // *** ensure success of Maps API load
      if (typeof GMaps === 'undefined') L.error('Maps API not loaded!');

      // *** initial field-of-view
      this._resize();

      // *** create a local streetview query object
      this.sv_svc = new GMaps.StreetViewService();

      // *** options for the map object
      // the map will never be seen, but we can still manipulate the experience
      // with these options.
      var mapOptions = {
        disableDefaultUI: true,
        center: new GMaps.LatLng(45,45),
        backgroundColor: "black",
        zoom: 8
      };

      // *** options for the streetview object
      var svOptions = {
        visible: true,
        disableDefaultUI: true
      };

      // *** only show links on the master display
      if (this.master && config.display.show_links) {
        svOptions.linksControl = true;
      }

      // *** init map object
      this.map = new GMaps.Map(
        this.$canvas,
        mapOptions
      );

// Alf add markers - start
/*     var latlng1 = new GMaps.LatLng(-33.61458,150.747138);
     var icon1 = 'http://eresearch.uws.edu.au/public/wonderama/HAC1.png';
     var image1 = new GMaps.Marker({ position: latlng1, map: this.map, icon: icon1 });
     var latlng2 = new GMaps.LatLng(-33.614858,150.746961);
     var icon2 = 'http://eresearch.uws.edu.au/public/wonderama/HAC2.png';
     var image2 = new GMaps.Marker({ position: latlng2, map: this.map, icon: icon2 });
     var latlng3 = new GMaps.LatLng(-33.615166,150.747757);
     var icon3 = 'http://eresearch.uws.edu.au/public/wonderama/HAC3.png';
     var image3 = new GMaps.Marker({ position: latlng3, map: this.map, icon: icon3 });
     var latlng4 = new GMaps.LatLng(-33.615413,150.747650);
     var icon4 = 'http://eresearch.uws.edu.au/public/wonderama/HAC4.png';
     var image4 = new GMaps.Marker({ position: latlng4, map: this.map, icon: icon4 });
     var latlng5 = new GMaps.LatLng(-33.615759,150.748320);
     var icon5 = 'http://eresearch.uws.edu.au/public/wonderama/HAC5.png';
     var image5 = new GMaps.Marker({ position: latlng5, map: this.map, icon: icon5 });
     var latlng6 = new GMaps.LatLng(45.437386,12.335091);
     var icon6 = 'http://137.154.151.239/images/rialto2x4.jpg';
     var image6 = new GMaps.Marker({ position: latlng6, map: this.map, icon: icon6 }); */
        //console.debug('Marker code ran');
     // Alf add markers - end

      // *** init streetview object
      this.streetview = new GMaps.StreetViewPanorama(
        this.$canvas,
        svOptions
      );  
        /*this.streetview = this.map.getStreetView(); //Alf - map.getStreet
        this.streetview.setOptions(svOptions); //Alf
        this.streetview.setVisible(true); *///Alf 


      // *** init streetview pov
      this.streetview.setPov({
        heading: 0,
        pitch: 0,
        zoom: this.zoom
      });

      // *** set the display mode as specified in global configuration
      this.streetview.setOptions({ mode: this.mode });

      // *** apply the custom streetview object to the map
      //Alf this.map.setStreetView( this.streetview );

      // *** events for master only
      if (this.master) {
        // *** handle view change events from the streetview object
        GMaps.event.addListener(this.streetview, 'pov_changed', function() {
          var pov = self.streetview.getPov();

          self._broadcastPov(pov);
          self.pov = pov;
        });

        // *** handle pano change events from the streetview object
        GMaps.event.addListener(this.streetview, 'pano_changed', function() {
          var panoid = self.streetview.getPano();

          if (panoid != self.pano) {
            self._broadcastPano(panoid);
            self.pano = panoid;
          }
        });
      }

      // *** disable <a> tags at the bottom of the canvas
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        var links = self.$canvas.getElementsByTagName("a");
        var len = links.length;
        for (var i = 0; i < len; i++) {
          links[i].style.display = 'none';
          links[i].onclick = function() {return(false);};
        }
      });

      // *** request the last known state from the server
      this.on('ready', function() {
        self.emit('refresh');
      });

      // *** wait for an idle event before reporting module readiness
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        console.debug('StreetView: ready');
        self.emit('ready');
      });

      // *** handle window resizing
      window.addEventListener('resize',  function() {
        self._resize();
      });

      // Alf add markers - start
     //var this.latlng1 = new GMaps.LatLng(-33.6154051,150.7490008);
     //var this.icon1 = 'http://acms.sl.nsw.gov.au/_DAMx/image/17/190/hood_30295h.jpg';
     //var this.image1 = new GMaps.Marker({ position: this.latlng1, map: this.map, draggable: false, icon: this.icon1 });
     // Alf add markers - end

    },

    // *** setPano(panoid)
    // switch to the provided pano, immediately
    setPano: function(panoid) {
      if (!validate.panoid(panoid)) {
        L.error('StreetView: bad panoid to setPano!');
        return;
      }

      if (panoid != this.streetview.getPano()) {
        this.pano = panoid;
        this.streetview.setPano(panoid);
      } else {
        console.warn('StreetView: ignoring redundant setPano');
      }
    },

    // *** setPov(GMaps.StreetViewPov)
    // set the view to the provided pov, immediately
    setPov: function(pov) {
      if (!validate.number(pov.heading) || !validate.number(pov.pitch)) {
        L.error('StreetView: bad pov to setPov!');
        return;
      }

      this.streetview.setPov(pov);
    },

    // *** setHdg(heading)
    // set just the heading of the POV, zero the pitch
    setHdg: function(heading) {
      if (!validate.number(heading)) {
        L.error('StreetView: bad heading to setHdg!');
        return;
      }

      this.setPov({ heading: heading, pitch: 0 });
    },

    // *** translatePov({yaw, pitch})
    // translate the view by a relative pov
    translatePov: function(abs) {
      if (!validate.number(abs.yaw) || !validate.number(abs.pitch)) {
        L.error('StreetView: bad abs to translatePov!');
        return;
      }

      var pov = this.streetview.getPov();

      pov.heading += abs.yaw / 3; // Alf slow down yaw
      pov.pitch   += abs.pitch; // Alf

      this.streetview.setPov(pov);
    },

    // *** moveForward()
    // move to the pano nearest the current heading
    moveForward: function() {
      console.log('moving forward');
      var forward = this._getForwardLink();
      if(forward) {
        this.setPano(forward.pano);
        this._broadcastPano(forward.pano);
      } else {
        console.log("can't move forward, no links!");
      }
    },

    // *** moveBackward() // start Alf
    // move to the pano nearest the current heading
    moveBackward: function() {
      console.log('moving backward');
      var backward = this._getBackwardLink();
      if(backward) {
        this.setPano(backward.pano);
        this._broadcastPano(backward.pano);
      } else {
        console.log("can't move backward, no links!");
      }
    }, // end Alf

    // PRIVATE

    // *** _resize()
    // called when the canvas size has changed
    _resize: function() {
      var screenratio = window.innerHeight / window.innerWidth;
      this.vfov = this.hfov * screenratio;
      this.emit('size_changed', {hfov: this.hfov, vfov: this.vfov});
      console.debug('StreetView: resize', this.hfov, this.vfov);
    },

    // *** _broadcastPov(GMaps.StreetViewPov)
    // report a pov change to listeners
    _broadcastPov: function(pov) {
      this.emit('pov_changed', pov);
    },

    // *** _broadcastPano(panoid)
    // report a pano change to listeners
    _broadcastPano: function(panoid) {
      this.emit('pano_changed', panoid);

      var self = this;
      sv_svc.getPanoramaById(
        panoid,
        function (data, stat) {
          if (stat == GMaps.StreetViewStatus.OK) {
            sv_svc.serializePanoData(data);
            self.emit('meta', data);
          }
        }
      );
    },

    // *** _getLinkDifference(
    //                         GMaps.StreetViewPov,
    //                         GMaps.StreetViewLink
    //                       )
    // return the difference between the current heading and the provided link
    _getLinkDifference: function(pov, link) {
      var pov_heading = pov.heading;
      var link_heading = link.heading;

      var diff = Math.abs(link_heading - pov_heading) % 360;

      return diff >= 180 ? diff - (diff - 180) * 2 : diff;
    },

    // *** _getForwardLink()
    // return the link nearest the current heading
    _getForwardLink: function() {
      var pov = this.streetview.getPov();
      var links = this.streetview.getLinks();
      var len = links.length;
      var nearest = null;
      var nearest_difference = 360;

      for(var i=0; i<len; i++) {
        var link = links[i];
        var difference = this._getLinkDifference(pov, link);
        //Alf console.log(difference, link);
        if (difference < nearest_difference) {
          nearest = link;
          nearest_difference = difference;
        }
      }

      return nearest;
    }, // start Alf

    // *** _getBackwardLink() // start Alf
    // return the link nearest the current heading
    _getBackwardLink: function() {
      var pov = this.streetview.getPov();
      var links = this.streetview.getLinks();
      var len = links.length;
      var farest = null;
      var farest_difference = 0;

      for(var i=0; i<len; i++) {
        var link = links[i];
        var difference = this._getLinkDifference(pov, link);
        // Alf console.log(difference, link);
        if (difference > farest_difference) {
          farest = link;
          farest_difference = difference;
        }
      }

      return farest;
    } // end Alf

  });

  return StreetViewModule;
});
