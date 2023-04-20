var parseString = require('xml2js').parseString;
const fs = require('fs');


if (process.argv.length < 3) {
    console.log('Not file dio usage: -> node npm start ' + process.argv[1] + ' FILENAME');
    process.exit(1);
}

var filename = process.argv[2];
let xml = fs.readFileSync(filename, 'utf8');
//console.log(xml);

/*let xml = fs.readFileSync("entity.dio", "utf8");*/
var entities = new Map();
var relationship = new Map();
var arrowValues = new Map();


arrowValues.set("ERone", "Un/uno");
arrowValues.set("ERmandOne", "Uno y solamente uno");
arrowValues.set("ERmany", "Varios ");
arrowValues.set("ERoneToMany", "Uno o muchos ");
arrowValues.set("ERzeroToOne", "Cero o Un/Uno");
arrowValues.set("ERzeroToMany", "Cero o Varios");

parseString(xml, function (err, result) {
    if (err) {
        console.log(err, "File format not support")
    }
    var mxCell = result.mxfile.diagram[0].mxGraphModel[0].root[0].mxCell;

    mxCell.map((element) => {
        if (element.$.value) {
            element.type = "Entity"
            entities.set(element.$.id, element)
        } else if (element.$.edge) {
            element.type = "relationship"
            relationship.set(element.$.id, element);
        }
    });
    // console.log(entities, relationship);

    console.log(entities)

});

generarExpresion();


function articular(name, value) {
    if (value == "ERone") {
        return articularSingular(name);
    } else if (value == "ERoneToMany") {
        return "Uno o muchos " + articularPlural(name);
    } else {
        return "Error de cardinalidad. Entidad " + name + " con cardinalidad '" + value + "'";

    }
}

function articularSingular(name) {
    var gender = require('rosaenlg-gender-es');
    var genero = gender(name);
    switch (genero) {
        case 'f':
            return 'Una ' + name;
            break;
        case 'm':
            return 'Un ' + name;
            break;
        default:
            return 'Un ' + name;
            break;
    }
}
function articularPlural(name) {
    var plural = require('pluralize-es');
    return plural(name);
}


function generarExpresion() {
    for (let index of relationship.keys()) {
        var rel = relationship.get(index);
        let startArrow;
        let endArrow;
        if (rel.$.target && rel.$.source) {
            let styles = rel.$.style.split(';');
            styles.map((value, index) => {
                if (value.includes('startArrow'))
                    startArrow = value.split('=')
                if (value.includes('endArrow'))
                    endArrow = value.split('=')
            });

            console.log(articular(entities.get(rel.$.source).$.value, startArrow[1]) + " se relaciona con " + entities.get(rel.$.target).$.value);
        } else {
            console.log("Error de relacionamiento no se encuenta entidades de relacionamiento", rel.$.target, rel.$.source)
        }
    }
}