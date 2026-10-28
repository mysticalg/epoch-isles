export const TECHS={
 hunting:{name:'Bows & fletching',age:0,points:60,effect:'Unlock wooden bows for ranged attacks.'},
 masonry:{name:'Masonry & storage',age:0,points:70,effect:'Unlock the granary: population capacity 160.'},
 bronze:{name:'Bronze working',age:0,points:100,nextAge:1,effect:'Enter Bronze Age; unlock bronze spears and iron extraction.'},
 engineering:{name:'Engineering',age:1,points:90,effect:'Upgrade friendly paths to faster roads; unlock the mill and later Iron ballista.'},
 scholarship:{name:'Scholarship',age:1,points:100,effect:'Unlock the laboratory (+50% research speed).'},
 iron:{name:'Iron forging',age:1,points:180,nextAge:2,effect:'Enter Iron Age; unlock iron swords and ballista materials.'}
};
export const BUILDINGS={
 workshop:{name:'Workshop',cost:{wood:30,stone:15},effect:'Enables bows, bronze spears and iron swords; smiths work 20% faster.'},
 mine:{name:'Mine entrance',cost:{wood:20,stone:15},effect:'Enables miners to extract finite copper and iron deposits.'},
 well:{name:'Well',cost:{wood:15,stone:20},effect:'Population grows 35% faster while residents remain idle.'},
 granary:{name:'Granary',tech:'masonry',cost:{wood:35,stone:20},effect:'Raises this city’s population capacity from 120 to 160.'},
 mill:{name:'Timber mill',tech:'engineering',cost:{wood:40,stone:20},effect:'Gatherers collect timber 50% faster; the grove remains finite.'},
 lab:{name:'Laboratory',tech:'scholarship',cost:{wood:25,stone:35,copper:10},effect:'Inventors complete chosen research 50% faster.'}
};
