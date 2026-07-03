// Galactic Empire - UI Controller
class UI {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('galaxy-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById('system-tooltip');
        
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetZoom: 1
        };

        this.hoveredSystem = null;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.startRenderLoop();
        this.startUIUpdateLoop();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Center camera on home system
        const homeSystem = this.game.galaxy.systems[0];
        this.camera.x = homeSystem.x;
        this.camera.y = homeSystem.y;
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    setupEventListeners() {
        // Game controls
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.game.togglePause();
            this.updatePauseButton();
        });

        document.getElementById('speed-1x').addEventListener('click', () => this.setSpeed(1));
        document.getElementById('speed-2x').addEventListener('click', () => this.setSpeed(2));
        document.getElementById('speed-4x').addEventListener('click', () => this.setSpeed(4));

        // Canvas interactions
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));

        // Pan with middle mouse button
        let isPanning = false;
        let lastMouseX, lastMouseY;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.button === 2) {
                isPanning = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const dx = e.clientX - lastMouseX;
                const dy = e.clientY - lastMouseY;
                this.camera.x -= dx / this.camera.zoom / 5;
                this.camera.y -= dy / this.camera.zoom / 5;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isPanning = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Research buttons
        document.querySelectorAll('.research-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const techItem = e.target.closest('.tech-item');
                const techId = techItem.dataset.tech;
                this.game.startResearch(techId);
            });
        });

        // Build ship buttons
        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shipType = e.target.closest('.ship-type');
                const shipId = shipType.dataset.ship;
                this.game.startBuildingShip(shipId);
            });
        });
    }

    setSpeed(speed) {
        this.game.setGameSpeed(speed);
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`speed-${speed}x`).classList.add('active');
    }

    updatePauseButton() {
        const btn = document.getElementById('pause-btn');
        btn.textContent = this.game.paused ? '▶️ Pokračovat' : '⏸️ Pauza';
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldPos = this.screenToWorld(mouseX, mouseY);
        const system = this.findSystemAt(worldPos.x, worldPos.y);

        if (system) {
            // Right click on explored system - send ship
            if (e.button === 2 || e.ctrlKey) {
                if (this.game.selectedSystem && system.explored) {
                    const ships = this.game.ships.filter(s => 
                        s.system === this.game.selectedSystem.id && !s.moving
                    );
                    if (ships.length > 0) {
                        this.game.moveShipToSystem(ships[0], system);
                    }
                }
            } else {
                // Left click - select system
                this.game.selectedSystem = system;
                this.updateSystemInfo();
            }
        }
    }

    handleCanvasHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldPos = this.screenToWorld(mouseX, mouseY);
        const system = this.findSystemAt(worldPos.x, worldPos.y);

        if (system) {
            this.hoveredSystem = system;
            this.showTooltip(system, e.clientX, e.clientY);
        } else {
            this.hoveredSystem = null;
            this.hideTooltip();
        }
    }

    handleCanvasWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.camera.targetZoom = Math.max(0.5, Math.min(3, this.camera.targetZoom * delta));
    }

    screenToWorld(screenX, screenY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        return {
            x: this.camera.x + (screenX - centerX) / (this.camera.zoom * 10),
            y: this.camera.y + (screenY - centerY) / (this.camera.zoom * 10)
        };
    }

    worldToScreen(worldX, worldY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        return {
            x: centerX + (worldX - this.camera.x) * this.camera.zoom * 10,
            y: centerY + (worldY - this.camera.y) * this.camera.zoom * 10
        };
    }

    findSystemAt(worldX, worldY) {
        const clickRadius = 2;
        
        for (let system of this.game.galaxy.systems) {
            const dist = Math.sqrt(
                Math.pow(system.x - worldX, 2) + 
                Math.pow(system.y - worldY, 2)
            );
            
            if (dist < clickRadius) {
                return system;
            }
        }
        
        return null;
    }

    showTooltip(system, x, y) {
        const explored = system.explored ? '' : ' (Neprozkoumaný)';
        const owner = system.owner ? ` - ${system.owner === 'player' ? 'Naše území' : 'Cizí území'}` : '';
        
        this.tooltip.innerHTML = `
            <strong>${system.name}</strong>${explored}${owner}<br>
            Typ: ${system.typeName}<br>
            Planet: ${system.planets}
        `;
        
        this.tooltip.style.left = (x + 15) + 'px';
        this.tooltip.style.top = (y + 15) + 'px';
        this.tooltip.classList.add('show');
    }

    hideTooltip() {
        this.tooltip.classList.remove('show');
    }

    updateSystemInfo() {
        const container = document.getElementById('selected-system-info');
        const system = this.game.selectedSystem;

        if (!system) {
            container.innerHTML = '<p class="no-selection">Vyberte hvězdný systém</p>';
            return;
        }

        const explored = system.explored ? '✓ Prozkoumáno' : '✗ Neprozkoumaný';
        const owner = system.owner === 'player' ? '👑 Naše území' : 
                     system.owner ? '⚠️ Cizí území' : '🌍 Neobydleno';

        let html = `
            <div class="system-details">
                <div class="system-name">${system.name}</div>
                <div><strong>Typ:</strong> ${system.typeName}</div>
                <div><strong>Planet:</strong> ${system.planets}</div>
                <div><strong>Obyvatelnost:</strong> ${Math.round(system.habitability * 100)}%</div>
                <div><strong>Stav:</strong> ${explored}</div>
                <div><strong>Vlastník:</strong> ${owner}</div>
        `;

        if (system.explored) {
            html += `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(76, 201, 240, 0.3);">
                    <div><strong>Zdroje:</strong></div>
                    <div>⚡ Energie: +${system.resources.energy}/měsíc</div>
                    <div>🔩 Minerály: +${system.resources.minerals}/měsíc</div>
                    <div>🧪 Výzkum: +${system.resources.research}/měsíc</div>
                </div>
            `;

            if (system.hasColony) {
                html += `
                    <div style="margin-top: 10px;">
                        <div><strong>👥 Populace:</strong> ${Math.round(system.population)}</div>
                    </div>
                `;
            }
        }

        html += '<div class="system-actions">';

        if (system.explored && !system.hasColony && system.owner !== 'player') {
            const hasColonyShip = this.game.ships.some(s => 
                s.system === system.id && s.canColonize && !s.moving
            );
            
            if (hasColonyShip) {
                html += `<button class="btn btn-small" onclick="game.colonizeSystem(game.selectedSystem)">
                    🏗️ Kolonizovat
                </button>`;
            }
        }

        const shipsInSystem = this.game.ships.filter(s => s.system === system.id);
        if (shipsInSystem.length > 0) {
            html += `<div style="margin-top: 10px;"><strong>🚀 Lodě v systému:</strong> ${shipsInSystem.length}</div>`;
        }

        html += '</div></div>';
        container.innerHTML = html;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars background
        this.drawStars();

        // Smooth zoom transition
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;

        // Draw connections between nearby systems
        this.drawConnections();

        // Draw systems
        for (let system of this.game.galaxy.systems) {
            this.drawSystem(system);
        }

        // Draw ships
        for (let ship of this.game.ships) {
            this.drawShip(ship);
        }

        // Highlight selected system
        if (this.game.selectedSystem) {
            this.drawSelectionRing(this.game.selectedSystem);
        }
    }

    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 200; i++) {
            const x = (i * 73) % this.canvas.width;
            const y = (i * 137) % this.canvas.height;
            const size = (i % 3) * 0.5;
            this.ctx.fillRect(x, y, size, size);
        }
    }

    drawConnections() {
        this.ctx.strokeStyle = 'rgba(76, 201, 240, 0.1)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.game.galaxy.systems.length; i++) {
            const system1 = this.game.galaxy.systems[i];
            const pos1 = this.worldToScreen(system1.x, system1.y);

            for (let j = i + 1; j < this.game.galaxy.systems.length; j++) {
                const system2 = this.game.galaxy.systems[j];
                const distance = Math.sqrt(
                    Math.pow(system1.x - system2.x, 2) + 
                    Math.pow(system1.y - system2.y, 2)
                );

                if (distance < 15) {
                    const pos2 = this.worldToScreen(system2.x, system2.y);
                    this.ctx.beginPath();
                    this.ctx.moveTo(pos1.x, pos1.y);
                    this.ctx.lineTo(pos2.x, pos2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawSystem(system) {
        const pos = this.worldToScreen(system.x, system.y);
        const baseSize = 4 * this.camera.zoom;

        // Don't draw if off screen
        if (pos.x < -50 || pos.x > this.canvas.width + 50 || 
            pos.y < -50 || pos.y > this.canvas.height + 50) {
            return;
        }

        // Draw glow
        if (system.explored || system === this.hoveredSystem) {
            const gradient = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, baseSize * 3);
            gradient.addColorStop(0, system.color + '66');
            gradient.addColorStop(1, system.color + '00');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(pos.x - baseSize * 3, pos.y - baseSize * 3, baseSize * 6, baseSize * 6);
        }

        // Draw star
        this.ctx.fillStyle = system.explored ? system.color : '#666666';
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, baseSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw border for owned systems
        if (system.owner === 'player') {
            this.ctx.strokeStyle = '#4cc9f0';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, baseSize + 2, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Draw colony indicator
        if (system.hasColony) {
            this.ctx.fillStyle = '#4cc9f0';
            this.ctx.font = `${12 * this.camera.zoom}px Arial`;
            this.ctx.fillText('🏛️', pos.x - 6 * this.camera.zoom, pos.y - baseSize - 5);
        }

        // Draw system name for explored systems
        if (system.explored && this.camera.zoom > 0.8) {
            this.ctx.fillStyle = '#e0e0e0';
            this.ctx.font = `${10 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(system.name, pos.x, pos.y + baseSize + 15);
        }
    }

    drawShip(ship) {
        const pos = this.worldToScreen(ship.x, ship.y);
        
        this.ctx.fillStyle = '#4cc9f0';
        this.ctx.font = `${14 * this.camera.zoom}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🚀', pos.x, pos.y);

        // Draw movement trail
        if (ship.moving) {
            const startSystem = this.game.galaxy.systems[ship.system];
            const startPos = this.worldToScreen(startSystem.x, startSystem.y);
            
            this.ctx.strokeStyle = 'rgba(76, 201, 240, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(startPos.x, startPos.y);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    drawSelectionRing(system) {
        const pos = this.worldToScreen(system.x, system.y);
        const baseSize = 4 * this.camera.zoom;
        const time = Date.now() / 1000;
        const pulseSize = baseSize + 8 + Math.sin(time * 3) * 3;

        this.ctx.strokeStyle = '#f72585';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, pulseSize, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    updateUI() {
        // Update resources
        document.getElementById('energy-value').textContent = Math.floor(this.game.empire.resources.energy);
        document.getElementById('energy-income').textContent = `+${this.game.empire.income.energy}/měsíc`;
        
        document.getElementById('minerals-value').textContent = Math.floor(this.game.empire.resources.minerals);
        document.getElementById('minerals-income').textContent = `+${this.game.empire.income.minerals}/měsíc`;
        
        document.getElementById('research-value').textContent = Math.floor(this.game.empire.resources.research);
        document.getElementById('research-income').textContent = `+${this.game.empire.income.research}/měsíc`;
        
        document.getElementById('food-value').textContent = Math.floor(this.game.empire.resources.food);
        document.getElementById('food-income').textContent = `${this.game.empire.income.food >= 0 ? '+' : ''}${Math.floor(this.game.empire.income.food)}/měsíc`;

        // Update date
        document.getElementById('current-year').textContent = `${this.game.year}.${this.game.month}`;

        // Update population
        document.getElementById('total-population').textContent = Math.floor(this.game.empire.population);
        document.getElementById('population-growth').textContent = `+${this.game.empire.populationGrowth.toFixed(1)}`;

        // Update technology display
        document.querySelectorAll('.tech-item').forEach(item => {
            const techId = item.dataset.tech;
            if (this.game.empire.technologies.has(techId)) {
                item.classList.add('researched');
                item.querySelector('.research-btn').textContent = '✓ Hotovo';
                item.querySelector('.research-btn').disabled = true;
            } else if (this.game.empire.currentResearch === techId) {
                item.classList.add('researching');
            } else {
                item.classList.remove('researching');
            }
        });

        // Update research progress
        if (this.game.empire.currentResearch) {
            const tech = this.game.technologies[this.game.empire.currentResearch];
            const progress = (this.game.empire.researchProgress / tech.cost) * 100;
            
            document.getElementById('research-progress').style.display = 'block';
            document.getElementById('research-bar').style.width = progress + '%';
            document.getElementById('research-tech-name').textContent = `${tech.name}: ${Math.floor(progress)}%`;
        } else {
            document.getElementById('research-progress').style.display = 'none';
        }

        // Update fleet info
        document.getElementById('total-ships').textContent = this.game.ships.length;
        document.getElementById('total-fleets').textContent = this.game.fleets.length;

        // Update build queue indicators
        document.querySelectorAll('.ship-type').forEach(item => {
            const shipId = item.dataset.ship;
            const building = this.game.buildQueue.some(b => b.type === shipId);
            if (building) {
                item.classList.add('building');
            } else {
                item.classList.remove('building');
            }
        });

        // Update event log
        const eventLog = document.getElementById('event-log');
        eventLog.innerHTML = '';
        for (let event of this.game.events) {
            const eventDiv = document.createElement('div');
            eventDiv.className = `event-item ${event.type}`;
            eventDiv.textContent = `[${event.time}] ${event.message}`;
            eventLog.appendChild(eventDiv);
        }

        // Update selected system info if needed
        if (this.game.selectedSystem) {
            this.updateSystemInfo();
        }
    }

    startRenderLoop() {
        const render = () => {
            this.render();
            requestAnimationFrame(render);
        };
        render();
    }

    startUIUpdateLoop() {
        setInterval(() => {
            this.updateUI();
        }, 100); // Update UI 10 times per second
    }
}

// Initialize UI when game is ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.game) {
            new UI(window.game);
            console.log('UI initialized');
        }
    }, 100);
});
