function setupExpandButton() {
    if (selectedImageContainer.style.width === '45%') {
        expandButton.textContent = 'Collapse';
    } else {
        expandButton.textContent = 'Expand';
    }
    document.getElementById('expandButton').addEventListener('click', function() {
        const selectedImageContainer = document.getElementById('selectedImageContainer');
        const galleryContainer = document.getElementById('galleryContainer');
        const expandButton = document.getElementById('expandButton');
    
        if (selectedImageContainer.style.width === '45%') {
            selectedImageContainer.style.width = '25%';
            galleryContainer.style.width = '75%';
            expandButton.textContent = 'Expand';
        } else {
            selectedImageContainer.style.width = '45%';
            galleryContainer.style.width = '55%';
            expandButton.textContent = 'Collapse';
        }
    });
}
setupExpandButton();
function setupFocusButton() {
    // Set up focus button functionality
    const focusButton = document.getElementById('focusButton');

    let focusScale = 1;
    const focusMinScale = 0.5;
    const focusMaxScale = 4;
    let isFocusDragging = false;
    let focusStartX, focusStartY, focusInitialX, focusInitialY;

    focusButton.addEventListener('click', function() {
        const focusContainer = document.getElementById('focusContainer');
        const focusedImage = document.getElementById('focusedImage');
        const selectedImage = document.getElementById('selectedImage');
        focusedImage.src = selectedImage.src;
        focusedImage.draggable = false;
        focusContainer.classList.remove('hidden');
        focusScale = 1;
        focusedImage.style.transform = `scale(${focusScale})`;
        focusedImage.style.top = '';
        focusedImage.style.left = '';
    });
    
    // Handle closing the focus container
    document.getElementById('closeFocusButton').addEventListener('click', function() {
        const focusContainer = document.getElementById('focusContainer');
        focusContainer.classList.add('hidden');
    });

    // Add zoom and drag functionality to the focused image
    const focusedImage = document.getElementById('focusedImage');

    focusedImage.addEventListener('wheel', function(event) {
        event.preventDefault();
        const scaleAmount = Math.exp(event.deltaY * -0.001); // Less sensitive zoom
        focusScale = Math.min(focusMaxScale, Math.max(focusMinScale, focusScale * scaleAmount));
        focusedImage.style.transform = `scale(${focusScale})`;
    });

    focusedImage.addEventListener('mousedown', function(event) {
        isFocusDragging = true;
        focusStartX = event.clientX;
        focusStartY = event.clientY;
        focusInitialX = focusedImage.offsetLeft;
        focusInitialY = focusedImage.offsetTop;
        focusedImage.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onFocusMouseMove);
        document.addEventListener('mouseup', onFocusMouseUp);
    });

    function onFocusMouseMove(event) {
        if (isFocusDragging) {
            const dx = event.clientX - focusStartX;
            const dy = event.clientY - focusStartY;
            focusedImage.style.left = `${focusInitialX + dx}px`;
            focusedImage.style.top = `${focusInitialY + dy}px`;
        }
    }

    function onFocusMouseUp() {
        isFocusDragging = false;
        focusedImage.style.cursor = 'grab';
        document.removeEventListener('mousemove', onFocusMouseMove);
        document.removeEventListener('mouseup', onFocusMouseUp);
    }
}
setupFocusButton();

function displaySelectedImage(src, name) {
    const selectedImageContainer = document.getElementById('selectedImageContainer');
    const images = selectedImageContainer.querySelectorAll('img');
    images.forEach(img => img.remove());

    const img = document.createElement('img');
    img.id = 'selectedImage';
    img.src = src;
    img.draggable = false; // Disable default drag behavior
    selectedImageContainer.appendChild(img);

    // Set the info button data attribute
    const infoButton = document.getElementById('infoButton');
    infoButton.setAttribute('data-info', name);

    let scale = 1;
    const minScale = 0.5;
    const maxScale = 4;
    let isDragging = false;
    let startX, startY, initialX, initialY;

    selectedImageContainer.addEventListener('wheel', function(event) {
        event.preventDefault();
        scale *= Math.exp(event.deltaY * -0.001); // Less sensitive zoom
        scale = Math.min(maxScale, Math.max(minScale, scale));
        img.style.transform = `scale(${scale})`;
    });

    img.addEventListener('mousedown', function(event) {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        initialX = img.offsetLeft;
        initialY = img.offsetTop;
        img.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(event) {
        if (isDragging) {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            img.style.left = `${initialX + dx}px`;
            img.style.top = `${initialY + dy}px`;
        }
    }

    function onMouseUp() {
        isDragging = false;
        img.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}
