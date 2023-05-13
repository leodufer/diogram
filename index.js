var parseString = require('xml2js').parseString;


const fs = require('fs');

if (process.argv.length < 3) {
    console.log('Not file dio usage: -> node npm start ' + process.argv[1] + ' FILENAME');
    process.exit(1);
}

var filename = process.argv[2];


let xml = fs.readFileSync(filename, 'utf8');



var entities = new Map();
var relationship = new Map();
var arrowValues = new Map();

var dataset = {
    entities: [],
    relationship: [],
    targets: [],
    error: [],
    idName: [],
    expresiones: []
}


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
            entities.set(element.$.id, element);
            dataset.entities.push({ 'entity': element, 'id': element.$.id, 'name': element.$.value });
            dataset.idName.push(element.$.value.toUpperCase());
        } else if (element.$.edge) {
            element.type = "relationship"
            relationship.set(element.$.id, element);
            dataset.relationship.push(element);
        }
    });
});

generarExpresion();
verificar(dataset.entities);
verificarRepetidos(dataset.entities)

console.log("\nSe identificaron " + dataset.entities.length + " entidades y " + dataset.relationship.length + " relaciones")
console.log("\nSe generaron " + dataset.expresiones.length + " expresiones de relacionamiento")
console.log("\nSe identificaron " + dataset.error.length + " errores");
console.error("\nOutput: ", dataset.error);


/*funciones*/

function articular(name, value) {

    switch (value) {
        case 'ERone':
            return articularSingular(name);
            break;
        case 'ERmandOne':
            return articularSingularMandatorio(name);
            break;
        case 'ERzeroToOne':
            return articularSingularMandatorio(name); //zero o uno
            break;
        case 'ERmany':
            return articularPlural(name) // remplazar solo varios
            break;
        case 'ERoneToMany':
            return articularPlural(name); // Uno o varios
            break;
        case 'ERzeroToMany':
            return articularPlural(name); // zero o varios
            break;
        default:
            dataset.error.push('Error de relacionamiento: no se encuentra cardinalidad en relacionamiento de la entidad ' + name)
            break;
    }
}

function articularSingularMandatorio(name) {
    var gender = require('rosaenlg-gender-es');
    var genero = gender(name);
    switch (genero) {
        case 'f':
            return 'Una y solo una ' + name;
            break;
        case 'm':
            return 'Un y solo un' + name;
            break;
        default:
            return 'Un y solo un ' + name;
            break;
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
    var gender = require('rosaenlg-gender-es');
    var genero = gender(name);
    var pluralizado = plural(name);
    switch (genero) {
        case 'f':
            return 'Varias ' + pluralizado;
            break;
        case 'm':
            return 'Varios ' + pluralizado;
            break;
        default:
            return 'Varios ' + pluralizado;
            break;
    }
}

function verificar(entities) {
    const isUpperCase = (string) => /^[A-Z]*$/.test(string);
    entities.forEach(element => {
        entityChart = element.name.charAt(0)
        if (!isUpperCase(entityChart)) {
            dataset.error.push('Error de Entidad: Nombre de entidad "' + element.name + '" debe tener mayuscula inicial')
        }
        if (!dataset.targets.includes(element.id)) {
            dataset.error.push('Error de relacionamiento: Entidad "' + element.name + '" no posee relacionamientos vinculados')
        }
    });
}

function verificarRepetidos(entities) {
    idName = dataset.idName;
    entities.forEach(entity => {
        let cont = 0;
        idName.forEach((name, index) => {
            if (entity.name.toUpperCase() === name) {
                cont++;
            }
        });

        if (cont > 1) {
            idName = idName.filter(item => item != entity.name.toUpperCase());
            dataset.error.push('Error de Entidad: Entidad "' + entity.name + '" repetida ' + cont + ' veces')
        }
    })
}


function generarExpresion() {
    for (let index of relationship.keys()) {
        var rel = relationship.get(index);
        let startArrow;
        let endArrow;
        if (rel.$.target) {
            dataset.targets.push(rel.$.target);
        }
        if (rel.$.source) {
            dataset.targets.push(rel.$.source);
        }

        if (rel.$.target && rel.$.source) {
            let styles = rel.$.style.split(';');
            styles.map((value, index) => {
                if (value.includes('startArrow'))
                    startArrow = value.split('=')
                if (value.includes('endArrow'))
                    endArrow = value.split('=')
            });
            // verificar que la relacion empiece con una relacion ONE

            var expresion;
            if (startArrow[1] == 'ERone') {
                expresion = (articular(entities.get(rel.$.source).$.value, startArrow[1]) + " se relaciona con " +
                    articular(entities.get(rel.$.target).$.value, endArrow[1]) + ' y ' +
                    //reverse relation 
                    articular(entities.get(rel.$.target).$.value, 'ERone') + " se relaciona con " +
                    articular(entities.get(rel.$.source).$.value, startArrow[1]));
                console.log(expresion);
                dataset.expresiones.push(expresion);
            } else if (startArrow[1] == 'ERmany' || startArrow[1] == 'ERoneToMany') {
                if ((startArrow[1] == 'ERmany' || startArrow[1] == 'ERoneToMany') && (endArrow[1] == 'ERmany' || endArrow[1] == 'ERoneToMany')) {
                    dataset.error.push("Error de cardinalidad: Relacionamiento de varios a varios no admisible en relacionamiento entre entidad: '" + entities.get(rel.$.source).$.value + "' con la entidad '" + entities.get(rel.$.target).$.value + "'")
                } else {
                    expresion = (articular(entities.get(rel.$.target).$.value, endArrow[1]) + " se relaciona con " +
                        articular(entities.get(rel.$.source).$.value, startArrow[1]) + ' y ' +
                        //reverse relation 
                        articular(entities.get(rel.$.source).$.value, 'ERone') + " se relaciona con " +
                        articular(entities.get(rel.$.target).$.value, endArrow[1]));
                    console.log(expresion);
                    dataset.expresiones.push(expresion);
                }
            } else {
                dataset.error.push('Error de relacionamiento: no se encuenta cardinalidad de relacionamiento entre:"' + entities.get(rel.$.target)?.$.value + '" y "' + entities.get(rel.$.source)?.$.value + '"')
            }
        } else {
            dataset.error.push('Error de relacionamiento: no se encuentra entidades de relacionamiento entre:"' + entities.get(rel.$.target)?.$.value + '" y "' + entities.get(rel.$.source)?.$.value + '"')
        }
    }
}
