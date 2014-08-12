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

define(['config'], function(config) {
  var MapStyle = [
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        { visibility: "on" } // Alf was off needed for parks, if on poi's become clickable -bad
      ]
    },
    {
      featureType: "administrative",
      elementType: "all",
      stylers: [
        { visibility: "on" } // Alf
      ]
    },
    {
      featureType: "administrative.province",
      elementType: "all",
      stylers: [
        { visibility: "on" } // Alf was on
      ]
    },
    {
      featureType: "administrative.country",
      elementType: "all",
      stylers: [
        { visibility: "on" } // Alf was on
      ]
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        { visibility: "simplified" } // Alf
      ]
    },
  ];

  return MapStyle;
});
