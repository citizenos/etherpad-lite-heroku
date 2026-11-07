# ep_resize

An Etherpad Lite plugin that sends a [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage "postMessage documentation in MDN") to embedding page when pad size changes.

## What is it good for?

For example when you want to embed the Etherpad Lite in an iframe and want the iframe size to dynamically change so that all the contents would fit.

## Install

Run in your EP installion directory:
```
npm install ep_resize
```

## Usage example

Assuming you use JQuery you can receive the EP resize event as follows:

```javascript
    $(window).on('message onmessage', function (e) {
        var msg = e.originalEvent.data;
        if (msg.name === 'ep_resize') {
            var width = msg.data.width;
            var height = msg.data.height;
            console.log('ep_resize', 'new width:', width, 'new height:', height);
        }
    });
```

When making single page webapps, don't forget to remove the message handler when the view is destroyed

```javascript
    $(window).off('message onmessage');
```


## Credits

* [CitizenOS](https://citizenos.com) for funding the development 
