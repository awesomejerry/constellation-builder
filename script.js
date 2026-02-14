// Constellation Builder - Main JavaScript
class ConstellationBuilder {
    constructor() {
        this.canvas = document.getElementById('constellationCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
        this.stars = [];
        this.connections = [];
        this.mode = 'add';
        this.selectedColor = '#ffffff';
        this.currentStar = null;
        this.connectionStart = null;
        this.isDragging = false;
        this.nextStarId = 1;
        this.backgroundStars = [];
        this.selectedStars = [];
        this.highlightedStars = [];

        // Line styles
        this.selectedLineStyle = 'solid'; // solid, dashed, dotted

        // Tag filtering
        this.visibleTags = null; // null means show all, otherwise Set of visible tags

        // Selection box
        this.selectionBox = null;

        // Undo/Redo
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSize = 50;

        // Particles for effects
        this.particles = [];

        // Zoom & Pan
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        this.minZoom = 0.25;
        this.maxZoom = 4;

        // Theme
        this.isDarkMode = true;
        this.loadTheme();

        this.init();
    }

    init() {
        this.setupCanvas();
        this.generateBackgroundStars();

        // Check for shared constellation in URL first
        const loadedFromUrl = this.loadFromUrl();

        // If no URL data, load from localStorage
        if (!loadedFromUrl) {
            this.loadFromStorage();
        }

        this.bindEvents();
        this.animate();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    generateBackgroundStars() {
        this.backgroundStars = [];
        for (let i = 0; i < 100; i++) {
            this.backgroundStars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.7 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }

    loadFromStorage() {
        const saved = localStorage.getItem('constellationBuilderData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.stars = data.stars || [];
                this.connections = data.connections || [];
                this.nextStarId = data.nextStarId || 1;
                this.generateBackgroundStars();
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    saveToStorage() {
        const data = {
            stars: this.stars,
            connections: this.connections,
            nextStarId: this.nextStarId
        };
        try {
            localStorage.setItem('constellationBuilderData', JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    // Undo/Redo system
    saveState(action) {
        const state = {
            stars: JSON.parse(JSON.stringify(this.stars)),
            connections: JSON.parse(JSON.stringify(this.connections)),
            nextStarId: this.nextStarId,
            action: action
        };

        this.undoStack.push(state);
        if (this.undoStack.length > this.maxUndoSize) {
            this.undoStack.shift();
        }

        // Clear redo stack when new action is performed
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;

        const currentState = {
            stars: JSON.parse(JSON.stringify(this.stars)),
            connections: JSON.parse(JSON.stringify(this.connections)),
            nextStarId: this.nextStarId
        };

        this.redoStack.push(currentState);

        const previousState = this.undoStack.pop();
        this.stars = previousState.stars;
        this.connections = previousState.connections;
        this.nextStarId = previousState.nextStarId;

        this.saveToStorage();
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const currentState = {
            stars: JSON.parse(JSON.stringify(this.stars)),
            connections: JSON.parse(JSON.stringify(this.connections)),
            nextStarId: this.nextStarId
        };

        this.undoStack.push(currentState);

        const nextState = this.redoStack.pop();
        this.stars = nextState.stars;
        this.connections = nextState.connections;
        this.nextStarId = nextState.nextStarId;

        this.saveToStorage();
    }

    bindEvents() {
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e));
        });

        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setColor(e));
        });

        // Line style buttons
        document.querySelectorAll('.line-style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setLineStyle(e));
        });

        // Action buttons
        document.getElementById('themeToggleBtn').addEventListener('click', () => this.toggleTheme());
        document.getElementById('resetViewBtn').addEventListener('click', () => this.resetView());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('exportBtn').addEventListener('click', () => this.showExport());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareLink());
        document.getElementById('connectByTagBtn').addEventListener('click', () => this.connectByTag());
        document.getElementById('searchBtn').addEventListener('click', () => this.showSearch());
        document.getElementById('statsBtn').addEventListener('click', () => this.showStats());
        document.getElementById('importBtn').addEventListener('click', () => this.showImport());
        document.getElementById('filterTagsBtn').addEventListener('click', () => this.showTagFilter());

        // Templates
        document.getElementById('templatesBtn').addEventListener('click', () => this.showTemplates());
        document.getElementById('cancelTemplates').addEventListener('click', () => this.closeModal('templatesModal'));

        // Tag filter modal events
        document.getElementById('showAllTags').addEventListener('click', () => this.showAllTags());
        document.getElementById('closeTagFilter').addEventListener('click', () => this.closeModal('tagFilterModal'));

