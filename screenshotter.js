var page = require('webpage').create(),
    system = require('system'),
    address, output, size;

if (system.args.length < 3 || system.args.length > 5) {
    console.log('Usage: screenshotter.js URL filename [zoom]');
    phantom.exit(1);
} else {
    address = system.args[1];
    output = system.args[2];
    page.viewportSize = { width: 1600, height: 1000 };
    //page.settings.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3';
    if (system.args.length > 3) {
        page.zoomFactor = system.args[3];
    }
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit();
        } else {
            window.setTimeout(function () {
                page.render(output);
                phantom.exit();
                return page.renderBase64('png');
            }, 200);
        }
    });
}