var edenMethods = {
    /*
    Starts everything needed for a game - creates the garden, populates it, runs the first turn,
    and then document.write() for every entity and cell.
    */
    initializeEden: function() {
        var start = new Date();
        this.formGarden();
        var end = new Date();
        var time = (end - start) / 1000;
        console.log(time + " seconds to form a 64x64 Garden.");
        // this.populate(1);
        divineMethods.information.detailAll();
        
        start = new Date();
        this.tick(1);
        end = new Date();
        time = (end - start) / 1000;
        console.log(time + " seconds to update 64 cells and do other stuff.");
        divineMethods.information.detailAll();
    },

    /*
    Initializes the dynamism values of this Eden.
    */
    initializeDynamism: function() {
        eden.dynamism.level = Math.floor(Math.random() * 10001) / 100;
        eden.dynamism.flux = Math.floor(Math.random() * 1001) / 100;
    }
    
    /*
    Creates a new Cell instance at each index in the multidimensional array.
    Then, runs the function to determine their neighboring cells.
    */
    formGarden: function() {
        for (var j = 0; j < eden.y; j++) {
            eden.garden[j] = [];
            for (var i = 0; i < eden.x; i++) {
                eden.cellCount++;
                eden.garden[j][i] = new Cell(i, j);
                cellMethods.conditionsInitialization(eden.garden[j][i]);
            }
        }
        this.gardenIteration(cellMethods.localCellsDetermination);
    },
    
    /*
    Iterates through each cell in the garden and runs some function on it.
    */
    gardenIteration: function(func) {
        for (var j = 0; j < eden.y; j++) {
            for (var i = 0; i < eden.x; i++) {
                func(eden.garden[j][i]);
            }
        }
    },

    /*
    Some x and y coordinates are sent in as arguments.
    Corrects the x and y coordinates as necessary if they fall outside the scope of the garden.
    Then returns the reference to the proper cell, essentially making the boundary for the garden
    wraparound at each edge.
    */
    wraparoundBoundary: function(xWrapped, yWrapped) {
        var xCorrect = xWrapped;
        var yCorrect = yWrapped;
        
        xCorrect >= 0 && xCorrect < eden.x ? null :
            (xCorrect < 0 ? xCorrect += eden.x : xCorrect -= eden.x);
        yCorrect >= 0 && yCorrect < eden.y ? null :
            (yCorrect < 0 ? yCorrect += eden.y : yCorrect -= eden.y);
        return eden.garden[yCorrect][xCorrect];
    },
    
    /*
    Spawns a new entity, initializes its id, name. Then, updates the relevant eden.entities
    properties, and adds the entity to the appropriate cell.
    
    Used by every entity production method to create a new entity - whether that's by making a new
    progenitor, divinely creating a new progenitor, or an entity reproducing.
    */
    spawnEntity: function(xCoord, yCoord) {
        var targetCell = eden.garden[yCoord][xCoord];
        var entity = new Entity(xCoord, yCoord);
        
        eden.entities.essenceCount++;
        entityMethods.idAssignment(entity);
        entityMethods.generateName(entity);
        
        targetCell.entities.set(entity.id, entity);
        eden.entities.living.set(entity.id, entity);
        eden.entities.aliveCount++;
        
        return entity;
    },
    
    /*
    Spawns the progenitor for a lineage. Initializes its attributes and traits.
    */
    spawnProgenitor: function(xCoord, yCoord) {
        var progenitor = this.spawnEntity(xCoord, yCoord);
        
        entityMethods.attributesInitialization(progenitor);
        entityMethods.traitsInitialization(progenitor);
    },
    
    /*
    POPULATE distributes "num" number of progenitors randomly across the garden. The new entity is
    spawned in a randomly determined cell.
    */
    populate: function(num) {
        for (var i = 0; i < num; i++) {
            var xCoord = Math.floor(Math.random() * eden.x);
            var yCoord = Math.floor(Math.random() * eden.y);
            
            this.spawnProgenitor(xCoord, yCoord);
        }
    },
    
    /*
    SPONTANEOUS ENTITY EMERGENCE is run each turn. If the chaos value is below the threshold 0.88%,
    an entity spawns in a random cell in the garden, as if entropy came together at random to form
    it, like the 2nd Eden. If an entity emerged this turn, the code is run again - a second might
    spawn in the same turn, or many more, though the odds are decidedly low.
    
    Values need to be tweaked - the expected number spawned over 100 turns is just 1, which might
    be too rare, especially if that value is expected to go down further with population or turn
    number. I'll have to see how easy it is to go through turns - a typical map might quickly reach
    a few thousand turns, who knows. So consider this a placeholder value.
    
    If the probability is high, spontaneous entity emergences will be rare, but frequent enough
    that many might be observed on a play-through. Perhaps the chances will go down as the 
    population increases, as if the presence of real entities disrupts the capacity for one to
    erupt from the æther? Perhaps the chances go down as the turn number increases, as if Eden
    becomes more stable over time? Should not increase as turn increases, because this will disrupt
    older worlds, which might annoy players - plus there's no reasonable analogue for it. And if it
    went up as the population goes up, it would disrupt the equilibrium that forms - that might be
    desirable, but it'd also disrupt the simulation - maybe make it a
    possibility, but I think the first two options are the better picks currently.
    
    With the probability high, it isn't as special of an event, and so I'd rather leave it up to
    the player's own perception to notice its occurrence. I like the idea of that, making it a
    pleasant surprise. If the probability is low, though, it's very easy for a player to miss its
    occurrence, in which case maybe Caritas would call attention to it when it
    happens. On the other hand, it's not too bad either - kind of interesting actually - to have a
    mechanic that is rare to be noticed, makes it more special. Maybe give an
    option to alter the chance of spontaneous emergence.
    */
    spontaneousEntityEmergence: function() {
        var disorderThreshold = 0.0088;
        var chaos = Math.random();
        
        if (chaos <= disorderThreshold) {
            var xCoord = Math.floor(Math.random() * eden.x);
            var yCoord = Math.floor(Math.random() * eden.y);
            
            this.spawnProgenitor(xCoord, yCoord);
            this.spontaneousEntityEmergence();
        }
    },
    
    /*
    For conditions, attributes, traits, and the world's dynamism, checks to see if any of the
    properties are below 0, or above the appropriate maximum: Level = 100, Flux = 10, Surge = 1,
    Jerk = 0.1.
    */
    checkLimits: function(property) {
        property.level >= 0 && property.level <= 100 ? null :
            (property.level < 0 ? property.level = 0 : property.level = 100);
        property.flux >= 0 && property.flux <= 10 ? null :
            (property.flux < 0 ? property.flux = 0 : property.flux = 10);
    },
    
    /*
    By making the calculationPhase separate from the movementPhase, it makes it so each entity's
    evaluations are based on the same state for the whole garden. If it iterated through each
    entity evaluating and then moving, the entities whose turns were executed later would have
    their actions influenced by what the earlier entities did, rather than every entity effectively
    moving simultaneously.
    */
    tick: function(num) {
        for (var i = 0; i < num; i++) {
            this.calculationPhase();
            this.movementPhase();
            this.battlePhase();
            this.survivalPhase();
            eden.turn++;
            this.conditionsFluctuationPhase();
            this.calculationPhase();
            this.reproductionPhase();
            this.spontaneousEntityEmergence();
        }
    },
    
    calculationPhase: function() {
        eden.entities.living.forEach(entityMethods.survivalOddsCalculation);
        eden.entities.living.forEach(entityMethods.battleOddsCalculation);
        eden.entities.living.forEach(entityMethods.overallOddsCalculation);
    },
    
    movementPhase: function() {
        eden.entities.living.forEach(entityMethods.move);
    },
    
    battlePhase: function() {
        edenMethods.gardenIteration(cellMethods.battle);
    },
    
    survivalPhase: function() {
        eden.entities.living.forEach(entityMethods.survival);
    },
    
    reproductionPhase: function() {
        eden.entities.living.forEach(entityMethods.reproductionDecision);
    },
    
    conditionsFluctuationPhase: function() {
        edenMethods.gardenIteration(cellMethods.conditionsFluctuation);
    }
};