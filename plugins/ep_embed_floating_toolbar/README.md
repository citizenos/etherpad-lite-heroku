# ep_embed_floating_toolbar
An Etherpad Lite plugin that enables floating toolbar & messages even when embedded and the frame height is always set to fit content (using ep_resize plugin [https://github.com/tiblu/ep_resize]()).
Applies also to timeslider view.

## Usage example

In order to float the toolbars, the embedded frame needs to know about the embedding pages scroll position and the embedded frames position. ``postMessage`` ([https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage]()) is used for cross-domain communication between the parent page and the frame.

Assuming you use JQuery parent page can send the scroll positions to the child frame as follows:

```javascript
    $(window).on('scroll', function (e) {
        var $myPadFrame = $('#myPadFrame');
        var targetWindow = $myPadFrame.get(0).contentWindow;
        targetWindow.postMessage({
            name: 'ep_embed_floating_toolbar_scroll',
            data: {
                scroll: {
                    top: $(window).scrollTop(),
                    left: $(window).scrollLeft()
                },
                frameOffset: $myPadFrame.offset() // Iframe offset on the page so that we know when to start floating the toolbars
            }
        }, '*');
    });
```

When making single page webapps, don't forget to remove ``scroll`` handler when the view is destroyed.

```javascript
    $(window).off('scroll');
```

## Credits

* [CitizenOS](https://citizenos.com) for funding the development 