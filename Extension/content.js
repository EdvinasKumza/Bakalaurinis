(() => {
    function cleanText(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.innerText.trim();
    }

    async function getPrediction(reviewText) {
        try {
            const cleanedText = cleanText(reviewText);

            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: cleanedText }),
            });
            const data = await response.json(); 
            return data.prediction; 
        } catch (error) {
            console.error('Error fetching prediction:', error);
            return 'FAKE';  
        }
    }

    const siteConfigs = {
        'amazon': {
            reviewSelector: '[data-hook="review"]',
            textSelectors: [
                '.a-size-base.review-text.review-text-content',
                '.a-expander-content.reviewText.review-text-content'
            ],
            badgeParentSelector: '.a-row.a-spacing-mini'
        },
        'yelp': {
            reviewSelector: [
                'div[class*="review__"]',
                'li[class*="review-item__"]',
                'div[data-review-id]',
                'section[aria-label*="Reviews"] ul > li',
                'div[class*="result-container"] ul[class*="list__09f24__"] > li[class*="list-item"]'
            ].join(','),
            textSelectors: [
                'span[class*="raw__"]',
                'p[class*="comment__"] span',
                'div[class*="comment__"]',
                'span[lang="en"]'
            ],
            badgeParentSelector: [
                'div[class*="user-passport-info"]',
                'div[class*="arrange-unit__"]',
                'div[class*="ypassport__"]',
                'div[class*="media-story__"]',
                'div[class*="margin-b1-5__"]',
                'div[class*="photo-header"]',
                'div[class*="review-header"]'
            ].join(',')
        }
    };

    function getCurrentSiteConfig() {
        const hostname = window.location.hostname;
        if (hostname.includes('amazon')) { 
            return siteConfigs.amazon;
        } else if (hostname.includes('yelp')) { 
            return siteConfigs.yelp;
        }
        return null;
    }

    async function processReview(reviewElement, config) {
        if (reviewElement.dataset.fakeFlagged) return;
        reviewElement.dataset.fakeFlagged = 'true';

        let reviewTextElement = null;
        for (const selector of config.textSelectors) {
            reviewTextElement = reviewElement.querySelector(selector);
            if (reviewTextElement) {
                break;
            }
        }

        if (!reviewTextElement) {
            if (window.location.hostname.includes('yelp')) {
                reviewTextElement = reviewElement.querySelector('p span') || reviewElement.querySelector('p');
            }
        }
        
        if (reviewTextElement) {
            const reviewText = reviewTextElement.innerText;
            if (!reviewText || reviewText.trim().length < 10) { 
                reviewElement.dataset.fakeFlagged = 'false'; 
                return;
            }
            const label = await getPrediction(reviewText);

            reviewElement.dataset.fakeLabel = label;

            const badge = document.createElement('span');
            badge.textContent = ` ${label === 'REAL' ? 'Tikras' : 'Netikras'}`;
            Object.assign(badge.style, {
                marginLeft: '8px',
                padding: '2px 6px',
                backgroundColor: label === 'REAL' ? '#008000' : '#FF0000',
                color: '#FFFFFF',
                borderRadius: '3px',
                fontSize: '0.9em',
                fontWeight: 'bold',
                zIndex: '9999'
            });

            let badgeParent = null;
            const parentSelectors = Array.isArray(config.badgeParentSelector) ? config.badgeParentSelector : config.badgeParentSelector.split(',');
            for (const selector of parentSelectors) {
                badgeParent = reviewElement.querySelector(selector.trim());
                if (badgeParent) {
                    break;
                }
            }
            
            if (!badgeParent) {
                if (window.location.hostname.includes('yelp')) {
                    badgeParent = reviewElement.querySelector('div[class*="arrange_unit"] > div[class*="media-story"]') || 
                                  reviewElement.querySelector('div[class*="user-info"]') || 
                                  reviewElement.querySelector('header') || 
                                  reviewElement.children[0]; 
                }
            }
            
            if (!badgeParent) {
                badgeParent = reviewElement; 
            }
            
            if (badgeParent && typeof badgeParent.appendChild === 'function') {
                if (!badgeParent.querySelector('span[data-fakereview-badge]')) {
                    badge.dataset.fakereviewBadge = 'true'; 
                    badgeParent.appendChild(badge);
                }
            } else {
                if (reviewElement && typeof reviewElement.appendChild === 'function' && !reviewElement.querySelector('span[data-fakereview-badge]')) {
                     badge.dataset.fakereviewBadge = 'true';
                     reviewElement.appendChild(badge);
                }
            }
        } else {
            reviewElement.dataset.fakeFlagged = 'false'; 
        }
    }

    async function flagAllReviews() {
        const config = getCurrentSiteConfig();
        if (!config) {
            return;
        }
        
        const reviewElements = document.querySelectorAll(config.reviewSelector);
        
        reviewElements.forEach(review => {
            processReview(review, config);
        });
    }

    function applyHideSetting(hide) {
        const config = getCurrentSiteConfig();
        if (!config || !config.reviewSelector) {
            return;
        }

        document.querySelectorAll(config.reviewSelector).forEach((review) => {
            if (review.dataset.fakeFlagged && review.dataset.fakeLabel === 'FAKE') {
                review.style.display = hide ? 'none' : '';
            }
        });
    }

    chrome.storage.local.get('hideFakeReviews', ({ hideFakeReviews }) => {
        applyHideSetting(!!hideFakeReviews);
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'toggleHideFakeReviews') {
            applyHideSetting(msg.hide);
        }
    });
    flagAllReviews();

    const observer = new MutationObserver((mutationsList, observerInstance) => {
        setTimeout(() => flagAllReviews(), 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
