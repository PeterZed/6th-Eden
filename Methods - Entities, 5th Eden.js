var entityMethods = {
    /*
    Sets id. Replaces a final number zeroes of primogenitor's ID string equal to the number of digits
    that are to make up the final digits of the new ID.
    */
    idAssignment: function(entity) {
        var idMod = String(eden.entities.lostSouls + eden.entities.essenceCount);
        entity.id = entity.id.slice(0, entity.id.length - idMod.length) + idMod;
    },
    
    /*
    Assigns random 16-character name to entity. Special characters and symbols have a 0.125
    probability of being assigned at each position in the name.
    */
    generateName: function(entity) {
        var normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var special = "ÇüéâäàåãçêëèïîìæÆôöòõûùüÿý¢£¥ƒáíóúñÑaßpSsµtFTOd8fe€ŠŒšŽœžŸÀÁÂÃÄÅÈÉÊËÌÍÎÏ" +
                       "ÐÒÓÔÕÖÙÚÛÜÝÞþðØø" + "`~!@#$%^&*()_+-=[]\\{}|;':\",./<>?";
        var insertSpecial;
        var randomNormal;
        var randomSpecial;
        var nameGen = "";
        
        for (var i = 0; i < 16; i++) {
            insertSpecial = Math.random();
            if (insertSpecial <= 0.125) {
                randomSpecial = Math.floor(Math.random() * special.length);
                nameGen += special[randomSpecial];
            } else {
                randomNormal = Math.floor(Math.random() * normal.length);
                nameGen += normal[randomNormal];
            }
        }
        entity.name = nameGen;
    },
    
    /*
    Takes player input to assign a name to the entity.
    */
    setName: function(entity, newName) {
        entity.name = String(newName);
    },
    
    /*
    Sets each attribute's properties.
    level max initial = 100.00
    flux max initial = 10.00
    surge max initial = 1.00
    jerk max initial = 0.10
    hyperjerk max and initial = 0.01
    */
    attributesInitialization: function(entity) {
        var attrs = entity.attributes;
        
        for (var i = 0; i < attrs.length; i++) {
            attrs[i].level = Math.floor(Math.random() * 10001) / 100;
            attrs[i].flux = Math.floor(Math.random() * 1001) / 100;
        }
    },
    
    /*
    Sets each trait's properties.
    level max initial = 100.00
    flux max initial = 10.00
    surge max initial = 1.00
    jerk max initial = 0.10
    hyperjerk max and initial = 0.01
    */
    traitsInitialization: function(entity) {
        var traits = entity.traits;
        
        for (var trait in traits) {
            traits[trait].level = Math.floor(Math.random() * 10001) / 100;
            traits[trait].flux = Math.floor(Math.random() * 1001) / 100;
        }
    },
    
    /*
    Iterates through a multidimensional array.
    For odds calculations, it's the entity's localCells array (i.e., its own and the eight
    adjacent cells) it iterates through and performs the instructed odds calculation on.
    */
    multiIteration: function(entity, func, iLimit, jLimit) {
        for (var j = 0; j < jLimit; j++) {
            for (var i = 0; i < iLimit; i++) {
                func(entity, i, j);
            }
        }
    },
    
    survivalOddsCalculation: function(entity) {
        entityMethods.multiIteration(entity, entityMethods.survivalOddsFormula, 3, 3);
    },
    
    battleOddsCalculation: function(entity) {
        entityMethods.multiIteration(entity, entityMethods.battleOddsFormula, 3, 3);
    },
    
    overallOddsCalculation: function(entity) {
        entityMethods.multiIteration(entity, entityMethods.overallOddsFormula, 3, 3);
    },
    
    /*
    Maximum difference between each paired attribute and condition is 100.
    Right now the survival odds calculation is simple. I hope to improve on it so in the future
    it's based on more than just the sum of the differences between the conditions' levels and the
    corresponding attributes'. Need to consider how to do it.
    */
    survivalOddsFormula: function(entity, localX, localY) {
        var attrs = entity.attributes;
        var conds = entity.localCells[localY][localX].conditions;
        var sumDiffs = 0;
        var survivalOdds;
        
        for (var i = 0; i < attrs.length; i++) {
            sumDiffs += Math.abs(attrs[i].level - conds[i].level);
        }
        survivalOdds = 1 - sumDiffs / ( 100 * attrs.length);
        entity.survivalOdds[localY][localX] = survivalOdds;
    },
    
    /*
    First checks to see if the cell is uninhabited. If true, it sets this entity's battle odds
    to 1 for that cell.
    
    The local variable "battleStrengthTotal" is the sum of all entities' survival odds that inhabit
    that cell and each's number of victories. That is, it represents the overall battle strength in
    that, of which the entity may or may not be a subset (if it inhabits the cell presently).
    battleStrength is initially excluded when iterating through the "entities" to calculate the
    battleStrengthTotal value to ensure it gets added as a potential inhabitant for other cells,
    but not added twice for the cell it presently inhabits. Because any entity involved in this
    calculation that is not the present entity actually inhabits the target cell, for referencing
    its own survival odds combatant.survivalOdds[1][1] is used to denote the current cell.
    
    Factoring in an entity's victories heavily weights the calculation of battle odds toward
    battle experience. This is to the point that the other factor - whether that's survival odds
    or the entity's health - becomes increasingly irrelevant. So once an entity wins a few battles,
    it could very quickly become statistically unbeatable. Say, after 10 victories. Let's see what
    happens first before trying to tweak it.
    
    battleOdds[localX] represents the target cell in the local 2D array holding the entity's
    battle odds.
    */
    battleOddsFormula: function(entity, localX, localY) {
        var targetCell = entity.localCells[localY][localX];
        var opponents = cellMethods.getCombatants(targetCell);
        var battleStrengthTotal = 0;
        var battleStrength = entity.survivalOdds[localY][localX] + entity.victories;
        var battleOdds = entity.battleOdds[localY];
        
        if (cellMethods.noCompetition(targetCell)) {
            battleOdds[localX] = 1;
            return;
        }
        for (var i = 0; i < opponents.length; i++) {
            if (opponents[i] !== entity) {
                battleStrengthTotal += opponents[i].survivalOdds[1][1] + opponents[i].victories;
            }
            battleStrengthTotal += battleStrength;
        }
        battleOdds[localX] = battleStrength / battleStrengthTotal;
    },
    
    /*
    The probability of the entity both surviving and winning the battle for this turn.
    Overall odds are kept in an array separate from the arrays for survivalOdds and battleOdds
    because I want to preserve them: the player will have access to the overall probability of
    survival for a cell as well as the two probabilities that go into calculating it.
    */
    overallOddsFormula: function(entity, localX, localY) {
        var overallOdds = entity.survivalOdds[localY][localX] * entity.battleOdds[localY][localX];
        entity.overallOdds[localY][localX] = overallOdds;
    },

    /*
    Evaluates the nine local cells' odds. If a cell's odds are better than the current best
    odds, sets the entity.bestMovementChoices to empty. Then, assigns to bestMovementChoices
    the favored cell, the reference of which is found from the localCells array.
    */
    evaluateMovementChoices: function(entity, localX, localY) {
        var bestOdds = entity.bestMovementChoices[0].bestOdds;
        var choice = entity.localCells[localY][localX];
        var choiceOdds = entity.overallOdds[localY][localX];
        
        if (choiceOdds > bestOdds) {
            entity.bestMovementChoices = [{bestOdds: choiceOdds}];
            entity.bestMovementChoices.push(choice);
        } else if (choiceOdds === bestOdds) {
            entity.bestMovementChoices.push(choice);
        }
    },
    
    /*
    First, calculates the bestMovementChoices. Then, selects a choice at random from it.
    It's exceedingly rare that two cells will have the exact same odds, so most likely
    bestMovementChoices will only ever have one element.
    
    In calculating the choice, bestChoices.length - 1 is used to account for the 0th index, which
    holds the current bestOdds. Likewise, adding 1 at the end of the choice calculation accounts
    for the bestOdds index.
    
    If the choice is not the homeCell, the entity moves. Deletes the entity's reference from
    the cell.entities of the cell it was on. Then changes entity.x and entity.y, and adds its
    reference to its new home cell's cell.entities.
    
    Movement effectively occurs simultaneously for every entity because the survival odds- from
    which the movement evaluations are derived- are calculated prior to the movement phase.
    */
    move: function(entity) {
        var homeCell = eden.garden[entity.y][entity.x];
        var bestChoices;
        var choice;
        var targetCell;
        
        entityMethods.multiIteration(entity, entityMethods.evaluateMovementChoices, 3, 3);
        bestChoices = entity.bestMovementChoices;
        choice = Math.floor(Math.random() * (bestChoices.length - 1)) + 1;
        targetCell = bestChoices[choice];
        
        targetCell === homeCell ? null : (
            homeCell.entities.delete(entity.id),
            entity.x = targetCell.x,
            entity.y = targetCell.y,
            targetCell.entities.set(entity.id, entity)
        );
    },
    
    /*
    The "struggle" is the probability roll to see if the entity lives or dies, using the
    deathOdds as the probability of it dying. If struggle > deathOdds, the entity beats the odds
    and lives another turn and grows older. Otherwise, it perishes and this.death(entity) is
    invoked.
    */
    survival: function(entity) {
        var struggle = Math.random();
        var deathOdds = 1 - entity.survivalOdds[1][1];
        
        struggle > deathOdds ? entity.age++ : entityMethods.death(entity, "Perished");
    },
    
    /*
    Entity dies. Updates the entity's relevant death info, removes it from the cell it inhabited,
    updates the relevant information in Eden pertaining to entities, and adds this entity's
    reference to the appropriate places in the afterworld's records.
    */
    death: function(entity, cause) {
        var homeCell = eden.garden[entity.y][entity.x];
        
        entity.state = cause;
        entity.turnOfDeath = eden.turn;
        entity.deathLocality = "Cell #" + eden.garden[entity.y][entity.x].id + ", " +
            "Coordinates (" + entity.x + ", " + entity.y + ")";
        
        homeCell.entities.delete(entity.id);
        eden.entities.living.delete(entity.id);
        eden.entities.aliveCount--;
        eden.entities.deathCount++;
            
        entity.locality = afterworld.name;
        afterworld.bookOfLife.get(cause).set(entity.id, entity);
        afterworld.denizens.set(entity.id, entity);
        afterworld.denizensCount++;
    },
    
    /*
    Entity evaluates reproducing this turn. If the deathOdds on this cell lie exceed the
    riskThreshold, reproduction will be deemed too risky.
    
    Each entity's riskThreshold fluctuates a little from its parent's.
    At the moment, given enough time, a balance would be struck between this willingness to risk
    death and the impact on the parent's survivalOdds that exists simply due to whatever is the
    probability of them engaging in battle. Owing to the natural proximity right after birth, the
    parent and child have about 1/9 odds of ending up on the same cell after movement next turn.
    So, if I'm right, the entity's riskThreshold will be fairly high as the impact from the
    chances of battling is relatively low. Its equilibrium point will not tend all the way
    toward 1, however.
    
    Later, reproduction will be much riskier - when I've implemented health as a mechanic,
    reproduction will cost a significant amount of health, thus having a much more tangible impact
    on the parent's survivalOdds, regardless of where it and its child end up. So on cells where
    its odds are already poor, the odds will surpass the riskThreshold and thus the entity
    will not reproduce that turn.
    
    The matter will be further complicated in the future. I hope to implement a mechanic for
    evaluating degree of similarity between the natural attributes of two entities (i.e., the
    value of their attributes at the time of their genesis). Entities will have a
    similarityThreshold beyond which they will avoid combat with an entity.
    
    Another mechanic that will complicate the equilibrium establishment between impact on
    survivalOdds and the level of risk the entity will accept for reproduction is the introduction
    of decision-making to every behavior. As it is, for movement and reproduction, the entity's
    choice is entirely dependent on whichever option has the best odds for the individual's
    survival. With this mechanic, I might later set it up so every choice is made at random, with
    the probabilities of each option weighted based on their relative survivalOdds compared to
    every option's survivalOdds. I don't know, however, if this idea makes too much sense,
    introducing suboptimal decision-making behavior into the entities. I'll go with whichever
    yields the more interesting results. At the moment, I think that might be the suboptimal
    decision-making. The entities will not be wholly predictable. The absence of complete
    predictability is a survival mechanic in the real world, I suppose. I wonder what I could do
    to make it a beneficial trait in this world too - probably the implementation of carnivorism
    as a viable strategy will suffice. I'd like there to be more reasons, but I don't yet know
    what else I could do.
    */
    reproductionDecision: function(entity) {
        var deathOdds = (1 - entity.survivalOdds[1][1]) * 100;
        var riskThreshold = entity.traits.riskThreshold.level;
        
        if (deathOdds <= riskThreshold) {
            entityMethods.reproduce(entity);
        }
    },
    
    /*
    entity.ancestry.slice() passes a shallow copy. But, since .ancestry is an array of just
    primitive data types (the entity ID numbers), this is acceptable. And, faster than
    using deep clone from jQuery.
    */
    reproduce: function(entity) {
        var xCoord = entity.x + Math.floor(Math.random() * 3) - 1;
        var yCoord = entity.y + Math.floor(Math.random() * 3) - 1;
        var birthCell = edenMethods.wraparoundBoundary(xCoord, yCoord);
        var child = edenMethods.spawnEntity(birthCell.x, birthCell.y);
        
        entity.lineage.push(child.id);
        child.ancestry = entity.ancestry.slice();
        child.ancestry.push(entity.id);
        entityMethods.inheritAttributes(child, entity.attributes);
        entityMethods.inheritTraits(child, entity.traits);
    },
    
    /*
    In cellMethods.conditionsFluctuation, I limited the flux, surge, and jerk to
    maxima of 10, 1, and 0.1, respectively. For attributes and traits I have intentionally not done
    so. This is because, with the cells, there are no evolutionary pressures, and thus their values
    will average to 50 over time if their maximum is 100. This presents survival issues for
    the entities, because the higher the flux value is, the more erratic the level is from turn
    to turn, and thus the more difficult it is to adapt to their surroundings.
    */
    
    /*
    The distribution calculations come from Gaussian Distribution, which I downloaded.
        
    parentAttributes.slice wouldn't work over jQuery.extend because .slice is only a shallow copy.
    That is, since attributes is an array of objects .slice copies the references of the
    original objects. It works fine for primitive data types, however, because they are immutable
    and so both can point to the same primitives all they want without affecting each other.
    
    If I'm correct, this should work fine  and garbage collection will clear var dummy after the
    function is complete, thus leaving child.attributes as the only thing holding the reference
    to the dummy attributes array. Then the next time the function is run it'll just create a new
    dummy array reference.
    */
    inheritAttributes: function(child, parentAttributes) {
        var attrs = parentAttributes;
        var dummy = [{attribute: "lightOptimal"}, {{attribute: "radiationTolerance"},
        {attribute: "temperatureOptimal"}, {{attribute: "pressureOptimal"},
        {attribute: "airCompositionOptimal"}, {attribute: "chemicalEnvironmentOptimal"},
        {attribute: "aridityOptimal"}, {attribute: "acidityOptimal"},
        {attribute: "salinityOptimal"}, {attribute: "nutrientsOptimal"},
        {attribute: "wasteTolerance"}];
        var distribution;
        
        for (var i = 0; i < attrs.length; i++) {
            
            distribution = gaussian(attrs[i].level, attrs[i].flux);  
            dummy[i].level = Math.floor(distribution.ppf(Math.random()) * 100) / 100;
            
            distribution = gaussian(attrs[i].flux, attrs[i].surge);
            dummy[i].flux = Math.floor(distribution.ppf(Math.random()) * 100) / 100;
                
            dummy[i].surge = 1;
            
            edenMethods.checkLimits(dummy[i]);
        }
        child.attributes = dummy;
    },
    
    /*
    The distribution calculations come from Gaussian Distribution, which I downloaded.
    */
    inheritTraits: function(child, parentTraits) {
        var traits = parentTraits;
        var dummy = {riskThreshold: {}};
        var distribution;
        
        for (var trait in traits) {
            distribution = gaussian(traits[trait].level, traits[trait].flux);  
            dummy[trait].level = Math.floor(distribution.ppf(Math.random()) * 100) / 100;
            dummy[trait].level >= 0 && dummy[trait].level <= 100 ? null :
                (dummy[trait].level < 0 ? dummy[trait].level = 0 : dummy[trait].level = 100);
            
            distribution = gaussian(traits[trait].flux, traits[trait].surge);
            dummy[trait].flux = Math.floor(distribution.ppf(Math.random()) * 100) / 100;
            dummy[trait].flux >= 0 && dummy[trait].flux <= 100 ? null :
                (dummy[trait].flux < 0 ? dummy[trait].flux = 0 : dummy[trait].flux = 100);
            
            dummy[trait].surge = 1;
            
            edenMethods.checkLimits(dummy[trait]);
        }
        child.traits = dummy;
    }
};