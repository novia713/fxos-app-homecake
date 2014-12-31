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
    var iconsize = 64;
    var iconMap = new WeakMap();
    var writing = false;
    var icons = [];
    var iconHash = {};
    var longpress = null;
    var canDelete = true;
    var touch_top = 0;
    const LONG_PRESS_TIMEOUT = 1000;



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

                iconsize = 32;
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

        updateApps();
        updateFavs();
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
        icons.map(function(obj){
            if (favs.indexOf(obj.name) != -1)
                renderFav(obj);
        });
    }

    function order_by_date(obj) {
        return obj.sort( function(a, b){
          return b.installTime - a.installTime;
        });
    }

    function updateApps() {
        var filter = input.value;
        if (input.value.length < 1) filter = "";
        apps.innerHTML = "";

        for (var idx in order_by_date(icons)) {
            var icon = icons[idx];
            console.log(icon);
            if (filter === "" || icon.name.toLowerCase().indexOf(filter.toLowerCase()) != -1) {
                if  (3 != mode) {
                    if (1 == mode) {
//console.log(icon.app.manifest.name);
                        if (icon.app.manifest.developer.name == "The Gaia Team" ||
                            icon.app.manifest.developer.name == "Mozilla")
                                renderApp(icon);
                    }
                    if (2 == mode) {
                        if (icon.app.manifest.developer.name != "The Gaia Team" &&
                            icon.app.manifest.developer.name != "Mozilla")
                                renderApp(icon);
                    }
                    if (0 == mode) {
                        renderApp(icon);
                    }

                }else{
                    renderApp4Grid(icon);
                }
            }
        }
    }

    window.addEventListener("DOMContentLoaded", () => {
        apps = document.getElementById('apps');
        bottom = document.getElementById('bottom');
        topbar = document.getElementById('topbar');
        input = document.getElementById('input');
        toggle = document.getElementById('toggle');
        input.value = "";
        writing = false;
        input.onkeyup = function() {
            var text = input.value;
            updateApps();
        };
        var odelta = 0;
        window.addEventListener("scroll", function() {
            if (parallax) {
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

            appMgr.addEventListener("install", function (event) {
                setTimeout (function() {

                    updateAppCache();
                    useMode(mode);
                }, 2500);
            });

            appMgr.addEventListener("uninstall", function (event) {
                setTimeout (function() {

                    updateAppCache();
                    useMode(mode);
                }, 2500);
            });
            }
        catch(err) {
            alert("install/uninstall apps won't work  in < 2.0 FirefoxOS versions in this app");
        }

        navigator.mozSettings.addObserver('wallpaper.image', updateWallpaper);
        updateWallpaper();
        updateAppCache();
    }, true);



    function renderFav(icon) {
        iconHash[icon.icon] = icon;
        //var icon48 = icon.icon.replace(/\d{3}/,"128");
        console.log(icon.icon);

        var img = icon.icon;
            if  (icon.app.manifest.name == "Browser")  img = "/img/adventure-time/48/finn.48.png";
            if  (icon.app.manifest.name == "Clock")    img = "/img/adventure-time/48/pija.48.png";
            if  (icon.app.manifest.name == "FM Radio") img = "/img/adventure-time/48/reyhelado.48.png";
            if  (icon.entryPoint == "dialer")    img = "/img/adventure-time/48/jake.48.png";
            if  (icon.entryPoint == "contacts")  img = "/img/adventure-time/48/gunter.48.png";
            if  (icon.app.manifest.name == "Calendar") img = "/img/adventure-time/48/chicle.48.png";
            if  (icon.app.manifest.name == "Music")    img = "/img/adventure-time/48/caracol.48.png";
            if  (icon.app.manifest.name == "Settings") img = "/img/adventure-time/48/bmo.48.png";

            if  (icon.app.manifest.name == "Marketplace") img = "/img/adventure-time/48/ganso.48.png";
            if  (icon.app.manifest.name == "Messages")    img = "/img/adventure-time/48/cuber.48.png";
            if  (icon.app.manifest.name == "Gallery")     img = "/img/adventure-time/48/hudson.48.png";
            if  (icon.app.manifest.name == "Camera")      img = "/img/adventure-time/48/llama.48.png";
            if  (icon.app.manifest.name == "Video")    img = "/img/adventure-time/48/fiona.48.png";
            if  (icon.app.manifest.name == "E-Mail")     img = "/img/adventure-time/48/billy.48.png";
            if  (icon.app.manifest.name == "Usage")      img = "/img/adventure-time/48/cake.48.png";

        var o = my_div("bottom-tile");
        // only modes 1 & 2 have bottom icons
        if (2 == mode)
            o.innerHTML = '<a href="#"><img class="dockicon" width="32px" height="32px" src="' + img + '"></a>';
        if (1 == mode)
            o.innerHTML = '<a href="#"><img class="dockicon" width="48px" height="48px" src="' + img + '"></a>';

        iconMap.set(o, icon);
        bottom.appendChild(o);
    }

    function renderApp(icon) {
        var img = icon.icon;

        if (1 == mode) {
            if  (icon.app.manifest.name == "Browser")  img = "/img/adventure-time/64/finn.64.png";
            if  (icon.app.manifest.name == "Clock")    img = "/img/adventure-time/64/pija.64.png";
            if  (icon.app.manifest.name == "FM Radio") img = "/img/adventure-time/64/reyhelado.64.png";
            if  (icon.entryPoint == "dialer")    img = "/img/adventure-time/64/jake.64.png";
            if  (icon.entryPoint == "contacts")  img = "/img/adventure-time/64/gunter.64.png";
            if  (icon.app.manifest.name == "Calendar") img = "/img/adventure-time/64/chicle.64.png";
            if  (icon.app.manifest.name == "Music")    img = "/img/adventure-time/64/caracol.64.png";
            if  (icon.app.manifest.name == "Settings") img = "/img/adventure-time/64/bmo.64.png";

            if  (icon.app.manifest.name == "Marketplace") img = "/img/adventure-time/64/ganso.64.png";
            if  (icon.app.manifest.name == "Messages")    img = "/img/adventure-time/64/cuber.64.png";
            if  (icon.app.manifest.name == "Gallery")     img = "/img/adventure-time/64/hudson.64.png";
            if  (icon.app.manifest.name == "Camera")      img = "/img/adventure-time/64/llama.64.png";
            if  (icon.app.manifest.name == "Video")       img = "/img/adventure-time/64/fiona.64.png";
            if  (icon.app.manifest.name == "E-Mail")      img = "/img/adventure-time/64/billy.64.png";
            if  (icon.app.manifest.name == "Usage")       img = "/img/adventure-time/64/cake.64.png";

        }


        var o = my_div("tile");
//console.log(icon.icon);
        o.innerHTML = '<a href="#"><img width="' + iconsize + 'px" height="' + iconsize +  'px" src="' + img + '">';

        switch (mode) {
            case 0:
                o.innerHTML += '&nbsp;&nbsp;</a><br />';
                break;
            case 1:
                o.innerHTML += '&nbsp;&nbsp;<span class="appname">' + icon.name + '</span></a><br />';
                break;
            case 2:
                o.innerHTML += '&nbsp;&nbsp;<span class="cute appname-cute">' + icon.name + '</span></a><br />';
                break;
        }

        iconHash[icon.icon] = icon;
        iconMap.set(o, icon);
        apps.appendChild(o);

    }

    function renderApp4Grid(icon) {

        var o = my_div("grid");

        o.innerHTML = '<a href="#"><img width="' + iconsize + 'px" height="' + iconsize +
            'px" src="' + icon.icon + '"></a>';

        iconHash[icon.icon] = icon;
        iconMap.set(o, icon);
        apps.appendChild(o);

    }



    window.addEventListener('click', function(e) {
        var container = e.target;
        var icon = iconMap.get(container);
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
            longpress = setTimeout (function(e) {
                longpress = null;
                var icon = getIconFor (te.target);
                //console.log(icon.app);
                var appMgr = navigator.mozApps.mgmt;

                if (icon.app.removable)
                    appMgr.uninstall(icon.app);
                else{
                    alert(icon.app.manifest.name + " is not removable");
                    return;
                }

            }, LONG_PRESS_TIMEOUT);
        }
    });
    window.addEventListener('touchmove', function(e) {
        var cur_touch_top = document.body.scrollTop; // screen offset
        if (Math.abs (cur_touch_top-touch_top)) {
            if (longpress) {
                clearTimeout (longpress);
                longpress = null;
            }
        }
    });

    window.addEventListener('touchend', function(e) {
        if (longpress) clearTimeout (longpress);
        longpress = null;
    });

    function getIconFor (target) {
        if (target.src)
            return iconHash[target.src];
        else
            return (target.childNodes[0].childNodes[0].src)? iconHash[target.childNodes[0].childNodes[0].src] : null;
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
        bottom.style.visibility = 'visible';
    }

    function hide_bottom() {
        bottom.style.visibility = 'hidden';
    }

    function hide_topbar() {
        topbar.style.visibility = 'hidden';
    }

    function show_topbar() {
        topbar.style.visibility = 'visible';
    }

    function my_div(my_class) {
        var appEl = document.createElement('div');
        appEl.className = my_class;
        return appEl;
    }

    function disableScrolling(){
        var x=window.scrollX;
        var y=window.scrollY;
        window.onscroll=function(){window.scrollTo(x, y);};
    }

    /*
     * end auxiliary functions
     *
     */


}());
