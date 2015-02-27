(function() {
  'use strict';

  var normalfavs = [
    'Camera',
    'Settings',
    'Phone',
    'Music',
  ];
  var minifavs = [
    'Camera',
    'Settings',
    'Phone',
    'Music',
    'Marketplace',
    'Contacts'
  ];
  var favs = [];
  var parallax = false;
  var mode = 1;
  var apps = document.getElementById('apps');
  var bottom = document.getElementById('bottom');
  var topbar = document.getElementById('topbar');
  var input = document.getElementById('input');
  var toggle = document.getElementById('toggle');
  var iconsize = 64;
  var iconMap = new WeakMap();
  var writing = false;
  var icons = [];
  var iconHash = {};
  var longpress = null;
  var canDelete = true;
  var touch_top = 0;
  const LONG_PRESS_TIMEOUT = 500;



  useMode(mode);

  function useMode(m) {

    if (m == -1) {
      if (++mode > 3) mode = 0;
    } else {
      mode = m;
    }

    switch (mode) {
      case 0:
        iconsize = 284;
        if (bottom) hide_bottom();
        toggle.innerHTML = "&nbsp;=&nbsp;";
        break;
      case 1:
        //favs for normal mode
        favs = normalfavs;

        iconsize = 64;
        bottom.style.height = "76px";
        if (bottom) show_bottom();
        toggle.innerHTML = "&nbsp;-&nbsp;";
        break;
      case 2:
        //favs in dock for miniicons
        favs = minifavs;

        iconsize = 38;
        bottom.style.height = "48px";
        if (bottom) show_bottom();
        toggle.innerHTML = "&nbsp;▦&nbsp;";
        break;
      case 3:
        if (bottom) hide_bottom();
        iconsize = 48;
        toggle.innerHTML = "&nbsp;+&nbsp;";
        break;
    }

    apps.setAttribute("class", (3 == mode) ? "grid_container" : "apps");

    updateFavs();
    updateApps();

  }


  function addFav(name) {
    if (favs.indexOf(name) != -1)
      return;

    var newfavs = favs;
    newfavs.unshift(name);
    newfavs.pop();

    favs = newfavs;
    updateFavs();
  }


  function updateWallpaper() {
    var req = navigator.mozSettings.createLock().get('wallpaper.image');
    //console.log("→ " + req);
    req.onsuccess = function onsuccess() {
      var blob = req.result['wallpaper.image'];
      var url = URL.createObjectURL(blob);
      var wallpaper = document.getElementById('wallpaper');
      wallpaper.style['background-color'] = '#101010';
      wallpaper.style.backgroundImage = "url(" + url + "), url(" + url + ")";

    };
  }

  function updateAppCache() {
    //iconMap = new WeakMap();
    icons = [];
    input.value = "";
    FxosApps.all().then(icns => {
      icons = [];
      icns.forEach(icon => {
        var min = Math.min(icns.length, 6);
        icons[icons.length] = icon;
        if (icons.length == min) {
          updateApps();
        }
      })
    }).then(foo => {
      updateFavs();
      updateApps();
    });
  }

  function updateFavs() {
    bottom.innerHTML = "";
    icons.map(function(obj) {
      favs.indexOf(obj.name) != -1 && renderFav(obj);
    });
  }

  function order_by_date(obj) {
    return obj.sort(function(a, b) {
      return a.installTime - b.installTime;
    });
  }

  function updateApps() {
    var filter = input.value;
    if (input.value.length < 1) filter = "";
    apps.innerHTML = "";

    for (var idx in order_by_date(icons)) {
      var icon = icons[idx];
      //console.log(icon);
      if (filter === "" || icon.name.toLowerCase().indexOf(filter.toLowerCase()) != -1) {
        if (3 != mode) {
          if (1 == mode) {

            //console.log(icon.app.manifest.developer.name);
            if (icon.app.manifest.developer.name == "The Gaia Team" ||
              icon.app.manifest.developer.name == "Mozilla")
              renderApp(icon);
          }
          if (2 == mode) {
            if (icon.app.manifest.developer.name != "The Gaia Team" &&
              icon.app.manifest.developer.name != "Mozilla")
              renderApp(icon);
          }

          0 == mode && renderApp(icon);

        } else {
          renderApp4Grid(icon);
        }
      }
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    input.value = "";
    writing = false;
    input.onkeyup = function() {
      var text = input.value;
      updateApps();
    };
    var odelta = 0;
    window.addEventListener("scroll", function() {

      var wh = document.body.height; // document size
      var y = document.body.scrollTop; // screen offset
      var h = document.body.clientHeight; // screen size
      //wh = 8500;
      var maxy = 1024 - h; // h-wh;

      var delta = maxy * (y / wh); //(maxy - y);
      //console.log(maxy, wh, y, h, "=", delta);
      // parallax
      if (delta != odelta) {
        document.getElementById('wallpaper').style['background-position'] = "0px -" + delta + "px";
      }

      var focused = document.activeElement;
      if (!focused || focused == document.body)
        focused = null;
      else if (document.querySelector)
        focused = document.querySelector(":focus");
      if (focused != input) {
        var y = document.body.scrollTop; // screen offset
        if (y > odelta) {
          // scrolldown
          if (y + 16 > odelta) {
            if (topbar) hide_topbar();
            if (bottom) hide_bottom();
          }
        } else {
          // scrollup
          if (y + 16 < odelta) {
            if (topbar) show_topbar();
            if (mode > 0 && mode < 3) {
              if (bottom) show_bottom();
            }
          }
        }
        odelta = y;
      }
    }, true);

    document.body.onfocus = function() {
      writing = false;
    };

    input.onfocus = function() {
      writing = true;
      hide_bottom();
      toggle.innerHTML = "&nbsp;-&nbsp;";
    };

    input.onblur = function() {
      show_bottom();
      writing = false;

      if (mode) {
        if (mode == 1) toggle.innerHTML = "&nbsp;-&nbsp;";
        if (mode == 2) toggle.innerHTML = "&nbsp;+&nbsp;";
        if (mode == 3) toggle.innerHTML = "&nbsp;▦&nbsp;";
      } else {
        toggle.innerHTML = "&nbsp;=&nbsp;";
      }
    };

    toggle.onclick = function() {
      hide_bottom();

      if (writing) { // this.innerHTML.indexOf("-") != -1) {
        writing = false;
      } else {
        useMode(-1);
      }
      document.body.focus();
    };

    try {
      //not supported prior 2.0
      var appMgr = window.navigator.mozApps.mgmt;

      appMgr.addEventListener("install", function(event) {
        setTimeout(function() {

          updateAppCache();
          useMode(mode);

        }, 2500);
      });

      appMgr.addEventListener("uninstall", function(event) {
        setTimeout(function() {

          updateAppCache();
          useMode(mode);

        }, 2500);
      });
    } catch (err) {
      alert("install/uninstall apps won't work  in < 2.0 FirefoxOS versions in this app");
    }

    navigator.mozSettings.addObserver('wallpaper.image', updateWallpaper);
    updateWallpaper();
    updateAppCache();
  }, true);



  function renderFav(icon) {
    iconHash[icon.icon] = icon;

    var o = my_div("bottom-tile");
    var DOM_a = document.createElement("a");
    DOM_a.href = "javascript:void(null);";
    var DOM_img = document.createElement("img");

    (mode === 0) ?
    DOM_img.src = icon.big_icon:
      DOM_img.src = icon.icon;

    if (1 == mode || 2 == mode)
      DOM_img.src = get_icon(icon, "48");

    DOM_img.width = iconsize;
    DOM_img.height = iconsize;
    DOM_img.className = "dockicon";

    //console.log(DOM_img);

    DOM_a.appendChild(DOM_img);
    o.appendChild(DOM_a);
    bottom.appendChild(o);
    iconMap.set(o, icon);
  }

  function renderApp(icon) {
console.log(icon);
    var o = my_div("tile");

    var DOM_a = document.createElement("a");
    DOM_a.href = "javascript:void(null);";

    var DOM_img = document.createElement("img");
    var DOM_span = document.createElement("span");


    switch (mode) {
      case 0:

        DOM_img.src = icon.big_icon;
        DOM_img.width = iconsize;
        DOM_a.appendChild(DOM_img);
        break;
      case 1:

        DOM_img.src = get_icon(icon, "64");
        DOM_img.width = iconsize;
        DOM_img.height = iconsize;

        DOM_span.appendChild(document.createTextNode(icon.name));
        DOM_span.className = "appname";

        DOM_a.appendChild(DOM_img);
        DOM_a.appendChild(DOM_span);

        break;
      case 2:

        DOM_img.src = icon.icon;
        DOM_img.width = iconsize;


        DOM_span.appendChild(document.createTextNode(icon.name));
        DOM_span.className = "appname-cute";

        DOM_a.appendChild(DOM_img);
        DOM_a.appendChild(DOM_span);


        break;
    }

    iconHash[icon.icon] = icon;
    iconMap.set(o, icon);
    o.appendChild(DOM_a);
    apps.appendChild(o);

  }

  function renderApp4Grid(icon) {

    var o = my_div("grid");
    var DOM_a = document.createElement("a");
    DOM_a.href = "javascript:void(null);";

    var DOM_img = document.createElement("img");
    DOM_img.src = icon.icon;
    DOM_img.width = iconsize;
    DOM_a.appendChild(DOM_img);
    o.appendChild(DOM_a);

    //'<a href="#"><img width="' + iconsize + 'px" height="' + iconsize + 'px" src="' + icon.icon + '"></a>';

    iconHash[icon.icon] = icon;
    iconMap.set(o, icon);
    apps.appendChild(o);

  }



  window.addEventListener('click', function(e) {
    var container = e.target;
    // var icon = iconMap.get(container);
    var icon = getIconFor(e.target);
    if (!icon) {
      container = container.parentNode.parentNode;
      icon = iconMap.get(container);
    }
    if (icon) {
      writing = false;
      document.body.focus();
      icon.launch();
      addFav(icon.name);
      input.value = "";
      updateApps();
    }
  });


  // install/uninstall

  window.addEventListener('touchstart', function(te) {
    touch_top = document.body.scrollTop; // screen offset
    if (canDelete) {
      longpress = setTimeout(function(e) {
        longpress = null;
        var icon = getIconFor(te.target);
        if (icon) {
          try {
            var appMgr = navigator.mozApps.mgmt;

            if (icon.app.removable)
              appMgr.uninstall(icon.app);
            else {
              alert(icon.app.manifest.name + " is not removable");
              return;
            }
          } catch (err) {
            alert("install/uninstall apps won't work  in < 2.0 FirefoxOS versions in this app");
          }
        }

      }, LONG_PRESS_TIMEOUT);
    }
  });
  window.addEventListener('touchmove', function(e) {
    var cur_touch_top = document.body.scrollTop; // screen offset
    if (Math.abs(cur_touch_top - touch_top)) {
      if (longpress) {
        clearTimeout(longpress);
        longpress = null;
      }
    }
  });

  window.addEventListener('touchend', function(e) {
    if (longpress) clearTimeout(longpress);
    longpress = null;
  });

  function getIconFor(target) {
    //console.log(target);
    if (target.src)
      return iconHash[target.src];
    else
      return (typeof target.childNodes[0].childNodes[0] != 'undefined' && target.childNodes[0].childNodes[0].src) ? iconHash[target.childNodes[0].childNodes[0].src] : null;
  }


  // end install/uninstall

  window.addEventListener('hashchange', function() {
    /* Home button is pressed */
    updateAppCache();
    useMode(mode);

    return false;
  });



  /*
   * auxiliary functions
   *
   */

  function show_bottom() {
    bottom.style.transition = "opacity 1s ease-in-out, visibility 1s linear";
    bottom.style.opacity = 1;
    bottom.style.visibility = 'visible';
  }

  function hide_bottom() {
    bottom.style.transition = "opacity 0.5s ease-in-out, visibility 1s linear";
    bottom.style.opacity = 0;
    bottom.style.visibility = 'hidden';
  }

  function hide_topbar() {
    topbar.style.transition = "opacity 0.5s ease-in-out, visibility 1s linear";
    topbar.style.visibility = 'hidden';
  }

  function show_topbar() {
    topbar.style.transition = "opacity 1s ease-in-out, visibility 1s linear";
    topbar.style.visibility = 'visible';
  }

  function my_div(my_class) {
    var appEl = document.createElement('div');
    appEl.className = my_class;
    return appEl;
  }


  function get_icon(icon, size) {
    var img = icon.icon;
    console.log(img);
    var dir = "dbz";
    if (icon.app.manifest.name == "Browser") img = "/img/dbz/5X843ks.gif";
    if (icon.app.manifest.name == "Clock") img = "/img/dbz/6bJpRKl.gif";
    if (icon.app.manifest.name == "FM Radio") img = "/img/dbz/8FsqnTC.gif";
    if (icon.entryPoint == "dialer") img = "/img/dbz/AkYDsI8.gif";
    if (icon.entryPoint == "contacts") img = "/img/dbz/biLPGS9.gif";
    if (icon.app.manifest.name == "Calendar") img = "/img/dbz/HaYOBDu.gif";
    if (icon.app.manifest.name == "Music") img = "/img/dbz/HNnNWm5.gif";
    if (icon.app.manifest.name == "Settings") img = "/img/dbz/kpYjPex.gif";

    if (icon.app.manifest.name == "Marketplace") img = "/img/dbz/Mp6e1TH.gif";
    if (icon.app.manifest.name == "Messages") img = "/img/dbz/Nbrgdn3.gif";
    if (icon.app.manifest.name == "Gallery") img = "/img/dbz/rj4MyPa.gif";
    if (icon.app.manifest.name == "Camera") img = "/img/dbz/SVsRITU.gif";
    if (icon.app.manifest.name == "Video") img = "/img/dbz/T8qgINH.gif";
    if (icon.app.manifest.name == "E-Mail") img = "/img/dbz/XOEwhk6.gif";
    if (icon.app.manifest.name == "Usage") img = "/img/dbz/xvti1NJ.gif";

    return img;
  }

  /*
   * end auxiliary functions
   *
   */


}());
