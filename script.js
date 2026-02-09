// Constellation Builder - Main JavaScript
class ConstellationBuilder {
    constructor() {
        this.canvas = document.getElementById('constellationCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.connections = [];
        this.mode = 'add';
        this.selectedColor = '#ffffff';
        this.currentStar = null;
        this.connectionStart = null;
        this.isDragging = false;
        this.nextStarId = 1;
        this.backgroundStars = [];

        this.init();
    }

    init() {
        this.setupCanvas();
        this.generateBackgroundStars();
        this.loadFromStorage();
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
        localStorage.setItem('constellationBuilderData', JSON.stringify(data));
    }

    bindEvents() {
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e));
        });

        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setColor(e));
        });

        // Action buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('exportBtn').addEventListener('click', () => this.showExport());

        // Modal events
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        document.getElementById('cancelStar').addEventListener('click', () => this.closeModal('starModal'));
        document.getElementById('saveStar').addEventListener('click', () => this.saveStar());
        document.getElementById('closeHelp').addEventListener('click', () => this.closeModal('helpModal'));
        document.getElementById('cancelExport').addEventListener('click', () => this.closeModal('exportModal'));

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
        if (!this.isDragging) return;

        const pos = this.getMousePos(e);

        if (this.mode === 'move' && this.currentStar) {
            this.currentStar.x = pos.x;
            this.currentStar.y = pos.y;
        }
    }

    handleMouseUp(e) {
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
        this.currentStar = null;
    }

    handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
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
            createdAt: new Date().toISOString()
        };
        this.stars.push(star);
        this.saveToStorage();

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
                createdAt: new Date().toISOString()
            });
            this.saveToStorage();
        }
    }

    editStar(star) {
        this.currentStar = star;

        document.getElementById('starTitle').value = star.title || '';
        document.getElementById('starDescription').value = star.description || '';
        document.getElementById('starTags').value = star.tags ? star.tags.join(', ') : '';

        this.showModal('starModal');
    }

    saveStar() {
        if (!this.currentStar) return;

        this.currentStar.title = document.getElementById('starTitle').value;
        this.currentStar.description = document.getElementById('starDescription').value;
        this.currentStar.tags = document.getElementById('starTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);

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
            delete: 'pointer'
        };
        this.canvas.style.cursor = cursors[this.mode] || 'crosshair';
    }

    setColor(e) {
        const btn = e.currentTarget;
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedColor = btn.dataset.color;
    }

    clearAll() {
        if (confirm('Are you sure you want to delete all stars and connections?')) {
            this.stars = [];
            this.connections = [];
            this.nextStarId = 1;
            this.saveToStorage();
        }
    }

    showHelp() {
        this.showModal('helpModal');
    }

    showExport() {
        this.showModal('exportModal');
    }

    exportData(e) {
        const format = e.currentTarget.dataset.format;

        if (format === 'png') {
            this.exportPNG();
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

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        setTimeout(() => {
            document.getElementById(modalId).classList.add('visible');
        }, 10);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('visible');
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

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background stars
        this.drawBackgroundStars();

        // Draw connections
        this.drawConnections();

        // Draw connection line being created
        if (this.mode === 'connect' && this.connectionStart && this.isDragging) {
            this.drawTempConnection();
        }

        // Draw stars
        this.drawStars();
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
                this.ctx.beginPath();
                this.ctx.moveTo(star1.x, star1.y);
                this.ctx.lineTo(star2.x, star2.y);

                // Gradient stroke
                const gradient = this.ctx.createLinearGradient(star1.x, star1.y, star2.x, star2.y);
                gradient.addColorStop(0, this.hexToRgba(star1.color, 0.8));
                gradient.addColorStop(0.5, this.hexToRgba(conn.color, 0.6));
                gradient.addColorStop(1, this.hexToRgba(star2.color, 0.8));

                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                // Glow effect
                this.ctx.shadowColor = conn.color;
                this.ctx.shadowBlur = 10;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
        });
    }

    drawTempConnection() {
        // This would need the current mouse position
        // Simplified for now
    }

    drawStars() {
        this.stars.forEach(star => {
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, 20
            );
            gradient.addColorStop(0, this.hexToRgba(star.color, 0.8));
            gradient.addColorStop(0.5, this.hexToRgba(star.color, 0.3));
            gradient.addColorStop(1, 'transparent');

            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Star core
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = star.color;
            this.ctx.fill();

            // Star border
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Title label
            if (star.title) {
                this.ctx.font = '12px Segoe UI, sans-serif';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(star.title, star.x, star.y + 25);
            }
        });
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ConstellationBuilder();
});