        // Zoom buttons
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }

        // Minimap click navigation
        if (this.minimapCanvas) {
            this.minimapCanvas.addEventListener('click', (e) => this.handleMinimapClick(e));
        }

        // Modal events
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        document.getElementById('cancelStar').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeModal('starModal');
        });

        // Description character count update
        const descTextarea = document.getElementById('starDescription');
        if (descTextarea) {
            descTextarea.addEventListener('input', () => this.updateDescriptionCharCount());
        }

        // Batch action buttons
        document.getElementById('batchDeleteBtn').addEventListener('click', () => this.batchDeleteSelected());
        document.getElementById('batchColorBtn').addEventListener('click', () => this.batchChangeColor());

        // Save star button
        const saveStarBtn = document.getElementById('saveStar');
        if (saveStarBtn) {
            saveStarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveStar();
            }, true); // Use capture phase
        }

        document.getElementById('closeHelp').addEventListener('click', () => this.closeModal('helpModal'));
        document.getElementById('cancelExport').addEventListener('click', () => this.closeModal('exportModal'));
        document.getElementById('cancelImport').addEventListener('click', () => this.closeModal('importModal'));
        document.getElementById('closeStats').addEventListener('click', () => this.closeModal('statsModal'));
        document.getElementById('confirmImport').addEventListener('click', () => this.importData());

        // Export options
        document.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.exportData(e));
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    handleCanvasClick(e) {
        const pos = this.getMousePos(e);

        if (this.mode === 'add') {
            const clickedStar = this.findStarAt(pos.x, pos.y);
            if (!clickedStar) {
                this.addStar(pos.x, pos.y);
            }
        } else if (this.mode === 'delete') {
            const clickedStar = this.findStarAt(pos.x, pos.y);
            if (clickedStar) {
                this.deleteStar(clickedStar);
            }
        } else if (this.mode === 'select') {
            const clickedStar = this.findStarAt(pos.x, pos.y);
            if (clickedStar) {
                // Toggle selection
                if (e.ctrlKey || e.metaKey) {
                    // Multi-select (Ctrl+Click)
                    if (this.selectedStars.includes(clickedStar)) {
                        this.selectedStars = this.selectedStars.filter(s => s.id !== clickedStar.id);
                    } else {
                        this.selectedStars.push(clickedStar);
                    }
                } else {
                    // Single selection
                    if (!this.selectedStars.includes(clickedStar)) {
                        this.selectedStars = [clickedStar];
                    }
                }
                this.updateBatchButtons();
            }
        }
    }

    handleCanvasDoubleClick(e) {
        const pos = this.getMousePos(e);
        const clickedStar = this.findStarAt(pos.x, pos.y);
        if (clickedStar) {
            this.editStar(clickedStar);
        }
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);

        // Check for middle mouse or space+click for panning
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            return;
        }

        if (this.mode === 'select') {
            // Selection box mode - start drag
            this.selectionBox = {
                startX: pos.x,
                startY: pos.y,
                endX: pos.x,
                endY: pos.y
            };
            this.isDragging = true;
            return;
        }

        if (this.mode === 'connect') {
            const clickedStar = this.findStarAt(pos.x, pos.y);
            if (clickedStar) {
                this.connectionStart = clickedStar;
                this.isDragging = true;
            }
        } else if (this.mode === 'move') {
            const clickedStar = this.findStarAt(pos.x, pos.y);
            if (clickedStar) {
                this.currentStar = clickedStar;
                this.isDragging = true;
            }
        }
    }

    handleMouseMove(e) {
        // Handle panning
        if (this.isPanning) {
            const dx = e.clientX - this.lastPanX;
            const dy = e.clientY - this.lastPanY;
            this.panX += dx;
            this.panY += dy;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            return;
        }

        if (!this.isDragging) return;

        const pos = this.getMousePos(e);

        if (this.mode === 'select') {
            // Update selection box
            this.selectionBox.endX = pos.x;
            this.selectionBox.endY = pos.y;
            return;
        }

        if (this.mode === 'move' && this.currentStar) {
            this.currentStar.x = pos.x;
            this.currentStar.y = pos.y;
        }
    }

    handleMouseUp(e) {
        // Stop panning
        if (this.isPanning) {
            this.isPanning = false;
            return;
        }

        if (this.mode === 'select' && this.selectionBox) {
            // Finalize selection box
            const { startX, startY, endX, endY } = this.selectionBox;
            const minX = Math.min(startX, endX);
            const maxX = Math.max(startX, endX);
            const minY = Math.min(startY, endY);
            const maxY = Math.max(startY, endY);

            // Select all stars within the box
            const newlySelected = this.stars.filter(star =>
                star.x >= minX && star.x <= maxX &&
                star.y >= minY && star.y <= maxY
            );

            if (newlySelected.length > 0) {
                this.selectedStars = newlySelected;
                this.updateBatchButtons();
            }

            this.selectionBox = null;
            this.isDragging = false;
            return;
        }

        if (this.mode === 'connect' && this.connectionStart) {
            const pos = this.getMousePos(e);
            const clickedStar = this.findStarAt(pos.x, pos.y);

            if (clickedStar && clickedStar !== this.connectionStart) {
                this.addConnection(this.connectionStart, clickedStar);
            }
        }

        if (this.mode === 'move' && this.currentStar) {
            this.saveToStorage();
        }

        this.isDragging = false;
        this.connectionStart = null;

        // Only reset currentStar if we're in move mode (dragging operation)
        // Otherwise leave it alone (e.g., when editing a star in modal)
        if (this.mode === 'move') {
            this.currentStar = null;
        }
    }

    handleKeyboard(e) {
        // Don't trigger if typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        if (e.key === 'Escape') {
            this.closeAllModals();
        } else if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            this.undo();
        } else if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            this.redo();
        } else if (e.key === ' ') {
            e.preventDefault();
            // Space to add random star (fun!)
            const x = 50 + Math.random() * (this.canvas.width - 100);
            const y = 50 + Math.random() * (this.canvas.height - 100);
            this.addStar(x, y);
        } else if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            this.showSearch();
        } else if (e.key === '1') {
            e.preventDefault();
            this.setModeByKey('add');
        } else if (e.key === '2') {
            e.preventDefault();
            this.setModeByKey('connect');
        } else if (e.key === '3') {
            e.preventDefault();
            this.setModeByKey('move');
        } else if (e.key === '4') {
            e.preventDefault();
            this.setModeByKey('delete');
        }
    }

    setModeByKey(mode) {
        // Find the tool button for this mode
        const btn = document.querySelector(`[data-mode="${mode}"]`);
        if (btn) {
            // Trigger the existing setMode method with the button
            this.setMode({ currentTarget: btn });
        }
    }

    // Zoom & Pan methods
    handleWheel(e) {
        e.preventDefault();

        // Zoom in/out
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));

        // Zoom toward mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate world coordinates before zoom
        const worldX = (mouseX - this.panX) / this.zoom;
        const worldY = (mouseY - this.panY) / this.zoom;

        // Update zoom
        this.zoom = newZoom;

        // Adjust pan to keep mouse at same world position
        this.panX = mouseX - worldX * this.zoom;
        this.panY = mouseY - worldY * this.zoom;
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Convert screen coordinates to world coordinates
        return {
            x: (e.clientX - rect.left - this.panX) / this.zoom,
            y: (e.clientY - rect.top - this.panY) / this.zoom
        };
    }

    resetView() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
    }

    zoomIn() {
        const zoomFactor = 1.25;
        const newZoom = Math.min(this.maxZoom, this.zoom * zoomFactor);

        if (newZoom === this.zoom) return; // Already at max

        // Zoom toward center of canvas
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Calculate world coordinates before zoom
        const worldX = (centerX - this.panX) / this.zoom;
        const worldY = (centerY - this.panY) / this.zoom;

        // Update zoom
        this.zoom = newZoom;

        // Adjust pan to keep center at same world position
        this.panX = centerX - worldX * this.zoom;
        this.panY = centerY - worldY * this.zoom;
    }

    zoomOut() {
        const zoomFactor = 1 / 1.25;
        const newZoom = Math.max(this.minZoom, this.zoom * zoomFactor);

        if (newZoom === this.zoom) return; // Already at min

        // Zoom toward center of canvas
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Calculate world coordinates before zoom
        const worldX = (centerX - this.panX) / this.zoom;
        const worldY = (centerY - this.panY) / this.zoom;

        // Update zoom
        this.zoom = newZoom;

        // Adjust pan to keep center at same world position
        this.panX = centerX - worldX * this.zoom;
        this.panY = centerY - worldY * this.zoom;
    }

    handleMinimapClick(e) {
        if (!this.minimapCanvas) return;

        // Get click position relative to minimap
        const rect = this.minimapCanvas.getBoundingClientRect();
        const minimapX = e.clientX - rect.left;
        const minimapY = e.clientY - rect.top;

        // Convert minimap coordinates to world coordinates
        // Minimap scale is 0.1, so divide by 0.1 (multiply by 10)
        const worldX = minimapX / 0.1;
        const worldY = minimapY / 0.1;

        // Calculate pan to center viewport on clicked location
        // We want worldX to be at center of viewport
        this.panX = (this.canvas.width / 2) - (worldX * this.zoom);
        this.panY = (this.canvas.height / 2) - (worldY * this.zoom);
    }

    findStarAt(x, y) {
        const hitRadius = 15;
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            const dx = x - star.x;
            const dy = y - star.y;
            if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
                return star;
            }
        }
        return null;
    }

    addStar(x, y) {
        const star = {
            id: this.nextStarId++,
            x,
            y,
            color: this.selectedColor,
            title: `Star ${this.nextStarId - 1}`,
            description: '',
            tags: [],
            shape: 'circle', // Default shape
            createdAt: new Date().toISOString()
        };
        this.stars.push(star);

        // Set currentStar immediately to prevent race conditions
        this.currentStar = star;

        this.saveState('add star');
        this.saveToStorage();
        this.createParticles(x, y, this.selectedColor);

        // Open editor for new star
        this.editStar(star);
    }

    deleteStar(star) {
        // Remove connections involving this star
        this.connections = this.connections.filter(
            conn => conn.from !== star.id && conn.to !== star.id
        );
        // Remove star
        this.stars = this.stars.filter(s => s.id !== star.id);

        this.saveState('delete star');
        this.saveToStorage();
    }

    addConnection(star1, star2) {
        // Check if connection already exists
        const exists = this.connections.some(
            conn => (conn.from === star1.id && conn.to === star2.id) ||
                   (conn.from === star2.id && conn.to === star1.id)
        );
        if (!exists) {
            this.connections.push({
                id: Date.now(),
                from: star1.id,
                to: star2.id,
                color: this.selectedColor,
                style: this.selectedLineStyle,
                createdAt: new Date().toISOString()
            });

            this.saveState('add connection');
            this.saveToStorage();

            // Create particles at midpoint
            const midX = (star1.x + star2.x) / 2;
            const midY = (star1.y + star2.y) / 2;
            this.createParticles(midX, midY, this.selectedColor);
        }
    }

    connectByTag() {
        // Group stars by tags
        const tagGroups = {};

        this.stars.forEach(star => {
            if (star.tags && star.tags.length > 0) {
                star.tags.forEach(tag => {
                    if (!tagGroups[tag]) {
                        tagGroups[tag] = [];
                    }
                    tagGroups[tag].push(star);
                });
            }
        });

        // Create connections between stars with same tags
        let connectionsCreated = 0;

        Object.values(tagGroups).forEach(starsWithTag => {
            if (starsWithTag.length > 1) {
                // Connect all pairs of stars with this tag
                for (let i = 0; i < starsWithTag.length; i++) {
                    for (let j = i + 1; j < starsWithTag.length; j++) {
                        this.addConnection(starsWithTag[i], starsWithTag[j]);
                        connectionsCreated++;
                    }
                }
            }
        });

        if (connectionsCreated > 0) {
            alert(`✨ Created ${connectionsCreated} connections between stars with matching tags!`);
        } else {
            alert('ℹ️ No connections created. Make sure stars have tags assigned and at least two stars share a tag.');
        }
    }

    editStar(star) {
        this.currentStar = star;

        document.getElementById('starTitle').value = star.title || '';
        document.getElementById('starDescription').value = star.description || '';
        document.getElementById('starTags').value = star.tags ? star.tags.join(', ') : '';
        document.getElementById('starShape').value = star.shape || 'circle';

        // Update character count
        this.updateDescriptionCharCount();

        this.showModal('starModal');
    }

    updateDescriptionCharCount() {
        const desc = document.getElementById('starDescription').value;
        const count = desc.length;
        const charCountEl = document.getElementById('descriptionCharCount');
        if (charCountEl) {
            charCountEl.textContent = `${count} character${count !== 1 ? 's' : ''}`;
        }
    }

    saveStar() {
        if (!this.currentStar) {
            return;
        }

        this.currentStar.title = document.getElementById('starTitle').value || 'Untitled';
        this.currentStar.description = document.getElementById('starDescription').value || '';
        this.currentStar.tags = document.getElementById('starTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        this.currentStar.shape = document.getElementById('starShape').value || 'circle';

        this.saveState('edit star');
        this.saveToStorage();
        this.closeModal('starModal');
    }

    setMode(e) {
        const btn = e.currentTarget;
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;

        // Update cursor
        const cursors = {
            add: 'crosshair',
            connect: 'alias',
            move: 'move',
            delete: 'pointer',
            select: 'cell'
        };
        this.canvas.style.cursor = cursors[this.mode] || 'crosshair';

        // Clear selection when switching modes (except select mode)
        if (this.mode !== 'select') {
            this.selectedStars = [];
            this.updateBatchButtons();
        }
    }

    setColor(e) {
        const btn = e.currentTarget;
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedColor = btn.dataset.color;
    }

    setLineStyle(e) {
        const btn = e.currentTarget;
        document.querySelectorAll('.line-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedLineStyle = btn.dataset.style;
    }

    clearAll() {
        if (confirm('Are you sure you want to delete all stars and connections?')) {
            this.saveState('clear all');
            this.stars = [];
            this.connections = [];
            this.nextStarId = 1;
            this.saveToStorage();
        }
    }

    showHelp() {
        this.showModal('helpModal');
    }

    showSearch() {
        this.showModal('searchModal');

        // Clear previous results
        this.highlightedStars = [];
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchInput').focus();

        // Add search button handler
        const searchBtn = document.getElementById('searchBtnAction');
        searchBtn.onclick = () => this.performSearch();

        // Allow Enter key to search
        const searchInput = document.getElementById('searchInput');
        searchInput.onkeyup = (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        };
    }

    performSearch() {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        if (!query) return;

        this.highlightedStars = [];
        const resultsContainer = document.getElementById('searchResults');

        // Search in titles and tags
        const matchingStars = this.stars.filter(star => {
            const titleMatch = star.title.toLowerCase().includes(query);
            const tagMatch = star.tags && star.tags.some(tag => tag.toLowerCase().includes(query));
            return titleMatch || tagMatch;
        });

        this.highlightedStars = matchingStars;

        // Display results
        if (matchingStars.length === 0) {
            resultsContainer.innerHTML = '<p style="color: #888;">No matching stars found.</p>';
        } else {
            resultsContainer.innerHTML = `
                <p style="color: #ffd700; margin-bottom: 10px;">Found ${matchingStars.length} matching star(s)</p>
                ${matchingStars.map(star => `
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                        <strong style="color: #fff;">${star.title}</strong>
                        ${star.tags && star.tags.length > 0 ? `<br><small style="color: #888;">Tags: ${star.tags.join(', ')}</small>` : ''}
                    </div>
                `).join('')}
            `;
        }
    }

    showExport() {
        this.showModal('exportModal');
    }

    exportData(e) {
        const format = e.currentTarget.dataset.format;

        if (format === 'png') {
            this.exportPNG();
        } else if (format === 'svg') {
            this.exportSVG();
        } else if (format === 'json') {
            this.exportJSON();
        }

        this.closeModal('exportModal');
    }

    exportPNG() {
        const link = document.createElement('a');
        link.download = 'constellation.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    exportSVG() {
        // Calculate bounds
        if (this.stars.length === 0) {
            alert('No stars to export!');
            return;
        }

        const padding = 50;
        const xValues = this.stars.map(s => s.x);
        const yValues = this.stars.map(s => s.y);
        const minX = Math.min(...xValues) - padding;
        const maxX = Math.max(...xValues) + padding;
        const minY = Math.min(...yValues) - padding;
        const maxY = Math.max(...yValues) + padding;

        const width = maxX - minX;
        const height = maxY - minY;

        // Start building SVG
        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" `;
        svg += `viewBox="${minX} ${minY} ${width} ${height}" `;
        svg += `width="${width}" height="${height}">\n`;

        // Add background
        const bgColor = this.isDarkMode ? '#0a0a1a' : '#f5f5f5';
        svg += `  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${bgColor}"/>\n`;

        // Add connections (draw them before stars so stars appear on top)
        this.connections.forEach(conn => {
            const star1 = this.stars.find(s => s.id === conn.from);
            const star2 = this.stars.find(s => s.id === conn.to);

            if (star1 && star2) {
                // Calculate control point for curve
                const dx = star2.x - star1.x;
                const dy = star2.y - star1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const curveIntensity = Math.min(distance * 0.15, 50);
                const midX = (star1.x + star2.x) / 2;
                const midY = (star1.y + star2.y) / 2;
                const curveDirection = (star1.id % 2 === 0) ? 1 : -1;
                const controlX = midX + (-dy / distance) * curveIntensity * curveDirection;
                const controlY = midY + (dx / distance) * curveIntensity * curveDirection;

                svg += `  <path d="M ${star1.x} ${star1.y} Q ${controlX} ${controlY} ${star2.x} ${star2.y}" `;
                svg += `stroke="${conn.color}" stroke-width="2" fill="none" opacity="0.8"/>\n`;
            }
        });

        // Add stars
        this.stars.forEach(star => {
            const shape = star.shape || 'circle';
            const glowColor = this.hexToRgba(star.color, 0.3);

            // Add glow effect
            if (shape === 'circle') {
                svg += `  <circle cx="${star.x}" cy="${star.y}" r="20" fill="${glowColor}"/>\n`;
                svg += `  <circle cx="${star.x}" cy="${star.y}" r="8" fill="${star.color}" stroke="#ffffff" stroke-width="2"/>\n`;
            } else if (shape === 'diamond') {
                const size = 18;
                const points = [
                    [star.x, star.y - size],
                    [star.x + size, star.y],
                    [star.x, star.y + size],
                    [star.x - size, star.y]
                ];
                svg += `  <polygon points="${points.map(p => p.join(',')).join(' ')}" fill="${glowColor}"/>\n`;
                svg += `  <polygon points="${points.map(p => p.join(',')).join(' ')}" `;
                svg += `fill="${star.color}" stroke="#ffffff" stroke-width="2" transform="scale(0.7) translate(${star.x * 0.43} ${star.y * 0.43})"/>\n`;
            } else if (shape === 'hexagon') {
                const size = 16;
                const points = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i / 6) - Math.PI / 2;
                    points.push([star.x + size * Math.cos(angle), star.y + size * Math.sin(angle)]);
                }
                svg += `  <polygon points="${points.map(p => p.join(',')).join(' ')}" fill="${glowColor}"/>\n`;
                svg += `  <polygon points="${points.map(p => p.join(',')).join(' ')}" `;
                svg += `fill="${star.color}" stroke="#ffffff" stroke-width="2" transform="scale(0.7) translate(${star.x * 0.43} ${star.y * 0.43})"/>\n`;
            } else if (shape === 'star') {
                const outerR = 16;
                const innerR = 6;
                const points = [];
                for (let i = 0; i < 10; i++) {
                    const radius = i % 2 === 0 ? outerR : innerR;
                    const angle = (Math.PI * i / 5) - Math.PI / 2;
                    points.push([star.x + radius * Math.cos(angle), star.y + radius * Math.sin(angle)]);
                }
                svg += `  <polygon points="${points.map(p => p.join(',')).join(' ')}" fill="${glowColor}"/>\n`;
                svg += `  <circle cx="${star.x}" cy="${star.y}" r="6" fill="${star.color}" stroke="#ffffff" stroke-width="2"/>\n`;
            }

            // Add title label
            if (star.title) {
                svg += `  <text x="${star.x}" y="${star.y + 35}" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="12" fill="#ffffff">${this.escapeSVG(star.title)}</text>\n`;
            }
        });

        svg += '</svg>';

        // Download
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = 'constellation.svg';
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    escapeSVG(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    exportJSON() {
        const data = {
            stars: this.stars,
            connections: this.connections,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = 'constellation.json';
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    showImport() {
        this.showModal('importModal');
        document.getElementById('importFile').value = '';
        document.getElementById('importMode').value = 'append';
    }

    importData() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];

        if (!file) {
            alert('⚠️ Please select a JSON file to import');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate data structure
                if (!data.stars || !Array.isArray(data.stars)) {
                    alert('❌ Invalid constellation data. Missing or invalid stars array.');
                    return;
                }

                const mode = document.getElementById('importMode').value;

                if (mode === 'replace') {
                    this.stars = data.stars;
                    this.connections = data.connections || [];
                    this.nextStarId = data.nextStarId || 1;
                } else {
                    // Append mode - merge with existing
                    this.stars = [...this.stars, ...data.stars];
                    this.connections = [...this.connections, ...(data.connections || [])];
                    // Update nextStarId to avoid collisions
                    const maxId = Math.max(...this.stars.map(s => s.id), 0);
                    this.nextStarId = maxId + 1;
                }

                this.saveToStorage();
                this.closeModal('importModal');
                alert(`✅ Successfully imported ${data.stars.length} star(s)!`);
            } catch (error) {
                alert(`❌ Failed to parse JSON: ${error.message}`);
                console.error('Import error:', error);
            }
        };

        reader.readAsText(file);
    }

    showStats() {
        // Calculate statistics
        const totalStars = this.stars.length;
        const totalConnections = this.connections.length;
        const avgConnections = totalStars > 0 ? (totalConnections / totalStars).toFixed(2) : 0;

        // Find most connected star
        const connectionCounts = {};
        this.connections.forEach(conn => {
            connectionCounts[conn.from] = (connectionCounts[conn.from] || 0) + 1;
            connectionCounts[conn.to] = (connectionCounts[conn.to] || 0) + 1;
        });

        let mostConnected = null;
        let maxConnections = 0;
        Object.entries(connectionCounts).forEach(([starId, count]) => {
            if (count > maxConnections) {
                maxConnections = count;
                mostConnected = this.stars.find(s => s.id === parseInt(starId));
            }
        });

        // Count total tags
        const allTags = {};
        this.stars.forEach(star => {
            if (star.tags) {
                star.tags.forEach(tag => {
                    allTags[tag] = (allTags[tag] || 0) + 1;
                });
            }
        });

        const totalTags = Object.keys(allTags).length;

        // Find most used tag
        let mostUsedTag = '-';
        let maxTagCount = 0;
        Object.entries(allTags).forEach(([tag, count]) => {
            if (count > maxTagCount) {
                maxTagCount = count;
                mostUsedTag = tag;
            }
        });

        // Find oldest and newest stars
        const sortedByDate = [...this.stars].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const oldestStar = sortedByDate[0];
        const newestStar = sortedByDate[sortedByDate.length - 1];

        // Update UI
        document.getElementById('statTotalStars').textContent = totalStars;
        document.getElementById('statTotalConnections').textContent = totalConnections;
        document.getElementById('statAvgConnections').textContent = avgConnections;
        document.getElementById('statMostConnected').textContent = mostConnected ? mostConnected.title : '-';
        document.getElementById('statTotalTags').textContent = totalTags;
        document.getElementById('statMostUsedTag').textContent = mostUsedTag;
        document.getElementById('statOldestStar').textContent = oldestStar ? oldestStar.title : '-';
        document.getElementById('statNewestStar').textContent = newestStar ? newestStar.title : '-';

        this.showModal('statsModal');
    }

    showTagFilter() {
        // Collect all unique tags
        const allTags = new Set();
        this.stars.forEach(star => {
            if (star.tags) {
                star.tags.forEach(tag => allTags.add(tag));
            }
        });

        if (allTags.size === 0) {
            document.getElementById('tagFilterList').innerHTML = '<p style="color: #888;">No tags found. Add tags to stars to use filtering.</p>';
            this.showModal('tagFilterModal');
            return;
        }

        // Build tag list UI
        const tagFilterList = document.getElementById('tagFilterList');
        tagFilterList.innerHTML = '';

        // Sort tags alphabetically
        const sortedTags = Array.from(allTags).sort();

        sortedTags.forEach(tag => {
            const tagEl = document.createElement('button');
            tagEl.className = 'tag-filter-item';
            tagEl.style.cssText = `
                padding: 8px 16px;
                border-radius: 20px;
                border: 2px solid var(--border-color);
                background: var(--panel-bg);
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            // Check if tag is currently hidden
            const isHidden = this.visibleTags && !this.visibleTags.has(tag);
            if (isHidden) {
                tagEl.style.opacity = '0.3';
                tagEl.style.borderColor = 'rgba(255, 100, 100, 0.5)';
            } else {
                tagEl.style.borderColor = 'var(--accent)';
            }

            tagEl.textContent = tag;
            tagEl.addEventListener('click', () => this.toggleTag(tag, tagEl));
            tagFilterList.appendChild(tagEl);
        });

        this.showModal('tagFilterModal');
    }

    toggleTag(tag, tagEl) {
        // Initialize visibleTags Set if needed
        if (!this.visibleTags) {
            // Collect all tags initially
            const allTags = new Set();
            this.stars.forEach(star => {
                if (star.tags) {
                    star.tags.forEach(t => allTags.add(t));
                }
            });
            this.visibleTags = allTags;
        }

        // Toggle the tag
        if (this.visibleTags.has(tag)) {
            this.visibleTags.delete(tag);
            tagEl.style.opacity = '0.3';
            tagEl.style.borderColor = 'rgba(255, 100, 100, 0.5)';
        } else {
            this.visibleTags.add(tag);
            tagEl.style.opacity = '1';
            tagEl.style.borderColor = 'var(--accent)';
        }
    }

    showAllTags() {
        this.visibleTags = null; // null means show all

        // Reset all tag buttons styling
        const tagButtons = document.querySelectorAll('.tag-filter-item');
        tagButtons.forEach(btn => {
            btn.style.opacity = '1';
            btn.style.borderColor = 'var(--accent)';
        });
    }

    isTagVisible(star) {
        if (!this.visibleTags) return true; // No filter applied
        if (!star.tags || star.tags.length === 0) return true; // No tags on star

        // Star is visible if ANY of its tags are visible
        return star.tags.some(tag => this.visibleTags.has(tag));
    }

    updateBatchButtons() {
        const batchDeleteBtn = document.getElementById('batchDeleteBtn');
        const batchColorBtn = document.getElementById('batchColorBtn');

        if (batchDeleteBtn) {
            batchDeleteBtn.disabled = this.selectedStars.length === 0;
        }
        if (batchColorBtn) {
            batchColorBtn.disabled = this.selectedStars.length === 0;
        }
    }

    batchDeleteSelected() {
        if (this.selectedStars.length === 0) return;

        if (confirm(`Delete ${this.selectedStars.length} selected star${this.selectedStars.length > 1 ? 's' : ''}?`)) {
            // Remove connections involving selected stars
            this.connections = this.connections.filter(conn => {
                const fromSelected = this.selectedStars.some(s => s.id === conn.from);
                const toSelected = this.selectedStars.some(s => s.id === conn.to);
                return !fromSelected || !toSelected; // Keep connection if neither end is selected
            });

            // Remove selected stars
            this.stars = this.stars.filter(star => !this.selectedStars.some(s => s.id === star.id));

            this.saveState('batch delete');
            this.saveToStorage();
            this.selectedStars = [];
            this.updateBatchButtons();
        }
    }

    batchChangeColor() {
        if (this.selectedStars.length === 0) return;

        // Simple color picker using prompt
        const colors = ['#ffffff', '#ffd700', '#00bfff', '#ff6b6b', '#98fb98', '#dda0dd'];
        const colorNames = ['White', 'Gold', 'Sky Blue', 'Coral', 'Pale Green', 'Plum Purple'];
        
        // Create a simple color picker modal-like interface
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = this.selectedStars[0].color;

        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Choose color for selected stars: ';
        colorLabel.appendChild(colorInput);

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Apply';
        confirmBtn.className = 'btn primary';
        confirmBtn.style.marginLeft = '10px';

        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--panel-bg);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid var(--border-color);
            z-index: 2000;
        `;
        container.appendChild(colorLabel);
        container.appendChild(confirmBtn);
        document.body.appendChild(container);

        confirmBtn.onclick = () => {
            this.selectedStars.forEach(star => {
                star.color = colorInput.value;
            });

            this.saveState('batch color change');
            this.saveToStorage();
            document.body.removeChild(container);
        };
    }

    drawSelectionBox() {
        if (!this.selectionBox || this.mode !== 'select') return;

        const { startX, startY, endX, endY } = this.selectionBox;
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);

        this.ctx.save();
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        this.ctx.restore();
    }

    showTemplates() {
        this.showModal('templatesModal');

        // Add event listeners to template options
        document.querySelectorAll('.template-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const template = e.currentTarget.dataset.template;
                this.applyTemplate(template);
            });
        });
    }

    applyTemplate(templateType) {
        // Clear current constellation if user confirms
        if (this.stars.length > 0) {
            if (!confirm('This will replace your current constellation. Continue?')) {
                this.closeModal('templatesModal');
                return;
            }
        }

        // Reset constellation
        this.stars = [];
        this.connections = [];
        this.nextStarId = 1;

        const centerX = 400;
        const centerY = 300;

        if (templateType === 'mindmap') {
            // Mind Map: Central idea with branches
            const colors = ['#ffd700', '#00bfff', '#ff6b6b', '#98fb98'];
            const branches = ['Project', 'Research', 'Development', 'Design', 'Marketing', 'Testing'];

            // Central star
            this.stars.push({
                id: this.nextStarId++,
                x: centerX,
                y: centerY,
                color: '#ffffff',
                title: 'Main Goal',
                description: 'Central objective',
                tags: ['goal', 'main'],
                shape: 'star',
                createdAt: new Date().toISOString()
            });

            // Branch stars
            branches.forEach((branch, index) => {
                const angle = (index / branches.length) * Math.PI * 2 - Math.PI / 2;
                const distance = 250;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;

                this.stars.push({
                    id: this.nextStarId++,
                    x, y,
                    color: colors[index % colors.length],
                    title: branch,
                    description: `Key aspect: ${branch.toLowerCase()}`,
                    tags: [branch.toLowerCase()],
                    shape: 'circle',
                    createdAt: new Date().toISOString()
                });

                // Connect to center
                this.connections.push({
                    id: Date.now(),
                    from: 1,
                    to: this.stars[this.stars.length - 1].id,
                    color: colors[index % colors.length],
                    style: this.selectedLineStyle,
                    createdAt: new Date().toISOString()
                });
            });

        } else if (templateType === 'orgchart') {
            // Org Chart: Hierarchical structure
            const levels = ['CEO', 'VP', 'Manager', 'Team', 'Member'];
            const startY = 100;
            const levelHeight = 120;
            let previousLevelStars = [];

            levels.forEach((level, levelIndex) => {
                const numStars = 1 + Math.floor(Math.random() * 3);
                const startYThisLevel = startY + levelIndex * levelHeight;
                const totalWidth = 800;

                for (let i = 0; i < numStars; i++) {
                    const x = totalWidth / (numStars + 1) * (i + 1);

                    this.stars.push({
                        id: this.nextStarId++,
                        x,
                        y: startYThisLevel,
                        color: ['#ffd700', '#00bfff', '#ff6b6b', '#98fb98', '#dda0dd'][levelIndex % 5],
                        title: `${level} ${i + 1}`,
                        description: `${level} position`,
                        tags: [level.toLowerCase()],
                        shape: ['circle', 'diamond', 'hexagon'][levelIndex % 3],
                        createdAt: new Date().toISOString()
                    });

                    // Connect to previous level
                    if (levelIndex > 0 && previousLevelStars.length > 0) {
                        const parentIndex = Math.floor(i * previousLevelStars.length / numStars);
                        const parent = previousLevelStars[parentIndex] || previousLevelStars[previousLevelStars.length - 1];

                        this.connections.push({
                            id: Date.now(),
                            from: parent.id,
                            to: this.stars[this.stars.length - 1].id,
                            color: '#ffffff',
                            style: this.selectedLineStyle,
                            createdAt: new Date().toISOString()
                        });
                    }
                }

                previousLevelStars = [...this.stars];
            });

        } else if (templateType === 'flowchart') {
            // Flowchart: Process flow
            const steps = ['Start', 'Decision', 'Process', 'Review', 'Approval', 'End'];
            const startX = 100;
            const gapX = 150;

            steps.forEach((step, index) => {
                this.stars.push({
                    id: this.nextStarId++,
                    x: startX + index * gapX,
                    y: centerY,
                    color: ['#ffd700', '#00bfff', '#ff6b6b', '#98fb98', '#dda0dd', '#ffffff'][index % 7],
                    title: step,
                    description: `Process step ${index + 1}`,
                    tags: ['process', step.toLowerCase()],
                    shape: index === 1 || index === 3 ? 'diamond' : 'circle',
                    createdAt: new Date().toISOString()
                });

                // Connect to previous step
                if (index > 0) {
                    this.connections.push({
                        id: Date.now(),
                        from: this.stars[index].id,
                        to: this.stars[index + 1].id,
                        color: '#ffffff',
                        style: this.selectedLineStyle,
                        createdAt: new Date().toISOString()
                    });
                }
            });

        } else if (templateType === 'project') {
            // Project Map: Goal-oriented
            const categories = ['Goals', 'Milestones', 'Tasks', 'Resources', 'Risks'];
            const positions = [
                {x: 200, y: 200},
                {x: 600, y: 200},
                {x: 200, y: 500},
                {x: 600, y: 500},
                {x: 400, y: 350}
            ];

            categories.forEach((category, index) => {
                const pos = positions[index];

                this.stars.push({
                    id: this.nextStarId++,
                    x: pos.x,
                    y: pos.y,
                    color: ['#ffd700', '#00bfff', '#ff6b6b', '#98fb98', '#dda0dd'][index % 5],
                    title: category,
                    description: `Project ${category.toLowerCase()}`,
                    tags: ['project', category.toLowerCase()],
                    shape: ['circle', 'diamond', 'hexagon', 'star'][index % 4],
                    createdAt: new Date().toISOString()
                });

                // Connect to center
                if (index < 4) {
                    const centerIndex = 4; // The center "Resources" star
                    this.connections.push({
                        id: Date.now(),
                        from: this.stars[index].id,
                        to: this.stars[centerIndex].id,
                        color: '#ffffff',
                        style: this.selectedLineStyle,
                        createdAt: new Date().toISOString()
                    });
                }
            });
        }

        this.saveToStorage();
        this.closeModal('templatesModal');
        alert(`✅ Applied "${templateType}" template with ${this.stars.length} stars!`);
    }

    updateMinimap() {
        if (!this.minimapCtx) return;

        const scale = 0.1; // Minimap is 10% of main canvas
        const minimapWidth = this.minimapCanvas.width;
        const minimapHeight = this.minimapCanvas.height;

        // Clear minimap
        this.minimapCtx.fillStyle = this.isDarkMode ? '#0a0a1a' : '#f5f5f5';
        this.minimapCtx.fillRect(0, 0, minimapWidth, minimapHeight);

        // Calculate viewport rectangle
        const viewportX = (-this.panX) / this.zoom;
        const viewportY = (-this.panY) / this.zoom;
        const viewportWidth = this.canvas.width / this.zoom;
        const viewportHeight = this.canvas.height / this.zoom;

        // Apply scale
        this.minimapCtx.save();
        this.minimapCtx.scale(scale, scale);

        // Draw stars on minimap
        this.stars.forEach(star => {
            // Star core
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(star.x, star.y, 3, 0, Math.PI * 2);
            this.minimapCtx.fillStyle = star.color;
            this.minimapCtx.fill();

            // Title (simplified)
            if (star.title) {
                this.minimapCtx.fillStyle = '#ffffff';
                this.minimapCtx.font = '8px sans-serif';
                this.minimapCtx.textAlign = 'center';
                this.minimapCtx.fillText(star.title.substring(0, 8), star.x, star.y - 6);
            }
        });

        // Draw connections on minimap
        this.connections.forEach(conn => {
            const star1 = this.stars.find(s => s.id === conn.from);
            const star2 = this.stars.find(s => s.id === conn.to);
            if (star1 && star2) {
                this.minimapCtx.beginPath();
                this.minimapCtx.moveTo(star1.x, star1.y);
                this.minimapCtx.lineTo(star2.x, star2.y);
                this.minimapCtx.strokeStyle = this.hexToRgba(conn.color, 0.5);
                this.minimapCtx.lineWidth = 1;
                this.minimapCtx.stroke();
            }
        });

        this.minimapCtx.restore();

        // Draw viewport rectangle
        this.minimapCtx.save();
        this.minimapCtx.scale(scale, scale);
        this.minimapCtx.strokeStyle = '#ffd700';
        this.minimapCtx.lineWidth = 2;
        this.minimapCtx.setLineDash([5, 5]);
        this.minimapCtx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
        this.minimapCtx.restore();
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        setTimeout(() => {
            document.getElementById(modalId).classList.add('visible');
        }, 10);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('visible');

        // Clear highlights when search modal closes
        if (modalId === 'searchModal') {
            this.highlightedStars = [];
        }

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        });
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    // Particle effects
    createParticles(x, y, color) {
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: color,
                size: 2 + Math.random() * 3
            });
        }
    }

    updateAndDrawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Decay
            p.life -= 0.02;
            p.size *= 0.98;

            // Remove dead particles
            if (p.life <= 0 || p.size < 0.5) {
                this.particles.splice(i, 1);
                continue;
            }

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.hexToRgba(p.color, p.life);
            this.ctx.fill();
        }
    }

    drawStarHighlight(star) {
        // Pulsing highlight ring
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.2 + 0.8;

        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, 25 * pulse, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.hexToRgba(star.color, 0.6);
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    draw() {
        // Clear canvas
        const bgColor = this.isDarkMode ? '#0a0a1a' : '#f5f5f5';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply zoom and pan
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        // Draw background stars
        this.drawBackgroundStars();

        // Draw connections
        this.drawConnections();

        // Draw connection line being created
        if (this.mode === 'connect' && this.connectionStart && this.isDragging) {
            this.drawTempConnection();
        }

        // Draw highlighted stars
        this.highlightedStars.forEach(star => {
            this.drawStarHighlight(star);
        });

        // Draw stars
        this.drawStars();

        // Draw selection box
        this.drawSelectionBox();

        // Draw particles
        this.updateAndDrawParticles();

        this.ctx.restore();

        // Draw zoom indicator
        this.drawZoomIndicator();

        // Update minimap
        if (this.minimapCtx) {
            this.updateMinimap();
        }
    }

    drawBackgroundStars() {
        const time = Date.now();

        this.backgroundStars.forEach(star => {
            const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
            this.ctx.fill();
        });
    }

    drawConnections() {
        this.connections.forEach(conn => {
            const star1 = this.stars.find(s => s.id === conn.from);
            const star2 = this.stars.find(s => s.id === conn.to);

            if (star1 && star2) {
                // Check tag visibility for both stars
                const star1Visible = this.isTagVisible(star1);
                const star2Visible = this.isTagVisible(star2);

                // Calculate opacity based on visibility
                let opacity = 1.0;
                if (!star1Visible && !star2Visible) {
                    opacity = 0.1; // Both hidden
                } else if (!star1Visible || !star2Visible) {
                    opacity = 0.3; // One hidden
                }

                // Calculate distance for curve intensity
                const dx = star2.x - star1.x;
                const dy = star2.y - star1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Create control point for curve
                // Offset perpendicular to the line
                const midX = (star1.x + star2.x) / 2;
                const midY = (star1.y + star2.y) / 2;
                const curveIntensity = Math.min(distance * 0.15, 50);

                // Use a consistent curve direction based on star IDs
                const curveDirection = (star1.id % 2 === 0) ? 1 : -1;
                const controlX = midX + (-dy / distance) * curveIntensity * curveDirection;
                const controlY = midY + (dx / distance) * curveIntensity * curveDirection;

                // Draw curved connection
                this.ctx.beginPath();
                this.ctx.moveTo(star1.x, star1.y);
                this.ctx.quadraticCurveTo(controlX, controlY, star2.x, star2.y);

                // Gradient stroke
                const gradient = this.ctx.createLinearGradient(star1.x, star1.y, star2.x, star2.y);
                gradient.addColorStop(0, this.hexToRgba(star1.color, 0.8 * opacity));
                gradient.addColorStop(0.5, this.hexToRgba(conn.color, 0.6 * opacity));
                gradient.addColorStop(1, this.hexToRgba(star2.color, 0.8 * opacity));

                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 2;

                // Apply line style
                const lineStyle = conn.style || 'solid';
                if (lineStyle === 'dashed') {
                    this.ctx.setLineDash([10, 10]);
                } else if (lineStyle === 'dotted') {
                    this.ctx.setLineDash([3, 8]);
                } else {
                    this.ctx.setLineDash([]);
                }

                this.ctx.stroke();

                // Glow effect (skip for very faded connections)
                if (opacity > 0.2) {
                    this.ctx.shadowColor = conn.color;
                    this.ctx.shadowBlur = 10;
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                }
            }
        });
    }

    drawTempConnection() {
        // This would need the current mouse position
        // Simplified for now
    }

    drawStars() {
        this.stars.forEach(star => {
            // Check tag visibility
            const isTagVisible = this.isTagVisible(star);

            // Skip drawing completely if tag is hidden (optional: make transparent instead)
            if (!isTagVisible) {
                // Draw faded version
                this.drawStar(star, 0.15); // 15% opacity
            } else {
                // Draw normally
                this.drawStar(star, 1.0);
            }
        });
    }

    drawStar(star, opacity) {
        // Glow effect
        const gradient = this.ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, 20
        );
        gradient.addColorStop(0, this.hexToRgba(star.color, 0.8 * opacity));
        gradient.addColorStop(0.5, this.hexToRgba(star.color, 0.3 * opacity));
        gradient.addColorStop(1, 'transparent');

        // Draw shape based on star.shape
        const shape = star.shape || 'circle';
        if (shape === 'circle') {
            this.drawCircle(star, gradient);
        } else if (shape === 'diamond') {
            this.drawDiamond(star, gradient);
        } else if (shape === 'hexagon') {
            this.drawHexagon(star, gradient);
        } else if (shape === 'star') {
            this.drawStarShape(star, gradient);
        }

        // Title label
        if (star.title) {
            this.ctx.font = '12px Segoe UI, sans-serif';
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(star.title, star.x, star.y + 25);
        }
    }

    drawCircle(star, gradient) {
        // Glow
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Core
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = star.color;
        this.ctx.fill();

        // Border
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawDiamond(star, gradient) {
        const size = 18;

        // Glow
        this.ctx.beginPath();
        this.ctx.moveTo(star.x, star.y - size);
        this.ctx.lineTo(star.x + size, star.y);
        this.ctx.lineTo(star.x, star.y + size);
        this.ctx.lineTo(star.x - size, star.y);
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Core
        const coreSize = 7;
        this.ctx.beginPath();
        this.ctx.moveTo(star.x, star.y - coreSize);
        this.ctx.lineTo(star.x + coreSize, star.y);
        this.ctx.lineTo(star.x, star.y + coreSize);
        this.ctx.lineTo(star.x - coreSize, star.y);
        this.ctx.closePath();
        this.ctx.fillStyle = star.color;
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawHexagon(star, gradient) {
        const size = 16;
        const sides = 6;

        // Glow
        this.ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
            const x = star.x + size * Math.cos(angle);
            const y = star.y + size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Core
        const coreSize = 7;
        this.ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
            const x = star.x + coreSize * Math.cos(angle);
            const y = star.y + coreSize * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = star.color;
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawStarShape(star, gradient) {
        const outerRadius = 16;
        const innerRadius = 6;
        const points = 5;

        // Glow
        this.ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i / points) - Math.PI / 2;
            const x = star.x + radius * Math.cos(angle);
            const y = star.y + radius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Core
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = star.color;
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawZoomIndicator() {
        const zoomText = `${Math.round(this.zoom * 100)}%`;
        this.ctx.font = '14px Segoe UI, sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';

        // Draw background pill
        const padding = 8;
        const textWidth = this.ctx.measureText(zoomText).width;
        const x = this.canvas.width - padding - textWidth;
        const y = this.canvas.height - padding;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x - padding, y - padding - 14, textWidth + padding * 2, 20);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText(zoomText, x, y);

        // Update zoom level display in header
        const zoomLevelEl = document.getElementById('zoomLevel');
        if (zoomLevelEl) {
            zoomLevelEl.textContent = zoomText;
        }
    }

    // Theme management
    loadTheme() {
        const saved = localStorage.getItem('constellationBuilderTheme');
        this.isDarkMode = saved === null ? true : saved === 'dark';
        this.applyTheme();
    }

    saveTheme() {
        localStorage.setItem('constellationBuilderTheme', this.isDarkMode ? 'dark' : 'light');
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.saveTheme();
        this.applyTheme();
    }

    applyTheme() {
        if (this.isDarkMode) {
            document.body.style.background = '#050510';
        } else {
            document.body.style.background = '#f5f5f5';
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Share functionality
    shareLink() {
        if (this.stars.length === 0) {
            alert('⚠️ No constellation to share. Add some stars first!');
            return;
        }

        // Prepare constellation data
        const data = {
            stars: this.stars,
            connections: this.connections,
            sharedAt: new Date().toISOString()
        };

        // Compress and encode to base64
        const jsonStr = JSON.stringify(data);
        const compressed = this.compressString(jsonStr);
        const encoded = btoa(compressed);

        // Generate shareable URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?constellation=${encodeURIComponent(encoded)}`;

        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('✨ Share link copied to clipboard!\n\nShare this URL to let others view your constellation.');
        }).catch((err) => {
            // Fallback - show in prompt
            prompt('Copy this share link:', shareUrl);
        });

        this.saveState('share constellation');
    }

    loadFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const constellationData = urlParams.get('constellation');

        if (constellationData) {
            try {
                // Decode and decompress
                const compressed = atob(constellationData);
                const jsonStr = this.decompressString(compressed);
                const data = JSON.parse(jsonStr);

                // Validate data
                if (!data.stars || !Array.isArray(data.stars)) {
                    console.error('Invalid constellation data in URL');
                    return false;
                }

                // Load the constellation
                this.stars = data.stars;
                this.connections = data.connections || [];
                this.nextStarId = data.nextStarId || 1;

                // Update nextStarId to avoid collisions
                if (this.stars.length > 0) {
                    const maxId = Math.max(...this.stars.map(s => s.id || 0));
                    this.nextStarId = maxId + 1;
                }

                this.saveToStorage();
                console.log('Constellation loaded from shared URL');

                // Clean URL after loading (optional - keeps URL clean)
                // window.history.replaceState({}, document.title, window.location.pathname);

                return true;
            } catch (e) {
                console.error('Error loading constellation from URL:', e);
                return false;
            }
        }
        return false;
    }

    // Simple compression using basic run-length encoding for common patterns
    compressString(str) {
        // For constellation data, we can use simple compression
        // In production, you might want to use pako or similar library
        return str;
    }

    decompressString(str) {
        return str;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ConstellationBuilder();
});
