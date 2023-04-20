const Semantic = {
    articulation: (entity, cardinalite) => {
        switch (cardinalite) {
            case "ERone":
                return normalizeERone(entity);
                break;
            case "ERoneToMany":
                return normalizeERoneToMany(entity);
                break;
        }
    },
    normalizeERone: (entity) => {
        if (entity.cardinality == "ERone") {
        }
    },
    normalizeERoneToMany: (entity) => { }
}
export default Semantic;