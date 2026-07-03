// Galactic Empire - Core Game Engine
class Game {
    constructor() {
        this.paused = false;
        this.gameSpeed = 1;
        this.year = 2200;
        this.month = 1;
        this.ticksPerMonth = 30;
        this.currentTick = 0;
        
        this.empire = {
            name: "Lidská Unie",
            resources: {
                energy: 100,
                minerals: 100,
                research: 0,
                food: 50
            },
            income: {
                energy: 10,
                minerals: 8,
                research: 5,
                food: 15
            },
            population: 10,
            populationGrowth: 0.5,
            technologies: new Set(),
            currentResearch: null,
            researchProgress: 0
        };

        this.galaxy = {
            systems: [],
            width: 100,
            height: 100
        };

        this.ships = [];
        this.fleets = [];
        
        this.selectedSystem = null;
        this.exploredSystems = new Set();
        
        this.technologies = {
            'advanced-mining': {
                name: 'Pokročilá těžba',
                cost: 50,
                effect: () => {
                    this.empire.income.minerals += 5;
                    this.addEvent('Technologie "Pokročilá těžba" dokončena! +5 minerálů/měsíc', 'success');
                }
            },
            'plasma-thrusters': {
                name: 'Plazmové motory',
                cost: 80,
                effect: () => {
                    this.addEvent('Technologie "Plazmové motory" dokončena! Rychlejší lodě', 'success');
                }
            },
            'laser-weapons': {
                name: 'Laserové zbraně',
                cost: 100,
                effect: () => {
                    this.addEvent('Technologie "Laserové zbraně" dokončena! Silnější lodě', 'success');
                }
            }
        };

        this.shipTypes = {
            scout: {
                name: 'Průzkumník',
                cost: { energy: 50, minerals: 30 },
                buildTime: 2,
                combat: 5,
                speed: 3
            },
            corvette: {
                name: 'Korveta',
                cost: { energy: 100, minerals: 80 },
                buildTime: 3,
                combat: 15,
                speed: 2
            },
            colony: {
                name: 'Kolonie',
                cost: { energy: 200, minerals: 150, food: 100 },
                buildTime: 5,
                combat: 1,
                speed: 1,
                canColonize: true
            }
        };

        this.buildQueue = [];
        this.events = [];
    }

    initialize() {
        this.generateGalaxy();
        this.setupHomeSystem();
        this.startGameLoop();
    }

    generateGalaxy() {
        const numSystems = 50;
        const systemTypes = [
            { type: 'yellow-star', name: 'Žlutá hvězda', color: '#ffeb3b', habitability: 0.7 },
            { type: 'red-giant', name: 'Červený obr', color: '#f44336', habitability: 0.3 },
            { type: 'blue-giant', name: 'Modrý obr', color: '#2196f3', habitability: 0.2 },
            { type: 'white-dwarf', name: 'Bílý trpaslík', color: '#ffffff', habitability: 0.1 },
            { type: 'neutron-star', name: 'Neutronová hvězda', color: '#9c27b0', habitability: 0.0 }
        ];

        for (let i = 0; i < numSystems; i++) {
            const systemType = systemTypes[Math.floor(Math.random() * systemTypes.length)];
            const planets = Math.floor(Math.random() * 6) + 1;
            
            const system = {
                id: i,
                name: this.generateSystemName(),
                x: Math.random() * this.galaxy.width,
                y: Math.random() * this.galaxy.height,
                type: systemType.type,
                typeName: systemType.name,
                color: systemType.color,
                planets: planets,
                habitability: systemType.habitability + (Math.random() - 0.5) * 0.2,
                resources: {
                    energy: Math.floor(Math.random() * 10) + 5,
                    minerals: Math.floor(Math.random() * 15) + 5,
                    research: Math.floor(Math.random() * 8) + 2
                },
                owner: null,
                hasColony: false,
                population: 0,
                explored: false
            };

            this.galaxy.systems.push(system);
        }
    }

