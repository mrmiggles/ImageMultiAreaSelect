$(function() {
    var ORIGINAL_TOP = 100, ORIGINAL_LEFT = 100, ORIGINAL_WIDTH = 100, ORIGINAL_HEIGHT = 100, OFFSET = 5;

    $('.top').css({top: (ORIGINAL_TOP - OFFSET) + 'px'});
    $('.left').css({left: (ORIGINAL_LEFT - OFFSET) + 'px'});
    $('.bottom').css({top: (ORIGINAL_TOP + ORIGINAL_HEIGHT - OFFSET) + 'px'});
    $('.right').css({left: (ORIGINAL_LEFT + ORIGINAL_WIDTH - OFFSET) + 'px'});

    $('.control-element').css({height: (2 * OFFSET) + 'px', width: (2 * OFFSET) + 'px'});

    var moveMiddleControls = function(top, left, width, height) {
        ['top', 'bottom'].forEach(function(coordinate) {
            $('#' + coordinate).css({left: (left + width / 2 - OFFSET) + 'px'});
        });

        ['left', 'right'].forEach(function(coordinate) {
            $('#' + coordinate).css({top: (top + height / 2 - OFFSET) + 'px'});
        });
    };

    var resizeBox = function(top, left, width, height) {
        $('#box').css({
            top: top + 'px',
            left: left + 'px',
            width: width + 'px',
            height: height + 'px'
        });
    };

    var updateStatus = function(top, left, width, height) {
        $('#status-top').html(Math.round(top));
        $('#status-left').html(Math.round(left));
        $('#status-width').html(Math.round(width));
        $('#status-height').html(Math.round(height));
    };

    var updatePosition = function(top, left, width, height) {
        resizeBox(top, left, width, height);
        moveMiddleControls(top, left, width, height);
        updateStatus(top, left, width, height);
    };

    var update = function() {
        updatePosition(
            $('#top').position().top + OFFSET,
            $('#left').position().left + OFFSET,
            $('#right').position().left - $('#left').position().left,
            $('#bottom').position().top - $('#top').position().top
        );
    };

    update();

    var activeElement;

    $('.control-element').mousedown(function(e) {
        activeElement = this;
        e.preventDefault();
        return false;
    });

    $(document).mousemove(function(e) {
        if(activeElement !== undefined) {
            ['top', 'bottom'].forEach(function(className) {
                if($(activeElement).hasClass(className)) {
                    $('.' + className).css({top: e.pageY + 'px'});
                }
            });

            ['left', 'right'].forEach(function(className) {
                if($(activeElement).hasClass(className)) {
                    $('.' + className).css({left: e.pageX + 'px'});
                }
            });

            update();
        }
    });

    $(document).mouseup(function() {
        activeElement = undefined;
    });
});