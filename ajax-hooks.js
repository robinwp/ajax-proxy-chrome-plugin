(function () {
  var realXhr = '__realXhr__';

  function configEvent (event, xhrProxy) {
    var e = {};
    for (var attr in event) e[attr] = event[attr];
    e.target = e.currentTarget = xhrProxy;
    return e;
  }

  function hook (proxy) {
    window[realXhr] = window[realXhr] || XMLHttpRequest;

    XMLHttpRequest = function () {
      var xhr = new window[realXhr];
      for (var attr in xhr) {
        var type = '';
        try {
          type = typeof xhr[attr];
        } catch (e) {
        }
        if (type === 'function') {
          this[attr] = hookFunction(attr);
        } else {
          Object.defineProperty(this, attr, {
            get: getterFactory(attr),
            set: setterFactory(attr),
            enumerable: true,
          });
        }
      }
      var that = this;
      xhr.getProxy = function () {
        return that;
      };
      this.xhr = xhr;
    };

    function getterFactory (attr) {
      return function () {
        var v = this.hasOwnProperty(attr + '_') ? this[attr + '_'] : this.xhr[attr];
        var attrGetterHook = (proxy[attr] || {})['getter'];
        return attrGetterHook && attrGetterHook(v, this) || v;
      };
    }

    function setterFactory (attr) {
      return function (v) {
        var xhr = this.xhr;
        var that = this;
        var hook = proxy[attr];
        if (attr.substring(0, 2) === 'on') {
          that[attr + '_'] = v;
          xhr[attr] = function (e) {
            e = configEvent(e, that);
            var ret = proxy[attr] && proxy[attr].call(that, xhr, e);
            ret || v.call(that, e);
          };
        } else {
          var attrSetterHook = (hook || {})['setter'];
          v = attrSetterHook && attrSetterHook(v, that) || v;
          this[attr + '_'] = v;
          try {
            xhr[attr] = v;
          } catch (e) {
          }
        }
      };
    }

    function hookFunction (fun) {
      return function () {
        var args = [].slice.call(arguments);
        if (proxy[fun]) {
          args = proxy[fun].call(this, args, this.xhr) || args;
        }
        return this.xhr[fun].apply(this.xhr, args);
      };
    }

    return window[realXhr];
  }

  function unHook () {
    if (window[realXhr]) XMLHttpRequest = window[realXhr];
    window[realXhr] = undefined;
  }

  window.ajaxProxyUnHook = unHook;
  window.ajaxProxyHook = hook;
})();