    generateSystemName() {
        const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
        const suffixes = ['Centauri', 'Draconis', 'Aquilae', 'Lyrae', 'Orionis', 'Cygni', 'Persei', 'Cassiopeiae'];
        return prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + 
               suffixes[Math.floor(Math.random() * suffixes.length)];
    }

    setupHomeSystem() {
        const homeSystem = this.galaxy.systems[0];
        homeSystem.name = 'Sol';
        homeSystem.type = 'yellow-star';
        homeSystem.typeName = 'Žlutá hvězda';
        homeSystem.color = '#ffeb3b';
        homeSystem.x = this.galaxy.width / 2;
        homeSystem.y = this.galaxy.height / 2;
        homeSystem.owner = 'player';
        homeSystem.hasColony = true;
        homeSystem.population = 10;
        homeSystem.explored = true;
        homeSystem.habitability = 1.0;
        
        this.exploredSystems.add(homeSystem.id);
        this.selectedSystem = homeSystem;

        // Start with a scout ship
        this.createShip('scout', homeSystem);
    }

    createShip(type, system) {
        const shipData = this.shipTypes[type];
        const ship = {
            id: this.ships.length,
            type: type,
            name: shipData.name,
            system: system.id,
            x: system.x,
            y: system.y,
            combat: shipData.combat,
            speed: shipData.speed,
            canColonize: shipData.canColonize || false,
            moving: false,
            targetSystem: null
        };
        this.ships.push(ship);
        return ship;
    }

    startBuildingShip(type) {
        const shipData = this.shipTypes[type];
        const cost = shipData.cost;

        // Check if we have enough resources
        let canBuild = true;
        for (let resource in cost) {
            if (this.empire.resources[resource] < cost[resource]) {
                canBuild = false;
                this.addEvent(`Nedostatek zdrojů pro stavbu ${shipData.name}`, 'warning');
                break;
            }
        }

        if (canBuild) {
            // Deduct resources
            for (let resource in cost) {
                this.empire.resources[resource] -= cost[resource];
            }

            this.buildQueue.push({
                type: type,
                remainingMonths: shipData.buildTime
            });

            this.addEvent(`Započata stavba ${shipData.name}`, 'success');
        }
    }

    processBuildQueue() {
        for (let i = this.buildQueue.length - 1; i >= 0; i--) {
            const item = this.buildQueue[i];
            item.remainingMonths--;

            if (item.remainingMonths <= 0) {
                const homeSystem = this.galaxy.systems.find(s => s.hasColony && s.owner === 'player');
                if (homeSystem) {
                    this.createShip(item.type, homeSystem);
                    this.addEvent(`${this.shipTypes[item.type].name} dokončena!`, 'success');
                }
                this.buildQueue.splice(i, 1);
            }
        }
    }

    startResearch(techId) {
        if (this.empire.currentResearch) {
            this.addEvent('Již probíhá výzkum jiné technologie', 'warning');
            return;
        }

        if (this.empire.technologies.has(techId)) {
            this.addEvent('Tato technologie již byla prozkoumána', 'warning');
            return;
        }

        const tech = this.technologies[techId];
        if (tech) {
            this.empire.currentResearch = techId;
            this.empire.researchProgress = 0;
            this.addEvent(`Započat výzkum: ${tech.name}`, 'success');
        }
    }

    processResearch() {
        if (!this.empire.currentResearch) return;

        const tech = this.technologies[this.empire.currentResearch];
        this.empire.researchProgress += this.empire.income.research;

        if (this.empire.researchProgress >= tech.cost) {
            this.empire.technologies.add(this.empire.currentResearch);
            tech.effect();
            this.empire.currentResearch = null;
            this.empire.researchProgress = 0;
        }
    }

    moveShipToSystem(ship, targetSystem) {
        if (ship.moving) return;

        ship.moving = true;
        ship.targetSystem = targetSystem.id;
        
        const distance = Math.sqrt(
            Math.pow(targetSystem.x - ship.x, 2) + 
            Math.pow(targetSystem.y - ship.y, 2)
        );
        
        ship.travelTime = Math.ceil(distance / ship.speed);
        ship.travelProgress = 0;
        
        this.addEvent(`${ship.name} míří do systému ${targetSystem.name}`);
    }

