'use strict';

/**
 * Abstraction around homescreen.
 * @constructor
 */
function Homescreen(client) {
  this.client = client;
  this.system = client.loader.getAppClass('system');
}

Homescreen.URL = 'app://homescreen.gaiamobile.org';

Homescreen.Selectors = {
  scrollable: '#scrollable',
  apps: '#apps',
  icon: '#apps gaia-app-icon',
  uninstall: '#uninstall',
  edit: '#edit',
  cancelDownload: '#cancel-download',
  resumeDownload: '#resume-download',
  settingsDialog: '#settings'
};

Homescreen.prototype = {

  URL: Homescreen.URL,
  Selectors: Homescreen.Selectors,

  get scrollable() {
    return this.client.findElement(Homescreen.Selectors.scrollable);
  },

  get container() {
    return this.client.findElement(Homescreen.Selectors.apps);
  },

  get icons() {
    return this.client.findElements(Homescreen.Selectors.icon);
  },

  get uninstallTray() {
    return this.client.findElement(Homescreen.Selectors.uninstall);
  },

  get editTray() {
    return this.client.findElement(Homescreen.Selectors.edit);
  },

  get cancelDownloadDialog() {
    return this.client.findElement(Homescreen.Selectors.cancelDownload);
  },

  get resumeDownloadDialog() {
    return this.client.findElement(Homescreen.Selectors.resumeDownload);
  },

  get settingsDialog() {
    return this.client.findElement(Homescreen.Selectors.settingsDialog);
  },

  get settingsDialogButtons() {
    return this.client.findElements(
      Homescreen.Selectors.settingsDialog + ' button');
  },

  /**
   * Waits for the homescreen to launch and switches to the frame.
   */
  waitForLaunch: function() {
    this.client.helper.waitForElement('body');
    this.client.apps.switchToApp(Homescreen.URL);
  },

  /**
   * Fetch an icon element on the homescreen by its name.
   *
   * @param {String} name The name of the icon.
   * @return {Marionette.Element}
   */
  getIconByName: function(name, entryPoint) {
    function getName(icon) {
      return icon.shadowRoot.querySelector('#subtitle').textContent;
    }

    var icons = this.icons;
    for (var i = 0, iLen = icons.length; i < iLen; i++) {
      if (icons[i].scriptWith(getName) === name) {
        return icons[i];
      }
    }

    return null;
  },

  /**
   * Returns a homescreen icon element's text.
   *
   * @param {Marionette.Element} icon A homescreen icon element reference.
   */
  getIconText: function(icon) {
    return icon.scriptWith(function(el) {
      return el.shadowRoot.querySelector('#subtitle').textContent;
    });
  },

  /**
   * Opens the settings menu by long-pressing on the empty space at the bottom
   * of the icon grid.
   */
  openSettingsMenu: function() {
    var rect = this.scrollable.scriptWith(function(el) {
      el.scrollTop = el.scrollTopMax;
      return el.getBoundingClientRect();
    });
    var actions = this.client.loader.getActions();
    actions.press(this.scrollable, rect.width / 2, rect.height - 1).
            wait(0.5).
            release().
            perform();
  },

  /**
   * Gets a localized application name from a manifest.
   * @param {String} app to open
   * @param {String} entryPoint to open
   * @param {String} locale
   */
  localizedAppName: function(app, entryPoint, locale) {
    if (!locale) {
      locale = entryPoint;
      entryPoint = null;
    }

    var file = 'app://' + app + '.gaiamobile.org/manifest.webapp';
    // use a chrome-scoped Marionette client for the cross-domain XHR
    var chromeClient = this.client.scope({context: 'chrome'});
    var manifest = chromeClient.executeAsyncScript(function(file) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', file, true);
      xhr.onload = function(o) {
        var data = JSON.parse(xhr.response);
        marionetteScriptFinished(data);
      };
      xhr.send(null);
    }, [file]);

    var locales;
    if (entryPoint) {
      locales = manifest.entry_points[entryPoint].locales;
    } else {
      locales = manifest.locales;
    }

    if (!locales) {
      return false;
    }

    if (locale.indexOf('qps') === 0) {
      return this.client.executeScript(function(locale, name) {
        var mozL10n = window.wrappedJSObject.navigator.mozL10n;
        return mozL10n.qps[locale].translate(name);
      }, [locale, locales['en-US'].name]);
    }

    return locales[locale].name;
  },

  /**
   * Returns a localized string from a properties file.
   * @param {String} key of the string to lookup.
   */
  l10n: function(key) {
    var string = this.client.executeScript(function(key) {
      return window.wrappedJSObject.navigator.mozL10n.get(key);
    }, [key]);

    return string;
  }
};

module.exports = Homescreen;
