let isActive = false;
let json;
const swith = document.getElementById('swith');
const textarea = document.getElementById('textarea');
const err = document.getElementById('err');
const reload = document.getElementById('reload');

function showError(msg) {
  err.style.display = 'block';
  err.innerText = msg;
}

function closeError() {
  err.style.display = 'none';
  err.innerText = '';
}

reload.onclick = function() {
  if (isActive) {
    json = textarea.value;
    if (json) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { messageType: 'open', code: json });
      });
      closeError();
    } else {
      showError('请输入内容');
    }
  } else {
    showError('请先启用');
  }
};

swith.onclick = function() {
  isActive = !isActive;
  if (isActive) {
    json = textarea.value;
    if (json) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { messageType: 'open', code: json });
      });
      swith.classList.add('active');
      closeError();
    } else {
      isActive = !isActive;
      showError('请输入内容');
    }
  } else {
    closeError();
    swith.classList.remove('active');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { messageType: 'close' });
    });
  }
};

chrome.storage.local.get(['__ajaxProxyInfo__', '__ajaxProxyActive__'], function(value) {
  if (value.__ajaxProxyInfo__ && value.__ajaxProxyInfo__.origin) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0].url.startsWith(value.__ajaxProxyInfo__.origin)) {
        textarea.value = value.__ajaxProxyInfo__.code;
        if (value.__ajaxProxyActive__) {
          isActive = true;
          swith.classList.add('active');
        }
      }
    });
  }
});