    processShipMovement() {
        for (let ship of this.ships) {
            if (ship.moving && ship.targetSystem !== null) {
                ship.travelProgress++;
                
                const target = this.galaxy.systems[ship.targetSystem];
                const progress = ship.travelProgress / ship.travelTime;
                
                const startX = this.galaxy.systems[ship.system].x;
                const startY = this.galaxy.systems[ship.system].y;
                
                ship.x = startX + (target.x - startX) * progress;
                ship.y = startY + (target.y - startY) * progress;
                
                if (ship.travelProgress >= ship.travelTime) {
                    ship.moving = false;
                    ship.system = ship.targetSystem;
                    ship.x = target.x;
                    ship.y = target.y;
                    ship.targetSystem = null;
                    ship.travelProgress = 0;
                    
                    if (!target.explored) {
                        target.explored = true;
                        this.exploredSystems.add(target.id);
                        this.addEvent(`Systém ${target.name} prozkoumán!`, 'success');
                    }
                    
                    this.addEvent(`${ship.name} dorazila do systému ${target.name}`);
                }
            }
        }
    }

    colonizeSystem(system) {
        // Find a colony ship in the system
        const colonyShip = this.ships.find(s => 
            s.system === system.id && 
            s.canColonize && 
            !s.moving
        );

        if (!colonyShip) {
            this.addEvent('V systému není žádná kolonizační loď', 'warning');
            return;
        }

        if (system.habitability < 0.3) {
            this.addEvent('Tento systém není dostatečně obyvatelný', 'warning');
            return;
        }

        system.owner = 'player';
        system.hasColony = true;
        system.population = 3;
        
        this.empire.income.energy += system.resources.energy;
        this.empire.income.minerals += system.resources.minerals;
        this.empire.income.research += system.resources.research;
        
        // Remove colony ship
        const shipIndex = this.ships.indexOf(colonyShip);
        if (shipIndex > -1) {
            this.ships.splice(shipIndex, 1);
        }
        
        this.addEvent(`Systém ${system.name} kolonizován!`, 'success');
    }

    tick() {
        if (this.paused) return;

        this.currentTick++;

        if (this.currentTick >= this.ticksPerMonth / this.gameSpeed) {
            this.currentTick = 0;
            this.processMonth();
        }

        this.processShipMovement();
    }

    processMonth() {
        this.month++;
        if (this.month > 12) {
            this.month = 1;
            this.year++;
        }

        // Add resource income
        for (let resource in this.empire.income) {
            this.empire.resources[resource] += this.empire.income[resource];
        }

        // Population growth
        let totalPopulation = 0;
        let totalGrowth = 0;
        
        for (let system of this.galaxy.systems) {
            if (system.hasColony && system.owner === 'player') {
                totalPopulation += system.population;
                const growth = system.population * 0.05 * system.habitability;
                system.population += growth;
                totalGrowth += growth;
            }
        }

        this.empire.population = totalPopulation;
        this.empire.populationGrowth = totalGrowth;

        // Food consumption
        const foodConsumption = Math.floor(this.empire.population * 1.5);
        this.empire.resources.food -= foodConsumption;
        this.empire.income.food = 15 - foodConsumption;

        // Process research
        this.processResearch();

        // Process build queue
        this.processBuildQueue();
    }

    addEvent(message, type = 'info') {
        this.events.unshift({
            message: message,
            type: type,
            time: `${this.year}.${this.month}`
        });

        if (this.events.length > 20) {
            this.events.pop();
        }
    }

    togglePause() {
        this.paused = !this.paused;
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
    }

    startGameLoop() {
        setInterval(() => {
            this.tick();
        }, 1000 / 30); // 30 FPS
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    game = new Game();
    game.initialize();
    console.log('Game initialized with', game.galaxy.systems.length, 'systems');
    console.log('Home system:', game.galaxy.systems[0]);
});
