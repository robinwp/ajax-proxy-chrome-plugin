setTimeout(() => {
  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', chrome.extension.getURL('ajax-hooks.js'));
  document.head.appendChild(script);
  const isActive = localStorage.getItem('__ajaxProxyActive__');

  function autoRun(isActive) {
    if (isActive) {
      const code = localStorage.getItem('__ajaxProxyCode__');
      const autoRun = document.createElement('script');
      autoRun.setAttribute('type', 'text/javascript');
      autoRun.innerHTML = `
      try {
        ajaxProxyHook(${ code });
      } catch (e) {
         alert('ajax proxy执行出错，请检查。错误原因：' + e);
      }
  `;
      document.head.appendChild(autoRun);
      setTimeout(() => {
        document.head.removeChild(autoRun);
      });
    }
  }

  script.onload = function() {
    document.head.removeChild(script);
    autoRun(isActive === '1');
    chrome.runtime.onMessage.addListener(
      function(request) {
        if (request.messageType === 'close') {
          const unHooks = document.createElement('script');
          unHooks.setAttribute('type', 'text/javascript');
          unHooks.innerHTML = `
            ajaxProxyUnHook();
            localStorage.setItem('__ajaxProxyActive__', '0');
          `;
          document.body.appendChild(unHooks);
          setTimeout(() => {
            document.body.removeChild(unHooks);
          });
          chrome.storage.local.set({
            '__ajaxProxyActive__': false,
          });
        } else if (request.messageType === 'open') {
          const hooks = document.createElement('script');
          hooks.setAttribute('type', 'text/javascript');
          hooks.innerHTML = `
            ajaxProxyUnHook();
            localStorage.setItem('__ajaxProxyCode__', ${ JSON.stringify(request.code) });
            localStorage.setItem('__ajaxProxyActive__', '1');
            try {
              ajaxProxyHook(${ request.code });
            } catch(e) {
              alert('ajax proxy执行出错，请检查。错误原因：' + e);
            }
          `;
          chrome.storage.local.set({
            '__ajaxProxyActive__': true,
            '__ajaxProxyInfo__': {
              code: request.code,
              origin: location.origin,
            },
          });
          document.body.appendChild(hooks);
          setTimeout(() => {
            document.body.removeChild(hooks);
          });
        }
      });
  };
});
