'use strict';

/* global chrome */
(async function(){
	// load html to inject for volume slider
	// TODO: make this look nicer
	const injectHtmlLocation = chrome.runtime.getURL('/inject.html');
	const volumeSliderRequest = await fetch(injectHtmlLocation);
	const volumeSlider = await volumeSliderRequest.text();

	// construct real html element from string
	const volumeElementTemplate = document.createElement('template');
	volumeElementTemplate.innerHTML = volumeSlider;

	// append to body
	const volumeDom = document.body.appendChild(volumeElementTemplate.content.firstChild); // eslint-disable-line unicorn/prefer-dom-node-append

	// cache some dom element lookups
	const rangeDom = volumeDom.querySelector('input[type=range]');
	const outputDom = volumeDom.querySelector('output');

	// default volume
	let volume = 100;
	rangeDom.value = volume;

	const updateVolume = (newVolume) => {
		volume = newVolume;
		rangeDom.value = newVolume;
		outputDom.textContent = newVolume;
		chrome.storage.sync.set({
			volume: newVolume
		}, () => {
			// we tried
		});
	};
	chrome.storage.sync.get(['volume'], function(result){
		if(!result.volume){ return; }
		updateVolume(result.volume);
	});

	// triggered on range input change. Fix all current video element volumes
	const fixAllVolumes = () => {
		const videos = [...document.querySelectorAll('video')];
		for(const video of videos){
			video.volume = volume / 100;
		}
	};

	// set volume from range and update output
	rangeDom.addEventListener("input", () => {
		updateVolume(rangeDom.value);
		fixAllVolumes();
	});

	// setup mutation observer to update all video nodes when page changes (scrolling, etc.)
	const observer = new MutationObserver((/*mutationList, observer*/) => {
		// TODO: make this more efficient. Maybe recurse through changes and find actual `video` elements?
		fixAllVolumes();
	});
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
})();
