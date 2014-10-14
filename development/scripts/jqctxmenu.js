/*
 * jqCtxMenu - a jQuery plugin
 * 1.0-alpha
 * Copyright 2014
 * All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * Author: hAWK
 * Repository: https://github.com/hAWKdv/jqCtxMenu
 */
(function($) {
    "use strict";

    var RMB = 2,
        CTX_X_OFFSET = 2,
        CTX_Y_OFFSET = -15,
        CTX_ARROW_OFFSET = 16,
        CTX_CONTAINER = "jqctx-container",
        CTX_CLASS = "jqctx",
        CTX_SUB_CLASS = "jqctx-sub",
        CTX_ARROW_CLASS = "jqctx-arrow",
        CTX_ARROW_TW_CLASS = "tw-arrow",
        name = "name",
        action = "action",
        context = {},
        $currentContainer = $("#" + CTX_CONTAINER),
        totalCtxWidth = 0,
        initPadding = false,
        paddingXOffset,
        paddingYOffset,
        $currentMenu,
        $mainMenu,
        Queue,
        menus;

    Queue = (function() {
        function Queue() {
            this._container = [];
        }

        Queue.prototype.isEmpty = function() {
            return !this._container.length;
        };

        Queue.prototype.length = function() {
            return this._container.length;
        };

        Queue.prototype.enqueue = function(obj) {
            this._container.push(obj);
        };

        Queue.prototype.dequeue = function() {
            return this._container.shift();
        };

        return Queue;
    }());

    context.isValid = function(prop, i) {
        if (!this.options[i][prop]) {
            throw new Error(prop + " is mandatory for context menu object.");
        }
    };

    // On initialization methods

    context.bindInitialEvent = function() {
        $(document).mousedown(function() {
            $currentContainer.find("> ." + CTX_CLASS).hide();
        });
    };

    context.buildInitialContainer = function() {
        var container;

        if (!$(CTX_CONTAINER).length) {
            container = $("<div>").attr("id", CTX_CONTAINER);
            $("body").append(container);
            $currentContainer = $("#" + CTX_CONTAINER);

            this.bindInitialEvent();
        }
    };


    // Build methods

    context.buildMenu = function(init) {
        var menu = $("<ul>").addClass(CTX_CLASS),
            newMenu;

        $currentContainer.append(menu);

        if (init) {
            $mainMenu = $currentContainer.find(menu);
        } else {
            newMenu = $currentContainer.find(menu);
            newMenu.css({ "margin-left": $currentContainer.width() });

            $currentMenu = newMenu;
        }
    };

    context.buildOption = function(optContainer, optData) {
        var title = $("<span>").text(optData.name),
            icon;

        if (optData.icon) {
            icon = $("<img>").attr("src", optData.icon);
            title.prepend(icon);
        }

        if (optData.group) {
            optContainer.css("border-bottom", "none");
        }

        optContainer.append(title);
    };

    // Adds an option to the menu that is currently being built
    context.addOption = function(option, init) {
        var optContainer = $("<li>"),
            submenu;

        context.buildOption(optContainer, option);

        /*
         * Action priority:
         * 1. Custom function (a.k.a. action)
         * 2. Location
         * 3. Sub-menu
         */
        if (option.action) {
            optContainer.mousedown(option.action);
        }
        else if (option.location) {
            optContainer.mousedown(function() {
                window.location = option.location;
            });
        }
        else if (option.menu) {
            submenu = $("<div>").addClass(CTX_SUB_CLASS);
            optContainer.append(submenu);
            optContainer.addClass(CTX_ARROW_CLASS);

            menus.enqueue({
                container: optContainer.find(submenu),
                options: option.menu
            });
        }

        // Append
        if (init) {
            $mainMenu.append(optContainer);
        } else {
            $currentMenu.append(optContainer);
        }
    };

    context.loadMenu = function(init) {
        var i = 0,
            dequeuedMenu;

        // Iterates throw all of the menu options and appends them
        // Note: The name is mandatory
        for (i; i < this.options.length; i += 1) {
            this.isValid(name, i);
            this.addOption(this.options[i], init);
        }

        if (!menus.isEmpty()) {
            dequeuedMenu = menus.dequeue();

            this.options = dequeuedMenu.options;
            $currentContainer = dequeuedMenu.container;

            this.buildMenu();
            this.loadMenu();
        }
    };

    context.determineDirections = function(page) {
        var windowX = $(window).innerWidth(),
            windowY = $(window).innerHeight(),
            ctxHeight = $mainMenu.outerHeight(), // TODO: Integrate with all menus
            directions = { x: "", y: "" };

        // Calculate X
        if (totalCtxWidth + page.x <= windowX) {
            directions.x = "right";
        } else {
            directions.x = "left";
        }

        // Calculate Y
        if (ctxHeight + page.y <= windowY) {
            directions.y = "down";
        } else {
            directions.y = "up";
        }

        return directions;
    };

    // Applies new position on RMB click
    context.positionMenu = function(page) {
        var i = 0,
            mainMenu = {},
            subMenus = {},
            directions,
            current;

        directions = context.determineDirections(page);

        if (directions.x === "left") {
            mainMenu.left = (page.x + CTX_X_OFFSET) - $mainMenu.outerHeight();
        } else {
            mainMenu.left = page.x + CTX_X_OFFSET;
        }

        if (directions.y === "up") {
            mainMenu.top = (page.y) - $mainMenu.outerWidth();
        } else {
            mainMenu.top = page.y + CTX_Y_OFFSET;
        }

        $mainMenu.css({
            top: mainMenu.top,
            left: mainMenu.left
        });

//        for (i; i < menus.length; i++) {
//            current = menus[i];
//
//            if (directions.x === "left") {
//                subMenus.left = -current.obj.outerWidth() + CTX_X_OFFSET;
//            } else {
//                subMenus.left = current.xMargin - CTX_X_OFFSET;
//            }
//
//            current.obj.css({
//                marginLeft: subMenus.left - paddingXOffset,
//                marginTop: -current.yMargin + paddingYOffset
//            });
//        }
    };

    // Plugin
    $.fn.jqCtxMenu = function(options) {
        var $this = $(this),
            isInitSet = false;

        menus = new Queue();

        context.options = options;
        context.buildInitialContainer();

        context.buildMenu(true);
        context.loadMenu(true);

        // Disable the default context menu
        $this.bind("contextmenu", function() {
            return false;
        });

        $this.mousedown(function(e) {
            if(e.button === RMB) {
                context.positionMenu({ y: e.pageY, x: e.pageX });

                if (isInitSet) {
                    $mainMenu.fadeIn();
                } else {
                    $mainMenu.css("visibility", "visible");
                    isInitSet = true;
                }

                return false;
            }

            return true;
        });

        return this;
    };
}(jQuery));
