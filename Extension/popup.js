document.addEventListener('DOMContentLoaded', () => {
    const cb = document.getElementById('hide-fake-reviews');

    chrome.storage.local.get('hideFakeReviews', ({ hideFakeReviews }) => {
        cb.checked = !!hideFakeReviews;
    });

    cb.addEventListener('change', () => {
        const hide = cb.checked;
        chrome.storage.local.set({ hideFakeReviews: hide });
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]?.id != null) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleHideFakeReviews',
                    hide
                });
            }
        });
    });
});
