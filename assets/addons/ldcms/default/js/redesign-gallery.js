(function () {
    'use strict';

    var galleries = document.querySelectorAll('[data-redesign-gallery]');
    if (!galleries.length) {
        return;
    }

    var lightbox = document.createElement('div');
    lightbox.className = 'redesign-lightbox';
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', '图片浏览');
    lightbox.innerHTML = [
        '<button class="redesign-lightbox-close" type="button" aria-label="关闭图片浏览" title="关闭"><i class="fa fa-times" aria-hidden="true"></i></button>',
        '<button class="redesign-lightbox-control redesign-lightbox-prev" type="button" aria-label="上一张" title="上一张"><i class="fa fa-chevron-left" aria-hidden="true"></i></button>',
        '<figure><img alt=""/><figcaption><span class="redesign-lightbox-caption"></span><span class="redesign-lightbox-count"></span></figcaption></figure>',
        '<button class="redesign-lightbox-control redesign-lightbox-next" type="button" aria-label="下一张" title="下一张"><i class="fa fa-chevron-right" aria-hidden="true"></i></button>'
    ].join('');
    document.body.appendChild(lightbox);

    var image = lightbox.querySelector('img');
    var caption = lightbox.querySelector('.redesign-lightbox-caption');
    var count = lightbox.querySelector('.redesign-lightbox-count');
    var closeButton = lightbox.querySelector('.redesign-lightbox-close');
    var previousButton = lightbox.querySelector('.redesign-lightbox-prev');
    var nextButton = lightbox.querySelector('.redesign-lightbox-next');
    var items = [];
    var currentIndex = 0;
    var lastFocused = null;
    var touchStartX = 0;

    function render() {
        var item = items[currentIndex];
        var sourceImage = item.querySelector('img');
        image.src = item.getAttribute('data-full') || sourceImage.currentSrc || sourceImage.src;
        image.alt = sourceImage.alt || '';
        caption.textContent = item.getAttribute('data-caption') || sourceImage.alt || '';
        count.textContent = (currentIndex + 1) + ' / ' + items.length;
        previousButton.hidden = items.length < 2;
        nextButton.hidden = items.length < 2;
    }

    function show(gallery, index) {
        items = Array.prototype.slice.call(gallery.querySelectorAll('[data-gallery-item]'));
        currentIndex = index;
        lastFocused = document.activeElement;
        render();
        lightbox.hidden = false;
        document.documentElement.classList.add('redesign-lightbox-open');
        closeButton.focus();
    }

    function close() {
        lightbox.hidden = true;
        image.removeAttribute('src');
        document.documentElement.classList.remove('redesign-lightbox-open');
        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    }

    function move(step) {
        currentIndex = (currentIndex + step + items.length) % items.length;
        render();
    }

    Array.prototype.forEach.call(galleries, function (gallery) {
        var galleryItems = gallery.querySelectorAll('[data-gallery-item]');
        Array.prototype.forEach.call(galleryItems, function (item, index) {
            item.addEventListener('click', function () {
                show(gallery, index);
            });
        });
    });

    closeButton.addEventListener('click', close);
    previousButton.addEventListener('click', function () { move(-1); });
    nextButton.addEventListener('click', function () { move(1); });
    lightbox.addEventListener('click', function (event) {
        if (event.target === lightbox) {
            close();
        }
    });
    lightbox.addEventListener('touchstart', function (event) {
        touchStartX = event.changedTouches[0].clientX;
    }, {passive: true});
    lightbox.addEventListener('touchend', function (event) {
        var distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) > 45 && items.length > 1) {
            move(distance > 0 ? -1 : 1);
        }
    }, {passive: true});
    document.addEventListener('keydown', function (event) {
        if (lightbox.hidden) {
            return;
        }
        if (event.key === 'Escape') {
            close();
        } else if (event.key === 'ArrowLeft') {
            move(-1);
        } else if (event.key === 'ArrowRight') {
            move(1);
        }
    });
})();
