// background.js

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['deviceId'], (result) => {
        if (!result.deviceId) {
            const newId = generateUUID();
            chrome.storage.local.set({ deviceId: newId }, () => {
                console.log('CrossDrop Device ID generated:', newId);
            });
        } else {
            console.log('CrossDrop Device ID exists:', result.deviceId);
        }
    });
});
