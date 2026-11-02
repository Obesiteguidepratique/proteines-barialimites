/* Protéines Barialimites · Service Worker · Build 5 */
"use strict";

var CACHE_NAME = "proteines-barialimites-v5";
/* Coquille minimale : les icônes sont mises en cache à la volée si présentes,
   pour ne pas faire échouer l'installation si elles ne sont pas encore déposées. */
var APP_SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE_NAME){ return caches.delete(k); }
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if(req.method !== "GET"){ return; }

  var url = new URL(req.url);

  /* Requêtes externes (Open Food Facts, CDN du scanner) : réseau, sans cache. */
  if(url.origin !== self.location.origin){ return; }

  /* Coquille de l'app : cache d'abord, réseau en secours. */
  event.respondWith(
    caches.match(req).then(function(cached){
      if(cached){ return cached; }
      return fetch(req).then(function(res){
        if(res && res.status === 200 && res.type === "basic"){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match("./index.html");
      });
    })
  );
});
