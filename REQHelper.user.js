// ==UserScript==
// @name        REQ Progress Helper
// @version     1.0.5
// @namespace   https://github.com/llamasoft
// @supportURL  https://github.com/llamasoft/REQ-Progress-Helper
// @updateURL   https://llamasoft.github.io/REQ-Progress-Helper/REQHelper.user.js
// @include     https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/requisitions/categories/customization*
// @include     https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/requisitions/categories/loadout*
// @include     https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/requisitions/categories/powerandvehicle*
// @require     https://code.jquery.com/jquery-1.12.0.min.js
// @run-at      document-idle
// ==/UserScript==
'use strict';


var HaloItem = function (element) {
    this.id        = $(element).attr('data-id');
    this.name      = $(element).attr('data-name');
    this.desc      = $(element).attr('data-description');
    this.owned     = $(element).attr('data-have-owned').toLowerCase() == 'true';
    this.category  = $(element).attr('data-subcategory');
    this.durable   = $(element).attr('data-is-durable').toLowerCase() == 'true';
    this.rarity    = $(element).attr('data-rarity');
    this.certified = $(element).attr('data-has-certification').toLowerCase() == 'true';
};

HaloItem.prototype.unlocked = function () {
    // "Unlocked" is different for non-durable (i.e. usable) items
    // If an item is usable, then you "own" it if you've ever received one,
    //   but you haven't "unlocked" it until you're certified

    if (this.durable) {
        // If reuable (loadout, armor, emblem, ...) then ownership is unlock status
        return this.owned;

    } else {
        // If usable, certification is unlock status
        return this.certified;
    }
};


// Returns the owned and total count of all items in a category
function getProgress(category) {
    return myItems[category].reduce(
        function (curSum, curItem, i) {
            return {
                have:  (curSum.have  || 0) + (curItem.unlocked() ? 1 : 0),
                total: (curSum.total || 0) + 1
            };
        },
        {}
    );
}


// Credit: http://stackoverflow.com/a/30810322/477563
function copyToClipboard(text) {
    var textArea = document.createElement("textarea");

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top  = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width  = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border    = 'none';
    textArea.style.outline   = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';

    // Create the element and select its text
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
    } finally {
        document.body.removeChild(textArea);
    }
}


// Converts the items within a category to X/Blank for easy pasting
function buildCopyText(category) {
    return myItems[category].map(
        function (item) { return (item.unlocked() ? 'X' : ''); }
    ).join('\n') + '\n';
}


// Display a message and fade it out
function showMsg(text, duration) {
    var resetStyle = function (elem) {
        $(elem).stop().show().css('opacity', 1);
    }

    // Cancel any animations and reset to full visibility
    resetStyle('#REQHelperStatus');

    // Set the content and begin a fade out
    // On completion, reset to "Ready" message
    $('#REQHelperStatus').html(text);
    $('#REQHelperStatus').fadeOut(
        duration || 5000,
        function () { resetStyle(this); $(this).html('Ready'); }
    );
}


// Creates a copy button for a given category and adds it to the header
function buildPasteButton(category) {
    var categoryName = categoryMapping[category] || category;
    var progress = getProgress(category);

    var copyButton = $('<a/>')
        .addClass('button')
        .css('margin', '2px')
        .text(categoryName +'s ('+ progress.have +' / '+ progress.total +')')
        .click(
            function () {
                var reqProgress = buildCopyText(category);
                try {
                    copyToClipboard(reqProgress);
                    showMsg(category + ' progress copied to clipboard');

                } catch (e) {
                    showMsg('Failed to copy REQ progress to clipboard, manually copy from JavaScript console');
                    console.log(category + ' REQ progress:\n' + 'BEGIN\n' + reqProgress + 'END');
                }
            }
        )
    ;

    $('div#REQHelperBtns').append(copyButton);
}


// Things that 343i named differently than the community
// Yes, 343i forgot to give loadout weapons a category
var categoryMapping = {
    'ArmorSuit':     'Armor',
    'WeaponSkin':    'Weapon Skin',
    '':              'Loadout',
    'PowerWeapon':   'Power Weapon',
    'Equipment':     'Power Up'
};


// Gather the REQs on the current page
var myItems = {};
$('div.card button').each(
    function () {
        var curItem = new HaloItem($(this));

        // Skip any "Random" REQs
        if (curItem.name.indexOf('Random') !== -1) { return; }

        // If the item category hasn't been created yet, make it
        if ( !(curItem.category in myItems) ) {
            myItems[curItem.category] = [];
        }

        myItems[curItem.category].push(curItem);
    }
);


// Build a place to put the REQ copy buttons
$('div#REQHelperMain').remove();
$('div.req-collection').prepend(
    '<div id="REQHelperMain" class="region">'
  +   '<div id="REQHelperBtns" class="content">'
  +     '<p class="text--smallest">Use these buttons to copy your REQ progress</p>'
  +     '<hr></hr>'
  +   '</div>'
  +   '<div class="content text--smallest">'
  +     '&gt; <span id="REQHelperStatus">Ready</span>'
  +   '</div>'
  + '</div>'
);


// Add the REQ copy buttons
Object.keys(myItems).forEach(
    function (category) {
        buildPasteButton(category);
    }
);
